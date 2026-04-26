#!/usr/bin/env node
// Single source of truth for app version: root package.json.
// Propagates that version into frontend/package.json, src-tauri/tauri.conf.json
// and src-tauri/Cargo.toml.
//
// Usage:
//   node scripts/sync-version.mjs       — sync silently
//   npm run sync:version                — same, via npm script
//
// Hooked into the `npm version` lifecycle (root package.json `scripts.version`)
// so `npm version patch|minor|major` automatically rewrites the satellites
// before the autocommit, keeping the four files in lock-step.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const rootPkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf-8'));
const version = rootPkg.version;

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`✗ Invalid version in root package.json: ${version}`);
  process.exit(1);
}

console.log(`Syncing version ${version} across satellites…`);
let touched = 0;

// frontend/package.json
{
  const path = resolve(root, 'frontend/package.json');
  const pkg = JSON.parse(readFileSync(path, 'utf-8'));
  if (pkg.version !== version) {
    pkg.version = version;
    writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
    console.log('  ✓ frontend/package.json');
    touched++;
  }
}

// src-tauri/tauri.conf.json
{
  const path = resolve(root, 'src-tauri/tauri.conf.json');
  const conf = JSON.parse(readFileSync(path, 'utf-8'));
  if (conf.version !== version) {
    conf.version = version;
    writeFileSync(path, JSON.stringify(conf, null, 2) + '\n');
    console.log('  ✓ src-tauri/tauri.conf.json');
    touched++;
  }
}

// src-tauri/Cargo.toml — rewrite ONLY the [package] version line.
{
  const path = resolve(root, 'src-tauri/Cargo.toml');
  const original = readFileSync(path, 'utf-8');
  // Match the first `version = "x.y.z"` after the [package] section header.
  const updated = original.replace(
    /(\[package\][\s\S]*?\nversion\s*=\s*")([^"]+)(")/,
    (_, pre, _curr, post) => `${pre}${version}${post}`,
  );
  if (updated !== original) {
    writeFileSync(path, updated);
    console.log('  ✓ src-tauri/Cargo.toml');
    touched++;
  }
}

console.log(touched === 0 ? '  (already in sync)' : `Done — ${touched} file(s) updated.`);
