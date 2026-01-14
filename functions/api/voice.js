/**
 * Cloudflare Pages Function - TTS Voice API
 * 
 * Implements Google Cloud TTS with:
 * - MD5-based R2 caching
 * - KV-based daily quota tracking (30k chars/day)
 * - SSML voice profiles for different roles
 * - Customizable voice settings (pitch, rate, gender)
 */

// Available voice options for customization
const VOICE_OPTIONS = {
  male: [
    { name: 'en-US-Wavenet-A', style: 'Young male' },
    { name: 'en-US-Wavenet-B', style: 'Deep male' },
    { name: 'en-US-Wavenet-D', style: 'Mature male' },
    { name: 'en-US-Wavenet-I', style: 'Older male' },
    { name: 'en-US-Wavenet-J', style: 'Warm male' },
    { name: 'en-US-Neural2-A', style: 'Natural male' },
    { name: 'en-US-Neural2-D', style: 'Clear male' },
    { name: 'en-US-Neural2-I', style: 'Expressive male' },
    { name: 'en-US-Neural2-J', style: 'Conversational male' },
  ],
  female: [
    { name: 'en-US-Wavenet-C', style: 'Warm female' },
    { name: 'en-US-Wavenet-E', style: 'Young female' },
    { name: 'en-US-Wavenet-F', style: 'Atmospheric female' },
    { name: 'en-US-Wavenet-G', style: 'Soft female' },
    { name: 'en-US-Wavenet-H', style: 'Bright female' },
    { name: 'en-US-Neural2-C', style: 'Natural female' },
    { name: 'en-US-Neural2-E', style: 'Clear female' },
    { name: 'en-US-Neural2-F', style: 'Expressive female' },
    { name: 'en-US-Neural2-G', style: 'Conversational female' },
    { name: 'en-US-Neural2-H', style: 'Warm neural female' },
  ]
};

// Voice profiles with SSML attributes
// Note: Journey voices don't support pitch, only Wavenet/Neural2 do
const VOICE_PROFILES = {
  narrator: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-C', // Use Neural2 for more natural narration
    ssmlGender: 'FEMALE',
    pitch: -2,
    speakingRate: 0.9,
    supportsPitch: true,
    style: 'Atmospheric, wise narrator'
  },
  khajiit: {
    languageCode: 'en-US',
    name: 'en-US-Wavenet-B',
    ssmlGender: 'MALE',
    pitch: -4,
    speakingRate: 0.85,
    supportsPitch: true,
    style: 'Deep, raspy, exotic'
  },
  system: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-H',
    ssmlGender: 'FEMALE',
    pitch: 0,
    speakingRate: 1.1,
    supportsPitch: true,
    style: 'Clean, fast for alerts'
  },
  // Default for NPCs
  npc: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-D',
    ssmlGender: 'MALE',
    pitch: 0,
    speakingRate: 0.95,
    supportsPitch: true,
    style: 'Generic NPC voice'
  },
  // Female NPC variant
  npc_female: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-C',
    ssmlGender: 'FEMALE',
    pitch: 0,
    speakingRate: 0.95,
    supportsPitch: true,
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

  // Use a voice wrapper and prosody for more natural rendering
  // Only use pitch in prosody if voice supports it
  const pitchStr = (profile.supportsPitch && profile.pitch) ? (profile.pitch >= 0 ? `+${profile.pitch}st` : `${profile.pitch}st`) : undefined;
  const rateStr = profile.speakingRate || 1.0;

  if (pitchStr) {
    return `<speak><voice name="${profile.name}"><prosody pitch="${pitchStr}" rate="${rateStr}">${escapedText}</prosody></voice></speak>`;
  }

  // For voices without pitch support, only use rate
  return `<speak><voice name="${profile.name}"><prosody rate="${rateStr}">${escapedText}</prosody></voice></speak>`;
}

/**
 * Generate JWT for Google Cloud authentication
 */
