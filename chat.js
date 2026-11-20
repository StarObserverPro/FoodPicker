import { CHAT_QUESTIONS } from './chat-questions.mjs?v=37';
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const opening=CHAT_QUESTIONS[Math.floor(Math.random()*CHAT_QUESTIONS.length)];
 window.FoodPickerOpening=opening;
 document.dispatchEvent(new Event('food-opening-ready'));
 let questions=[],stage=1,session='',busy=false,controller=null,version=0,callbacks=null,choices=new Map(),extraQuestion=null;
 function line(text,who){const node=document.createElement('p');node.className='chat-line chat-'+who;node.textContent=text;$('chatMessages').append(node);return node;}
 const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 function follow(){const box=$('chatMessages');box.scrollTo({top:box.scrollHeight,behavior:reduced()?'instant':'smooth'});}
 async function clearStage(ticket){return ticket===version;}
 async function flow(text,ticket,emphasis=true){
  const node=line('', 'bot');node.classList.add('chat-flow');
  await window.FoodPickerTyping.type(node,text,{duration:Math.min(5200,Math.max(1800,text.length*55)),lead:emphasis,onStep:follow,valid:()=>ticket===version});
 }
 function hasAnswer(){return !!$('chatInput').value.trim()||choices.size>0;}
 async function choiceLine(q,index,ticket){
  const node=line('', 'bot');node.classList.add('chat-choice-line');
  await window.FoodPickerTyping.type(node,q.question,{duration:1800,onStep:follow,valid:()=>ticket===version});
  if(ticket!==version)return;
  node.replaceChildren();node.removeAttribute('aria-label');let at=0;
  q.options.forEach((label,i)=>{
   const start=q.question.indexOf(label,at);node.append(document.createTextNode(q.question.slice(at,start)));
   if(i===1){const hint=document.createElement('span');hint.className='chat-click-hint';hint.setAttribute('aria-hidden','true');hint.textContent='☝';node.append(hint);}
   const button=document.createElement('button');button.type='button';button.className='chat-choice';button.textContent=label;button.setAttribute('aria-pressed','false');
   button.addEventListener('click',async()=>{
    if(busy)return;
    if(choices.get(index)?.option===i)choices.delete(index);else choices.set(index,{question:index,option:i,label});
    node.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(choices.get(index)?.option===j)));count();
    const box=$('chatMessages');
    if(index===0&&extraQuestion&&box.clientHeight>=420){const extra=extraQuestion;extraQuestion=null;await choiceLine(extra,1,ticket);follow();}
   });node.append(button);at=start+label.length;
  });node.append(document.createTextNode(q.question.slice(at)));follow();
 }
 function count(){const n=Array.from($('chatInput').value).length;$('chatCount').textContent=`${n}/50`;$('chatSend').disabled=busy||!hasAnswer()||n>50;$('chatInput').setAttribute('aria-invalid',String(n>50));}
 function setBusy(value){busy=value;$('chatInput').disabled=value;$('chatSend').textContent=value?'稍等':'发送';$('chatForm').setAttribute('aria-busy',String(value));count();}
 function waiting(value){$('chatWaiting').hidden=!value;}
 function cancel(){waiting(false);document.body.classList.remove('chat-active');$('chatMessages').classList.remove('chat-exit');choices.clear();extraQuestion=null;version++;controller?.abort();controller=null;}
 async function start(cb){cancel();document.body.classList.add('chat-active');callbacks=cb;stage=1;session='';$('chatMessages').replaceChildren();$('chatError').textContent='';$('chatInput').value='';questions=[...CHAT_QUESTIONS];for(let i=questions.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}questions=[opening,...questions.filter(q=>q.id!==opening.id)].slice(0,2);line(opening.text,'bot');setBusy(false);cb.show();}
 async function send(event){
  event.preventDefault();if(busy||!hasAnswer()||Array.from($('chatInput').value).length>50)return;
  const text=$('chatInput').value.trim(),ticket=version,display=[...choices.values()].map(c=>c.label).concat(text||[]).join('，');if($('chatMessages').lastElementChild?.textContent!==display)line(display,'user');follow();setBusy(true);waiting(true);$('chatError').textContent='';
  controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
  try{
   const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({stage,text,...(stage===2?{session,choices:[...choices.values()].map(({question,option})=>({question,option}))}:{firstId:questions[0].id,secondId:questions[1].id})}),signal:controller.signal});
   let data;try{data=await response.json();}catch{throw Error('刚才没接上，请再试一次。');}if(ticket!==version)return;
   if(!response.ok){if(response.status===409){session='';stage=1;choices.clear();extraQuestion=null;line(questions[0].text,'bot');follow();}throw Error(data.error||'刚才没听清，再说一次？');}
   if(data.stage!==stage)throw Error('刚才没接上，再试一次？');
   if(stage===1&&(!data.session||typeof data.reply!=='string'||typeof data.question!=='string'))throw Error('刚才没接上，再试一次？');
   waiting(false);clearTimeout(timer);if(stage===1)$('chatInput').value='';count();
   if(stage===1){session=data.session;stage=2;await flow(data.reply,ticket);if(ticket!==version)return;extraQuestion=data.extra;await choiceLine({question:data.question,options:data.options},0,ticket);follow();}
   else{if(!await clearStage(ticket))return;callbacks.finish(data);document.body.classList.remove('chat-active');return;}
  }catch(error){if(ticket===version)$('chatError').textContent=error.name==='AbortError'?'刚才等得有点久，再试一次吧。':error.message;}
  finally{clearTimeout(timer);if(ticket===version){waiting(false);setBusy(false);if(!$('chat').classList.contains('hidden'))$('chatInput').focus({preventScroll:true});}}
 }
 let composing=false;
 $('chatInput').addEventListener('compositionstart',()=>{composing=true;});
 $('chatInput').addEventListener('compositionend',()=>{composing=false;});
 $('chatInput').addEventListener('keydown',event=>{
  if(event.key!=='Enter'||event.isComposing||composing||event.keyCode===229)return;
  event.preventDefault();
  if(!event.repeat&&!busy&&hasAnswer()&&Array.from($('chatInput').value).length<=50)$('chatForm').requestSubmit();
 });
 $('chatForm').addEventListener('submit',send);$('chatInput').addEventListener('input',count);
 $('chatRandom').addEventListener('click',()=>{cancel();callbacks?.random();});
 $('chatBack').addEventListener('click',()=>{cancel();callbacks?.back();});
 window.FoodPickerChat=Object.freeze({start,cancel});
})();
