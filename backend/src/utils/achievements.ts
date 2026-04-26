// Каталог достижений. Полностью in-memory: ничего не пишем в БД, прогресс
// считается из MediaEntry на лету. Если в будущем потребуется фиксировать
// «дату разблокировки» — заменим на отдельную таблицу UserAchievement.
//
// Каждое достижение задаёт условие через предикат, работающий над агрегатом
// статистики пользователя (categories/genres/counts/avgRating). progress
// возвращается как `{ value, target }`, чтобы фронт сам нарисовал прогресс-бар.

export type AchievementGroup =
  | 'collection'
  | 'rating'
  | 'diversity'
  | 'category'
  | 'genre';

export interface AchievementCatalogEntry {
  code: string;
  title: string;
  description: string;
  icon: string; // имя lucide-иконки
  group: AchievementGroup;
  xp: number;
  // Условие: возвращает { value, target } — value/target определяют процент.
  evaluate: (input: AchievementInput) => { value: number; target: number };
}

export interface AchievementInput {
  totalEntries: number;
  ratedEntries: number;
  averageRating: number;
  byCategory: Record<string, number>;
  byGenre: Record<string, number>;
  uniqueCategories: number;
}

const counts = {
  category: (input: AchievementInput, key: string) =>
    input.byCategory[key] ?? 0,
  genre: (input: AchievementInput, key: string) => input.byGenre[key] ?? 0,
};

