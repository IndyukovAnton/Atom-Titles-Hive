#!/usr/bin/env node
// Installs the Tauri updater public key into src-tauri/tauri.conf.json.
//
// Reads the key from ~/.tauri/seen.key.pub (default location used by
// `tauri signer generate --write-keys ~/.tauri/seen.key`) or the path
// supplied via TAURI_PUBKEY_PATH.
//
// Run once after generating the keypair, and again whenever you rotate
// the key. The private key (~/.tauri/seen.key) stays out of the repo —
// the release script reads its contents at build time.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const defaultPub = path.join(homedir(), '.tauri', 'seen.key.pub');
const pubPath = process.env.TAURI_PUBKEY_PATH || defaultPub;
const confPath = path.join(root, 'src-tauri', 'tauri.conf.json');

if (!existsSync(pubPath)) {
  console.error(`✗ Public key not found at:\n    ${pubPath}`);
  console.error('\nGenerate one first:');
  console.error('  npx @tauri-apps/cli signer generate \\');
  console.error('    --write-keys "%USERPROFILE%\\.tauri\\seen.key" --ci   (Windows)');
  console.error('  npx @tauri-apps/cli signer generate \\');
  console.error('    --write-keys "$HOME/.tauri/seen.key" --ci             (macOS / Linux)');
  process.exit(1);
}

const pubkey = readFileSync(pubPath, 'utf8').trim();
const conf = JSON.parse(readFileSync(confPath, 'utf8'));

if (!conf.plugins?.updater) {
  console.error('✗ tauri.conf.json is missing plugins.updater — re-apply the updater config first.');
  process.exit(1);
}

if (conf.plugins.updater.pubkey === pubkey) {
  console.log('✓ Public key already in sync — nothing to do.');
  process.exit(0);
}

conf.plugins.updater.pubkey = pubkey;
writeFileSync(confPath, JSON.stringify(conf, null, 2) + '\n');
console.log('✓ Wrote pubkey into src-tauri/tauri.conf.json');
console.log('  Commit the change to ship the trust anchor with the app.');
