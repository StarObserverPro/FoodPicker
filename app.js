(() => {
  const foods = Array.isArray(window.FOODS) ? window.FOODS : [];
  if (!foods.length) return;

  const $ = id => document.getElementById(id);
  const app=$('app'), canvas=$('patternCanvas'), floatLayer=$('floatLayer');
  const wordA=$('wordA'), wordB=$('wordB'), mealNative=$('mealNative'), regionChip=$('regionChip');
  const resultPanel=$('resultPanel'), imageGrid=$('imageGrid'), imageStatus=$('imageStatus'), moreImageLink=$('moreImageLink');
  const shareButton=$('shareButton'), spinButton=$('spinButton'), imageButton=$('imageButton'), spinLabel=$('spinLabel'), toast=$('toast'), confetti=$('confetti');

  let running=true, current=randomFood(), activeWord=wordA, idleWord=wordB, lastSwap=0, imageOffset=0;
  const swapEvery = matchMedia('(max-width:600px)').matches ? 145 : 125;
  let floatItems=[];

  function randomFood(){ return foods[(Math.random()*foods.length)|0]; }
  function label(food){ return food && food.name ? food.name : '吃点好的'; }
  function setCurrent(food, stopped=false){
    current=food;
    const name=label(food);
    activeWord.textContent=name;
    mealNative.textContent=food.native || '';
    regionChip.textContent=food.region || '';
    activeWord.classList.toggle('long',name.length>10);
    activeWord.classList.toggle('xlong',name.length>15);
    if(stopped){
      document.title=`${name}｜一会儿吃啥呢？`;
      moreImageLink.href=`https://cn.bing.com/images/search?q=${encodeURIComponent(food.search||food.native||food.name)}`;
    }
  }

  function swapFood(now){
    const next=randomFood();
    idleWord.textContent=next.name;
    idleWord.classList.remove('active');
    requestAnimationFrame(()=>{
      activeWord.classList.remove('active');
      idleWord.classList.add('active');
      [activeWord,idleWord]=[idleWord,activeWord];
      current=next;
    });
    lastSwap=now;
  }
  function reelLoop(now){
    if(running && now-lastSwap>swapEvery) swapFood(now);
    requestAnimationFrame(reelLoop);
  }

  function buildFloaters(){
    floatLayer.innerHTML=''; floatItems=[];
    const n=matchMedia('(max-width:600px)').matches?8:12;
    for(let i=0;i<n;i++){
      const el=document.createElement('div'); el.className='float-food'; el.textContent=randomFood().name;
      const item={el,x:Math.random()*100,y:12+Math.random()*72,vx:(Math.random()-.5)*.55,vy:(Math.random()-.5)*.22,phase:Math.random()*6.28,size:12+Math.random()*10};
      el.style.left=item.x+'vw'; el.style.top=item.y+'vh'; el.style.fontSize=item.size+'px'; floatLayer.appendChild(el); floatItems.push(item);
    }
  }
  let floatTick=0;
  function floatLoop(t){
    if(t-floatTick>33){
      floatItems.forEach((it,i)=>{
        it.x+=it.vx*.08; it.y+=it.vy*.08;
        if(it.x<-25)it.x=110;if(it.x>110)it.x=-20;if(it.y<6)it.y=88;if(it.y>90)it.y=7;
        const bob=Math.sin(t/1300+it.phase)*5;
        it.el.style.transform=`translate(${bob}px,${Math.cos(t/1700+it.phase)*4}px) rotate(${Math.sin(t/2100+it.phase)*2}deg)`;
        if(running && Math.random()<.002) it.el.textContent=randomFood().name;
      });
      floatTick=t;
    }
    requestAnimationFrame(floatLoop);
  }

  const ctx=canvas.getContext('2d'); let shapes=[],cw=0,ch=0,dpr=1,bgTick=0;
  function resizeCanvas(){
    dpr=Math.min(devicePixelRatio||1,2); cw=innerWidth; ch=innerHeight;
    canvas.width=Math.round(cw*dpr); canvas.height=Math.round(ch*dpr); canvas.style.width=cw+'px'; canvas.style.height=ch+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0); makeShapes();
  }
  function makeShapes(){
    const count=Math.max(20,Math.min(42,Math.round(cw*ch/22000)));
    shapes=Array.from({length:count},(_,i)=>({
      x:Math.random()*cw,y:Math.random()*ch,r:7+Math.random()*17,type:i%4,hue:Math.random()*360,
      hueSpeed:.0007+Math.random()*.0012,phase:Math.random()*6.28,speed:.0004+Math.random()*.0007,alpha:.13+Math.random()*.13,rot:Math.random()*6.28
    }));
  }
  function drawShape(s,t){
    const breathe=.74+.26*Math.sin(t*s.speed+s.phase);
    const hue=(s.hue+t*s.hueSpeed)%360;
    ctx.save(); ctx.translate(s.x+Math.sin(t/3100+s.phase)*7,s.y+Math.cos(t/3700+s.phase)*7); ctx.rotate(s.rot+Math.sin(t/5000+s.phase)*.25);
    ctx.globalAlpha=s.alpha*breathe; ctx.lineWidth=2; ctx.strokeStyle=`hsl(${hue} 72% 56%)`; ctx.fillStyle=`hsl(${(hue+28)%360} 82% 78% / .28)`;
    const r=s.r;
    if(s.type===0){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke()}
    else if(s.type===1){ctx.beginPath();for(let k=0;k<8;k++){const a=k*Math.PI/4,rr=k%2?r*.45:r;ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}ctx.closePath();ctx.fill();ctx.stroke()}
    else if(s.type===2){ctx.beginPath();ctx.moveTo(-r,0);ctx.quadraticCurveTo(0,-r,r,0);ctx.quadraticCurveTo(0,r,-r,0);ctx.stroke()}
    else{ctx.beginPath();ctx.moveTo(-r,-r*.35);ctx.bezierCurveTo(-r*.25,-r,r*.25,r,r,r*.35);ctx.stroke()}
    ctx.restore();
  }
  function bgLoop(t){
    if(t-bgTick>33){ctx.clearRect(0,0,cw,ch);shapes.forEach(s=>drawShape(s,t));bgTick=t}
    requestAnimationFrame(bgLoop);
  }

  function stop(){
    if(!running)return; running=false; current=current||randomFood();
    setCurrent(current,true); app.classList.add('stopped'); spinButton.setAttribute('aria-label','再摇一次'); spinLabel.textContent='再摇一次';
    burst(); loadImages(true);
  }
  function start(){
    running=true; app.classList.remove('stopped'); mealNative.textContent=''; imageGrid.innerHTML=''; imageOffset=0; document.title='一会儿吃啥呢？';
    spinButton.setAttribute('aria-label','暂停随机选择'); spinLabel.textContent='就吃这个'; lastSwap=0;
  }
  spinButton.addEventListener('click',()=>running?stop():start());

  function escapeHtml(v=''){return v.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function imagePlaceholder(){return '<div class="image-placeholder">🍜</div>'}
  async function loadImages(reset=false){
    if(running)return; if(reset)imageOffset=0; else imageOffset+=3;
    const q=current.search||current.native||current.name;
    imageStatus.textContent='正在找相关食物图片…';
    imageGrid.innerHTML=[0,1,2].map(()=>`<div class="image-card">${imagePlaceholder()}</div>`).join('');
    try{
      const res=await fetch(`/api/images?q=${encodeURIComponent(q)}&offset=${imageOffset}`); if(!res.ok)throw new Error('image service');
      const data=await res.json(); const items=(data.images||data.results||[]).slice(0,3);
      if(!items.length)throw new Error('empty');
      imageGrid.innerHTML=items.map(it=>{
        const src=it.proxy||it.image||it.thumbnail||it.url; const title=it.title||it.source||'相关图片';
        return `<a class="image-card" href="${escapeHtml(it.page||it.sourceUrl||'#')}" target="_blank" rel="noopener noreferrer"><img src="${escapeHtml(src)}" alt="${escapeHtml(title)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentNode.innerHTML='${imagePlaceholder().replace(/'/g,"&#39;")}'"><span>${escapeHtml(title)}</span></a>`
      }).join('');
      imageStatus.textContent='开放图片参考 · 可能不是完全同一道菜';
    }catch(e){
      imageGrid.innerHTML=[0,1,2].map(()=>`<div class="image-card">${imagePlaceholder()}</div>`).join('');
      imageStatus.textContent='图片服务未连接 · 可稍后部署 Functions';
    }
  }
  imageButton.addEventListener('click',()=>loadImages(false));

  async function shareResult(){
    if(running){showToast('先停下来选一道 😋');return}
    const native=current.native?`（${current.native}）`:'';
    const text=`我的下一顿：${current.name}${native}`;
    const u=new URL(location.href); u.pathname='/share'; u.search=`?meal=${encodeURIComponent(current.name)}&native=${encodeURIComponent(current.native||'')}&region=${encodeURIComponent(current.region||'')}`;
    try{
      if(navigator.share){await navigator.share({title:'一会儿吃啥呢？',text,url:u.toString()});return}
      await navigator.clipboard.writeText(`${text}\n${u}`);showToast('结果和链接已复制');
    }catch(e){ if(e && e.name!=='AbortError') showToast('用微信右上角 ··· 转发即可') }
  }
  shareButton.addEventListener('click',shareResult);

  function showToast(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove('show'),1700)}
  function burst(){
    confetti.innerHTML=''; const hues=[15,42,92,190,280,335];
    for(let i=0;i<20;i++){const p=document.createElement('i');p.style.left=(25+Math.random()*50)+'%';p.style.top=(24+Math.random()*8)+'%';p.style.background=`hsl(${hues[i%hues.length]} 80% 62%)`;p.style.animationDelay=(Math.random()*.16)+'s';confetti.appendChild(p)}
    setTimeout(()=>confetti.innerHTML='',1000);
  }

  addEventListener('resize',resizeCanvas,{passive:true}); resizeCanvas(); buildFloaters(); setCurrent(current,false);
  requestAnimationFrame(reelLoop); requestAnimationFrame(floatLoop); requestAnimationFrame(bgLoop);
  if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();
