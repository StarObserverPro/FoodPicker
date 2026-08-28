const QUESTIONS=[
 {type:'心理取样',text:'别想吃的。你现在更像哪一种东西？',hint:'第一反应就行。想久了说明今天更需要别人替你决定。',opts:[
  {icon:'🪫',title:'只剩 8% 的手机',sub:'还能用，但不想再承担新任务',w:{comfort:3,hot:2,easy:3,carb:2}},
  {icon:'🫖',title:'快响的高压锅',sub:'表面正常，里面已经很有意见',w:{spicy:4,crisp:2,stimulus:3,hot:1}},
  {icon:'📓',title:'刚拆封的新本子',sub:'今天还有一点想重新开始的幻觉',w:{fresh:3,novel:3,light:2,ritual:1}},
  {icon:'🧾',title:'揉皱的购物小票',sub:'事情不少，但又说不清到底忙了什么',w:{comfort:2,cheap:3,easy:3,savory:2}}
 ]},
 {type:'感官偏好',text:'饭端上来，第一口最好先给你什么？',hint:'这题真有用，上一题只有一半有用。',opts:[
  {icon:'♨️',title:'热气扑脸',sub:'先把人从今天里捞回来',w:{hot:5,soup:2,comfort:1}},
  {icon:'🌶️',title:'辣得有点醒',sub:'需要一个比工作更明确的刺激',w:{spicy:5,stimulus:3}},
  {icon:'🥨',title:'咔嚓一声',sub:'最好现实世界终于给点反馈',w:{crisp:5,fried:2,stimulus:1}},
  {icon:'🍚',title:'软、香、稳',sub:'别教育我，安静把我喂饱',w:{comfort:5,carb:4,easy:1}}
 ]},
 {type:'动机审讯',text:'今天这顿饭，最好替你完成什么任务？',hint:'别装健康。我们问的是“最好”，不是“应该”。',opts:[
  {icon:'🛋️',title:'把我哄好',sub:'今天已经够了，不想再被任何东西挑战',w:{comfort:5,rich:2,hot:1}},
  {icon:'⚡',title:'把我叫醒',sub:'靠自己是没戏了，借点外力',w:{spicy:3,crisp:2,stimulus:5,novel:1}},
  {icon:'🫥',title:'别给我添事',sub:'快、稳、熟悉，最好连选择都省掉',w:{easy:5,cheap:2,comfort:2}},
  {icon:'🎟️',title:'证明今天没白过',sub:'至少晚饭得像个小事件',w:{ritual:5,novel:4,rich:2}}
 ]},
 {type:'玄学采样',text:'最后一题。别理解，直接挑一枚。',hint:'从这里开始，我们正式放弃科学。',opts:[
  {icon:'🔥',title:'火',sub:'你先点了它，所以它就是缘分',fortune:'火',w:{spicy:2,hot:2}},
  {icon:'💧',title:'水',sub:'没为什么，水今天看起来就比较会说话',fortune:'水',w:{soup:3,fresh:1}},
  {icon:'🪨',title:'土',sub:'非常稳。也非常适合给碳水找理由',fortune:'土',w:{carb:3,comfort:2}},
  {icon:'🍃',title:'风',sub:'轻一点，或者至少看起来轻一点',fortune:'风',w:{fresh:3,light:2}}
 ]}
];

const FORTUNE_MAP={
 火:{good:'宜热、宜辣、宜当机立断',bad:'忌端着菜单继续想',tags:['spicy','hot','stimulus'],phrase:'火位上行，说明你今天缺的不是营养，是一点明确的动静。'},
 水:{good:'宜汤、宜鲜、宜先把人泡软',bad:'忌又干又冷还得嚼半天',tags:['soup','fresh','hot'],phrase:'水位得势，今天适合吃点能把脑内噪音冲下去的东西。'},
 土:{good:'宜饭、宜面、宜稳稳落地',bad:'忌拿一把草叶子假装晚饭',tags:['carb','comfort','hot'],phrase:'土位偏旺，翻译成人话：该给碳水一个合法身份了。'},
 风:{good:'宜鲜、宜轻、宜换个口味',bad:'忌吃完像背了一袋水泥',tags:['fresh','light','novel'],phrase:'风位入局，说明你还有一点想逃离惯性的心。'}
};