async function generateGoogleJWT(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3600; // 1 hour expiry

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: exp,
    scope: 'https://www.googleapis.com/auth/cloud-platform'
  };

  // Base64URL encode
  const base64UrlEncode = (obj) => {
    const json = JSON.stringify(obj);
    // Use a Cloudflare-compatible base64 encoding
    const bytes = new TextEncoder().encode(json);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
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
    const errorText = await response.text();
    console.error('OAuth error response:', errorText);
    throw new Error(`OAuth failed: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Build SSML with custom settings
 */
function buildSSMLWithCustom(text, settings) {
  // Escape special XML characters
  const escapedText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const pitch = typeof settings.pitch === 'number' ? settings.pitch : 0;
  const rate = typeof settings.speakingRate === 'number' ? settings.speakingRate : 1.0;
  const voiceName = settings.voiceName || '';

  const pitchStr = pitch !== 0 ? (pitch >= 0 ? `+${pitch}st` : `${pitch}st`) : undefined;

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

/**
 * Call Google Cloud TTS API
 * @param {string} text - Text to synthesize
 * @param {string} role - Voice role (narrator, khajiit, etc.)
 * @param {string} accessToken - Google OAuth access token
 * @param {object} customSettings - Optional custom voice settings
 */
async function synthesizeSpeech(text, role, accessToken, customSettings = null) {
  const profile = VOICE_PROFILES[role] || VOICE_PROFILES.narrator;
  
  // Determine voice settings - use custom if provided, otherwise use profile defaults
  let voiceName = profile.name;
  let speakingRate = profile.speakingRate;
  let pitch = profile.pitch;
  let ssmlGender = profile.ssmlGender;
  
  if (customSettings) {
    // Apply custom settings
    if (customSettings.voiceName) {
      voiceName = customSettings.voiceName;
    }
    if (customSettings.gender) {
      ssmlGender = customSettings.gender === 'male' ? 'MALE' : 'FEMALE';
      // Pick a default voice for the gender if not specified
      if (!customSettings.voiceName) {
        const voices = VOICE_OPTIONS[customSettings.gender] || VOICE_OPTIONS.male;
        voiceName = voices[0].name;
      }
    }
    if (typeof customSettings.speakingRate === 'number') {
      speakingRate = Math.max(0.5, Math.min(2.0, customSettings.speakingRate));
    }
    if (typeof customSettings.pitch === 'number') {
      pitch = Math.max(-20, Math.min(20, customSettings.pitch));
    }
  }
  
  const ssml = buildSSMLWithCustom(text, { pitch, speakingRate });

  // Build audioConfig - only include pitch if voice supports it
  const audioConfig = {
    audioEncoding: 'MP3',
    speakingRate: speakingRate
  };
  
  // Wavenet and Neural2 voices support pitch
  const supportsPitch = voiceName.includes('Wavenet') || voiceName.includes('Neural2');
  if (supportsPitch && pitch !== 0) {
    audioConfig.pitch = pitch;
  }

  const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: { ssml },
      voice: {
        languageCode: 'en-US',
        name: voiceName,
        ssmlGender: ssmlGender
      },
      audioConfig
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

  // Allow simple GET requests for playing one of the fixed sample sentences
  if (request.method === 'GET') {
    const url = new URL(request.url);
    const sample = url.searchParams.get('sample');
    const role = url.searchParams.get('role') || 'narrator';
    const voiceName = url.searchParams.get('voiceName') || null;

    if (!sample) {
      return new Response(JSON.stringify({ error: 'sample query param required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Map of fixed sample sentences (kept short and deterministic)
    const SAMPLE_TEXTS = {
      'narrator_demo': 'The wind howls through the mountain pass as you approach the ancient ruins.',
      'npc_demo': 'Hail, traveler. Have you come seeking fortune or mischief?',
      'system_demo': 'Warning: Your inventory is full. Consider making space before traveling farther.'
    };

    const text = SAMPLE_TEXTS[sample];
    if (!text) {
      return new Response(JSON.stringify({ error: 'Unknown sample key' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build a deterministic cache key that includes the sample and optional voiceName
    const settingsStr = voiceName ? JSON.stringify({ voiceName }) : '';
    const cacheKey = await md5Hash(`${text}:${role}:${settingsStr}`);
    const filename = `${cacheKey}.mp3`;

    // Try to serve from R2 cache first
    if (env.R2_BUCKET) {
      const cached = await env.R2_BUCKET.get(filename);
      if (cached) {
        const audioData = await cached.arrayBuffer();
        return new Response(audioData, {
          headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg', 'X-Cache': 'HIT' }
        });
      }
    }

    // Fall through to synthesizing the sample below by treating it like a POST body
    // so the existing quota/cache logic is reused. We'll synthesize the sample text.
    // Build a fake payload for reuse.
    const fakeBody = { text, role, voiceSettings: voiceName ? { voiceName } : null, sample };
    // Continue processing with fake payload by assigning to a local variable below.
    var incomingPayload = fakeBody;
    // Jump to synthesis flow below by skipping the POST-only check.
  }

  if (request.method !== 'POST' && typeof incomingPayload === 'undefined') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    // Support either POST bodies or an injected incomingPayload (for GET sample requests)
    let body;
    if (typeof incomingPayload !== 'undefined') {
      body = incomingPayload;
    } else {
      body = await request.json();
    }
    const { text, role = 'narrator', voiceSettings = null, sample = null } = body;

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

    // Generate cache key (include voice settings in hash)
    const settingsStr = voiceSettings ? JSON.stringify(voiceSettings) : '';
    const cacheKey = await md5Hash(`${sample ? `sample:${sample}` : text}:${role}:${settingsStr}`);
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

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
    } catch (parseErr) {
      console.error('Failed to parse service account JSON:', parseErr);
      return new Response(JSON.stringify({ error: 'Invalid service account configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate required fields
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('Service account missing required fields');
      return new Response(JSON.stringify({ error: 'Invalid service account: missing required fields' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);

    // Step 4: Call Google TTS (with optional custom voice settings)
    const audioBase64 = await synthesizeSpeech(text, role, accessToken, voiceSettings);
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
