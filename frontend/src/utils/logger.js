// Frontend logger. Single entry point for diagnostic output so prod builds
// can strip dev noise and future sinks (backend endpoint, Sentry) plug in here.
//
// - debug/info: silenced in prod
// - warn/error: always printed, visible in Tauri devtools / browser console
const isDev = import.meta.env.DEV;
export const logger = {
    debug: (...args) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.debug(...args);
        }
    },
    info: (...args) => {
        if (isDev) {
            // eslint-disable-next-line no-console
            console.info(...args);
        }
    },
    warn: (...args) => {
        // eslint-disable-next-line no-console
        console.warn(...args);
    },
    error: (...args) => {
        // eslint-disable-next-line no-console
        console.error(...args);
    },
};
