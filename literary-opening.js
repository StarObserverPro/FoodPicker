(() => {
  'use strict';

  const gate = document.getElementById('literaryGate');
  const quoteNode = document.getElementById('openingQuote');
  const sourceNode = document.getElementById('openingSource');
  const shell = document.querySelector('.shell');
  if (!gate) return;

  const allQuotes = Array.isArray(window.FOOD_LITERARY_QUOTES_V5)
    ? window.FOOD_LITERARY_QUOTES_V5
    : [];

  const pool = allQuotes.filter(item => item?.opening && item.text);

  function randomUnit() {
    if (window.crypto?.getRandomValues) {
      const buffer = new Uint32Array(1);
      window.crypto.getRandomValues(buffer);
      return buffer[0] / 4294967296;
    }
    return Math.random();
  }

  function pickQuote(items) {
    if (!items.length) return null;
    let lastId = '';
    try { lastId = sessionStorage.getItem('foodpicker.last-opening-quote') || ''; } catch (_) {}
    const candidates = items.length > 1 ? items.filter(item => item.id !== lastId) : items;
    const total = candidates.reduce((sum, item) => sum + 1, 0);
    let cursor = randomUnit() * total;
    let chosen = candidates[candidates.length - 1];
    for (const item of candidates) {
      cursor -= 1;
      if (cursor <= 0) {
        chosen = item;
        break;
      }
    }
    try { sessionStorage.setItem('foodpicker.last-opening-quote', chosen.id); } catch (_) {}
    return chosen;
  }

  const picked = pickQuote(pool);
  if (picked && quoteNode && sourceNode) {
    quoteNode.textContent = picked.text;
    sourceNode.textContent = `${picked.author} · ${picked.work}`;
    const length = Array.from(picked.text).length;
    gate.dataset.length = length > 58 ? 'long' : length < 30 ? 'short' : 'normal';
  }

  let closing = false;
  function dismiss() {
    if (closing) return;
    closing = true;
    gate.classList.add('is-leaving');
    document.body.classList.remove('opening-active');
    const finish = () => {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
      shell?.removeAttribute('aria-hidden');
      const next = document.getElementById('resumeBtn')?.classList.contains('hidden')
        ? document.getElementById('startBtn')
        : document.getElementById('resumeBtn');
      next?.focus({ preventScroll: true });
    };
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
    else setTimeout(finish, 620);
  }

  window.dismissFoodQuote = dismiss;
  gate.addEventListener('click', dismiss);
  shell?.setAttribute('aria-hidden', 'true');
  gate.addEventListener('transitionend', () => {
    if (!closing) return;
    shell?.removeAttribute('aria-hidden');
  }, { once: true });
})();
