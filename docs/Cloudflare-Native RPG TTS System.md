# Cloudflare-Native RPG TTS System

## Status: ✅ IMPLEMENTED

## 1. Objective
Integrate Google Cloud TTS into the RPG engine [hamitcf.info] while maintaining a $0 budget and compatible with Cloudflare Pages' stateless architecture.

## 2. Infrastructure Architecture
Since Cloudflare Pages has no local file system, the agent must use the following "Cloudflare-Native" stack:
- **Storage (Caching):** Cloudflare R2 (Object Storage) to store generated .mp3 files (10GB Free Tier).
- **Usage Tracking:** Cloudflare KV (Key-Value) to track daily character counts and enforce the 30,000-character daily limit.
- **Runtime:** Cloudflare Pages Functions (Edge Runtime) using fetch to interact with Google TTS REST API.

## 3. Technical Constraints (The "Zero-Cost" Rules)
- **Cache-First Strategy:** Every request must check the R2 Bucket for a file named `md5(text + role).mp3` before calling Google.
- **Hard Daily Cap:** Before calling Google, check KV for the key `usage:YYYY-MM-DD`. If the value > 30,000, abort the request to prevent billing.
- **Statelessness:** Use `crypto.subtle` for MD5 hashing and the Google Cloud REST API (via fetch) instead of the bulky GCP SDK.

## 4. Voice & Atmosphere Configuration
Configure the following profiles using SSML (Speech Synthesis Markup Language):

| Role | Google Model | SSML Attributes | Tone/Style |
|------|-------------|-----------------|------------|
| Narrator | en-US-Journey-F | pitch="-2st" rate="0.9" | Atmospheric, wise, slow pace |
| Khajiit | en-US-Wavenet-B | pitch="-4st" rate="0.85" | Deep, raspy, exotic/mysterious |
| System | en-US-Neural2-H | rate="1.1" | Clean, fast (for stats/alerts) |
| NPC | en-US-Wavenet-D | rate="0.95" | Generic NPC voice |
| NPC Female | en-US-Wavenet-C | rate="0.95" | Generic female NPC |

## 5. Implementation Files

### Backend (Cloudflare Pages Function)
- **File:** `functions/api/voice.js`
- **Features:**
  - JWT authentication with Google Cloud
  - R2 cache check before API call
  - KV quota tracking (30k chars/day)
  - SSML generation with voice profiles
  - Base64 audio decoding and storage

### Frontend (TTS Service)
- **File:** `services/ttsService.ts`
- **Features:**
  - `speak()` - Synthesize and play text
  - `stopSpeaking()` - Stop current playback
  - `pauseSpeaking()` / `resumeSpeaking()` - Playback control
  - `detectVoiceRole()` - Auto-detect voice from content
  - In-memory audio caching
  - State subscription system

### UI Integration
- **File:** `components/AdventureChat.tsx`
- **Features:**
  - Voice On/Off toggle button in header
  - Per-message "Listen" button for GM responses
  - Play/Pause/Stop controls during playback
  - "Speaking..." indicator with animation
  - Khajiit voice detection for player race

## 6. Setup Instructions

### Step 1: Create Cloudflare Resources
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create R2 bucket
wrangler r2 bucket create rpg-audio-cache

# Create KV namespace
wrangler kv:namespace create TTS_USAGE
# Note the ID returned and update wrangler.toml
```

### Step 2: Configure Google Cloud
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Cloud Text-to-Speech API**
4. Create a Service Account with TTS permissions
5. Download JSON key file

### Step 3: Set Environment Variables
In Cloudflare Dashboard > Pages > Settings > Environment Variables:
- `GOOGLE_SERVICE_ACCOUNT_JSON` = (paste entire JSON content)

### Step 4: Update wrangler.toml
Replace `YOUR_KV_NAMESPACE_ID` with actual KV namespace ID from Step 1.

### Step 5: Deploy
```bash
npm run build
wrangler pages deploy dist
```

## 7. Usage
1. In Adventure Chat, click the **Voice** button to enable TTS
2. Each GM message will show a **Listen** button
3. Click to hear the narration
4. Use Play/Pause/Stop controls during playback

## 8. Cost Analysis
- **R2:** 10GB free, ~0.5MB per audio = ~20,000 cached audios
- **KV:** 100k reads/day free, 1k writes/day free
- **Google TTS:** 1M chars/month free, 30k/day limit = safe margin
- **Total Monthly Cost:** $0