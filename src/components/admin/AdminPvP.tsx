'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, 
  Trophy, 
  Users, 
  Swords, 
  Calendar,
  Settings,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import api from '@/lib/api';
import { PvpOverview } from './pvp/PvpOverview';
import { PvpSeasons } from './pvp/PvpSeasons';
import { PvpLeaderboard } from './pvp/PvpLeaderboard';
import { PvpManagement } from './pvp/PvpManagement';
import { CreateSeasonDialog } from './pvp/CreateSeasonDialog';
import { EditRewardsDialog } from './pvp/EditRewardsDialog';

// Types
export interface PvpSeason {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rewards: {
    daily: {
      [key: string]: {
        gold: number;
        experience: number;
        items?: Array<{ itemId: number; quantity: number }>;
      };
    };
    seasonal: {
      top1: { gold: number; experience: number; items?: Array<{ itemId: number; quantity: number }> };
      top2to3: { gold: number; experience: number; items?: Array<{ itemId: number; quantity: number }> };
      top4to10: { gold: number; experience: number; items?: Array<{ itemId: number; quantity: number }> };
    };
  };
  createdAt: string;
  updatedAt: string;
  daysRemaining?: number;
  isCurrentSeason?: boolean;
}

export interface PvpStatistics {
  totalPlayers: number;
  totalMatches: number;
  averageRating: number;
  rankDistribution: { [key: string]: number };
  topPlayers: Array<{
    id: number;
    userId: number;
    hunterPoints: number;
    currentRank: string;
    wins: number;
    losses: number;
    user: {
      id: number;
      username: string;
    };
  }>;
}

export const RANK_NAMES = {
  APPRENTICE: 'Thợ Săn Tập Sự',
  AMATEUR: 'Thợ Săn Nghiệp Dư',
  PROFESSIONAL: 'Thợ Săn Chuyên Nghiệp',
  ELITE: 'Thợ Săn Tinh Anh',
  EPIC: 'Thợ Săn Sử Thi',
  LEGENDARY: 'Thợ Săn Truyền Thuyết',
  MYTHICAL: 'Thợ Săn Huyền Thoại',
  DIVINE: 'Thợ Săn Thần Thoại',
};

export const RANK_COLORS = {
  APPRENTICE: 'bg-gray-100 text-gray-800',
  AMATEUR: 'bg-green-100 text-green-800',
  PROFESSIONAL: 'bg-blue-100 text-blue-800',
  ELITE: 'bg-purple-100 text-purple-800',
  EPIC: 'bg-pink-100 text-pink-800',
  LEGENDARY: 'bg-orange-100 text-orange-800',
  MYTHICAL: 'bg-red-100 text-red-800',
  DIVINE: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
};

export function AdminPvP() {
  const [seasons, setSeasons] = useState<PvpSeason[]>([]);
  const [statistics, setStatistics] = useState<PvpStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<PvpSeason | null>(null);
  const [showCreateSeason, setShowCreateSeason] = useState(false);
  const [showEditRewards, setShowEditRewards] = useState(false);

  // Fetch data
  const fetchSeasons = async () => {
    try {
      const response = await api.get('/admin/pvp/seasons');
      setSeasons(response.data);
    } catch (error) {
      console.error('Error fetching seasons:', error);
      toast.error('Lỗi khi tải danh sách mùa giải');
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/pvp/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Lỗi khi tải thống kê');
    }
  };

  useEffect(() => {
    fetchSeasons();
    fetchStatistics();
  }, []);

  const openCreateSeason = () => {
    setShowCreateSeason(true);
  };

  const openEditRewards = (season: PvpSeason) => {
    setSelectedSeason(season);
    setShowEditRewards(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quản lý PvP - Đấu trường Thợ Săn</h1>
          <p className="text-muted-foreground">Quản lý mùa giải, phần thưởng và thống kê PvP</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openCreateSeason} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo mùa giải mới
          </Button>
          <Button variant="outline" onClick={fetchStatistics} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="seasons" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Mùa giải
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Bảng xếp hạng
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Quản lý
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <PvpOverview statistics={statistics} seasons={seasons} />
        </TabsContent>

        <TabsContent value="seasons">
          <PvpSeasons 
            seasons={seasons} 
            onEditRewards={openEditRewards}
            onRefresh={fetchSeasons}
          />
        </TabsContent>

        <TabsContent value="leaderboard">
          <PvpLeaderboard statistics={statistics} />
        </TabsContent>

        <TabsContent value="management">
          <PvpManagement onRefresh={fetchStatistics} />
        </TabsContent>
      </Tabs>

      <CreateSeasonDialog
        open={showCreateSeason}
        onOpenChange={setShowCreateSeason}
        onSuccess={fetchSeasons}
      />

      <EditRewardsDialog
        open={showEditRewards}
        onOpenChange={setShowEditRewards}
        season={selectedSeason}
        onSuccess={fetchSeasons}
      />
    </div>
  );
}
