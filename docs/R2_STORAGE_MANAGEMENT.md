# R2 Storage Management

## Overview
The application uses Cloudflare R2 for caching TTS (text-to-speech) audio files. Files are cached using an MD5 hash of the text content + voice role + voice settings, which means:

- **Same text = same cache file** (shared across all users)
- **Files are not tied to specific users or characters**
- **Deleting a user/character does not delete associated audio files**

## R2 Free Tier Limit
Cloudflare R2 free tier includes **10GB of storage**. To prevent exceeding this limit, you should configure a lifecycle policy.

## Setting Up R2 Lifecycle Rules (Recommended)

1. Go to **Cloudflare Dashboard** → **R2 Object Storage**
2. Select the bucket: `rpg-audio-cache`
3. Go to **Settings** → **Object Lifecycle Rules**
4. Create a new rule:
   - **Rule name**: `auto-expire-old-audio`
   - **Scope**: Apply to all objects (or prefix if desired)
   - **Action**: Delete objects after **30 days** (or your preferred duration)
5. Save the rule

This will automatically delete audio files that haven't been accessed in 30 days, keeping storage under control.

## Manual Cleanup (If Needed)

If you need to manually clean up the bucket, you can use the Cloudflare Dashboard or Wrangler CLI:

```bash
# List all objects in the bucket
wrangler r2 object list rpg-audio-cache

# Delete a specific object
wrangler r2 object delete rpg-audio-cache --key <filename.mp3>

# Delete all objects (use with caution!)
# This requires scripting as Wrangler doesn't have a bulk delete command
```

## Storage Estimation

- Average audio file size: ~50-100KB per response
- Daily usage estimate: ~100-500 unique audio generations
- Monthly growth: ~5-25MB/day = 150-750MB/month

With a 30-day lifecycle policy, storage should stabilize around **2-5GB**.

## Why Per-User Cleanup Is Not Feasible

The caching system uses content-based addressing (hash of text content), which provides:
- **Better cache efficiency**: Same narration = same file (shared)
- **Lower API costs**: Re-reading text doesn't hit Google TTS
- **Simpler storage**: No user-to-file mapping needed

The tradeoff is that we cannot delete files for specific users. The lifecycle policy approach handles cleanup automatically without needing user-specific tracking.
