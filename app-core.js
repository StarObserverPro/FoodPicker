const app = document.getElementById('app');
    const floatLayer = document.getElementById('floatLayer');
    const wordEls = [document.getElementById('wordA'), document.getElementById('wordB')];
    const regionChip = document.getElementById('regionChip');
    const mealNative = document.getElementById('mealNative');
    const imageGrid = document.getElementById('imageGrid');
    const imageStatus = document.getElementById('imageStatus');
    const moreImageLink = document.getElementById('moreImageLink');
    const spinButton = document.getElementById('spinButton');
    const shareButton = document.getElementById('shareButton');
    const imageButton = document.getElementById('imageButton');
    const toastEl = document.getElementById('toast');
    const reel = document.getElementById('reel');
    const subtitle = document.getElementById('subtitle');
    const confettiEl = document.getElementById('confetti');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let running = true;
    let currentIndex = Math.floor(Math.random() * FOODS.length);
    let currentMeal = FOODS[currentIndex];
    let activeWord = 0;
    let wordTransitionFrame = 0;
    let rollTimer = 0;
    let animationFrame = 0;
    let floatWords = [];
    let lastFrame = performance.now();
    let toastTimer = 0;
    let imageAbort = null;
    let imageSeed = 0;
    subtitle.textContent = `${FOODS.length} 种简餐，点一下汉堡让命运决定`;

    const rand = (min, max) => Math.random() * (max - min) + min;
    const replaceURL = (path, state={}) => { try { if (/^https?:$/.test(location.protocol)) history.replaceState(state, '', path); } catch {} };
    const pickMeal = () => {
      let next;
      do next = Math.floor(Math.random() * FOODS.length); while (next === currentIndex && FOODS.length > 1);
      currentIndex = next;
      currentMeal = FOODS[next];
      return currentMeal;
    };

    function applyMealSizing(name, stopped = !running, hasNative = !!currentMeal?.native) {
      const length = Array.from(String(name).replace(/\s/g, '')).length;
      const mobile = innerWidth < 520;
      let font, height;
      if (stopped) {
        if (length <= 8) { font = mobile ? 50 : 74; height = mobile ? 142 : 166; }
        else if (length <= 13) { font = mobile ? 42 : 61; height = mobile ? 158 : 178; }
        else if (length <= 19) { font = mobile ? 35 : 50; height = mobile ? 184 : 202; }
        else { font = mobile ? 30 : 42; height = mobile ? 210 : 228; }
      } else {
        if (length <= 8) { font = mobile ? 44 : 67; height = mobile ? 116 : 132; }
        else if (length <= 13) { font = mobile ? 37 : 56; height = mobile ? 126 : 144; }
        else if (length <= 19) { font = mobile ? 31 : 46; height = mobile ? 142 : 158; }
        else { font = mobile ? 27 : 39; height = mobile ? 160 : 178; }
      }
      if (hasNative) height += stopped ? (innerWidth < 520 ? 30 : 36) : (innerWidth < 520 ? 24 : 28);
      reel.style.setProperty('--meal-font', `${font}px`);
      reel.style.setProperty('--reel-height', `${height}px`);
    }

    function setWord(meal, immediate=false) {
      currentMeal = meal;
      const native = meal.native || nativeNameFor(meal.name, meal.region);
      meal.native = native;
      meal.search = meal.search || native || meal.name;
      mealNative.textContent = native;
      reel.classList.toggle('has-native', !!native);
      applyMealSizing(meal.name, !running, !!native);
      if (wordTransitionFrame) { cancelAnimationFrame(wordTransitionFrame); wordTransitionFrame = 0; }
      const oldEl = wordEls[activeWord];
      const newIndex = 1 - activeWord;
      const newEl = wordEls[newIndex];
      newEl.textContent = meal.name;
      newEl.className = 'reel-word';
      if (immediate) {
        oldEl.className = 'reel-word';
        newEl.className = 'reel-word active';
      } else {
        wordTransitionFrame = requestAnimationFrame(() => {
          oldEl.className = 'reel-word exit';
          newEl.className = 'reel-word active';
          wordTransitionFrame = 0;
        });
      }
      activeWord = newIndex;
    }

    function rollStep() { if (running) setWord(pickMeal()); }
    function startRolling() {
      running = true;
      app.classList.remove('stopped');
      imageGrid.innerHTML = '';
      spinButton.setAttribute('aria-label', '暂停随机选择');
      spinButton.textContent = '🍔';
      applyMealSizing(currentMeal.name, false, !!currentMeal.native);
      replaceURL(location.pathname);
      clearInterval(rollTimer);
      rollTimer = setInterval(rollStep, reduceMotion ? 340 : (innerWidth < 520 ? 145 : 125));
      if (!animationFrame) {
        lastFrame = performance.now();
        animationFrame = requestAnimationFrame(animateFloats);
      }
    }

    function stopRolling(forcedMeal=null) {
      if (!running && !forcedMeal) return;
      running = false;
      clearInterval(rollTimer);
      if (forcedMeal) {
        const found = FOODS.find(x => x.name === forcedMeal) || { name: forcedMeal, region: '今日推荐', native: '', search: forcedMeal };
        currentMeal = found;
        currentIndex = Math.max(0, FOODS.findIndex(x => x.name === found.name));
        setWord(found, true);
      } else {
        setWord(currentMeal, true);
      }
      regionChip.textContent = currentMeal.region;
      app.classList.add('stopped');
      spinButton.setAttribute('aria-label', '再摇一次');
      spinButton.textContent = '🍔';
      const sharePath = `/share?meal=${encodeURIComponent(currentMeal.name)}&region=${encodeURIComponent(currentMeal.region)}`;
      replaceURL(sharePath, { meal: currentMeal.name });
      burstConfetti();
      loadImages(currentMeal);
    }

    function createFloats() {
      floatLayer.innerHTML = '';
      const count = innerWidth < 600 ? 10 : 15;
      floatWords = Array.from({ length: count }, (_, i) => {
        const el = document.createElement('div');
        el.className = 'float-word';
        el.textContent = FOODS[Math.floor(Math.random()*FOODS.length)].name;
        const edgeBias = i % 3 !== 0;
        const x = edgeBias ? (Math.random() < .5 ? rand(-40, innerWidth*.18) : rand(innerWidth*.72, innerWidth-20)) : rand(20, innerWidth-120);
        const y = rand(innerHeight*.15, innerHeight*.82);
        const item = {
          el, x, y,
          vx: rand(-13,13) || 8,
          vy: rand(-8,8) || 5,
          size: rand(innerWidth < 600 ? 15 : 17, innerWidth < 600 ? 26 : 34),
          opacity: rand(.36,.78),
          nextSwap: performance.now() + rand(160,480),
          rotate: rand(-9,9)
        };
        el.style.fontSize = item.size + 'px';
        el.style.opacity = item.opacity;
        el.style.transform = `translate3d(${x}px,${y}px,0) rotate(${item.rotate}deg)`;
        floatLayer.appendChild(el);
        return item;
      });
    }

    function animateFloats(now) {
      const dt = Math.min((now-lastFrame)/1000, .034); lastFrame=now;
      floatWords.forEach(item => {
        if (running) {
          item.x += item.vx*dt; item.y += item.vy*dt;
          const w = item.el.offsetWidth || 100;
          if (item.x < -w) item.x = innerWidth + 15;
          if (item.x > innerWidth + 20) item.x = -w;
          if (item.y < 105) { item.y = 105; item.vy = Math.abs(item.vy); }
          if (item.y > innerHeight-120) { item.y = innerHeight-120; item.vy = -Math.abs(item.vy); }
          if (now > item.nextSwap) {
            item.el.textContent = FOODS[Math.floor(Math.random()*FOODS.length)].name;
            item.nextSwap = now + rand(170,430);
          }
          const wobble = Math.sin(now/620 + item.x*.01)*2.5;
          item.el.style.transform = `translate3d(${item.x}px,${item.y+wobble}px,0) rotate(${item.rotate+wobble*.3}deg)`;
        }
      });
      renderPatterns(now);
      animationFrame = requestAnimationFrame(animateFloats);
    }
