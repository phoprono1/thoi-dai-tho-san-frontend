'use client';

import React, { useEffect, useState } from 'react';
import { apiService } from '@/lib/api-service';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {

  const [combat, setCombat] = useState<Array<{ userId: number; score: number; rank: number; username?: string }>>([]);
  const [level, setLevel] = useState<Array<{ userId: number; level: number; username?: string; rank: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState('combat');
  const [aroundMode, setAroundMode] = useState(false);
  const [hasMe, setHasMe] = useState<number | null>(null);

  const getTrophyColor = (idx: number) => {
    if (idx === 0) return 'text-amber-500';
    if (idx === 1) return 'text-slate-400';
    if (idx === 2) return 'text-amber-400';
    return 'text-muted-foreground';
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // detect logged-in user id (best-effort; project stores userId in localStorage in some places)
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const maybe = localStorage.getItem('userId');
            if (maybe) setHasMe(Number(maybe));
          }
        } catch {
          // ignore
        }

        const [c, l] = (await Promise.all([
          apiService.getCombatLeaderboard(100).catch(() => []),
          apiService.getUsersTopByLevel(100).catch(() => []),
        ])) as [
          Array<{ userId: number; score: number; rank: number }>,
          Array<{ userId: number; level: number; username?: string; rank: number }>
        ];
        if (!mounted) return;
        // limit to top 20
        setCombat(c.slice(0, 20));
        setLevel(l.slice(0, 20));
        setError(null);
      } catch (err) {
        console.error('Leaderboard fetch failed', err);
        setError(String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchAround = async () => {
    if (!hasMe) return;
    try {
      setLoading(true);
      const around = await apiService.getCombatLeaderboardAround(hasMe, 5);
      setCombat(around.slice(0, 20));
      setAroundMode(true);
      setError(null);
    } catch (err) {
      console.error('Fetch around failed', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Bảng xếp hạng</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">Top 20</div>
          {aroundMode ? <div className="text-sm text-amber-500">Around you</div> : null}
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div />
        <div className="flex items-center gap-2">
          {hasMe ? (
            <>
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const top = await apiService.getCombatLeaderboard(20);
                    setCombat(top.slice(0, 20));
                    setAroundMode(false);
                  } catch (err) {
                    setError(String(err));
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-3 py-1 border rounded text-sm"
              >
                Top
              </button>
              <button
                onClick={fetchAround}
                className="px-3 py-1 bg-amber-500 text-white rounded text-sm"
              >
                Around me
              </button>
            </>
          ) : null}
        </div>
      </div>

      <Tabs defaultValue={tab} value={tab} onValueChange={(v) => setTab(v)} className="w-full">
        <TabsList className="mb-3">
          <TabsTrigger value="combat">Lực chiến</TabsTrigger>
          <TabsTrigger value="level">Cấp</TabsTrigger>
        </TabsList>

        <TabsContent value="combat">
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="space-y-2">
              {combat.map((c, idx) => (
                <div key={c.userId} className="flex items-center gap-3 p-3 bg-card rounded-md shadow-sm">
                  <div className="w-8 text-center">
                    {idx < 3 ? <Trophy className={getTrophyColor(idx)} /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium" title={`user-${c.userId}`}>
                      {('username' in c && c.username) ? (
                        <span>{c.username}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">User {c.userId}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">{c.score.toLocaleString()} lực chiến</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="level">
          {loading ? (
            <div>Đang tải...</div>
          ) : (
            <div className="space-y-2">
              {level.map((l, idx) => (
                <div key={l.userId} className="flex items-center gap-3 p-3 bg-card rounded-md shadow-sm">
                  <div className="w-8 text-center">
                    {idx < 3 ? <Trophy className={getTrophyColor(idx)} /> : null}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium" title={`user-${l.userId}`}>
                      {l.username ? (
                        <span>{l.username}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">User {l.userId}</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">Cấp {l.level}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {error ? <pre className="mt-4 text-sm text-red-600">{error}</pre> : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
