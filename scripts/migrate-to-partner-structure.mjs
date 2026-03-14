#!/usr/bin/env node

/**
 * Migration: Move all root-level collections to /partners/{partnerId}/ subcollections.
 *
 * Collections moved:
 *   /customers           → /partners/{id}/customers
 *   /users               → /partners/{id}/contactUsers   (renamed)
 *   /meetings            → /partners/{id}/meetings
 *   /invoices            → /partners/{id}/invoices
 *   /quotes              → /partners/{id}/quotes
 *   /journalEntries      → /partners/{id}/journalEntries
 *   /deals               → /partners/{id}/deals
 *   /contacts            → /partners/{id}/contacts
 *   /companyProfile/main → /partners/{id}/companyProfile/main
 *   /allowedEmails       → updated in place with partnerId field
 *
 * Old data is NOT deleted — kept as backup.
 * Script is idempotent: skips collections already migrated.
 *
 * Run with: node scripts/migrate-to-partner-structure.mjs
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { homedir, tmpdir } from 'os';

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const PARTNER_ID = 'valter';
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'valter-crm';
// ────────────────────────────────────────────────────────────────────────────

// Firebase CLI OAuth2 client (public, embedded in firebase-tools source)
const FIREBASE_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const BATCH_SIZE = 400;

function log(msg)  { console.log(msg); }
function ok(msg)   { console.log(`  ✓ ${msg}`); }
function skip(msg) { console.log(`  — ${msg}`); }

function setupADCFromFirebaseCLI() {
  const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch {
    throw new Error(`Cannot read Firebase CLI config at ${configPath}. Run 'firebase login' first.`);
  }

  const tokens = config.tokens;
  if (!tokens || !tokens.refresh_token) {
    throw new Error('No refresh_token found in Firebase CLI config. Run: firebase login');
  }

  // Write a temporary ADC JSON file using the Firebase CLI's OAuth credentials
  const adcJson = JSON.stringify({
    client_id: FIREBASE_CLI_CLIENT_ID,
    client_secret: FIREBASE_CLI_CLIENT_SECRET,
    refresh_token: tokens.refresh_token,
    type: 'authorized_user',
  });

  const tmpPath = join(tmpdir(), 'firebase-migration-adc.json');
  writeFileSync(tmpPath, adcJson, { mode: 0o600 });
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  return tmpPath;
}

async function copyCollection(db, srcPath, dstPath) {
  const srcSnap = await db.collection(srcPath).get();
  if (srcSnap.empty) {
    skip(`${srcPath} is empty, nothing to copy`);
    return 0;
  }

  const dstSnap = await db.collection(dstPath).limit(1).get();
  if (!dstSnap.empty) {
    skip(`${dstPath} already has data — skipping`);
    return 0;
  }

  let total = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of srcSnap.docs) {
    const dstRef = db.collection(dstPath).doc(docSnap.id);
    batch.set(dstRef, docSnap.data());
    batchCount++;
    total++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  ok(`Copied ${total} doc(s): ${srcPath} → ${dstPath}`);
  return total;
}

async function copySingleDoc(db, srcCol, srcDocId, dstCol, dstDocId) {
  const srcSnap = await db.collection(srcCol).doc(srcDocId).get();
  if (!srcSnap.exists) {
    skip(`${srcCol}/${srcDocId} does not exist — nothing to copy`);
    return;
  }

  const dstRef = db.collection(dstCol).doc(dstDocId);
  const dstSnap = await dstRef.get();
  if (dstSnap.exists) {
    skip(`${dstCol}/${dstDocId} already exists — skipping`);
    return;
  }

  await dstRef.set(srcSnap.data());
  ok(`Copied: ${srcCol}/${srcDocId} → ${dstCol}/${dstDocId}`);
}

async function addPartnerIdToAllowedEmails(db) {
  const snap = await db.collection('allowedEmails').get();
  if (snap.empty) { skip('allowedEmails is empty'); return; }

  let updated = 0;
  let already = 0;
  let batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    if (docSnap.data().partnerId) { already++; continue; }
    batch.update(docSnap.ref, { partnerId: PARTNER_ID });
    batchCount++;
    updated++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  if (updated > 0) ok(`Updated ${updated} allowedEmails doc(s) with partnerId="${PARTNER_ID}"`);
  if (already > 0) skip(`${already} allowedEmails doc(s) already had partnerId`);
}

async function createPartnerDoc(db) {
  const ref = db.collection('partners').doc(PARTNER_ID);
  const snap = await ref.get();
  if (snap.exists) { skip(`partners/${PARTNER_ID} already exists`); return; }

  const now = new Date().toISOString();
  await ref.set({ name: 'Valter', createdAt: now, updatedAt: now });
  ok(`Created partners/${PARTNER_ID}`);
}

async function migrate() {
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(` Partner Data Migration`);
  log(` Project : ${PROJECT_ID}`);
  log(` Partner : ${PARTNER_ID}`);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  log('Authenticating via Firebase CLI credentials...');
  const tmpAdcPath = setupADCFromFirebaseCLI();
  ok(`Wrote temporary ADC credentials to ${tmpAdcPath}`);

  initializeApp({
    credential: applicationDefault(),
    projectId: PROJECT_ID,
  });

  const db = getFirestore();
  const dst = (col) => `partners/${PARTNER_ID}/${col}`;

  log('\n[ 1/10 ] Creating partner document...');
  await createPartnerDoc(db);

  log('[ 2/10 ] Copying customers...');
  await copyCollection(db, 'customers', dst('customers'));

  log('[ 3/10 ] Copying users → contactUsers...');
  await copyCollection(db, 'users', dst('contactUsers'));

  log('[ 4/10 ] Copying meetings...');
  await copyCollection(db, 'meetings', dst('meetings'));

  log('[ 5/10 ] Copying invoices...');
  await copyCollection(db, 'invoices', dst('invoices'));

  log('[ 6/10 ] Copying quotes...');
  await copyCollection(db, 'quotes', dst('quotes'));

  log('[ 7/10 ] Copying journalEntries...');
  await copyCollection(db, 'journalEntries', dst('journalEntries'));

  log('[ 8/10 ] Copying deals...');
  await copyCollection(db, 'deals', dst('deals'));

  log('[ 9/10 ] Copying contacts...');
  await copyCollection(db, 'contacts', dst('contacts'));

  log('[10/10 ] Copying companyProfile/main...');
  await copySingleDoc(db, 'companyProfile', 'main', dst('companyProfile'), 'main');

  log('\n[11/11 ] Adding partnerId to allowedEmails...');
  await addPartnerIdToAllowedEmails(db);

  // Clean up temporary ADC file
  try { unlinkSync(tmpAdcPath); } catch {}

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  log(' Migration complete!');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  log(' Old root collections are untouched (backup).');
  log(' Verify the app works, then delete them manually.\n');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n✗ Migration failed:', err.message || err);
    process.exit(1);
  });
