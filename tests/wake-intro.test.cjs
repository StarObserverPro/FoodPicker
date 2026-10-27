const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'wake-intro.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'wake-intro.css'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function boot(reduced = false, search = '') {
  const elements = new Map();
  const listeners = {};
  let animation;
  function node() {
    return {
      hidden: true, inert: false, removed: false, dataset: {}, children: [],
      style: { setProperty() {} }, textContent: '',
      append(...children) { this.children.push(...children); },
      remove() { this.removed = true; },
      setAttribute(name, value) { this[name] = value; },
      addEventListener(name, fn) { (this.events ||= {})[name] = fn; },
      removeEventListener(name) { delete this.events?.[name]; },
      querySelectorAll(selector) { return this.children.filter(child => selector === '.' + child.className); },
      querySelector(selector) { return this.children.find(child => selector === '.' + child.className); }
    };
  }
  ['wakeIntro','wakeLines','wakeScene','wakeWipe','wakeSkip','wakeWave'].forEach(id => elements.set(id, node()));
  const inner = node();
  const document = {
    getElementById(id) { return elements.get(id); },
    querySelector(selector) { return selector === '.paper > .inner' ? inner : null; },
    createElement() { return node(); },
    addEventListener(name, fn) { listeners[name] = fn; },
    removeEventListener(name) { delete listeners[name]; }
  };
  const context = {
    document, location: { search }, URLSearchParams, Date, Math,
    matchMedia: () => ({ matches: reduced }),
    requestAnimationFrame(callback) { animation = callback; return 1; },
    cancelAnimationFrame() { animation = null; }
  };
  vm.runInNewContext(source, context, { filename: 'wake-intro.js' });
  return { elements, inner, listeners, step(t) { if (animation) animation(t); } };
}

test('opening is layered before the real literary landing and registered offline', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(index.indexOf('id="wakeIntro"') < index.indexOf('class="inner"'));
  assert.match(index, /wake-intro.css\?v=21/);
  assert.match(index, /wake-intro.js\?v=21/);
  assert.match(sw, /wake-intro.css\?v=21/);
  assert.match(sw, /wake-intro.js\?v=21/);
  assert.match(css, /top:calc\(100% \+ \.19em\)/, 'small ending sits below the accented word');
});

test('the question ending shares the highlighted cue, and skipping unblocks entry', () => {
  const app = boot();
  const nodes = app.elements.get('wakeLines').children;
  const word = nodes.find(element => element.dataset.key === 'what');
  assert.equal(nodes.filter(element => element.dataset.key === 'question').length, 0);
  assert.equal(word['aria-label'], '吃什么了吗？');
  assert.equal(word.children.find(element => element.className === 'wake-what-tail').textContent, '了吗？');
  assert.equal(app.inner.inert, true);
  app.elements.get('wakeSkip').events.click();
  assert.equal(app.elements.get('wakeIntro').removed, true);
  assert.equal(app.inner.inert, false);
});

test('reduced motion and explicit bypass show the original home without animation', () => {
  for (const app of [boot(true), boot(false, '?intro=0')]) {
    assert.equal(app.elements.get('wakeIntro').removed, true);
    assert.equal(app.inner.inert, false);
  }
});

test('completed timeline tears down overlay and restores interaction', () => {
  const app = boot();
  app.step(0);
  for (let t = 200; t <= 17000; t += 200) app.step(t);
  assert.equal(app.elements.get('wakeIntro').removed, true);
  assert.equal(app.inner.inert, false);
});
