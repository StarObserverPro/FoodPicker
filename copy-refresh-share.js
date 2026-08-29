(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let shareBlob = null;
  let shareUrl = '';

  function rounded(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius); ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius); ctx.closePath();
  }

  function wrap(ctx, value, width) {
    const lines = []; let line = '';
    for (const char of [...String(value || '')]) {
      const next = line + char;
      if (line && ctx.measureText(next).width > width) { lines.push(line); line = char; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  }

  function drawText(ctx, value, x, y, width, lineHeight, maxLines = 4) {
    const lines = wrap(ctx, value, width).slice(0, maxLines);
    lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
    return y + lines.length * lineHeight;
  }

  function currentShareLink() {
    const url = new URL(location.href);
    url.searchParams.set('meal', $('mealName')?.textContent || '今天吃点好的');
    url.searchParams.set('type', $('personaTitle')?.textContent || '一口锅');
    url.searchParams.set('from', 'share-card');
    return url.toString();
  }

  async function buildShareCard() {
    const meal = $('mealName')?.textContent || '今天吃点好的';
    const persona = $('personaTitle')?.textContent || '一口还没起名的锅';
    const verdict = $('psychVerdict')?.textContent || '';
    const axisCopy = $('psychEvidence')?.textContent || '';
    const cross = [...document.querySelectorAll('#crossList .cross-item b')].map(node => node.textContent.trim()).filter(Boolean).slice(0, 3);
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1440;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f3eadb'; ctx.fillRect(0, 0, 1080, 1440);
    ctx.fillStyle = '#fffaf0'; rounded(ctx, 66, 62, 948, 1316, 42); ctx.fill();
    ctx.fillStyle = '#a8322c'; ctx.font = '700 30px system-ui,sans-serif'; ctx.fillText('扎 心 版 · 今 天 吃 什 么', 112, 132);
    ctx.fillStyle = '#2f2923'; ctx.font = '800 72px STKaiti,Kaiti SC,serif'; ctx.fillText(persona, 112, 240);
    ctx.fillStyle = '#7c6f62'; ctx.font = '500 28px system-ui,sans-serif'; ctx.fillText('这口锅，和今天这道菜', 112, 292);
    ctx.fillStyle = '#d94d3f'; ctx.font = '900 88px STKaiti,Kaiti SC,serif'; drawText(ctx, meal, 112, 420, 750, 98, 2);
    ctx.fillStyle = '#332c26'; rounded(ctx, 104, 594, 872, 292, 30); ctx.fill();
    ctx.fillStyle = '#e9c85c'; ctx.font = '800 24px system-ui,sans-serif'; ctx.fillText('先 说 人 话', 146, 650);
    ctx.fillStyle = '#fff8e9'; ctx.font = '700 35px STKaiti,Kaiti SC,serif'; drawText(ctx, verdict, 146, 714, 786, 54, 3);
    ctx.fillStyle = '#2f2923'; ctx.font = '800 25px system-ui,sans-serif'; ctx.fillText('这口锅大概长这样', 112, 954);
    ctx.fillStyle = '#5f5246'; ctx.font = '500 27px system-ui,sans-serif'; drawText(ctx, axisCopy, 112, 1006, 610, 42, 4);
    if (cross.length) { ctx.fillStyle = '#7c6f62'; ctx.font = '700 22px system-ui,sans-serif'; ctx.fillText(`也很像：${cross.join(' · ')}`, 112, 1216); }
    shareUrl = currentShareLink();
    if (window.FoodPickerQR) window.FoodPickerQR.paint(ctx, shareUrl, 758, 1008, 190, { quiet: 4, dark: '#2f2923', light: '#fffaf0' });
    ctx.fillStyle = '#7c6f62'; ctx.font = '500 20px system-ui,sans-serif'; ctx.fillText('扫码，看看你是哪口锅', 752, 1228);
    ctx.fillText('二维码只回到这个页面，不带答题记录。', 112, 1320);
    shareBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.92));
    return URL.createObjectURL(shareBlob);
  }

  async function openShare(event) {
    event.preventDefault(); event.stopImmediatePropagation();
    const modal = $('shareModal'); const status = $('shareStatus'); const preview = $('sharePreview');
    modal?.classList.remove('hidden');
    if (status) { status.textContent = '正在画分享图……'; status.classList.remove('hidden'); }
    preview?.removeAttribute('src');
    try {
      const src = await buildShareCard();
      if (preview) preview.src = src;
      status?.classList.add('hidden');
    } catch (_) { if (status) status.textContent = '这张图没画出来。刷新一下再试。'; }
  }

  $('shareImageBtn')?.addEventListener('click', openShare, true);
  $('shareFileBtn')?.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!shareBlob) return;
    const file = new File([shareBlob], 'foodpicker-pot.png', { type: 'image/png' });
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: `今天测出个${$('personaTitle')?.textContent || '锅格'}` });
      } else {
        const a = document.createElement('a'); a.href = URL.createObjectURL(shareBlob); a.download = 'foodpicker-pot.png'; a.click();
      }
    } catch (error) {
      if (error?.name !== 'AbortError') { const status = $('shareStatus'); if (status) { status.textContent = '没发出去，算了，先自己留着。'; status.classList.remove('hidden'); } }
    }
  }, true);

  $('downloadBtn')?.addEventListener('click', event => {
    event.preventDefault(); event.stopImmediatePropagation();
    if (!shareBlob) return;
    const a = document.createElement('a'); a.href = URL.createObjectURL(shareBlob); a.download = 'foodpicker-pot.png'; a.click();
  }, true);

  $('copyLinkBtn')?.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    try {
      await navigator.clipboard.writeText(shareUrl || currentShareLink());
      const status = $('shareStatus'); if (status) { status.textContent = '链接抄好了'; status.classList.remove('hidden'); }
    } catch (_) {}
  }, true);

  $('copyResultBtn')?.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const value = `我测出个：${$('personaTitle')?.textContent || '一口锅'}\n今天落到：${$('mealName')?.textContent || ''}\n${$('psychVerdict')?.textContent || ''}\n${currentShareLink()}`;
    try {
      await navigator.clipboard.writeText(value);
      const toast = $('toast');
      if (toast) { toast.textContent = '抄好了，锅和菜都在'; toast.classList.add('on'); setTimeout(() => toast.classList.remove('on'), 1800); }
    } catch (_) {}
  }, true);
})();
