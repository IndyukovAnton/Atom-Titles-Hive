import {
  spawn,
  SpawnOptions,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import { access, constants } from 'fs/promises';
import { join } from 'path';

/**
 * Resolves a binary name to an absolute, executable path on Windows by walking
 * %PATH% × %PATHEXT%. On non-Windows just returns the original name (Node's
 * spawn handles PATH resolution natively for ELF/Mach-O).
 *
 * Returns null when the binary cannot be found anywhere in PATH — caller
 * should treat this as "not installed".
 */
export async function resolveBinary(name: string): Promise<string | null> {
  if (process.platform !== 'win32') return name;

  // Already absolute or has a path separator? Trust the caller.
  if (/[\\/]/.test(name) || /\.[a-z0-9]+$/i.test(name)) {
    try {
      await access(name, constants.F_OK);
      return name;
    } catch {
      return null;
    }
  }

  const pathEnv = process.env.PATH ?? process.env.Path ?? '';
  const exts = (process.env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map((e) => e.trim())
    .filter(Boolean);
  const dirs = pathEnv.split(';').filter(Boolean);

  for (const dir of dirs) {
    for (const ext of exts) {
      const candidate = join(dir, name + ext);
      try {
        await access(candidate, constants.F_OK);
        return candidate;
      } catch {
        // continue
      }
    }
    // also try bare name (npm sometimes puts a shim with no ext)
    const bare = join(dir, name);
    try {
      await access(bare, constants.F_OK);
      return bare;
    } catch {
      // continue
    }
  }

  return null;
}

/**
 * Spawn that handles Windows .cmd/.bat shims correctly. On Windows, .cmd files
 * MUST be invoked through cmd.exe (Node's spawn with shell:false fails). We
 * resolve the binary first to an absolute path, then use shell:true on Windows
 * if the resolved file is .cmd/.bat.
 *
 * Throws synchronously if `binaryName` cannot be resolved.
 */
export async function safeSpawn(
  binaryName: string,
  args: string[],
  options: SpawnOptions = {},
): Promise<ChildProcessWithoutNullStreams> {
  const resolved = await resolveBinary(binaryName);
  if (!resolved) {
    const err = new Error(
      `Binary "${binaryName}" not found in PATH`,
    ) as NodeJS.ErrnoException;
    err.code = 'ENOENT';
    throw err;
  }

  const isWin = process.platform === 'win32';
  const isShellShim = isWin && /\.(cmd|bat)$/i.test(resolved);

  // For .cmd/.bat we must go through cmd.exe. We pass the command as a
  // single string with manual quoting to avoid Node's surprising splitting
  // rules. For ordinary .exe we spawn directly with no shell.
  if (isShellShim) {
    const quoted = [resolved, ...args].map(quoteForCmd).join(' ');
    return spawn('cmd.exe', ['/d', '/s', '/c', quoted], {
      ...options,
      shell: false,
      windowsVerbatimArguments: true,
    }) as ChildProcessWithoutNullStreams;
  }

  return spawn(resolved, args, {
    ...options,
    shell: false,
  }) as ChildProcessWithoutNullStreams;
}

/**
 * Quote a single argument for cmd.exe with windowsVerbatimArguments=true.
 * Escapes embedded quotes and wraps the result in double quotes.
 *
 * cmd.exe special characters: ^ & | < > ( ) " %
 * We use ^^ to escape ^, and double-quote everything else.
 */
function quoteForCmd(arg: string): string {
  // If empty, emit "" so cmd doesn't drop it.
  if (arg.length === 0) return '""';
  // Replace embedded `"` with `\"` (verbatim quoting), then escape cmd
  // metacharacters with caret. Note: % expansion still happens inside cmd
  // strings; for our use case args are constant — user-controlled prompt
  // is passed via stdin, not argv.
  const escaped = arg.replace(/"/g, '\\"').replace(/([&|<>()^])/g, '^$1');
  return `"${escaped}"`;
}
