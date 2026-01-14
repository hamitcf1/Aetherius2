/**
 * Cloudflare Pages Function - TTS Voice API
 * 
 * Implements Google Cloud TTS with:
 * - MD5-based R2 caching
 * - KV-based daily quota tracking (30k chars/day)
 * - SSML voice profiles for different roles
 */

// Voice profiles with SSML attributes
const VOICE_PROFILES = {
  narrator: {
    languageCode: 'en-US',
    name: 'en-US-Journey-F',
    ssmlGender: 'FEMALE',
    pitch: -2,
    speakingRate: 0.9,
    style: 'Atmospheric, wise narrator'
  },
  khajiit: {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-B',
    ssmlGender: 'MALE',
    pitch: -4,
    speakingRate: 0.85,
    style: 'Deep, raspy, exotic'
  },
  system: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-H',
    ssmlGender: 'FEMALE',
    pitch: 0,
    speakingRate: 1.1,
    style: 'Clean, fast for alerts'
  },
  // Default for NPCs
  npc: {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-D',
    ssmlGender: 'MALE',
    pitch: 0,
    speakingRate: 0.95,
    style: 'Generic NPC voice'
  },
  // Female NPC variant
  npc_female: {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-C',
    ssmlGender: 'FEMALE',
    pitch: 0,
    speakingRate: 0.95,
    style: 'Generic female NPC'
  }
};

const DAILY_CHAR_LIMIT = 30000;

/**
 * Generate MD5 hash using Web Crypto API
 */
async function md5Hash(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get today's date key for quota tracking
 */
function getTodayKey() {
  const now = new Date();
  return `usage:${now.toISOString().split('T')[0]}`;
}

/**
 * Build SSML from text and voice profile
 */
function buildSSML(text, profile) {
  // Escape special XML characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const pitchStr = profile.pitch >= 0 ? `+${profile.pitch}st` : `${profile.pitch}st`;
  
  return `<speak>
    <prosody pitch="${pitchStr}" rate="${profile.speakingRate}">
      ${escapedText}
    </prosody>
  </speak>`;
}

/**
 * Generate JWT for Google Cloud authentication
 */
async function generateGoogleJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: serviceAccount.private_key_id
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://texttospeech.googleapis.com/',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };

  // Base64URL encode
  const base64UrlEncode = (obj) => {
    const json = JSON.stringify(obj);
    const base64 = btoa(json);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const headerB64 = base64UrlEncode(header);
  const payloadB64 = base64UrlEncode(payload);
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Import private key and sign
  const pemContents = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${unsignedToken}.${signatureB64}`;
}

/**
 * Get access token from Google OAuth
 */
async function getGoogleAccessToken(serviceAccount) {
  const jwt = await generateGoogleJWT(serviceAccount);
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    throw new Error(`OAuth failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Call Google Cloud TTS API
 */
async function synthesizeSpeech(text, role, accessToken) {
  const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;
  const ssml = buildSSML(text, profile);

  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: profile.languageCode,
        name: profile.name,
        ssmlGender: profile.ssmlGender
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: profile.pitch,
        speakingRate: profile.speakingRate
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS API failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  // Google returns base64 encoded audio
  return data.audioContent;
}

/**
 * Main handler for Cloudflare Pages Function
 */
export async function onRequest(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { text, role = 'narrator' } = await request.json();

    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'Text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Limit text length per request
    if (text.length > 2000) {
      return new Response(JSON.stringify({ error: 'Text too long (max 2000 chars)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate cache key
    const cacheKey = await md5Hash(`${text}:${role}`);
    const filename = `${cacheKey}.mp3`;

    // Step 1: Check R2 cache
    if (env.R2_BUCKET) {
      const cached = await env.R2_BUCKET.get(filename);
      if (cached) {
        console.log(`Cache hit: ${filename}`);
        const audioData = await cached.arrayBuffer();
        return new Response(audioData, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'audio/mpeg',
            'X-Cache': 'HIT'
          }
        });
      }
    }

    // Step 2: Check daily quota
    const todayKey = getTodayKey();
    let currentUsage = 0;
    
    if (env.TTS_USAGE) {
      const usageStr = await env.TTS_USAGE.get(todayKey);
      currentUsage = usageStr ? parseInt(usageStr, 10) : 0;
    }

    if (currentUsage + text.length > DAILY_CHAR_LIMIT) {
      return new Response(JSON.stringify({ 
        error: 'Daily quota exceeded',
        usage: currentUsage,
        limit: DAILY_CHAR_LIMIT
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 3: Get Google credentials
    if (!env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      return new Response(JSON.stringify({ error: 'TTS service not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Step 4: Call Google TTS
    const audioBase64 = await synthesizeSpeech(text, role, accessToken);
    const audioBuffer = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));

    // Step 5: Store in R2 cache
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(filename, audioBuffer, {
        httpMetadata: { contentType: 'audio/mpeg' }
      });
      console.log(`Cached: ${filename}`);
    }

    // Step 6: Update quota
    if (env.TTS_USAGE) {
      const newUsage = currentUsage + text.length;
      await env.TTS_USAGE.put(todayKey, newUsage.toString(), {
        expirationTtl: 86400 * 2 // 2 days TTL
      });
    }

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'X-Cache': 'MISS',
        'X-Usage': `${currentUsage + text.length}/${DAILY_CHAR_LIMIT}`
      }
    });

  } catch (error) {
    console.error('TTS Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
