import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter } from 'events';
import { User } from '../../../entities/user.entity';
import { CliStatusService } from './cli-status.service';
import * as spawnHelpers from './spawn-helpers';

jest.mock('./spawn-helpers', () => ({
  resolveBinary: jest.fn(),
  safeSpawn: jest.fn(),
}));

const mockResolveBinary = spawnHelpers.resolveBinary as jest.MockedFunction<
  typeof spawnHelpers.resolveBinary
>;
const mockSafeSpawn = spawnHelpers.safeSpawn as jest.MockedFunction<
  typeof spawnHelpers.safeSpawn
>;

function fakeChild(opts: {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
}): EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: { write: jest.Mock; end: jest.Mock };
  killed: boolean;
  kill: jest.Mock;
} {
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
  child.kill = jest.fn(() => {
    child.killed = true;
    child.emit('close', opts.exitCode ?? 1, 'SIGTERM');
  });

  // Defer past current microtask so callers can attach listeners first.
  setTimeout(() => {
    if (opts.stdout) child.stdout.emit('data', Buffer.from(opts.stdout));
    if (opts.stderr) child.stderr.emit('data', Buffer.from(opts.stderr));
    if (!child.killed) child.emit('close', opts.exitCode ?? 0, null);
  }, 0);

  return child;
}

describe('CliStatusService', () => {
  let service: CliStatusService;

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CliStatusService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get(CliStatusService);
    jest.clearAllMocks();
  });

  describe('check (Claude)', () => {
    it('returns not installed when binary missing', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        preferences: { claudeCliPath: 'claude' },
      });
      mockResolveBinary.mockResolvedValue(null);

      const status = await service.check(1);
      expect(status.installed).toBe(false);
      expect(status.authed).toBe(false);
      expect(status.error).toMatch(/Claude CLI не найден/);
    });

    it('returns installed+authed when probes succeed', async () => {
      mockUserRepository.findOne.mockResolvedValue({ preferences: {} });
      mockResolveBinary.mockResolvedValue('/usr/bin/claude');
      mockSafeSpawn
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({ stdout: 'claude 1.2.3\n', exitCode: 0 }) as never,
          ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({ stdout: '{"ok":true}', exitCode: 0 }) as never,
          ),
        );

      const status = await service.check(7);
      expect(status.installed).toBe(true);
      expect(status.authed).toBe(true);
      expect(status.version).toBe('1.2.3');
    });
  });

  describe('checkCodex', () => {
    it('uses codexCliPath from preferences', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        preferences: { codexCliPath: 'C:\\tools\\codex.cmd' },
      });
      mockResolveBinary.mockResolvedValue(null);

      const status = await service.checkCodex(1);
      expect(mockResolveBinary).toHaveBeenCalledWith('C:\\tools\\codex.cmd');
      expect(status.error).toMatch(/Codex CLI не найден/);
    });

    it('treats non-zero login status as unauthed', async () => {
      mockUserRepository.findOne.mockResolvedValue({ preferences: {} });
      mockResolveBinary.mockResolvedValue('/usr/bin/codex');
      mockSafeSpawn
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({ stdout: 'codex-cli 0.50.0\n', exitCode: 0 }) as never,
          ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({ stderr: 'Not logged in', exitCode: 1 }) as never,
          ),
        );

      const status = await service.checkCodex(2);
      expect(status.installed).toBe(true);
      expect(status.authed).toBe(false);
      expect(status.version).toBe('0.50.0');
      expect(status.error).toMatch(/codex login/);
      expect(mockSafeSpawn.mock.calls[1][1]).toEqual(['login', 'status']);
    });

    it('returns ready when login status exits 0', async () => {
      mockUserRepository.findOne.mockResolvedValue({ preferences: {} });
      mockResolveBinary.mockResolvedValue('/usr/bin/codex');
      mockSafeSpawn
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({ stdout: '0.50.0', exitCode: 0 }) as never,
          ),
        )
        .mockImplementationOnce(() =>
          Promise.resolve(
            fakeChild({
              stdout: 'Logged in as user@x.com',
              exitCode: 0,
            }) as never,
          ),
        );

      const status = await service.checkCodex(3);
      expect(status).toMatchObject({
        installed: true,
        authed: true,
        version: '0.50.0',
      });
      expect(status.error).toBeUndefined();
    });
  });
});
