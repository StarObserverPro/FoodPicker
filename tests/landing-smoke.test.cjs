const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../psychic-app.js'), 'utf8');

class ClassList {
  constructor(initial = '') { this.values = new Set(String(initial).split(/\s+/).filter(Boolean)); }
  add(...names) { names.forEach(name => this.values.add(name)); }
  remove(...names) { names.forEach(name => this.values.delete(name)); }
  contains(name) { return this.values.has(name); }
  toggle(name, force) {
    if (force === undefined) force = !this.values.has(name);
    force ? this.values.add(name) : this.values.delete(name);
    return force;
  }
}

class FakeNode {
  constructor(tag = 'div', id = '') {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.className = '';
    this.classList = new ClassList();
    this.style = {};
    this.dataset = {};
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.textContent = '';
    this._innerHTML = '';
    this.disabled = false;
    this.hidden = false;
    this.title = '';
    this.src = '';
    this.clientWidth = 360;
    this.scrollWidth = 300;
  }
  set innerHTML(value) { this._innerHTML = String(value); this.children = []; }
  get innerHTML() { return this._innerHTML; }
  appendChild(child) { this.children.push(child); return child; }
  append(...children) { children.forEach(child => this.appendChild(child)); }
  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(handler);
  }
  click() {
    if (this.disabled) return;
    (this.listeners.get('click') || []).forEach(handler => handler({ target: this }));
  }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); if (name === 'src') this.src = ''; }
  querySelectorAll() { return []; }
  remove() {}
  select() {}
}

function question(id, daily = false) {
  const options = [0, 1, 2, 3].map(index => ({
    icon: String(index + 1),
    title: `${id}-${index + 1}`,
    sub: '',
    ...(daily
      ? { mood: index === 0 ? { easy: 5 } : { reward: 3 } }
      : { axis: { heat: index % 2 ? -1 : 1, texture: index < 2 ? 1 : -1, focus: 1, meaning: -1 } })
  }));
  return { id, text: `问题 ${id}`, hint: '', options };
}