export const ACHIEVEMENT_CATALOG: AchievementCatalogEntry[] = [
  // — По общему количеству —
  {
    code: 'first_step',
    title: 'Первый шаг',
    description: 'Добавьте свою первую запись в медиатеку.',
    icon: 'Sparkles',
    group: 'collection',
    xp: 10,
    evaluate: (i) => ({ value: i.totalEntries, target: 1 }),
  },
  {
    code: 'ten_entries',
    title: 'Десятка',
    description: 'Соберите 10 записей в медиатеке.',
    icon: 'Library',
    group: 'collection',
    xp: 25,
    evaluate: (i) => ({ value: i.totalEntries, target: 10 }),
  },
  {
    code: 'fifty_entries',
    title: 'Полсотни',
    description: 'Соберите 50 записей.',
    icon: 'BookMarked',
    group: 'collection',
    xp: 75,
    evaluate: (i) => ({ value: i.totalEntries, target: 50 }),
  },
  {
    code: 'hundred_entries',
    title: 'Сотня',
    description: 'Соберите 100 записей.',
    icon: 'Trophy',
    group: 'collection',
    xp: 150,
    evaluate: (i) => ({ value: i.totalEntries, target: 100 }),
  },
  {
    code: 'mass_collector',
    title: 'Архивариус',
    description: 'Соберите 250 записей.',
    icon: 'Crown',
    group: 'collection',
    xp: 250,
    evaluate: (i) => ({ value: i.totalEntries, target: 250 }),
  },

  // — По оценкам —
  {
    code: 'critic_25',
    title: 'Критик',
    description: 'Оцените 25 записей.',
    icon: 'Star',
    group: 'rating',
    xp: 40,
    evaluate: (i) => ({ value: i.ratedEntries, target: 25 }),
  },
  {
    code: 'perfectionist',
    title: 'Перфекционист',
    description: 'Средний рейтинг ≥ 9.0 (минимум 10 записей).',
    icon: 'Award',
    group: 'rating',
    xp: 100,
    evaluate: (i) => {
      if (i.totalEntries < 10) return { value: 0, target: 90 };
      const score = Math.min(Math.round(i.averageRating * 10), 90);
      return { value: score, target: 90 };
    },
  },
  {
    code: 'connoisseur',
    title: 'Ценитель',
    description: 'Средний рейтинг ≥ 7.0 (минимум 25 записей).',
    icon: 'Gem',
    group: 'rating',
    xp: 60,
    evaluate: (i) => {
      if (i.totalEntries < 25) return { value: 0, target: 70 };
      const score = Math.min(Math.round(i.averageRating * 10), 70);
      return { value: score, target: 70 };
    },
  },

  // — По разнообразию —
  {
    code: 'diverse',
    title: 'Разносторонний',
    description: 'Записи в 3 разных категориях.',
    icon: 'Layers',
    group: 'diversity',
    xp: 30,
    evaluate: (i) => ({ value: i.uniqueCategories, target: 3 }),
  },
  {
    code: 'universal',
    title: 'Универсал',
    description: 'Записи во всех 6 категориях.',
    icon: 'Globe',
    group: 'diversity',
    xp: 100,
    evaluate: (i) => ({ value: i.uniqueCategories, target: 6 }),
  },

  // — По категории —
  {
    code: 'cinephile',
    title: 'Киноман',
    description: '25 фильмов в коллекции.',
    icon: 'Film',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Movie'), target: 25 }),
  },
  {
    code: 'binge_watcher',
    title: 'Сериаломан',
    description: '25 сериалов в коллекции.',
    icon: 'Tv',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Series'), target: 25 }),
  },
  {
    code: 'bookworm',
    title: 'Книголюб',
    description: '25 книг в коллекции.',
    icon: 'BookOpen',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Book'), target: 25 }),
  },
  {
    code: 'gamer',
    title: 'Геймер',
    description: '25 игр в коллекции.',
    icon: 'Gamepad2',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Game'), target: 25 }),
  },
  {
    code: 'otaku',
    title: 'Анимешник',
    description: '25 аниме в коллекции.',
    icon: 'PlaySquare',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Anime'), target: 25 }),
  },
  {
    code: 'mangaka',
    title: 'Мангака',
    description: '25 манги в коллекции.',
    icon: 'Notebook',
    group: 'category',
    xp: 50,
    evaluate: (i) => ({ value: counts.category(i, 'Manga'), target: 25 }),
  },

  // — По жанрам —
  {
    code: 'mage',
    title: 'Маг',
    description: '15 записей в жанре «Фэнтези».',
    icon: 'Wand2',
    group: 'genre',
    xp: 40,
    evaluate: (i) => ({ value: counts.genre(i, 'Фэнтези'), target: 15 }),
  },
  {
    code: 'romantic',
    title: 'Романтик',
    description: '15 записей в жанре «Романтика».',
    icon: 'Heart',
    group: 'genre',
    xp: 40,
    evaluate: (i) => ({ value: counts.genre(i, 'Романтика'), target: 15 }),
  },
  {
    code: 'sleuth',
    title: 'Детектив',
    description: '15 записей в жанре «Детектив».',
    icon: 'Search',
    group: 'genre',
    xp: 40,
    evaluate: (i) => ({ value: counts.genre(i, 'Детектив'), target: 15 }),
  },
  {
    code: 'fearless',
    title: 'Бесстрашный',
    description: '15 записей в жанре «Ужасы».',
    icon: 'Ghost',
    group: 'genre',
    xp: 40,
    evaluate: (i) => ({ value: counts.genre(i, 'Ужасы'), target: 15 }),
  },
];

// — Уровни —
// Сумма XP для достижения уровня N = (N-1)^2 * 50.
//   уровень 1 = 0 XP (начало)
//   уровень 2 = 50, 3 = 200, 4 = 450, 5 = 800, 6 = 1250, …
export const LEVEL_BASE = 50;

export function xpForLevel(level: number): number {
  return Math.max(0, (level - 1) * (level - 1)) * LEVEL_BASE;
}

export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  return Math.floor(Math.sqrt(xp / LEVEL_BASE)) + 1;
}

// — Звания —
// Главное звание — по самой популярной категории. Дополнительное — по жанру.
const CATEGORY_TITLES: Record<string, string> = {
  Movie: 'Киноман',
  Series: 'Сериаломан',
  Book: 'Книголюб',
  Game: 'Геймер',
  Anime: 'Анимешник',
  Manga: 'Мангака',
};

