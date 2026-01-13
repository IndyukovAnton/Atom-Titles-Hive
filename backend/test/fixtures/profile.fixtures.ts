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
  favoriteCategory: 'Фильм',
  favoriteGenre: 'Драма',
  totalWatchTime: 120.5,
  currentMonthWatchTime: 10.5,
};
