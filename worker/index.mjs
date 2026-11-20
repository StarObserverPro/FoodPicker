import { handleChat } from '../server/food-chat.mjs';
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(url.pathname==='/api/chat')return handleChat(request,env);
  if(env.ASSETS)return env.ASSETS.fetch(request);
  return new Response('Not found',{status:404});
 }
};
