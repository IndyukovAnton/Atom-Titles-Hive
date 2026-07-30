import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { safeSpawn } from './spawn-helpers';

jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

const mockSpawn = spawn as jest.MockedFunction<typeof spawn>;

function fakeChild() {
  const child = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    stdin: { write: jest.Mock; end: jest.Mock };
    killed: boolean;
    kill: jest.Mock;
  };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = { write: jest.fn(), end: jest.fn() };
  child.killed = false;
  child.kill = jest.fn();
  return child;
}

describe('safeSpawn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSpawn.mockReturnValue(fakeChild() as never);
  });

  it('wraps .cmd shim command in outer quotes so cmd.exe keeps inner quoting', async () => {
    if (process.platform !== 'win32') return;

    const dir = mkdtempSync(join(tmpdir(), 'ath-spawn-'));
    const shim = join(dir, 'codex.cmd');
    writeFileSync(shim, '@echo off\r\n');

    try {
      await safeSpawn(shim, ['--version']);

      expect(mockSpawn).toHaveBeenCalledTimes(1);
      const [cmd, args] = mockSpawn.mock.calls[0] as unknown as [
        string,
        string[],
      ];
      expect(cmd).toBe('cmd.exe');
      expect(args.slice(0, 3)).toEqual(['/d', '/s', '/c']);
      // cmd.exe strips the first/last quote of the line — the extra outer
      // pair must wrap the whole quoted command + args.
      expect(args[3]).toBe(`""${shim}" "--version""`);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('throws ENOENT-like error when binary cannot be resolved', async () => {
    await expect(
      safeSpawn('definitely-missing-binary-xyz', []),
    ).rejects.toMatchObject({ code: 'ENOENT' });
  });
});
