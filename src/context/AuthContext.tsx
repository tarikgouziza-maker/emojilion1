import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'editor';
}

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => Promise<void>;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('emojiworld_admin_token');
    }
    return null;
  });

  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  }, [token]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setAdmin(null);
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdmin(data.admin);
        } else {
          // Token expired or invalid
          localStorage.removeItem('emojiworld_admin_token');
          setToken(null);
          setAdmin(null);
        }
      } catch (err) {
        console.error('Auth verification error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  const login = useCallback((newToken: string, newAdmin: AdminUser) => {
    localStorage.setItem('emojiworld_admin_token', newToken);
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (_) {}
    }
    localStorage.removeItem('emojiworld_admin_token');
    setToken(null);
    setAdmin(null);
  }, [token]);

  return (
    <AuthContext.Provider value={{ admin, token, isLoading, login, logout, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
