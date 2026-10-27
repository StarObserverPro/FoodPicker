const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
const origin = 'https://food.test';
const tick = () => new Promise(resolve => setImmediate(resolve));

function setup() {
  const handlers = {};
  const stores = new Map();
  const timers = new Map();
  const calls = [];
  let nextTimer = 0;
  let fetcher = async () => new Response('online');
  let activated = false;
  const key = request => new URL(typeof request === 'string' ? request : request.url, origin).href;
  const open = async name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    const cache = {
      match: async request => store.get(key(request))?.clone(),
      put: async (request, response) => store.set(key(request), response.clone()),
      async add(request) {
        const response = await fetcher(request, {});
        if (!response.ok) throw new Error('precache failed');
        await cache.put(request, response);
      },
      async addAll(requests) { await Promise.all(requests.map(request => cache.add(request))); }
    };
    return cache;
  };
  const context = {
    URL, Response, AbortController,
    setTimeout(callback) { timers.set(++nextTimer, callback); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
    self: { location: { origin },
      addEventListener(type, handler) { handlers[type] = handler; },
      skipWaiting: async () => { activated = true; }, clients: { claim: async () => {} } },
    caches: { open, keys: async () => [...stores.keys()], delete: async name => stores.delete(name) },
    fetch: (request, options) => { calls.push(key(request)); return fetcher(request, options); }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return {
    stores, calls, timers, open, get activated() { return activated; },
    set fetcher(next) { fetcher = next; },
    async lifecycle(type) {
      let work;
      handlers[type]({ waitUntil(promise) { work = promise; } });
      await work;
    },
    fetch(path, mode = 'cors') {
      let response;
      const work = [];
      handlers.fetch({ request: { url: new URL(path, origin).href, method: 'GET', mode },
        respondWith(promise) { response = promise; }, waitUntil(promise) { work.push(promise); } });
      if (!response) return undefined;
      return response.then(async value => { await Promise.all(work); return value; });
    }
  };
}

test('optional artwork failure does not prevent installation; unrelated caches survive activation', async () => {
  const app = setup();
  app.fetcher = async request => new Response('body', { status: String(request).includes('/assets/') ? 503 : 200 });
  await app.lifecycle('install');
  assert.equal(app.activated, true);
  const cache = app.stores.get('meal-picker-v20');
  assert.ok(cache.has(origin + '/psychic-app.js?v=20'));
  assert.ok([...cache.keys()].every(url => !/assets\/(quiz|direct)\//.test(url)));
  await app.open('another-app');
  await app.open('meal-picker-v18');
  await app.lifecycle('activate');
  assert.equal(app.stores.has('another-app'), true);
  assert.equal(app.stores.has('meal-picker-v18'), false);
});

test('static cache hits avoid network and new artwork is cached only after use', async () => {
  const app = setup();
  const cache = await app.open('meal-picker-v20');
  await cache.put('/psychic-app.js?v=20', new Response('cached script'));
  assert.equal(await (await app.fetch('/psychic-app.js?v=20')).text(), 'cached script');
  assert.equal(app.calls.length, 0);
  const art = '/assets/quiz/quiz-table-spread-v19.webp';
  assert.equal(await (await app.fetch(art)).text(), 'online');
  assert.equal(await (await app.fetch(art)).text(), 'online');
  assert.equal(app.calls.length, 1);
  assert.equal(app.fetch('/api/images?q=test'), undefined);
  assert.equal(app.fetch('https://external.test/image.png'), undefined);
});

test('navigation falls back to offline shell on HTTP errors and network timeout', async () => {
  const app = setup();
  const cache = await app.open('meal-picker-v20');
  await cache.put('/', new Response('offline shell'));
  app.fetcher = async () => new Response('error', { status: 503 });
  assert.equal(await (await app.fetch('/?menu=world', 'navigate')).text(), 'offline shell');
  app.fetcher = (_, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(new Error('aborted')));
  });
  const pending = app.fetch('/?from=share-card', 'navigate');
  await tick();
  assert.equal(app.timers.size, 1);
  [...app.timers.values()][0]();
  assert.equal(await (await pending).text(), 'offline shell');
});
