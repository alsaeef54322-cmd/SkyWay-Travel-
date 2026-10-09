import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/client.ts';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (perm: keyof UserProfile['permissions']) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('skyway_token'));
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('skyway_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function verifyUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem('skyway_user', JSON.stringify(userData));
        } else {
          // Token expired or invalid
          setToken(null);
          setUser(null);
          localStorage.removeItem('skyway_token');
          localStorage.removeItem('skyway_user');
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    verifyUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('skyway_token', data.token);
      localStorage.setItem('skyway_user', JSON.stringify(data.user));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (e) {
        // Ignore network errors on logout
      }
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('skyway_token');
    localStorage.removeItem('skyway_user');
  };

  const hasPermission = (perm: keyof UserProfile['permissions']): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return !!user.permissions[perm];
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
