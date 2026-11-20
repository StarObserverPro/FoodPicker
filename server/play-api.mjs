import { CHAT_SCHEMA, PLAN_SCHEMA, PLAY_LIMITS, validateMessages, validateSchema, validatePlan } from '../play/schema.mjs';
import { CHAT_INSTRUCTIONS, PLANNER_INSTRUCTIONS, plannerInput, compileImagePrompt } from '../play/prompts.mjs';
import { getModelConfig, TEXT_COST_RATES, estimateTextCost, estimateImageCost } from './model-config.mjs';
import { PlayError, readBoundedJSON, generateStructured, generateImage } from './provider.mjs';
import { fingerprint, sealPlan, openPlan } from './plan-token.mjs';
import { budgetSettings, getPlayStore } from './play-store.mjs';

const responseJSON = (value, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const activeRequests = new Map();
const imageCache = new Map();
const encoder = new TextEncoder();
const validId = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{8,100}$/.test(value);
const toMicros = usd => usd === null ? null : Math.ceil(usd * 1000000);

function reserveCost(kind, config, input) {
  if (kind === 'draw') {
    // A conservative reservation, not a model price quote. Actual usage reconciles it.
    return ({ low: 100000, medium: 150000, high: 300000, xhigh: 750000, max: 1500000 })[config.imageQuality];
  }
  const model = kind === 'chat' ? config.chatModel : config.plannerModel;
  const rates = TEXT_COST_RATES[model];
  if (!rates) return 500000; // Unknown new model: keep a conservative reservation until its rates are supplied.
  const instructions = kind === 'chat' ? CHAT_INSTRUCTIONS : PLANNER_INSTRUCTIONS;
  const schema = kind === 'chat' ? CHAT_SCHEMA : PLAN_SCHEMA;
  const bytes = encoder.encode(JSON.stringify({ input, instructions, schema })).length + 2048;
  return Math.ceil(bytes * rates.input * 1.25 + (kind === 'chat' ? 1024 : 4096) * rates.output);
}

function rememberImage(id, result, now) {
  imageCache.set(id, { result, at: now });
  let total = [...imageCache.values()].reduce((sum, item) => sum + item.result.image.dataUrl.length, 0);
  for (const [key, value] of imageCache) {
    if (imageCache.size <= 8 && total <= 24000000 && value.at >= now - 3600000) break;
    total -= value.result.image.dataUrl.length;
    imageCache.delete(key);
  }
}

async function storedResult(record, id, env, now) {
  if (imageCache.has(id)) return imageCache.get(id).result;
  if (record.status === 'complete') {
    if (!record.result?.image) return record.result;
    if (record.result.r2Key && env.FOOD_IMAGES) {
      const object = await env.FOOD_IMAGES.get(record.result.r2Key);
      if (object) {
        const bytes = new Uint8Array(await object.arrayBuffer());
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
        const { r2Key, ...result } = record.result;
        return { ...result, image: { ...result.image, dataUrl: `data:image/jpeg;base64,${btoa(binary)}` } };
      }
    }
    throw new PlayError('image_no_longer_cached', '这张图已经画过，但现在取不到图片了。这次不会自动重画，可以重新画一张。', 410);
  }
  if (record.status === 'pending') {
    if (now - record.now > (record.kind === 'draw' ? 240000 : 90000)) throw new PlayError('outcome_unknown', '还没能确认这次有没有完成。不会自动重试，可以重新开始。', 410);
    throw new PlayError('in_progress', '还在处理中，稍后可以查看结果。', 409);
  }
  if (record.status === 'uncertain') throw new PlayError('outcome_unknown', '还没能确认这次有没有完成。不会自动重试，可以重新开始。', 410);
  throw new PlayError('previous_attempt_failed', '上次没有完成，可以再试一次。', 410);
}

async function saveImage(result, id, env, now) {
  rememberImage(id, result, now);
  const { dataUrl, ...metadata } = result.image;
  let r2Key = null;
  if (env.FOOD_IMAGES) {
    r2Key = `food-play/${id.replaceAll(':', '-')}.jpeg`;
    const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    try { await env.FOOD_IMAGES.put(r2Key, bytes, { httpMetadata: { contentType: 'image/jpeg' } }); }
    catch { r2Key = null; } // The finished image is still returned; never re-generate because storage failed.
  }
  return { ...result, image: metadata, r2Key };
}

function checkBody(body, kind) {
  const fields = {
    chat: ['messages', 'requestId'],
    compose: ['messages', 'seed', 'requestId', 'previousPlanToken', 'variation'],
    draw: ['planToken', 'requestId'],
  }[kind];
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !fields.includes(key)) || !validId(body.requestId)) throw new PlayError('invalid_request', '这次请求有误，请重新试一次。');
  if (kind === 'compose' && (!validId(body.seed) || (body.variation !== undefined && body.variation !== 'new-mismatch') || Boolean(body.previousPlanToken) !== Boolean(body.variation))) throw new PlayError('invalid_variation', '这份构思无法继续，请重新画一张。');
}

