const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Скрипт для сборки backend в standalone executable для Tauri sidecar.
 * 
 * 1. Компилирует TypeScript в JavaScript (dist/)
 * 2. Упаковывает через pkg в standalone binary
 * 3. Переименовывает с target-triple суффиксом для Tauri
 * 4. Копирует в src-tauri/binaries/
 */

const SIDECAR_NAME = 'backend';
const TARGET_DIR = path.resolve(__dirname, '../../src-tauri/binaries');

// Определяем расширение и target triple
const isWindows = process.platform === 'win32';
const ext = isWindows ? '.exe' : '';

function getTargetTriple() {
  try {
    return execSync('rustc --print host-tuple', { encoding: 'utf-8' }).trim();
  } catch (error) {
    // Fallback для Windows x64
    if (isWindows) {
      return 'x86_64-pc-windows-msvc';
    }
    throw new Error('Failed to determine target triple. Is Rust installed?');
  }
}

function main() {
  console.log('📦 Building backend sidecar...\n');

  // 1. Убедимся, что dist существует (уже собран)
  const distPath = path.resolve(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    console.log('⚙️  Building TypeScript...');
    execSync('npm run build', { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit' 
    });
  }

  // 2. Создаём директорию для бинарников
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`📁 Created ${TARGET_DIR}`);
  }

  // 3. Запускаем pkg
  const targetTriple = getTargetTriple();
  const outputName = `${SIDECAR_NAME}-${targetTriple}${ext}`;
  const outputPath = path.join(TARGET_DIR, outputName);

  console.log(`🎯 Target: ${targetTriple}`);
  console.log(`📄 Output: ${outputPath}\n`);

  // pkg использует package.json "bin" или "main" для entry point
  const pkgCommand = [
    'npx @yao-pkg/pkg',
    '.',
    '--target', 'node20-win-x64',
    '--output', outputPath,
    // '--compress', 'GZip'
  ].join(' ');

  console.log(`🔨 Running: ${pkgCommand}\n`);
  
  try {
    execSync(pkgCommand, { 
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit' 
    });
  } catch (error) {
    console.error('❌ pkg build failed');
    process.exit(1);
  }

  // 4. Проверяем результат
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Sidecar built successfully!`);
    console.log(`📦 Size: ${sizeMB} MB`);
    console.log(`📍 Location: ${outputPath}`);
  } else {
    console.error('❌ Output file not found');
    process.exit(1);
  }
}

main();
