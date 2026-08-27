import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { apiRequest } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  personas: User[];
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: { name: string; email: string; password?: string; role: 'student' | 'mentor' | 'hod'; roll_no?: string; semester?: number }) => Promise<void>;
  switchPersona: (userId: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateAvatar: (avatarDataUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('activity_portal_token'));
  const [personas, setPersonas] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch available demo personas
  const loadPersonas = useCallback(async () => {
    try {
      const data = await apiRequest<User[]>('/api/auth/personas');
      setPersonas(data);
    } catch (err) {
      console.error('Failed to load personas:', err);
    }
  }, []);

  // Fetch current user if token exists
  const refreshUser = useCallback(async () => {
    const currentToken = localStorage.getItem('activity_portal_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiRequest<User>('/api/auth/me');
      setUser(userData);
    } catch (err) {
      console.warn('Session expired or invalid token:', err);
      localStorage.removeItem('activity_portal_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await loadPersonas();
      const storedToken = localStorage.getItem('activity_portal_token');
      if (storedToken) {
        await refreshUser();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    };
    init();
  }, [loadPersonas, refreshUser]);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('activity_portal_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password?: string; role: 'student' | 'mentor' | 'hod'; roll_no?: string; semester?: number }) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      localStorage.setItem('activity_portal_token', res.token);
      setToken(res.token);
      setUser(res.user);
      await loadPersonas();
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/switch-persona', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      localStorage.setItem('activity_portal_token', res.token);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('activity_portal_token');
    setToken(null);
    setUser(null);
  };

  const updateAvatar = async (avatarDataUrl: string) => {
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ avatar: avatarDataUrl }),
      });
      if (res && res.user) {
        setUser(res.user);
      } else {
        await refreshUser();
      }
    } catch (err) {
      console.error('Failed to update avatar:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        personas,
        isLoading,
        login,
        register,
        switchPersona,
        logout,
        refreshUser,
        updateAvatar,
      }}
    >
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
