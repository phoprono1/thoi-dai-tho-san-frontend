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
const ADMIN_BYPASS_KEY = 'admin2024';

export function AdminProvider({ children }: AdminProviderProps) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    checkInitialAdminAccess();
  }, []);

  const checkInitialAdminAccess = () => {
    if (typeof window === 'undefined') return;

    // Check localStorage
    const adminAccess = localStorage.getItem('admin_access');
    
    // Check URL bypass parameter
    const urlParams = new URLSearchParams(window.location.search);
    const bypass = urlParams.get('bypass');

    if (adminAccess === 'true' || bypass === ADMIN_BYPASS_KEY) {
      setIsAdminAuthenticated(true);
      
      // Set admin access if using bypass
      if (bypass === ADMIN_BYPASS_KEY) {
        localStorage.setItem('admin_access', 'true');
        // Clean URL by removing bypass parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('bypass');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  };

  const login = (secretKey: string): boolean => {
    if (secretKey === ADMIN_SECRET_KEY || secretKey === ADMIN_BYPASS_KEY) {
      localStorage.setItem('admin_access', 'true');
      setIsAdminAuthenticated(true);
      toast.success('Đăng nhập admin thành công!');
      return true;
    } else {
      toast.error('Secret key không đúng!');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_access');
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
