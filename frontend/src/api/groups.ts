import apiClient from './client';

export interface Group {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
  count?: number; // From stats
}

export interface CreateGroupData {
  name: string;
}

export interface GroupStats {
  groups: {
    id: number;
    name: string;
    count: number;
  }[];
  ungrouped: number;
}

export const groupsApi = {
  getAll: async (): Promise<Group[]> => {
    const response = await apiClient.get('/groups');
    return response.data;
  },

  getStats: async (): Promise<GroupStats> => {
    const response = await apiClient.get('/groups/stats');
    return response.data;
  },

  getOne: async (id: number): Promise<Group> => {
    const response = await apiClient.get(`/groups/${id}`);
    return response.data;
  },

  create: async (data: CreateGroupData): Promise<Group> => {
    const response = await apiClient.post('/groups', data);
    return response.data;
  },

  update: async (id: number, data: CreateGroupData): Promise<Group> => {
    const response = await apiClient.patch(`/groups/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/groups/${id}`);
  },
};
