import axios from 'axios';
import { config } from '../config';
import { useAuthStore } from '../store/authStore';
import { logger } from '../utils/logger';

// Создаем экземпляр axios с базовыми настройками
// НЕ устанавливаем baseURL здесь — он будет установлен динамически в interceptor
const apiClient = axios.create({
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor для динамического получения baseURL
// Это важно для Tauri, где URL backend становится известен только после события backend-ready
apiClient.interceptors.request.use(
  (requestConfig) => {
    if (!requestConfig.baseURL) {
      requestConfig.baseURL = config.getApiUrl();
    }
    return requestConfig;
  },
  (error) => Promise.reject(error),
);

// Interceptor для добавления JWT токена
apiClient.interceptors.request.use(
  (config) => {
    // Prefer live store state (more reliable in runtime/tests),
    // fallback to persisted storage (e.g. on hard reload).
    const storeToken = useAuthStore.getState().token;
    if (storeToken) {
      config.headers.Authorization = `Bearer ${storeToken}`;
      return config;
    }

    const storage = localStorage.getItem('atom-titles-hive-auth-storage');
    if (!storage) return config;

    try {
      const parsed = JSON.parse(storage) as { state?: { token?: string } };
      const token = parsed?.state?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      logger.error('Failed to parse auth storage', e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => {
    if (!useAuthStore.getState().isServerAvailable) {
      useAuthStore.getState().setServerAvailable(true);
    }
    return response;
  },
  (error) => {
    const isNetworkError = error.code === 'ERR_NETWORK' || !error.response;
    if (isNetworkError) {
      useAuthStore.getState().setServerAvailable(false);
    } else if (error.response?.status === 401) {
      localStorage.removeItem('atom-titles-hive-auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
