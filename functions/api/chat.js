import { handlePlayRequest } from '../../server/play-api.mjs';
export const onRequest = ({request,env}) => handlePlayRequest(request,env);
