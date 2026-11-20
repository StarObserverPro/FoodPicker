import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { bundleWorker } from './bundle-worker.mjs';
const root=new URL('../',import.meta.url);
const dist=new URL('dist/',root);
await rm(dist,{recursive:true,force:true});
await mkdir(new URL('client/',dist),{recursive:true});
await mkdir(new URL('server/',dist),{recursive:true});
await mkdir(new URL('.openai/',dist),{recursive:true});
const files=['typing.js','meal-parameters.js','index.html','styles.css','landing-hotpot.css','literary-intro.css','wake-intro.css','chat.css','chat.html','chat.mjs','play-chat.css','play/openers.mjs','play/poster.mjs','food-data.js','food-policy.js','personality-engine.js','persona-art.js','psychic-app.js','chat.js','chat-questions.mjs','qr-code.js','literary-quotes-v5.js','literary-intro.js','wake-intro.js','sw.js','manifest.webmanifest','share-card.png'];
for(const file of files){await mkdir(new URL('client/'+file+'/../',dist),{recursive:true});await cp(new URL(file,root),new URL('client/'+file,dist));}
await cp(new URL('assets/',root),new URL('client/assets/',dist),{recursive:true,filter:source=>!source.endsWith('.md')});
await writeFile(new URL('server/index.js',dist),await bundleWorker(new URL('worker/index.mjs',root)));
const hosting=JSON.parse(await readFile(new URL('.openai/hosting.json',root),'utf8'));delete hosting.static;
await writeFile(new URL('.openai/hosting.json',dist),JSON.stringify(hosting,null,2)+'\n');
console.log('Built client assets and conversation/image Worker; no secrets or source documentation included.');
