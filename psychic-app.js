(() => {
  'use strict';

  const E = window.FOOD_PICKER_ENGINE;
  const MENU = typeof FOODS !== 'undefined' && Array.isArray(FOODS) ? FOODS : [];
  const FIRST_RUN_TOTAL = 8;
  const DAILY_TOTAL = 2;
  const MAX_HISTORY = 12;

  const $ = id => document.getElementById(id);
  const screens = {
    intro: $('intro'),
    quiz: $('quiz'),
    loading: $('loading'),
    result: $('result')
  };

  const dom = {
    startBtn: $('startBtn'),
    resumeBtn: $('resumeBtn'),
    retestBtn: $('retestBtn'),
    savedProfile: $('savedProfile'),
    savedTitle: $('savedTitle'),
    qStep: $('qStep'),
    prog: $('prog'),
    qText: $('qText'),
    choices: $('choices'),
    quizBackBtn: $('quizBackBtn'),
    loadingLine: $('loadingLine'),
    shareModal: $('shareModal'),
    shareStatus: $('shareStatus'),
    sharePreview: $('sharePreview'),
    shareFileBtn: $('shareFileBtn'),
    downloadBtn: $('downloadBtn'),
    copyLinkBtn: $('copyLinkBtn'),
    closeShareBtn: $('closeShareBtn')
  };

  const QUESTION_COPY = {
    'close-the-day': ['忙活一天，总算歇下来了。哪一下最像：得，今儿到这儿？', [
      ['门一关，出去溜达一圈', ''],
      ['洗个热水澡，先缓会儿', ''],
      ['把最后那点尾巴顺手扫了', ''],
      ['屋里开点动静，别那么空', '']
    ]],
    'stalled-room': ['几个人聊半天，还是没聊出个所以然。你先来哪句？', [
      ['先甭管了，凑一个出来再说', ''],
      ['先看看，到底卡哪儿了', ''],
      ['所以你们到底想说啥？', ''],
      ['要不换个说法呗', '']
    ]],
    'friend-response': ['你今儿看着不太对劲儿，朋友也看出来了。哪句最管用？', [
      ['你是不是就为这事儿憋着呢？', ''],
      ['行，我不问了，坐会儿吧', ''],
      ['得，这事儿我来', ''],
      ['先聊点别的吧', '']
    ]],
    'weekend-memory': ['想起一个过得挺舒坦的周末，你先想起啥？', [
      ['有一下特对：哎，今儿值了', ''],
      ['没啥大事，反正一整天都挺顺', ''],
      ['有个小事儿，想起来还挺乐', ''],
      ['说不上来，反正感觉对了', '']
    ]],
    'inhabited-room': ['一个地方住久了，哪一下会让你觉得：嗯，这儿算我的了？', [
      ['这东西就得在这儿，挪哪儿都不对', ''],
      ['什么东西都得有自己的地儿', ''],
      ['光线、声音、屋里那股味儿都对了', ''],
      ['有个地方能一屁股窝进去', '']
    ]],
    'calibrate-heat': ['白捡一个下午，你准备怎么混过去？', [
      ['出门，去个没去过的地儿', ''],
      ['不安排，溜达到哪儿算哪儿', ''],
      ['把一直碍眼的破事儿顺手清了', ''],
      ['就在熟悉的街边晃悠晃悠', '']
    ]],
    'calibrate-texture': ['有人发来半截话，看得人云里雾里。你更想回哪句？', [
      ['所以你到底想说啥？', ''],
      ['先放着吧，他想说再说', ''],
      ['你意思是这个，对吧？', ''],
      ['先说你怎么了，别的回头再聊', '']
    ]],
    'calibrate-focus': ['一件事折腾老半天，总算完了。哪一下最痛快？', [
      ['最后一下卡上了，咔，齐活', ''],
      ['那堆零碎终于都顺了', ''],
      ['有人说：最难那块你真弄明白了', ''],
      ['第二天起来，这事儿已经翻篇了', '']
    ]],
    'calibrate-meaning': ['用了好多年的东西坏了。你第一反应怎么弄？', [
      ['照原样修，别瞎改', ''],
      ['拆了，能用的改点别的', ''],
      ['留块最有念想的，别的算了', ''],
      ['重新做一个现在顺手的', '']
    ]],
    'world-request': ['接下来的两个小时，你最希望世界对你做什么？', [
      ['别让我选了，真的', ''],
      ['想爽一把，把人叫醒', ''],
      ['好歹给今天收个像样的尾', ''],
      ['闹点动静，别太安静', '']
    ]],
    'bandwidth': ['今晚你还愿意为一顿饭留下多少精神带宽？', [
      ['一步完事儿最好', ''],
      ['稍微折腾一下也行', ''],
      ['今儿还能认真整整', ''],
      ['咋都行，别太麻烦', '']
    ]]
  };

  const EXTRA_PROFILE_QUESTIONS = Object.freeze([
    {
      id: 'plan-cancelled', text: '本来约好出门，临了对方来一句：今儿算了吧。你第一反应？', hint: '',
      options: [
        { icon: '↗', title: '那我自己出去溜达', sub: '', axis: { heat: 2, focus: 1 } },
        { icon: '≈', title: '那正好，躺会儿', sub: '', axis: { heat: -2, texture: -1 } },
        { icon: '?', title: '咋了？出啥事儿了？', sub: '', axis: { texture: 2, meaning: 1 } },
        { icon: '↺', title: '行，那改天换个玩法', sub: '', axis: { meaning: -2, focus: -1 } }
      ]
    },
    {
      id: 'movie-talk', text: '一部电影看完了，跟人聊起来你最容易先说哪句？', hint: '',
      options: [
        { icon: '✦', title: '就那个镜头，真行', sub: '', axis: { focus: 2, heat: 1 } },
        { icon: '—', title: '整体挺顺，没哪儿特别掉链子', sub: '', axis: { focus: -2, heat: -1 } },
        { icon: '◌', title: '那个人演得真像那么回事儿', sub: '', axis: { meaning: 2, texture: 1 } },
        { icon: '∞', title: '我就喜欢它把几件破事儿串一块了', sub: '', axis: { meaning: -2, focus: -1 } }
      ]
    },
    {
      id: 'wrong-turn', text: '出去玩走错路了，多绕二十分钟。你一般咋想？', hint: '',
      options: [
        { icon: '↗', title: '来都来了，顺路看看呗', sub: '', axis: { heat: 2, meaning: -1 } },
        { icon: '!', title: '先把路找回来，别越走越偏', sub: '', axis: { texture: 2, focus: 1 } },
        { icon: '≈', title: '没事儿，慢慢走，反正也不赶', sub: '', axis: { heat: -2, texture: -1 } },
        { icon: '⌁', title: '记住这个破岔路，下回别再坑我', sub: '', axis: { meaning: 2, focus: 1 } }
      ]
    },
    {
      id: 'gift-stays', text: '别人送你个东西，哪种最容易一直留着？', hint: '',
      options: [
        { icon: '●', title: '正好就是我缺的那个', sub: '', axis: { focus: 2, meaning: 1 } },
        { icon: '⌁', title: '不值钱，但他真知道我啥脾气', sub: '', axis: { meaning: 2, texture: 1 } },
        { icon: '✦', title: '包装、卡片、那点小心思全对', sub: '', axis: { meaning: -2, focus: 1 } },
        { icon: '○', title: '说不上哪儿好，反正舍不得扔', sub: '', axis: { focus: -2, texture: -1 } }
      ]
    },
    {
      id: 'change-place', text: '一群人临时说换地方，你最容易回哪句？', hint: '',
      options: [
        { icon: '→', title: '走呗，换', sub: '', axis: { heat: 2, focus: 1 } },
        { icon: '?', title: '等等，先说去哪儿', sub: '', axis: { texture: 2, meaning: 1 } },
        { icon: '…', title: '都行，别来回折腾就成', sub: '', axis: { heat: -2, texture: -1 } },
        { icon: '↺', title: '要不干脆换个玩法', sub: '', axis: { meaning: -2, focus: -1 } }
      ]
    },
    {
      id: 'halfway-wrong', text: '一件事做到一半，突然发现原来那招不太行。你咋办？', hint: '',
      options: [
        { icon: '↗', title: '先改，能往下走再说', sub: '', axis: { heat: 2, focus: 1 } },
        { icon: '!', title: '停一下，先看看哪儿不对', sub: '', axis: { texture: 2, meaning: 1 } },
        { icon: '●', title: '保住最要紧那块，别全推倒', sub: '', axis: { focus: 2, meaning: 1 } },
        { icon: '↺', title: '那就重来，旧的别硬救', sub: '', axis: { meaning: -2, heat: 1 } }
      ]
    },
    {
      id: 'rain-plan', text: '本来安排得好好的，突然下大雨。你更像哪种？', hint: '',
      options: [
        { icon: '↗', title: '换个地方，照样出去', sub: '', axis: { heat: 2, meaning: -1 } },
        { icon: '≈', title: '得，回家窝着也挺好', sub: '', axis: { heat: -2, texture: -1 } },
        { icon: '!', title: '先看看雨多大，别瞎折腾', sub: '', axis: { texture: 2, meaning: 1 } },
        { icon: '⌘', title: '那就临时整点别的', sub: '', axis: { meaning: -2, focus: -1 } }
      ]
    }
  ]);

  const EXTRA_DAILY_QUESTIONS = Object.freeze([
    {
      id: 'room-noise', text: '现在屋里要开点声音，你想开到哪档？', hint: '',
      options: [
        { icon: '○', title: '安静点儿，谁也别找我', sub: '', mood: { comfort: 4, easy: 3, familiar: 2 } },
        { icon: '♬', title: '随便开点东西，别太空', sub: '', mood: { comfort: 2, social: 2, familiar: 2 } },
        { icon: '!', title: '来点带劲的，醒醒', sub: '', mood: { stimulus: 5, spicy: 2, crisp: 1 } },
        { icon: '◉', title: '最好来个人，坐一桌', sub: '', mood: { social: 5, shareable: 4, comfort: 1 } }
      ]
    },
    {
      id: 'day-tail', text: '今天要是现在就翻篇，你想留个啥尾巴？', hint: '',
      options: [
        { icon: '—', title: '啥也别留，赶紧过去', sub: '', mood: { easy: 5, comfort: 3, familiar: 1 } },
        { icon: '!', title: '来点爽的，别白熬一天', sub: '', mood: { reward: 4, stimulus: 3, spicy: 2 } },
        { icon: '✦', title: '有个小惊喜就行', sub: '', mood: { novel: 4, reward: 3, ritual: 2 } },
        { icon: '♬', title: '跟人说两句，别闷着', sub: '', mood: { social: 5, shareable: 3 } }
      ]
    },
    {
      id: 'inside-weather', text: '你现在这人，大概啥天气？', hint: '',
      options: [
        { icon: '☁', title: '蔫了，别折腾', sub: '', mood: { comfort: 5, easy: 4 } },
        { icon: '↗', title: '闷得慌，得来点风', sub: '', mood: { light: 3, fresh: 3, novel: 2 } },
        { icon: '!', title: '有点炸，想来点更狠的', sub: '', mood: { stimulus: 5, spicy: 4 } },
        { icon: '◉', title: '还行，想热闹热闹', sub: '', mood: { social: 4, reward: 2, shareable: 3 } }
      ]
    }
  ]);

  const DAILY_IDS = new Set([
    ...E.DAILY_QUESTIONS.map(question => question.id),
    ...EXTRA_DAILY_QUESTIONS.map(question => question.id)
  ]);

  const TAG_LABELS = Object.freeze({
    hot: ['有热气', 'hot'], spicy: ['有点劲', 'hot'], comfort: ['稳当', ''],
    crisp: ['有口感', ''], soup: ['带汤水', 'green'], fresh: ['清爽', 'green'],
    light: ['轻一点', 'green'], ritual: ['像回事', 'green'], social: ['适合一起吃', ''],
    carb: ['有主食', ''], easy: ['省心', ''], rich: ['厚实', 'hot'], novel: ['换换口', 'green']
  });

  let mode = 'full';
  let questionQueue = [];
  let profileQuestionSet = [];
  let dailyQuestionSet = [];
  let answers = [];
  let step = 0;
  let baseProfile = null;
  let profile = null;
  let daily = null;
  let fortune = null;
  let ranked = [];
  let rankIndex = 0;
  let shareAsset = null;

  function applyQuestionCopy() {
    const questions = [
      ...E.PROFILE_QUESTIONS,
      ...Object.values(E.CALIBRATORS),
      ...E.DAILY_QUESTIONS
    ];
    questions.forEach(question => {
      const copy = QUESTION_COPY[question.id];
      if (!copy) return;
      question.text = copy[0];
      question.hint = '';
      copy[1].forEach(([title, sub], index) => {
        if (!question.options[index]) return;
        question.options[index].title = title;
        question.options[index].sub = sub;
      });
    });
  }

  function shuffled(items) {
    const next = items.slice();
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [next[index], next[swap]] = [next[swap], next[index]];
    }
    return next;
  }

  function questionCoverage(question) {
    const keys = new Set();
    question.options.forEach(option => Object.keys(option.axis || {}).forEach(key => keys.add(key)));
    return keys;
  }

  function pickProfileQuestions() {
    const pool = [...E.PROFILE_QUESTIONS, ...EXTRA_PROFILE_QUESTIONS];
    for (let attempt = 0; attempt < 60; attempt += 1) {
      const picked = shuffled(pool).slice(0, 5);
      const counts = Object.fromEntries(E.AXES.map(axis => [axis.key, 0]));
      picked.forEach(question => questionCoverage(question).forEach(key => { counts[key] = (counts[key] || 0) + 1; }));
      if (E.AXES.every(axis => counts[axis.key] >= 2)) return picked;
    }
    return E.PROFILE_QUESTIONS.slice(0, 5);
  }

  function pickDailyQuestions() {
    const world = E.DAILY_QUESTIONS.find(question => question.id === 'world-request');
    const bandwidth = E.DAILY_QUESTIONS.find(question => question.id === 'bandwidth');
    const firstPool = [world, ...EXTRA_DAILY_QUESTIONS].filter(Boolean);
    const first = firstPool[Math.floor(Math.random() * firstPool.length)] || world;
    return [first, bandwidth].filter(Boolean);
  }

  function safeParse(value, fallback = null) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function storageGet(key, fallback = null) {
    try { return safeParse(localStorage.getItem(key), fallback); } catch (_) { return fallback; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (_) {}
  }

  function isValidProfile(value) {
    return Boolean(
      value
      && value.version === E.VERSION
      && E.archetypeById(value.archetypeId)
      && value.values
      && E.AXES.every(axis => Number.isFinite(value.values[axis.key]))
    );
  }

  function getSavedProfile() {
    const saved = storageGet(E.PROFILE_STORAGE_KEY);
    return isValidProfile(saved) ? saved : null;
  }

  function getHistory() {
    const history = storageGet(E.HISTORY_STORAGE_KEY, []);
    return Array.isArray(history) ? history.filter(Boolean).slice(0, MAX_HISTORY) : [];
  }

  function addToHistory(name) {
    storageSet(E.HISTORY_STORAGE_KEY, [name, ...getHistory().filter(item => item !== name)].slice(0, MAX_HISTORY));
  }

  function showOnly(target) {
    Object.values(screens).forEach(screen => screen?.classList.toggle('hidden', screen !== target));
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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

  function decorateProfile(base, day, seed) {
    const archetype = E.archetypeById(base.archetypeId);
    const word = E.chooseFloatWord(archetype, day, seed);
    return { ...base, archetype, word, title: `${archetype.pot}${word}${archetype.role}` };
  }

  function renderSavedProfile() {
    const saved = getSavedProfile();
    const hasSaved = Boolean(saved);
    dom.savedProfile?.classList.toggle('hidden', !hasSaved);
    dom.startBtn?.classList.toggle('hidden', hasSaved);
    dom.resumeBtn?.classList.toggle('hidden', !hasSaved);
    dom.retestBtn?.classList.toggle('hidden', !hasSaved);
    if (!hasSaved) return;
    const archetype = E.archetypeById(saved.archetypeId);
    if (dom.savedTitle) dom.savedTitle.textContent = `${archetype.pot}${archetype.defaultWord}${archetype.role}`;
  }

  function startFullQuiz() {
    mode = 'full';
    baseProfile = null;
    profile = null;
    profileQuestionSet = pickProfileQuestions();
    dailyQuestionSet = pickDailyQuestions();
    questionQueue = profileQuestionSet.slice();
    answers = [];
    step = 0;
    showOnly(screens.quiz);
    renderQuestion();
  }

  function startDailyQuiz() {
    const saved = getSavedProfile();
    if (!saved) return startFullQuiz();
    mode = 'daily';
    baseProfile = saved;
    profile = null;
    dailyQuestionSet = pickDailyQuestions();
    questionQueue = dailyQuestionSet.slice();
    answers = [];
    step = 0;
    showOnly(screens.quiz);
    renderQuestion();
  }

  function questionTotal() {
    return mode === 'full' ? FIRST_RUN_TOTAL : DAILY_TOTAL;
  }

  function renderQuestion() {
    const question = questionQueue[step];
    if (!question) return calculateResult();
    if (dom.qStep) dom.qStep.textContent = mode === 'full'
      ? `第 ${step + 1} 题 / ${questionTotal()}`
      : `今天 ${step + 1} / ${questionTotal()}`;
    if (dom.prog) dom.prog.style.width = `${((step + 1) / questionTotal()) * 100}%`;
    if (dom.qText) dom.qText.textContent = question.text;
    if (dom.choices) dom.choices.innerHTML = '';
    if (dom.quizBackBtn) dom.quizBackBtn.disabled = step === 0;

    question.options.forEach((option, index) => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';
      const icon = document.createElement('span');
      icon.className = 'ico';
      icon.textContent = option.icon;
      const copy = document.createElement('span');
      const title = document.createElement('b');
      title.textContent = option.title;
      const sub = document.createElement('small');
      sub.textContent = option.sub;
      copy.append(title, sub);
      button.append(icon, copy);
      button.addEventListener('click', () => chooseOption(index));
      dom.choices?.appendChild(button);
    });
  }

  function chooseOption(index) {
    const question = questionQueue[step];
    const option = question?.options[index];
    if (!question || !option) return;
    answers.push({ questionId: question.id, kind: DAILY_IDS.has(question.id) ? 'daily' : 'profile', option });

    if (mode === 'full' && step === profileQuestionSet.length - 1) {
      const profileAnswers = answers.filter(item => item.kind === 'profile').map(item => item.option);
      const calibrator = E.getCalibrationQuestion(profileAnswers);
      questionQueue = [...profileQuestionSet, calibrator, ...dailyQuestionSet];
    }

    step += 1;
    if (step >= questionQueue.length) calculateResult();
    else renderQuestion();
  }

  function goBack() {
    if (step <= 0) return;
    step -= 1;
    answers.pop();
    if (mode === 'full' && step < profileQuestionSet.length) questionQueue = profileQuestionSet.slice();
    renderQuestion();
  }

  function loadingLines() {
    return [
      '看看哪道菜最会来事。',
      '刚才那些答案，正在偷偷往厨房里拐。',
      '有几道菜挤得挺靠前。',
      '快了，别让它编太久。'
    ];
  }

  function calculateResult() {
    if (!E || !MENU.length) {
      toast('这口锅今天没点着');
      return;
    }

    showOnly(screens.loading);
    const lines = loadingLines();
    let cursor = 0;
    if (dom.loadingLine) dom.loadingLine.textContent = lines[0];
    const timer = setInterval(() => {
      cursor = (cursor + 1) % lines.length;
      if (dom.loadingLine) dom.loadingLine.textContent = lines[cursor];
    }, 420);

    const profileAnswers = answers.filter(item => item.kind === 'profile').map(item => item.option);
    const dailyAnswers = answers.filter(item => item.kind === 'daily').map(item => item.option);
    if (mode === 'full') {
      baseProfile = E.buildProfile(profileAnswers, `${todayKey()}:${profileAnswers.map(item => item.title).join('|')}`);
      storageSet(E.PROFILE_STORAGE_KEY, baseProfile);
    }
    daily = E.buildDaily(dailyAnswers);
    const seed = `${todayKey()}:${baseProfile.archetypeId}:${daily.selections.join('|')}`;
    profile = decorateProfile(baseProfile, daily, seed);
    fortune = E.fortuneFor(`${seed}:${new Date().getHours()}`);
    const scored = E.rankMeals(MENU, profile, daily, {}, { seed, fortune, history: getHistory() });
    ranked = E.weightedDraw(scored, Math.min(8, scored.length), seed);
    rankIndex = 0;

    setTimeout(() => {
      clearInterval(timer);
      if (!ranked.length) {
        showOnly(screens.intro);
        toast('菜单没接上，刷新一下再来');
        return;
      }
      renderResult();
      renderSavedProfile();
    }, 720);
  }

  function verdictFor(meal) {
    const v = profile.values;
    const parts = [v.heat >= 0 ? '今儿别老温吞着，来点动静' : '今儿已经够吵了，后面慢点'];
    parts.push(v.texture >= 0 ? '嘴里也得有点回应' : '这会儿就别跟什么较劲了');
    if ((daily.mood.easy || 0) >= 4) parts.push('还得省点事');
    else if ((daily.mood.reward || 0) >= 4) parts.push('好歹像个正经收尾');
    else if ((daily.mood.social || 0) >= 4) parts.push('最好再来点人气');
    else if ((daily.mood.light || 0) >= 4) parts.push('别整太沉');
    else if ((daily.mood.stimulus || 0) >= 4) parts.push('再给点劲儿');
    return `${parts.join('，')}。先吃${meal.name}。`;
  }

  function renderResult() {
    const meal = currentMeal();
    if (!meal) return;
    showOnly(screens.result);
    $('personaTitle').textContent = profile.title;
    $('mealName').textContent = meal.name;
    $('mealNative').textContent = meal.native || '';
    $('psychVerdict').textContent = verdictFor(meal);
    $('crossList').innerHTML = meal.cross.slice(0, 3).map(item => `<div class="cross-item"><b>${item.title}</b></div>`).join('');
    $('altList').innerHTML = ranked
      .filter(item => item.name !== meal.name)
      .slice(0, 3)
      .map(item => `<button class="alt" type="button" data-name="${item.name.replace(/"/g, '&quot;')}">${item.name}</button>`)
      .join('');
    document.querySelectorAll('#altList .alt').forEach(button => button.addEventListener('click', () => {
      const index = ranked.findIndex(item => item.name === button.dataset.name);
      if (index >= 0) {
        rankIndex = index;
        renderResult();
      }
    }));
  }

  function currentMeal() {
    return ranked[rankIndex % ranked.length] || null;
  }

  function acceptMeal() {
    const meal = currentMeal();
    if (!meal) return;
    addToHistory(meal.name);
    toast(`行，今天就${meal.name}。`);
  }

  function rerollMeal() {
    if (!ranked.length) return;
    rankIndex = (rankIndex + 1) % Math.min(6, ranked.length);
    renderResult();
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

  const SHARE_FONT = '"PingFang SC","Microsoft YaHei","Hiragino Sans GB","Noto Sans CJK SC",sans-serif';
  const SHARE_PLAYFUL_FONT = '"Xingkai SC","STXingkai","Hannotate SC","HanziPen SC","Yuppy SC","Wawati SC","Weibei SC","Songti SC","Noto Serif CJK SC",serif';
  const FALLBACK_URL = 'https://github.com/StarObserverPro/FoodPicker';
  let shareBusy = false;

  function setFont(ctx, weight, size, family = SHARE_FONT) {
    ctx.font = `${weight} ${size}px ${family}`;
  }

  function wrapLines(ctx, value, width) {
    const chars = Array.from(String(value || '').trim());
    const lines = [];
    let line = '';
    chars.forEach(char => {
      const next = line + char;
      if (line && ctx.measureText(next).width > width) {
        lines.push(line);
        line = char;
      } else line = next;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  }

  function fitText(ctx, value, width, maxLines, startSize, minSize, weight, family, lineRatio) {
    let size = startSize;
    let lines = [];
    while (size >= minSize) {
      setFont(ctx, weight, size, family);
      lines = wrapLines(ctx, value, width);
      if (lines.length <= maxLines) break;
      size -= 2;
    }
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      let tail = lines[maxLines - 1];
      while (tail && ctx.measureText(`${tail}…`).width > width) tail = tail.slice(0, -1);
      lines[maxLines - 1] = `${tail}…`;
    }
    return { size, lines, lineHeight: Math.round(size * lineRatio) };
  }

  function drawFitted(ctx, value, x, y, width, options = {}) {
    const family = options.family || SHARE_FONT;
    const weight = options.weight || 800;
    const layout = fitText(
      ctx, value, width, options.maxLines || 2, options.startSize || 72,
      options.minSize || 44, weight, family, options.lineRatio || 1.2
    );
    setFont(ctx, weight, layout.size, family);
    layout.lines.forEach((line, index) => ctx.fillText(line, x, y + index * layout.lineHeight));
    return { ...layout, bottom: y + (layout.lines.length - 1) * layout.lineHeight };
  }

  function utf8Length(value) {
    const text = String(value || '');
    if (typeof TextEncoder === 'function') return new TextEncoder().encode(text).length;
    return unescape(encodeURIComponent(text)).length;
  }

  function cleanPageUrl() {
    if (location.origin && location.origin !== 'null') {
      const url = new URL(location.pathname || '/', location.origin);
      url.search = '';
      url.hash = '';
      return url.toString();
    }
    return FALLBACK_URL;
  }

  function resultShareUrl(meal) {
    const origin = location.origin && location.origin !== 'null' ? location.origin : '';
    return E.makeShareUrl(meal, profile.title, { origin, pathname: location.pathname || '/' });
  }

  function qrTargetUrl() {
    const choices = [cleanPageUrl()];
    if (location.origin && location.origin !== 'null') {
      try { choices.push(new URL('/', location.origin).toString()); } catch (_) {}
    }
    choices.push(FALLBACK_URL);
    const maxBytes = window.FoodPickerQR?.maxBytes || 106;
    return choices.find(value => utf8Length(value) <= maxBytes) || FALLBACK_URL;
  }

  function dataUrlToBlob(dataUrl) {
    const [head, payload] = dataUrl.split(',');
    const type = (head.match(/data:([^;]+)/) || [])[1] || 'image/png';
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
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

  function waitForImage(image, src) {
    return new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('share preview failed'));
      image.src = src;
      if (image.complete && image.naturalWidth) resolve();
    });
  }

  function safeFilePart(value) {
    return String(value || '').replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '').slice(0, 36) || '今天吃什么';
  }

  function drawShareCard(meal) {
    if (!window.FoodPickerQR) throw new Error('QR renderer unavailable');
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');

    ctx.fillStyle = '#f1e5d3';
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = '#fffaf0';
    roundRect(ctx, 58, 54, 964, 1332, 44);
    ctx.fill();

    ctx.fillStyle = '#a8322c';
    setFont(ctx, 800, 28);
    ctx.fillText('扎 心 版 · 今 天 吃 什 么', 104, 126);

    ctx.fillStyle = '#2f2923';
    const title = drawFitted(ctx, profile.title, 104, 252, 872, {
      maxLines: 2, startSize: 78, minSize: 50, weight: 700,
      family: SHARE_PLAYFUL_FONT, lineRatio: 1.16
    });

    const mealTop = Math.max(430, title.bottom + 96);
    ctx.fillStyle = '#d94d3f';
    const mealTitle = drawFitted(ctx, meal.name, 104, mealTop, 872, {
      maxLines: 2, startSize: 100, minSize: 64, weight: 900,
      family: SHARE_FONT, lineRatio: 1.12
    });

    const verdictTop = Math.min(730, Math.max(616, mealTitle.bottom + 76));
    ctx.fillStyle = '#332c26';
    roundRect(ctx, 96, verdictTop, 888, 286, 30);
    ctx.fill();
    ctx.fillStyle = '#fff8e9';
    drawFitted(ctx, verdictFor(meal), 138, verdictTop + 96, 804, {
      maxLines: 3, startSize: 40, minSize: 31, weight: 700,
      family: SHARE_FONT, lineRatio: 1.43
    });

    ctx.fillStyle = '#fff';
    roundRect(ctx, 710, 1052, 266, 266, 26);
    ctx.fill();
    const paintOptions = { dark: '#2f2923', light: '#ffffff', quiet: 4 };
    try { window.FoodPickerQR.paint(ctx, qrTargetUrl(), 728, 1070, 230, paintOptions); }
    catch (_) { window.FoodPickerQR.paint(ctx, FALLBACK_URL, 728, 1070, 230, paintOptions); }

    ctx.fillStyle = '#2f2923';
    setFont(ctx, 700, 34, SHARE_PLAYFUL_FONT);
    ctx.fillText('扫码，你也来一锅', 104, 1138);
    ctx.fillStyle = '#7c6f62';
    setFont(ctx, 600, 24);
    ctx.fillText('别研究了，先吃饭。', 104, 1196);
    return canvas;
  }

  function openShareModal() {
    dom.shareModal?.classList.remove('hidden');
    document.body.classList.add('share-open');
  }

  function closeShareModal() {
    dom.shareModal?.classList.add('hidden');
    document.body.classList.remove('share-open');
  }

  async function generateShareImage() {
    const meal = currentMeal();
    if (!meal || shareBusy) return;
    shareBusy = true;
    openShareModal();
    if (dom.shareStatus) {
      dom.shareStatus.textContent = '正画呢，稍等……';
      dom.shareStatus.classList.remove('hidden');
    }
    dom.sharePreview?.removeAttribute('src');
    if (dom.shareFileBtn) dom.shareFileBtn.disabled = true;
    if (dom.downloadBtn) dom.downloadBtn.disabled = true;

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = drawShareCard(meal);
      const blob = await canvasBlob(canvas);
      const objectUrl = typeof URL.createObjectURL === 'function'
        ? URL.createObjectURL(blob)
        : canvas.toDataURL('image/png');
      if (dom.sharePreview) await waitForImage(dom.sharePreview, objectUrl);
      const oldUrl = shareAsset?.objectUrl;
      const fileName = `今天吃什么-${safeFilePart(profile.title)}-${safeFilePart(meal.name)}.png`;
      const file = typeof File === 'function' ? new File([blob], fileName, { type: 'image/png' }) : null;
      shareAsset = { blob, objectUrl, fileName, file, meal, shareUrl: resultShareUrl(meal) };
      if (oldUrl?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(oldUrl);
      dom.shareStatus?.classList.add('hidden');
      if (dom.shareFileBtn) dom.shareFileBtn.disabled = false;
      if (dom.downloadBtn) dom.downloadBtn.disabled = false;
    } catch (error) {
      console.error(error);
      if (dom.shareStatus) dom.shareStatus.textContent = '刚才没画成，再点一次试试。';
      toast('刚才没画成，再来一下');
    } finally {
      shareBusy = false;
    }
  }

  function downloadShareImage() {
    if (!shareAsset) return;
    const link = document.createElement('a');
    link.href = shareAsset.objectUrl;
    link.download = shareAsset.fileName;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  async function shareImage() {
    if (!shareAsset) return;
    try {
      let canShareFile = false;
      if (shareAsset.file && navigator.share) {
        try { canShareFile = !navigator.canShare || navigator.canShare({ files: [shareAsset.file] }); }
        catch (_) { canShareFile = false; }
      }
      if (canShareFile) {
        await navigator.share({ files: [shareAsset.file], title: `今天测出个${profile.title}`, text: `今儿往锅里搁${shareAsset.meal.name}。` });
      } else if (navigator.share) {
        await navigator.share({ title: `今天测出个${profile.title}`, text: `今儿往锅里搁${shareAsset.meal.name}。`, url: shareAsset.shareUrl });
      } else {
        downloadShareImage();
        toast('图先存下来了');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast('没发出去，先存图吧');
    }
  }

  async function copyText(value, message = '链接抄好了') {
    try { await navigator.clipboard.writeText(value); }
    catch (_) {
      const input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
    toast(message);
  }

  function hydrateSharedInvite() {
    const params = new URLSearchParams(location.search);
    if (!['share', 'share-card'].includes(params.get('from'))) return;
    const meal = (params.get('meal') || '').slice(0, 60);
    const persona = (params.get('persona') || params.get('type') || '').slice(0, 40);
    const invite = $('sharedInvite');
    if (!invite || (!meal && !persona)) return;
    invite.textContent = meal && persona
      ? `有人测出「${persona}」，今天落到「${meal}」。你也来一锅？`
      : `有人把「${meal || persona}」递过来了。你也来一锅？`;
    invite.classList.remove('hidden');
  }

  function resetProfile() {
    storageRemove(E.PROFILE_STORAGE_KEY);
    closeShareModal();
    renderSavedProfile();
    startFullQuiz();
  }

  function wireEvents() {
    dom.startBtn?.addEventListener('click', startFullQuiz);
    dom.resumeBtn?.addEventListener('click', startDailyQuiz);
    dom.retestBtn?.addEventListener('click', startFullQuiz);
    dom.quizBackBtn?.addEventListener('click', goBack);
    $('acceptBtn')?.addEventListener('click', acceptMeal);
    $('rerollBtn')?.addEventListener('click', rerollMeal);
    $('shareImageBtn')?.addEventListener('click', generateShareImage);
    $('resetProfileBtn')?.addEventListener('click', resetProfile);
    dom.closeShareBtn?.addEventListener('click', closeShareModal);
    dom.shareFileBtn?.addEventListener('click', shareImage);
    dom.downloadBtn?.addEventListener('click', downloadShareImage);
    dom.copyLinkBtn?.addEventListener('click', () => {
      const meal = currentMeal();
      if (meal) copyText(resultShareUrl(meal), '链接抄好了');
    });
    dom.shareModal?.addEventListener('click', event => {
      if (event.target === dom.shareModal) closeShareModal();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeShareModal();
    });
  }

  function boot() {
    if (!E) {
      if (dom.startBtn) {
        dom.startBtn.disabled = true;
        dom.startBtn.textContent = '这口锅今天没点着';
      }
      return;
    }
    applyQuestionCopy();
    if (!MENU.length) {
      if (dom.startBtn) {
        dom.startBtn.disabled = true;
        dom.startBtn.textContent = '菜单没接上';
      }
      if (dom.resumeBtn) dom.resumeBtn.disabled = true;
    }
    renderSavedProfile();
    hydrateSharedInvite();
    wireEvents();
    if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  boot();
})();