function createRuntime() {
  const ids = [
    'intro', 'quiz', 'loading', 'result', 'randomBtn', 'startBtn', 'qStep', 'prog', 'qText',
    'choices', 'quizBackBtn', 'loadingLine', 'resultHero', 'personaFloat', 'personaTitle',
    'personaVerdict', 'personaBackground', 'personaPot', 'personaCharacter', 'directArt', 'resultArtFallback',
    'resultDecision', 'mealName', 'mealNative', 'psychVerdict', 'altList', 'acceptBtn',
    'rerollBtn', 'resetProfileBtn', 'shareModal', 'shareStatus',
    'sharePreview', 'shareFileBtn', 'downloadBtn', 'copyLinkBtn', 'closeShareBtn', 'toast'
  ];
  const nodes = Object.fromEntries(ids.map(id => [id, new FakeNode('div', id)]));
  for (const id of ['randomBtn', 'startBtn', 'quizBackBtn', 'acceptBtn', 'rerollBtn', 'resetProfileBtn', 'shareFileBtn', 'downloadBtn', 'copyLinkBtn', 'closeShareBtn']) {
    nodes[id] = new FakeNode('button', id);
  }
  nodes.quiz.classList.add('hidden');
  nodes.loading.classList.add('hidden');
  nodes.result.classList.add('hidden');
  nodes.shareModal.classList.add('hidden');

  const documentListeners = new Map();
  const documentElement = new FakeNode('html', 'html');
  const body = new FakeNode('body', 'body');
  const document = {
    documentElement,
    body,
    fonts: { ready: Promise.resolve() },
    getElementById: id => nodes[id] || null,
    createElement: tag => new FakeNode(tag),
    addEventListener(type, handler) {
      if (!documentListeners.has(type)) documentListeners.set(type, []);
      documentListeners.get(type).push(handler);
    },
    execCommand: () => true
  };

  const profileQuestions = [
    question('close-the-day'), question('stalled-room'), question('friend-response'),
    question('weekend-memory'), question('inhabited-room')
  ];
  const dailyQuestions = [question('world-request', true), question('bandwidth', true)];
  const calibrator = question('calibrate-heat');
  const meals = [
    { name: '番茄炒蛋盖饭', region: '中国', native: '' },
    { name: '重庆小面', region: '中国', native: '' },
    { name: '麻辣烫', region: '中国', native: '' },
    { name: '小笼包配蛋花汤', region: '中国', native: '' }
  ];

  const engine = {
    HISTORY_STORAGE_KEY: 'history',
    PROFILE_QUESTIONS: profileQuestions,
    DAILY_QUESTIONS: dailyQuestions,
    CALIBRATORS: { heat: calibrator },
    AXES: ['heat', 'texture', 'focus', 'meaning'].map(key => ({ key })),
    getCalibrationQuestion: () => calibrator,
    buildProfile: () => ({ archetypeId: 'mock', values: { heat: 0.4, texture: 0.2, focus: 0.1, meaning: -0.2 } }),
    buildDaily: answers => ({ selections: answers.map(item => item.title), mood: { easy: 5 } }),
    archetypeById: () => ({ pot: '砂锅', defaultWord: '稳场', role: '派' }),
    chooseFloatWord: () => '稳场',
    fortuneFor: () => ({ name: 'mock', tags: ['comfort'] }),
    profileMeal: meal => ({ ...meal, tags: ['comfort'], cross: [{ title: '砂锅稳场派' }] }),
    rankMeals: list => list.map((meal, index) => ({ ...engine.profileMeal(meal), score: 100 - index })),
    weightedDraw: (ranked, count) => ranked.slice(0, count),
    makeShareUrl: meal => `https://example.test/?meal=${encodeURIComponent(meal.name)}`
  };

  const storage = new Map();
  const localStorage = {
    getItem: key => storage.has(key) ? storage.get(key) : null,
    setItem: (key, value) => storage.set(key, String(value))
  };

  const context = {
    console,
    document,
    FOODS: meals,
    FOOD_PICKER_ENGINE: engine,
    navigator: {},
    localStorage,
    location: { origin: 'https://example.test', pathname: '/', search: '' },
    URL,
    Blob,
    Uint8Array,
    TextEncoder,
    atob: value => Buffer.from(value, 'base64').toString('binary'),
    requestAnimationFrame: callback => { callback(); return 1; },
    getComputedStyle: () => ({ fontSize: '36px' }),
    matchMedia: () => ({ matches: false }),
    scrollTo: () => {},
    setTimeout: callback => { callback(); return 1; },
    clearTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    addEventListener: () => {},
    Image: class FakeImage {
      constructor() {
        this.naturalWidth = 928;
        this.naturalHeight = 1232;
        this.width = 928;
        this.height = 1232;
      }
      set src(value) {
        this._src = value;
        Promise.resolve().then(() => this.onload?.());
      }
      get src() { return this._src; }
    },
    File: class File extends Blob { constructor(parts, name, options) { super(parts, options); this.name = name; } },
    Math,
    Date,
    Set,
    Map,
    Object,
    Array,
    JSON,
    Promise
  };
  context.window = context;
  context.window.FOOD_PICKER_ENGINE = engine;
  context.window.matchMedia = context.matchMedia;
  context.window.scrollTo = context.scrollTo;
  vm.createContext(context);

  return { context, nodes };
}

{
  const { context, nodes } = createRuntime();
  vm.runInContext(source, context, { filename: 'psychic-app.js' });
  assert.equal(context.document.documentElement.dataset.appReady, 'true', 'app boots and marks itself ready');
  assert.equal(nodes.startBtn.disabled, false, 'psychology entrance stays enabled');
  assert.equal(nodes.randomBtn.disabled, false, 'random entrance stays enabled');

  nodes.startBtn.click();
  assert.equal(nodes.quiz.classList.contains('hidden'), false, 'psychology click opens quiz');
  assert.equal(nodes.intro.classList.contains('hidden'), true, 'psychology click leaves landing');
  assert.match(nodes.qStep.textContent, /^第 1 题 \/ 8$/, 'quiz renders the expected eight-step flow');
  assert.ok(nodes.qText.textContent.length > 0, 'first question renders copy');
  assert.equal(nodes.choices.children.length, 4, 'first question renders four choices');

  for (let step = 0; step < 8; step += 1) {
    const firstChoice = nodes.choices.children[0];
    assert.ok(firstChoice, `choice exists at step ${step + 1}`);
    firstChoice.click();
  }
  assert.equal(nodes.result.classList.contains('hidden'), false, 'eight answers reach result');
  assert.ok(nodes.mealName.textContent.length > 0, 'psychology flow renders a meal');
}

