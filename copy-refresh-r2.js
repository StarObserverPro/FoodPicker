(() => {
  'use strict';
  const E = window.FOOD_PICKER_ENGINE;
  if (!E) return;

  const daily = Object.fromEntries(E.DAILY_QUESTIONS.map(q => [q.id, q]));
  const world = daily['world-request'];
  if (world) {
    world.phase = '今天这会儿';
    world.text = '接下来的两个小时，你最希望世界对你做什么？';
    world.hint = '别解释，挑一个。';
    const copy = [
      ['别再让我作决定', '后面最好别再来一道选择题'],
      ['给我一个明确的刺激', '把今天从灰里敲醒一下'],
      ['让我觉得今天还算值得', '不用多隆重，至少留个像样的结尾'],
      ['让周围重新有一点人声', '热闹一点也行，别再一个人闷着']
    ];
    copy.forEach(([title, sub], i) => {
      if (!world.options[i]) return;
      world.options[i].title = title;
      world.options[i].sub = sub;
    });
  }

  const bandwidth = daily.bandwidth;
  if (bandwidth) {
    bandwidth.phase = '今天这会儿';
    bandwidth.text = '今晚你还愿意为一顿饭留下多少精神带宽？';
    bandwidth.hint = '凭第一反应。';
    const copy = [
      ['最好连第二步都没有', '定下来就完事，别再给我开新项目'],
      ['可以有一个小小步骤', '稍微来点意思行，别搞复杂'],
      ['今晚可以认真一点', '今天还有兴致，多两步也无所谓'],
      ['步骤随意，但别太沉', '脑子还能转，胃口想轻一点收尾']
    ];
    copy.forEach(([title, sub], i) => {
      if (!bandwidth.options[i]) return;
      bandwidth.options[i].title = title;
      bandwidth.options[i].sub = sub;
    });
  }

  const $ = id => document.getElementById(id);
  function patchIntro() {
    const hasSaved = $('savedProfile') && !$('savedProfile').classList.contains('hidden');
    if (hasSaved) {
      if ($('resumeBtn')) $('resumeBtn').textContent = '今天往锅里来一卦';
      if ($('retestBtn')) $('retestBtn').textContent = '再来一锅';
    } else if ($('startBtn')) {
      $('startBtn').textContent = '来，看看啥锅';
    }
    if ($('introModeCopy')) $('introModeCopy').textContent = '别琢磨太久，顺手点。';
  }

  patchIntro();
  const intro = $('intro');
  if (intro) new MutationObserver(() => queueMicrotask(patchIntro)).observe(intro, {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
})();
