const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../persona-art.js'), 'utf8');
const detail = { backgroundUrl: '/b.svg', characterUrl: '/c.png', potUrl: '/p.png' };

function setup() {
  const images = [];
  const timers = new Map();
  let next = 0;
  let canvasCount = 0;
  let failCanvas = true;
  const context = {
    window: {}, AbortController,
    setTimeout(callback) { timers.set(++next, callback); return next; },
    clearTimeout(id) { timers.delete(id); },
    fetch: async () => ({ ok: true, text: async () => '<svg></svg>' }),
    Image: class {
      set src(url) { this._src = url; if (url) images.push(this); }
      get src() { return this._src; }
    },
    document: { createElement() {
      canvasCount++;
      return { getContext: () => failCanvas ? null : { drawImage() {} } };
    } }
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  return { art: context.window.FoodPickerPersonaArt, images, timers,
    get canvasCount() { return canvasCount; }, recoverCanvas() { failCanvas = false; } };
}
const tick = () => new Promise(resolve => setImmediate(resolve));

test('layers display without a canvas and a failed export can be retried', async () => {
  const app = setup();
  const loading = app.art.load({}, {}, detail);
  await tick();
  app.images.forEach(image => image.onload());
  const art = await loading;
  assert.ok(art.layers.background && art.layers.character && art.layers.pot);
  assert.equal(app.canvasCount, 0);
  assert.throws(() => app.art.compose(art), /canvas unavailable/);
  app.recoverCanvas();
  assert.ok(app.art.compose(art));
  assert.equal(app.canvasCount, 2, 'failed composition never poisons subsequent exports');
});

test('image timeout clears the failed entry so the next attempt can load', async () => {
  const app = setup();
  const loading = app.art.load({}, {}, detail);
  const rejected = assert.rejects(loading, /timed out/);
  await tick();
  for (const callback of [...app.timers.values()]) callback();
  await rejected;
  await tick();
  const retry = app.art.load({}, {}, detail);
  await tick();
  const fresh = app.images.filter(image => image.onload);
  assert.equal(fresh.length, 3);
  fresh.forEach(image => image.onload());
  assert.ok((await retry).layers.character);
});
