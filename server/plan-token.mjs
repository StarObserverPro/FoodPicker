import { PlayError } from './provider.mjs';

const encoder = new TextEncoder();
const tokenLifetime = 60 * 60 * 1000;
function encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
function decode(value) {
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
}
async function key(env) {
  const secret = env.FOOD_SIGNING_SECRET || env.OPENAI_API_KEY;
  if (!secret) throw new PlayError('not_configured', '厨房还没开火，先去随便选一道吧。', 503);
  return crypto.subtle.importKey('raw', encoder.encode(`food-play.v1:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
export async function fingerprint(value) {
  return encode(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}
export async function sealPlan(plan, prompt, env, now = Date.now(), conversationHash = '') {
  // Only rendering data is carried forward; raw conversation/evidence never enters the token or image request.
  const payload = {
    version: 1,
    id: crypto.randomUUID(),
    exp: now + tokenLifetime,
    food: { name: plan.food.name, nativeName: plan.food.nativeName, englishName: plan.food.englishName },
    mismatchId: plan.mismatch.id,
    conversationHash,
    prompt,
    caption: plan.caption,
    sceneDescription: plan.sceneDescription,
  };
  const body = encode(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign('HMAC', await key(env), encoder.encode(body));
  return `${body}.${encode(new Uint8Array(signature))}`;
}
export async function openPlan(token, env, now = Date.now()) {
  try {
    if (typeof token !== 'string' || token.length > 16000) throw new Error('token');
    const [body, signature, extra] = token.split('.');
    if (!body || !signature || extra !== undefined || !await crypto.subtle.verify('HMAC', await key(env), decode(signature), encoder.encode(body))) throw new Error('signature');
    const value = JSON.parse(new TextDecoder().decode(decode(body)));
    if (value.version !== 1 || !Number.isFinite(value.exp) || value.exp < now || value.exp > now + tokenLifetime + 1000 || typeof value.prompt !== 'string' || !value.id || !value.food?.name) throw new Error('expired');
    return value;
  } catch {
    throw new PlayError('plan_expired', '这份构思放久了，回去重新想一张吧。', 409);
  }
}
