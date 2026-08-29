(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const text = (id, value) => { const node = $(id); if (node) node.textContent = value; };

  const style = document.createElement('style');
  style.textContent = '.flow-compat{display:none!important}';
  document.head.appendChild(style);

  function patchIntro() {
    const saved = $('savedProfile');
    const hasSaved = saved && !saved.classList.contains('hidden');
    if (hasSaved) {
      text('resumeBtn', '还是这口锅 · 看看今天');
      text('retestBtn', '不太像我 · 重新测');
      text('introModeCopy', '锅先沿用上回那口。今天只问两句，省得天天重新做人。');
    } else {
      text('startBtn', '来，看看是哪口锅');
      text('introModeCopy', '第一次多答几下。以后再来，就只问今天这两句。');
    }
  }

  const conditions = $('conditions');
  if (conditions) {
    new MutationObserver(() => {
      if (!conditions.classList.contains('hidden')) queueMicrotask(() => $('calculateBtn')?.click());
    }).observe(conditions, { attributes: true, attributeFilter: ['class'] });
  }

  const freshLoading = [
    '锅差不多定了。现在看看哪道菜最会来事。',
    '刚才那些和吃无关的答案，正在偷偷往厨房里拐。',
    '有几道菜挤得很靠前，食神正在里面偏心。',
    '快了。再解释下去就像真的有科学依据了。'
  ];
  let loadingCursor = 0;
  const loadingLine = $('loadingLine');
  if (loadingLine) {
    new MutationObserver(() => {
      if (freshLoading.includes(loadingLine.textContent)) return;
      loadingLine.textContent = freshLoading[loadingCursor++ % freshLoading.length];
    }).observe(loadingLine, { childList: true, characterData: true, subtree: true });
  }

  function axisState() {
    return [...document.querySelectorAll('#axisBars .axis-row')].map(row => {
      const spans = row.querySelectorAll('span');
      const dot = row.querySelector('.axis-dot');
      return {
        negative: spans[0]?.textContent || '',
        positive: spans[1]?.textContent || '',
        positiveSide: Number.parseFloat(dot?.style.left || '50') >= 50
      };
    });
  }

  function axisTalk(states) {
    const lines = [
      states[0]?.positiveSide ? '碰上卡住的事，更喜欢一下把局面推过去' : '很多事不急着掰断，让它自己慢慢落定反而舒服',
      states[1]?.positiveSide ? '含糊不太讨喜，有来有回才算碰到东西' : '累的时候，先被接住比先讲明白更重要',
      states[2]?.positiveSide ? '一段经历里，那个最亮的点很容易留下' : '比起一个高光，更在意整段是不是顺',
      states[3]?.positiveSide ? '东西本来的样子很重要，不爱什么都加工一遍' : '重新搭一搭、换个关系，反而更容易长出意思'
    ];
    return `这口锅大概是这样：${lines[0]}；${lines[1]}。再往里一点，${lines[2]}，${lines[3]}。`;
  }

  function verdict(states, meal) {
    const first = states[0]?.positiveSide
      ? '今天要是一直温吞下去，反而更烦；来点明确的转折，人容易落地'
      : '今天已经够响了，后面慢一点更合适，让节奏自己沉下来';
    const second = states[1]?.positiveSide
      ? '不过也不能全软掉，嘴里还是得有点回应'
      : '这会儿没必要再跟什么较劲，软一点反而舒服';
    return `${first}。${second}。所以今天先落到——${meal}。`;
  }

  function naturalFortune() {
    const name = (($('dateStamp')?.textContent || '').match(/食神(.)位/) || [])[1] || '';
    return ({
      火: '食神今天偏火。翻译一下：几道差不多的菜里，它会偷偷把有点劲儿的往前推。',
      水: '食神今天偏水。没什么大道理，就是给汤汤水水和舒服一点的东西加半票。',
      土: '食神今天偏土。翻译成人话：熟悉、扎实、能落地的东西会占一点便宜。',
      风: '食神今天偏风。它只负责在最后关头，给轻一点、新一点的选项偷偷抬个手。'
    })[name] || '食神只在最后几道差不多的菜里偏一点心，别太当真。';
  }

  const pillRename = new Map([
    ['热气型', '有热气'], ['有点醒', '有点劲'], ['安抚型', '稳当'], ['有反馈', '有口感'],
    ['汤水型', '带汤水'], ['清醒型', '清爽'], ['有仪式感', '像回事'], ['适合分担', '适合一起吃'],
    ['主食落地', '主食在场'], ['少费脑', '省心'], ['厚一点', '厚实'], ['偏航一下', '换换口']
  ]);

  let lastSignature = '';
  let applying = false;
  function patchResult() {
    if (applying) return;
    const result = $('result');
    if (!result || result.classList.contains('hidden')) return;
    const meal = $('mealName')?.textContent?.trim();
    const title = $('personaTitle')?.textContent?.trim();
    if (!meal || !title) return;
    const signature = `${meal}|${title}`;
    if (signature === lastSignature && result.dataset.voiceRefresh === '1') return;
    applying = true;

    const oldDaily = $('fortuneEvidence')?.textContent || '';
    const daily = [...oldDaily.matchAll(/“([^”]+)”/g)].map(match => match[1]).slice(0, 2);
    const crossNames = [...document.querySelectorAll('#crossList .cross-item b')].map(node => node.textContent.trim()).filter(Boolean);
    const states = axisState();
    const summary = axisTalk(states);
    const personaPot = $('personaPot');
    if (personaPot) personaPot.textContent = personaPot.textContent.replace(/^本命器型\s*·\s*/, '底子：').replace(' / ', ' · ');
    text('personaCaption', summary);
    text('psychVerdict', verdict(states, meal));
    text('psychEvidence', summary);

    const dailyLead = daily.length === 2
      ? `今天那两句落在“${daily[0]}”和“${daily[1]}”。本命没变，只是这会儿更想往这个方向收。`
      : '今天这两句只管眼下，不改那口锅本身。';
    const cross = crossNames.length ? `这道菜也不是谁的专属。放进十六口锅里，最挨着的是${crossNames.join('、')}。` : '';
    text('fortuneEvidence', `${dailyLead}${naturalFortune()}${cross}`);

    const conOptions = [
      `前面那些题只是把范围越收越窄，最后总得有一道菜站出来。${meal}刚好同时踩中了这口锅和今天的状态，就先让它上桌。`,
      `算到这里其实已经够了。再往下解释，就开始骗稿费了。${meal}——今天先它。`,
      `“像不像”和“想不想”本来就不是一回事。这里只把菜递过来，不管最后吃不吃。今天轮到${meal}；没兴趣，下面还有几个。`
    ];
    text('conEvidence', conOptions[(meal.length + title.length) % conOptions.length]);
    document.querySelectorAll('#crossList .cross-item span').forEach(node => { node.textContent = '也吃得通'; });
    document.querySelectorAll('#mealPills .pill').forEach(node => {
      if (pillRename.has(node.textContent)) node.textContent = pillRename.get(node.textContent);
    });
    text('footNote', '锅格占大头，今天再推一把，食神只负责最后那点偏心。');
    result.dataset.voiceRefresh = '1';
    lastSignature = signature;
    applying = false;
  }

  const result = $('result');
  if (result) new MutationObserver(() => queueMicrotask(patchResult)).observe(result, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  const intro = $('intro');
  if (intro) new MutationObserver(() => queueMicrotask(patchIntro)).observe(intro, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  const toastNode = $('toast');
  if (toastNode) {
    new MutationObserver(() => {
      if (toastNode.textContent === '菜单或锅格引擎没有接上') toastNode.textContent = '这口锅今天没点着';
      if (toastNode.textContent.startsWith('这些禁忌把菜单清空了')) toastNode.textContent = '菜单今天没接上，刷新一下再来';
    }).observe(toastNode, { childList: true, characterData: true, subtree: true });
  }

  $('acceptBtn')?.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const meal = $('mealName')?.textContent || '这道菜';
    if (toastNode) {
      toastNode.textContent = `行，今天就${meal}。到这儿别再研究了。`;
      toastNode.classList.add('on'); setTimeout(() => toastNode.classList.remove('on'), 1800);
    }
  }, true);

  function patchSharedInvite() {
    const invite = $('sharedInvite');
    if (!invite || invite.classList.contains('hidden')) return;
    const params = new URLSearchParams(location.search);
    const meal = params.get('meal') || '';
    const persona = params.get('persona') || params.get('type') || '';
    if (meal && persona) invite.textContent = `有人测出了「${persona}」，今天落到「${meal}」。这张锅递到手里了——照抄也行，自己测一遍也行。`;
    else if (meal || persona) invite.textContent = `有人把今天这道菜递过来了：${meal || persona}。顺手看看自己是哪口锅？`;
  }

  patchIntro(); patchResult(); patchSharedInvite();
})();