const EXACT_TAGS={
 '黄焖鸡米饭':['hot','comfort','carb','easy','savory'],'番茄炒蛋盖饭':['comfort','carb','easy','cheap'],'宫保鸡丁盖饭':['spicy','hot','carb','savory'],'麻婆豆腐盖饭':['spicy','hot','carb','comfort'],'红烧排骨饭':['rich','comfort','carb','savory'],'酸菜鱼米饭':['spicy','hot','soup','savory'],'水煮肉片米饭':['spicy','hot','rich','stimulus'],'麻辣香锅':['spicy','crisp','rich','stimulus'],'烤鱼配米饭':['spicy','ritual','rich','savory'],'潮汕砂锅粥':['hot','soup','comfort','fresh'],'皮蛋瘦肉粥配油条':['hot','soup','comfort','crisp'],'兰州牛肉面':['hot','soup','comfort','easy'],'重庆小面':['spicy','hot','easy','stimulus'],'炸酱面':['carb','comfort','savory','easy'],'油泼面':['hot','carb','spicy','stimulus'],'饺子配酸辣汤':['hot','soup','comfort','ritual'],'生煎包配豆浆':['crisp','comfort','carb','easy'],'胡辣汤配水煎包':['hot','spicy','comfort','carb'],'肉夹馍配凉皮':['crisp','savory','carb','stimulus'],'煎饼果子':['crisp','easy','cheap','savory'],'隆江猪脚饭':['rich','comfort','carb','savory'],'烧腊双拼饭':['rich','carb','ritual','savory'],'新疆大盘鸡拌面':['spicy','hot','rich','ritual'],'云南小锅米线':['hot','soup','spicy','fresh'],'鸡胸肉杂粮饭配时蔬':['light','fresh','easy','savory'],
 '玛格丽特披萨':['hot','carb','comfort','ritual'],'意大利肉酱面':['hot','carb','comfort','rich'],'经典培根蛋酱意面':['rich','carb','comfort','savory'],'英式炸鱼薯条':['fried','crisp','rich','comfort'],'德式咖喱香肠配薯条':['spicy','fried','crisp','rich'],'希腊烤肉卷饼':['fresh','savory','crisp','easy'],'地中海烤鸡鹰嘴豆碗':['fresh','light','savory','ritual'],'番茄炖蛋配面包':['hot','comfort','fresh','carb'],
 '经典牛肉汉堡配薯条':['fried','crisp','rich','comfort'],'田纳西辣炸鸡三明治':['spicy','fried','crisp','stimulus'],'烤芝士三明治配番茄汤':['hot','soup','comfort','carb'],'墨西哥牛肉塔可':['spicy','crisp','novel','savory'],'鸡肉法希塔饭碗':['hot','fresh','savory','ritual'],'加拿大肉汁奶酪薯条':['hot','rich','comfort','carb'],'烤蔬菜藜麦碗':['light','fresh','ritual','easy']
};

function tagsForMeal(meal){
 if(EXACT_TAGS[meal.name])return EXACT_TAGS[meal.name].slice();
 const n=meal.name,tags=new Set(['savory']);const add=(tag,re)=>{if(re.test(n))tags.add(tag)};
 add('spicy',/辣|麻辣|酸辣|香辣|辣子|水煮|毛血旺|干锅|咖喱|胡辣|椒|孜然|燃面|螺蛳|肠旺|泡椒|布法罗|墨西哥/);
 add('soup',/汤|粥|羹|馄饨|云吞|汤面|汤粉|汤粿条|米线|砂锅|泡馍|麻辣烫|冒菜|酸菜鱼|水煮鱼|浓汤/);
 add('carb',/饭|面|粉|米线|粿条|粥|包|饼|馍|饺|馄饨|云吞|披萨|意面|通心粉|三明治|汉堡|热狗|薯|吐司|贝果|卷饼|塔可|华夫|法棍|可颂|饭碗/);
 add('comfort',/黄焖|红烧|卤|炖|煲|粥|汤|番茄炒蛋|饺|包|馄饨|米饭|盖饭|面|披萨|汉堡|炸鸡|土豆泥|咖喱|焗|肉酱/);
 add('rich',/猪脚|扣肉|红烧肉|肥肠|烧鹅|叉烧|腊|培根|芝士|奶酪|炸|猪肘|牛胸|牛排|排骨|肉酱|烤肉|汉堡|香肠|肉汁|奶油/);
 add('fried',/炸|煎|锅贴|生煎|油条|鸡排|薯条|华夫/);add('crisp',/炸|煎|锅贴|生煎|烧饼|锅盔|烤冷面|鸡排|薯条|油条|煎饼|肉夹馍|披萨|华夫|三明治|塔可|玉米片/);
 add('fresh',/沙拉|蔬菜|时蔬|杂粮|藜麦|豆腐|鱼|虾|海鲜|白切鸡|清蒸|柠檬|鹰嘴豆|牛油果|三文鱼|金枪鱼|番茄|菌菇/);add('light',/沙拉|蔬菜|时蔬|杂粮|藜麦|鸡胸|豆腐|粥|清蒸|白切鸡|鹰嘴豆|牛油果|谷物碗/);
 add('easy',/盖饭|炒饭|面|粉|米线|麻辣烫|冒菜|包|饺|馄饨|汉堡|三明治|热狗|快餐|便当|套餐|煎饼|手抓饼|饭碗|拌面/);add('cheap',/番茄炒蛋|蛋炒饭|炒饭|豆腐|土豆|包|饼|馍|粥|面|粉|煎饼|手抓饼|鸡蛋|豆浆|油条/);
 add('ritual',/煲仔|砂锅|烤鱼|大盘鸡|烧腊|三宝|海鲜饭|烤肉|披萨|三杯鸡|潮汕|烤串|拼盘|火锅|烩饭|华夫|早餐拼盘/);add('novel',/墨西哥|希腊|土耳其|德式|法式|英式|西班牙|地中海|加拿大|田纳西|纽约|夏威夷|加州/);
 add('hot',/汤|粥|羹|面|粉|米线|麻辣烫|冒菜|砂锅|煲|炖|烩|蒸|烧|焖|煮|烤|炸|炒|饭|披萨|汉堡|鸡翅|鸡排|鸡腿|咖喱/);if(tags.has('spicy')||tags.has('crisp'))tags.add('stimulus');return [...tags];
}

