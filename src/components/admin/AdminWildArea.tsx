'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, TreePine, BarChart3 } from 'lucide-react';

interface Monster {
  id: number;
  name: string;
  level: number;
  type: string;
  element: string;
  isActive: boolean;
}

interface WildAreaMonster {
  id: number;
  monsterId: number;
  monster: Monster;
  minLevel: number;
  maxLevel: number;
  spawnWeight: number;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface UpdateWildAreaMonsterData {
  minLevel?: number;
  maxLevel?: number;
  spawnWeight?: number;
  description?: string;
  isActive?: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message: string;
}

interface LevelDistribution {
  minLevel: number;
  maxLevel: number;
  count: number;
}

interface WildAreaStats {
  total: number;
  levelDistribution: LevelDistribution[];
}

export default function AdminWildArea() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedWildAreaMonster, setSelectedWildAreaMonster] = useState<WildAreaMonster | null>(null);
  const [createForm, setCreateForm] = useState({
    monsterId: '',
    minLevel: 1,
    maxLevel: 50,
    spawnWeight: 1.0,
    description: '',
  });

  const queryClient = useQueryClient();

  // Fetch wildarea monsters
  const { data: wildAreaMonsters, isLoading } = useQuery({
    queryKey: ['adminWildAreaMonsters'],
    queryFn: async (): Promise<WildAreaMonster[]> => {
      const response = await adminApiEndpoints.getWildAreaMonsters();
      return response.data || [];
    },
  });

  // Fetch all monsters for selection
  const { data: allMonsters } = useQuery({
    queryKey: ['adminAllMonsters'],
    queryFn: async (): Promise<Monster[]> => {
      const response = await adminApiEndpoints.getMonsters();
      return response.data || [];
    },
  });

  // Fetch wildarea stats
  const { data: stats } = useQuery<WildAreaStats>({
    queryKey: ['wildAreaStats'],
    queryFn: async (): Promise<WildAreaStats> => {
      const response = await adminApiEndpoints.getWildAreaStats();
      return response.data;
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: adminApiEndpoints.createWildAreaMonster,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWildAreaMonsters'] });
      queryClient.invalidateQueries({ queryKey: ['wildAreaStats'] });
      setIsCreateDialogOpen(false);
      setCreateForm({ monsterId: '', minLevel: 1, maxLevel: 50, spawnWeight: 1.0, description: '' });
      toast.success('Đã thêm monster vào khu dã ngoại!');
    },
    onError: (error: ApiError) => {
      toast.error(`Lỗi thêm monster: ${error.response?.data?.message || error.message}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateWildAreaMonsterData }) => adminApiEndpoints.updateWildAreaMonster(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWildAreaMonsters'] });
      queryClient.invalidateQueries({ queryKey: ['wildAreaStats'] });
      setIsEditDialogOpen(false);
      setSelectedWildAreaMonster(null);
      toast.success('Đã cập nhật monster khu dã ngoại!');
    },
    onError: (error: ApiError) => {
      toast.error(`Lỗi cập nhật monster: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: ({ id, hard }: { id: number; hard: boolean }) => adminApiEndpoints.deleteWildAreaMonster(id, hard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWildAreaMonsters'] });
      queryClient.invalidateQueries({ queryKey: ['wildAreaStats'] });
      toast.success('Đã xóa monster khỏi khu dã ngoại!');
    },
    onError: (error: ApiError) => {
      toast.error(`Lỗi xóa monster: ${error.response?.data?.message || error.message}`);
    },
  });

  const handleCreate = () => {
    if (!createForm.monsterId) {
      toast.error('Vui lòng chọn monster');
      return;
    }
    
    createMutation.mutate({
      monsterId: parseInt(createForm.monsterId),
      minLevel: createForm.minLevel,
      maxLevel: createForm.maxLevel,
      spawnWeight: createForm.spawnWeight,
      description: createForm.description || undefined,
    });
  };

  const handleUpdate = () => {
    if (!selectedWildAreaMonster) return;
    
    updateMutation.mutate({
      id: selectedWildAreaMonster.id,
      data: {
        minLevel: selectedWildAreaMonster.minLevel,
        maxLevel: selectedWildAreaMonster.maxLevel,
        spawnWeight: selectedWildAreaMonster.spawnWeight,
        description: selectedWildAreaMonster.description,
        isActive: selectedWildAreaMonster.isActive,
      },
    });
  };

  const handleDelete = (wildAreaMonster: WildAreaMonster, hard = false) => {
    const action = hard ? 'xóa vĩnh viễn' : 'vô hiệu hóa';
    if (!confirm(`Bạn có chắc muốn ${action} monster "${wildAreaMonster.monster.name}" khỏi khu dã ngoại không?`)) return;
    
    deleteMutation.mutate({ id: wildAreaMonster.id, hard });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải danh sách khu dã ngoại...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TreePine className="w-8 h-8" />
            Khu Dã Ngoại Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Quản lý monsters xuất hiện trong khu dã ngoại</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng Monsters</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">Monsters có thể xuất hiện</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Level Distribution</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  {stats.levelDistribution?.slice(0, 3).map((dist: LevelDistribution) => (
                    <div key={`${dist.minLevel}-${dist.maxLevel}`} className="flex justify-between">
                      <span>Level {dist.minLevel}-{dist.maxLevel}:</span>
                      <span className="font-medium">{dist.count} monsters</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Button */}
        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Monster vào Khu Dã Ngoại
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm Monster vào Khu Dã Ngoại</DialogTitle>
                <DialogDescription>
                  Chọn monster và thiết lập thông số xuất hiện trong khu dã ngoại
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="monster">Monster</Label>
                  <Select value={createForm.monsterId} onValueChange={(value) => setCreateForm({ ...createForm, monsterId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn monster" />
                    </SelectTrigger>
                    <SelectContent>
                      {allMonsters?.filter(m => m.isActive).map((monster) => (
                        <SelectItem key={monster.id} value={monster.id.toString()}>
                          {monster.name} (Lv.{monster.level}, {monster.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="minLevel">Min Level</Label>
                    <Input
                      id="minLevel"
                      type="number"
                      value={createForm.minLevel}
                      onChange={(e) => setCreateForm({ ...createForm, minLevel: parseInt(e.target.value) || 1 })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLevel">Max Level</Label>
                    <Input
                      id="maxLevel"
                      type="number"
                      value={createForm.maxLevel}
                      onChange={(e) => setCreateForm({ ...createForm, maxLevel: parseInt(e.target.value) || 50 })}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="spawnWeight">Spawn Weight</Label>
                  <Input
                    id="spawnWeight"
                    type="number"
                    step="0.1"
                    value={createForm.spawnWeight}
                    onChange={(e) => setCreateForm({ ...createForm, spawnWeight: parseFloat(e.target.value) || 1.0 })}
                    min="0.1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Trọng số xuất hiện (cao hơn = xuất hiện nhiều hơn)
                  </p>
                </div>

                <div>
                  <Label htmlFor="description">Mô tả (tùy chọn)</Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    placeholder="Ghi chú về monster này trong khu dã ngoại..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? 'Đang thêm...' : 'Thêm Monster'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Monsters List */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Monsters Khu Dã Ngoại</CardTitle>
            <CardDescription>
              Quản lý monsters có thể xuất hiện trong khu dã ngoại
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {wildAreaMonsters?.map((wildAreaMonster) => (
                <div
                  key={wildAreaMonster.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700"
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {wildAreaMonster.monster.name}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="default">
                          Monster Lv.{wildAreaMonster.monster.level}
                        </Badge>
                        <Badge variant="secondary">
                          Player Lv.{wildAreaMonster.minLevel}-{wildAreaMonster.maxLevel}
                        </Badge>
                        <Badge variant="outline">
                          Weight: {wildAreaMonster.spawnWeight}
                        </Badge>
                        <Badge variant={wildAreaMonster.monster.type === 'boss' ? 'destructive' : 'default'}>
                          {wildAreaMonster.monster.type}
                        </Badge>
                        {!wildAreaMonster.isActive && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </div>
                      {wildAreaMonster.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {wildAreaMonster.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedWildAreaMonster(wildAreaMonster);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(wildAreaMonster, false)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Vô hiệu hóa
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(wildAreaMonster, true)}
                    >
                      Xóa vĩnh viễn
                    </Button>
                  </div>
                </div>
              ))}

              {(!wildAreaMonsters || wildAreaMonsters.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-300">
                  <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Chưa có monster nào trong khu dã ngoại</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sửa Monster Khu Dã Ngoại</DialogTitle>
              <DialogDescription>
                Cập nhật thông số xuất hiện của {selectedWildAreaMonster?.monster.name}
              </DialogDescription>
            </DialogHeader>
            {selectedWildAreaMonster && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editMinLevel">Min Level</Label>
                    <Input
                      id="editMinLevel"
                      type="number"
                      value={selectedWildAreaMonster.minLevel}
                      onChange={(e) => setSelectedWildAreaMonster({ 
                        ...selectedWildAreaMonster, 
                        minLevel: parseInt(e.target.value) || 1 
                      })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editMaxLevel">Max Level</Label>
                    <Input
                      id="editMaxLevel"
                      type="number"
                      value={selectedWildAreaMonster.maxLevel}
                      onChange={(e) => setSelectedWildAreaMonster({ 
                        ...selectedWildAreaMonster, 
                        maxLevel: parseInt(e.target.value) || 50 
                      })}
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="editSpawnWeight">Spawn Weight</Label>
                  <Input
                    id="editSpawnWeight"
                    type="number"
                    step="0.1"
                    value={selectedWildAreaMonster.spawnWeight}
                    onChange={(e) => setSelectedWildAreaMonster({ 
                      ...selectedWildAreaMonster, 
                      spawnWeight: parseFloat(e.target.value) || 1.0 
                    })}
                    min="0.1"
                  />
                </div>

                <div>
                  <Label htmlFor="editDescription">Mô tả</Label>
                  <Textarea
                    id="editDescription"
                    value={selectedWildAreaMonster.description || ''}
                    onChange={(e) => setSelectedWildAreaMonster({ 
                      ...selectedWildAreaMonster, 
                      description: e.target.value 
                    })}
                    placeholder="Ghi chú về monster này..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={selectedWildAreaMonster.isActive}
                    onChange={(e) => setSelectedWildAreaMonster({ 
                      ...selectedWildAreaMonster, 
                      isActive: e.target.checked 
                    })}
                  />
                  <Label htmlFor="editIsActive">Kích hoạt</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Hủy
                  </Button>
                  <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}