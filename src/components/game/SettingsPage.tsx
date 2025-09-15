"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setupInterceptors, api } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => {
    setupInterceptors();
  }, []);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingChange, setLoadingChange] = useState(false);

  // Delete account modal state
  const [deletePassword, setDeletePassword] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }

    // Enforce password strength: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      toast.error('Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt');
      return;
    }

    try {
      setLoadingChange(true);
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } })?.response;
      const msg = resp?.data?.message ?? (err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
      toast.error(msg);
    } finally {
      setLoadingChange(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Vui lòng nhập mật khẩu để xác nhận');
      return;
    }

    try {
      setLoadingDelete(true);
      await api.delete('/users/me', { data: { currentPassword: deletePassword } });
      // On success, clear local auth and redirect to landing
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Tài khoản đã được xóa');
      router.push('/');
      // reload to ensure auth state cleared
      window.location.reload();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string } } })?.response;
      const msg = resp?.data?.message ?? (err instanceof Error ? err.message : 'Xóa tài khoản thất bại');
      toast.error(msg);
    } finally {
      setLoadingDelete(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-6">Cài đặt tài khoản</h1>

      <section className="mb-8">
        <h2 className="text-lg font-medium mb-3">Đổi mật khẩu</h2>
        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="text-sm text-muted-foreground">Mật khẩu hiện tại</label>
            <Input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Mật khẩu mới</label>
            <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Xác nhận mật khẩu mới</label>
            <Input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="default" disabled={loadingChange}>
              {loadingChange ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium mb-3">Xóa tài khoản</h2>
        <p className="text-sm text-muted-foreground mb-3">Hành động này sẽ xóa toàn bộ dữ liệu liên quan đến tài khoản của bạn và không thể hoàn tác.</p>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">Xóa tài khoản</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Xác nhận xóa tài khoản</DialogTitle>
              <DialogDescription>
                Vui lòng nhập mật khẩu của bạn để xác nhận. Hành động này sẽ xóa mọi dữ liệu liên quan đến tài khoản.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <label className="text-sm text-muted-foreground">Mật khẩu</label>
              <Input value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} type="password" />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Hủy</Button>
              </DialogClose>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={loadingDelete}>
                {loadingDelete ? 'Đang xóa...' : 'Xác nhận xóa'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
