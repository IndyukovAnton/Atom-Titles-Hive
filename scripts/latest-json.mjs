// Generates bundle/latest.json for the Tauri updater after a release build.
// Extracted from release.mjs so it can be unit-tested without spawning a build.
//
//   - version     ← root package.json
//   - signature   ← nsis/<productName>_<version>_x64-setup.exe.sig
//   - url         ← derived from plugins.updater.endpoints in tauri.conf.json
//   - notes       ← title of frontend/src/data/changelog/<version>.md

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

export function writeLatestJson(root) {
  const { version } = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf8'),
  );
  const conf = JSON.parse(
    readFileSync(path.join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'),
  );
  const product = conf.productName ?? 'Seen';

  const bundleDir = path.join(root, 'src-tauri', 'target', 'release', 'bundle');
  const exeName = `${product}_${version}_x64-setup.exe`;
  const sigPath = path.join(bundleDir, 'nsis', `${exeName}.sig`);
  if (!existsSync(sigPath)) {
    throw new Error(`Updater signature not found: ${sigPath}`);
  }

  const endpoint = conf.plugins?.updater?.endpoints?.[0] ?? '';
  const baseMatch = endpoint.match(/^(.*)\/latest\/download\/latest\.json$/);
  if (!baseMatch) {
    throw new Error(
      `Cannot derive release URL from updater endpoint: ${endpoint}`,
    );
  }
  const url = `${baseMatch[1]}/download/v${version}/${exeName}`;

  let notes = 'Подробности — раздел «Что нового» внутри приложения.';
  const changelogPath = path.join(
    root,
    'frontend',
    'src',
    'data',
    'changelog',
    `${version}.md`,
  );
  if (existsSync(changelogPath)) {
    const fm = readFileSync(changelogPath, 'utf8').match(
      /^---\s*\n([\s\S]+?)\n---/,
    );
    const title = fm?.[1]
      .split('\n')
      .find((l) => l.startsWith('title:'))
      ?.slice('title:'.length)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (title) notes = `${title}. См. полный changelog в приложении.`;
  }

  const manifest = {
    version,
    notes,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature: readFileSync(sigPath, 'utf8').trim(),
        url,
      },
    },
  };
  const outPath = path.join(bundleDir, 'latest.json');
  writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
  return { manifest, outPath };
}
