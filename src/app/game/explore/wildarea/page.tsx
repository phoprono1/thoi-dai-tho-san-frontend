"use client";

import { useState } from 'react';
import { exploreApi } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import CombatModal, { CombatResult } from '@/components/ui/CombatModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

export default function WildAreaPage() {
  const { user, isLoading } = useAuth();
  const [isHunting, setIsHunting] = useState(false);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleHunt = async () => {
    if (!user) {
      // If auth is still initializing, wait a moment and retry
      if (isLoading) {
        // simple short wait and retry once
        await new Promise((r) => setTimeout(r, 300));
        if (!user) {
          // still not authenticated
          window.location.href = '/login';
          return;
        }
      } else {
        window.location.href = '/login';
        return;
      }
    }

    setIsHunting(true);
    try {
      const res = await exploreApi.startWildArea(1);
      // If jobId returned, you can implement polling; for now, if combatResult is present use it
      if (res.combatResult) {
        setCombatResult(res.combatResult);
        setShowModal(true);
      } else if (res.jobId) {
        // Job queued; inform user that result will arrive later
        alert('Yêu cầu đã được gửi. Kết quả sẽ hiển thị khi hoàn tất.');
      }
    } catch (err: unknown) {
      const getErrorMessage = (e: unknown) => {
        if (typeof e === 'string') return e;
        if (e && typeof e === 'object') {
          const maybe = e as { response?: { data?: { message?: unknown } }; message?: unknown };
          if (maybe.response?.data?.message) return String(maybe.response.data.message);
          if (maybe.message) return String(maybe.message);
        }
        return 'Lỗi khi đi săn';
      };

      alert(getErrorMessage(err));
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Khu Dã Ngoại</h1>
      <p className="mb-4">Ra ngoài săn quái (tốn 5 thể lực) — gặp 1-3 quái ngẫu nhiên theo level bạn.</p>

      <div className="flex items-center gap-4">
        <Button onClick={handleHunt} disabled={isHunting}>
          {isHunting ? (
            <span className="flex items-center gap-2"><Spinner /> Đang đi săn...</span>
          ) : (
            'Đi săn'
          )}
        </Button>
      </div>

      {showModal && (
        <CombatModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          combatResult={combatResult}
          dungeonName="Khu Dã Ngoại"
        />
      )}
    </div>
  );
}
