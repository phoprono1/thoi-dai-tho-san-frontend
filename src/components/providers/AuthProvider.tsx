'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/stores';
import { toast } from 'sonner';

interface User {
  id: number;
  username: string;
  email?: string;
  level: number;
  experience: number;
  gold: number;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Verify token and get user data
      const response = await api.get('/auth/me');
      setUser(response.data);
      try {
        // Also update global zustand auth store so components using it see the user
        useAuthStore.setState({ user: response.data, userStats: null, isAuthenticated: true, isLoading: false });
      } catch {
        // ignore if zustand not available
      }
      // persist user for other parts of the app that read localStorage
      try {
        localStorage.setItem('user', JSON.stringify(response.data));
      } catch {}
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { access_token, user: userData } = response.data;

      // Store token
      localStorage.setItem('token', access_token);

      // Set token in axios headers
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      // Set user data
      setUser(userData);
      try {
        // Sync into zustand store
        useAuthStore.setState({ user: userData, userStats: null, isAuthenticated: true, isLoading: false });
      } catch {
        // ignore
      }
      try {
        localStorage.setItem('user', JSON.stringify(userData));
      } catch {}

      toast.success('Đăng nhập thành công!');
      // After login, choose destination:
      // - if user.level > 1, go straight to /game
      // - if user.level <= 1 and opening not yet seen, go to /opening
      // - otherwise go to /game
      if (typeof window !== 'undefined') {
        const seenOpening = localStorage.getItem('seenOpening');
        if (userData?.level && Number(userData.level) > 1) {
          window.location.href = '/game';
        } else if (!seenOpening) {
          window.location.href = '/opening';
        } else {
          window.location.href = '/game';
        }
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || 'Đăng nhập thất bại';
      toast.error(message);
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      await api.post('/auth/register', { username, password });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || 'Đăng ký thất bại';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    // Remove token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];

    // Clear user data
    setUser(null);
    try {
      useAuthStore.getState().logout();
    } catch {
      // ignore
    }

    toast.success('Đã đăng xuất');
    // Use window.location for reliable redirect in context
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
      try {
        useAuthStore.setState({ user: response.data, userStats: null, isAuthenticated: true, isLoading: false });
      } catch {}
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
