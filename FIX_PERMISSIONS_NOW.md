# URGENT FIX - Firestore Permissions

## What Changed

I've **eliminated the email sanitization complexity** and switched to using Firebase Auth UIDs as document IDs. This is:
- ✅ Much simpler and more reliable
- ✅ Standard Firebase pattern
- ✅ No string manipulation issues

## IMMEDIATE STEPS TO FIX

### Step 1: Deploy the Updated Rules (30 seconds)

```bash
firebase deploy --only firestore:rules
```

### Step 2: Get Your Firebase UID (1 minute)

1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:5173/get-uid`
3. Log in with Google
4. **COPY YOUR UID** (there's a copy button)

### Step 3: Add Yourself as Admin in Firebase Console (2 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database**
4. Click on the `allowedEmails` collection
5. Click **"Add document"**
6. **Document ID**: Paste your UID from Step 2
7. Add these fields:
   - `email` (string): your email (e.g., `valle.lidesjo@gmail.com`)
   - `role` (string): `admin`
   - `createdAt` (string): current ISO timestamp (e.g., `2026-02-11T20:30:00.000Z`)
   - `updatedAt` (string): same as createdAt
8. Click **Save**

### Step 4: Test (30 seconds)

1. Refresh your app
2. You should now have full admin access
3. No more permission errors!

## Files Changed

- ✅ `firestore.rules` - Simplified to use UID lookup (no email sanitization)
- ✅ `packages/web/src/lib/auth.tsx` - Uses UID instead of sanitized email
- ✅ `packages/web/src/features/settings/hooks/use-allowed-emails.ts` - Uses UID for document IDs
- ✅ `packages/web/src/routes/get-uid.tsx` - NEW utility page to get your UID

## What's Fixed

The problem was the email sanitization function in Firestore rules was causing "internal errors" because:
1. It couldn't properly replace all dots and @ symbols
2. This made the document lookup fail
3. Which caused all permissions to fail

Now we use your Firebase Auth UID directly - no string manipulation needed!

## Migration for Other Users

When you add other users through the Settings UI, you'll need to:
1. They log in first
2. You can see their UID in Firebase Auth console
3. Or temporarily give them access to `/get-uid` page
4. Then add them through Settings with their UID

## Rollback (If Needed)

If this doesn't work, we can try Custom Claims as a last resort, but this SHOULD work.

---

**TOTAL TIME: ~4 minutes to complete all steps**
