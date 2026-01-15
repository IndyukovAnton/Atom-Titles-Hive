import apiClient from './client';

export interface MediaFile {
  id: number;
  url: string;
  type: 'image' | 'video';
  mediaId: number;
  createdAt: string;
}

export interface MediaEntry {
  id: number;
  title: string;
  image?: string | null;
  description?: string | null;
  rating: number;
  startDate?: string | null;
  endDate?: string | null;
  genres?: string[];
  category?: string | null;
  tags?: string[];
  files?: MediaFile[];
  groupId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaData {
  title: string;
  image?: string;
  description?: string;
  rating: number;
  startDate?: string;
  endDate?: string;
  genres?: string[];
  category?: string;
  tags?: string[];
  groupId?: number | null;
}

export const mediaApi = {
  getAll: async (filters?: {
    groupId?: number | null;
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<MediaEntry[]> => {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.groupId !== undefined) {
        params.append('groupId', filters.groupId === null ? 'null' : String(filters.groupId));
      }
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);
      if (filters.limit) params.append('limit', String(filters.limit));
      if (filters.offset) params.append('offset', String(filters.offset));
    }
    const response = await apiClient.get(`/media?${params.toString()}`);
    return response.data;
  },

  getOne: async (id: number): Promise<MediaEntry> => {
    const response = await apiClient.get(`/media/${id}`);
    return response.data;
  },

  create: async (data: CreateMediaData): Promise<MediaEntry> => {
    const response = await apiClient.post('/media', data);
    return response.data;
  },

  update: async (id: number, data: Partial<CreateMediaData>): Promise<MediaEntry> => {
    const response = await apiClient.patch(`/media/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/media/${id}`);
  },

  search: async (query: string): Promise<MediaEntry[]> => {
    const response = await apiClient.get(`/media/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getCategories: async (): Promise<string[]> => {
    const response = await apiClient.get('/media/categories');
    return response.data;
  },

  addFile: async (id: number, data: { url: string; type: 'image' | 'video' }): Promise<any> => {
    const response = await apiClient.post(`/media/${id}/files`, data);
    return response.data;
  },

  removeFile: async (fileId: number): Promise<void> => {
    await apiClient.delete(`/media/files/${fileId}`);
  },
};
