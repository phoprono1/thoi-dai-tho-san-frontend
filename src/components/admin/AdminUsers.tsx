'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Users, UserPlus, UserMinus, Crown, Eye, Shield, Heart } from 'lucide-react';
import { User, UserStats } from '@/types/game';
import { useState } from 'react';

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<User[]> => {
      try {
        const response = await api.get('/users');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  // Fetch user stats
  const { data: userStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['userStats', selectedUser?.id],
    queryFn: async (): Promise<UserStats | null> => {
      if (!selectedUser?.id) return null;
      try {
        const response = await api.get(`/user-stats/user/${selectedUser.id}`);
        return response.data;
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        return null;
      }
    },
    enabled: !!selectedUser?.id && isStatsDialogOpen,
  });

  const handleViewStats = (user: User) => {
    setSelectedUser(user);
    setIsStatsDialogOpen(true);
  };

  const handleBanUser = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/ban`);
      toast.success('Đã ban user thành công!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi ban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/unban`);
      toast.success('Đã unban user thành công!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi unban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePromoteToAdmin = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/promote`, { type: 'admin' });
      toast.success('Đã promote user thành admin!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi promote user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDemoteFromAdmin = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/demote`, { type: 'admin' });
      toast.success('Đã demote user từ admin!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi demote user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePromoteToDonor = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/promote`, { type: 'donor' });
      toast.success('Đã đánh dấu user là donor!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi promote donor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDemoteFromDonor = async (userId: number) => {
    try {
      await api.post(`/users/${userId}/demote`, { type: 'donor' });
      toast.success('Đã bỏ đánh dấu donor!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi demote donor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải danh sách users...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Quản lý người chơi trong hệ thống</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Người dùng đã đăng ký</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.level > 1).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Users level &gt; 1</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Level Users</CardTitle>
              <UserMinus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users?.filter(u => u.level >= 10).length || 0}
              </div>
              <p className="text-xs text-muted-foreground">Users level &gt;= 10</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Users</CardTitle>
            <CardDescription>
              Quản lý tất cả người chơi trong hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleViewStats(user)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-sm text-gray-600">ID: {user.id}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="default">
                          Level {user.level}
                        </Badge>
                        {user.characterClass && (
                          <Badge variant="secondary">
                            {user.characterClass.name}
                          </Badge>
                        )}
                        {user.isAdmin && (
                          <Badge variant="destructive">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.isDonor && (
                          <Badge variant="outline">
                            <Heart className="w-3 h-3 mr-1" />
                            Donor
                          </Badge>
                        )}
                        {user.isBanned && (
                          <Badge variant="destructive">
                            Banned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="text-right text-sm text-gray-600">
                      <p>Level: {user.level || 1}</p>
                      <p>EXP: {user.experience || 0}</p>
                      <p>Gold: {user.gold || 0}</p>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewStats(user);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Stats
                      </Button>

                      {user.isBanned ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUnbanUser(user.id);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Unban
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBanUser(user.id);
                          }}
                        >
                          <UserMinus className="w-4 h-4 mr-1" />
                          Ban
                        </Button>
                      )}

                      {user.isAdmin ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoteFromAdmin(user.id);
                          }}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Demote Admin
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromoteToAdmin(user.id);
                          }}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          Promote Admin
                        </Button>
                      )}

                      {user.isDonor ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDemoteFromDonor(user.id);
                          }}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Remove Donor
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePromoteToDonor(user.id);
                          }}
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          Mark Donor
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {(!users || users.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có user nào trong hệ thống</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Stats Dialog */}
        <Dialog open={isStatsDialogOpen} onOpenChange={setIsStatsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>User Stats - {selectedUser?.username}</DialogTitle>
              <DialogDescription>
                Chi tiết thông tin và stats của người chơi
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cơ bản</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">ID</p>
                        <p className="text-lg font-semibold">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Username</p>
                        <p className="text-lg font-semibold">{selectedUser.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Level</p>
                        <p className="text-lg font-semibold">{selectedUser.level}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Gold</p>
                        <p className="text-lg font-semibold">{selectedUser.gold}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedUser.isAdmin && (
                        <Badge variant="destructive">
                          <Shield className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                      )}
                      {selectedUser.isDonor && (
                        <Badge variant="outline">
                          <Heart className="w-3 h-3 mr-1" />
                          Donor
                        </Badge>
                      )}
                      {selectedUser.isBanned && (
                        <Badge variant="destructive">
                          Banned
                        </Badge>
                      )}
                      {selectedUser.characterClass && (
                        <Badge variant="secondary">
                          {selectedUser.characterClass.name}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* User Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Stats Chi Tiết</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isStatsLoading ? (
                      <div className="text-center py-8">Đang tải stats...</div>
                    ) : userStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">HP</p>
                          <p className="text-xl font-bold text-red-600">
                            {userStats.currentHp}/{userStats.maxHp}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Attack</p>
                          <p className="text-xl font-bold text-blue-600">{userStats.attack}</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Defense</p>
                          <p className="text-xl font-bold text-green-600">{userStats.defense}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Strength</p>
                          <p className="text-xl font-bold text-purple-600">{userStats.strength}</p>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Intelligence</p>
                          <p className="text-xl font-bold text-indigo-600">{userStats.intelligence}</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Dexterity</p>
                          <p className="text-xl font-bold text-yellow-600">{userStats.dexterity}</p>
                        </div>
                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Vitality</p>
                          <p className="text-xl font-bold text-pink-600">{userStats.vitality}</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Luck</p>
                          <p className="text-xl font-bold text-orange-600">{userStats.luck}</p>
                        </div>
                        <div className="text-center p-3 bg-cyan-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Crit Rate</p>
                          <p className="text-xl font-bold text-cyan-600">{userStats.critRate}%</p>
                        </div>
                        <div className="text-center p-3 bg-teal-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Crit Damage</p>
                          <p className="text-xl font-bold text-teal-600">{userStats.critDamage}%</p>
                        </div>
                        <div className="text-center p-3 bg-lime-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Combo Rate</p>
                          <p className="text-xl font-bold text-lime-600">{userStats.comboRate}%</p>
                        </div>
                        <div className="text-center p-3 bg-emerald-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Counter Rate</p>
                          <p className="text-xl font-bold text-emerald-600">{userStats.counterRate}%</p>
                        </div>
                        <div className="text-center p-3 bg-violet-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Lifesteal</p>
                          <p className="text-xl font-bold text-violet-600">{userStats.lifesteal}%</p>
                        </div>
                        <div className="text-center p-3 bg-rose-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Armor Pen</p>
                          <p className="text-xl font-bold text-rose-600">{userStats.armorPen}%</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Dodge Rate</p>
                          <p className="text-xl font-bold text-slate-600">{userStats.dodgeRate}%</p>
                        </div>
                        <div className="text-center p-3 bg-stone-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-600">Accuracy</p>
                          <p className="text-xl font-bold text-stone-600">{userStats.accuracy}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Không thể tải stats của user này
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
