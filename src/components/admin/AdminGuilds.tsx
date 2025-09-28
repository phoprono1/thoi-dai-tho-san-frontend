'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Building, Shield, Sword, Zap, Heart, Star, Settings, RotateCcw, AlertTriangle } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { toast } from 'sonner';

interface Guild {
  id: number;
  name: string;
  description: string;
  leaderId: number;
  level: number;
  experience: number;
  goldFund: number; // Changed from gold to goldFund to match entity
  memberCount: number;
  maxMembers: number;
  createdAt: string;
  updatedAt: string;
}

interface GlobalGuildBuff {
  id: number;
  guildLevel: number;
  statBuffs: {
    strength: number;
    intelligence: number;
    dexterity: number;
    vitality: number;
    luck: number;
  };
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminGuilds() {
  const [selectedGuild, setSelectedGuild] = useState<Guild | null>(null);
  const [editingBuffs, setEditingBuffs] = useState<{ [key: number]: GlobalGuildBuff }>({});
  const [resetGuildId, setResetGuildId] = useState<number | null>(null);
  const [resetLevel, setResetLevel] = useState<number>(1);
  const [resetExperience, setResetExperience] = useState<number>(0);
  const queryClient = useQueryClient();

  // Fetch all guilds
  const { data: guilds, isLoading } = useQuery({
    queryKey: ['adminGuilds'],
    queryFn: async (): Promise<Guild[]> => {
      try {
        const response = await api.get('/guild/admin/all');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch guilds:', error);
        return [];
      }
    },
  });

  // Fetch all global guild buffs
  const { data: globalGuildBuffs, isLoading: isLoadingBuffs } = useQuery({
    queryKey: ['globalGuildBuffs'],
    queryFn: async (): Promise<GlobalGuildBuff[]> => {
      try {
        const response = await api.get('/global-guild-buffs/admin/all');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch global guild buffs:', error);
        return [];
      }
    },
  });

  // Update global guild buff mutation
  const updateBuffMutation = useMutation({
    mutationFn: async ({ level, buffs }: { level: number; buffs: any }) => {
      const response = await api.put(`/global-guild-buffs/admin/level/${level}`, buffs);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalGuildBuffs'] });
      toast.success('Guild buff đã được cập nhật!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi cập nhật guild buff: ${error.response?.data?.message || error.message}`);
    },
  });

  // Reset guild level mutation
  const resetGuildLevelMutation = useMutation({
    mutationFn: async ({ guildId, level, experience }: { guildId: number; level: number; experience: number }) => {
      const response = await api.put(`/guild/admin/${guildId}/level`, { level, experience });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGuilds'] });
      toast.success('Guild level đã được reset!');
      setResetGuildId(null);
      setResetLevel(1);
      setResetExperience(0);
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi reset guild level: ${error.response?.data?.message || error.message}`);
    },
  });

  // Initialize global guild buffs mutation
  const initializeBuffsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/global-guild-buffs/admin/initialize');
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['globalGuildBuffs'] });
      toast.success('Đã khởi tạo global guild buffs!');
    },
    onError: () => {
      toast.error('Lỗi khi khởi tạo buffs!');
    },
  });

  const columns = [
    {
      key: 'id' as keyof Guild,
      label: 'ID',
      sortable: true,
    },
    {
      key: 'name' as keyof Guild,
      label: 'Tên Guild',
      sortable: true,
    },
    {
      key: 'leaderId' as keyof Guild,
      label: 'Leader ID',
      sortable: true,
    },
    {
      key: 'level' as keyof Guild,
      label: 'Level',
      sortable: true,
    },
    {
      key: 'memberCount' as keyof Guild,
      label: 'Thành viên',
      render: (value: unknown, item: Guild) => `${value}/${item.maxMembers}`,
      sortable: true,
    },
    {
      key: 'experience' as keyof Guild,
      label: 'EXP',
      sortable: true,
    },
    {
      key: 'goldFund' as keyof Guild,
      label: 'Gold Fund',
      sortable: true,
    },
    {
      key: 'createdAt' as keyof Guild,
      label: 'Ngày tạo',
      render: (value: unknown) => new Date(value as string).toLocaleDateString('vi-VN'),
      sortable: true,
    },
    {
      key: 'actions' as keyof Guild,
      label: 'Actions',
      render: (value: unknown, item: Guild) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setResetGuildId(item.id);
              setResetLevel(item.level);
              setResetExperience(item.experience);
            }}
            className="flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            Reset Level
          </Button>
        </div>
      ),
      sortable: false,
    },
  ];

  const handleUpdateBuff = (level: number, buff: GlobalGuildBuff) => {
    updateBuffMutation.mutate({
      level,
      buffs: {
        statBuffs: buff.statBuffs,
        description: buff.description,
        isActive: buff.isActive,
      },
    });
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'strength': return <Sword className="h-4 w-4 text-red-500" />;
      case 'intelligence': return <Zap className="h-4 w-4 text-blue-500" />;
      case 'dexterity': return <Star className="h-4 w-4 text-green-500" />;
      case 'vitality': return <Heart className="h-4 w-4 text-pink-500" />;
      case 'luck': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Quản lý Guild</h1>
        <p className="text-muted-foreground">Quản lý guild và buff system</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="buffs">Guild Buffs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Guilds</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{guilds?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Guild đã tạo</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng thành viên</CardTitle>
                <Building className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {guilds?.reduce((sum, guild) => sum + guild.memberCount, 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">Thành viên trong tất cả guild</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Level trung bình</CardTitle>
                <Building className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {guilds?.length ?
                    Math.round(guilds.reduce((sum, guild) => sum + guild.level, 0) / guilds.length)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">Level trung bình của guild</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Gold Fund</CardTitle>
                <Building className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {guilds?.reduce((sum, guild) => sum + guild.goldFund, 0).toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Tổng gold fund trong tất cả guild</p>
              </CardContent>
            </Card>
          </div>
          <DataTable
            title="Danh sách Guilds"
            data={guilds || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm guild..."
            searchFields={['name', 'description']}
            loading={isLoading}
            actions={false}
          />
        </TabsContent>

        <TabsContent value="buffs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Global Guild Buff System
                  </CardTitle>
                  <CardDescription>
                    Quản lý buff chỉ số toàn cục cho tất cả guild. Tất cả guild cùng level sẽ có cùng buff.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => initializeBuffsMutation.mutate()}
                  disabled={initializeBuffsMutation.isPending}
                  variant="outline"
                >
                  {initializeBuffsMutation.isPending ? 'Đang khởi tạo...' : 'Khởi tạo Global Buffs'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((level) => {
                  const buff = globalGuildBuffs?.find((b: GlobalGuildBuff) => b.guildLevel === level);
                  const isEditing = editingBuffs[buff?.id || 0];
                  
                  return (
                    <Card key={level} className="border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Guild Level {level}</CardTitle>
                        <CardDescription className="text-xs">
                          {buff?.description || `Buffs for level ${level} guilds`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {buff ? (
                          <>
                            {Object.entries(buff.statBuffs).map(([stat, value]) => (
                              <div key={stat} className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  {getStatIcon(stat)}
                                  <span className="text-xs capitalize">{stat.slice(0, 3)}</span>
                                </div>
                                {isEditing ? (
                                  <Input
                                    type="number"
                                    value={isEditing.statBuffs[stat as keyof typeof isEditing.statBuffs]}
                                    onChange={(e) => {
                                      const newBuffs = { ...editingBuffs };
                                      newBuffs[buff.id].statBuffs[stat as keyof typeof buff.statBuffs] = parseInt(e.target.value) || 0;
                                      setEditingBuffs(newBuffs);
                                    }}
                                    className="h-6 w-16 text-xs"
                                  />
                                ) : (
                                  <span className="text-xs font-medium">+{value}</span>
                                )}
                              </div>
                            ))}
                            <div className="flex gap-1 mt-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      handleUpdateBuff(level, isEditing);
                                      const newBuffs = { ...editingBuffs };
                                      delete newBuffs[buff.id];
                                      setEditingBuffs(newBuffs);
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 text-xs"
                                    onClick={() => {
                                      const newBuffs = { ...editingBuffs };
                                      delete newBuffs[buff.id];
                                      setEditingBuffs(newBuffs);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-xs"
                                  onClick={() => {
                                    setEditingBuffs({
                                      ...editingBuffs,
                                      [buff.id]: { ...buff }
                                    });
                                  }}
                                >
                                  <Settings className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-xs text-muted-foreground">Chưa có buff cho level này</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Guild Level Dialog */}
      <Dialog open={resetGuildId !== null} onOpenChange={() => setResetGuildId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Reset Guild Level
            </DialogTitle>
            <DialogDescription>
              Thay đổi level và experience của guild. Thao tác này sẽ ảnh hưởng đến guild buffs của tất cả thành viên.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reset-level">Guild Level (1-20)</Label>
              <Input
                id="reset-level"
                type="number"
                min="1"
                max="20"
                value={resetLevel}
                onChange={(e) => setResetLevel(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div>
              <Label htmlFor="reset-experience">Experience</Label>
              <Input
                id="reset-experience"
                type="number"
                min="0"
                value={resetExperience}
                onChange={(e) => setResetExperience(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetGuildId(null)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => {
                if (resetGuildId) {
                  resetGuildLevelMutation.mutate({
                    guildId: resetGuildId,
                    level: resetLevel,
                    experience: resetExperience,
                  });
                }
              }}
              disabled={resetGuildLevelMutation.isPending}
            >
              {resetGuildLevelMutation.isPending ? 'Đang reset...' : 'Reset Guild Level'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