{
  const { context, nodes } = createRuntime();
  vm.runInContext(source, context, { filename: 'psychic-app.js' });
  nodes.randomBtn.click();
  assert.equal(nodes.result.classList.contains('hidden'), false, 'random click opens result');
  assert.equal(nodes.intro.classList.contains('hidden'), true, 'random click leaves landing');
  assert.ok(nodes.mealName.textContent.length > 0, 'random flow renders a meal');
  assert.equal(nodes.psychVerdict.textContent, '不分析了，就它。', 'random flow remains the no-analysis path');
  assert.match(nodes.directArt.src, /^\/assets\/direct\/direct-food-0[1-5]-full\.png$/, 'random flow selects a complete direct result illustration');
}

(async () => {
  {
    const { context, nodes } = createRuntime();
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.randomBtn.click();
    const firstArt = nodes.directArt.src;
    assert.equal(nodes.resultArtFallback.hidden, false, 'direct fallback stays visible while art loads');
    assert.equal(nodes.directArt.hidden, true, 'direct art stays hidden while loading');
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.resultArtFallback.hidden, true, 'direct fallback hides after art loads');
    assert.equal(nodes.directArt.hidden, false, 'direct result art appears after loading');

    nodes.rerollBtn.click();
    await new Promise(resolve => setImmediate(resolve));
    assert.notEqual(nodes.directArt.src, firstArt, 'direct reroll rotates to a different art asset');
  }

  const artDetail = {
    title: '砂锅 · 稳场派',
    verdict: '稳场先把今天接住。慢一点也没关系。吃完再往前走。',
    theme: 'light',
    backgroundUrl: '/assets/persona/r3/backgrounds/light-river.svg',
    potUrl: '/assets/persona/r3/pots/mock.png',
    characterUrl: '/assets/persona/r3/characters/mock.png'
  };

  {
    const { context, nodes } = createRuntime();
    let resolveArt;
    const pendingArt = new Promise(resolve => { resolveArt = resolve; });
    context.window.FoodPickerPersonaArt = {
      describe: () => artDetail,
      load: () => pendingArt
    };
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.startBtn.click();
    for (let step = 0; step < 8; step += 1) nodes.choices.children[0].click();

    assert.equal(nodes.resultArtFallback.hidden, false, 'fallback stays visible while persona art loads');
    assert.equal(nodes.personaBackground.hidden, true, 'background stays hidden while art loads');
    assert.equal(nodes.personaPot.hidden, true, 'pot stays hidden while art loads');
    assert.equal(nodes.personaCharacter.hidden, true, 'character stays hidden while art loads');

    resolveArt({ ...artDetail, image: {} });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(nodes.resultArtFallback.hidden, true, 'fallback hides after every art layer loads');
    assert.equal(nodes.personaBackground.hidden, false, 'background appears after art load succeeds');
    assert.equal(nodes.personaPot.hidden, false, 'pot appears after art load succeeds');
    assert.equal(nodes.personaCharacter.hidden, false, 'character appears after art load succeeds');
  }

  {
    const { context, nodes } = createRuntime();
    context.console = { ...console, error: () => {} };
    context.window.FoodPickerPersonaArt = {
      describe: () => artDetail,
      load: () => Promise.reject(new Error('asset request failed'))
    };
    vm.runInContext(source, context, { filename: 'psychic-app.js' });
    nodes.startBtn.click();
    for (let step = 0; step < 8; step += 1) nodes.choices.children[0].click();
    await new Promise(resolve => setImmediate(resolve));

    assert.equal(nodes.resultArtFallback.hidden, false, 'fallback remains visible when art loading fails');
    assert.equal(nodes.personaBackground.hidden, true, 'failed background stays hidden');
    assert.equal(nodes.personaPot.hidden, true, 'failed pot stays hidden');
    assert.equal(nodes.personaCharacter.hidden, true, 'failed character stays hidden');
  }

  console.log('landing smoke: both entrances, direct art rotation and persona-art fallback states work');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
