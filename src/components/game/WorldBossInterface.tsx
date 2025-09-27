'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Crown, 
  Sword, 
  Shield, 
  Clock, 
  Users, 
  Trophy, 
  Zap,
  Timer,
  Target,
  Star,
  Award,
  ChevronUp,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { worldBossApi } from '@/lib/world-boss-api';
import { useAuth } from '@/components/providers/AuthProvider';
import { useWorldBossSocket } from '@/hooks/useWorldBossSocket';
import { WorldBossCombatModal, WorldBossCombatResult } from './WorldBossCombatModal';
import { toast } from 'sonner';

interface WorldBoss {
  id: number;
  name: string;
  description: string;
  level: number;
  maxHp: number;
  currentHp: number;
  status: string;
  currentPhase: number;
  totalDamageReceived: number;
  endTime?: string;
  image?: string;
  damagePhases: {
    phase1Threshold: number;
    phase2Threshold: number;
    phase3Threshold: number;
    currentPhase: number;
    totalDamageReceived: number;
  };
}

interface BossRanking {
  individual: Array<{
    rank: number;
    userId: number;
    username: string;
    totalDamage: number;
    attackCount: number;
    lastDamage: number;
  }>;
  guild: Array<{
    rank: number;
    guildId: number;
    guildName: string;
    totalDamage: number;
    attackCount: number;
    lastDamage: number;
  }>;
}

