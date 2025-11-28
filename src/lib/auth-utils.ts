import type { LoginUser } from '@shared/types';
const MOCK_USER: LoginUser = {
  id: 'user_demo_01',
  email: 'demo@luxquote.com',
  name: 'Demo User',
  role: 'user',
};
const MOCK_ADMIN_USER: LoginUser = {
  id: 'admin_01',
  email: 'admin@luxquote.com',
  name: 'Admin User',
  role: 'admin',
};
const MOCK_PASSWORD = 'demo123';
const MOCK_ADMIN_PASSWORD = 'admin123';
const TOKEN_KEY = 'luxquote_auth_token';
const USER_KEY = 'luxquote_user';
// Simple "hash" for mock purposes
const createToken = (email: string, pass: string) => `mock_token_${btoa(`${email}:${pass}`)}`;
export const mockAuth = {
  login: (email: string, pass: string): Promise<LoginUser> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const lowerEmail = email.toLowerCase();
        let user: LoginUser | null = null;
        if (lowerEmail === MOCK_USER.email && pass === MOCK_PASSWORD) {
          user = MOCK_USER;
        } else if (lowerEmail === MOCK_ADMIN_USER.email && pass === MOCK_ADMIN_PASSWORD) {
          user = MOCK_ADMIN_USER;
        }
        if (user) {
          const token = createToken(email, pass);
          localStorage.setItem(TOKEN_KEY, token);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          window.dispatchEvent(new Event('storage')); // Notify other tabs/components
          resolve(user);
        } else {
          reject(new Error('Invalid credentials. Use demo@luxquote.com / demo123 or admin@luxquote.com / admin123.'));
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
  getRole: (): 'user' | 'admin' | null => {
    const user = mockAuth.getUser();
    return user?.role || null;
  },
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  }
};