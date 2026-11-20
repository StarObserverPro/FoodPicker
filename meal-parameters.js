/* v1 additive metadata: null means unknown, never a satisfied hard requirement.
   equipment is an OR of AND groups. Delivery is a dish format, not local stock. */
(() => {
 const additions=[
  ['hotpot-beef-clear','清汤牛肉小火锅','meat'],['hotpot-beef-tomato','番茄牛肉小火锅','meat'],['hotpot-chicken-mushroom','菌菇鸡肉小火锅','meat'],['hotpot-tofu-mushroom','菌菇豆腐小火锅','vegan'],['hotpot-beef-spicy','麻辣牛肉小火锅','meat']
 ];
 if(typeof FOODS!=='undefined')for(const [id,name,diet] of additions)if(!FOODS.some(m=>m.name===name))FOODS.push({name,region:'中国',native:'',search:name,parameters:{id,version:1,cuisine:['chinese'],temperature:['hot'],diet:[diet],complexity:['simple'],method:['cook','delivery'],kind:['hotpot'],equipment:[['stove','pot']],notes:diet==='vegan'?'使用纯素菌菇汤底，不加肉汤。':'使用现成汤底。'}});
 const dimensions={cuisine:['chinese','western','other'],temperature:['hot','cold'],diet:['meat','vegetarian','vegan'],complexity:['simple','medium','complex'],method:['cook','delivery','ready'],kind:['rice','noodles','soup','hotpot','dumplings','sandwich','salad','other']};
 const curated={
 '番茄炒蛋盖饭':{diet:['vegetarian'],complexity:['simple'],equipment:[['stove','pan']],method:['cook','delivery']},
 '蛋炒饭':{diet:['vegetarian'],complexity:['simple'],equipment:[['stove','pan']],method:['cook','delivery']},
 '扬州炒饭':{diet:['meat'],complexity:['simple'],equipment:[['stove','pan']],method:['cook','delivery']},
 '蒜香橄榄油意面':{diet:['vegan'],complexity:['simple'],equipment:[['stove','pot','pan']],method:['cook','delivery']},
 '麻婆豆腐盖饭':{diet:['meat'],complexity:['medium'],equipment:[['stove','pan']],method:['cook','delivery']},
 '黄焖鸡米饭':{diet:['meat'],complexity:['medium'],equipment:[['stove','pot']],method:['cook','delivery']},
 '炸酱面':{diet:['meat'],complexity:['medium'],equipment:[['stove','pot','pan']],method:['cook','delivery']}
 };
 function kind(n){return /火锅|涮|寿喜锅/.test(n)?'hotpot':/饺|馄饨/.test(n)?'dumplings':/面|粉|意粉/.test(n)?'noodles':/三明治|汉堡|吐司|热狗/.test(n)?'sandwich':/沙拉/.test(n)?'salad':/汤|粥/.test(n)?'soup':/饭/.test(n)?'rice':'other';}
 function metadata(meal){const n=meal.name;return {version:1,id:'dish:'+n,cuisine:[meal.region==='中国'?'chinese':['欧洲','美洲','美国'].includes(meal.region)?'western':'other'],temperature:/凉|冷|沙拉|寿司/.test(n)?['cold']:/炒|煮|炖|烤|炸|蒸|汤|粥|火锅|涮/.test(n)?['hot']:null,diet:/鸡|鸭|鹅|牛肉|牛排|猪|排骨|培根|火腿|羊|鱼|虾|蟹|肉|海鲜|蛤|蛎/.test(n)?['meat']:null,complexity:null,equipment:null,method:['delivery'],kind:[kind(n)],...curated[n],...meal.parameters};}
 function match(meta,key,value){const values=meta[key];if(!Array.isArray(values))return false;if(key==='diet'&&value==='vegetarian')return values.includes('vegetarian')||values.includes('vegan');return values.includes(value);}
 function select(menu,selection={},rng=Math.random){
  const rules=Array.isArray(selection.rules)?selection.rules:[];
  const hard=rules.filter(r=>r.strength==='required'||r.strength==='excluded');
  const cook=rules.some(r=>r.dimension==='method'&&r.value==='cook'&&r.strength==='required');
  const tools=selection.equipment||[];
  const eligible=menu.filter(meal=>{const m=metadata(meal);return hard.every(r=>{if(['equipment','complexity'].includes(r.dimension)&&!cook)return true;const hit=match(m,r.dimension,r.value);return r.strength==='excluded'?Array.isArray(m[r.dimension])&&!hit:hit;})&&(!cook||!selection.equipmentLimited||(m.equipment||[]).some(group=>group.every(t=>tools.includes(t))));});
  const prefs=rules.filter(r=>r.strength==='preferred');
  return eligible.map(meal=>{const m=metadata(meal);const hits=prefs.filter(r=>match(m,r.dimension,r.value)).length;const weight=1+hits*3;return {...meal,selectionNote:selection.confidence==='low'?'我也没猜太准，先试试这道？不合胃口咱就换。':prefs.length&&hits<prefs.length?'这道换了点口味，先看看合不合胃口。':'',drawKey:-Math.log(Math.max(1e-9,rng()))/weight};}).sort((a,b)=>a.drawKey-b.drawKey);
 }
 window.FoodPickerMeals=Object.freeze({dimensions,metadata,select});
})();
