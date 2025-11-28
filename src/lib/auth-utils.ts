import type { LoginUser } from '@shared/types';
const MOCK_USER: LoginUser = {
  id: 'user_demo_01',
  email: 'demo@luxquote.com',
  name: 'Demo User',
};
const MOCK_PASSWORD = 'demo123';
const TOKEN_KEY = 'luxquote_auth_token';
const USER_KEY = 'luxquote_user';
// Simple "hash" for mock purposes
const createToken = (email: string, pass: string) => `mock_token_${btoa(`${email}:${pass}`)}`;
export const mockAuth = {
  login: (email: string, pass: string): Promise<LoginUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email.toLowerCase() === MOCK_USER.email && pass === MOCK_PASSWORD) {
          const token = createToken(email, pass);
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(MOCK_USER));
          window.dispatchEvent(new Event('storage')); // Notify other tabs/components
          resolve(MOCK_USER);
        } else {
          reject(new Error('Invalid credentials. Use demo@luxquote.com and demo123.'));
        }
      }, 500);
    });
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
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }
};