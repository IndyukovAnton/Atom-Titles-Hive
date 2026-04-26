import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';


export function getUserDataDir(): string {
  const appName = 'Seen';
  let userDataDir = '';

  const platform = os.platform();

  if (platform === 'win32') {
    userDataDir =
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    userDataDir = path.join(os.homedir(), 'Library', 'Application Support');
  } else {
    // Linux / Unix
    userDataDir =
      process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  }

  return path.join(userDataDir, appName);
}

export function getDatabasePath(env: string, configuredPath: string): string {
  // If in development mode, use the configured path (relative to project root)
  // Or if the configured path is explicitly absolute, trust the user.
  if (env === 'development' || path.isAbsolute(configuredPath)) {
    return configuredPath;
  }

  // In production (or other envs), we want to store data in the OS standard User Data directory.
  // This ensures persistence across updates and re-deployments.

  const appDataDir = getUserDataDir();

  // Ensure directory exists
  if (!fs.existsSync(appDataDir)) {
    try {
      fs.mkdirSync(appDataDir, { recursive: true });
    } catch (error) {
      console.error(
        `Failed to create app data directory at ${appDataDir}`,
        error,
      );
      // Fallback to local if we can't write to system dir
      return configuredPath;
    }
  }

  // extract filename from configured path (e.g. 'database/app.db' -> 'app.db')
  const dbFileName = path.basename(configuredPath);

  return path.join(appDataDir, dbFileName);
}
