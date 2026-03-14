#!/usr/bin/env node

/**
 * Migration script to update allowedEmails collection
 * This converts existing documents to use sanitized email addresses as document IDs
 *
 * Run with: node scripts/migrate-allowed-emails.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Sanitize email to match firestore.rules
function sanitizeEmail(email) {
  return email.replace(/@/g, '_at_').replace(/\./g, '_dot_');
}

async function migrate() {
  console.log('🚀 Starting allowedEmails migration...\n');

  try {
    // Initialize Firebase Admin
    // This will use GOOGLE_APPLICATION_CREDENTIALS env var or default credentials
    console.log('Initializing Firebase Admin...');

    // Explicitly set the project ID
    const projectId = process.env.FIREBASE_PROJECT_ID || 'valter-crm';
    console.log(`Using Firebase project: ${projectId}`);

    initializeApp({
      projectId: projectId
    });
    const db = getFirestore();

    // Get all existing allowedEmails
    console.log('Fetching existing allowedEmails documents...');
    const snapshot = await db.collection('allowedEmails').get();

    if (snapshot.empty) {
      console.log('✅ No documents found in allowedEmails collection. Nothing to migrate.');
      return;
    }

    console.log(`Found ${snapshot.size} document(s)\n`);

    const toMigrate = [];
    const alreadyMigrated = [];
    const errors = [];

    // Analyze documents
    snapshot.forEach((doc) => {
      const data = doc.data();
      const email = data.email;

      if (!email) {
        errors.push(`Document ${doc.id} has no email field`);
        return;
      }

      const sanitizedId = sanitizeEmail(email);

      if (doc.id === sanitizedId) {
        alreadyMigrated.push({ id: doc.id, email });
      } else {
        toMigrate.push({ oldId: doc.id, newId: sanitizedId, email, data });
      }
    });

    // Report status
    console.log('📊 Migration Analysis:');
    console.log(`   Already migrated: ${alreadyMigrated.length}`);
    console.log(`   Needs migration: ${toMigrate.length}`);
    console.log(`   Errors: ${errors.length}\n`);

    if (errors.length > 0) {
      console.log('❌ Errors found:');
      errors.forEach(err => console.log(`   - ${err}`));
      console.log();
    }

    if (alreadyMigrated.length > 0) {
      console.log('✅ Already migrated:');
      alreadyMigrated.forEach(({ id, email }) =>
        console.log(`   - ${email} (${id})`)
      );
      console.log();
    }

    if (toMigrate.length === 0) {
      console.log('✅ All documents are already migrated!');
      return;
    }

    console.log('🔄 Migrating documents...');

    // Create new documents with sanitized IDs
    const batch = db.batch();
    toMigrate.forEach(({ newId, data, email }) => {
      const newDocRef = db.collection('allowedEmails').doc(newId);
      batch.set(newDocRef, data);
      console.log(`   Creating: ${email} → ${newId}`);
    });

    await batch.commit();
    console.log(`\n✅ Created ${toMigrate.length} new document(s)`);

    // Delete old documents
    console.log('\n🗑️  Deleting old documents...');
    const deleteBatch = db.batch();
    toMigrate.forEach(({ oldId, email }) => {
      deleteBatch.delete(db.collection('allowedEmails').doc(oldId));
      console.log(`   Deleting: ${email} (old ID: ${oldId})`);
    });

    await deleteBatch.commit();
    console.log(`\n✅ Deleted ${toMigrate.length} old document(s)`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy the updated Firestore rules: firebase deploy --only firestore:rules');
    console.log('2. Test login with a user role account');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
