import apiClient from './client';
export const authApi = {
    login: async (data) => {
        const response = await apiClient.post('/auth/login', data);
        return response.data;
    },
    register: async (data) => {
        const response = await apiClient.post('/auth/register', data);
        return response.data;
    },
    getProfile: async () => {
        const response = await apiClient.get('/profile');
        return response.data;
    },
    updateProfile: async (data) => {
        const response = await apiClient.patch('/profile', data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await apiClient.post('/auth/change-password', data);
        return response.data;
    },
};
