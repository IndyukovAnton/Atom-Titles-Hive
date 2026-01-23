
/**
 * Utility functions for localizing application content.
 */

// Category mappings (Database Value -> Display Value)
const CATEGORY_MAP: Record<string, string> = {
  'Movie': 'Фильм',
  'Series': 'Сериал',
  'Book': 'Книга',
  'Game': 'Игра',
  'Anime': 'Аниме',
  'Manga': 'Манга',
  'Cartoon': 'Мультфильм',
  'Comic': 'Комикс',
};

// Genre mappings (Database Value -> Display Value)
const GENRE_MAP: Record<string, string> = {
  'Action': 'Экшен',
  'Adventure': 'Приключения',
  'Comedy': 'Комедия',
  'Drama': 'Драма',
  'Fantasy': 'Фэнтези',
  'Horror': 'Ужасы',
  'Mystery': 'Мистика',
  'Romance': 'Романтика',
  'Sci-Fi': 'Фантастика',
  'Slice of Life': 'Повседневность',
  'Sports': 'Спорт',
  'Thriller': 'Триллер',
  'War': 'Военный',
  'Western': 'Вестерн',
  'Detective': 'Детектив',
  'Historical': 'Исторический',
  'Music': 'Музыка',
  'Psychological': 'Психология',
  'Family': 'Семейный',
  'Biography': 'Биография',
  'Documentary': 'Документальный',
  'Mecha': 'Меха',
  'Shounen': 'Сёнен',
  'Shojo': 'Сёдзё',
  'Seinen': 'Сэйнэн',
  'Josei': 'Дзёсэй',
  'Isekai': 'Исекай',
  'Cyberpunk': 'Киберпанк',
  'Post-Apocalyptic': 'Постапокалиптика',
  'Space Opera': 'Космоопера',
  'Steampunk': 'Стимпанк',
  'Supernatural': 'Сверхъестественное',
  'Crime': 'Криминал',
  'Magical Girls': 'Махо-сёдзё',
  'School': 'Школа'
};

// Tag/Status mappings (Database Value -> Display Value)
// The user specifically mentioned: #OnHold, #Dropped, #Rewatch
const TAG_MAP: Record<string, string> = {
  'OnHold': 'Отложено',
  'Dropped': 'Брошено',
  'Rewatch': 'Пересматриваю',
  'Completed': 'Завершено',
  'Watching': 'Смотрю',
  'Reading': 'Читаю',
  'Playing': 'Играю',
  'Plan to Watch': 'В планах',
  'Planned': 'В планах',
  'Favorite': 'Избранное',
  'Favorites': 'Избранное',
  'Ongoing': 'Онгоинг',
  'Paused': 'Пауза',
  'Stopped': 'Остановлено',
  'Finished': 'Закончено'
};

/**
 * Localizes a category string.
 * @param category The category string to localize (e.g., "Movie").
 * @returns The localized string (e.g., "Фильм") or the original if no mapping exists.
 */
export const localizeCategory = (category: string | null | undefined): string | null => {
  if (!category) return null;
  return CATEGORY_MAP[category] || category;
};

/**
 * Localizes a genre string.
 * @param genre The genre string to localize (e.g., "Action").
 * @returns The localized string (e.g., "Экшен") or the original if no mapping exists.
 */
export const localizeGenre = (genre: string | null | undefined): string => {
  if (!genre) return '';
  return GENRE_MAP[genre] || genre;
};

/**
 * Localizes a tag string.
 * @param tag The tag string to localize (e.g., "OnHold").
 * @returns The localized string (e.g., "Отложено") or the original if no mapping exists.
 */
export const localizeTag = (tag: string | null | undefined): string => {
  if (!tag) return '';
  // Check if tag starts with # and remove it for lookup, then add it back effectively?
  // Actually the UI usually adds the # or renders it separately. 
  // Let's assume input is just the text "OnHold". 
  // If the input is "#OnHold", handle that too.
  
  let cleanTag = tag;
  let hasHash = false;
  
  if (tag.startsWith('#')) {
    cleanTag = tag.substring(1);
    hasHash = true;
  }
  
  const localized = TAG_MAP[cleanTag] || TAG_MAP[tag]; // Try both
  
  if (localized) {
    return hasHash ? `#${localized}` : localized;
  }
  
  return tag;
};
