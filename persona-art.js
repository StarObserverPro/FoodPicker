(() => {
  'use strict';

  const ROOT = '/assets/persona';
  const PAPER = '#f8ecd7';
  const CREAM = '#fffaf0';
  const INK = '#2e2925';
  const FONT = '"SmileySansWeb","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
  const STEADY = '"Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif';

  const ART = {
    'iron-peak-origin': ['iron-peak-origin.webp'],
    'iron-peak-transform': ['iron-peak-transform.webp'],
    'iron-ground-origin': ['iron-ground-origin.webp'],
    'iron-ground-transform': ['iron-ground-transform.webp'],
    'pan-peak-origin': ['pan-peak.webp', 0],
    'pan-peak-transform': ['pan-peak.webp', 1],
    'pan-ground-origin': ['pan-ground.webp', 0],
    'pan-ground-transform': ['pan-ground.webp', 1],
    'hotpot-peak-origin': ['hotpot-peak.webp', 0],
    'hotpot-peak-transform': ['hotpot-peak.webp', 1],
    'hotpot-ground-origin': ['hotpot-ground.webp', 0],
    'hotpot-ground-transform': ['hotpot-ground.webp', 1],
    'claypot-peak-origin': ['claypot-peak.webp', 0],
    'claypot-peak-transform': ['claypot-peak.webp', 1],
    'claypot-ground-origin': ['claypot-ground.webp', 0],
    'claypot-ground-transform': ['claypot-ground.webp', 1]
  };

  const GROUPS = [
    ['ember', '真相 临界 清醒 直觉 破晓 岔路 野心 逆风 失控 偏航'],
    ['stage', '奇迹 心愿 远方 暗门 序章 彩蛋 浪漫 高光 谜底 答案 转机 梦想 冒险'],
    ['afterglow', '余温 晚班 日常 备用 旧时 后记 底色 后台 归途'],
    ['dusk', '黄昏 微光 长夜 深夜 失眠 周末 慢拍 雾气 余地 后院'],
    ['tidal', '心事 回声 暗流 雨季 退潮 潮汐'],
    ['clay', '秘密 昨日 故乡 旧梦 尾声']
  ];

  const ORACLE = {
    'iron-peak-origin': w => `你认门槛，也认真东西。平时不爱瞎起火，一旦看出哪儿不对，非得把那道线划清。今儿浮“${w}”，宜定，不宜拖。`,
    'iron-peak-transform': w => `你这口锅专门拿旧办法开刀。越卡住越想另造一条路，别人嫌折腾，你反而来精神。今儿浮“${w}”，宜改局，不宜守成。`,
    'iron-ground-origin': w => `你嘴上说算了，手上还是会把散掉的东西一点点捡回来。你信修得住，也信余温。今儿浮“${w}”，宜收尾，不宜硬撑。`,
    'iron-ground-transform': w => `你不是爱规矩，你只是受不了东西没个落脚处。乱局到你手里，总想重新搭成能过日子的样子。今儿浮“${w}”，宜归位，不宜添戏。`,
    'pan-peak-origin': w => `你对世界一直留着个收件地址。看着随和，心里其实很会等那一下“正好”。今儿浮“${w}”，宜接住，不宜催问。`,
    'pan-peak-transform': w => `你不太信事情只能照原样发生。只要气氛不对，你就想换灯、换位、换个说法。今儿浮“${w}”，宜加戏，不宜敷衍。`,
    'pan-ground-origin': w => `你是看灯的，不是赶路的。越乱的时候越会盯住一点还亮着的东西，等自己慢慢回来。今儿浮“${w}”，宜收，不宜硬冲。`,
    'pan-ground-transform': w => `你擅长把一堆没关系的小事缝成自己的日子。别人要答案，你更在意有没有余地。今儿浮“${w}”，宜松一点，不宜排满。`,
    'hotpot-peak-origin': w => `你看着能聊，其实最烦话说半截。你会在人堆和细节里捞那个真正的重点。今儿浮“${w}”，宜问到底，不宜装懂。`,
    'hotpot-peak-transform': w => `你不怕东西混在一起，怕的是混完还没新东西。你天然会拿现成条件炼第二种可能。今儿浮“${w}”，宜试配，不宜照抄。`,
    'hotpot-ground-origin': w => `你记人的方式，不是记结论，是记当时谁坐哪儿、谁没说话。你很会接住场面里的暗流。今儿浮“${w}”，宜听，不宜抢话。`,
    'hotpot-ground-transform': w => `你天生会给不同的人留位置。不是没主意，是知道桌子不掀，事情才有下一轮。今儿浮“${w}”，宜圆场，不宜独断。`,
    'claypot-peak-origin': w => `你把重要的东西收得很深。平时不显山露水，一碰到真正在意的，就特别护。今儿浮“${w}”，宜保留，不宜清空。`,
    'claypot-peak-transform': w => `你恋旧，但不是为了原地待着。真正舍不得的东西，你更愿意把它装上船，带去下一站。今儿浮“${w}”，宜远行，不宜回头算账。`,
    'claypot-ground-origin': w => `你不是悲观，只是习惯替很多东西多守一会儿。别人散场以后，你还会留心那点没灭的灯。今儿浮“${w}”，宜养，不宜耗。`,
    'claypot-ground-transform': w => `你擅长把旧事重新讲到能继续过日子。记忆在你这儿不是仓库，是会改写下一顿饭的火。今儿浮“${w}”，宜回味，不宜翻旧账。`
  };

  const cache = new Map();
  let shareAsset = null;

  function image(src) {
    if (cache.has(src)) return cache.get(src);
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`persona asset failed: ${src}`));
      img.src = src;
    });
    cache.set(src, promise);
    return promise;
  }

  function idOf(profile) { return profile?.archetypeId || profile?.archetype?.id; }
  function groupOf(word) {
    return GROUPS.find(([, words]) => (` ${words} `).includes(` ${word} `))?.[0] || 'afterglow';
  }
  function titleOf(profile) {
    const a = profile?.archetype || {};
    return `${a.pot || ''} · ${profile?.word || ''}${a.role || ''}`.replace(/^ · /, '').trim();
  }
  function oracleOf(profile) {
    const word = profile?.word || '今日';
    return (ORACLE[idOf(profile)] || (w => `你今天这口锅不争快慢，只认那个真正落得下去的念头。今儿浮“${w}”，宜顺势，不宜硬拧。`))(word);
  }

  async function compose(profile, meal) {
    const spec = ART[idOf(profile)];
    if (!spec) return null;
    const [bg, fg] = await Promise.all([
      image(`${ROOT}/float-${groupOf(profile?.word)}.svg`),
      image(`${ROOT}/${spec[0]}`)
    ]);
    const canvas = document.createElement('canvas');
    canvas.width = 720; canvas.height = 900;
    const ctx = canvas.getContext('2d');
    const bgScale = Math.max(720 / bg.naturalWidth, 900 / bg.naturalHeight);
    const bw = bg.naturalWidth * bgScale, bh = bg.naturalHeight * bgScale;
    ctx.drawImage(bg, (720 - bw) / 2, (900 - bh) / 2, bw, bh);
    if (spec.length === 1) {
      ctx.drawImage(fg, 30, 82, 660, 825);
    } else {
      const sw = fg.naturalWidth / 2;
      ctx.drawImage(fg, spec[1] * sw, 0, sw, fg.naturalHeight, 30, 82, 660, 825);
    }
    const url = canvas.toDataURL('image/webp', .86);
    const out = await image(url);
    const detail = { id: idOf(profile), profile, meal, title: titleOf(profile), oracle: oracleOf(profile), url, image: out };
    window.FoodPickerPersonaState = detail;
    window.dispatchEvent(new CustomEvent('foodpicker:persona-art', { detail }));
    return { url, image: out };
  }

  function injectStyles() {
    if (document.getElementById('persona-oracle-style')) return;
    const style = document.createElement('style');
    style.id = 'persona-oracle-style';
    style.textContent = `
      .result-clean:not(.direct-mode) .result-hero{aspect-ratio:4/5;background:${PAPER};border-radius:28px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.58),0 16px 42px rgba(46,41,37,.08)}
      .result-clean:not(.direct-mode) .result-art,.result-clean:not(.direct-mode) .persona-art-image{position:absolute;inset:0;width:100%;height:100%}
      .result-clean:not(.direct-mode) .persona-art-image{object-fit:cover;object-position:center}
      .result-clean:not(.direct-mode) .persona-float{left:6%;right:6%;top:5.8%;bottom:auto;padding:14px 15px 15px;background:rgba(255,250,240,.84);border:1px solid rgba(255,255,255,.62);border-radius:20px;color:${INK};box-shadow:0 12px 32px rgba(38,32,27,.11);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
      .result-clean:not(.direct-mode) .persona-title{font-size:clamp(23px,6.4vw,30px);line-height:1.08;letter-spacing:.01em}
      .result-clean:not(.direct-mode) .result-cross-list{display:block;margin-top:9px}
      .result-clean:not(.direct-mode) .result-cross-list .cross-item{display:none!important}
      .persona-oracle{margin:0;font-family:var(--steady);font-size:13px;line-height:1.62;color:#4a433b;text-wrap:pretty}
      .result-clean:not(.direct-mode) .result-body{gap:7px}
      .result-clean:not(.direct-mode) .result-body::before{content:'今儿不折腾了，就吃这个。';display:block;margin:1px 0 -1px;font-family:var(--design);font-size:14px;color:#776f65;letter-spacing:.01em}
      .result-clean:not(.direct-mode) .meal{font-size:clamp(34px,9vw,45px)}
      .result-clean:not(.direct-mode) .result-verdict,.result-clean:not(.direct-mode) .result-alt-list{display:none!important}
      .result-clean:not(.direct-mode) .result-actions{margin-top:5px}
      @media(max-width:380px){.result-clean:not(.direct-mode) .persona-float{left:5%;right:5%;top:5%;padding:12px 13px}.persona-oracle{font-size:12.5px;line-height:1.55}}
    `;
    document.head.appendChild(style);
  }

  function applyCopy(detail) {
    const result = document.getElementById('result');
    if (!result || result.classList.contains('direct-mode')) return;
    const title = document.getElementById('personaTitle');
    const cross = document.getElementById('crossList');
    if (title) title.textContent = detail.title;
    if (cross) {
      cross.replaceChildren();
      cross.setAttribute('aria-label', '锅格判词');
      const p = document.createElement('p');
      p.className = 'persona-oracle';
      p.textContent = detail.oracle;
      cross.appendChild(p);
    }
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  }
  function lines(ctx, text, width) {
    const out = []; let line = '';
    for (const ch of Array.from(String(text || ''))) {
      if (line && ctx.measureText(line + ch).width > width) { out.push(line); line = ch; }
      else line += ch;
    }
    if (line) out.push(line);
    return out;
  }
  function drawLines(ctx, text, x, y, width, height, max) {
    lines(ctx, text, width).slice(0, max).forEach((line, i) => ctx.fillText(line, x, y + i * height));
  }
  function drawMeal(ctx, text, x, y, width) {
    let size = 61, wrapped = [];
    do { ctx.font = `400 ${size}px ${FONT}`; wrapped = lines(ctx, text, width); size -= 2; } while (wrapped.length > 2 && size >= 38);
    const shown = wrapped.slice(0, 2);
    shown.forEach((line, i) => ctx.fillText(line, x, y + i * Math.round((size + 2) * 1.04)));
    return shown.length;
  }
  function blobOf(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(v => v ? resolve(v) : reject(new Error('share canvas failed')), 'image/png'));
  }
  function toast(text) {
    const node = document.getElementById('toast');
    if (!node) return;
    node.textContent = text; node.classList.add('on');
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.classList.remove('on'), 1800);
  }
  function isPersonalized() {
    const result = document.getElementById('result');
    const state = window.FoodPickerPersonaState;
    return Boolean(result && !result.classList.contains('direct-mode') && state?.meal?.name === (document.getElementById('mealName')?.textContent || ''));
  }

  async function makeShare() {
    if (!isPersonalized()) return false;
    const state = window.FoodPickerPersonaState;
    const modal = document.getElementById('shareModal');
    const status = document.getElementById('shareStatus');
    const preview = document.getElementById('sharePreview');
    const share = document.getElementById('shareFileBtn');
    const download = document.getElementById('downloadBtn');
    if (!state?.image || !preview || !modal) return false;
    if (shareAsset?.url) URL.revokeObjectURL(shareAsset.url);
    shareAsset = null;
    modal.classList.remove('hidden'); document.body.classList.add('share-open');
    if (status) { status.textContent = '正在画图……'; status.classList.remove('hidden'); }
    if (share) share.disabled = true; if (download) download.disabled = true;

    const canvas = document.createElement('canvas'); canvas.width = 900; canvas.height = 1350;
    const ctx = canvas.getContext('2d'); if (!ctx) return false;
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 900, 1350); ctx.drawImage(state.image, 0, 0, 900, 1125);
    ctx.fillStyle = 'rgba(255,250,240,.86)'; roundRect(ctx, 54, 64, 792, 300, 28); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.68)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = INK; ctx.font = `400 47px ${FONT}`; ctx.fillText(state.title, 86, 132);
    ctx.fillStyle = '#4a433b'; ctx.font = `400 26px ${STEADY}`; drawLines(ctx, state.oracle, 86, 185, 728, 43, 4);
    ctx.fillStyle = 'rgba(255,250,240,.96)'; ctx.fillRect(0, 1125, 900, 225);
    ctx.fillStyle = '#776f65'; ctx.font = `400 25px ${FONT}`; ctx.fillText('今儿不折腾了，就吃这个。', 58, 1180);
    ctx.fillStyle = INK; const mealLines = drawMeal(ctx, state.meal.name || '', 58, 1248, 690);
    if (state.meal.native && mealLines < 2) { ctx.fillStyle = '#83796f'; ctx.font = `400 20px ${STEADY}`; ctx.fillText(state.meal.native, 60, 1320); }
    ctx.fillStyle = '#91877c'; ctx.font = `400 18px ${FONT}`; ctx.textAlign = 'right'; ctx.fillText('今天吃什么', 842, 1324); ctx.textAlign = 'left';

    try {
      const blob = await blobOf(canvas); const url = URL.createObjectURL(blob); const name = `今天吃什么-${state.meal.name || '结果'}.png`;
      const file = typeof File === 'function' ? new File([blob], name, { type: 'image/png' }) : null;
      shareAsset = { blob, url, name, file, state };
      preview.src = url; if (status) status.classList.add('hidden'); if (share) share.disabled = false; if (download) download.disabled = false;
      return true;
    } catch (error) {
      console.error('[FoodPicker] oracle share failed', error); if (status) status.textContent = '刚才没画成，再点一次。'; toast('刚才没画成，再来一下'); return false;
    }
  }

  function downloadShare() {
    if (!shareAsset) return;
    const a = document.createElement('a'); a.href = shareAsset.url; a.download = shareAsset.name; document.body.appendChild(a); a.click(); a.remove();
  }
  async function shareNow() {
    if (!shareAsset) return;
    const { file, state } = shareAsset;
    try {
      if (file && navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
        await navigator.share({ files: [file], title: `${state.title} · ${state.meal.name}`, text: `今儿不折腾了，就吃${state.meal.name}。` });
      } else if (navigator.share) {
        await navigator.share({ title: `${state.title} · ${state.meal.name}`, text: `今儿不折腾了，就吃${state.meal.name}。`, url: location.href });
      } else { downloadShare(); toast('图先存下来了'); }
    } catch (error) { if (error?.name !== 'AbortError') toast('没发出去，先存图吧'); }
  }
  function wireShare() {
    document.getElementById('acceptBtn')?.addEventListener('click', event => {
      if (!isPersonalized()) return; event.preventDefault(); event.stopImmediatePropagation(); makeShare();
    }, true);
    document.getElementById('shareFileBtn')?.addEventListener('click', event => {
      if (!shareAsset || !isPersonalized()) return; event.preventDefault(); event.stopImmediatePropagation(); shareNow();
    }, true);
    document.getElementById('downloadBtn')?.addEventListener('click', event => {
      if (!shareAsset || !isPersonalized()) return; event.preventDefault(); event.stopImmediatePropagation(); downloadShare();
    }, true);
  }

  injectStyles();
  window.addEventListener('foodpicker:persona-art', event => applyCopy(event.detail));
  wireShare();
  window.FoodPickerPersonaArt = Object.freeze({ load: compose, titleFor: titleOf, oracleFor: oracleOf });
})();