const MENU=(Array.isArray(FOODS)?FOODS:[]).map(meal=>({...meal,tags:tagsForMeal(meal)}));
const intro=document.getElementById('intro'),quiz=document.getElementById('quiz'),loading=document.getElementById('loading'),result=document.getElementById('result');
const startBtn=document.getElementById('startBtn'),qStep=document.getElementById('qStep'),qType=document.getElementById('qType'),prog=document.getElementById('prog'),qText=document.getElementById('qText'),qHint=document.getElementById('qHint'),choices=document.getElementById('choices');let step=0,answers=[],ranked=[],rankIndex=0;
function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}function randFrom(seed){let x=seed||1234567;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return((x>>>0)%10000)/10000}}function showOnly(el){[intro,quiz,loading,result].forEach(x=>x.classList.toggle('hidden',x!==el));window.scrollTo({top:0,behavior:'smooth'})}
function renderQ(){const q=QUESTIONS[step];qStep.textContent=`第 ${step+1} 签 / 4`;qType.textContent=q.type;prog.style.width=`${(step+1)*25}%`;qText.textContent=q.text;qHint.textContent=q.hint;choices.innerHTML='';q.opts.forEach((o,i)=>{const b=document.createElement('button');b.className='choice';b.innerHTML=`<span class="ico">${o.icon}</span><span><b>${o.title}</b><small>${o.sub}</small></span>`;b.onclick=()=>choose(i);choices.appendChild(b)})}function choose(i){answers.push(QUESTIONS[step].opts[i]);if(step<QUESTIONS.length-1){step++;renderQ()}else calculate()}
function calculate(){showOnly(loading);const lines=['正在把你的选择解释成命运……','正在寻找能自圆其说的证据……','正在剔除“随便吃点”的危险思想……'];let li=0;const timer=setInterval(()=>{document.getElementById('loadingLine').textContent=lines[++li%lines.length]},420);const w={};answers.forEach(a=>Object.entries(a.w||{}).forEach(([k,v])=>w[k]=(w[k]||0)+v));const fortune=answers[3].fortune||'土';FORTUNE_MAP[fortune].tags.forEach(t=>w[t]=(w[t]||0)+1.8);const now=new Date(),dayKey=`${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}-${answers.map(a=>a.title).join('|')}`;const rng=randFrom(hash(dayKey));ranked=MENU.map(f=>{let s=0;for(const t of f.tags)s+=w[t]||0;s+=rng()*3.2;if(f.tags.includes('easy')&&w.easy)s+=1;if(f.tags.includes('ritual')&&w.ritual)s+=1;return {...f,score:s}}).sort((a,b)=>b.score-a.score).slice(0,8);rankIndex=0;setTimeout(()=>{clearInterval(timer);renderResult()},980)}
function timeBranch(h){return ['子','丑','丑','寅','寅','卯','卯','辰','辰','巳','巳','午','午','未','未','申','申','酉','酉','戌','戌','亥','亥','子'][h]+'时'}function psychLine(){const a=answers[0]?.title,b=answers[2]?.title;if(a.includes('8%'))return b.includes('哄好')?'你今天不是饿，是电量低到已经不适合继续扮演一个有判断力的成年人。':'你的决策系统已经进入省电模式，晚饭没必要再开一次董事会。';if(a.includes('高压锅'))return '你不是单纯想吃重口，你是希望有一种味道替你把今天没说出口的话说大声一点。';if(a.includes('新本子'))return '你对今天还没有彻底放弃，所以这顿饭最好稍微像个新章节，而不是复制粘贴。';return '你需要的不是惊喜，是一种“终于有件事不用我再管”的踏实感。'}
function psychEvidence(){const q1=answers[0].title,q2=answers[1].title,q3=answers[2].title;return `你先把自己选成“${q1}”，又明确要“${q2}”，最后还要求晚饭“${q3}”。这三个答案放在一起，已经足够暴露你今天更需要的是哪一种感官补偿。这里多少有点心理学，至少比看星座多一点。`}function fortuneEvidence(){const f=answers[3].fortune,info=FORTUNE_MAP[f],now=new Date();return `你最后直觉选了“${f}”，而现在是${timeBranch(now.getHours())}。本局据此宣布：${info.phrase} 今日${info.good}；${info.bad}。至于为什么——祖传规矩，问就是泄露天机。`}function conEvidence(meal){const q=answers[2].title;const lines=[`既然你都已经花四次点击把责任交出来了，现在再反悔，只会把选择成本重新买一遍。${meal.name}至少能让这件事到此为止。`,`你真正需要的不是“全世界最正确的晚饭”，而是一顿足够符合今天状态、并且能在十分钟内停止纠结的饭。今天它就是${meal.name}。`,`大部分“吃什么”的痛苦并不来自没有选项，而来自选项太多。我们已经替你把其余选项骂退了，所以${meal.name}自动获得命运加成。`];return lines[hash(meal.name+q)%lines.length]}
function renderResult(){if(!ranked.length){toast('菜单今天拒绝配合，刷新一下再算');return}showOnly(result);const meal=ranked[rankIndex%ranked.length],fortune=answers[3].fortune,now=new Date();document.getElementById('mealName').textContent=meal.name;document.getElementById('mealNative').textContent=meal.native||'';document.getElementById('dateStamp').innerHTML=`${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}<br>${timeBranch(now.getHours())} · 食神${fortune}位`;const labels=[];if(meal.tags.includes('hot'))labels.push(['宜热','hot']);if(meal.tags.includes('spicy'))labels.push(['宜辣','hot']);if(meal.tags.includes('comfort'))labels.push(['安抚型','']);if(meal.tags.includes('fresh'))labels.push(['清醒型','green']);if(meal.tags.includes('ritual'))labels.push(['有点仪式感','green']);labels.unshift([meal.region,'']);document.getElementById('mealPills').innerHTML=labels.slice(0,4).map(([t,c])=>`<span class="pill ${c}">${t}</span>`).join('');document.getElementById('psychVerdict').textContent=psychLine();document.getElementById('psychEvidence').textContent=psychEvidence();document.getElementById('fortuneEvidence').textContent=fortuneEvidence();document.getElementById('conEvidence').textContent=conEvidence(meal);const base=ranked[Math.min(4,ranked.length-1)]?.score??ranked[0].score;const consistency=Math.min(98,89+Math.round((ranked[0].score-base)*1.25)+(hash(meal.name)%5));document.getElementById('confidence').textContent=consistency+'%';document.getElementById('meterFill').style.width=consistency+'%';document.getElementById('altList').innerHTML=ranked.filter((_,i)=>i!==rankIndex%ranked.length).slice(0,3).map(f=>`<button class="alt" data-name="${f.name}">${f.name}</button>`).join('');document.querySelectorAll('.alt').forEach(b=>b.onclick=()=>{const idx=ranked.findIndex(f=>f.name===b.dataset.name);if(idx>=0){rankIndex=idx;renderResult()}});document.getElementById('acceptBtn').onclick=()=>toast(`行，就吃${meal.name}。别再开会了。`);document.getElementById('rerollBtn').onclick=()=>{rankIndex=(rankIndex+1)%Math.min(5,ranked.length);renderResult()}}
function toast(t){const el=document.getElementById('toast');el.textContent=t;el.classList.add('on');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('on'),1800)}startBtn.onclick=()=>{step=0;answers=[];showOnly(quiz);renderQ()};document.getElementById('restartBtn').onclick=()=>{step=0;answers=[];showOnly(quiz);renderQ()};document.getElementById('shareBtn').onclick=async()=>{const meal=ranked[rankIndex%ranked.length];const text=`今日食运：${meal.name}${meal.native?`（${meal.native}）`:''}。判词：${psychLine()} —— 扎心版今天吃什么`;try{if(navigator.share){await navigator.share({title:'今日食运鉴定书',text})}else{await navigator.clipboard.writeText(text);toast('判词已复制')}}catch(e){if(e.name!=='AbortError')toast('没转出去，命运暂时保密')}};if(!MENU.length){startBtn.disabled=true;startBtn.textContent='菜单失联了'}else{document.getElementById('footNote').textContent=`算法：${MENU.length} 道默认菜单 × 偏好权重 × 当日食神 × 厚脸皮`}if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
