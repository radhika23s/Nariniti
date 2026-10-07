import { apiRequest, AuthUser, MeResponse } from './api';

export const auth = {
  async login(identifier: string, password: string): Promise<AuthUser> {
    // Django login returns user fields directly (id, firstName, lastName, email, phone)
    return apiRequest<AuthUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    });
  },

  async register(data: Record<string, unknown>): Promise<{ message: string }> {
    return apiRequest<{ message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<void> {
    await apiRequest<void>('/api/auth/logout', { method: 'POST' });
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Django /api/auth/me returns { authenticated, user: { id, firstName, ... } }
      const response = await apiRequest<MeResponse>('/api/auth/me');
      if (response.authenticated && response.user) {
        return response.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  async refreshToken(): Promise<boolean> {
    try {
      await apiRequest('/api/auth/refresh', { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  },
};
