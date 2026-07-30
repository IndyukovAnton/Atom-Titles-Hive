import apiClient from './client';

export interface Group {
  id: number;
  name: string;
  userId: number;
  parentId?: number | null;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
  count?: number; // From stats
}

export interface CreateGroupData {
  name: string;
  parentId?: number | null;
}

export interface MoveGroupData {
  parentId: number | null;
  beforeId?: number | null;
}

export interface GroupStatsItem {
  id: number;
  name: string;
  parentId?: number | null;
  sortOrder?: number;
  /** Записи напрямую в этой группе */
  count: number;
  /** Записи этой группы и всех дочерних */
  totalCount?: number;
}

export interface GroupStats {
  groups: GroupStatsItem[];
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

  move: async (id: number, data: MoveGroupData): Promise<Group> => {
    const response = await apiClient.patch(`/groups/${id}/move`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/groups/${id}`);
  },
};
