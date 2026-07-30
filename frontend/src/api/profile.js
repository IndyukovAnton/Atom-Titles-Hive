import apiClient from './client';
export const profileApi = {
    getStats: async () => {
        const response = await apiClient.get('/profile/stats');
        return response.data;
    },
};
