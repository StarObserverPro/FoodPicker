(() => {
  'use strict';
  const screen = document.getElementById('literaryIntro');
  const quoteNode = document.getElementById('literaryQuote');
  const creditNode = document.getElementById('literaryCredit');
  if (!screen) {
    document.documentElement.classList.remove('literary-pending');
    document.documentElement.classList.add('literary-entered');
    return;
  }

  const pool = Array.isArray(window.FOOD_LITERARY_QUOTES_V5) ? window.FOOD_LITERARY_QUOTES_V5 : [];

  if (pool.length) {
    let last = '';
    try { last = sessionStorage.getItem('foodpicker.last-literary-quote') || ''; } catch (_) {}
    const choices = pool.length > 1 ? pool.filter(item => item[0] !== last) : pool;
    const total = choices.reduce((sum, item) => sum + Math.max(1, item[4] || 1), 0);
    let cursor = Math.random() * total;
    let picked = choices[choices.length - 1];
    for (const item of choices) {
      cursor -= Math.max(1, item[4] || 1);
      if (cursor <= 0) { picked = item; break; }
    }
    quoteNode.textContent = picked[1];
    creditNode.textContent = `${picked[2]} · ${picked[3]}`;
    try { sessionStorage.setItem('foodpicker.last-literary-quote', picked[0]); } catch (_) {}
  }

  let leaving = false;
  let autoTimer = null;
  const enter = () => {
    if (leaving) return;
    leaving = true;
    if (autoTimer) clearTimeout(autoTimer);
    screen.classList.add('is-leaving');
    document.documentElement.classList.remove('literary-pending');
    document.documentElement.classList.add('literary-entered');
    window.setTimeout(() => {
      screen.hidden = true;
      const next = document.querySelector('#resumeBtn:not(.hidden),#startBtn:not(.hidden)');
      next?.focus({ preventScroll: true });
    }, 620);
  };

  screen.addEventListener('click', enter, { once: true });
  autoTimer = window.setTimeout(enter, 8000);
})();
