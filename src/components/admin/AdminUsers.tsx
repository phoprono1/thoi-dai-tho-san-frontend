'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Users, UserPlus, UserMinus, Crown, Eye, Shield, Heart, Search, Filter } from 'lucide-react';
import { User } from '@/types/game';
import { useState, useMemo } from 'react';
import api from '@/lib/api';

export default function AdminUsers() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [isBackfillingAll, setIsBackfillingAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'admin' | 'donor' | 'banned' | 'active'>('all');

  // Fetch all users
  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<User[]> => {
      try {
        const response = await adminApiEndpoints.getUsers();
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
  });

  // Fetch user stats with combat stats
  const { data: userStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['userStats', selectedUser?.id],
    queryFn: async (): Promise<{
      coreStats: {
        str: number;
        int: number;
        dex: number;
        vit: number;
        luk: number;
      };
      combatStats: {
        maxHp: number;
        maxMana: number;
        attack: number;
        defense: number;
        critRate: number;
        critDamage: number;
        dodgeRate: number;
        accuracy: number;
        lifesteal: number;
        armorPen: number;
        comboRate: number;
        counterRate: number;
      };
    } | null> => {
      if (!selectedUser?.id) return null;
      try {
        // Fetch combat stats from new endpoint
        const statsResponse = await api.get(`/user-stats/user/${selectedUser.id}/combat-stats`);
        return statsResponse.data;
      } catch (error) {
        console.error('Failed to fetch user stats:', error);
        return null;
      }
    },
    enabled: !!selectedUser?.id && isStatsDialogOpen,
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter(user => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.id.toString().includes(searchTerm);
      
      // Status filter
      let matchesStatus = true;
      switch (statusFilter) {
        case 'admin':
          matchesStatus = user.isAdmin === true;
          break;
        case 'donor':
          matchesStatus = user.isDonor === true;
          break;
        case 'banned':
          matchesStatus = user.isBanned === true;
          break;
        case 'active':
          matchesStatus = !user.isBanned && user.level > 1;
          break;
        default:
          matchesStatus = true;
      }
      
      return matchesSearch && matchesStatus;
    });
  }, [users, searchTerm, statusFilter]);

  const handleViewStats = (user: User) => {
    setSelectedUser(user);
    setIsStatsDialogOpen(true);
  };

  const handleBanUser = async (userId: number) => {
    try {
      await adminApiEndpoints.banUser(userId);
      toast.success('Đã ban user thành công!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi ban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleUnbanUser = async (userId: number) => {
    try {
      await adminApiEndpoints.unbanUser(userId);
      toast.success('Đã unban user thành công!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi unban user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePromoteToAdmin = async (userId: number) => {
    try {
      await adminApiEndpoints.promoteToAdmin(userId);
      toast.success('Đã promote user thành admin!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi promote user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDemoteFromAdmin = async (userId: number) => {
    try {
      await adminApiEndpoints.demoteFromAdmin(userId);
      toast.success('Đã demote user từ admin!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi demote user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePromoteToDonor = async (userId: number) => {
    try {
      await adminApiEndpoints.promoteToDonor(userId);
      toast.success('Đã đánh dấu user là donor!');
      refetch();
    } catch (error: unknown) {
      toast.error(`Lỗi promote donor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDemoteFromDonor = async (userId: number) => {
    try {
      await adminApiEndpoints.demoteFromDonor(userId);
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Users Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Quản lý người chơi trong hệ thống</p>
          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!confirm('Bạn có chắc muốn reset toàn bộ người chơi về level 1 và chỉ số mặc định không?')) return;
                try {
                  setIsBackfillingAll(true);
                  const res = await adminApiEndpoints.resetAllUsers();
                  toast.success(`Đã reset ${res?.data?.count || 0} người chơi!`);
                  refetch();
                } catch (err: unknown) {
                  toast.error(`Reset all users failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                } finally {
                  setIsBackfillingAll(false);
                }
              }}
              disabled={isBackfillingAll}
            >
              Reset All Users
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={async () => {
                if (!confirm('Bạn có chắc muốn chạy backfill cho toàn bộ user không?')) return;
                try {
                  setIsBackfillingAll(true);
                  const res = await adminApiEndpoints.backfillBatch();
                  const jobId = res?.data?.jobId || 'unknown';
                  toast.success(`Batch backfill enqueued (job ${jobId})`);
                  refetch();
                } catch (err: unknown) {
                  toast.error(`Backfill batch failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                } finally {
                  setIsBackfillingAll(false);
                }
              }}
              disabled={isBackfillingAll}
            >
              Backfill All Users
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by username or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(value: 'all' | 'admin' | 'donor' | 'banned' | 'active') => setStatusFilter(value)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active Users</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="donor">Donors</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Showing {filteredUsers.length} of {users?.length || 0} users
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users?.length || 0}</div>
              <p className="text-xs text-muted-foreground dark:text-gray-300">Người dùng đã đăng ký</p>
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
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer"
                  onClick={() => handleViewStats(user)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{user.username}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">ID: {user.id}</p>
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
                    <div className="text-right text-sm text-gray-600 dark:text-gray-300">
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

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!confirm(`Bạn có chắc muốn reset user "${user.username}" về level 1 và xóa toàn bộ tiến trình không?`)) return;
                          try {
                            const result = await adminApiEndpoints.resetUser(user.id);
                            toast.success(result.data?.message || 'Reset user thành công!');
                            refetch();
                          } catch (err: unknown) {
                            toast.error(`Reset user failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                          }
                        }}
                      >
                        Reset User
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

              {(!filteredUsers || filteredUsers.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {users && users.length > 0 && (searchTerm || statusFilter !== 'all')
                      ? 'Không tìm thấy user nào phù hợp với bộ lọc'
                      : 'Chưa có user nào trong hệ thống'
                    }
                  </p>
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
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">ID</p>
                        <p className="text-lg font-semibold">{selectedUser.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Username</p>
                        <p className="text-lg font-semibold">{selectedUser.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Level</p>
                        <p className="text-lg font-semibold">{selectedUser.level}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Gold</p>
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
                    <CardTitle>Core Stats</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isStatsLoading ? (
                      <div className="text-center py-8">Đang tải stats...</div>
                    ) : userStats ? (
                      <div className="space-y-6">
                        {/* Core Stats */}
                        <div>
                          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Chỉ số cơ bản</h3>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">STR</p>
                              <p className="text-xl font-bold text-red-600">{userStats.coreStats.str}</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">INT</p>
                              <p className="text-xl font-bold text-blue-600">{userStats.coreStats.int}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">DEX</p>
                              <p className="text-xl font-bold text-green-600">{userStats.coreStats.dex}</p>
                            </div>
                            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">VIT</p>
                              <p className="text-xl font-bold text-yellow-600">{userStats.coreStats.vit}</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">LUK</p>
                              <p className="text-xl font-bold text-purple-600">{userStats.coreStats.luk}</p>
                            </div>
                          </div>
                        </div>

                        {/* Combat Stats */}
                        <div>
                          <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">Combat Stats (Derived)</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Max HP</p>
                              <p className="text-xl font-bold text-red-600">{Math.floor(userStats.combatStats.maxHp)}</p>
                            </div>
                            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Max Mana</p>
                              <p className="text-xl font-bold text-blue-600">{Math.floor(userStats.combatStats.maxMana)}</p>
                            </div>
                            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Attack</p>
                              <p className="text-xl font-bold text-orange-600">{Math.floor(userStats.combatStats.attack)}</p>
                            </div>
                            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Defense</p>
                              <p className="text-xl font-bold text-green-600">{Math.floor(userStats.combatStats.defense)}</p>
                            </div>
                            <div className="text-center p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Crit Rate</p>
                              <p className="text-xl font-bold text-cyan-600">{userStats.combatStats.critRate.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Crit Damage</p>
                              <p className="text-xl font-bold text-teal-600">{userStats.combatStats.critDamage.toFixed(0)}%</p>
                            </div>
                            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Dodge Rate</p>
                              <p className="text-xl font-bold text-purple-600">{userStats.combatStats.dodgeRate.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Accuracy</p>
                              <p className="text-xl font-bold text-indigo-600">{userStats.combatStats.accuracy.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Lifesteal</p>
                              <p className="text-xl font-bold text-rose-600">{userStats.combatStats.lifesteal.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Armor Pen</p>
                              <p className="text-xl font-bold text-pink-600">{userStats.combatStats.armorPen.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-lime-50 dark:bg-lime-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Combo Rate</p>
                              <p className="text-xl font-bold text-lime-600">{userStats.combatStats.comboRate.toFixed(1)}%</p>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Counter Rate</p>
                              <p className="text-xl font-bold text-emerald-600">{userStats.combatStats.counterRate.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-300">
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
