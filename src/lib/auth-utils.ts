import type { LoginUser, ApiResponse, LoginResponse } from '@shared/types';
const TOKEN_KEY = 'luxquote_auth_token';
const USER_KEY = 'luxquote_user';
export const mockAuth = {
  login: async (email: string, pass: string): Promise<LoginUser> => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    });
    const json = await response.json() as ApiResponse<LoginResponse>;
    if (!response.ok || !json.success || !json.data) {
      throw new Error(json.error || 'Login failed');
    }
    const { user, token } = json.data;
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, token);
    window.dispatchEvent(new Event('storage')); // Notify other tabs/components
    return user;
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    window.dispatchEvent(new Event('storage'));
  },
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(TOKEN_KEY);
  },
  getUser: (): LoginUser | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },
  getRole: (): 'user' | 'admin' | null => {
    const user = mockAuth.getUser();
    return user?.role || null;
  },
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }
};