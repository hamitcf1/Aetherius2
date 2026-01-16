var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-Y357LZ/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// api/voice.js
var VOICE_OPTIONS = {
  male: [
    { name: "en-US-Wavenet-A", style: "Young male" },
    { name: "en-US-Wavenet-B", style: "Deep male" },
    { name: "en-US-Wavenet-D", style: "Mature male" },
    { name: "en-US-Wavenet-I", style: "Older male" },
    { name: "en-US-Wavenet-J", style: "Warm male" },
    { name: "en-US-Neural2-A", style: "Natural male" },
    { name: "en-US-Neural2-D", style: "Clear male" },
    { name: "en-US-Neural2-I", style: "Expressive male" },
    { name: "en-US-Neural2-J", style: "Conversational male" }
  ],
  female: [
    { name: "en-US-Wavenet-C", style: "Warm female" },
    { name: "en-US-Wavenet-E", style: "Young female" },
    { name: "en-US-Wavenet-F", style: "Atmospheric female" },
    { name: "en-US-Wavenet-G", style: "Soft female" },
    { name: "en-US-Wavenet-H", style: "Bright female" },
    { name: "en-US-Neural2-C", style: "Natural female" },
    { name: "en-US-Neural2-E", style: "Clear female" },
    { name: "en-US-Neural2-F", style: "Expressive female" },
    { name: "en-US-Neural2-G", style: "Conversational female" },
    { name: "en-US-Neural2-H", style: "Warm neural female" }
  ]
};
var VOICE_PROFILES = {
  narrator: {
    languageCode: "en-US",
    name: "en-US-Neural2-C",
    // Use Neural2 for more natural narration
    ssmlGender: "FEMALE",
    pitch: -2,
    speakingRate: 0.9,
    supportsPitch: true,
    style: "Atmospheric, wise narrator"
  },
  khajiit: {
    languageCode: "en-US",
    name: "en-US-Wavenet-B",
    ssmlGender: "MALE",
    pitch: -4,
    speakingRate: 0.85,
    supportsPitch: true,
    style: "Deep, raspy, exotic"
  },
  system: {
    languageCode: "en-US",
    name: "en-US-Neural2-H",
    ssmlGender: "FEMALE",
    pitch: 0,
    speakingRate: 1.1,
    supportsPitch: true,
    style: "Clean, fast for alerts"
  },
  // Default for NPCs
  npc: {
    languageCode: "en-US",
    name: "en-US-Neural2-D",
    ssmlGender: "MALE",
    pitch: 0,
    speakingRate: 0.95,
    supportsPitch: true,
    style: "Generic NPC voice"
  },
  // Female NPC variant
  npc_female: {
    languageCode: "en-US",
    name: "en-US-Neural2-C",
    ssmlGender: "FEMALE",
    pitch: 0,
    speakingRate: 0.95,
    supportsPitch: true,
    style: "Generic female NPC"
  }
};
var DAILY_CHAR_LIMIT = 3e4;
async function md5Hash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("MD5", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(md5Hash, "md5Hash");
function getTodayKey() {
  const now = /* @__PURE__ */ new Date();
  return `usage:${now.toISOString().split("T")[0]}`;
}
__name(getTodayKey, "getTodayKey");
async function generateGoogleJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1e3);
  const exp = now + 3600;
  const header = {
    alg: "RS256",
    typ: "JWT"
  };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp,
    scope: "https://www.googleapis.com/auth/cloud-platform"
  };
  const base64UrlEncode = /* @__PURE__ */ __name((obj) => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }, "base64UrlEncode");
  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const unsignedToken = `${headerB64}.${payloadB64}`;
  const pemContents = serviceAccount.private_key.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(unsignedToken)
  );
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${unsignedToken}.${signatureB64}`;
}
__name(generateGoogleJWT, "generateGoogleJWT");
async function getGoogleAccessToken(serviceAccount) {
  const jwt = await generateGoogleJWT(serviceAccount);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("OAuth error response:", errorText);
    throw new Error(`OAuth failed: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  return data.access_token;
}
__name(getGoogleAccessToken, "getGoogleAccessToken");
function buildSSMLWithCustom(text, settings) {
  const escapedText = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  const pitch = typeof settings.pitch === "number" ? settings.pitch : 0;
  const rate = typeof settings.speakingRate === "number" ? settings.speakingRate : 1;
  const voiceName = settings.voiceName || "";
  const pitchStr = pitch !== 0 ? pitch >= 0 ? `+${pitch}st` : `${pitch}st` : void 0;
  if (voiceName) {
    if (pitchStr) {
      return `<speak><voice name="${voiceName}"><prosody pitch="${pitchStr}" rate="${rate}">${escapedText}</prosody></voice></speak>`;
    }
    return `<speak><voice name="${voiceName}"><prosody rate="${rate}">${escapedText}</prosody></voice></speak>`;
  }
  if (pitchStr) {
    return `<speak><prosody pitch="${pitchStr}" rate="${rate}">${escapedText}</prosody></speak>`;
  }
  return `<speak><prosody rate="${rate}">${escapedText}</prosody></speak>`;
}
__name(buildSSMLWithCustom, "buildSSMLWithCustom");
async function synthesizeSpeech(text, role, accessToken, customSettings = null) {
  const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;
  let voiceName = profile.name;
  let speakingRate = profile.speakingRate;
  let pitch = profile.pitch;
  let ssmlGender = profile.ssmlGender;
  if (customSettings) {
    if (customSettings.voiceName) {
      voiceName = customSettings.voiceName;
    }
    if (customSettings.gender) {
      ssmlGender = customSettings.gender === "male" ? "MALE" : "FEMALE";
      if (!customSettings.voiceName) {
        const voices = VOICE_OPTIONS[customSettings.gender] || VOICE_OPTIONS.male;
        voiceName = voices[0].name;
      }
    }
    if (typeof customSettings.speakingRate === "number") {
      speakingRate = Math.max(0.5, Math.min(2, customSettings.speakingRate));
    }
    if (typeof customSettings.pitch === "number") {
      pitch = Math.max(-20, Math.min(20, customSettings.pitch));
    }
  }
  const ssml = buildSSMLWithCustom(text, { pitch, speakingRate });
  const audioConfig = {
    audioEncoding: "MP3",
    speakingRate
  };
  const supportsPitch = voiceName.includes("Wavenet") || voiceName.includes("Neural2");
  if (supportsPitch && pitch !== 0) {
    audioConfig.pitch = pitch;
  }
  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: "en-US",
        name: voiceName,
        ssmlGender
      },
      audioConfig
    })
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS API failed: ${response.status} - ${error}`);
  }
  const data = await response.json();
  return data.audioContent;
}
__name(synthesizeSpeech, "synthesizeSpeech");
async function onRequest(context) {
  const { request, env } = context;
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (request.method === "GET") {
    const url = new URL(request.url);
    const sample = url.searchParams.get("sample");
    const role = url.searchParams.get("role") || "narrator";
    const voiceName = url.searchParams.get("voiceName") || null;
    if (!sample) {
      return new Response(JSON.stringify({ error: "sample query param required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const SAMPLE_TEXTS = {
      "narrator_demo": "The wind howls through the mountain pass as you approach the ancient ruins.",
      "npc_demo": "Hail, traveler. Have you come seeking fortune or mischief?",
      "system_demo": "Warning: Your inventory is full. Consider making space before traveling farther."
    };
    const text = SAMPLE_TEXTS[sample];
    if (!text) {
      return new Response(JSON.stringify({ error: "Unknown sample key" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const settingsStr = voiceName ? JSON.stringify({ voiceName }) : "";
    const cacheKey = await md5Hash(`${text}:${role}:${settingsStr}`);
    const filename = `${cacheKey}.mp3`;
    if (env.R2_BUCKET) {
      const cached = await env.R2_BUCKET.get(filename);
      if (cached) {
        const audioData = await cached.arrayBuffer();
        return new Response(audioData, {
          headers: { ...corsHeaders, "Content-Type": "audio/mpeg", "X-Cache": "HIT" }
        });
      }
    }
    const fakeBody = { text, role, voiceSettings: voiceName ? { voiceName } : null, sample };
    var incomingPayload = fakeBody;
  }
  if (request.method !== "POST" && typeof incomingPayload === "undefined") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
  try {
    let body;
    if (typeof incomingPayload !== "undefined") {
      body = incomingPayload;
    } else {
      body = await request.json();
    }
    const { text, role = "narrator", voiceSettings = null, sample = null } = body;
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (text.length > 2e3) {
      return new Response(JSON.stringify({ error: "Text too long (max 2000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const settingsStr = voiceSettings ? JSON.stringify(voiceSettings) : "";
    const cacheKey = await md5Hash(`${sample ? `sample:${sample}` : text}:${role}:${settingsStr}`);
    const filename = `${cacheKey}.mp3`;
    if (env.R2_BUCKET) {
      const cached = await env.R2_BUCKET.get(filename);
      if (cached) {
        console.log(`Cache hit: ${filename}`);
        const audioData = await cached.arrayBuffer();
        return new Response(audioData, {
          headers: {
            ...corsHeaders,
            "Content-Type": "audio/mpeg",
            "X-Cache": "HIT"
          }
        });
      }
    }
    const todayKey = getTodayKey();
    let currentUsage = 0;
    if (env.TTS_USAGE) {
      const usageStr = await env.TTS_USAGE.get(todayKey);
      currentUsage = usageStr ? parseInt(usageStr, 10) : 0;
    }
    if (currentUsage + text.length > DAILY_CHAR_LIMIT) {
      return new Response(JSON.stringify({
        error: "Daily quota exceeded",
        usage: currentUsage,
        limit: DAILY_CHAR_LIMIT
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return new Response(JSON.stringify({ error: "TTS service not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (parseErr) {
      console.error("Failed to parse service account JSON:", parseErr);
      return new Response(JSON.stringify({ error: "Invalid service account configuration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      console.error("Service account missing required fields");
      return new Response(JSON.stringify({ error: "Invalid service account: missing required fields" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    const accessToken = await getGoogleAccessToken(serviceAccount);
    const audioBase64 = await synthesizeSpeech(text, role, accessToken, voiceSettings);
    const audioBuffer = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(filename, audioBuffer, {
        httpMetadata: { contentType: "audio/mpeg" }
      });
      console.log(`Cached: ${filename}`);
    }
    if (env.TTS_USAGE) {
      const newUsage = currentUsage + text.length;
      await env.TTS_USAGE.put(todayKey, newUsage.toString(), {
        expirationTtl: 86400 * 2
        // 2 days TTL
      });
    }
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "X-Cache": "MISS",
        "X-Usage": `${currentUsage + text.length}/${DAILY_CHAR_LIMIT}`
      }
    });
  } catch (error) {
    console.error("TTS Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
__name(onRequest, "onRequest");

// ../.wrangler/tmp/pages-V7zXPd/functionsRoutes-0.09366531357548058.mjs
var routes = [
  {
    routePath: "/api/voice",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-Y357LZ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-Y357LZ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.7071998910852473.mjs.map
