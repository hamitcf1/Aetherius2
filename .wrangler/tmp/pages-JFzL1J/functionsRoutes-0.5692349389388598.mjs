import { onRequest as __api_voice_js_onRequest } from "/Users/hamitcanfindik/Desktop/Aetherius2/functions/api/voice.js"

export const routes = [
    {
      routePath: "/api/voice",
      mountPath: "/api",
      method: "",
      middlewares: [],
      modules: [__api_voice_js_onRequest],
    },
  ]