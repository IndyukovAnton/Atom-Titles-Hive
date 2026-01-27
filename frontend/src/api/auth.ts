import apiClient from './client';

export interface LoginData {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface UserPreferences {
  background?: string;
  fontSize?: number;
  fontFamily?: string;
  language?: string;
  aiProvider?: string;
  aiKey?: string;
  aiLimits?: {
    dailyRequests?: number;
    maxTokens?: number;
  };
  privacySettings?: {
    shareWatchHistory?: boolean;
    shareBirthDate?: boolean;
  };
  tmdbApiKey?: string;
  avatar?: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  birthDate?: string;
  preferences?: UserPreferences;
  hasCompletedOnboarding: boolean;
}

export interface AuthResponse {
  access_token: string;
  user: UserProfile;
}

export const authApi = {
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/profile');
    return response.data;
  },

  updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const response = await apiClient.patch('/profile', data);
    return response.data;
  },
};
