(() => {
  'use strict';

  const E = window.FOOD_PICKER_ENGINE;
  const MENU = typeof FOODS !== 'undefined' && Array.isArray(FOODS) ? FOODS : [];
  const MAX_HISTORY = 12;
  const DIRECT_ART_URLS = Object.freeze([
    '/assets/direct/direct-food-01-full-v19.webp',
    '/assets/direct/direct-food-02-full-v19.webp',
    '/assets/direct/direct-food-03-full-v19.webp',
    '/assets/direct/direct-food-04-full-v19.webp',
    '/assets/direct/direct-food-05-full-v19.webp'
  ]);
  const QUIZ_BACKGROUND_URLS = Object.freeze([
    '/assets/quiz/quiz-ingredients-border-v19.webp',
    '/assets/quiz/quiz-table-spread-v19.webp',
    '/assets/quiz/quiz-breakfast-place-v19.webp',
    '/assets/quiz/quiz-scattered-plates-v19.webp',
    '/assets/quiz/quiz-dim-sum-table-v19.webp',
    '/assets/quiz/quiz-pastel-feast-v19.webp'
  ]);
  const RECENT_PROFILE_QUESTIONS_KEY = 'foodpicker.quiz-recent.v1';
  const directImageCache = new Map();
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
    quizBackground: $('quizBackground'),
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
    directArt: $('directArt'),
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
      '忙了一天，终于可以歇下来了。做完哪件事，你才觉得今天真的结束了？',
      ['出门走一圈，把工作的事放一放', '洗个热水澡，先缓会儿', '把最后一件没做完的事收个尾', '放点熟悉的音乐，屋里就没那么空了']
    ],
    'stalled-room': [
      '几个人商量了半天，还是没定下来。你会先说什么？',
      ['先挑个能做的试试，细节再慢慢改', '先看看，到底卡哪儿了', '有个问题咱们一直没说清楚', '换个角度想，这几个主意也许能合起来']
    ],
    'friend-response': [
      '朋友看出你心情不太好。听到哪句话，你会松一口气？',
      ['你是不是一直在为这件事烦心？', '行，我不问了，坐会儿吧', '最麻烦的那件事，我来帮你', '先聊点别的吧']
    ],
    'weekend-memory': [
      '回想一个过得挺舒服的周末，你最先想起什么？',
      ['某个特别开心的瞬间，现在还记得', '没发生什么大事，一整天都很自在', '一个不起眼的小细节，想起来还会笑', '几件小事连在一起，才有了那个周末的感觉']
    ],
    'inhabited-room': [
      '一个地方住久了，什么时候你会觉得，这里有了自己的样子？',
      ['喜欢的那件东西摆好了，怎么看都合适', '东西各有各的位置，伸手就能找到', '光线、声音和气味都熟悉了，进门就觉得舒服', '有个舒服的角落，一坐下就不想动']
    ],
    'calibrate-heat': [
      '临时空出一个下午，你想怎么过？',
      ['出门，去个没去过的地儿', '不安排，溜达到哪儿算哪儿', '把拖了很久的那件小事做完', '在熟悉的地方待着，慢慢放松下来']
    ],
    'calibrate-texture': [
      '有人发来一句没头没尾的话，你会怎么接？',
      ['你具体指什么？说清楚一点吧', '先放着吧，他想说再说', '我理解的是这个意思，对吗？', '先说你怎么了，别的回头再聊']
    ],
    'calibrate-focus': [
      '忙了很久的一件事终于做完了。哪个瞬间最让你满足？',
      ['最后一个难题解决了，心里一下踏实了', '各个部分终于接上了，整件事顺了起来', '有人注意到了我花心思最多的地方', '第二天起来，这事儿已经翻篇了']
    ],
    'calibrate-meaning': [
      '用了好多年的东西坏了，你会想怎么处理？',
      ['照原来的样子修好，用着还是熟悉', '把能用的部分留下，改成别的东西', '留下一小块，看到它还能想起从前', '重新设计一下，让它更适合现在的生活']
    ],
    'world-request': [
      '接下来的两个小时，你最想怎么过？',
      ['想省点心，不用再做决定', '想来点新鲜刺激的，提提精神', '想好好吃一顿，给今天留点好心情', '想找人一起吃饭，聊上几句']
    ],
    bandwidth: [
      '今晚这顿，你还愿意费多少心思？',
      ['一步到位，别折腾', '稍微费点事也成', '今天还有精神，想认真准备一顿', '可以花点心思，只想吃得清爽些']
    ]
  };

  const EXTRA_PROFILE = [
    ['plan-cancelled', '本来约好出门，对方临时说去不了了。你会怎么想？', [
      ['↗', '那我自己出去溜达', { heat: 2, focus: 1 }],
      ['≈', '那正好，躺会儿', { heat: -2, texture: -1 }],
      ['?', '咋了？出啥事儿了？', { texture: 2, meaning: 1 }],
      ['↺', '行，那改天换个玩法', { meaning: -2, focus: -1 }]
    ]],
    ['movie-talk', '一部电影看完了，跟人聊起来你最容易先说哪句？', [
      ['✦', '有个镜头特别好，我一直记着', { focus: 2, heat: 1 }],
      ['—', '从头到尾都看得进去，节奏很舒服', { focus: -2, heat: -1 }],
      ['◌', '那个人演得很自然，像生活里真有这么个人', { meaning: 2, texture: 1 }],
      ['∞', '几件看着无关的小事，最后居然连起来了', { meaning: -2, focus: -1 }]
    ]],
    ['wrong-turn', '出去玩走错路了，多绕二十分钟。你一般咋想？', [
      ['↗', '来都来了，顺路看看呗', { heat: 2, meaning: -1 }],
      ['!', '先把路找回来，别越走越偏', { texture: 2, focus: 1 }],
      ['≈', '没事儿，慢慢走，反正也不赶', { heat: -2, texture: -1 }],
      ['⌁', '把这个路口记住，下回就认得了', { meaning: 2, focus: 1 }]
    ]],
    ['gift-stays', '别人送你个东西，哪种最容易一直留着？', [
      ['●', '正好就是我缺的那个', { focus: 2, meaning: 1 }],
      ['⌁', '东西很普通，却正好合我的心意', { meaning: 2, texture: 1 }],
      ['✦', '东西、包装和卡片放在一起，特别有心意', { meaning: -2, focus: 1 }],
      ['○', '说不上哪儿好，反正舍不得扔', { focus: -2, texture: -1 }]
    ]],
    ['change-place', '一群人临时说换地方，你最容易回哪句？', [
      ['→', '好啊，咱们换个地方', { heat: 2, focus: 1 }],
      ['?', '等等，先说去哪儿', { texture: 2, meaning: 1 }],
      ['…', '都行，别来回折腾就成', { heat: -2, texture: -1 }],
      ['↺', '那干脆换个事儿干呗', { meaning: -2, focus: -1 }]
    ]],
    ['halfway-wrong', '一件事做到一半，突然发现原来那招不太行。你咋办？', [
      ['↗', '先改呗，能接着弄就行', { heat: 2, focus: 1 }],
      ['!', '停一下，先看看哪儿不对', { texture: 2, meaning: 1 }],
      ['●', '保住最要紧那块，别全推倒', { focus: 2, meaning: 1 }],
      ['↺', '换个办法重来，也许更合适', { meaning: -2, heat: 1 }]
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
    ['room-noise', '现在待在屋里，你想听见什么声音？', [
      ['○', '安静点儿，谁也别找我', { comfort: 4, easy: 3, familiar: 2 }],
      ['♬', '放点熟悉的音乐，有声音陪着就好', { comfort: 2, social: 2, familiar: 2 }],
      ['!', '放首带劲的歌，提提精神', { stimulus: 5, spicy: 2, crisp: 1 }],
      ['◉', '想听见朋友说话，一起坐着聊聊天', { social: 5, shareable: 4, comfort: 1 }]
    ]],
    ['day-tail', '今天快结束了，你还想做点什么？', [
      ['—', '什么也不做了，早点休息', { easy: 5, comfort: 3, familiar: 1 }],
      ['!', '找点痛快的事做，换换心情', { reward: 4, stimulus: 3, spicy: 2 }],
      ['✦', '有个小惊喜就行', { novel: 4, reward: 3, ritual: 2 }],
      ['♬', '跟人说两句，别闷着', { social: 5, shareable: 3 }]
    ]],
    ['inside-weather', '如果用天气形容现在的心情，你会选哪一种？', [
      ['☁', '像阴天，没什么精神，想歇一会儿', { comfort: 5, easy: 4 }],
      ['↗', '有点闷，想吹吹风，换个心情', { light: 3, fresh: 3, novel: 2 }],
      ['!', '像雷雨前，憋着一股劲，想痛快一下', { stimulus: 5, spicy: 4 }],
      ['◉', '像晴天，心情不错，想找人热闹一下', { social: 4, reward: 2, shareable: 3 }]
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
  let quizBackgrounds = [];
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
  let currentDirectArtUrl = null;
  let lastDirectArtIndex = -1;
  let artRenderToken = 0;
  let shareAsset = null;
  let shareBusy = false;
  let shareTask = 0;

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

  function pickDirectArtUrl() {
    if (!DIRECT_ART_URLS.length) return '';
    if (DIRECT_ART_URLS.length === 1) return DIRECT_ART_URLS[0];
    if (lastDirectArtIndex < 0) {
      lastDirectArtIndex = Math.floor(Math.random() * DIRECT_ART_URLS.length);
    } else {
      const offset = 1 + Math.floor(Math.random() * (DIRECT_ART_URLS.length - 1));
      lastDirectArtIndex = (lastDirectArtIndex + offset) % DIRECT_ART_URLS.length;
    }
    return DIRECT_ART_URLS[lastDirectArtIndex];
  }

  function loadDirectImage(src) {
    if (directImageCache.has(src)) return directImageCache.get(src);
    const request = new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      const timer = setTimeout(() => {
        image.onload = image.onerror = null;
        image.src = '';
        reject(new Error(`direct result art timed out: ${src}`));
      }, 8000);
      image.onload = () => {
        clearTimeout(timer);
        resolve(image);
      };
      image.onerror = () => {
        clearTimeout(timer);
        reject(new Error(`direct result art failed: ${src}`));
      };
      image.src = src;
    }).catch(error => {
      directImageCache.delete(src);
      throw error;
    });
    directImageCache.set(src, request);
    return request;
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
    const stored = storageGet(RECENT_PROFILE_QUESTIONS_KEY, []);
    const recent = new Set(Array.isArray(stored) ? stored : []);
    const fresh = pool.filter(question => !recent.has(question.id));
    const sources = fresh.length >= 5 ? [fresh, pool] : [pool];

    for (const source of sources) {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const picked = shuffle(source).slice(0, 5);
        const count = Object.fromEntries(E.AXES.map(axis => [axis.key, 0]));
        picked.forEach(question => coverage(question).forEach(key => { count[key] += 1; }));
        if (!E.AXES.every(axis => count[axis.key] >= 2)) continue;

        const randomized = picked.map(question => ({
          ...question,
          options: shuffle(question.options || [])
        }));
        storageSet(RECENT_PROFILE_QUESTIONS_KEY, randomized.map(question => question.id));
        return randomized;
      }
    }

    const fallback = E.PROFILE_QUESTIONS.slice(0, 5).map(cloneQuestion).map(question => ({
      ...question,
      options: shuffle(question.options || [])
    }));
    storageSet(RECENT_PROFILE_QUESTIONS_KEY, fallback.map(question => question.id));
    return fallback;
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
      currentDirectArtUrl = null;
      baseProfile = null;
      profile = null;
      daily = null;
      fortune = null;
      profileQuestions = pickProfileQuestions();
      dailyQuestions = pickDailyQuestions();
      quizBackgrounds = shuffle(QUIZ_BACKGROUND_URLS);
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
      toast('菜单没有加载出来，请刷新重试');
      return;
    }

    try {
      directMode = true;
      profile = null;
      daily = null;
      fortune = null;
      currentArt = null;
      currentPersona = null;
      currentDirectArtUrl = pickDirectArtUrl();
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

    const backgroundUrl = step < profileQuestions.length
      ? quizBackgrounds[step % quizBackgrounds.length]
      : '';
    dom.quizBackground.hidden = !backgroundUrl;
    if (backgroundUrl) dom.quizBackground.src = backgroundUrl;
    else dom.quizBackground.removeAttribute('src');

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
      toast('菜单没有加载出来，请刷新重试');
      return;
    }

    show(screens.loading);
    const lines = [
      '正在挑几道你可能想吃的菜。',
      '再看看哪道更合你今天的心情。',
      '差不多了。',
      '好，看看这次选中了什么。'
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
          toast('菜单没有加载出来，请刷新重试');
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
    clauses.push(values.heat >= 0 ? '今天想换换心情' : '今天想慢慢歇一会儿');
    clauses.push(values.texture >= 0 ? '吃点有嚼头的可能更合意' : '吃着顺口点更舒服');

    if ((daily.mood.easy || 0) >= 4) clauses.push('这顿也想吃得省心些');
    else if ((daily.mood.reward || 0) >= 4) clauses.push('想好好吃一顿，给今天留点好心情');
    else if ((daily.mood.social || 0) >= 4) clauses.push('有人一起吃就更好了');
    else if ((daily.mood.light || 0) >= 4) clauses.push('这顿想吃得清爽些');
    else if ((daily.mood.stimulus || 0) >= 4) clauses.push('口味也想吃得重一点');

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
    dom.directArt.hidden = true;
    dom.directArt.removeAttribute('src');
    dom.artFallback.hidden = false;

    if (directMode) {
      const url = currentDirectArtUrl || pickDirectArtUrl();
      currentDirectArtUrl = url;
      if (!url) return;
      dom.directArt.src = url;
      try {
        const image = await loadDirectImage(url);
        if (token !== artRenderToken) return;
        currentArt = Object.freeze({ image, url });
        dom.directArt.hidden = false;
        dom.artFallback.hidden = true;
      } catch (error) {
        if (token !== artRenderToken) return;
        currentArt = null;
        dom.directArt.hidden = true;
        dom.directArt.removeAttribute('src');
        dom.artFallback.hidden = false;
        console.error('[FoodPicker] direct result art failed', error);
      }
      return;
    }

    if (!profile || !window.FoodPickerPersonaArt) return;

    const detail = currentPersona || window.FoodPickerPersonaArt.describe(profile);
    if (!detail) return;
    try {
      const art = await window.FoodPickerPersonaArt.load(profile, meal, detail);
      if (token !== artRenderToken || !art) return;
      currentArt = art;
      dom.artBackground.src = art.layers?.background?.src || detail.backgroundUrl;
      dom.artPot.src = art.layers?.pot?.src || detail.potUrl;
      dom.artCharacter.src = art.layers?.character?.src || detail.characterUrl;
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

    closeShareModal();
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
          currentDirectArtUrl = pickDirectArtUrl();
          currentArt = null;
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

  function drawImageContain(ctx, image, x, y, width, height) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const scale = Math.min(width / sourceWidth, height / sourceHeight);
    const drawWidth = sourceWidth * scale;
    const drawHeight = sourceHeight * scale;
    const drawX = x + (width - drawWidth) / 2;
    const drawY = y + (height - drawHeight) / 2;
    ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
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

  function drawShareCard({ meal, art, persona, directMode }) {
    if (!window.FoodPickerQR) throw new Error('QR renderer unavailable');

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1620;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.fillStyle = '#f7f8f6';
    ctx.fillRect(0, 0, 1080, 1620);

    const artBottom = 1434;

    if (art?.image) {
      drawImageContain(ctx, art.image, 0, 0, 1080, artBottom);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, artBottom);
      gradient.addColorStop(0, '#f7f8f6');
      gradient.addColorStop(1, '#d9e2e5');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, artBottom);
    }

    if (!directMode && persona) {
      ctx.fillStyle = 'rgba(255,255,255,.70)';
      roundRect(ctx, 54, 58, 972, 324, 30);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.52)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#2d2925';
      drawFitted(ctx, persona.title, 88, 126, 900, {
        maxLines: 1, startSize: 54, minSize: 40, weight: 400
      });
      ctx.fillStyle = '#4d4944';
      setFont(ctx, 400, 27, SHARE_STEADY);
      wrapLines(ctx, persona.verdict, 894).slice(0, 4)
        .forEach((line, index) => ctx.fillText(line, 88, 190 + index * 43));
    }

    const contrast = ctx.createLinearGradient(0, 760, 0, artBottom);
    contrast.addColorStop(0, 'rgba(24,18,14,0)');
    contrast.addColorStop(.48, 'rgba(24,18,14,.12)');
    contrast.addColorStop(1, 'rgba(24,18,14,.84)');
    ctx.fillStyle = contrast;
    ctx.fillRect(0, 760, 1080, artBottom - 760);

    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.shadowColor = 'rgba(0,0,0,.72)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 3;
    setFont(ctx, 400, 27, SHARE_FONT);
    ctx.fillText(directMode ? '不分析了，就它。' : '想了半天，今天就吃这个吧。', 62, 1110);

    const mealBottom = drawFitted(ctx, meal.name, 62, 1204, 950, {
      maxLines: 2, startSize: 84, minSize: 50, weight: 400
    });
    if (meal.native && mealBottom < 1380) {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      setFont(ctx, 400, 22, SHARE_STEADY);
      ctx.fillText(meal.native, 64, Math.min(1390, mealBottom + 46));
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,.97)';
    ctx.fillRect(0, artBottom, 1080, 1620 - artBottom);

    const qrSize = 128;
    const qrX = 900;
    const qrY = 1463;
    ctx.fillStyle = '#fff';
    roundRect(ctx, qrX - 12, qrY - 12, qrSize + 24, qrSize + 24, 18);
    ctx.fill();
    window.FoodPickerQR.paint(ctx, cleanPageUrl(), qrX, qrY, qrSize, {
      dark: '#2d2925',
      light: '#ffffff',
      quiet: 4
    });

    ctx.fillStyle = '#2d2925';
    setFont(ctx, 400, 30, SHARE_FONT);
    ctx.fillText('今天吃什么，这是个问题。', 62, 1544);

    ctx.save();
    ctx.strokeStyle = '#6f665c';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(478, 1537);
    ctx.quadraticCurveTo(675, 1506, 862, 1527);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(862, 1527);
    ctx.lineTo(840, 1512);
    ctx.moveTo(862, 1527);
    ctx.lineTo(840, 1540);
    ctx.stroke();
    ctx.restore();
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
    shareTask += 1;
    shareBusy = false;
    dom.modal.classList.add('hidden');
    document.body.classList.remove('share-open');
  }

  function waitForOptional(promise, timeout) {
    return new Promise(resolve => {
      const timer = setTimeout(() => resolve(null), timeout);
      Promise.resolve(promise).then(value => {
        clearTimeout(timer);
        resolve(value);
      }, () => {
        clearTimeout(timer);
        resolve(null);
      });
    });
  }

  async function generateShareImage() {
    const meal = currentMeal();
    if (!meal || shareBusy) return;

    shareBusy = true;
    const task = ++shareTask;
    const artToken = artRenderToken;
    const active = () => task === shareTask && artToken === artRenderToken;
    const snapshot = {
      meal, profile, directMode, persona: currentPersona, art: currentArt,
      directArtUrl: currentDirectArtUrl, shareUrl: resultShareUrl(meal)
    };
    addHistory(meal.name);
    openShareModal();
    dom.status.classList.remove('hidden');
    dom.status.textContent = '正在生成分享图……';
    dom.preview.removeAttribute('src');
    dom.share.disabled = true;
    dom.download.disabled = true;

    try {
      if (document.fonts?.ready) await waitForOptional(document.fonts.ready, 1200);
      if (!active()) return;
      if (snapshot.directMode && !snapshot.art && snapshot.directArtUrl) {
        const image = await waitForOptional(loadDirectImage(snapshot.directArtUrl), 2500);
        snapshot.art = image ? { image } : null;
      } else if (!snapshot.directMode && !snapshot.art && snapshot.profile && window.FoodPickerPersonaArt) {
        snapshot.art = await waitForOptional(window.FoodPickerPersonaArt.load(
          snapshot.profile, meal, snapshot.persona
        ), 2500);
      }
      if (!active()) return;
      if (snapshot.art?.layers && !snapshot.art.image) {
        try {
          snapshot.art = { image: window.FoodPickerPersonaArt.compose(snapshot.art) };
        } catch (_) {
          snapshot.art = null;
        }
      }
      const canvas = drawShareCard(snapshot);
      const blob = await canvasBlob(canvas);
      if (!active()) return;
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
        shareUrl: snapshot.shareUrl,
        title: snapshot.directMode
          ? `今天就吃${meal.name}`
          : `${snapshot.profile.title}·${meal.name}`
      };
      dom.preview.src = objectUrl;
      dom.status.classList.add('hidden');
      dom.share.disabled = false;
      dom.download.disabled = false;
    } catch (error) {
      if (!active()) return;
      console.error(error);
      dom.status.textContent = '分享图没生成成功，请再试一次。';
      toast('分享图没生成成功，请再试一次');
    } finally {
      if (active()) shareBusy = false;
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
          title: shareAsset.title,
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
    toast('链接已复制');
  }

  function requiredNodesReady() {
    const required = [
      screens.intro, screens.quiz, screens.loading, screens.result,
      dom.random, dom.start, dom.step, dom.prog, dom.text, dom.choices, dom.quizBackground, dom.back,
      dom.loading, dom.result, dom.personaFloat, dom.personaTitle, dom.personaVerdict,
      dom.artBackground, dom.artPot, dom.artCharacter, dom.directArt, dom.artFallback, dom.decision,
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
      disableEntrances('页面没有加载完整，请刷新重试');
      return;
    }

    if (!E) {
      console.error('[FoodPicker] FOOD_PICKER_ENGINE is missing');
      document.documentElement.dataset.appError = 'engine';
      disableEntrances('页面没有加载完整，请刷新重试');
      return;
    }

    if (!MENU.length) {
      console.error('[FoodPicker] menu is empty');
      document.documentElement.dataset.appError = 'menu';
      disableEntrances('菜单没有加载出来，请刷新重试');
      return;
    }

    wire();
    document.documentElement.dataset.appReady = 'true';
    window.FoodPickerApp = Object.freeze({
      version: 'landing-r4',
      startRandom,
      startPsych
    });

    if ('serviceWorker' in navigator) {
      addEventListener('load', () => navigator.serviceWorker
        .register('/sw.js?v=21', { updateViaCache: 'none' })
        .catch(() => {}));
    }
  }

  boot();
})();
