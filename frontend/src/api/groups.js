import apiClient from './client';
export const groupsApi = {
    getAll: async () => {
        const response = await apiClient.get('/groups');
        return response.data;
    },
    getStats: async () => {
        const response = await apiClient.get('/groups/stats');
        return response.data;
    },
    getOne: async (id) => {
        const response = await apiClient.get(`/groups/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await apiClient.post('/groups', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.patch(`/groups/${id}`, data);
        return response.data;
    },
    move: async (id, data) => {
        const response = await apiClient.patch(`/groups/${id}/move`, data);
        return response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/groups/${id}`);
    },
};
