import api from './api';
import { AuthResponse } from '../types';

export const authService = {
  login: (email: string, password: string) => {
    return api.post<AuthResponse>('/auth/login', { email, password });
  },

  register: (email: string, name: string, password: string) => {
    return api.post<AuthResponse>('/auth/register', { email, name, password });
  },

  googleLogin: (credential: string) => {
    return api.post<AuthResponse>('/auth/google', { credential });
  },

  logout: () => {
    return api.post('/auth/logout');
  },

  getProfile: () => {
    return api.get('/auth/profile');
  },
};
