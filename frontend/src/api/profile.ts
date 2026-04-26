import apiClient from './client';

export type AchievementGroup =
  | 'collection'
  | 'rating'
  | 'diversity'
  | 'category'
  | 'genre';

export interface AchievementProgress {
  code: string;
  title: string;
  description: string;
  icon: string;
  group: AchievementGroup;
  xp: number;
  value: number;
  target: number;
  unlocked: boolean;
}

export interface ResolvedTitle {
  label: string;
  source: 'category' | 'genre';
  basis: string;
}

export interface ProfileStats {
  totalEntries: number;
  ratedEntries: number;
  averageRating: number;
  favoriteCategory: string | null;
  favoriteGenre: string | null;
  byCategory: Record<string, number>;
  byGenre: Record<string, number>;
  totalWatchTime: number;
  currentMonthWatchTime: number;
  totalXp: number;
  level: number;
  levelProgress: number;
  levelTarget: number;
  title: ResolvedTitle | null;
  achievements: AchievementProgress[];
}

export const profileApi = {
  getStats: async (): Promise<ProfileStats> => {
    const response = await apiClient.get<ProfileStats>('/profile/stats');
    return response.data;
  },
};
