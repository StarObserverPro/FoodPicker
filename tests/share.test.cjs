const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const { createRuntime, source } = require('./helpers/runtime.cjs');

const tick = () => new Promise(resolve => setImmediate(resolve));

function setup({ failImages = false, pendingImages = false, pendingBlobs = false } = {}) {
  const { context, nodes } = createRuntime();
  const frames = [];
  const images = new Map();
  const blobs = [];
  const timers = new Map();
  let timerId = 0;
  context.console = { ...console, error() {} };
  context.setTimeout = (callback, delay) => {
    if (delay === 650) { callback(); return 0; }
    timers.set(++timerId, { callback, delay });
    return timerId;
  };
  context.clearTimeout = id => timers.delete(id);
  context.Image = class {
    constructor() { this.naturalWidth = 928; this.naturalHeight = 1232; }
    set src(url) {
      this._src = url;
      if (!url) return;
      images.set(url, this);
      if (!pendingImages) queueMicrotask(() => failImages ? this.onerror?.() : this.onload?.());
    }
    get src() { return this._src; }
  };
  const create = context.document.createElement;
  context.document.createElement = tag => {
    if (tag !== 'canvas') return create(tag);
    const frame = { images: [], text: [] };
    frames.push(frame);
    const ctx = {
      drawImage: image => frame.images.push(image.src),
      fillText: value => frame.text.push(value),
      measureText: value => ({ width: value.length * 10 }),
      createLinearGradient: () => ({ addColorStop() {} })
    };
    for (const name of ['beginPath', 'moveTo', 'lineTo', 'arcTo', 'quadraticCurveTo', 'closePath',
      'save', 'restore', 'stroke', 'fill', 'fillRect']) ctx[name] = () => {};
    return {
      getContext: () => ctx,
      toBlob(callback) {
        const finish = () => callback(new Blob(['card'], { type: 'image/png' }));
        if (pendingBlobs) blobs.push(finish);
        else finish();
      }
    };
  };
  context.FoodPickerQR = { paint() {} };
  vm.runInContext(source, context);
  return {
    context, nodes, frames, images, blobs,
    timeout(delay) {
      const entry = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(entry, `a ${delay}ms timeout is pending`);
      timers.delete(entry[0]);
      entry[1].callback();
    }
  };
}

test('failed illustration still exports a card with the chosen meal', async () => {
  const { nodes, frames } = setup({ failImages: true });
  nodes.randomBtn.click();
  await tick();
  await nodes.acceptBtn.click();
  assert.equal(nodes.downloadBtn.disabled, false);
  assert.equal(nodes.shareFileBtn.disabled, false);
  assert.ok(nodes.sharePreview.src.startsWith('blob:'));
  assert.deepEqual(frames[0].images, []);
  assert.ok(frames[0].text.includes(nodes.mealName.textContent));
});

test('font and illustration stalls have bounded waits and keep sharing usable', async () => {
  const app = setup({ pendingImages: true });
  app.context.document.fonts.ready = new Promise(() => {});
  app.nodes.randomBtn.click();
  const sharing = app.nodes.acceptBtn.click();
  app.timeout(1200);
  await tick();
  app.timeout(2500);
  await sharing;
  assert.equal(app.nodes.downloadBtn.disabled, false);
  assert.equal(app.frames.length, 1);
  assert.deepEqual(app.frames[0].images, []);
});

test('closing and rerolling cancels old image and encoding work without blocking a new share', async () => {
  const app = setup({ pendingImages: true, pendingBlobs: true });
  app.nodes.randomBtn.click();
  const oldUrl = app.nodes.directArt.src;
  const oldShare = app.nodes.acceptBtn.click();
  await tick();
  app.nodes.closeShareBtn.click();
  app.nodes.rerollBtn.click();
  const newUrl = app.nodes.directArt.src;
  assert.notEqual(newUrl, oldUrl);
  app.images.get(newUrl).onload();
  await tick();
  const newShare = app.nodes.acceptBtn.click();
  await tick();
  app.images.get(oldUrl).onload();
  await oldShare;
  await app.nodes.acceptBtn.click();
  assert.equal(app.frames.length, 1, 'late old completion does not unlock or redraw the active task');
  assert.deepEqual(app.frames[0].images, [newUrl]);
  app.nodes.closeShareBtn.click();
  app.blobs.shift()();
  await newShare;
  assert.equal(app.nodes.sharePreview.src, '', 'a closed encoding task cannot publish its preview');

  const retry = app.nodes.acceptBtn.click();
  await tick();
  app.blobs.shift()();
  await retry;
  assert.equal(app.nodes.downloadBtn.disabled, false);
  assert.deepEqual(app.frames[1].images, [newUrl], 'later shares retain the displayed illustration');
});

test('failed persona composition falls back to a card and can be retried', async () => {
  const app = setup();
  let attempts = 0;
  const art = { layers: { background: {}, pot: {}, character: {} } };
  app.context.FoodPickerPersonaArt = {
    describe: () => ({ title: '测试人格', verdict: '今天好好吃饭。' }),
    load: async () => art,
    compose: () => {
      if (++attempts === 1) throw new Error('canvas unavailable');
      return { src: 'composed', width: 1080, height: 1350 };
    }
  };
  app.nodes.startBtn.click();
  for (let step = 0; step < 8; step++) app.nodes.choices.children[0].click();
  await tick();
  assert.equal(app.nodes.personaCharacter.hidden, false, 'display does not wait for composition');
  await app.nodes.acceptBtn.click();
  assert.deepEqual(app.frames[0].images, []);
  assert.equal(app.nodes.downloadBtn.disabled, false);
  app.nodes.closeShareBtn.click();
  await app.nodes.acceptBtn.click();
  assert.deepEqual(app.frames[1].images, ['composed']);
  assert.equal(attempts, 2);
});
