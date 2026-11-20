import { createServer } from 'node:http';
import { handleChat } from './server/food-chat.mjs';
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 4173);
const env = { ...process.env };
try { for (const line of (await readFile(new URL('.env.local', import.meta.url), 'utf8')).split('\n')) { const at=line.indexOf('='); if(at>0) env[line.slice(0,at)]=line.slice(at+1).trim(); } } catch {}
const allowed = new Set(['typing.js','meal-parameters.js','index.html','styles.css','chat.css','chat.js','chat-questions.mjs','food-data.js','food-policy.js','personality-engine.js','qr-code.js','persona-art.js','psychic-app.js','literary-quotes-v5.js','literary-intro.js','literary-intro.css','landing-hotpot.css','wake-intro.js','wake-intro.css','sw.js','manifest.webmanifest','share-card.png']);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
};

createServer(async (request, response) => {
  try {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if(requestPath === '/api/chat') {
      const url=new URL(request.url, 'http://'+request.headers.host);
      const req=new Request(url,{method:request.method,headers:request.headers,...(request.method==='POST'?{body:request,duplex:'half'}:{})});
      const result=await handleChat(req,env);
      response.writeHead(result.status,Object.fromEntries(result.headers));
      response.end(Buffer.from(await result.arrayBuffer()));return;
    }
    const relativePath = requestPath === '/' ? '/index.html' : requestPath;
    if(!allowed.has(relativePath.slice(1)) && !(relativePath.startsWith('/assets/') && !relativePath.includes('..'))) { response.writeHead(404);response.end('Not found');return; }
    const filePath = resolve(root, `.${relativePath}`);

    if (!filePath.startsWith(`${root}${sep}`)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const body = await readFile(filePath);
    response.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`FoodPicker local preview: http://127.0.0.1:${port}`);
});
