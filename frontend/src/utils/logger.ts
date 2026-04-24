// Frontend logger. Single entry point for diagnostic output so prod builds
// can strip dev noise and future sinks (backend endpoint, Sentry) plug in here.
//
// - debug/info: silenced in prod
// - warn/error: always printed, visible in Tauri devtools / browser console

const isDev = import.meta.env.DEV;

type LogArgs = readonly unknown[];

export const logger = {
  debug: (...args: LogArgs): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
  info: (...args: LogArgs): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(...args);
    }
  },
  warn: (...args: LogArgs): void => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
  error: (...args: LogArgs): void => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};
