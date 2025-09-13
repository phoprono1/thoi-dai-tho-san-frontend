'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import LoginForm from '@/components/game/LoginForm';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      try {
        const userJson = localStorage.getItem('user');
        const seenOpening = localStorage.getItem('seenOpening');
        const user = userJson ? JSON.parse(userJson) : null;
        // If user level > 1, skip opening. Otherwise, if not seen, go to /opening.
        if (user?.level && Number(user.level) > 1) {
          router.push('/game');
        } else if (!seenOpening) {
          router.push('/opening');
        } else {
          router.push('/game');
        }
      } catch {
        // fallback
        router.push('/game');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  return <LoginForm />;
}
