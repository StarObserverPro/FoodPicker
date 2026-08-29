(() => {
  'use strict';
  const quoteNode = document.getElementById('literaryQuote');
  const creditNode = document.getElementById('literaryCredit');
  if (!quoteNode || !creditNode) return;

  const pool = Array.isArray(window.FOOD_LITERARY_QUOTES_V5) ? window.FOOD_LITERARY_QUOTES_V5 : [];
  if (!pool.length) return;

  let last = '';
  try { last = sessionStorage.getItem('foodpicker.last-literary-quote') || ''; } catch (_) {}
  const choices = pool.length > 1 ? pool.filter(item => item[0] !== last) : pool;
  const compact = choices.filter(item => String(item[1] || '').length <= 78 && Number(item[5] || 4) >= 4);
  const source = compact.length >= 8 ? compact : choices;
  const total = source.reduce((sum, item) => sum + Math.max(1, Number(item[4]) || 1), 0);
  let cursor = Math.random() * total;
  let picked = source[source.length - 1];

  for (const item of source) {
    cursor -= Math.max(1, Number(item[4]) || 1);
    if (cursor <= 0) { picked = item; break; }
  }

  quoteNode.textContent = picked[1];
  creditNode.textContent = `${picked[2]} · ${picked[3]}`;
  try { sessionStorage.setItem('foodpicker.last-literary-quote', picked[0]); } catch (_) {}
})();
