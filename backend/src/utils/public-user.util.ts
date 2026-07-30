import type { User, UserPreferences } from '../entities/user.entity';

/** Preferences, которые API возвращает клиенту: без секретных ключей,
    вместо них — булевы флаги наличия. */
export type PublicUserPreferences = Omit<
  UserPreferences,
  'aiKey' | 'anthropicApiKey' | 'tmdbApiKey'
> & {
  hasAiKey: boolean;
  hasAnthropicApiKey: boolean;
  hasTmdbApiKey: boolean;
};

/** Публичная форма профиля — единый контракт для /profile и auth-ответов
    (login/register/OAuth), чтобы клиент после входа получал те же поля,
    что и при последующем GET /profile. */
export interface PublicUser {
  id: number;
  username: string;
  email: string | null;
  birthDate?: Date | null;
  preferences: PublicUserPreferences | null;
  hasCompletedOnboarding: boolean;
}

/**
 * Убирает секретные ключи (aiKey/anthropicApiKey/tmdbApiKey) из preferences,
 * отдаваемых клиенту, заменяя их флагами наличия — ключ нельзя ни прочитать
 * через API, ни похитить через XSS, но UI может показать «ключ сохранён».
 */
export function toPublicPreferences(
  preferences?: UserPreferences | null,
): PublicUserPreferences | null {
  if (!preferences) return null;

  const {
    aiKey: _aiKey,
    anthropicApiKey: _anthropicApiKey,
    tmdbApiKey: _tmdbApiKey,
    ...rest
  } = preferences;

  return {
    ...rest,
    hasAiKey: Boolean(preferences.aiKey),
    hasAnthropicApiKey: Boolean(preferences.anthropicApiKey),
    hasTmdbApiKey: Boolean(preferences.tmdbApiKey),
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    birthDate: user.birthDate,
    preferences: toPublicPreferences(user.preferences),
    // ?? false: у свежесозданной entity до перечтения из БД default ещё не подставлен
    hasCompletedOnboarding: user.hasCompletedOnboarding ?? false,
  };
}
