/**
 * Лимиты rate limiting. В тестовом окружении лимиты снимаются,
 * чтобы e2e-наборы с одного loopback-адреса не упирались в 429.
 */
const isTestEnv = process.env.NODE_ENV === 'test';

export const THROTTLE_TTL_MS = 60_000;

/** Общий лимит запросов в минуту на IP. */
export const GLOBAL_THROTTLE_LIMIT = isTestEnv ? 100_000 : 300;

/** Auth-эндпоинты: защита от брутфорса логина/регистрации. */
export const AUTH_THROTTLE_LIMIT = isTestEnv ? 100_000 : 10;

/** AI-эндпоинты: дорогие внешние вызовы. */
export const AI_THROTTLE_LIMIT = isTestEnv ? 100_000 : 20;
