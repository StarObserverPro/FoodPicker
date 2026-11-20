import { handlePlayRequest } from '../server/play-api.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(['/api/chat','/api/compose','/api/draw'].includes(url.pathname))return handlePlayRequest(request,env);
  if(url.pathname.startsWith('/api/'))return new Response('Not found',{status:404});
  if(env.ASSETS)return env.ASSETS.fetch(request);
  return new Response('Not found',{status:404});
 }
};
