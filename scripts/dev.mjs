#!/usr/bin/env node
/**
 * Оркестратор dev-запуска: backend → health-check → frontend.
 *
 * Зачем: `concurrently` стартовал оба процесса параллельно, и Vite открывался
 * раньше, чем Nest поднимал HTTP-слой — первые секунды приложение стреляло
 * запросами в мёртвый порт и показывало сетевые ошибки. Здесь frontend
 * запускается только после того, как backend ответил на GET /health.
 *
 * Переменные окружения:
 *   PORT — порт backend (по умолчанию 3553, совпадает с backend/.env)
 *   HOST — хост backend (по умолчанию 127.0.0.1)
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = fileURLToPath(new URL('..', import.meta.url));

const BACKEND_PORT = process.env.PORT || '3553';
const BACKEND_HOST = process.env.HOST || '127.0.0.1';
const HEALTH_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}/health`;
const HEALTH_TIMEOUT_MS = 120_000; // первая компиляция nest может быть долгой
const HEALTH_INTERVAL_MS = 500;

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const children = new Set();
let shuttingDown = false;

function log(tag, message) {
  process.stdout.write(`[${tag}] ${message}\n`);
}

/** Убивает процесс со всем деревом потомков (npm → nest/vite → node). */
function killTree(child) {
  if (!child || child.exitCode !== null) return;
  if (isWindows) {
    // /T — дерево, /F — принудительно. Ошибки игнорируем (процесс мог уже умереть).
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      // Процессы стартуют detached — минус убивает всю группу.
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      child.kill('SIGTERM');
    }
  }
}

function run(tag, script, cwd, extraEnv = {}) {
  const child = spawn(npmCmd, ['run', script], {
    cwd: path.join(rootDir, cwd),
    env: { ...process.env, ...extraEnv },
    shell: isWindows, // npm.cmd без shell на Windows не стартует
    detached: !isWindows, // своя группа процессов для killTree на POSIX
  });
  children.add(child);

  const prefix = (chunk) => {
    const text = chunk.toString();
    process.stdout.write(
      text
        .split(/\r?\n/)
        .map((line) => (line ? `[${tag}] ${line}` : line))
        .join('\n'),
    );
  };
  child.stdout.on('data', prefix);
  child.stderr.on('data', prefix);
  child.on('exit', () => children.delete(child));
  return child;
}

function waitForExit(child) {
  return new Promise((resolve) => child.on('exit', resolve));
}

async function waitForHealth({ url, timeoutMs, backendChild }) {
  const deadline = Date.now() + timeoutMs;
  let lastError = 'ещё ни одной попытки';

  while (Date.now() < deadline) {
    if (backendChild.exitCode !== null) {
      throw new Error(`backend завершился с кодом ${backendChild.exitCode} до готовности`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = `HTTP ${response.status}`;
    } catch {
      lastError = 'connection refused';
    }
    await new Promise((resolve) => setTimeout(resolve, HEALTH_INTERVAL_MS));
  }
  throw new Error(`backend не ответил на ${url} за ${timeoutMs / 1000}s (${lastError})`);
}

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) killTree(child);
  // Даём дочерним процессам секунду на завершение, затем выходим в любом случае.
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

// --- Основной сценарий ---

log('dev', `стартую backend (порт ${BACKEND_PORT})…`);
const backend = run('backend', 'start:dev', 'backend', { PORT: BACKEND_PORT });
waitForExit(backend).then((code) => {
  if (shuttingDown) return;
  log('dev', `backend завершился (код ${code}) — останавливаю frontend`);
  shutdown(typeof code === 'number' ? code : 1);
});

try {
  await waitForHealth({ url: HEALTH_URL, timeoutMs: HEALTH_TIMEOUT_MS, backendChild: backend });
} catch (error) {
  log('dev', `ошибка ожидания backend: ${error.message}`);
  shutdown(1);
  // shutdown выйдет сам через таймер; дальше не идём
  await new Promise(() => {});
}

log('dev', `backend готов (${HEALTH_URL}) — стартую frontend…`);
const frontend = run('frontend', 'dev', 'frontend');
waitForExit(frontend).then((code) => {
  if (shuttingDown) return;
  log('dev', `frontend завершился (код ${code}) — останавливаю backend`);
  shutdown(typeof code === 'number' ? code : 1);
});
