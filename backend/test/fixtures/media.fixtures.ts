import { MediaEntry } from '../../src/entities/media-entry.entity';
import { CreateMediaDto } from '../../src/dto/create-media.dto';
import { UpdateMediaDto } from '../../src/dto/update-media.dto';

/**
 * Test fixtures для MediaEntry entity
 */

export const createMockMediaEntry = (
  overrides?: Partial<MediaEntry>,
): MediaEntry => {
  const media = new MediaEntry();
  media.id = 1;
  media.title = 'Test Movie';
  media.image = 'https://example.com/image.jpg';
  media.description = 'Test description';
  media.rating = 8.5;
  media.category = 'Фильм';
  media.genres = JSON.stringify(['Драма', 'Триллер']);
  media.tags = JSON.stringify(['интересный', 'классика']);
  media.groupId = null;
  media.userId = 1;
  media.startDate = new Date('2024-01-01');
  media.endDate = new Date('2024-01-02');
  media.createdAt = new Date('2024-01-01T00:00:00.000Z');

  return Object.assign(media, overrides);
};

export const createMockMediaEntries = (
  count: number,
  userId: number = 1,
): MediaEntry[] => {
  return Array.from({ length: count }, (_, i) => {
    const media = new MediaEntry();
    media.id = i + 1;
    media.title = `Test Movie ${i + 1}`;
    media.image = `https://example.com/image${i + 1}.jpg`;
    media.description = `Test description ${i + 1}`;
    media.rating = 5 + i;
    media.category = i % 2 === 0 ? 'Фильм' : 'Сериал';
    media.genres = JSON.stringify(['Драма']);
    media.tags = JSON.stringify(['тест']);
    media.groupId = null;
    media.userId = userId;
    media.startDate = new Date(`2024-01-0${i + 1}`);
    media.endDate = new Date(`2024-01-0${i + 2}`);
    media.createdAt = new Date(`2024-01-0${i + 1}T00:00:00.000Z`);
    return media;
  });
};

export const mockCreateMediaDto: CreateMediaDto = {
  title: 'New Movie',
  image: 'https://example.com/new.jpg',
  description: 'New movie description',
  rating: 9.0,
  category: 'Фильм',
  genres: ['Драма', 'Комедия'],
  tags: ['новый', 'интересный'],
  groupId: null,
  startDate: '2024-01-01',
  endDate: '2024-01-05',
};

export const mockUpdateMediaDto: UpdateMediaDto = {
  title: 'Updated Movie',
  rating: 9.5,
  description: 'Updated description',
};

/**
 * Создание медиа записей с разными категориями для статистики
 */
export const createMediaEntriesForStats = (userId: number): MediaEntry[] => {
  return [
    createMockMediaEntry({
      id: 1,
      userId,
      category: 'Фильм',
      genres: JSON.stringify(['Драма', 'Триллер']),
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-02'),
    }),
    createMockMediaEntry({
      id: 2,
      userId,
      category: 'Фильм',
      genres: JSON.stringify(['Комедия']),
      startDate: new Date('2024-01-03'),
      endDate: new Date('2024-01-04'),
    }),
    createMockMediaEntry({
      id: 3,
      userId,
      category: 'Сериал',
      genres: JSON.stringify(['Драма', 'Боевик']),
      startDate: new Date('2024-01-05'),
      endDate: new Date('2024-01-10'),
    }),
    createMockMediaEntry({
      id: 4,
      userId,
      category: 'Фильм',
      genres: JSON.stringify(['Драма']),
      startDate: new Date('2024-01-11'),
      endDate: new Date('2024-01-12'),
    }),
  ];
};
