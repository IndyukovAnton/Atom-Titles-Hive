export interface EnvConfig {
  apiUrl: string;
  apiTimeout: number;
  appName: string;
}

const getEnvVar = (key: string, required: boolean = true): string => {
  const value = import.meta.env[key];
  if (required && (value === undefined || value === '')) {
    throw new Error(`Environment variable ${key} is missing`);
  }
  return value as string;
};

export const config: EnvConfig = {
  apiUrl: getEnvVar('VITE_API_URL'),
  apiTimeout: Number(getEnvVar('VITE_API_TIMEOUT')),
  appName: getEnvVar('VITE_APP_NAME'),
};
