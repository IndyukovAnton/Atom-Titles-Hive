import apiClient from './client';
export const mediaApi = {
    getAll: async (filters) => {
        const params = new URLSearchParams();
        if (filters) {
            if (filters.groupId !== undefined) {
                params.append('groupId', filters.groupId === null ? 'null' : String(filters.groupId));
            }
            if (filters.category)
                params.append('category', filters.category);
            if (filters.search)
                params.append('search', filters.search);
            if (filters.limit)
                params.append('limit', String(filters.limit));
            if (filters.offset)
                params.append('offset', String(filters.offset));
        }
        const response = await apiClient.get(`/media?${params.toString()}`);
        return response.data;
    },
    getOne: async (id) => {
        const response = await apiClient.get(`/media/${id}`);
        return response.data;
    },
    create: async (data) => {
        const response = await apiClient.post('/media', data);
        return response.data;
    },
    update: async (id, data) => {
        const response = await apiClient.patch(`/media/${id}`, data);
        return response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/media/${id}`);
    },
    search: async (query) => {
        const response = await apiClient.get(`/media/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },
    getCategories: async () => {
        const response = await apiClient.get('/media/categories');
        return response.data;
    },
    addFile: async (id, data) => {
        const response = await apiClient.post(`/media/${id}/files`, data);
        return response.data;
    },
    removeFile: async (fileId) => {
        await apiClient.delete(`/media/files/${fileId}`);
    },
    reset: async () => {
        await apiClient.delete('/media/reset');
    },
};
