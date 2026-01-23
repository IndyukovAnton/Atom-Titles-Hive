import axios from './client';

export interface RecommendationItem {
  title: string;
  image?: string;
  description?: string;
  rating?: number;
  genres?: string[];
  reason?: string;
  category?: string;
}

export const recommendationsApi = {
  getTopRated: async (limit: number = 10) => {
    const response = await axios.get<RecommendationItem[]>(`/recommendations/top-rated?limit=${limit}`);
    return response.data;
  },

  getByGenres: async () => {
    const response = await axios.get<RecommendationItem[]>('/recommendations/genres');
    return response.data;
  },

  getAiRecommendations: async (prompt: string, provider: string, apiKey?: string) => {
    const response = await axios.post<RecommendationItem[]>('/recommendations/ai', {
      prompt,
      provider,
      apiKey,
    });
    return response.data;
  },
};
