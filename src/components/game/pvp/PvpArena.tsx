'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Trophy, 
  Swords, 
  Users, 
  Clock,
  Gift,
  RefreshCw,
  Target,
  Crown,
  Zap,
  History
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import api from '@/lib/api';
import { PvpRankingCard } from './PvpRankingCard';
import { OpponentsList } from './OpponentsList';
import { PvpLeaderboard } from './PvpLeaderboard';
import { MatchHistory } from './MatchHistory';
import { CombatDialog } from './CombatDialog';

// Types
interface PvpRanking {
  id: number;
  userId: number;
  seasonId: number;
  hunterPoints: number;
  currentRank: string;
  wins: number;
  losses: number;
  totalMatches: number;
  winStreak: number;
  bestWinStreak: number;
  highestPoints: number;
  lastMatchAt: string | null;
  lastOpponentRefreshAt: string | null;
  hasClaimedDailyReward: boolean;
  lastDailyRewardDate: string | null;
  canRefreshOpponents: boolean;
  canFight: boolean;
  winRate: number;
  rankName: string;
}

interface Opponent {
  id: number;
  userId: number;
  hunterPoints: number;
  currentRank: string;
  wins: number;
  losses: number;
  user: {
    id: number;
    username: string;
    level: number;
  };
  rankName: string;
  winRate: number;
}

interface LeaderboardPlayer {
  id: number;
  userId: number;
  hunterPoints: number;
  currentRank: string;
  wins: number;
  losses: number;
  user: {
    id: number;
    username: string;
    level: number;
  };
  rankName: string;
  winRate: number;
}

interface PvpMatch {
  id: number;
  challengerId: number;
  defenderId: number;
  winnerId: number | null;
  challengerPointsBefore: number;
  defenderPointsBefore: number;
  challengerPointsAfter: number;
  defenderPointsAfter: number;
  pointsChange: number;
  combatResult: any;
  createdAt: string;
  challenger: { id: number; username: string };
  isWin: boolean;
}

export function PvpArena() {
  const { user } = useAuth();
  const [myRanking, setMyRanking] = useState<PvpRanking | null>(null);
  const [opponents, setOpponents] = useState<PvpRanking[]>([]);
  const [leaderboard, setLeaderboard] = useState<PvpRanking[]>([]);
  const [matchHistory, setMatchHistory] = useState<PvpMatch[]>([]);
  const [combatResult, setCombatResult] = useState<PvpMatch | null>(null);
  const [showCombat, setShowCombat] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'opponents' | 'leaderboard' | 'history'>('opponents');
  const [refreshCooldown, setRefreshCooldown] = useState(0);

  // Convert PvpMatch to CombatResultData format
  const convertMatchToCombatResult = (match: PvpMatch) => {
    return {
      winnerId: match.winnerId || undefined,
      challengerId: match.challengerId,
      pointsChange: match.pointsChange,
      combatResult: match.combatResult,
    };
  };

  // Fetch my ranking
  const fetchMyRanking = async () => {
    try {
      const response = await api.get('/pvp-ranking/my-ranking');
      setMyRanking(response.data);
    } catch (error) {
      console.error('Error fetching my ranking:', error);
      toast.error('Lỗi khi tải thông tin ranking');
    }
  };

  // Fetch opponents
  const fetchOpponents = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pvp-ranking/opponents');
      setOpponents(response.data || []);
    } catch (error: any) {
      console.error('Error fetching opponents:', error);
      toast.error('Lỗi khi tải danh sách đối thủ');
    } finally {
      setLoading(false);
    }
  };

  // Fetch leaderboard
  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/pvp-ranking/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast.error('Lỗi khi tải bảng xếp hạng');
    }
  };

  // Fetch match history
  const fetchMatchHistory = async () => {
    try {
      const response = await api.get('/pvp-ranking/match-history');
      setMatchHistory(response.data);
    } catch (error) {
      console.error('Error fetching match history:', error);
      toast.error('Lỗi khi tải lịch sử trận đấu');
    }
  };

  // Challenge opponent
  const challengeOpponent = async (opponentId: number) => {
    try {
      setLoading(true);
      const response = await api.post(`/pvp-ranking/challenge/${opponentId}`);
      setCombatResult(response.data);
      setShowCombat(true);
      
      // Refresh data after combat - force refresh to get updated stats
      setTimeout(async () => {
        await Promise.all([
          fetchMyRanking(),
          fetchOpponents(),
          fetchLeaderboard(),
          fetchMatchHistory()
        ]);
      }, 500); // Small delay to ensure backend has updated
      
      toast.success('Trận đấu hoàn thành!');
    } catch (error: any) {
      console.error('Error challenging opponent:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thách đấu');
    } finally {
      setLoading(false);
    }
  };

  // Claim daily reward
  const claimDailyReward = async () => {
    try {
      setLoading(true);
      const response = await api.post('/pvp-ranking/claim-daily-reward');
      toast.success(`Nhận thưởng thành công! +${response.data.gold} gold, +${response.data.experience} exp`);
      fetchMyRanking();
    } catch (error: any) {
      console.error('Error claiming daily reward:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi nhận thưởng');
    } finally {
      setLoading(false);
    }
  };

  // Refresh opponents
  const refreshOpponents = async () => {
    await fetchOpponents();
    await fetchMyRanking(); // Update refresh timestamp
    toast.success('Đã làm mới danh sách đối thủ');
  };

  useEffect(() => {
    if (user) {
      Promise.all([
        fetchMyRanking(),
        fetchOpponents(),
        fetchLeaderboard(),
        fetchMatchHistory()
      ]);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">Vui lòng đăng nhập để tham gia PvP</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Swords className="h-8 w-8 text-primary" />
          Đấu trường Thợ Săn
        </h1>
        <p className="text-muted-foreground">
          Thách đấu các thợ săn khác để nâng cao thứ hạng và nhận phần thưởng
        </p>
      </div>

      {myRanking && (
        <PvpRankingCard 
          ranking={myRanking} 
          onClaimReward={claimDailyReward}
          loading={loading}
        />
      )}

      <Tabs defaultValue="opponents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="opponents" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Target className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Đối thủ</span>
            <span className="sm:hidden">Đối thủ</span>
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Bảng xếp hạng</span>
            <span className="sm:hidden">BXH</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm">
            <History className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Lịch sử</span>
            <span className="sm:hidden">Lịch sử</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="opponents">
          <OpponentsList
            opponents={opponents as any}
            onChallenge={challengeOpponent}
            onRefresh={refreshOpponents}
            canRefresh={myRanking?.canRefreshOpponents || false}
            canFight={myRanking?.canFight || false}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <PvpLeaderboard 
            players={leaderboard as any}
            currentUserId={user.id}
          />
        </TabsContent>

        <TabsContent value="history">
          <MatchHistory 
            matches={matchHistory as any}
            currentUserId={user.id}
          />
        </TabsContent>
      </Tabs>
      
      {showCombat && combatResult && (
        <CombatDialog
          open={showCombat}
          onOpenChange={(open) => {
            setShowCombat(open);
            if (!open) {
              // Refresh when modal closes
              setTimeout(async () => {
                await fetchMyRanking();
              }, 100);
            }
          }}
          combatResult={convertMatchToCombatResult(combatResult)}
        />
      )}
    </div>
  );
}
