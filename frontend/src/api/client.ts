import axios from 'axios';
import { config } from '../config';

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL: config.apiUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor для добавления JWT токена
apiClient.interceptors.request.use(
  (config) => {
    // Получаем токен из zustand-persist хранилища
    const storage = localStorage.getItem('atom-titles-hive-auth-storage');
    if (storage) {
      try {
        const { state } = JSON.parse(storage);
        if (state?.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth storage', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('atom-titles-hive-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