export async function handlePlayRequest(request, env = {}, fetcher = fetch, options = {}) {
  try {
    const kind = new URL(request.url).pathname.split('/').pop();
    if (!['chat', 'compose', 'draw'].includes(kind)) return responseJSON({ error: { code: 'not_found', message: '没找到这一页。' } }, 404);
    if (request.method !== 'POST') return responseJSON({ error: { code: 'method', message: '请从聊天页面发送消息。' } }, 405);
    if ((request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new PlayError('origin', '请回到聊天页面再试一次。', 403);
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') || '')) throw new PlayError('content_type', '消息格式有误，请回到聊天页面再试一次。', 415);
    const body = await readBoundedJSON(request, PLAY_LIMITS.bodyBytes);
    checkBody(body, kind);
    if (!env.OPENAI_API_KEY) throw new PlayError('not_configured', '聊天和画图暂时用不了，可以先随机选一道菜。', 503);
    const config = getModelConfig(env);
    const now = options.now ?? Date.now();
    let conversation = null;
    let previous = null;
    let rendered = null;
    if (kind === 'draw') rendered = await openPlan(body.planToken, env, now);
    else {
      try { conversation = validateMessages(body.messages, { requireLastUser: kind === 'chat' }); }
      catch { throw new PlayError('invalid_conversation', '这段对话无法继续。每条消息最多600字，一轮最多发送六条。'); }
      if (body.previousPlanToken) {
        previous = await openPlan(body.previousPlanToken, env, now);
        if (previous.conversationHash !== await fingerprint(JSON.stringify(conversation.messages))) throw new PlayError('variation_context_changed', '聊天内容变了，请根据新的内容重新画一张。', 410);
      }
    }
    const actor = await fingerprint(`${env.FOOD_SIGNING_SECRET || env.OPENAI_API_KEY}:${new Date(now).toISOString().slice(0, 10)}:${request.headers.get('cf-connecting-ip') || 'local-preview'}`);
    const id = kind === 'draw' ? `draw:${rendered.id}` : `${kind}:${actor}:${body.requestId}`;
    const input = kind === 'compose' ? plannerInput(conversation.messages, body.seed, previous) : conversation?.messages;
    const digest = await fingerprint(kind === 'draw' ? body.planToken : JSON.stringify(body));
    const store = options.store || getPlayStore(env);
    const reservation = await store.reserve({ id, fingerprint: digest, kind, actor, now, reserveMicros: reserveCost(kind, config, input), ...budgetSettings(env) });
    if (!reservation.fresh) {
      const running = activeRequests.get(id);
      return responseJSON(running ? await running : await storedResult(reservation.record, id, env, now));
    }
    const work = (async () => {
      let usage = null;
      let actualMicros = null;
      try {
        let result;
        let persisted;
        if (kind === 'chat') {
          const generated = await generateStructured({ model: config.chatModel, reasoning: config.reasoning, instructions: CHAT_INSTRUCTIONS, input: { conversation: input }, schema: CHAT_SCHEMA, name: 'food_chat', maxOutputTokens: 1024 }, env, fetcher);
          usage = generated.usage;
          actualMicros = toMicros(estimateTextCost(usage, config.chatModel));
          validateSchema(generated.value, CHAT_SCHEMA);
          result = { reply: generated.value.reply, ready: true, remainingTurns: PLAY_LIMITS.userTurns - conversation.userTurns };
        } else if (kind === 'compose') {
          const generated = await generateStructured({ model: config.plannerModel, reasoning: config.reasoning, instructions: PLANNER_INSTRUCTIONS, input, schema: PLAN_SCHEMA, name: 'food_scene', maxOutputTokens: 4096 }, env, fetcher);
          usage = generated.usage;
          actualMicros = toMicros(estimateTextCost(usage, config.plannerModel));
          const plan = validatePlan(generated.value, conversation.messages, previous?.food);
          if (!input.directions.styles.some(item => item.id === plan.style.id) || !input.directions.mismatches.some(item => item.id === plan.mismatch.id) || !input.directions.atmospheres.some(item => item.id === plan.atmosphere.id) || (previous && plan.mismatch.id === previous.mismatchId)) throw new Error('selection outside candidate directions');
          const prompt = compileImagePrompt(plan);
          const planToken = await sealPlan(plan, prompt, env, now, await fingerprint(JSON.stringify(conversation.messages)));
          result = { planToken, food: { name: plan.food.name, nativeName: plan.food.nativeName }, narration: plan.narration, caption: plan.caption, sceneDescription: plan.sceneDescription };
        } else {
          const generated = await generateImage(rendered.prompt, config, env, fetcher);
          usage = generated.usage;
          actualMicros = toMicros(estimateImageCost(usage, config.imageModel));
          result = { image: generated.image, food: { name: rendered.food.name, nativeName: rendered.food.nativeName }, caption: rendered.caption, sceneDescription: rendered.sceneDescription };
          persisted = await saveImage(result, id, env, now);
        }
        // A bookkeeping acknowledgement can fail after the update committed. Return
        // the already-paid result and retain the reservation; never overwrite it as failed.
        try { await store.finish(id, { status: 'complete', result: persisted || result, actualMicros, usage }); } catch { /* Retry retrieves the image from cache/R2 or reports unknown; never regenerates. */ }
        return result;
      } catch (error) {
        const known = error instanceof PlayError ? error : new PlayError('invalid_model_output', '这次没有拿到可用结果，可以再试一次。', 502);
        usage ||= known.usage;
        if (actualMicros === null && usage) actualMicros = toMicros(kind === 'draw' ? estimateImageCost(usage, config.imageModel) : estimateTextCost(usage, kind === 'chat' ? config.chatModel : config.plannerModel));
        // Missing usage keeps the conservative reservation, including ambiguous timeout cases.
        try { await store.finish(id, { status: known.uncertain ? 'uncertain' : 'failed', actualMicros, usage, errorCode: known.code }); } catch { /* Leave pending; fail closed rather than charge again. */ }
        throw known;
      }
    })();
    activeRequests.set(id, work);
    try { return responseJSON(await work); }
    finally { activeRequests.delete(id); }
  } catch (error) {
    const known = error instanceof PlayError ? error : new PlayError('temporarily_unavailable', '聊天和画图暂时用不了，可以稍后再试。', 503);
    return responseJSON({ error: { code: known.code, message: known.message } }, known.status);
  }
}