const GENRE_TITLES: Record<string, string> = {
  Фэнтези: 'Маг',
  Ужасы: 'Бесстрашный',
  Мистика: 'Мистик',
  Романтика: 'Романтик',
  Детектив: 'Сыщик',
  Фантастика: 'Космонавт',
  Драма: 'Драматург',
  Комедия: 'Шут',
  Экшен: 'Боец',
  Приключения: 'Искатель приключений',
  Триллер: 'Хладнокровный',
  Спорт: 'Чемпион',
  Психология: 'Эмпат',
  Музыка: 'Меломан',
  Биография: 'Хронист',
  Военный: 'Стратег',
  Исторический: 'Историк',
  Семейный: 'Семьянин',
};

export interface ResolvedTitle {
  code: string; // уникальный id звания (используется в preferences.selectedTitle)
  label: string;
  source: 'category' | 'genre';
  basis: string; // что именно привело к званию
}

const TITLE_CATEGORY_THRESHOLD = 10;
const TITLE_GENRE_THRESHOLD = 15;
const TITLE_MIN_ENTRIES = 5;

const titleCode = (source: 'category' | 'genre', basis: string) =>
  `${source}_${basis.toLowerCase()}`;

/** Список званий, которые пользователь уже «заработал» — может выбрать любое. */
export function listEarnedTitles(
  byCategory: Record<string, number>,
  byGenre: Record<string, number>,
): ResolvedTitle[] {
  const earned: ResolvedTitle[] = [];
  for (const [cat, count] of Object.entries(byCategory)) {
    if (count >= TITLE_CATEGORY_THRESHOLD && CATEGORY_TITLES[cat]) {
      earned.push({
        code: titleCode('category', cat),
        label: CATEGORY_TITLES[cat],
        source: 'category',
        basis: cat,
      });
    }
  }
  for (const [genre, count] of Object.entries(byGenre)) {
    if (count >= TITLE_GENRE_THRESHOLD && GENRE_TITLES[genre]) {
      earned.push({
        code: titleCode('genre', genre),
        label: GENRE_TITLES[genre],
        source: 'genre',
        basis: genre,
      });
    }
  }
  // Сортируем по базе: категории сначала, потом жанры; внутри — по алфавиту basis.
  earned.sort((a, b) => {
    if (a.source !== b.source) return a.source === 'category' ? -1 : 1;
    return a.basis.localeCompare(b.basis);
  });
  return earned;
}

/** Авто-звание: топ-категория, иначе топ-жанр, иначе null. */
export function autoTitle(
  topCategory: string | null,
  topGenre: string | null,
  totalEntries: number,
): ResolvedTitle | null {
  if (totalEntries < TITLE_MIN_ENTRIES) return null;
  if (topCategory && CATEGORY_TITLES[topCategory]) {
    return {
      code: titleCode('category', topCategory),
      label: CATEGORY_TITLES[topCategory],
      source: 'category',
      basis: topCategory,
    };
  }
  if (topGenre && GENRE_TITLES[topGenre]) {
    return {
      code: titleCode('genre', topGenre),
      label: GENRE_TITLES[topGenre],
      source: 'genre',
      basis: topGenre,
    };
  }
  return null;
}

/** Применяемое звание: пин из preferences, если он ещё в earned; иначе auto. */
export function resolveTitle(
  earned: ResolvedTitle[],
  topCategory: string | null,
  topGenre: string | null,
  totalEntries: number,
  selectedCode?: string | null,
): ResolvedTitle | null {
  if (selectedCode) {
    const pinned = earned.find((t) => t.code === selectedCode);
    if (pinned) return pinned;
  }
  return autoTitle(topCategory, topGenre, totalEntries);
}

export const XP_PER_ENTRY = 10;
