const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '../chat.html'), 'utf8');
const source = fs.readFileSync(path.join(__dirname, '../chat.mjs'), 'utf8').replace(/^import .*\n/, '');
const tick = () => new Promise(resolve => setImmediate(resolve));
const resultPicture = {
  image: { dataUrl: 'data:image/jpeg;base64,/9j/2Q==', mimeType: 'image/jpeg', width: 1024, height: 1536 },
  food: { name: '汉堡', nativeName: 'Burger' },
  caption: '开一天会，这回让汉堡负责开车。',
  sceneDescription: 'A recognisable burger forms the hood of a tiny car, painted in broad brushstrokes.',
};

function boot() {
  const calls = [], shares = [], downloads = [], listeners = new Map();
  let serial = 0;
  class Node {
    constructor(id = '') { this.id = id; this.children = []; this.events = new Map(); this.hidden = false; this.disabled = false; this.value = ''; this.textContent = ''; }
    addEventListener(name, callback) { this.events.set(name, callback); }
    setAttribute(name, value) { this[name] = value; }
    removeAttribute(name) { delete this[name]; }
    append(node) { this.children.push(node); }
    replaceChildren(...nodes) { this.children = nodes; }
    get lastElementChild() { return this.children.at(-1); }
    remove() {}
    focus() {}
    scrollIntoView() {}
    click() {
      if (this.disabled) return;
      if (this.download) downloads.push(this.download);
      this.events.get('click')?.({ target: this, preventDefault() {} });
    }
    requestSubmit() { this.events.get('submit')?.({ preventDefault() {} }); }
  }
  const nodes = Object.fromEntries([...html.matchAll(/id="([^"]+)"/g)].map(([, id]) => [id, new Node(id)]));
  const defaultResponse = route => {
    if (route === '/api/chat') return { reply: '那就给晚饭安排一点离谱的休息。', ready: true, remainingTurns: 5 };
    if (route === '/api/compose') return { planToken: 'signed-plan-1', food: resultPicture.food, caption: resultPicture.caption, sceneDescription: resultPicture.sceneDescription };
    if (route === '/api/draw') return resultPicture;
    throw new Error(`Unexpected request ${route}`);
  };
  const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  let fetcher = async route => response(defaultResponse(route));
  const context = {
    document: { getElementById: id => nodes[id], createElement: () => new Node(), body: new Node('body') },
    chooseOpener: ({ seenIds }) => ({ id: `opening-${seenIds.length}`, text: `今天有什么事值得拿出来聊聊？${seenIds.length}`, topic: 'today' }),
    fetch: async (url, options) => { calls.push({ url, body: JSON.parse(options.body), signal: options.signal }); return fetcher(url, options); },
    navigator: { onLine: true, canShare: () => true, share: async payload => { shares.push(payload); } },
    crypto: { randomUUID: () => `00000000-0000-4000-8000-${String(++serial).padStart(12, '0')}` },
    URL: { createObjectURL: () => `blob:picture-${++serial}`, revokeObjectURL() {} },
    Blob, Uint8Array, AbortController,
    File: class extends Blob { constructor(parts, name, options) { super(parts, options); this.name = name; } },
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    sessionStorage: { getItem: () => null, setItem() {} },
    setTimeout(callback, milliseconds) { const timer = setTimeout(callback, milliseconds); timer.unref(); return timer; },
    clearTimeout,
    addEventListener: (type, callback) => listeners.set(type, callback),
  };
  vm.runInNewContext(source, context, { filename: 'chat.mjs' });
  return {
    nodes, calls, shares, downloads, listeners, response,
    set fetcher(value) { fetcher = value; },
    async settle() { for (let n = 0; n < 6; n++) await tick(); },
    async say(text) { nodes.messageInput.value = text; nodes.messageInput.events.get('input')(); nodes.messageForm.requestSubmit(); await this.settle(); },
  };
}

test('opening and changing the topic are entirely local, then one answer is enough to draw', async () => {
  const app = boot();
  assert.equal(app.calls.length, 0);
  assert.equal(app.nodes.messages.children.length, 1);
  const firstOpener = app.nodes.messages.children[0].textContent;
  app.nodes.changeOpener.click();
  assert.notEqual(app.nodes.messages.children[0].textContent, firstOpener);
  assert.equal(app.calls.length, 0);
  assert.equal(app.nodes.drawImage.disabled, true);
  await app.say('今天开了一天会。');
  assert.equal(app.calls.length, 1);
  assert.equal(app.calls[0].url, '/api/chat');
  assert.equal(app.nodes.drawImage.disabled, false);
  assert.equal(app.nodes.changeOpener.hidden, true);
  app.nodes.drawImage.click();
  await app.settle();
  assert.deepEqual(app.calls.map(call => call.url), ['/api/chat', '/api/compose', '/api/draw']);
  assert.equal(app.nodes.pictureResult.hidden, false);
  assert.equal(app.nodes.foodName.textContent, '汉堡');
  assert.equal(app.nodes.conversation.hidden, true);
});

test('drawing retry retains the plan and request ID; saving and sharing make no API requests', async () => {
  const app = boot();
  await app.say('想吃汉堡，刚修完车。');
  let draws = 0;
  app.fetcher = async route => route === '/api/compose'
    ? app.response({ planToken: 'signed-plan-retry' })
    : ++draws === 1 ? app.response({ error: { code: 'UPSTREAM_BUSY', message: 'private detail' } }, 502) : app.response(resultPicture);
  app.nodes.drawImage.click();
  await app.settle();
  assert.equal(app.nodes.retryPicture.hidden, false);
  assert.doesNotMatch(app.nodes.errorText.textContent, /private detail/);
  app.nodes.retryPicture.click();
  await app.settle();
  assert.equal(app.calls.filter(call => call.url === '/api/compose').length, 1);
  const drawCalls = app.calls.filter(call => call.url === '/api/draw');
  assert.equal(drawCalls.length, 2);
  assert.equal(drawCalls[0].body.requestId, drawCalls[1].body.requestId);
  assert.equal(drawCalls[0].body.planToken, drawCalls[1].body.planToken);
  const requestCount = app.calls.length;
  app.nodes.savePicture.click();
  app.nodes.sharePicture.click();
  await app.settle();
  assert.equal(app.calls.length, requestCount);
  assert.equal(app.downloads.length, 1);
  assert.equal(app.shares.length, 1);
  assert.deepEqual(Object.keys(app.shares[0]).sort(), ['files', 'title']);
  assert.equal(app.shares[0].files[0].type, 'image/jpeg');
});

test('a response completing after reset cannot replace the new conversation', async () => {
  const app = boot();
  await app.say('我今天去了好远的地方。');
  let resolvePicture;
  app.fetcher = async route => route === '/api/compose'
    ? app.response({ planToken: 'signed-plan-stale' })
    : new Promise(resolve => { resolvePicture = resolve; });
  app.nodes.drawImage.click();
  await app.settle();
  assert.equal(app.nodes.progressPanel.hidden, false);
  app.nodes.resetChat.click();
  resolvePicture(app.response(resultPicture));
  await app.settle();
  assert.equal(app.nodes.pictureResult.hidden, true);
  assert.equal(app.nodes.conversation.hidden, false);
  assert.equal(app.nodes.messages.children.length, 1);
  assert.equal(app.nodes.progressPanel.hidden, true);
});

test('a deliberate new picture preserves food with the signed prior plan and uses fresh IDs', async () => {
  const app = boot();
  await app.say('想吃汉堡。');
  app.nodes.drawImage.click();
  await app.settle();
  app.nodes.newMismatch.click();
  await app.settle();
  const compositions = app.calls.filter(call => call.url === '/api/compose');
  assert.equal(compositions.length, 2);
  assert.equal(compositions[1].body.previousPlanToken, 'signed-plan-1');
  assert.equal(compositions[1].body.variation, 'new-mismatch');
  assert.notEqual(compositions[0].body.requestId, compositions[1].body.requestId);
  const drawings = app.calls.filter(call => call.url === '/api/draw');
  assert.notEqual(drawings[0].body.requestId, drawings[1].body.requestId);
});

test('IME composition and overlong input do not submit; unavailable service offers the ordinary picker', async () => {
  const app = boot();
  app.nodes.messageInput.value = '想吃饭';
  app.nodes.messageInput.events.get('input')();
  app.nodes.messageInput.events.get('compositionstart')();
  app.nodes.messageInput.events.get('keydown')({ key: 'Enter', isComposing: true, preventDefault() {} });
  assert.equal(app.calls.length, 0);
  app.nodes.messageInput.events.get('compositionend')();
  await app.say('汉'.repeat(601));
  assert.equal(app.calls.length, 0);
  app.fetcher = async () => app.response({ error: { code: 'NOT_CONFIGURED', message: 'OPENAI_API_KEY missing' } }, 503);
  await app.say('有点累了。');
  assert.equal(app.nodes.fallbackLink.hidden, false);
  assert.match(app.nodes.errorText.textContent, /聊天和画图暂时用不了/);
  assert.doesNotMatch(app.nodes.errorText.textContent, /API|KEY/);
  assert.equal(app.nodes.drawImage.disabled, false);
});

test('API error codes distinguish busy and in-progress attempts from terminal drawing attempts', async () => {
  const app = boot();
  await app.say('想吃汉堡。');
  let code = 'upstream_busy';
  let status = 503;
  app.fetcher = async route => route === '/api/compose'
    ? app.response({ planToken: 'signed-plan-code-test' })
    : app.response({ error: { code, message: 'internal text must not appear' } }, status);
  app.nodes.drawImage.click();
  await app.settle();
  assert.equal(app.nodes.fallbackLink.hidden, true, 'an upstream 503 is not missing configuration');
  assert.match(app.nodes.errorText.textContent, /忙/);
  assert.doesNotMatch(app.nodes.errorText.textContent, /暂时用不了/);
  code = 'in_progress'; status = 409;
  app.nodes.retryPicture.click();
  await app.settle();
  assert.match(app.nodes.errorText.textContent, /还在生成/);
  assert.equal(app.nodes.retryPicture.hidden, false);
  assert.equal(app.calls.filter(call => call.url === '/api/compose').length, 1);
  const drawingIds = app.calls.filter(call => call.url === '/api/draw').map(call => call.body.requestId);
  assert.equal(drawingIds[0], drawingIds[1]);

  for (const terminal of ['plan_expired', 'variation_context_changed', 'image_no_longer_cached', 'previous_attempt_failed', 'outcome_unknown']) {
    code = terminal; status = terminal === 'plan_expired' ? 409 : 410;
    const before = app.calls.length;
    (app.nodes.retryPicture.hidden ? app.nodes.drawImage : app.nodes.retryPicture).click();
    await app.settle();
    assert.equal(app.nodes.retryPicture.hidden, true, `${terminal} clears the old attempt`);
    assert.equal(app.nodes.drawImage.textContent, '就这些，画出来');
    assert.match(app.nodes.errorText.textContent, /不会自动重画/);
    assert.doesNotMatch(app.nodes.errorText.textContent, /还在生成/);
    const after = app.calls.length;
    assert.ok(after > before);
    await app.settle();
    assert.equal(app.calls.length, after, `${terminal} never retries automatically`);
  }
});

test('a terminal chat replay waits for a manual retry before assigning a fresh request ID', async () => {
  const app = boot();
  let attempt = 0;
  app.fetcher = async () => {
    attempt += 1;
    if (attempt === 1) return app.response({ error: { code: 'upstream_busy' } }, 503);
    if (attempt === 2) return app.response({ error: { code: 'previous_attempt_failed' } }, 410);
    return app.response({ reply: '这回接上了，晚饭来点热乎的。', ready: true, remainingTurns: 5 });
  };
  await app.say('刚刚下班。');
  assert.equal(app.calls.length, 1);
  app.nodes.retryChat.click();
  await app.settle();
  assert.equal(app.calls.length, 2);
  assert.equal(app.calls[0].body.requestId, app.calls[1].body.requestId);
  assert.equal(app.nodes.retryChat.textContent, '再试一次');
  await app.settle();
  assert.equal(app.calls.length, 2, 'terminal replay does not send another request itself');
  app.nodes.retryChat.click();
  await app.settle();
  assert.equal(app.calls.length, 3);
  assert.notEqual(app.calls[1].body.requestId, app.calls[2].body.requestId);
  assert.deepEqual(app.calls[0].body.messages, app.calls[2].body.messages);
  assert.equal(app.nodes.messageInput.disabled, false);
  assert.equal(app.nodes.messages.lastElementChild.textContent, '这回接上了，晚饭来点热乎的。');
});

test('continuing after failed chat and successful drawing reuses the real picture caption as context', async () => {
  const app = boot();
  let chats = 0;
  app.fetcher = async route => {
    if (route === '/api/chat') return ++chats === 1
      ? app.response({ error: { code: 'upstream_failed' } }, 503)
      : app.response({ reply: '那再换一个角度琢磨。', ready: true, remainingTurns: 4 });
    if (route === '/api/compose') return app.response({ planToken: 'signed-plan-after-chat-failed' });
    return app.response(resultPicture);
  };
  await app.say('想吃汉堡，刚修完车。');
  app.nodes.drawImage.click();
  await app.settle();
  assert.equal(app.nodes.pictureResult.hidden, false);
  app.nodes.continueChat.click();
  assert.equal(app.nodes.messages.lastElementChild.textContent, `刚才这张图的配文：${resultPicture.caption}`);
  await app.say('那再来点辣的。');
  const lastChat = app.calls.filter(call => call.url === '/api/chat').at(-1);
  assert.deepEqual(lastChat.body.messages.map(message => message.role), ['assistant', 'user', 'assistant', 'user']);
  assert.equal(lastChat.body.messages[2].content, `刚才这张图的配文：${resultPicture.caption}`);
  assert.equal(app.nodes.messages.lastElementChild.textContent, '那再换一个角度琢磨。');
});