export function WorldBossInterface() {
  const { user } = useAuth();
  const [currentBoss, setCurrentBoss] = useState<WorldBoss | null>(null);
  const [rankings, setRankings] = useState<BossRanking | null>(null);
  const [loading, setLoading] = useState(false);
  const [attacking, setAttacking] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [lastAttackTime, setLastAttackTime] = useState<Date | null>(null);
  const [cooldownLeft, setCooldownLeft] = useState<number>(0);
  const [combatResult, setCombatResult] = useState<WorldBossCombatResult | null>(null);
  const [showCombatModal, setShowCombatModal] = useState(false);

  // WebSocket integration
  const { emitAttackBoss, emitGetBossStatus } = useWorldBossSocket({
    bossUpdate: (data) => {
      if (data) {
        console.log('🔥 World Boss Update Received:', {
          totalDamageReceived: data.damagePhases?.totalDamageReceived,
          currentPhase: data.damagePhases?.currentPhase,
          currentHp: data.currentHp,
          maxHp: data.maxHp
        });
        
        const fullBoss: WorldBoss = {
          ...data,
          currentPhase: Number(data.damagePhases?.currentPhase) || 1,
          totalDamageReceived: Number(data.damagePhases?.totalDamageReceived) || 0,
          maxHp: Number(data.maxHp),
          currentHp: Number(data.currentHp),
          level: Number(data.level),
          damagePhases: {
            phase1Threshold: Number(data.damagePhases?.phase1Threshold),
            phase2Threshold: Number(data.damagePhases?.phase2Threshold),
            phase3Threshold: Number(data.damagePhases?.phase3Threshold),
            currentPhase: Number(data.damagePhases?.currentPhase),
            totalDamageReceived: Number(data.damagePhases?.totalDamageReceived),
          },
        };
        setCurrentBoss(fullBoss);
      }
    },
    rankingUpdate: (data) => {
      if (data.rankings) {
        setRankings({
          individual: data.rankings.individual.map((p: any) => ({
            ...p,
            rank: Number(p.rank),
            userId: Number(p.userId),
            totalDamage: Number(p.totalDamage),
            attackCount: Number(p.attackCount),
            lastDamage: Number(p.lastDamage),
          })),
          guild: data.rankings.guild.map((g: any) => ({
            ...g,
            rank: Number(g.rank),
            guildId: Number(g.guildId),
            totalDamage: Number(g.totalDamage),
            attackCount: Number(g.attackCount),
            lastDamage: Number(g.lastDamage),
          })),
        });
      }
    },
    attackResult: (data) => {
      if (data.success) {
        toast.success(`Tấn công thành công! Gây ${Number(data.damage)?.toLocaleString() || 0} sát thương!`);
        setLastAttackTime(new Date());
        // Show combat modal
        setCombatResult({
          ...data,
          damage: Number(data.damage),
        } as WorldBossCombatResult);
        setShowCombatModal(true);
      } else {
        toast.error('Tấn công thất bại!');
      }
      setAttacking(false);
    },
    bossDefeated: (data) => {
      toast.success('🎉 Boss đã bị đánh bại! Phần thưởng đã được gửi vào hộp thư.');
      fetchCurrentBoss(); // Refresh to show no boss
    },
    newBossSpawn: (data) => {
      toast.info('🔥 Boss thế giới mới đã xuất hiện!');
      fetchCurrentBoss();
    },
    error: (data) => {
      toast.error(data.message || 'Có lỗi xảy ra');
    },
  });

  useEffect(() => {
    const initializeData = async () => {
      await fetchCurrentBoss();
      // Fetch rankings after boss is loaded
      await fetchRankings();
    };
    
    initializeData();
    
    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      initializeData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Auto-fetch rankings when boss changes
  useEffect(() => {
    if (currentBoss?.id) {
      fetchRankings();
    }
  }, [currentBoss?.id]);

  useEffect(() => {
    // Update countdown timer
    const timer = setInterval(() => {
      if (currentBoss?.endTime) {
        const now = new Date();
        const end = new Date(currentBoss.endTime);
        const diff = end.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('Đã kết thúc');
        }
      }

      // Update cooldown
      if (lastAttackTime) {
        const now = new Date();
        const cooldownEnd = new Date(lastAttackTime.getTime() + 60000); // 1 minute cooldown
        const cooldownDiff = cooldownEnd.getTime() - now.getTime();
        
        if (cooldownDiff > 0) {
          setCooldownLeft(Math.ceil(cooldownDiff / 1000));
        } else {
          setCooldownLeft(0);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [currentBoss?.endTime, lastAttackTime]);

  const fetchCurrentBoss = async () => {
    try {
      const boss = await worldBossApi.getCurrentBoss();
      if (boss) {
        // Ensure boss has all required fields and correct types
        const fullBoss: WorldBoss = {
          ...boss,
          currentPhase: Number(boss.damagePhases?.currentPhase) || 1,
          totalDamageReceived: Number(boss.damagePhases?.totalDamageReceived) || 0,
          maxHp: Number(boss.maxHp),
          currentHp: Number(boss.currentHp),
          level: Number(boss.level),
          damagePhases: {
            phase1Threshold: Number(boss.damagePhases?.phase1Threshold),
            phase2Threshold: Number(boss.damagePhases?.phase2Threshold),
            phase3Threshold: Number(boss.damagePhases?.phase3Threshold),
            currentPhase: Number(boss.damagePhases?.currentPhase),
            totalDamageReceived: Number(boss.damagePhases?.totalDamageReceived),
          },
        };
        setCurrentBoss(fullBoss);
      } else {
        setCurrentBoss(null);
      }
    } catch (error) {
      console.error('Failed to fetch current boss:', error);
    }
  };

  const fetchRankings = async () => {
    try {
      // Use current boss from state or try to get current boss if not available
      const bossId = currentBoss?.id;
      if (bossId) {
        const rankingData = await worldBossApi.getBossRankings(bossId);
        console.log('📊 Rankings data:', rankingData);
        setRankings({
          individual: rankingData.individual.map((p) => ({
            ...p,
            rank: Number(p.rank),
            userId: Number(p.userId),
            totalDamage: Number(p.totalDamage),
            attackCount: Number(p.attackCount),
            lastDamage: Number(p.lastDamage),
          })),
          guild: rankingData.guild.map((g) => ({
            ...g,
            rank: Number(g.rank),
            guildId: Number(g.guildId),
            totalDamage: Number(g.totalDamage),
            attackCount: Number(g.attackCount),
            lastDamage: Number(g.lastDamage),
          })),
        });
      } else {
        // Try to get current boss rankings without specific ID
        try {
          const rankingData = await worldBossApi.getBossRankings();
          if (rankingData && typeof rankingData === 'object' && 'individual' in rankingData) {
            setRankings({
              individual: rankingData.individual.map((p) => ({
                ...p,
                rank: Number(p.rank),
                userId: Number(p.userId),
                totalDamage: Number(p.totalDamage),
                attackCount: Number(p.attackCount),
                lastDamage: Number(p.lastDamage),
              })),
              guild: rankingData.guild.map((g) => ({
                ...g,
                rank: Number(g.rank),
                guildId: Number(g.guildId),
                totalDamage: Number(g.totalDamage),
                attackCount: Number(g.attackCount),
                lastDamage: Number(g.lastDamage),
              })),
            });
          }
        } catch (fallbackError) {
          console.log('No current boss rankings available');
        }
      }
    } catch (error) {
      console.error('Failed to fetch rankings:', error);
    }
  };

  const handleAttackBoss = async () => {
    if (!user || !currentBoss || cooldownLeft > 0) return;
    
    setAttacking(true);
    
    // Try WebSocket first, fallback to API
    if (emitAttackBoss) {
      emitAttackBoss();
    } else {
      try {
        const result = await worldBossApi.attackBoss();
        if (result.success) {
          toast.success(`Tấn công thành công! Gây ${Number(result.damage).toLocaleString()} sát thương!`);
          setLastAttackTime(new Date());
          // Show combat modal
          setCombatResult({
            ...result,
            damage: Number(result.damage),
          } as WorldBossCombatResult);
          setShowCombatModal(true);
          // Refresh data
          await fetchCurrentBoss();
          await fetchRankings();
        } else {
          toast.error('Tấn công thất bại!');
        }
      } catch (error) {
        toast.error('Lỗi khi tấn công boss!');
        console.error('Attack failed:', error);
      } finally {
        setAttacking(false);
      }
    }
  };

  const getPhaseMultiplier = (phase: number) => {
    switch (phase) {
      case 1: return 'x1';
      case 2: return 'x2';
      case 3: return 'x3';
      default: return 'x1';
    }
  };

  const getPhaseColor = (phase: number) => {
    switch (phase) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-yellow-600 bg-yellow-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const calculateHpPercentage = () => {
    if (!currentBoss) return 0;
    return Math.max(0, (currentBoss.currentHp / currentBoss.maxHp) * 100);
  };

  const calculateDamageProgress = () => {
    if (!currentBoss) return 0;
    const { damagePhases } = currentBoss;
    const totalDamage = damagePhases.totalDamageReceived;
    
    let maxThreshold = damagePhases.phase3Threshold;
    return Math.min(100, (totalDamage / maxThreshold) * 100);
  };

  const handleRefreshRankings = async () => {
    setLoading(true);
    try {
      await fetchRankings();
      toast.success('Đã cập nhật bảng xếp hạng!');
    } catch (error) {
      toast.error('Lỗi khi cập nhật bảng xếp hạng!');
    } finally {
      setLoading(false);
    }
  };

  if (!currentBoss) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Crown className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Không có Boss Thế Giới</h2>
            <p className="text-gray-500 text-center">
              Hiện tại không có boss thế giới nào đang hoạt động.<br />
              Hãy quay lại sau để tham gia chiến đấu!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-6">
      {/* Boss Header */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-red-600/10 -z-10" />
        <CardHeader className="relative">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0">
              {currentBoss.image ? (
                <div className="h-20 w-20 md:h-24 md:w-24 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={`http://localhost:3005${currentBoss.image}`} 
                    alt={currentBoss.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-20 w-20 md:h-24 md:w-24 bg-purple-100 rounded-full flex items-center justify-center">
                  <Crown className="h-12 w-12 text-purple-600" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  {currentBoss.name}
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  Lv.{currentBoss.level}
                </Badge>
                <Badge className={getPhaseColor(currentBoss.currentPhase)}>
                  {getPhaseMultiplier(currentBoss.currentPhase)}
                </Badge>
              </div>
              
              <CardDescription className="text-base mb-4">
                {currentBoss.description}
              </CardDescription>
              
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Thời gian còn lại: {timeLeft}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4 text-green-600" />
                  <span>Tổng sát thương: {currentBoss.damagePhases.totalDamageReceived.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* HP Bar - Based on Damage Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">HP</span>
              <span className="text-sm text-gray-600">
                {Math.max(0, currentBoss.maxHp - currentBoss.damagePhases.totalDamageReceived).toLocaleString()} / {currentBoss.maxHp.toLocaleString()}
              </span>
            </div>
            <Progress value={Math.max(0, 100 - calculateDamageProgress())} className="h-3" />
          </div>

          {/* Damage Progress Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tiến độ sát thương</span>
              <span className="text-sm text-gray-600">
                {currentBoss.damagePhases.totalDamageReceived.toLocaleString()} / {currentBoss.damagePhases.phase3Threshold.toLocaleString()}
              </span>
            </div>
            <Progress value={calculateDamageProgress()} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Phase 1: {currentBoss.damagePhases.phase1Threshold.toLocaleString()}</span>
              <span>Phase 2: {currentBoss.damagePhases.phase2Threshold.toLocaleString()}</span>
              <span>Phase 3: {currentBoss.damagePhases.phase3Threshold.toLocaleString()}</span>
            </div>
            <div className="text-xs text-center mt-1 text-blue-600">
              Phase {currentBoss.currentPhase}/3
            </div>
          </div>

          {/* Attack Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAttackBoss}
              disabled={attacking || cooldownLeft > 0 || !user}
              className="px-8 py-3 text-lg font-bold"
            >
              {attacking ? (
                <>
                  <Zap className="h-5 w-5 mr-2 animate-spin" />
                  Đang tấn công...
                </>
              ) : cooldownLeft > 0 ? (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  Cooldown ({cooldownLeft}s)
                </>
              ) : (
                <>
                  <Sword className="h-5 w-5 mr-2" />
                  Tấn công Boss
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      <Tabs defaultValue="individual" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="individual">Cá nhân</TabsTrigger>
            <TabsTrigger value="guild">Bang hội</TabsTrigger>
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshRankings}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
        
        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Bảng xếp hạng cá nhân
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tải bảng xếp hạng...</span>
                </div>
              ) : rankings?.individual.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có ai tấn công boss
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings?.individual.slice(0, 10).map((player, index) => (
                  <div
                    key={player.userId}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      player.userId === user?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index < 3 ? <Award className="h-4 w-4" /> : player.rank}
                      </div>
                      <div>
                        <div className="font-medium">{player.username}</div>
                        <div className="text-sm text-gray-600">
                          {player.attackCount} lần tấn công
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {player.totalDamage.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Lần cuối: {player.lastDamage.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="guild" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Bảng xếp hạng bang hội
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  <span>Đang tải bảng xếp hạng...</span>
                </div>
              ) : rankings?.guild.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Chưa có bang hội nào tấn công boss
                </div>
              ) : (
                <div className="space-y-2">
                  {rankings?.guild.slice(0, 10).map((guild, index) => (
                  <div
                    key={guild.guildId}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {index < 3 ? <Award className="h-4 w-4" /> : guild.rank}
                      </div>
                      <div>
                        <div className="font-medium">{guild.guildName}</div>
                        <div className="text-sm text-gray-600">
                          {guild.attackCount} lần tấn công
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {guild.totalDamage.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Lần cuối: {guild.lastDamage.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Combat Modal */}
      <WorldBossCombatModal
        isOpen={showCombatModal}
        onClose={() => setShowCombatModal(false)}
        combatResult={combatResult}
        bossName={currentBoss?.name || 'World Boss'}
        bossImage={currentBoss?.image}
        playerName={user?.username || 'Player'}
      />
    </div>
  );
}
