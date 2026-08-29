(() => {
  'use strict';

  const ENGINE = window.FOOD_PICKER_ENGINE;
  const SOURCE_MENU = typeof FOODS !== 'undefined' && Array.isArray(FOODS) ? FOODS : [];
  const FIRST_RUN_TOTAL = 8;
  const DAILY_TOTAL = 2;
  const PROFILE_QUESTION_COUNT = 6;
  const MAX_HISTORY = 12;

  const TAG_LABELS = Object.freeze({
    hot: ['热气型', 'hot'], spicy: ['有点醒', 'hot'], comfort: ['安抚型', ''],
    crisp: ['有反馈', ''], soup: ['汤水型', 'green'], fresh: ['清醒型', 'green'],
    light: ['轻一点', 'green'], ritual: ['有仪式感', 'green'], social: ['适合分担', ''],
    carb: ['主食落地', ''], easy: ['少费脑', ''], rich: ['厚一点', 'hot'], novel: ['偏航一下', 'green']
  });

  const screens = {
    intro: document.getElementById('intro'),
    quiz: document.getElementById('quiz'),
    conditions: document.getElementById('conditions'),
    loading: document.getElementById('loading'),
    result: document.getElementById('result')
  };

  const dom = {
    startBtn: document.getElementById('startBtn'),
    resumeBtn: document.getElementById('resumeBtn'),
    retestBtn: document.getElementById('retestBtn'),
    savedProfile: document.getElementById('savedProfile'),
    savedTitle: document.getElementById('savedTitle'),
    savedAxes: document.getElementById('savedAxes'),
    introModeCopy: document.getElementById('introModeCopy'),
    qStep: document.getElementById('qStep'),
    qPhase: document.getElementById('qPhase'),
    prog: document.getElementById('prog'),
    qText: document.getElementById('qText'),
    qHint: document.getElementById('qHint'),
    choices: document.getElementById('choices'),
    quizBackBtn: document.getElementById('quizBackBtn'),
    conditionBackBtn: document.getElementById('conditionBackBtn'),
    calculateBtn: document.getElementById('calculateBtn'),
    loadingLine: document.getElementById('loadingLine'),
    shareModal: document.getElementById('shareModal'),
    shareStatus: document.getElementById('shareStatus'),
    sharePreview: document.getElementById('sharePreview'),
    shareFileBtn: document.getElementById('shareFileBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    copyLinkBtn: document.getElementById('copyLinkBtn'),
    closeShareBtn: document.getElementById('closeShareBtn')
  };

  let mode = 'full';
  let questionQueue = [];
  let answerRecords = [];
  let step = 0;
  let baseProfile = null;
  let currentProfile = null;
  let dailyState = null;
  let fortune = null;
  let constraints = {};
  let ranked = [];
  let rankIndex = 0;
  let shareAsset = null;

  function safeParse(value, fallback = null) {
    try { return JSON.parse(value); } catch (_) { return fallback; }
  }

  function storageGet(key, fallback = null) {
    try { return safeParse(localStorage.getItem(key), fallback); } catch (_) { return fallback; }
  }

  function storageSet(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { /* Storage is optional. */ }
  }

  function storageRemove(key) {
    try { localStorage.removeItem(key); } catch (_) { /* Storage is optional. */ }
  }

  function isValidProfile(profile) {
    return Boolean(
      profile
      && profile.version === ENGINE?.VERSION
      && ENGINE.archetypeById(profile.archetypeId)
      && profile.values
      && ENGINE.AXES.every(axis => Number.isFinite(profile.values[axis.key]))
    );
  }

  function getSavedProfile() {
    const value = storageGet(ENGINE.PROFILE_STORAGE_KEY);
    return isValidProfile(value) ? value : null;
  }

  function getHistory() {
    const history = storageGet(ENGINE.HISTORY_STORAGE_KEY, []);
    return Array.isArray(history) ? history.filter(Boolean).slice(0, MAX_HISTORY) : [];
  }

  function addToHistory(mealName) {
    const next = [mealName, ...getHistory().filter(name => name !== mealName)].slice(0, MAX_HISTORY);
    storageSet(ENGINE.HISTORY_STORAGE_KEY, next);
  }

  function showOnly(target) {
    Object.values(screens).forEach(screen => screen.classList.toggle('hidden', screen !== target));
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function toast(message) {
    const element = document.getElementById('toast');
    element.textContent = message;
    element.classList.add('on');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => element.classList.remove('on'), 1900);
  }

  function todayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  }

  function timeBranch(hour) {
    return ['子', '丑', '丑', '寅', '寅', '卯', '卯', '辰', '辰', '巳', '巳', '午', '午', '未', '未', '申', '申', '酉', '酉', '戌', '戌', '亥', '亥', '子'][hour] + '时';
  }

  function decorateProfile(profile, daily, seed) {
    const archetype = ENGINE.archetypeById(profile.archetypeId);
    const word = ENGINE.chooseFloatWord(archetype, daily, seed);
    return {
      ...profile,
      archetype,
      word,
      title: `${archetype.pot}${word}${archetype.role}`
    };
  }

  function renderSavedProfile() {
    const saved = getSavedProfile();
    const hasSaved = Boolean(saved);
    dom.savedProfile.classList.toggle('hidden', !hasSaved);
    dom.startBtn.classList.toggle('hidden', hasSaved);
    dom.resumeBtn.classList.toggle('hidden', !hasSaved);
    dom.retestBtn.classList.toggle('hidden', !hasSaved);

    if (!hasSaved) {
      dom.startBtn.textContent = '从六个日常场景开始';
      dom.introModeCopy.textContent = '第一次会稍长一点。测完会记在这台设备上，以后每天只问两题。';
      return;
    }

    const archetype = ENGINE.archetypeById(saved.archetypeId);
    dom.savedTitle.textContent = `${archetype.pot}${archetype.defaultWord}${archetype.role}`;
    dom.savedAxes.textContent = ENGINE.profileLabels(saved).join(' · ');
    dom.startBtn.textContent = '重新测一次本命锅格';
    dom.introModeCopy.textContent = '沿用本命锅格时，只问两道今日状态；人格不必每天重新做人。';
  }

  function startFullQuiz() {
    mode = 'full';
    baseProfile = null;
    currentProfile = null;
    questionQueue = ENGINE.PROFILE_QUESTIONS.slice();
    answerRecords = [];
    step = 0;
    showOnly(screens.quiz);
    renderQuestion();
  }

  function startDailyQuiz() {
    const saved = getSavedProfile();
    if (!saved) {
      startFullQuiz();
      return;
    }
    mode = 'daily';
    baseProfile = saved;
    currentProfile = null;
    questionQueue = ENGINE.DAILY_QUESTIONS.slice();
    answerRecords = [];
    step = 0;
    showOnly(screens.quiz);
    renderQuestion();
  }

  function totalQuestions() {
    return mode === 'full' ? FIRST_RUN_TOTAL : DAILY_TOTAL;
  }

  function currentQuestionKind(question) {
    return question.phase === '今日天气' ? 'daily' : 'profile';
  }

  function renderQuestion() {
    const question = questionQueue[step];
    if (!question) {
      openConditions();
      return;
    }

    const total = totalQuestions();
    dom.qStep.textContent = mode === 'full'
      ? `第 ${step + 1} 景 / ${total}`
      : `今日第 ${step + 1} 问 / ${total}`;
    dom.qPhase.textContent = question.phase;
    dom.prog.style.width = `${((step + 1) / total) * 100}%`;
    dom.qText.textContent = question.text;
    dom.qHint.textContent = question.hint || '';
    dom.choices.innerHTML = '';
    dom.quizBackBtn.disabled = step === 0;

    question.options.forEach((option, optionIndex) => {
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
      button.addEventListener('click', () => chooseOption(optionIndex));
      dom.choices.appendChild(button);
    });
  }

  function chooseOption(optionIndex) {
    const question = questionQueue[step];
    const option = question.options[optionIndex];
    answerRecords.push({ questionId: question.id, kind: currentQuestionKind(question), option });

    if (mode === 'full' && step === ENGINE.PROFILE_QUESTIONS.length - 1) {
      const profileSelections = answerRecords.filter(record => record.kind === 'profile').map(record => record.option);
      const calibrator = ENGINE.getCalibrationQuestion(profileSelections);
      questionQueue = [...ENGINE.PROFILE_QUESTIONS, calibrator, ...ENGINE.DAILY_QUESTIONS];
    }

    step += 1;
    if (step >= questionQueue.length) openConditions();
    else renderQuestion();
  }

  function goBackOneQuestion() {
    if (step <= 0) return;
    step -= 1;
    answerRecords.pop();
    if (mode === 'full' && step < ENGINE.PROFILE_QUESTIONS.length) {
      questionQueue = ENGINE.PROFILE_QUESTIONS.slice();
    }
    renderQuestion();
  }

  function clearConditionChips() {
    document.querySelectorAll('.condition-chip').forEach(button => {
      button.classList.remove('on');
      button.setAttribute('aria-pressed', 'false');
    });
  }

  function openConditions() {
    clearConditionChips();
    showOnly(screens.conditions);
  }

  function backFromConditions() {
    if (!answerRecords.length) {
      showOnly(screens.intro);
      return;
    }
    step = questionQueue.length - 1;
    answerRecords.pop();
    showOnly(screens.quiz);
    renderQuestion();
  }

  function collectConstraints() {
    const result = {};
    document.querySelectorAll('.condition-chip.on').forEach(button => { result[button.dataset.constraint] = true; });
    return result;
  }

  function loadingLines() {
    return [
      '先定锅，再挑浮词，最后让几百道菜互相竞争。',
      '正在把“需要被接住”翻译成食物质地……',
      '正在检查这道菜究竟命中了几条人格路径……',
      '正在给现实条件保留最后否决权……'
    ];
  }

  function calculateResult() {
    if (!ENGINE || !SOURCE_MENU.length) {
      toast('菜单或锅格引擎没有接上');
      return;
    }

    constraints = collectConstraints();
    showOnly(screens.loading);
    const lines = loadingLines();
    let lineIndex = 0;
    dom.loadingLine.textContent = lines[0];
    const lineTimer = setInterval(() => {
      lineIndex = (lineIndex + 1) % lines.length;
      dom.loadingLine.textContent = lines[lineIndex];
    }, 420);

    const profileSelections = answerRecords.filter(record => record.kind === 'profile').map(record => record.option);
    const dailySelections = answerRecords.filter(record => record.kind === 'daily').map(record => record.option);
    if (mode === 'full') {
      baseProfile = ENGINE.buildProfile(profileSelections, `${todayKey()}:${profileSelections.map(item => item.title).join('|')}`);
      storageSet(ENGINE.PROFILE_STORAGE_KEY, baseProfile);
    }
    dailyState = ENGINE.buildDaily(dailySelections);
    const seed = `${todayKey()}:${baseProfile.archetypeId}:${dailyState.selections.join('|')}`;
    currentProfile = decorateProfile(baseProfile, dailyState, seed);
    fortune = ENGINE.fortuneFor(`${seed}:${new Date().getHours()}`);

    const scored = ENGINE.rankMeals(SOURCE_MENU, currentProfile, dailyState, constraints, {
      seed,
      fortune,
      history: getHistory()
    });
    ranked = ENGINE.weightedDraw(scored, Math.min(8, scored.length), seed);
    rankIndex = 0;

    setTimeout(() => {
      clearInterval(lineTimer);
      if (!ranked.length) {
        showOnly(screens.conditions);
        toast('这些禁忌把菜单清空了，少勾一项再算');
        return;
      }
      renderResult();
      renderSavedProfile();
    }, 780);
  }

  function tagPills(meal) {
    const entries = [[meal.region || '今日菜单', '']];
    meal.tags.forEach(tag => {
      const label = TAG_LABELS[tag];
      if (label && !entries.some(([text]) => text === label[0])) entries.push(label);
    });
    return entries.slice(0, 4);
  }

  function axisBars(profile) {
    return ENGINE.AXES.map(axis => {
      const value = profile.values[axis.key] || 0;
      const position = Math.max(3, Math.min(97, (value + 1) * 50));
      return `<div class="axis-row"><span>${axis.negative}</span><div class="axis-track"><i class="axis-dot ${value < 0 ? 'negative' : ''}" style="left:${position}%"></i></div><span>${axis.positive}</span></div>`;
    }).join('');
  }

  function dailyEvidence() {
    const picked = dailyState.selections.filter(Boolean).map(text => `“${text}”`).join('，又选了');
    return `你今天先选了${picked || '两种并不互相矛盾的需要'}。这不会改写本命锅格，只会决定今天浮在上面的词。${fortune.line}`;
  }

  function conEvidence(meal) {
    const options = [
      `人格只负责缩小搜索半径，现实条件仍然有否决权。${meal.name}没有靠一句玄学空降，它同时拿到了锅格 ${meal.breakdown.profile}%、今日状态 ${meal.breakdown.daily}% 和可行性 ${meal.breakdown.feasibility}% 的票。`,
      `系统没有因为你叫“${currentProfile.title}”就把你塞进一个小盒子。${meal.name}是从整张菜单里抽出来的，而且允许 ${meal.cross.length} 条人格路径同时抵达。`,
      `你真正需要的不是全世界最正确的晚饭，而是一顿不违背你、也不继续增加工作量的饭。今晚这份暂定答案就是${meal.name}。`
    ];
    return options[ENGINE.hash(`${meal.name}:${currentProfile.title}`) % options.length];
  }

  function resultConsistency(meal) {
    const value = currentProfile.confidence * 0.38
      + meal.breakdown.profile * 0.34
      + meal.breakdown.daily * 0.18
      + meal.breakdown.feasibility * 0.1;
    return Math.max(76, Math.min(98, Math.round(value + 10)));
  }

  function renderResult() {
    const meal = ranked[rankIndex % ranked.length];
    if (!meal) return;
    showOnly(screens.result);

    const now = new Date();
    document.getElementById('dateStamp').innerHTML = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}<br>${timeBranch(now.getHours())} · 食神${fortune.name}位`;
    document.getElementById('personaPot').textContent = `本命器型 · ${currentProfile.archetype.pot} / ${currentProfile.archetype.role}`;
    document.getElementById('personaTitle').textContent = currentProfile.title;
    document.getElementById('personaAxes').innerHTML = ENGINE.profileLabels(currentProfile).map(label => `<span>${label}</span>`).join('');
    document.getElementById('personaCaption').textContent = ENGINE.describeProfile(currentProfile);

    document.getElementById('mealName').textContent = meal.name;
    document.getElementById('mealNative').textContent = meal.native || '';
    document.getElementById('mealPills').innerHTML = tagPills(meal).map(([text, style]) => `<span class="pill ${style}">${text}</span>`).join('');

    const verdict = ENGINE.recommendationReason(currentProfile, dailyState, meal);
    document.getElementById('psychVerdict').textContent = verdict;
    document.getElementById('axisBars').innerHTML = axisBars(currentProfile);
    document.getElementById('psychEvidence').textContent = ENGINE.describeProfile(currentProfile);
    document.getElementById('fortuneEvidence').textContent = dailyEvidence();
    document.getElementById('kitchenEvidence').textContent = ENGINE.mealMappingLine(meal);
    document.getElementById('conEvidence').textContent = conEvidence(meal);

    document.getElementById('crossList').innerHTML = meal.cross.map(mapping => (
      `<div class="cross-item"><b>${mapping.title}</b><span>${mapping.percent}% 邻近</span></div>`
    )).join('');

    const consistency = resultConsistency(meal);
    document.getElementById('confidence').textContent = `${consistency}%`;
    document.getElementById('meterFill').style.width = `${consistency}%`;

    document.getElementById('altList').innerHTML = ranked
      .filter((_, index) => index !== rankIndex % ranked.length)
      .slice(0, 4)
      .map(item => `<button class="alt" type="button" data-name="${item.name.replace(/"/g, '&quot;')}">${item.name}</button>`)
      .join('');
    document.querySelectorAll('.alt').forEach(button => button.addEventListener('click', () => {
      const nextIndex = ranked.findIndex(item => item.name === button.dataset.name);
      if (nextIndex >= 0) {
        rankIndex = nextIndex;
        renderResult();
      }
    }));

    document.getElementById('footNote').textContent = `算法：${SOURCE_MENU.length} 道菜单 × 50% 锅格 × 25% 今日状态 × 20% 现实 × 5% 食神`;
  }

  function currentMeal() {
    return ranked[rankIndex % ranked.length] || null;
  }

  function acceptMeal() {
    const meal = currentMeal();
    if (!meal) return;
    addToHistory(meal.name);
    toast(`行，就吃${meal.name}。这次别再开会了。`);
  }

  function rerollMeal() {
    if (!ranked.length) return;
    rankIndex = (rankIndex + 1) % Math.min(6, ranked.length);
    renderResult();
  }

  function resultShareUrl(meal) {
    const origin = location.origin && location.origin !== 'null' ? location.origin : '';
    return ENGINE.makeShareUrl(meal, currentProfile.title, { origin, pathname: location.pathname || '/' });
  }

  function qrTargetUrl() {
    const fallback = 'https://github.com/StarObserverPro/FoodPicker';
    const candidates = [];
    if (location.origin && location.origin !== 'null') {
      const target = new URL(location.pathname || '/', location.origin);
      target.search = '';
      target.hash = '';
      candidates.push(target.toString(), new URL('/', location.origin).toString());
    }
    candidates.push(fallback);
    const maxBytes = window.FoodPickerQR?.maxBytes || 106;
    const encoder = typeof TextEncoder === 'function' ? new TextEncoder() : null;
    return candidates.find(value => !encoder || encoder.encode(value).length <= maxBytes) || fallback;
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

  function wrapLines(ctx, text, maxWidth, maxLines = 99) {
    const characters = Array.from(String(text));
    const lines = [];
    let line = '';
    for (const character of characters) {
      const next = line + character;
      if (line && ctx.measureText(next).width > maxWidth) {
        lines.push(line);
        line = character;
        if (lines.length === maxLines - 1) break;
      } else {
        line = next;
      }
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.join('').length < characters.length && lines.length) {
      lines[lines.length - 1] = `${lines[lines.length - 1].replace(/[，。；、]$/, '')}…`;
    }
    return lines;
  }

  function drawWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
    const lines = wrapLines(ctx, text, maxWidth, maxLines);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
  }

  function shareVerdictFor(meal) {
    const heat = currentProfile.values.heat >= 0
      ? '你需要一件事明确发生，替今天划出转折'
      : '你需要节奏慢下来，让今天在热气里沉底';
    const texture = currentProfile.values.texture >= 0
      ? '嘴里仍要留一点反馈，安慰不能变成含糊'
      : '食物最好少一点抵抗，先把人稳稳接住';
    let today = '今天不宜再给晚饭增加新的任务';
    if ((dailyState.mood.reward || 0) >= 4) today = '今天还需要一点“没有白过”的证据';
    else if ((dailyState.mood.social || 0) >= 4) today = '今天还需要桌面重新出现一点人声';
    else if ((dailyState.mood.light || 0) >= 4) today = '今天身体已经拒绝再背一层重量';
    else if ((dailyState.mood.stimulus || 0) >= 4) today = '今天需要一个比犹豫更明确的刺激';
    return `${heat}；${texture}。${today}，所以今晚落到${meal.name}。`;
  }

  function drawShareCard(meal) {
    if (!window.FoodPickerQR) throw new Error('QR renderer unavailable');
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1440;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = 'rgba(80,111,128,.055)';
    for (let y = 28; y < 1440; y += 44) {
      for (let x = (Math.floor(y / 44) % 2 ? 42 : 20); x < 1080; x += 52) {
        ctx.beginPath();
        ctx.arc(x, y, 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.fillStyle = '#a8322c';
    ctx.font = '900 25px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('扎 心 版 · 今 天 吃 什 么', 72, 78);
    ctx.strokeStyle = 'rgba(98,70,46,.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(72, 108);
    ctx.lineTo(1008, 108);
    ctx.stroke();

    ctx.fillStyle = '#506f80';
    ctx.font = '800 23px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('本命锅格 · 今日显化', 72, 158);
    ctx.fillStyle = '#2f2923';
    ctx.font = '900 72px "Kaiti SC", STKaiti, "PingFang SC", serif';
    drawWrapped(ctx, currentProfile.title, 72, 242, 936, 82, 2);

    ctx.fillStyle = '#d94d3f';
    ctx.font = '900 96px "Kaiti SC", STKaiti, "PingFang SC", serif';
    drawWrapped(ctx, meal.name, 72, 386, 936, 108, 2);

    ctx.fillStyle = '#2f2923';
    roundRect(ctx, 60, 510, 960, 310, 30);
    ctx.fill();
    ctx.fillStyle = '#e9c85c';
    ctx.font = '900 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('扎 心 判 词', 94, 566);
    ctx.fillStyle = '#fff8e9';
    ctx.font = '700 34px "Kaiti SC", STKaiti, "PingFang SC", serif';
    drawWrapped(ctx, shareVerdictFor(meal), 94, 622, 884, 47, 4);

    ctx.fillStyle = '#a8322c';
    ctx.font = '900 23px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('锅格四维', 72, 868);

    const barLeft = 176;
    const barWidth = 520;
    ENGINE.AXES.forEach((axis, index) => {
      const value = currentProfile.values[axis.key] || 0;
      const y = 916 + index * 52;
      ctx.fillStyle = '#6e6a64';
      ctx.font = '800 24px "Kaiti SC", STKaiti, serif';
      ctx.textAlign = 'right';
      ctx.fillText(axis.negative, 145, y + 7);
      ctx.textAlign = 'left';
      ctx.fillText(axis.positive, barLeft + barWidth + 24, y + 7);
      ctx.fillStyle = '#eadbc5';
      roundRect(ctx, barLeft, y - 10, barWidth, 20, 10);
      ctx.fill();
      ctx.fillStyle = value >= 0 ? '#d94d3f' : '#506f80';
      const width = Math.max(12, Math.abs(value) * barWidth / 2);
      const start = value >= 0 ? barLeft + barWidth / 2 : barLeft + barWidth / 2 - width;
      roundRect(ctx, start, y - 10, width, 20, 10);
      ctx.fill();
      ctx.fillStyle = 'rgba(47,41,35,.28)';
      ctx.fillRect(barLeft + barWidth / 2 - 1, y - 13, 2, 26);
    });
    ctx.textAlign = 'left';

    ctx.fillStyle = '#a8322c';
    ctx.font = '900 22px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('命中交叉', 72, 1134);
    ctx.font = '900 27px "Kaiti SC", STKaiti, serif';
    let chipX = 72;
    let chipY = 1160;
    meal.cross.forEach(mapping => {
      const chipWidth = Math.min(620, ctx.measureText(mapping.title).width + 46);
      if (chipX + chipWidth > 720) {
        chipX = 72;
        chipY += 58;
      }
      ctx.fillStyle = '#efe0c8';
      roundRect(ctx, chipX, chipY, chipWidth, 46, 23);
      ctx.fill();
      ctx.fillStyle = '#506178';
      ctx.fillText(mapping.title, chipX + 23, chipY + 32);
      chipX += chipWidth + 12;
    });

    const qrUrl = qrTargetUrl();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, 778, 1100, 246, 246, 24);
    ctx.fill();
    window.FoodPickerQR.paint(ctx, qrUrl, 796, 1118, 210, { dark: '#2f2923', light: '#fffaf0' });

    const now = new Date();
    ctx.fillStyle = '#7c6f62';
    ctx.font = '700 21px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${now.toLocaleDateString('zh-CN')} · ${timeBranch(now.getHours())} · 食神${fortune.name}位`, 72, 1324);
    ctx.fillStyle = '#2f2923';
    ctx.font = '800 29px "Kaiti SC", STKaiti, serif';
    ctx.fillText('扫码，把决定晚饭的责任交出去', 72, 1372);
    ctx.fillStyle = '#7c6f62';
    ctx.font = '600 18px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('二维码只指向测算页，不包含你的答题记录。', 72, 1407);
    return canvas;
  }

  function canvasBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('image encode failed')), 'image/png', 0.95);
    });
  }

  function openShareModal() {
    dom.shareModal.classList.remove('hidden');
    document.body.classList.add('share-open');
  }

  function closeShareModal() {
    dom.shareModal.classList.add('hidden');
    document.body.classList.remove('share-open');
  }

  async function generateShareImage() {
    const meal = currentMeal();
    if (!meal) return;
    openShareModal();
    dom.shareStatus.classList.remove('hidden');
    dom.shareStatus.textContent = '正在把二维码压进判词里……';
    dom.sharePreview.removeAttribute('src');
    dom.shareFileBtn.disabled = true;
    dom.downloadBtn.disabled = true;

    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = drawShareCard(meal);
      const blob = await canvasBlob(canvas);
      if (shareAsset?.objectUrl) URL.revokeObjectURL(shareAsset.objectUrl);
      const objectUrl = URL.createObjectURL(blob);
      const fileName = `锅格判词-${currentProfile.title}-${meal.name}.png`;
      const file = typeof File === 'function' ? new File([blob], fileName, { type: 'image/png' }) : null;
      shareAsset = { blob, file, fileName, objectUrl, meal, shareUrl: resultShareUrl(meal) };
      dom.sharePreview.src = objectUrl;
      dom.shareStatus.classList.add('hidden');
      dom.shareFileBtn.disabled = false;
      dom.downloadBtn.disabled = false;
    } catch (error) {
      console.error(error);
      dom.shareStatus.textContent = '分享图没有画成。刷新后再试一次。';
      toast('命运的打印机卡纸了');
    }
  }

  async function shareImageFile() {
    if (!shareAsset) return;
    try {
      if (shareAsset.file && navigator.share && (!navigator.canShare || navigator.canShare({ files: [shareAsset.file] }))) {
        await navigator.share({
          title: `${currentProfile.title}的今日食运`,
          text: `我是${currentProfile.title}，今晚命定${shareAsset.meal.name}。`,
          files: [shareAsset.file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${currentProfile.title}的今日食运`,
          text: `我是${currentProfile.title}，今晚命定${shareAsset.meal.name}。`,
          url: shareAsset.shareUrl
        });
      } else {
        downloadShareImage();
        toast('设备不支持直接分享，已经改为保存图片');
      }
    } catch (error) {
      if (error.name !== 'AbortError') toast('没转出去，命运暂时保密');
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

  async function copyText(text, successMessage) {
    try {
      await navigator.clipboard.writeText(text);
      toast(successMessage);
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      toast(successMessage);
    }
  }

  function copyResult() {
    const meal = currentMeal();
    if (!meal) return;
    const text = `我的锅格：${currentProfile.title}\n今晚：${meal.name}\n判词：${ENGINE.recommendationReason(currentProfile, dailyState, meal)}\n${resultShareUrl(meal)}`;
    copyText(text, '锅格、菜名和判词都复制了');
  }

  function resetDaily() {
    closeShareModal();
    startDailyQuiz();
  }

  function resetProfile() {
    storageRemove(ENGINE.PROFILE_STORAGE_KEY);
    closeShareModal();
    renderSavedProfile();
    startFullQuiz();
  }

  function hydrateSharedInvite() {
    const params = new URLSearchParams(location.search);
    if (!['share', 'share-card'].includes(params.get('from'))) return;
    const meal = (params.get('meal') || '').slice(0, 60);
    const persona = (params.get('persona') || params.get('type') || '').slice(0, 40);
    const invite = document.getElementById('sharedInvite');
    if (!invite || (!meal && !persona)) return;
    invite.textContent = persona && meal
      ? `一位「${persona}」刚把自己的锅递过来：今晚是「${meal}」。你可以照抄，也可以测测自己到底是什么锅。`
      : `有人把今晚这顿递过来了：${meal || persona}。现在轮到你。`;
    invite.classList.remove('hidden');
  }

  function wireEvents() {
    dom.startBtn.addEventListener('click', startFullQuiz);
    dom.resumeBtn.addEventListener('click', startDailyQuiz);
    dom.retestBtn.addEventListener('click', startFullQuiz);
    dom.quizBackBtn.addEventListener('click', goBackOneQuestion);
    dom.conditionBackBtn.addEventListener('click', backFromConditions);
    dom.calculateBtn.addEventListener('click', calculateResult);

    document.querySelectorAll('.condition-chip').forEach(button => button.addEventListener('click', () => {
      button.classList.toggle('on');
      button.setAttribute('aria-pressed', button.classList.contains('on') ? 'true' : 'false');
    }));

    document.getElementById('acceptBtn').addEventListener('click', acceptMeal);
    document.getElementById('rerollBtn').addEventListener('click', rerollMeal);
    document.getElementById('shareImageBtn').addEventListener('click', generateShareImage);
    document.getElementById('restartDailyBtn').addEventListener('click', resetDaily);
    document.getElementById('resetProfileBtn').addEventListener('click', resetProfile);
    document.getElementById('copyResultBtn').addEventListener('click', copyResult);

    dom.closeShareBtn.addEventListener('click', closeShareModal);
    dom.shareFileBtn.addEventListener('click', shareImageFile);
    dom.downloadBtn.addEventListener('click', downloadShareImage);
    dom.copyLinkBtn.addEventListener('click', () => {
      const meal = currentMeal();
      if (meal) copyText(resultShareUrl(meal), '可扫码链接已复制');
    });
    dom.shareModal.addEventListener('click', event => { if (event.target === dom.shareModal) closeShareModal(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && !dom.shareModal.classList.contains('hidden')) closeShareModal(); });
  }

  function boot() {
    if (!ENGINE) {
      dom.startBtn.disabled = true;
      dom.startBtn.textContent = '锅格引擎失联了';
      return;
    }
    if (!SOURCE_MENU.length) {
      dom.startBtn.disabled = true;
      dom.resumeBtn.disabled = true;
      dom.startBtn.textContent = '菜单失联了';
    }
    renderSavedProfile();
    hydrateSharedInvite();
    wireEvents();
    if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }

  boot();
})();
