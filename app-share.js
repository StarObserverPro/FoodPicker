const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const escapeAttr = escapeHTML;

    function showToast(message) {
      clearTimeout(toastTimer); toastEl.textContent=message; toastEl.classList.add('show');
      toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2200);
    }

    function createShareCard(meal) {
      return new Promise(resolve => {
        const c=document.createElement('canvas'); c.width=1080; c.height=1350; const x=c.getContext('2d');
        const grad=x.createLinearGradient(0,0,1080,1350); grad.addColorStop(0,'#fffaf0'); grad.addColorStop(1,'#ffe0a6'); x.fillStyle=grad; x.fillRect(0,0,1080,1350);
        const colors=['#ed5b4f','#ff9c46','#ffd86b','#82c9a0','#7a66a8'];
        for(let i=0;i<60;i++){ x.globalAlpha=.22; x.fillStyle=colors[i%colors.length]; x.beginPath(); x.arc(rand(0,1080),rand(0,1350),rand(10,48),0,Math.PI*2); x.fill(); }
        x.globalAlpha=1; x.fillStyle='rgba(255,255,255,.86)'; roundRect(x,90,210,900,760,62); x.fill();
        x.fillStyle='#7a66a8'; x.textAlign='center'; x.font='700 72px system-ui, sans-serif'; x.fillText('一会儿吃啥呢？',540,155);
        x.fillStyle='#ed5b4f'; drawWrappedMeal(x,meal.name,540,500,790,150,3);
        if (meal.native) { x.fillStyle='rgba(67,47,42,.62)'; x.font='600 38px system-ui, sans-serif'; drawWrappedMeal(x,meal.native,540,660,760,38,2); }
        x.fillStyle='#432f2a'; x.font='46px system-ui, sans-serif'; x.fillText('命运说：就吃这个。',540,740);
        x.fillStyle='#82c9a0'; roundRect(x,420,810,240,82,41); x.fill();
        x.fillStyle='white'; x.font='700 36px system-ui, sans-serif'; x.fillText(meal.region,540,865);
        x.font='140px serif'; x.fillText('🍔',540,1115);
        x.fillStyle='rgba(67,47,42,.58)'; x.font='34px system-ui, sans-serif'; x.fillText('摇一下，少纠结一顿饭',540,1245);
        c.toBlob(resolve,'image/png',.94);
      });
    }
    function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.roundRect(x,y,w,h,r); }
    function fitText(ctx,text,maxWidth,startSize,minSize,weight){ let size=startSize; do { ctx.font=`${weight} ${size}px system-ui, sans-serif`; size-=4; } while(ctx.measureText(text).width>maxWidth && size>minSize); return size+4; }
    function drawWrappedMeal(ctx,text,cx,cy,maxWidth,startSize,maxLines){
      let size=startSize, lines=[];
      while(size>=54){
        ctx.font=`700 ${size}px system-ui, sans-serif`; lines=[]; let line='';
        for(const ch of Array.from(text)){ const trial=line+ch; if(ctx.measureText(trial).width>maxWidth && line){ lines.push(line); line=ch; } else line=trial; }
        if(line) lines.push(line); if(lines.length<=maxLines) break; size-=6;
      }
      ctx.textAlign='center'; const lh=size*1.12; const start=cy-(lines.length-1)*lh/2;
      lines.slice(0,maxLines).forEach((line,i)=>ctx.fillText(line,cx,start+i*lh));
    }

    async function shareResult() {
      const shareURL = /^https?:$/.test(location.protocol) ? new URL(`/share?meal=${encodeURIComponent(currentMeal.name)}&region=${encodeURIComponent(currentMeal.region)}`, location.origin).href : location.href;
      const text = `我的下一顿：${currentMeal.name}${currentMeal.native ? `（${currentMeal.native}）` : ''}。你也来摇一个？`;
      try {
        const blob=await createShareCard(currentMeal);
        const file=new File([blob],`下一顿-${currentMeal.name}.png`,{type:'image/png'});
        if (navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))) {
          await navigator.share({title:`下一顿：${currentMeal.name}`,text,url:shareURL,files:[file]});
          return;
        }
        if (navigator.share) { await navigator.share({title:`下一顿：${currentMeal.name}`,text,url:shareURL}); return; }
      } catch(err) { if (err.name==='AbortError') return; }
      try { await navigator.clipboard.writeText(`${text}\n${shareURL}`); showToast('结果和链接已复制，去微信粘贴即可'); }
      catch { showToast('请点微信右上角“…”转发当前页面'); }
    }

    function burstConfetti() {
      if (reduceMotion) return;
      confettiEl.innerHTML=''; const colors=['#ed5b4f','#ff9c46','#ffd86b','#82c9a0','#7a66a8'];
      for(let i=0;i<24;i++){ const el=document.createElement('i'); el.style.left=rand(10,90)+'vw'; el.style.background=colors[i%colors.length]; el.style.setProperty('--dx',rand(-100,100)+'px'); el.style.setProperty('--rot',rand(-540,540)+'deg'); el.style.animationDelay=rand(0,.2)+'s'; confettiEl.appendChild(el); }
      setTimeout(()=>confettiEl.innerHTML='',1600);
    }

    spinButton.addEventListener('click',()=> running ? stopRolling() : startRolling());
    shareButton.addEventListener('click',shareResult);
    imageButton.addEventListener('click',()=> loadImages(currentMeal, true));
    addEventListener('resize',()=>{ createPatterns(); createFloats(); applyMealSizing(currentMeal.name, !running, !!currentMeal.native); });

    createPatterns(); createFloats();
    const params=new URLSearchParams(location.search);
    const sharedMeal=params.get('meal');
    setWord(currentMeal,true);
    if (sharedMeal) stopRolling(sharedMeal); else startRolling();
    if ('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
