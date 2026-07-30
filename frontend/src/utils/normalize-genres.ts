/**
 * Нормализация жанров из API в string[].
 * Контракт — массив строк, но бэкенд исторически мог вернуть JSON-строку
 * (поле genres в БД хранится текстом). Защита нужна, чтобы один битый
 * элемент не ронял рендер всей сетки рекомендаций.
 */
export function normalizeGenres(genres: unknown): string[] {
  if (Array.isArray(genres)) {
    return genres.filter((g): g is string => typeof g === 'string');
  }
  if (typeof genres !== 'string' || !genres) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(genres);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is string => typeof g === 'string');
  } catch {
    return genres
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
