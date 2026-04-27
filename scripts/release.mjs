#!/usr/bin/env node
// Cross-platform Tauri release builder. Works on Windows / macOS / Linux.
//
//   1. Verifies that the private signing key exists.
//   2. Verifies that the public key is wired into tauri.conf.json (so the
//      installed app trusts updates signed with this key).
//   3. Loads the private key into TAURI_SIGNING_PRIVATE_KEY env var.
//   4. Spawns `npm run tauri:build` with that env, inheriting stdio.
//
// After it finishes, find installers + latest.json + .sig files in
//   src-tauri/target/release/bundle/

import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { homedir, platform } from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

// Load .env from project root so signing-related vars (notably
// TAURI_SIGNING_PRIVATE_KEY_PASSWORD) don't have to be exported manually each
// time. Existing environment vars take precedence — .env only fills gaps.
const envPath = path.join(root, '.env');
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, 'utf8');
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
const keyPath =
  process.env.TAURI_SIGNING_KEY_FILE ||
  path.join(homedir(), '.tauri', 'seen.key');
const confPath = path.join(root, 'src-tauri', 'tauri.conf.json');

if (!existsSync(keyPath)) {
  console.error(`✗ Private key not found at:\n    ${keyPath}`);
  console.error('\nGenerate one first:');
  console.error('  npx @tauri-apps/cli signer generate \\');
  console.error('    --write-keys "%USERPROFILE%\\.tauri\\seen.key" --ci   (Windows)');
  process.exit(1);
}

const conf = JSON.parse(readFileSync(confPath, 'utf8'));
const pubkey = conf?.plugins?.updater?.pubkey;
if (!pubkey || pubkey.startsWith('REPLACE_WITH')) {
  console.error('✗ tauri.conf.json plugins.updater.pubkey is not set.');
  console.error('  Run: npm run setup:updater');
  process.exit(1);
}

const privateKey = readFileSync(keyPath, 'utf8');
const isWin = platform() === 'win32';
const cmd = isWin ? 'npm.cmd' : 'npm';

console.log('→ Building release with updater signature...');
const child = spawn(cmd, ['run', 'tauri:build'], {
  cwd: root,
  env: {
    ...process.env,
    TAURI_SIGNING_PRIVATE_KEY: privateKey,
    // Если ключ был сгенерирован с паролем — выставите TAURI_SIGNING_PRIVATE_KEY_PASSWORD
    // в окружении до запуска этого скрипта. Иначе оставляем пустым.
    TAURI_SIGNING_PRIVATE_KEY_PASSWORD:
      process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD ?? '',
  },
  stdio: 'inherit',
  shell: isWin,
});

child.on('exit', (code) => process.exit(code ?? 0));
child.on('error', (err) => {
  console.error('✗ Failed to start tauri:build:', err.message);
  process.exit(1);
});
