import { handleChat } from '../../server/food-chat.mjs';
export const onRequest = ({request,env}) => handleChat(request,env);
