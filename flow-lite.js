(() => {
  'use strict';

  const $ = id => document.getElementById(id);

  function refreshIntro() {
    const hasSaved = Boolean($('savedProfile') && !$('savedProfile').classList.contains('hidden'));
    if (hasSaved) {
      if ($('resumeBtn')) $('resumeBtn').textContent = '今天往锅里来一卦';
      if ($('retestBtn')) $('retestBtn').textContent = '再来一锅';
    } else if ($('startBtn')) {
      $('startBtn').textContent = '来，看看啥锅';
    }
    if ($('introModeCopy')) $('introModeCopy').textContent = '';
  }

  const savedProfile = $('savedProfile');
  refreshIntro();
  if (savedProfile) {
    new MutationObserver(refreshIntro).observe(savedProfile, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  const conditions = $('conditions');
  let skipping = false;
  function skipConditions() {
    if (!conditions || conditions.classList.contains('hidden') || skipping) return;
    skipping = true;
    requestAnimationFrame(() => {
      $('calculateBtn')?.click();
      skipping = false;
    });
  }
  if (conditions) {
    new MutationObserver(skipConditions).observe(conditions, {
      attributes: true,
      attributeFilter: ['class']
    });
    skipConditions();
  }

  function axisSides() {
    return [...document.querySelectorAll('#axisBars .axis-dot')]
      .map(dot => Number.parseFloat(dot.style.left || '50') >= 50);
  }

  function compactPersona(states) {
    const first = states[0] ? '遇事喜欢往前推' : '更愿意让事情慢慢落定';
    const second = states[1] ? '话和口感都得有点边儿' : '累的时候，先舒服再说';
    return `${first}，${second}。`;
  }

  function compactVerdict(states, meal) {
    const lead = states[0] ? '今儿得来点动静' : '今儿适合慢一点';
    const tail = states[1] ? '，嘴里也得有点回应' : '，别再跟吃的较劲了';
    return `${lead}${tail}。那就先吃${meal}。`;
  }

  function patchResult() {
    const result = $('result');
    const meal = $('mealName')?.textContent?.trim();
    if (!result || result.classList.contains('hidden') || !meal) return;
    const states = axisSides();
    if ($('personaCaption')) $('personaCaption').textContent = compactPersona(states);
    if ($('psychVerdict')) $('psychVerdict').textContent = compactVerdict(states, meal);
    document.querySelectorAll('#crossList .cross-item span').forEach(node => {
      node.textContent = '也吃得通';
    });
  }

  const mealName = $('mealName');
  if (mealName) {
    new MutationObserver(() => queueMicrotask(patchResult)).observe(mealName, {
      childList: true,
      characterData: true,
      subtree: true
    });
  }

  const loadingLine = $('loadingLine');
  if (loadingLine) {
    new MutationObserver(() => {
      const loading = $('loading');
      if (loading && !loading.classList.contains('hidden')) {
        loadingLine.textContent = '先看看哪道菜最会来事。';
      }
    }).observe($('loading'), { attributes: true, attributeFilter: ['class'] });
  }
})();
