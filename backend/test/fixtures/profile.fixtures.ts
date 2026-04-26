import { UpdateProfileDto } from '../../src/dto/update-profile.dto';
import { ProfileStatsDto } from '../../src/dto/profile-stats.dto';

/**
 * Test fixtures для Profile DTOs
 */

export const mockUpdateProfileDto: UpdateProfileDto = {
  username: 'newusername',
  email: 'newemail@example.com',
};

export const mockProfileStatsDto: ProfileStatsDto = {
  totalEntries: 10,
  ratedEntries: 8,
  averageRating: 7.5,
  favoriteCategory: 'Movie',
  favoriteGenre: 'Драма',
  byCategory: { Movie: 6, Series: 4 },
  byGenre: { Драма: 5, Комедия: 3 },
  totalWatchTime: 120.5,
  currentMonthWatchTime: 10.5,
  totalXp: 100,
  level: 2,
  levelProgress: 50,
  levelTarget: 150,
  title: { label: 'Киноман', source: 'category', basis: 'Movie' },
  achievements: [],
};
