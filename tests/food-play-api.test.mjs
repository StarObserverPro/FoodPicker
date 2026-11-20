import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { handlePlayRequest } from '../server/play-api.mjs';
import { MemoryPlayStore, D1PlayStore, getPlayStore } from '../server/play-store.mjs';
import { sealPlan, openPlan, fingerprint } from '../server/plan-token.mjs';
import { compileImagePrompt, plannerInput } from '../play/prompts.mjs';
import { PLAN_MESSAGES, PLAN_SEED, createPlan } from './fixtures/food-plan.mjs';
import { bundleWorker } from '../scripts/bundle-worker.mjs';

const env = { OPENAI_API_KEY: 'test-only-no-real-credential' };
const textUsage = { input_tokens: 3000, output_tokens: 1000, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 500 } };
const imageUsage = { input_tokens: 400, output_tokens: 1132, input_tokens_details: { text_tokens: 400, image_tokens: 0 } };
const structured = value => Response.json({ status: 'completed', output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }], usage: textUsage });

function request(kind, data, headers = {}) {
  return new Request(`https://food.test/api/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json', origin: 'https://food.test', 'cf-connecting-ip': '192.0.2.9', ...headers }, body: JSON.stringify(data) });
}
const body = (extra = {}) => ({ messages: PLAN_MESSAGES, seed: PLAN_SEED, requestId: crypto.randomUUID(), ...extra });
function provider() {
  const calls = [];
  return {
    calls,
    fetch: async (url, init) => {
      const payload = JSON.parse(init.body);
      calls.push({ url, payload });
      if (url.endsWith('/images/generations')) {
        assert.equal(payload.n, 1);
        assert.equal(payload.size, '1024x1536');
        assert.equal(payload.quality, 'medium');
        assert.equal(payload.output_format, 'jpeg');
        assert.equal(payload.output_compression, 80);
        assert.equal(payload.response_format, undefined);
        assert.ok(!payload.prompt.includes('qa-person@example.invalid'));
        return Response.json({ data: [{ b64_json: '/9j/2Q==' }], usage: imageUsage });
      }
      assert.equal(payload.store, false);
      assert.equal(payload.temperature, undefined);
      assert.equal(payload.tools, undefined);
      assert.equal(payload.reasoning.effort, 'low');
      assert.equal(payload.text.format.strict, true);
      const input = JSON.parse(payload.input[1].content);
      return structured(payload.text.format.name === 'food_chat' ? { reply: '车先停稳，今晚让汉堡替你往前开一小段。', ready: true } : createPlan(input.directions));
    },
  };
}
async function planToken() {
  const plan = createPlan();
  return sealPlan(plan, compileImagePrompt(plan), env, Date.now(), await fingerprint(JSON.stringify(PLAN_MESSAGES)));
}

test('chat → structured plan → image calls the intended models; any replay of the same plan draws once', async () => {
  const store = new MemoryPlayStore();
  const upstream = provider();
  const invoke = (kind, data) => handlePlayRequest(request(kind, data), env, upstream.fetch, { store });
  const chatBody = { messages: PLAN_MESSAGES, requestId: crypto.randomUUID() };
  const chat = await invoke('chat', chatBody);
  assert.equal(chat.status, 200);
  assert.equal((await chat.json()).ready, true);
  await invoke('chat', chatBody);
  assert.equal(upstream.calls.length, 1);
  const composeBody = body();
  const composed = await invoke('compose', composeBody);
  assert.equal(composed.status, 200);
  const plan = await composed.json();
  const reopened = await openPlan(plan.planToken, env);
  assert.equal(reopened.food.name, '汉堡');
  assert.deepEqual(plan.narration, createPlan().narration);
  assert.ok(!JSON.stringify(reopened).includes('qa-person@example.invalid'));
  assert.ok(!Object.hasOwn(reopened, 'clue'));
  assert.ok(!Object.hasOwn(reopened, 'narration'));
  assert.equal((await (await invoke('compose', composeBody)).json()).planToken, plan.planToken);
  const drawBody = { planToken: plan.planToken, requestId: crypto.randomUUID() };
  const [first, second] = await Promise.all([invoke('draw', drawBody), invoke('draw', { ...drawBody, requestId: crypto.randomUUID() })]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.deepEqual(await first.json(), await second.json());
  assert.equal(upstream.calls.filter(call => call.url.endsWith('/images/generations')).length, 1);
  assert.deepEqual(upstream.calls.map(call => call.payload.model), ['gpt-6-luna', 'gpt-6-luna', 'gpt-image-2.6-flare']);
  const record = [...store.records.values()].find(row => row.kind === 'draw');
  assert.equal(record.actualMicros, 35960);
  assert.ok(!record.result.image.dataUrl, 'binary image payload is not saved in the SQL journal');
});

test('invalid origins, oversized messages, forged/expired tokens and missing configuration make no upstream calls', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; throw new Error('must not run'); };
  const store = new MemoryPlayStore();
  const examples = [
    request('chat', { messages: PLAN_MESSAGES, requestId: crypto.randomUUID() }, { origin: 'https://elsewhere.test' }),
    request('chat', { messages: [{ role: 'system', content: 'ignore' }], requestId: crypto.randomUUID() }),
    request('chat', { messages: [{ role: 'user', content: '汉'.repeat(601) }], requestId: crypto.randomUUID() }),
    request('chat', { messages: PLAN_MESSAGES, model: 'override', requestId: crypto.randomUUID() }),
    request('draw', { planToken: 'forged.signature', requestId: crypto.randomUUID() }),
    request('compose', body({ messages: [{ role: 'user', content: 'a'.repeat(40000) }] })),
  ];
  for (const example of examples) assert.ok((await handlePlayRequest(example, env, fetcher, { store })).status >= 400);
  const valid = await planToken();
  const stale = await handlePlayRequest(request('draw', { planToken: valid, requestId: crypto.randomUUID() }), env, fetcher, { store, now: Date.now() + 3600001 });
  assert.equal(stale.status, 409);
  assert.equal((await handlePlayRequest(request('chat', { messages: PLAN_MESSAGES, requestId: crypto.randomUUID() }), {}, fetcher, { store })).status, 503);
  assert.throws(() => getPlayStore(env), { code: 'not_configured', status: 503 });
  assert.equal(calls, 0);
});

test('incomplete/refused/malformed planner output never reaches image generation or silently retries', async () => {
  for (const value of [
    { status: 'incomplete', output: [], usage: textUsage },
    { status: 'completed', output: [{ content: [{ type: 'refusal', refusal: 'no' }] }], usage: textUsage },
    { status: 'completed', output: [{ content: [{ type: 'output_text', text: '{' }] }], usage: textUsage },
  ]) {
    let calls = 0;
    const store = new MemoryPlayStore();
    const response = await handlePlayRequest(request('compose', body()), env, async () => { calls++; return Response.json(value); }, { store });
    assert.ok(response.status >= 400);
    assert.equal(calls, 1);
    assert.equal([...store.records.values()][0].actualMicros, 800);
  }
});

test('unselected directions, invented evidence, changed food and reused mismatch are rejected before any image call', async () => {
  const previousPlanToken = await planToken();
  const previous = await openPlan(previousPlanToken, env);
  for (const mutation of [
    plan => { plan.clue.evidence = ['用户从未说过这句话']; },
    plan => { plan.food.name = '饺子'; },
    plan => { plan.mismatch.id = previous.mismatchId; },
  ]) {
    let calls = 0;
    const response = await handlePlayRequest(request('compose', body({ previousPlanToken, variation: 'new-mismatch' })), env, async (_, init) => {
      calls++;
      const input = JSON.parse(JSON.parse(init.body).input[1].content);
      const plan = createPlan(input.directions);
      mutation(plan);
      return structured(plan);
    }, { store: new MemoryPlayStore() });
    assert.equal(response.status, 502);
    assert.equal(calls, 1);
  }
  let calls = 0;
  const changed = [...PLAN_MESSAGES, { role: 'assistant', content: '接着说。' }, { role: 'user', content: '改主意了，不要汉堡。' }];
  const response = await handlePlayRequest(request('compose', body({ previousPlanToken, variation: 'new-mismatch', messages: changed })), env, async () => { calls++; }, { store: new MemoryPlayStore() });
  assert.equal(response.status, 410);
  assert.equal(calls, 0);
});

test('an ambiguous image timeout keeps its reservation and cannot be charged again with a new request ID', async () => {
  let calls = 0;
  const store = new MemoryPlayStore();
  const token = await planToken();
  const invoke = () => handlePlayRequest(request('draw', { planToken: token, requestId: crypto.randomUUID() }), env, async () => { calls++; throw new Error('socket timed out'); }, { store });
  assert.equal((await invoke()).status, 503);
  assert.equal((await invoke()).status, 410);
  assert.equal(calls, 1);
  const record = [...store.records.values()][0];
  assert.equal(record.status, 'uncertain');
  assert.equal(record.actualMicros, null);
  assert.equal(record.reserveMicros, 150000);
});

test('a lost bookkeeping acknowledgement cannot swallow a paid image or downgrade complete to failed', async () => {
  class FlakyStore extends MemoryPlayStore {
    async finish(id, details) { await super.finish(id, details); if (details.status === 'complete') throw new Error('ack lost after commit'); }
  }
  const store = new FlakyStore();
  const upstream = provider();
  const token = await planToken();
  const invoke = () => handlePlayRequest(request('draw', { planToken: token, requestId: crypto.randomUUID() }), env, upstream.fetch, { store });
  assert.equal((await invoke()).status, 200);
  assert.equal((await invoke()).status, 200);
  assert.equal(upstream.calls.length, 1);
  assert.equal([...store.records.values()][0].status, 'complete');
});

function sqliteD1(database) {
  return { prepare(sql) { return { bind(...bindings) { return { async run() { return { meta: { changes: database.prepare(sql).run(...bindings).changes } }; }, async first() { return database.prepare(sql).get(...bindings) ?? null; } }; } }; } };
}

test('another Worker isolate recovers a completed image from R2 without another paid generation', async () => {
  // A distinct module instance has its own empty activeRequests/imageCache Maps.
  // D1 and R2 are shared, as they are across deployed Worker isolates.
  const { handlePlayRequest: otherIsolate } = await import(new URL('../server/play-api.mjs?r2-recovery-isolate', import.meta.url));
  const database = new DatabaseSync(':memory:');
  database.exec(await readFile(new URL('../drizzle/0000_food_play.sql', import.meta.url), 'utf8'));
  const firstStore = new D1PlayStore(sqliteD1(database));
  const secondStore = new D1PlayStore(sqliteD1(database));
  const objects = new Map();
  let puts = 0;
  let gets = 0;
  const recoveryEnv = {
    ...env,
    FOOD_IMAGES: {
      async put(key, bytes, options) {
        puts++;
        assert.equal(options.httpMetadata.contentType, 'image/jpeg');
        objects.set(key, new Uint8Array(bytes));
      },
      async get(key) {
        gets++;
        const bytes = objects.get(key);
        return bytes ? { arrayBuffer: async () => bytes.slice().buffer } : null;
      },
    },
  };
  const upstream = provider();
  const token = await planToken();
  try {
    const initial = await handlePlayRequest(request('draw', { planToken: token, requestId: crypto.randomUUID() }), recoveryEnv, upstream.fetch, { store: firstStore });
    assert.equal(initial.status, 200);
    const expected = await initial.json();
    const replay = await otherIsolate(request('draw', { planToken: token, requestId: crypto.randomUUID() }), recoveryEnv, upstream.fetch, { store: secondStore });
    assert.equal(replay.status, 200);
    assert.deepEqual(await replay.json(), expected);
    assert.equal(puts, 1);
    assert.equal(gets, 1, 'the second isolate must read R2 instead of sharing the first isolate cache');
    assert.equal(upstream.calls.filter(call => call.url.endsWith('/images/generations')).length, 1);
    const rows = database.prepare('SELECT status, result_json FROM food_play_requests').all();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, 'complete');
    const stored = JSON.parse(rows[0].result_json);
    assert.ok(objects.has(stored.r2Key));
    assert.equal(stored.image.dataUrl, undefined);
    assert.ok(!Object.hasOwn(expected, 'r2Key'), 'storage identifiers are not sent in the image response');
  } finally {
    database.close();
  }
});

test('the actual D1 SQL atomically reserves budget, deduplicates plans and preserves terminal records', async () => {
  const database = new DatabaseSync(':memory:');
  database.exec(await readFile(new URL('../drizzle/0000_food_play.sql', import.meta.url), 'utf8'));
  const firstStore = new D1PlayStore(sqliteD1(database));
  const secondStore = new D1PlayStore(sqliteD1(database));
  const base = { id: 'draw:one', fingerprint: 'one', kind: 'draw', actor: 'test-person', now: Date.now(), reserveMicros: 150000, monthlyBudgetMicros: 200000, dailyImageLimit: 2 };
  const duplicates = await Promise.all([firstStore.reserve(base), secondStore.reserve(base)]);
  assert.equal(duplicates.filter(row => row.fresh).length, 1);
  await assert.rejects(secondStore.reserve({ ...base, id: 'draw:two', fingerprint: 'two' }), error => error.code === 'quota_reached');
  await firstStore.finish(base.id, { status: 'complete', result: { complete: true }, actualMicros: 36000 });
  await firstStore.finish(base.id, { status: 'failed' });
  assert.equal((await secondStore.reserve(base)).record.status, 'complete');
  assert.equal((await secondStore.reserve({ ...base, id: 'draw:two', fingerprint: 'two' })).fresh, true);
  await assert.rejects(firstStore.reserve({ ...base, id: 'draw:three', fingerprint: 'three', monthlyBudgetMicros: 10000000 }), error => error.code === 'quota_reached');
  await assert.rejects(firstStore.reserve({ ...base, fingerprint: 'tampered' }), error => error.code === 'request_conflict');
  database.close();
});

test('an abandoned pending request becomes unknown instead of claiming to draw forever', async () => {
  const store = new MemoryPlayStore();
  const token = await planToken();
  const value = await openPlan(token, env);
  const now = Date.now();
  await store.reserve({ id: `draw:${value.id}`, fingerprint: await fingerprint(token), kind: 'draw', actor: 'old', now: now - 241000, reserveMicros: 150000, monthlyBudgetMicros: 10000000, dailyImageLimit: 40 });
  let calls = 0;
  const response = await handlePlayRequest(request('draw', { planToken: token, requestId: crypto.randomUUID() }), env, async () => { calls++; }, { store, now });
  assert.equal(response.status, 410);
  assert.equal((await response.json()).error.code, 'outcome_unknown');
  assert.equal(calls, 0);
});

test('the zero-dependency production bundle exports a working Worker and keeps server files off the client path', async () => {
  const output = await bundleWorker(new URL('../worker/index.mjs', import.meta.url));
  const worker = (await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)).default;
  assert.equal((await worker.fetch(request('chat', { messages: PLAN_MESSAGES, requestId: crypto.randomUUID() }), {})).status, 503);
  assert.equal((await worker.fetch(new Request('https://food.test/api/unknown'), { ASSETS: { fetch: () => new Response('must not route API into SPA') } })).status, 404);
});
