'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  login: (secretKey: string) => boolean;
  logout: () => void;
  checkAdminAccess: () => boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}

interface AdminProviderProps {
  children: React.ReactNode;
}

const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 'thoidaiadmin2024';
// REMOVED: ADMIN_BYPASS_KEY for security reasons

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(0);

  useEffect(() => {
    checkInitialAdminAccess();
  }, []);

  const checkInitialAdminAccess = () => {
    if (typeof window === 'undefined') return;

    // Check localStorage only
    const adminAccess = localStorage.getItem('admin_access');
    const loginTime = localStorage.getItem('admin_login_time');
    
    if (adminAccess === 'true' && loginTime) {
      const timeSinceLogin = Date.now() - parseInt(loginTime);
      // Session expires after 24 hours
      if (timeSinceLogin < 24 * 60 * 60 * 1000) {
        setIsAdminAuthenticated(true);
      } else {
        // Session expired, clear it
        localStorage.removeItem('admin_access');
        localStorage.removeItem('admin_login_time');
      }
    }
  };

  const login = (secretKey: string): boolean => {
    const now = Date.now();
    const timeSinceLastAttempt = now - lastAttemptTime;
    
    // Rate limiting: max 5 attempts per minute
    if (loginAttempts >= 5 && timeSinceLastAttempt < 60000) {
      toast.error('Quá nhiều lần thử đăng nhập. Vui lòng đợi 1 phút.');
      return false;
    }
    
    // Reset attempts if more than 1 minute has passed
    if (timeSinceLastAttempt > 60000) {
      setLoginAttempts(0);
    }
    
    if (secretKey === ADMIN_SECRET_KEY) {
      // Reset attempts on successful login
      setLoginAttempts(0);
      setLastAttemptTime(0);
      
      localStorage.setItem('admin_access', 'true');
      localStorage.setItem('admin_login_time', now.toString());
      setIsAdminAuthenticated(true);
      toast.success('Đăng nhập admin thành công!');
      return true;
    } else {
      // Increment attempts on failed login
      setLoginAttempts(prev => prev + 1);
      setLastAttemptTime(now);
      
      toast.error('Secret key không đúng!');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_access');
    localStorage.removeItem('admin_login_time');
    setIsAdminAuthenticated(false);
    toast.success('Đã đăng xuất admin');
  };

  const checkAdminAccess = (): boolean => {
    if (typeof window === 'undefined') return false;
    const adminAccess = localStorage.getItem('admin_access');
    return adminAccess === 'true';
  };

  const value: AdminContextType = {
    isAdminAuthenticated,
    login,
    logout,
    checkAdminAccess,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}
