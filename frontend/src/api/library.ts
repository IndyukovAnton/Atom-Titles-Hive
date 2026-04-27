import axios from './client';
import type { AICard } from './recommendations';
import type { MediaEntry } from './media';

export type SavedRecStatus = 'considering' | 'favorited';

export type SavedRecContentType =
  | 'movie'
  | 'series'
  | 'anime'
  | 'book'
  | 'game'
  | 'other';

export interface SavedRecommendation {
  id: number;
  userId: number;
  title: string;
  originalTitle?: string | null;
  type: SavedRecContentType;
  year?: number | null;
  genres?: string[] | null;
  whyRecommended: string;
  estimatedRating?: number | null;
  releasedRecently?: boolean | null;
  posterUrl?: string | null;
  sourceModel?: string | null;
  status: SavedRecStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SaveRecommendationPayload {
  title: string;
  originalTitle?: string;
  type: SavedRecContentType;
  year?: number;
  genres?: string[];
  whyRecommended: string;
  estimatedRating?: number;
  releasedRecently?: boolean;
  posterUrl?: string;
  sourceModel?: string;
  status?: SavedRecStatus;
}

export const aiCardToSavePayload = (
  card: AICard,
  status: SavedRecStatus,
  sourceModel?: string,
): SaveRecommendationPayload => ({
  title: card.title,
  originalTitle: card.originalTitle,
  type: card.type,
  year: card.year,
  genres: card.genres,
  whyRecommended: card.whyRecommended,
  estimatedRating: card.estimatedRating,
  releasedRecently: card.releasedRecently,
  posterUrl: card.posterUrl,
  sourceModel,
  status,
});

export const libraryApi = {
  // SavedRecommendations
  listConsiderations: async (): Promise<SavedRecommendation[]> => {
    const res = await axios.get<SavedRecommendation[]>(
      '/library/considerations',
    );
    return res.data;
  },

  listSavedRecommendations: async (
    status?: SavedRecStatus,
  ): Promise<SavedRecommendation[]> => {
    const res = await axios.get<SavedRecommendation[]>(
      '/library/saved-recommendations',
      { params: status ? { status } : {} },
    );
    return res.data;
  },

  saveRecommendation: async (
    payload: SaveRecommendationPayload,
  ): Promise<SavedRecommendation> => {
    const res = await axios.post<SavedRecommendation>(
      '/library/saved-recommendations',
      payload,
    );
    return res.data;
  },

  updateSavedRecommendationStatus: async (
    id: number,
    status: SavedRecStatus,
  ): Promise<SavedRecommendation> => {
    const res = await axios.patch<SavedRecommendation>(
      `/library/saved-recommendations/${id}/status`,
      { status },
    );
    return res.data;
  },

  removeSavedRecommendation: async (id: number): Promise<void> => {
    await axios.delete(`/library/saved-recommendations/${id}`);
  },

  // Media favorites
  listFavoriteMedia: async (): Promise<MediaEntry[]> => {
    const res = await axios.get<MediaEntry[]>('/library/favorites');
    return res.data;
  },

  listFavoriteMediaIds: async (): Promise<number[]> => {
    const res = await axios.get<number[]>('/library/favorites/ids');
    return res.data;
  },

  addMediaFavorite: async (mediaId: number): Promise<void> => {
    await axios.put(`/library/favorites/media/${mediaId}`);
  },

  removeMediaFavorite: async (mediaId: number): Promise<void> => {
    await axios.delete(`/library/favorites/media/${mediaId}`);
  },
};
