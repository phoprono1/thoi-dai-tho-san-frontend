"use client";

import { useState, useEffect } from 'react';
import { exploreApi } from '@/lib/api-client';
import { api } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import CombatModal, { CombatResult } from '@/components/ui/CombatModal';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreePine, Zap, Swords } from 'lucide-react';

interface WildAreaMonster {
  monster: {
    id: number;
    name: string;
    level: number;
    type: string;
    element: string;
    baseHp: number;
    baseAttack: number;
    baseDefense: number;
    experienceReward: number;
    goldReward: number;
  };
  weight: number;
}

export default function WildAreaPage() {
  const { user, isLoading } = useAuth();
  const [isHunting, setIsHunting] = useState(false);
  const [combatResult, setCombatResult] = useState<CombatResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [availableMonsters, setAvailableMonsters] = useState<WildAreaMonster[]>([]);
  const [loadingMonsters, setLoadingMonsters] = useState(false);

  // Load available monsters for current user level
  useEffect(() => {
    const fetchAvailableMonsters = async () => {
      if (!user) return;
      
      setLoadingMonsters(true);
      try {
        const response = await api.get(`/wildarea/monsters/level/${user.level}`);
        setAvailableMonsters(response.data);
      } catch (error) {
        console.error('Error loading available monsters:', error);
      } finally {
        setLoadingMonsters(false);
      }
    };

    fetchAvailableMonsters();
  }, [user]);

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

  const getElementColor = (element: string) => {
    switch (element) {
      case 'fire': return 'bg-red-100 text-red-800';
      case 'water': return 'bg-blue-100 text-blue-800';
      case 'earth': return 'bg-yellow-100 text-yellow-800';
      case 'wind': return 'bg-green-100 text-green-800';
      case 'neutral': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'elite': return 'bg-purple-100 text-purple-800';
      case 'boss': return 'bg-red-100 text-red-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <TreePine className="w-8 h-8 text-green-600" />
          Khu Dã Ngoại
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Ra ngoài săn quái (tốn 5 thể lực) — gặp 1-3 quái ngẫu nhiên theo level bạn.
        </p>
      </div>

      {/* Hunt Button */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Swords className="w-5 h-5" />
              Bắt đầu săn bắn
            </CardTitle>
            <CardDescription>
              {user ? `Level ${user.level} - Sẵn sàng khám phá khu dã ngoại` : 'Đang tải thông tin...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleHunt} disabled={isHunting || !user} size="lg" className="w-full sm:w-auto">
              {isHunting ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Đang đi săn...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Đi săn (-5 thể lực)
                </span>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Available Monsters */}
      <Card>
        <CardHeader>
          <CardTitle>Monsters có thể gặp</CardTitle>
          <CardDescription>
            {user ? `Monsters phù hợp với level ${user.level} của bạn` : 'Đăng nhập để xem monsters có thể gặp'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingMonsters ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
              <span className="ml-2">Đang tải danh sách monsters...</span>
            </div>
          ) : availableMonsters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableMonsters.map((wildMonster) => (
                <div
                  key={wildMonster.monster.id}
                  className="p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {wildMonster.monster.name}
                    </h3>
                    <div className="text-sm text-gray-500">
                      Weight: {wildMonster.weight}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline">Lv.{wildMonster.monster.level}</Badge>
                    <Badge className={getTypeColor(wildMonster.monster.type)}>
                      {wildMonster.monster.type}
                    </Badge>
                    <Badge className={getElementColor(wildMonster.monster.element)}>
                      {wildMonster.monster.element}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>HP:</span>
                      <span className="font-medium">{wildMonster.monster.baseHp}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attack:</span>
                      <span className="font-medium">{wildMonster.monster.baseAttack}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Defense:</span>
                      <span className="font-medium">{wildMonster.monster.baseDefense}</span>
                    </div>
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>EXP:</span>
                      <span className="font-medium">{wildMonster.monster.experienceReward}</span>
                    </div>
                    <div className="flex justify-between text-yellow-600 dark:text-yellow-400">
                      <span>Gold:</span>
                      <span className="font-medium">{wildMonster.monster.goldReward}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : user ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-300">
              <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Không có monster nào phù hợp với level hiện tại của bạn.</p>
              <p className="text-sm">Hãy nâng level hoặc liên hệ admin để thêm monsters.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-300">
              <p>Vui lòng đăng nhập để xem danh sách monsters.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
