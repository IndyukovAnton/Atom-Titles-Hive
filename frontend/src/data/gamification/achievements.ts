// Группы достижений для инфо-страницы. Полный каталог с предикатами —
// backend/src/utils/achievements.ts. При изменении механики править оба места.

export type AchievementGroupId =
  | 'collection'
  | 'rating'
  | 'diversity'
  | 'category'
  | 'genre';

export interface AchievementGroupInfo {
  id: AchievementGroupId;
  title: string;
  description: string;
}

/** 5 групп достижений — краткие описания для LevelsInfoPage. */
export const ACHIEVEMENT_GROUPS: AchievementGroupInfo[] = [
  {
    id: 'collection',
    title: 'Коллекция',
    description: 'за число записей: 1, 10, 50, 100, 250.',
  },
  {
    id: 'rating',
    title: 'Оценки',
    description: 'за количество и качество поставленных оценок.',
  },
  {
    id: 'diversity',
    title: 'Разнообразие',
    description: 'за записи в разных категориях.',
  },
  {
    id: 'category',
    title: 'Категории',
    description:
      'отдельный значок для каждой популярной категории (25 записей).',
  },
  {
    id: 'genre',
    title: 'Жанры',
    description:
      'за 15 записей в любимом жанре (Фэнтези, Ужасы, Детектив, Романтика).',
  },
];

/** Сколько достижений всего (для подзаголовка карточки). */
export const ACHIEVEMENT_TOTAL_COUNT = 20;
