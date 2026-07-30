// Уровни и XP. Источник истины для вычислений —
// backend/src/utils/achievements.ts. При изменении механики править оба места.

/** XP за каждую запись в медиатеке. */
export const XP_PER_ENTRY = 10;

/** Базовый множитель: XP для уровня N = (N − 1)² × LEVEL_BASE. */
export const LEVEL_BASE = 50;

/** Сколько уровней показывать в справочной таблице. */
export const LEVEL_TABLE_SIZE = 10;

export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) * (level - 1)) * LEVEL_BASE;
}

export interface LevelRow {
  level: number;
  xp: number;
  delta: number;
}

/** Первые N уровней с порогом XP и приростом до следующего. */
export const LEVEL_TABLE: LevelRow[] = Array.from(
  { length: LEVEL_TABLE_SIZE },
  (_, i) => {
    const level = i + 1;
    const xp = xpForLevel(level);
    const xpForNext = xpForLevel(level + 1);
    return { level, xp, delta: xpForNext - xp };
  },
);

export interface XpRule {
  /** Выделенная часть (например «+10 XP»). Пусто — без выделения. */
  highlight?: string;
  /** Остальной текст правила. */
  text: string;
}

/** Правила начисления XP — тексты для инфо-страницы. */
export const XP_RULES: XpRule[] = [
  {
    highlight: `+${XP_PER_ENTRY} XP`,
    text: 'за каждую запись, добавленную в медиатеку.',
  },
  {
    highlight: '+10…+250 XP',
    text: 'за каждое разблокированное достижение — чем сложнее, тем больше.',
  },
  {
    text: 'Если запись удаляется, накопленный опыт за неё уходит — статистика всегда отражает текущее состояние коллекции.',
  },
];
