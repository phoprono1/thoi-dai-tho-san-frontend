'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Star,
  Trophy,
  Clock,
  CheckCircle,
  Circle,
  Coins,
  Gem,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api-service';
import { toast } from 'sonner';
import { UserQuest } from '@/types';

interface Quest {
  id: number;
  title: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'achievement';
  status: 'available' | 'in_progress' | 'completed';
  progress: number;
  maxProgress: number;
  rewards: {
    experience: number;
    gold: number;
    items?: string[];
  };
  requirements: {
    level?: number;
    quests?: number[];
  };
  timeLimit?: string;
}

export default function QuestTab() {
  const { user: authUser, isAuthenticated } = useAuth();

  // Get user ID from authentication
  const userId = authUser?.id;

  // Fetch user quests using TanStack Query
  const { data: userQuests = [], isLoading, error, refetch } = useQuery({
    queryKey: ['user-quests', userId],
    queryFn: async () => {
      try {
        const result = await apiService.getUserQuests();
        return result;
      } catch (err) {
        console.error('Error fetching quests:', err);
        throw err;
      }
    },
    enabled: !!userId && isAuthenticated,
  });

  // If not authenticated, show message
  if (!isAuthenticated || !userId) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Vui lòng đăng nhập để xem nhiệm vụ</p>
          <div className="text-sm text-gray-400 mb-2">
            Auth status: {isAuthenticated ? 'Đã đăng nhập' : 'Chưa đăng nhập'}
          </div>
          <div className="text-sm text-gray-400">
            User ID: {userId || 'Không có'}
          </div>
          <div className="text-sm text-gray-400 mt-2">
            Token: {localStorage.getItem('token') ? 'Có' : 'Không'}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Không thể tải dữ liệu nhiệm vụ</p>
        <p className="text-sm mt-2">Chi tiết: {error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Thử lại
        </button>
      </div>
    );
  }

  const handleAcceptQuest = async (userQuest: UserQuest) => {
    try {
      await apiService.startQuest(userQuest.questId);
      toast.success('Đã nhận nhiệm vụ');
      refetch();
    } catch (error) {
      toast.error('Không thể nhận nhiệm vụ');
    }
  };

  const handleCompleteQuest = async (userQuest: UserQuest) => {
    try {
      // TODO: Implement complete quest logic
      toast.info('Tính năng hoàn thành nhiệm vụ đang được phát triển');
    } catch (error) {
      toast.error('Không thể hoàn thành nhiệm vụ');
    }
  };

  const handleClaimReward = async (userQuest: UserQuest) => {
    try {
      // TODO: Implement claim reward logic
      toast.info('Tính năng nhận thưởng đang được phát triển');
    } catch (error) {
      toast.error('Không thể nhận thưởng');
    }
  };

  const filteredQuests = (type: string) => {
    if (type === 'all') {
      return userQuests;
    }
    
    const filtered = userQuests.filter(userQuest => {
      return userQuest.quest.type === type;
    });
    
    return filtered;
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="main">Chính</TabsTrigger>
          <TabsTrigger value="side">Phụ</TabsTrigger>
          <TabsTrigger value="daily">Hàng ngày</TabsTrigger>
          <TabsTrigger value="achievement">Thành tựu</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {filteredQuests('all').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onComplete={handleCompleteQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </TabsContent>

        <TabsContent value="main" className="space-y-3">
          {filteredQuests('main').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onComplete={handleCompleteQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </TabsContent>

        <TabsContent value="side" className="space-y-3">
          {filteredQuests('side').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onComplete={handleCompleteQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </TabsContent>

        <TabsContent value="daily" className="space-y-3">
          {filteredQuests('daily').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onComplete={handleCompleteQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </TabsContent>

        <TabsContent value="achievement" className="space-y-3">
          {filteredQuests('achievement').map((userQuest) => (
            <QuestCard
              key={userQuest.id}
              userQuest={userQuest}
              onAccept={handleAcceptQuest}
              onComplete={handleCompleteQuest}
              onClaim={handleClaimReward}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface QuestCardProps {
  userQuest: UserQuest;
  onAccept: (userQuest: UserQuest) => void;
  onComplete: (userQuest: UserQuest) => void;
  onClaim: (userQuest: UserQuest) => void;
}

function QuestCard({ userQuest, onAccept, onComplete, onClaim }: QuestCardProps) {
  const quest = userQuest.quest;
  const progressPercentage = (userQuest.progress / quest.maxProgress) * 100;

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-blue-100 text-blue-800';
      case 'side': return 'bg-green-100 text-green-800';
      case 'daily': return 'bg-purple-100 text-purple-800';
      case 'achievement': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestTypeLabel = (type: string) => {
    switch (type) {
      case 'main': return 'Chính';
      case 'side': return 'Phụ';
      case 'daily': return 'Hàng ngày';
      case 'achievement': return 'Thành tựu';
      default: return type;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />;
      case 'available': return <Circle className="h-5 w-5 text-gray-400" />;
      default: return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang làm';
      case 'available': return 'Có thể nhận';
      default: return status;
    }
  };

  return (
    <Card className={`transition-all ${userQuest.status === 'completed' ? 'border-green-200 bg-green-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon(userQuest.status)}
            <div>
              <CardTitle className="text-lg">{quest.title}</CardTitle>
              <CardDescription>{quest.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getQuestTypeColor(quest.type)}>
              {getQuestTypeLabel(quest.type)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress */}
        {userQuest.status === 'in_progress' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Tiến độ</span>
              <span>{userQuest.progress}/{quest.maxProgress}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Time limit */}
        {quest.timeLimit && (
          <div className="flex items-center space-x-1 text-sm text-orange-600 mb-3">
            <Clock className="h-4 w-4" />
            <span>{quest.timeLimit}</span>
          </div>
        )}

        {/* Requirements */}
        {quest.requirements.level && (
          <div className="flex items-center space-x-1 text-sm text-gray-600 mb-3">
            <Star className="h-4 w-4" />
            <span>Yêu cầu level {quest.requirements.level}</span>
          </div>
        )}

        {/* Rewards */}
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2">Phần thưởng:</h4>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{quest.rewards.experience} EXP</span>
            </div>
            <div className="flex items-center space-x-1">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span>{quest.rewards.gold} vàng</span>
            </div>
            {quest.rewards.items && quest.rewards.items.length > 0 && (
              <div className="flex items-center space-x-1">
                <Gem className="h-4 w-4 text-purple-500" />
                <span>{quest.rewards.items.length} vật phẩm</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {userQuest.status === 'available' && (
            <Button onClick={() => onAccept(userQuest)} className="flex-1">
              Nhận nhiệm vụ
            </Button>
          )}

          {userQuest.status === 'in_progress' && userQuest.progress >= quest.maxProgress && (
            <Button onClick={() => onComplete(userQuest)} className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Hoàn thành
            </Button>
          )}

          {userQuest.status === 'completed' && (
            <Button onClick={() => onClaim(userQuest)} className="flex-1">
              <Trophy className="h-4 w-4 mr-2" />
              Nhận thưởng
            </Button>
          )}

          {userQuest.status === 'in_progress' && userQuest.progress < quest.maxProgress && (
            <div className="flex-1 text-center text-sm text-gray-500 py-2">
              {getStatusLabel(userQuest.status)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
