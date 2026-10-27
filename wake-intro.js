(() => {
  'use strict';
  const root = document.getElementById('wakeIntro');
  const layer = document.getElementById('wakeLines');
  const scene = document.getElementById('wakeScene');
  const wipe = document.getElementById('wakeWipe');
  const skip = document.getElementById('wakeSkip');
  const inner = document.querySelector('.paper > .inner');
  if (!root || !layer || !scene || !wipe || !skip || !inner) return;

  // The real home screen is already mounted underneath. Failure/reduced motion
  // must always leave it usable, including after an offline revisit.
  const params = new URLSearchParams(location.search);
  if (params.get('intro') === '0' || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.remove();
    return;
  }

  const DURATION = 16200;
  const OUTRO = 13300;
  const QUOTE = 14300;
  const script = [
    ['hey', '诶，', 390, 4800, 28, 24, 27, 0],
    ['awake', '你醒了？', 1160, 4900, 50, 33, 42, -1],
    ['saw', '刚才看你', 2300, 5240, 36, 42, 24, 0],
    ['desk', '趴在我桌上', 3040, 5240, 63, 51, 34, 0],
    ['still', '半天没动，', 3780, 5240, 42, 62, 27, 0],
    ['thought', '我还以为你', 4510, 5370, 49, 71, 25, 0],
    ['faint', '饿晕了', 5390, 7130, 51, 53, 81, 0],
    ['look', '你看看，', 7050, 9500, 35, 27, 23, 0],
    ['blink', '一睁眼', 7760, 9650, 47, 36, 27, 0],
    ['meal', mealLine(new Date().getHours()), 8460, 9900, 52, 48, 32, 0],
    ['think', '你想好', 9770, 11800, 47, 41, 25, 0],
    // The ending “了吗？” is part of this same cue, not a separate beat.
    ['what', '吃什么了吗？', 10400, 16000, 48, 56, 81, 0],
    ['cannot', '想不明白的话，', 11900, 13350, 36, 74, 20, 0],
    ['help', '我帮你琢磨琢磨。', 12530, 13550, 50, 83, 25, 0]
  ];

  function mealLine(hour) {
    if (hour >= 5 && hour < 10) return '都该吃早饭了。';
    if (hour >= 10 && hour < 14) return '都该吃午饭了。';
    if (hour >= 14 && hour < 17) return '都下午了。';
    if (hour >= 17 && hour < 22) return '都该吃晚饭了。';
    return '都到夜宵时间了。';
  }
  function clamp(n) { return Math.max(0, Math.min(1, n)); }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function outBack(t) {
    const c1 = 1.70158;
    return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
  function mix(a, b, t) { return a + (b - a) * t; }

  for (let i = 0; i < 25; i++) {
    const bar = document.createElement('i');
    const height = 22 + 68 * (.5 + .5 * Math.sin(i * 1.97)) * Math.sin((i + 1) * .82) ** 2;
    bar.style.setProperty('--h', height + '%');
    bar.style.setProperty('--delay', String(i * 59));
    document.getElementById('wakeWave').append(bar);
  }
  const cues = script.map(([key, text, start, end, x, y, size, rotate]) => {
    const el = document.createElement('span');
    el.className = 'wake-cue';
    el.dataset.key = key;
    el.style.setProperty('--x', x + '%');
    el.style.setProperty('--y', y + '%');
    el.style.setProperty('--size', (size / 3.9).toFixed(3) + 'cqw');
    if (key === 'what') {
      el.setAttribute('aria-label', text);
      const main = document.createElement('span');
      main.className = 'wake-what-main';
      for (const char of '吃什么') {
        const glyph = document.createElement('span');
        glyph.className = 'wake-what-glyph';
        glyph.textContent = char;
        main.append(glyph);
      }
      const echo = document.createElement('span');
      echo.className = 'wake-what-echo';
      echo.textContent = '吃什么';
      echo.setAttribute('aria-hidden', 'true');
      const stroke = document.createElement('span');
      stroke.className = 'wake-what-stroke';
      stroke.setAttribute('aria-hidden', 'true');
      const ring = document.createElement('span');
      ring.className = 'wake-what-hit';
      ring.setAttribute('aria-hidden', 'true');
      const tail = document.createElement('span');
      tail.className = 'wake-what-tail';
      tail.textContent = '了吗？';
      tail.setAttribute('aria-hidden', 'true');
      el.append(ring, echo, main, stroke, tail);
    } else {
      el.textContent = text;
    }
    layer.append(el);
    return { key, start, end, rotate, el };
  });

  let frameId = 0;
  let elapsed = 0;
  let previous = 0;
  let finished = false;
  root.hidden = false;
  inner.inert = true;
  skip.addEventListener('click', finish);
  document.addEventListener('keydown', onKeydown);

  function onKeydown(event) {
    if (event.key === 'Escape') finish();
  }
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(frameId);
    skip.removeEventListener('click', finish);
    document.removeEventListener('keydown', onKeydown);
    inner.inert = false;
    root.remove();
  }

  function drawCue(cue, time) {
    const { key, start, end, rotate, el } = cue;
    const age = time - start;
    if (age < 0) { el.style.opacity = '0'; return; }
    const emphasis = key === 'faint' || key === 'what';
    const duration = key === 'faint' ? 760 : key === 'what' ? 790 : 610;
    const progress = clamp(age / duration);
    const smooth = outCubic(progress);
    let opacity = progress;
    let dx = -22 * (1 - smooth);
    let dy = (emphasis ? -30 : 18) * (1 - smooth);
    let scale = emphasis ? mix(.7, 1, outBack(progress)) : mix(.92, 1, smooth);
    let blur = (1 - smooth) * 3;

    if (time > end) {
      const retire = clamp((time - end) / 640);
      opacity *= 1 - retire * .94;
      scale *= 1 - .035 * retire;
    }
    if (key === 'what' && time >= OUTRO) {
      const p = clamp((time - OUTRO) / 1100);
      const ease = p * p * (3 - 2 * p);
      scale = 1 + ease * 12;
      opacity = 1 - clamp((time - 14320) / 400);
      dx = 0; dy = 0;
      blur = ease * 1.8;
      el.style.zIndex = '21';
    }
    if (key === 'what') {
      el.querySelectorAll('.wake-what-glyph').forEach((glyph, index) => {
        const beat = clamp((age - index * 105) / 420);
        glyph.style.opacity = String(beat);
        glyph.style.transform = `translateY(${mix(22, 0, outCubic(beat)).toFixed(1)}px) scale(${mix(.69, 1, outBack(beat)).toFixed(3)})`;
        glyph.style.filter = `blur(${mix(4, 0, outCubic(beat)).toFixed(1)}px)`;
      });
      const tail = el.querySelector('.wake-what-tail');
      const arrive = outCubic(clamp((age - 230) / 340));
      const leave = clamp((time - (OUTRO - 180)) / 380);
      tail.style.opacity = String(arrive * (1 - leave));
      tail.style.transform = `translate(${(1 - arrive) * 4}px,${(1 - arrive) * 6 + leave * 13}px) scale(${mix(.92, 1, arrive).toFixed(3)})`;
      const echo = el.querySelector('.wake-what-echo');
      echo.style.opacity = String(clamp((age - 150) / 220) * mix(.6, .22, clamp((age - 700) / 1100)) * (1 - clamp((time - OUTRO) / 500)));
      echo.style.transform = `translate(${mix(14, 4, outCubic(clamp((age - 150) / 700))).toFixed(1)}px,${mix(11, 4, outCubic(clamp((age - 150) / 700))).toFixed(1)}px)`;
      const stroke = el.querySelector('.wake-what-stroke');
      stroke.style.opacity = String(outCubic(clamp((age - 450) / 260)) * (1 - clamp((time - (OUTRO - 80)) / 400)));
      stroke.style.transform = `scaleX(${outCubic(clamp((age - 460) / 550)).toFixed(3)})`;
      const ring = el.querySelector('.wake-what-hit');
      const hit = clamp((age - 120) / 820);
      ring.style.opacity = String(hit > 0 ? Math.sin(Math.PI * hit) * .42 : 0);
      ring.style.transform = `scale(${mix(.7, 1.16, outCubic(hit)).toFixed(3)})`;
    }
    if (time >= OUTRO && key !== 'what') opacity *= 1 - clamp((time - OUTRO) / 610);
    el.style.opacity = String(clamp(opacity));
    el.style.filter = `blur(${blur.toFixed(2)}px)`;
    el.style.transform = `translate(-50%,-50%) translate(${dx.toFixed(2)}px,${dy.toFixed(2)}px) rotate(${rotate}deg) scale(${scale.toFixed(3)})`;
  }

  function draw(time) {
    cues.forEach(cue => drawCue(cue, time));
    const reveal = clamp((time - QUOTE) / 900);
    const flash = time < 13650 ? 0 : time <= 14380 ? clamp((time - 13650) / 650) * .96 : 1 - clamp((time - 14380) / 740);
    wipe.style.opacity = String(flash);
    scene.style.opacity = String(1 - reveal);
    root.style.opacity = String(1 - reveal);
    skip.style.opacity = String(1 - clamp((time - OUTRO) / 300));
    skip.style.pointerEvents = time >= OUTRO ? 'none' : 'auto';
  }

  function tick(now) {
    if (finished) return;
    if (previous) elapsed += Math.min(250, now - previous);
    previous = now;
    draw(elapsed);
    if (elapsed >= DURATION) { finish(); return; }
    frameId = requestAnimationFrame(tick);
  }
  frameId = requestAnimationFrame(tick);
})();
