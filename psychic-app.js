(() => {
  'use strict';

  const E = window.FOOD_PICKER_ENGINE;
  const MENU = typeof FOODS !== 'undefined' && Array.isArray(FOODS) ? FOODS : [];
  const MAX_HISTORY = 12;
  const $ = id => document.getElementById(id);

  const screens = {
    intro: $('intro'),
    quiz: $('quiz'),
    loading: $('loading'),
    result: $('result')
  };

  const dom = {
    random: $('randomBtn'),
    start: $('startBtn'),
    step: $('qStep'),
    prog: $('prog'),
    text: $('qText'),
    choices: $('choices'),
    back: $('quizBackBtn'),
    loading: $('loadingLine'),
    result: $('result'),
    hero: $('resultHero'),
    personaFloat: $('personaFloat'),
    personaTitle: $('personaTitle'),
    personaVerdict: $('personaVerdict'),
    artBackground: $('personaBackground'),
    artPot: $('personaPot'),
    artCharacter: $('personaCharacter'),
    artFallback: $('resultArtFallback'),
    decision: $('resultDecision'),
    meal: $('mealName'),
    mealNative: $('mealNative'),
    verdict: $('psychVerdict'),
    altList: $('altList'),
    accept: $('acceptBtn'),
    reroll: $('rerollBtn'),
    reset: $('resetProfileBtn'),
    modal: $('shareModal'),
    status: $('shareStatus'),
    preview: $('sharePreview'),
    share: $('shareFileBtn'),
    download: $('downloadBtn'),
    copy: $('copyLinkBtn'),
    close: $('closeShareBtn')
  };

  const COPY = {
    'close-the-day': [
      '忙活一天，总算歇了。哪一下最像：得，今儿就到这儿？',
      ['门一关，出去溜达一圈', '洗个热水澡，先缓会儿', '把最后那点尾巴顺手扫了', '屋里开点动静，别那么空']
    ],
    'stalled-room': [
      '几个人聊半天，还是没聊出个所以然。你先来哪句？',
      ['先甭管了，随便定一个再说', '先看看，到底卡哪儿了', '所以你们到底想说啥？', '要不换个说法呗']
    ],
    'friend-response': [
      '你今儿看着不太对劲儿，朋友也看出来了。哪句最管用？',
      ['你是不是就憋着这事儿呢？', '行，我不问了，坐会儿吧', '得，这事儿我来', '先聊点别的吧']
    ],
    'weekend-memory': [
      '想起一个过得挺舒坦的周末，你先想起啥？',
      ['有一下特对：哎，今儿值了', '没啥大事，反正一整天都挺顺', '有个小事儿，想起来还挺乐', '说不上来，反正感觉对了']
    ],
    'inhabited-room': [
      '一个地方住久了，哪一下会让你觉得：嗯，这儿算我的了？',
      ['这东西就得在这儿，挪哪儿都不对', '什么东西都得有自己的地儿', '光线、声音、屋里那股味儿都对了', '有个地方能一屁股窝进去']
    ],
    'calibrate-heat': [
      '白捡一个下午，你准备怎么混过去？',
      ['出门，去个没去过的地儿', '不安排，溜达到哪儿算哪儿', '把一直碍眼的破事儿顺手清了', '就在熟悉的街边晃悠晃悠']
    ],
    'calibrate-texture': [
      '有人发来半截话，看得人云里雾里。你更想回哪句？',
      ['那你到底想说啥？', '先放着吧，他想说再说', '你意思是这个，对吧？', '先说你怎么了，别的回头再聊']
    ],
    'calibrate-focus': [
      '一件事折腾老半天，总算完了。哪一下最痛快？',
      ['最后一下卡上了，咔，齐活', '那堆零碎终于都顺了', '有人说：最难那块你真弄明白了', '第二天起来，这事儿已经翻篇了']
    ],
    'calibrate-meaning': [
      '用了好多年的东西坏了。你第一反应怎么弄？',
      ['照原样修，别瞎改', '拆了，能用的改点别的', '留块最有念想的，别的算了', '重新做一个现在顺手的']
    ],
    'world-request': [
      '接下来的两个小时，你最希望世界对你做什么？',
      ['别让我选了，真的', '想爽一把，把人叫醒', '好歹给今天收个尾', '闹点动静，别太安静']
    ],
    bandwidth: [
      '今晚这顿，你还愿意费多少心思？',
      ['一步到位，别折腾', '稍微费点事也成', '今儿还有精神，认真弄弄', '咋都行，别太麻烦']
    ]
  };

  const EXTRA_PROFILE = [
    ['plan-cancelled', '本来约好出门，临了对方来一句：今儿算了吧。你第一反应？', [
      ['↗', '那我自己出去溜达', { heat: 2, focus: 1 }],
      ['≈', '那正好，躺会儿', { heat: -2, texture: -1 }],
      ['?', '咋了？出啥事儿了？', { texture: 2, meaning: 1 }],
      ['↺', '行，那改天换个玩法', { meaning: -2, focus: -1 }]
    ]],
    ['movie-talk', '一部电影看完了，跟人聊起来你最容易先说哪句？', [
      ['✦', '就那个镜头，真行', { focus: 2, heat: 1 }],
      ['—', '整体挺顺，没哪儿特别掉链子', { focus: -2, heat: -1 }],
      ['◌', '那个人演得真像那么回事儿', { meaning: 2, texture: 1 }],
      ['∞', '我就喜欢它把几件破事儿串到一块儿', { meaning: -2, focus: -1 }]
    ]],
    ['wrong-turn', '出去玩走错路了，多绕二十分钟。你一般咋想？', [
      ['↗', '来都来了，顺路看看呗', { heat: 2, meaning: -1 }],
      ['!', '先把路找回来，别越走越偏', { texture: 2, focus: 1 }],
      ['≈', '没事儿，慢慢走，反正也不赶', { heat: -2, texture: -1 }],
      ['⌁', '记住这破岔路，下回别再走岔了', { meaning: 2, focus: 1 }]
    ]],
    ['gift-stays', '别人送你个东西，哪种最容易一直留着？', [
      ['●', '正好就是我缺的那个', { focus: 2, meaning: 1 }],
      ['⌁', '不值钱，但他真知道我啥脾气', { meaning: 2, texture: 1 }],
      ['✦', '包装、卡片、那点小心思全在点儿上', { meaning: -2, focus: 1 }],
      ['○', '说不上哪儿好，反正舍不得扔', { focus: -2, texture: -1 }]
    ]],
    ['change-place', '一群人临时说换地方，你最容易回哪句？', [
      ['→', '走呗，换', { heat: 2, focus: 1 }],
      ['?', '等等，先说去哪儿', { texture: 2, meaning: 1 }],
      ['…', '都行，别来回折腾就成', { heat: -2, texture: -1 }],
      ['↺', '那干脆换个事儿干呗', { meaning: -2, focus: -1 }]
    ]],
    ['halfway-wrong', '一件事做到一半，突然发现原来那招不太行。你咋办？', [
      ['↗', '先改呗，能接着弄就行', { heat: 2, focus: 1 }],
      ['!', '停一下，先看看哪儿不对', { texture: 2, meaning: 1 }],
      ['●', '保住最要紧那块，别全推倒', { focus: 2, meaning: 1 }],
      ['↺', '那就重来，旧的别硬救', { meaning: -2, heat: 1 }]
    ]],
    ['rain-plan', '本来安排得好好的，突然下大雨。你更像哪种？', [
      ['↗', '换个地方，照样出去', { heat: 2, meaning: -1 }],
      ['≈', '得，回家窝着也挺好', { heat: -2, texture: -1 }],
      ['!', '先看看雨多大，别瞎折腾', { texture: 2, meaning: 1 }],
      ['⌘', '那就临时整点别的', { meaning: -2, focus: -1 }]
    ]]
  ].map(([id, text, options]) => ({
    id,
    text,
    hint: '',
    options: options.map(([icon, title, axis]) => ({ icon, title, sub: '', axis }))
  }));

  const EXTRA_DAILY = [
    ['room-noise', '现在屋里要开点声音，你想开到哪档？', [
      ['○', '安静点儿，谁也别找我', { comfort: 4, easy: 3, familiar: 2 }],
      ['♬', '随便开点东西，别太空', { comfort: 2, social: 2, familiar: 2 }],
      ['!', '来点带劲的，醒醒', { stimulus: 5, spicy: 2, crisp: 1 }],
      ['◉', '最好来个人，坐一桌', { social: 5, shareable: 4, comfort: 1 }]
    ]],
    ['day-tail', '今天要是现在就翻篇，你想留个啥尾巴？', [
      ['—', '啥也别留，赶紧过去', { easy: 5, comfort: 3, familiar: 1 }],
      ['!', '来点爽的，别白熬一天', { reward: 4, stimulus: 3, spicy: 2 }],
      ['✦', '有个小惊喜就行', { novel: 4, reward: 3, ritual: 2 }],
      ['♬', '跟人说两句，别闷着', { social: 5, shareable: 3 }]
    ]],
    ['inside-weather', '你现在这人，大概啥天气？', [
      ['☁', '蔫了，别折腾', { comfort: 5, easy: 4 }],
      ['↗', '闷得慌，得来点风', { light: 3, fresh: 3, novel: 2 }],
      ['!', '有点炸，想来点更狠的', { stimulus: 5, spicy: 4 }],
      ['◉', '还行，想热闹热闹', { social: 4, reward: 2, shareable: 3 }]
    ]]
  ].map(([id, text, options]) => ({
    id,
    text,
    hint: '',
    options: options.map(([icon, title, mood]) => ({ icon, title, sub: '', mood }))
  }));

  let queue = [];
  let profileQuestions = [];
  let dailyQuestions = [];
  let answers = [];
  let step = 0;
  let baseProfile = null;
  let profile = null;
  let daily = null;
  let fortune = null;
  let ranked = [];
  let rankIndex = 0;
  let directMode = false;
  let currentPersona = null;
  let currentArt = null;
  let artRenderToken = 0;
  let shareAsset = null;
  let shareBusy = false;

  function cloneQuestion(question) {
    if (!question) return null;
    const copy = COPY[question.id];
    return {
      ...question,
      text: copy?.[0] || question.text,
      hint: '',
      options: (question.options || []).map((option, index) => ({
        ...option,
        title: copy?.[1]?.[index] || option.title,
        sub: ''
      }))
    };
  }

  function shuffle(items) {
    const values = items.slice();
    for (let index = values.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }

  function coverage(question) {
    const set = new Set();
    (question.options || []).forEach(option => {
      Object.keys(option.axis || {}).forEach(key => set.add(key));
    });
    return set;
  }

  function pickProfileQuestions() {
    const pool = [...E.PROFILE_QUESTIONS.map(cloneQuestion), ...EXTRA_PROFILE];
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const picked = shuffle(pool).slice(0, 5);
      const count = Object.fromEntries(E.AXES.map(axis => [axis.key, 0]));
      picked.forEach(question => coverage(question).forEach(key => { count[key] += 1; }));
      if (E.AXES.every(axis => count[axis.key] >= 2)) return picked;
    }
    return E.PROFILE_QUESTIONS.slice(0, 5).map(cloneQuestion);
  }

  function pickDailyQuestions() {
    const world = cloneQuestion(E.DAILY_QUESTIONS.find(question => question.id === 'world-request'));
    const bandwidth = cloneQuestion(E.DAILY_QUESTIONS.find(question => question.id === 'bandwidth'));
    const pool = [world, ...EXTRA_DAILY].filter(Boolean);
    const first = pool[Math.floor(Math.random() * pool.length)] || world;
    return [first, bandwidth].filter(Boolean);
  }

  function parse(value, fallback = null) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function storageGet(key, fallback = null) {
    try { return parse(localStorage.getItem(key), fallback); } catch (_) { return fallback; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Storage is optional. */ }
  }

  function history() {
    const values = storageGet(E.HISTORY_STORAGE_KEY, []);
    return Array.isArray(values) ? values.filter(Boolean).slice(0, MAX_HISTORY) : [];
  }

  function addHistory(name) {
    storageSet(
      E.HISTORY_STORAGE_KEY,
      [name, ...history().filter(item => item !== name)].slice(0, MAX_HISTORY)
    );
  }

  function safeScrollTop() {
    const reduced = typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    } catch (_) {
      try { window.scrollTo(0, 0); } catch (_) { /* Scrolling is cosmetic. */ }
    }
  }

  function show(target) {
    Object.values(screens).forEach(screen => {
      if (screen) screen.classList.toggle('hidden', screen !== target);
    });
    safeScrollTop();
  }

  function toast(message) {
    const node = $('toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.remove('on'), 1800);
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  function decorateProfile(value, day, seed) {
    const archetype = E.archetypeById(value.archetypeId);
    const word = E.chooseFloatWord(archetype, day, seed);
    return {
      ...value,
      archetype,
      word,
      title: `${archetype.pot}${word}${archetype.role}`
    };
  }

  function startPsych() {
    try {
      directMode = false;
      currentArt = null;
      currentPersona = null;
      baseProfile = null;
      profile = null;
      daily = null;
      fortune = null;
      profileQuestions = pickProfileQuestions();
      dailyQuestions = pickDailyQuestions();
      queue = profileQuestions.slice();
      answers = [];
      step = 0;
      show(screens.quiz);
      renderQuestion();
    } catch (error) {
      console.error('[FoodPicker] failed to start questionnaire', error);
      show(screens.intro);
      toast('刚才卡了一下，再点一次');
    }
  }

  function safeProfileMeal(raw) {
    try {
      return typeof E.profileMeal === 'function'
        ? E.profileMeal(raw)
        : { ...raw, tags: [], cross: [] };
    } catch (error) {
      console.error('[FoodPicker] failed to map meal', error);
      return { ...raw, tags: [], cross: [] };
    }
  }

  function startRandom() {
    if (!MENU.length) {
      toast('菜单没接上');
      return;
    }

    try {
      directMode = true;
      profile = null;
      daily = null;
      fortune = null;
      currentArt = null;
      currentPersona = null;
      const recent = new Set(history().slice(0, 8));
      const pool = MENU.filter(item => item?.name && !recent.has(item.name));
      const source = pool.length ? pool : MENU.filter(item => item?.name);
      const raw = source[Math.floor(Math.random() * source.length)];
      ranked = raw ? [safeProfileMeal(raw)] : [];
      rankIndex = 0;
      renderResult();
    } catch (error) {
      console.error('[FoodPicker] failed to pick a random meal', error);
      toast('刚才卡了一下，再点一次');
    }
  }

  function questionTotal() {
    return profileQuestions.length + 1 + dailyQuestions.length;
  }

  function renderQuestion() {
    const question = queue[step];
    if (!question) {
      calculatePsych();
      return;
    }

    const total = questionTotal() || 8;
    dom.step.textContent = `第 ${step + 1} 题 / ${total}`;
    dom.prog.style.width = `${((step + 1) / total) * 100}%`;
    dom.text.textContent = question.text;
    dom.choices.innerHTML = '';
    dom.back.disabled = false;
    dom.back.textContent = step === 0 ? '← 回去' : '← 上一题';

    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';

      const icon = document.createElement('span');
      icon.className = 'ico';
      icon.textContent = option.icon || '·';

      const copy = document.createElement('span');
      const label = document.createElement('b');
      label.textContent = option.title;
      copy.appendChild(label);
      button.append(icon, copy);
      button.addEventListener('click', () => chooseOption(index));
      dom.choices.appendChild(button);
    });
  }

  function chooseOption(index) {
    const question = queue[step];
    const option = question?.options[index];
    if (!question || !option) return;

    answers.push({
      questionId: question.id,
      kind: option.mood ? 'daily' : 'profile',
      option
    });

    if (step === profileQuestions.length - 1) {
      const profileAnswers = answers
        .filter(item => item.kind === 'profile')
        .map(item => item.option);
      const calibrator = cloneQuestion(E.getCalibrationQuestion(profileAnswers));
      queue = [...profileQuestions, calibrator, ...dailyQuestions].filter(Boolean);
    }

    step += 1;
    if (step >= queue.length) calculatePsych();
    else renderQuestion();
  }

  function goBack() {
    if (step <= 0) {
      show(screens.intro);
      return;
    }

    step -= 1;
    answers.pop();
    if (step < profileQuestions.length) queue = profileQuestions.slice();
    renderQuestion();
  }

  function calculatePsych() {
    if (!E || !MENU.length) {
      toast('菜单没接上');
      return;
    }

    show(screens.loading);
    const lines = [
      '有几道菜已经挤到前面了。',
      '刚才那些答案，正在偷偷往吃的上拐。',
      '差不多了。',
      '行，就看它落哪一口。'
    ];
    let cursor = 0;
    dom.loading.textContent = lines[0];
    const timer = setInterval(() => {
      cursor = (cursor + 1) % lines.length;
      dom.loading.textContent = lines[cursor];
    }, 420);

    try {
      const profileAnswers = answers
        .filter(item => item.kind === 'profile')
        .map(item => item.option);
      const dailyAnswers = answers
        .filter(item => item.kind === 'daily')
        .map(item => item.option);

      baseProfile = E.buildProfile(
        profileAnswers,
        `${todayKey()}:${profileAnswers.map(item => item.title).join('|')}`
      );
      daily = E.buildDaily(dailyAnswers);
      const seed = `${todayKey()}:${baseProfile.archetypeId}:${daily.selections.join('|')}`;
      profile = decorateProfile(baseProfile, daily, seed);
      fortune = E.fortuneFor(`${seed}:${new Date().getHours()}`);

      const scored = E.rankMeals(MENU, profile, daily, {}, {
        seed,
        fortune,
        history: history()
      });
      ranked = E.weightedDraw(scored, Math.min(8, scored.length), seed);
      rankIndex = 0;

      setTimeout(() => {
        clearInterval(timer);
        if (!ranked.length) {
          show(screens.intro);
          toast('今天这菜单没接上，刷新一下再来');
          return;
        }
        renderResult();
      }, 650);
    } catch (error) {
      clearInterval(timer);
      console.error('[FoodPicker] failed to calculate recommendation', error);
      show(screens.intro);
      toast('刚才卡了一下，再来一遍');
    }
  }

  function currentMeal() {
    return ranked[rankIndex % ranked.length] || null;
  }

  function verdictFor(meal) {
    if (directMode) return '不分析了，就它。';

    const values = profile.values;
    const clauses = [];
    clauses.push(values.heat >= 0 ? '今儿想来点动静' : '今儿先慢一点');
    clauses.push(values.texture >= 0 ? '嘴里也得有点口感' : '吃着顺口点更舒服');

    if ((daily.mood.easy || 0) >= 4) clauses.push('还得省点事');
    else if ((daily.mood.reward || 0) >= 4) clauses.push('好歹给今天收个尾');
    else if ((daily.mood.social || 0) >= 4) clauses.push('最好再来点人气');
    else if ((daily.mood.light || 0) >= 4) clauses.push('这会儿别吃太顶的');
    else if ((daily.mood.stimulus || 0) >= 4) clauses.push('再给点劲儿');

    return `${clauses.join('，')}。先吃${meal.name}。`;
  }

  function fitMealTitle() {
    const node = dom.meal;
    if (!node) return;
    node.style.fontSize = '';
    node.style.textOverflow = 'clip';
    let size = parseFloat(getComputedStyle(node).fontSize);
    while (node.scrollWidth > node.clientWidth && size > 27) {
      size -= 1;
      node.style.fontSize = `${size}px`;
    }
    if (node.scrollWidth > node.clientWidth) node.style.textOverflow = 'ellipsis';
  }

  async function renderArt(meal) {
    const token = ++artRenderToken;
    currentArt = null;
    [dom.artBackground, dom.artPot, dom.artCharacter].forEach(layer => {
      layer.hidden = true;
      layer.removeAttribute('src');
    });
    dom.artFallback.hidden = false;

    if (directMode || !profile || !window.FoodPickerPersonaArt) return;

    const detail = currentPersona || window.FoodPickerPersonaArt.describe(profile);
    if (!detail) return;
    dom.artBackground.src = detail.backgroundUrl;
    dom.artPot.src = detail.potUrl;
    dom.artCharacter.src = detail.characterUrl;

    try {
      const art = await window.FoodPickerPersonaArt.load(profile, meal);
      if (token !== artRenderToken || !art) return;
      currentArt = art;
      dom.artBackground.hidden = false;
      dom.artPot.hidden = false;
      dom.artCharacter.hidden = false;
      dom.artFallback.hidden = true;
    } catch (error) {
      if (token !== artRenderToken) return;
      currentArt = null;
      [dom.artBackground, dom.artPot, dom.artCharacter].forEach(layer => {
        layer.hidden = true;
        layer.removeAttribute('src');
      });
      dom.artFallback.hidden = false;
      console.error('[FoodPicker] persona art failed', error);
    }
  }

  function renderResult() {
    const meal = currentMeal();
    if (!meal) return;

    show(screens.result);
    dom.result.classList.toggle('direct-mode', directMode);
    dom.personaFloat.classList.toggle('hidden', directMode);
    dom.decision.hidden = directMode;
    dom.verdict.hidden = !directMode;
    dom.altList.hidden = !directMode;

    if (!directMode) {
      currentPersona = window.FoodPickerPersonaArt?.describe(profile) || null;
      dom.personaTitle.textContent = currentPersona?.title || profile.title;
      dom.personaVerdict.textContent = currentPersona?.verdict || '';
      dom.hero.dataset.theme = currentPersona?.theme || 'light';
    } else {
      currentPersona = null;
      dom.personaTitle.textContent = '';
      dom.personaVerdict.textContent = '';
      delete dom.hero.dataset.theme;
    }

    dom.meal.textContent = meal.name;
    dom.meal.title = meal.name;
    dom.mealNative.textContent = meal.native || '';
    dom.verdict.textContent = verdictFor(meal);

    const alternatives = directMode
      ? shuffle(MENU.filter(item => item?.name && item.name !== meal.name))
          .slice(0, 3)
          .map(item => safeProfileMeal(item))
      : [];

    dom.altList.innerHTML = alternatives
      .map(item => `<button class="alt" type="button" data-name="${escapeAttr(item.name)}">${escapeHtml(item.name)}</button>`)
      .join('');

    dom.altList.querySelectorAll('.alt').forEach(button => {
      button.addEventListener('click', () => {
        const name = button.dataset.name;
        if (directMode) {
          ranked = [alternatives.find(item => item.name === name) || meal];
          rankIndex = 0;
        } else {
          const index = ranked.findIndex(item => item.name === name);
          if (index >= 0) rankIndex = index;
        }
        renderResult();
      });
    });

    requestAnimationFrame(fitMealTitle);
    renderArt(meal);
  }

  function reroll() {
    if (directMode) {
      startRandom();
      return;
    }
    if (!ranked.length) return;
    rankIndex = (rankIndex + 1) % Math.min(6, ranked.length);
    renderResult();
  }

  function reset() {
    closeShareModal();
    show(screens.intro);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  const SHARE_FONT = '"SmileySansWeb","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  const SHARE_STEADY = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  const FALLBACK_URL = 'https://github.com/StarObserverPro/FoodPicker';

  function setFont(ctx, weight, size, family = SHARE_FONT) {
    ctx.font = `${weight} ${size}px ${family}`;
  }

  function wrapLines(ctx, value, maxWidth) {
    const chars = Array.from(String(value || '').trim());
    const lines = [];
    let line = '';
    chars.forEach(char => {
      const next = line + char;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = next;
      }
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function drawFitted(ctx, value, x, y, width, options = {}) {
    const maxLines = options.maxLines || 2;
    const minSize = options.minSize || 40;
    const weight = options.weight || 400;
    const family = options.family || SHARE_FONT;
    const lineRatio = options.lineRatio || 1.18;
    let size = options.startSize || 72;
    let lines = [];

    while (size >= minSize) {
      setFont(ctx, weight, size, family);
      lines = wrapLines(ctx, value, width);
      if (lines.length <= maxLines) break;
      size -= 2;
    }

    lines = lines.slice(0, maxLines);
    const lineHeight = Math.round(size * lineRatio);
    setFont(ctx, weight, size, family);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + Math.max(0, lines.length - 1) * lineHeight;
  }

  function cleanPageUrl() {
    if (location.origin && location.origin !== 'null') {
      return new URL('/', location.origin).toString();
    }
    return FALLBACK_URL;
  }

  function resultShareUrl(meal) {
    if (!profile) return cleanPageUrl();
    const origin = location.origin && location.origin !== 'null' ? location.origin : '';
    return E.makeShareUrl(meal, profile.title, {
      origin,
      pathname: location.pathname || '/'
    });
  }

  function drawShareCard(meal) {
    if (!window.FoodPickerQR) throw new Error('QR renderer unavailable');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1620;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.fillStyle = '#f7f8f6';
    ctx.fillRect(0, 0, 1080, 1620);

    if (!directMode && currentArt?.image) {
      const image = currentArt.image;
      ctx.drawImage(image, 0, 0, 1080, 1350);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 1080, 1260);
      gradient.addColorStop(0, '#f7f8f6');
      gradient.addColorStop(1, '#d9e2e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1260);
    }

    if (!directMode && currentPersona) {
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      roundRect(ctx, 54, 58, 972, 324, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.72)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#2d2925';
      drawFitted(ctx, currentPersona.title, 88, 126, 900, {
        maxLines: 1, startSize: 54, minSize: 40, weight: 400
      });
      ctx.fillStyle = '#4d4944';
      setFont(ctx, 400, 27, SHARE_STEADY);
      wrapLines(ctx, currentPersona.verdict, 894).slice(0, 4)
        .forEach((line, index) => ctx.fillText(line, 88, 190 + index * 43));
    }

    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.fillRect(0, 1240, 1080, 380);
    ctx.fillStyle = '#746d66';
    setFont(ctx, 400, 27, SHARE_FONT);
    ctx.fillText(directMode ? '不分析了，就它。' : '今儿不折腾了，就吃这个。', 62, 1304);

    ctx.fillStyle = '#2d2925';
    const mealBottom = drawFitted(ctx, meal.name, 62, 1384, 700, {
      maxLines: 2, startSize: 76, minSize: 48, weight: 400
    });
    if (meal.native && mealBottom < 1470) {
      ctx.fillStyle = '#817a73';
      setFont(ctx, 400, 22, SHARE_STEADY);
      ctx.fillText(meal.native, 64, Math.min(1518, mealBottom + 50));
    }

    const qrSize = 184;
    const qrX = 830;
    const qrY = 1360;
    ctx.fillStyle = '#fff';
    roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 22);
    ctx.fill();
    window.FoodPickerQR.paint(ctx, cleanPageUrl(), qrX, qrY, qrSize, {
      dark: '#2d2925',
      light: '#ffffff',
      quiet: 4
    });

    ctx.fillStyle = '#6f665c';
    setFont(ctx, 400, 22, SHARE_FONT);
    ctx.textAlign = 'right';
    ctx.fillText('扫码，再让运气管一顿。', 1014, 1588);
    ctx.textAlign = 'left';
    return canvas;
  }

  function dataUrlToBlob(dataUrl) {
    const [head, payload] = dataUrl.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new Blob([bytes], { type });
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      if (typeof canvas.toBlob === 'function') {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else {
            try { resolve(dataUrlToBlob(canvas.toDataURL('image/png'))); }
            catch (error) { reject(error); }
          }
        }, 'image/png');
        return;
      }

      try { resolve(dataUrlToBlob(canvas.toDataURL('image/png'))); }
      catch (error) { reject(error); }
    });
  }

  function openShareModal() {
    dom.modal.classList.remove('hidden');
    document.body.classList.add('share-open');
  }

  function closeShareModal() {
    dom.modal.classList.add('hidden');
    document.body.classList.remove('share-open');
  }

  async function generateShareImage() {
    const meal = currentMeal();
    if (!meal || shareBusy) return;

    shareBusy = true;
    addHistory(meal.name);
    openShareModal();
    dom.status.classList.remove('hidden');
    dom.status.textContent = '正在画图……';
    dom.preview.removeAttribute('src');
    dom.share.disabled = true;
    dom.download.disabled = true;

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      if (!directMode && !currentArt && profile && window.FoodPickerPersonaArt) {
        currentArt = await window.FoodPickerPersonaArt.load(profile, meal);
      }
      const canvas = drawShareCard(meal);
      const blob = await canvasBlob(canvas);
      const objectUrl = typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : canvas.toDataURL('image/png');

      if (shareAsset?.objectUrl?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') {
        URL.revokeObjectURL(shareAsset.objectUrl);
      }

      const fileName = `今天吃什么-${meal.name.replace(/[\\/:*?"<>|]/g, '-')}.png`;
      const file = typeof File === 'function'
        ? new File([blob], fileName, { type: 'image/png' })
        : null;

      shareAsset = {
        blob,
        objectUrl,
        fileName,
        file,
        meal,
        shareUrl: resultShareUrl(meal)
      };
      dom.preview.src = objectUrl;
      dom.status.classList.add('hidden');
      dom.share.disabled = false;
      dom.download.disabled = false;
    } catch (error) {
      console.error(error);
      dom.status.textContent = '刚才没画成，再点一次。';
      toast('刚才没画成，再来一下');
    } finally {
      shareBusy = false;
    }
  }

  function downloadShareImage() {
    if (!shareAsset) return;
    const anchor = document.createElement('a');
    anchor.href = shareAsset.objectUrl;
    anchor.download = shareAsset.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  async function shareImage() {
    if (!shareAsset) return;
    try {
      const canShareFile = Boolean(
        shareAsset.file
        && navigator.share
        && (!navigator.canShare || navigator.canShare({ files: [shareAsset.file] }))
      );

      if (canShareFile) {
        await navigator.share({
          files: [shareAsset.file],
          title: directMode
            ? `今天就吃${shareAsset.meal.name}`
            : `${profile.title}·${shareAsset.meal.name}`,
          text: `今天吃${shareAsset.meal.name}。`
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `今天吃${shareAsset.meal.name}`,
          text: `今天吃${shareAsset.meal.name}。`,
          url: shareAsset.shareUrl
        });
      } else {
        downloadShareImage();
        toast('图先存下来了');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast('没发出去，先存图吧');
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
    } catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    toast('链接抄好了');
  }

  function requiredNodesReady() {
    const required = [
      screens.intro, screens.quiz, screens.loading, screens.result,
      dom.random, dom.start, dom.step, dom.prog, dom.text, dom.choices, dom.back,
      dom.loading, dom.result, dom.personaFloat, dom.personaTitle, dom.personaVerdict,
      dom.artBackground, dom.artPot, dom.artCharacter, dom.artFallback, dom.decision,
      dom.meal, dom.mealNative, dom.verdict, dom.altList,
      dom.accept, dom.reroll, dom.reset, dom.modal, dom.status, dom.preview,
      dom.share, dom.download, dom.copy, dom.close
    ];
    return required.every(Boolean);
  }

  function wire() {
    dom.random.addEventListener('click', startRandom);
    dom.start.addEventListener('click', startPsych);
    dom.back.addEventListener('click', goBack);
    dom.reroll.addEventListener('click', reroll);
    dom.reset.addEventListener('click', reset);
    dom.accept.addEventListener('click', generateShareImage);
    dom.close.addEventListener('click', closeShareModal);
    dom.share.addEventListener('click', shareImage);
    dom.download.addEventListener('click', downloadShareImage);
    dom.copy.addEventListener('click', () => {
      const meal = currentMeal();
      if (meal) copyText(resultShareUrl(meal));
    });
    dom.modal.addEventListener('click', event => {
      if (event.target === dom.modal) closeShareModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeShareModal();
    });
  }

  function disableEntrances(message) {
    [dom.random, dom.start].forEach(button => {
      if (!button) return;
      button.disabled = true;
      button.setAttribute('aria-disabled', 'true');
    });
    if (message) toast(message);
  }

  function boot() {
    if (!requiredNodesReady()) {
      console.error('[FoodPicker] required interaction nodes are missing');
      document.documentElement.dataset.appError = 'dom';
      disableEntrances('页面没接完整，刷新一下');
      return;
    }

    if (!E) {
      console.error('[FoodPicker] FOOD_PICKER_ENGINE is missing');
      document.documentElement.dataset.appError = 'engine';
      disableEntrances('页面没接完整，刷新一下');
      return;
    }

    if (!MENU.length) {
      console.error('[FoodPicker] menu is empty');
      document.documentElement.dataset.appError = 'menu';
      disableEntrances('菜单没接上');
      return;
    }

    wire();
    document.documentElement.dataset.appReady = 'true';
    window.FoodPickerApp = Object.freeze({
      version: 'landing-r2',
      startRandom,
      startPsych
    });

    if ('serviceWorker' in navigator) {
      addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
    }
  }

  boot();
})();
