(() => {
 const jobs=new WeakMap();
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 async function type(node,text,{duration=3000,onStep=()=>{},valid=()=>true,lead=false,hookAt=-1}={}){
  const job={};jobs.set(node,job);node.replaceChildren();node.setAttribute('aria-label',text);node.classList.add('type-copy');
  if(reduced()){node.textContent=text;onStep();return;}
  const visual=document.createElement('span');visual.className='type-visual';visual.setAttribute('aria-hidden','true');node.append(visual);
  const cursor=document.createElement('i');cursor.className='type-cursor';cursor.setAttribute('aria-hidden','true');visual.append(cursor);
  const chars=Array.from(text),delay=Math.max(22,(duration-420)/Math.max(1,chars.length-1));
  for(const [index,char] of chars.entries()){
   if(jobs.get(node)!==job||!valid()){cursor.remove();return;}
   const glyph=document.createElement(char==='\n'?'br':'span');glyph.className='type-glyph'+(lead&&index<12?' type-lead':'')+(hookAt>=0&&index>=hookAt?' type-hook':'');glyph.textContent=char==='\n'?'':char;visual.insertBefore(glyph,cursor);onStep();
   if(index<chars.length-1)await new Promise(resolve=>setTimeout(resolve,delay+(/[。！？]/.test(char)?180:char==='，'?65:0)));
  }
  await new Promise(resolve=>setTimeout(resolve,420));cursor.remove();
 }
 window.FoodPickerTyping={type};
 async function mealReveal(){
  const target=document.getElementById('openingMeal'),paper=document.querySelector('.paper'),intro=document.getElementById('intro');
  if(!target?.textContent||!paper||!intro||reduced()||new URLSearchParams(location.search).get('intro')==='0')return;
  const overlay=document.createElement('div');overlay.className='meal-reveal';overlay.setAttribute('aria-hidden','true');
  const word=document.createElement('div');word.className='meal-reveal-word';word.textContent=target.textContent;overlay.append(word);paper.append(overlay);
  const before=intro.inert;intro.inert=true;
  const cleanup=()=>{overlay.remove();intro.inert=before;paper.classList.remove('meal-sequence');const inner=paper.querySelector('.inner');inner?.animate?.([{opacity:0},{opacity:1}],{duration:500,easing:'ease-out'});};
  try{
   const from=word.getBoundingClientRect(),to=target.getBoundingClientRect();
   const dx=to.x+to.width/2-from.x-from.width/2,dy=to.y+to.height/2-from.y-from.height/2;
   const scale=Math.min(.65,to.height/from.height);
   const duration=2400;
   const flight=word.animate([
    {opacity:0,transform:'scale(.25) rotate(-7deg)',filter:'blur(18px)',offset:0},
    {opacity:1,transform:'scale(1.14) rotate(1deg)',filter:'blur(0)',offset:.28},
    {opacity:1,transform:'scale(1) rotate(0)',offset:.43},
    {opacity:1,transform:'scale(1) rotate(0)',offset:.68},
    {opacity:0,transform:`translate(${dx}px,${dy}px) scale(${scale})`,filter:'blur(0)',offset:1}
   ],{duration,easing:'cubic-bezier(.2,.7,.25,1)',fill:'forwards'});

   await Promise.race([flight.finished,new Promise(resolve=>setTimeout(resolve,2800))]);
  }finally{cleanup();}
 }
 function entrance(){
  const button=document.getElementById('startBtn');
  const copy=document.getElementById('drawInvitation');
  if(!button||!copy)return;
  const paper=document.querySelector('.paper');
  if(!reduced()&&new URLSearchParams(location.search).get('intro')!=='0')paper?.classList.add('meal-sequence');
  const start=async()=>{
   try{await mealReveal();}finally{paper?.classList.remove('meal-sequence');}
   button.classList.add('entry-inviting');
   type(copy,copy.textContent,{duration:2100});
  };
  if(!document.getElementById('wakeIntro')){start();return;}
  const observer=new MutationObserver(()=>{if(!document.getElementById('wakeIntro')){observer.disconnect();start();}});
  observer.observe(document.querySelector('.paper'),{childList:true,subtree:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',entrance,{once:true});else entrance();
})();
