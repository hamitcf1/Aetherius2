# Firebase Security Rules Configuration

## Overview
This document describes the Firebase security rules required for the Aetherius application to function properly.

## Firestore Rules

### Current Configuration
Add these rules to your Firestore Security Rules in the Firebase Console:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User private data
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;

      // Allow access to all subcollections (only for own data)
      match /{document=**} {
        allow read, write: if request.auth.uid == uid;
      }
    }
  }
}
```

## Realtime Database Rules

### Required Configuration
Add these rules to your Realtime Database Rules in the Firebase Console:

```json
{
  "rules": {
    "presence": {
      "$uid": {
        ".read": "auth.uid == $uid || root.child('users').child($uid).child('isPublic').val() === true",
        ".write": "auth.uid == $uid"
      }
    },
    "sessions": {
      "$uid": {
        ".read": "auth.uid == $uid",
        ".write": "auth.uid == $uid"
      }
    },
    "aiState": {
      "$uid": {
        ".read": "auth.uid == $uid",
        ".write": "auth.uid == $uid"
      }
    }
  }
}
```

### Explanation
- **presence/{uid}**: Tracks if a user is currently online. Only authenticated users can write to their own presence data.
- **sessions/{uid}**: Stores active character and session information. Only the authenticated user can read/write their own session data.
- **aiState/{uid}**: Stores AI generation progress. Only the authenticated user can read/write their own AI state data.

## How to Update Rules

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project ("rugged-timer-384206")
3. Navigate to **Realtime Database** section
4. Click the **Rules** tab
5. Paste the JSON rules above
6. Click **Publish**

## Current Issues

### Resolved
- ✅ **Undefined `dueDate` in quests**: Fixed by filtering undefined fields before saving
- ✅ **Firestore persistence initialization**: Fixed by preventing multiple initialization attempts

### Needs Rule Update
- ⚠️ **PERMISSION_DENIED on presence writes**: Requires Realtime Database rules update
- ⚠️ **PERMISSION_DENIED on sessions writes**: Requires Realtime Database rules update

### Deprecation Warnings
- ℹ️ **enableIndexedDbPersistence() deprecated**: Use `FirestoreSettings.cache` instead (will be updated in next Firebase SDK upgrade)

## Error Handling

The application gracefully handles all Realtime Database errors:
- Permission errors are logged as warnings
- The app continues functioning even if presence/session tracking fails
- Firestore operations are properly isolated to prevent cascade failures

## Testing

After updating rules, test the following:
1. Log in as a user
2. Check browser console for any `PERMISSION_DENIED` errors
3. Verify character selection works
4. Verify quest creation/editing works
5. Close and reopen the app to verify offline functionality
