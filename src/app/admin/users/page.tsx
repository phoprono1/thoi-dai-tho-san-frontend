'use client';

import { useEffect, useState } from 'react';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminUsers from '@/components/admin/AdminUsers';
import { useAdmin } from '@/components/providers/AdminProvider';

export default function AdminUsersPage() {
  const { isAdminAuthenticated } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setIsLoading(false);
  }, []);

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <AdminLogin />;
  }

  return <AdminUsers />;
}
