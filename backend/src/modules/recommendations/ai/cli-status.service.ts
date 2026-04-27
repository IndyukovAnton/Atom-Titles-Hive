import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { resolveBinary, safeSpawn } from './spawn-helpers';

export interface CliStatus {
  installed: boolean;
  version?: string;
  authed: boolean;
  path?: string;
  resolvedPath?: string;
  error?: string;
}

interface ProbeResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

const PROBE_TIMEOUT_MS = 8_000;

const runProbe = async (cmd: string, args: string[]): Promise<ProbeResult> => {
  let child;
  try {
    child = await safeSpawn(cmd, args, {
      env: { ...process.env },
      windowsHide: true,
    });
  } catch {
    return { stdout: '', stderr: '', exitCode: -1 };
  }

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk: Buffer) => {
    stdout += chunk.toString('utf8');
  });
  child.stderr?.on('data', (chunk: Buffer) => {
    stderr += chunk.toString('utf8');
  });

  const timer = setTimeout(() => {
    try {
      if (!child.killed) child.kill('SIGTERM');
    } catch {
      // ignore
    }
  }, PROBE_TIMEOUT_MS);

  const exitCode: number | null = await new Promise((resolve) => {
    child.on('close', (code) => resolve(code));
    child.on('error', () => resolve(-1));
  });
  clearTimeout(timer);

  return { stdout, stderr, exitCode };
};

@Injectable()
export class CliStatusService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async check(userId: number): Promise<CliStatus> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    const cliBin = user?.preferences?.claudeCliPath?.trim() || 'claude';

    const resolvedPath = await resolveBinary(cliBin);
    if (!resolvedPath) {
      return {
        installed: false,
        authed: false,
        path: cliBin,
        error: `Claude CLI не найден в PATH (искал "${cliBin}"). Установите его или укажите полный путь в Настройках.`,
      };
    }

    const versionRun = await runProbe(cliBin, ['--version']);

    if (versionRun.exitCode !== 0) {
      return {
        installed: false,
        authed: false,
        path: cliBin,
        resolvedPath,
        error:
          versionRun.stderr.trim().slice(0, 400) ||
          `claude --version вернул exit code ${versionRun.exitCode ?? '???'}`,
      };
    }

    const versionMatch = /\d+\.\d+\.\d+(?:[-+][\w.]+)?/.exec(versionRun.stdout);
    const version = versionMatch?.[0];

    const authRun = await runProbe(cliBin, [
      '-p',
      'ping',
      '--output-format',
      'json',
      '--max-turns',
      '1',
      '--disallowedTools',
      'WebSearch',
    ]);

    const lower = (authRun.stderr + '\n' + authRun.stdout).toLowerCase();
    const looksUnauthed =
      authRun.exitCode !== 0 &&
      (lower.includes('not authenticated') ||
        lower.includes('please run') ||
        lower.includes('login') ||
        lower.includes('unauthor') ||
        lower.includes('no api key'));

    return {
      installed: true,
      version,
      authed: !looksUnauthed,
      path: cliBin,
      resolvedPath,
      error: looksUnauthed
        ? 'Claude CLI установлен, но не авторизован. Запустите `claude` в терминале.'
        : undefined,
    };
  }
}
