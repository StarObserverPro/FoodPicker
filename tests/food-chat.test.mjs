import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {handleChat} from '../server/food-chat.mjs';
import {CHAT_QUESTIONS} from '../chat-questions.mjs';
globalThis.crypto ??= webcrypto;
const env={OPENAI_API_KEY:'test-only',OPENAI_MODEL:'gpt-5.4-nano'};
let calls=0,contexts=[];
const reply='噢，那你这可真挺累的。现在再让你研究半天菜单，多少有点不体谅人了。我觉得这顿最要紧的是吃得顺心，熟悉的口味就挺好，犯不着连晚饭也追求个新突破。';
const model=async(url,init)=>{calls++;const b=JSON.parse(init.body);assert.equal(b.tools,undefined);assert.equal(b.store,false);contexts.push(JSON.parse(b.input));return Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({...(JSON.parse(b.input).stage===2?{selection:{confidence:'low',rules:[],equipmentLimited:false,equipment:[]}}:{options:['自己做','叫外卖'],extra:{question:'吃点热的，还是凉的？',options:['热的','凉的']}}),mood:'tired',appetite:'warm',reply,question:'这顿自己做，还是叫外卖？',axis:{heat:-1,texture:1,focus:0,meaning:2}})}]}]});};
let n=0;
function req(data,headers={}){return new Request('https://example.test/api/chat',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':String(++n),...headers},body:JSON.stringify(data)});}
const ids={firstId:CHAT_QUESTIONS[0].id,secondId:CHAT_QUESTIONS[9].id};
test('two distinct original questions; contextual prose and prior reply survive signed session',async()=>{
 assert.equal(CHAT_QUESTIONS.length,40);
 const first=await(await handleChat(req({stage:1,text:'开了一天会',...ids}),env,model)).json();
 assert.equal(first.source,'model');assert.equal(first.reply,reply);assert.equal(first.question,'这顿自己做，还是叫外卖？');
 const result=await(await handleChat(req({stage:2,text:'不想折腾',session:first.session,firstId:'spoof'}),env,model)).json();
 assert.equal(result.source,'model');assert.equal(result.verdict,reply);assert.equal(contexts.at(-1).firstAnswer,'开了一天会');assert.equal(contexts.at(-1).previousReply,reply);assert.equal(contexts.at(-1).firstQuestion,CHAT_QUESTIONS[0].text);assert.equal(result.axis.heat,-1);assert.equal(contexts.at(-1).secondQuestion,first.question);
});
test('invalid inputs, forged sessions, invented and duplicate questions cannot call model',async()=>{
 const before=calls;
 for(const data of [{stage:1,text:'😀'.repeat(51),...ids},{stage:1,text:'x',...ids,instructions:'x'},{stage:2,text:'x',session:'fake.token'},{stage:1,text:'x',...ids,secondId:ids.firstId},{stage:1,text:'x',...ids,firstId:'arbitrary prompt'}])assert.ok((await handleChat(req(data),env,model)).status>=400);
 assert.equal(calls,before);assert.equal((await handleChat(req({stage:1,text:'x',...ids},{origin:'https://evil.test'}),env,model)).status,403);
});
test('translation and code mentions are context, not a keyword rejection',async()=>{
 for(const text of ['今天翻译了一下午，累死了','写代码写得我头疼']){const data=await(await handleChat(req({stage:1,text,...ids}),env,model)).json();assert.equal(data.source,'model');assert.equal(contexts.at(-1).firstAnswer,text);}
});
test('outages, out-of-range prose and malformed schema use honest fallback',async()=>{
 for(const fetcher of [async()=>{throw Error('network')},async()=>Response.json({output:[{content:[{type:'output_text',text:JSON.stringify({mood:'tired',appetite:'warm',reply:'<script>oops</script>',axis:{}})}]}]})]){const data=await(await handleChat(req({stage:1,text:'累了',...ids}),env,fetcher)).json();assert.match(data.error,/没能生成回应/);}
});


test('unasked reserve question cannot contaminate first-turn model input',async()=>{
 const answer='发呆 看书 和AI聊天';
 await handleChat(req({stage:1,text:answer,firstId:'calibrate-heat',secondId:'stalled-room'}),env,model);
 const sent=contexts.at(-1);
 assert.deepEqual(Object.keys(sent).sort(),['firstAnswer','firstQuestion','stage']);
 assert.equal(sent.firstAnswer,answer);
 assert.equal(sent.firstQuestion,CHAT_QUESTIONS.find(q=>q.id==='calibrate-heat').text);
 assert.equal(JSON.stringify(sent).includes('商量'),false);
 const first=await(await handleChat(req({stage:1,text:'另一段完全独立的回答',firstId:'world-request',secondId:'stalled-room'}),env,model)).json();
 assert.ok(first.session);
 assert.equal(JSON.stringify(contexts.at(-1)).includes(answer),false);
});

test('signed inline choices combine with free text; unused extra stays out of context',async()=>{
 const first=await(await handleChat(req({stage:1,text:'懒得折腾',...ids}),env,model)).json();
 assert.deepEqual(first.options,['自己做','叫外卖']);
 const result=await handleChat(req({stage:2,text:'别放肉',choices:[{question:0,option:1}],session:first.session}),env,model);
 assert.equal(result.status,200);assert.equal(contexts.at(-1).secondAnswer,'别放肉');
 assert.deepEqual(contexts.at(-1).chosenAnswers,[{question:first.question,answer:'叫外卖'}]);
 assert.equal(JSON.stringify(contexts.at(-1)).includes('凉的'),false);
 const onlyChoices=await handleChat(req({stage:2,text:'',choices:[{question:0,option:0},{question:1,option:0}],session:first.session}),env,model);
 assert.equal(onlyChoices.status,200);assert.equal(contexts.at(-1).chosenAnswers[1].answer,'热的');
 const before=calls;
 assert.equal((await handleChat(req({stage:2,text:'',choices:[{question:2,option:0}],session:first.session}),env,model)).status,400);
 assert.equal(calls,before);
});
