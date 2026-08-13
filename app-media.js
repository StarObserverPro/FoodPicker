const patternCanvas = document.getElementById('patternCanvas');
    const patternCtx = patternCanvas.getContext('2d');
    let patternItems = [];
    let patternW = 0, patternH = 0, patternDpr = 1, lastPatternPaint = 0;

    function createPatterns() {
      patternDpr = Math.min(devicePixelRatio || 1, 2);
      patternW = innerWidth; patternH = innerHeight;
      patternCanvas.width = Math.round(patternW * patternDpr);
      patternCanvas.height = Math.round(patternH * patternDpr);
      patternCtx.setTransform(patternDpr,0,0,patternDpr,0,0);
      const hues = [5, 28, 46, 145, 258, 190];
      const margin = Math.min(patternW,patternH) * .23;
      const edgePoint = () => {
        const side = Math.floor(Math.random()*4);
        if (side===0) return [rand(0,patternW), rand(0,margin)];
        if (side===1) return [rand(patternW-margin,patternW), rand(0,patternH)];
        if (side===2) return [rand(0,patternW), rand(patternH-margin,patternH)];
        return [rand(0,margin), rand(0,patternH)];
      };
      patternItems = Array.from({length: patternW < 600 ? 48 : 72}, (_,i) => {
        const [x,y] = edgePoint();
        return {
          x,y,type:i%5,baseHue:hues[i%hues.length],sat:rand(65,88),light:rand(55,72),alpha:rand(.25,.5),
          hueAmp:rand(9,28),hueSpeed:rand(.00008,.0002),breathSpeed:rand(.00035,.0008),
          angle:rand(-Math.PI,Math.PI),spin:rand(-.00018,.00018),
          phase:rand(0,Math.PI*2),speed:rand(.00035,.00075),
          ampX:rand(3,12),ampY:rand(3,11),line:rand(2.2,5),
          a:rand(18,58),b:rand(9,28),c:rand(3,12)
        };
      });
      renderPatterns(performance.now(), true);
    }

    function renderPatterns(now, force=false) {
      if (!force && (reduceMotion || now-lastPatternPaint < 34)) return;
      lastPatternPaint = now;
      const ctx = patternCtx;
      ctx.setTransform(patternDpr,0,0,patternDpr,0,0);
      ctx.clearRect(0,0,patternW,patternH);
      ctx.lineCap='round'; ctx.lineJoin='round';
      patternItems.forEach(item => {
        const swayX = reduceMotion ? 0 : Math.sin(now*item.speed + item.phase) * item.ampX;
        const swayY = reduceMotion ? 0 : Math.cos(now*item.speed*.87 + item.phase) * item.ampY;
        ctx.save(); ctx.translate(item.x+swayX,item.y+swayY); ctx.rotate(item.angle + now*item.spin);
        const breath = reduceMotion ? 1 : .78 + .22 * Math.sin(now * item.breathSpeed + item.phase);
        const hue = item.baseHue + (reduceMotion ? 0 : Math.sin(now * item.hueSpeed + item.phase) * item.hueAmp);
        const color = `hsl(${hue} ${item.sat}% ${item.light}%)`;
        ctx.globalAlpha=item.alpha * breath; ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=item.line;
        if(item.type===0){
          ctx.beginPath(); for(let t=0;t<=1;t+=.08){ const px=t*item.a; const py=Math.sin(t*Math.PI*3)*item.c; t===0?ctx.moveTo(px,py):ctx.lineTo(px,py);} ctx.stroke();
        } else if(item.type===1){
          ctx.beginPath(); ctx.arc(0,0,item.b*.55,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(item.a*.58,item.c*.25,item.c*.55,0,Math.PI*2); ctx.fill();
        } else if(item.type===2){
          for(let j=0;j<3;j++){ ctx.beginPath(); ctx.moveTo(j*10,0); ctx.quadraticCurveTo(j*10+8,-item.b*.65,j*10+16,0); ctx.stroke(); }
        } else if(item.type===3){
          ctx.beginPath(); ctx.roundRect(-item.c,-item.b*.4,item.a*.72,item.b,Math.max(4,item.c*.55)); ctx.fill();
        } else {
          ctx.beginPath(); ctx.moveTo(-item.a*.32,0); ctx.quadraticCurveTo(0,-item.b,item.a*.32,0); ctx.quadraticCurveTo(0,item.b,-item.a*.32,0); ctx.stroke();
        }
        ctx.restore();
      });
      const wash=ctx.createRadialGradient(patternW/2,patternH/2,0,patternW/2,patternH/2,Math.max(patternW,patternH)*.55);
      wash.addColorStop(0,'rgba(255,248,233,.9)'); wash.addColorStop(.55,'rgba(255,248,233,.45)'); wash.addColorStop(1,'rgba(255,248,233,0)');
      ctx.fillStyle=wash; ctx.fillRect(0,0,patternW,patternH);
    }

    function makeSkeletons() {
      imageGrid.innerHTML = '';
      [0,1,2].forEach(i => {
        const card=document.createElement('div'); card.className='image-card ready'; card.style.setProperty('--tilt', `${(i-1)*1.6}deg`); card.innerHTML='<div class="skeleton"></div>'; imageGrid.appendChild(card);
      });
    }


    function foodEmoji(mealName) {
      const rules = [[/披萨/,'🍕'],[/汉堡/,'🍔'],[/(塔可|玉米饼)/,'🌮'],[/(卷饼|法希塔)/,'🌯'],[/(三明治|法棍|贝果|帕尼尼)/,'🥪'],[/(饺|馄饨|云吞|锅贴|包)/,'🥟'],[/(面|米线|粉|意面)/,'🍜'],[/(炒饭|盖饭|米饭|饭碗)/,'🍚'],[/(炸鸡|鸡腿|鸡翅|鸡排)/,'🍗'],[/(鱼|虾|蟹|海鲜|龙虾)/,'🐟'],[/(沙拉|蔬菜碗)/,'🥗'],[/(汤|粥|羹)/,'🥣'],[/咖喱/,'🍛'],[/(烤肉|牛排|排骨)/,'🥩']];
      return (rules.find(([re])=>re.test(mealName)) || [null,'🍽️'])[1];
    }

    function renderImageCards(images, mealName, providerLabel='开放图片') {
      imageGrid.innerHTML='';
      images.slice(0,3).forEach((img,i)=>{
        const card=document.createElement('a');
        card.className='image-card'; card.style.setProperty('--tilt', `${(i-1)*1.6}deg`);
        card.href=img.link || moreImageLink.href; card.target='_blank'; card.rel='noopener noreferrer';
        const credit=[img.creator, img.license].filter(Boolean).join(' · ') || img.title || providerLabel;
        card.innerHTML=`<span class="source-badge">${escapeHTML(img.provider || providerLabel)}</span><img alt="${escapeHTML(mealName)} 相关图片 ${i+1}" src="${escapeAttr(img.thumbnail || img.original)}" loading="eager" referrerpolicy="no-referrer"><span class="credit">${escapeHTML(credit)}</span>`;
        const image=card.querySelector('img');
        image.addEventListener('error',()=>{ image.remove(); card.classList.add('image-missing'); card.insertAdjacentHTML('afterbegin', `<span class="image-placeholder">${foodEmoji(mealName)}</span>`); });
        imageGrid.appendChild(card); requestAnimationFrame(()=>setTimeout(()=>card.classList.add('ready'), i*90));
      });
    }

    async function loadImages(meal, refresh=false) {
      const mealName = meal.name;
      const region = meal.region;
      const searchQuery = meal.search || meal.native || mealName;
      if (imageAbort) imageAbort.abort();
      imageAbort = new AbortController();
      if (refresh) imageSeed += 17; else imageSeed = Math.abs(Array.from(searchQuery).reduce((n,c)=>((n*31+c.charCodeAt(0))|0),7));
      imageStatus.textContent = refresh ? '正在换一桌图片……' : '正在找相关食物图片……';
      moreImageLink.href = `https://cn.bing.com/images/search?q=${encodeURIComponent(searchQuery + ' food')}`;
      makeSkeletons();
      try {
        if (location.protocol === 'file:') throw new Error('LOCAL_FALLBACK');
        const endpoint = `/api/images?q=${encodeURIComponent(mealName)}&search=${encodeURIComponent(searchQuery)}&region=${encodeURIComponent(region)}&seed=${imageSeed}`;
        const res = await fetch(endpoint, { signal:imageAbort.signal });
        const data = await res.json().catch(()=>({}));
        if (!res.ok || !Array.isArray(data.images) || !data.images.length) throw new Error(data.message || '开放图片源暂时没有结果');
        renderImageCards(data.images, mealName, data.provider || '开放图片');
        const approx = data.images.some(x=>x.approximate);
        imageStatus.textContent = approx ? `按“${searchQuery}”找到的相关示意图` : `按“${searchQuery}”检索 · 图片已由本站转发`;
      } catch(err) {
        if (err.name==='AbortError') return;
        imageGrid.innerHTML='';
        [0,1,2].forEach((_,i)=>{
          const card=document.createElement('a');
          card.className='image-card image-missing ready';
          card.style.setProperty('--tilt', `${(i-1)*1.6}deg`);
          card.href=moreImageLink.href; card.target='_blank'; card.rel='noopener noreferrer';
          card.innerHTML=`<span class="source-badge">Bing 图片</span><span class="image-placeholder">${foodEmoji(mealName)}</span><span class="credit">点开搜索“${escapeHTML(searchQuery)}”</span>`;
          imageGrid.appendChild(card);
        });
        imageStatus.textContent='图片代理暂时不可用 · 可点卡片继续搜索';
      }
    }
