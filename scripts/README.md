# Migration Scripts

## Migrate Allowed Emails

This script migrates the `allowedEmails` collection to use sanitized email addresses as document IDs.

### Prerequisites

1. **Firebase credentials**: You need to authenticate with Firebase. Choose one option:

   **Option A: Use Firebase CLI login (Recommended)**
   ```bash
   firebase login
   ```

   **Option B: Use service account key**
   - Download a service account key from Firebase Console → Project Settings → Service Accounts
   - Set the environment variable:
     ```bash
     export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
     ```

### Running the Migration

```bash
npm run migrate:allowed-emails
```

The script will:
1. ✅ Check which documents need migration
2. 🔄 Create new documents with sanitized email IDs
3. 🗑️ Delete old documents
4. 📊 Show you a summary of the changes

### What it does

Converts documents like:
- **Before**: Document ID: `abc123` (auto-generated), Email: `user@example.com`
- **After**: Document ID: `user_at_example_dot_com`, Email: `user@example.com`

### After Migration

Once the migration completes successfully:

1. **Deploy the updated Firestore rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

2. **Test with a user role account** to verify permissions work correctly

### Troubleshooting

**Error: "Could not load the default credentials"**
- Make sure you're logged in with `firebase login`
- OR set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

**Error: "PERMISSION_DENIED"**
- Make sure your Firebase account has the necessary permissions
- You need Firestore read/write access

**The script says "All documents are already migrated"**
- Great! Your data is already in the correct format
- You can proceed to deploy the Firestore rules
