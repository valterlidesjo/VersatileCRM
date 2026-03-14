#!/usr/bin/env node

/**
 * Migration: Copy existing profile from profiles/{id} to companyProfile/main
 * Removes the userId field since this is now a shared company-wide document.
 *
 * Run with: node scripts/migrate-company-profile.mjs
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

async function migrate() {
  console.log('Starting company profile migration...\n');

  const projectId = process.env.FIREBASE_PROJECT_ID || 'valter-crm';
  console.log(`Using Firebase project: ${projectId}`);

  initializeApp({ projectId });
  const db = getFirestore();

  // Check if target already exists
  const targetRef = db.collection('companyProfile').doc('main');
  const existing = await targetRef.get();

  if (existing.exists) {
    console.log('\ncompanyProfile/main already exists. Skipping to avoid overwrite.');
    console.log('Delete it manually if you want to re-run this migration.');
    return;
  }

  // Read source profiles collection
  const snapshot = await db.collection('profiles').get();

  if (snapshot.empty) {
    console.log('No documents found in profiles collection. Nothing to migrate.');
    return;
  }

  console.log(`Found ${snapshot.size} document(s) in profiles collection`);

  // Take the first document (admin's profile)
  const sourceDoc = snapshot.docs[0];
  const data = sourceDoc.data();

  console.log(`Source document ID: ${sourceDoc.id}`);
  console.log(`Source userId: ${data.userId}`);
  console.log(`Source legalName: ${data.legalName}`);

  // Remove userId, keep everything else
  const { userId, ...companyData } = data;

  // Ensure timestamps exist
  const now = new Date().toISOString();
  if (!companyData.createdAt) companyData.createdAt = now;
  if (!companyData.updatedAt) companyData.updatedAt = now;

  // Write to companyProfile/main
  await targetRef.set(companyData);
  console.log('\nCreated companyProfile/main with data:', JSON.stringify(companyData, null, 2));
  console.log('\nMigration complete!');
  console.log('\nNext steps:');
  console.log('1. Deploy updated Firestore rules: firebase deploy --only firestore:rules');
  console.log('2. Deploy updated web app');
  console.log('3. Verify the profile loads correctly for both admin and user roles');
  console.log('4. After verification, manually delete the old profiles collection');
}

migrate()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
