'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Level {
  id: number;
  level: number;
  experienceRequired: number;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLevels() {
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState({
    level: 1,
    experienceRequired: 100,
    maxHp: 100,
    maxMp: 50,
    attack: 10,
    defense: 5,
    speed: 8,
  });

  const queryClient = useQueryClient();

  // Fetch all levels
  const { data: levels, isLoading } = useQuery({
    queryKey: ['adminLevels'],
    queryFn: async (): Promise<Level[]> => {
      try {
        const response = await api.get('/levels');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch levels:', error);
        return [];
      }
    },
  });

  // Create level mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      level: number;
      experienceRequired: number;
      maxHp: number;
      maxMp: number;
      attack: number;
      defense: number;
      speed: number;
    }) => {
      return await api.post('/levels', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLevels'] });
      toast.success('Đã tạo level thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo level: ${error.message}`);
    },
  });

  // Update level mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: {
      id: number;
      data: {
        level: number;
        experienceRequired: number;
        maxHp: number;
        maxMp: number;
        attack: number;
        defense: number;
        speed: number;
      };
    }) => {
      return await api.put(`/levels/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLevels'] });
      toast.success('Đã cập nhật level thành công!');
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật level: ${error.message}`);
    },
  });

  // Delete level mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await api.delete(`/levels/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLevels'] });
      toast.success('Đã xóa level thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa level: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      level: 1,
      experienceRequired: 100,
      maxHp: 100,
      maxMp: 50,
      attack: 10,
      defense: 5,
      speed: 8,
    });
    setEditingLevel(null);
  };

  const handleCreateLevel = () => {
    if (formData.level <= 0) {
      toast.error('Level phải lớn hơn 0!');
      return;
    }

    createMutation.mutate(formData);
  };

  const handleUpdateLevel = () => {
    if (!editingLevel || formData.level <= 0) {
      toast.error('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    updateMutation.mutate({ id: editingLevel.id, data: formData });
  };

  const handleDeleteLevel = (level: Level) => {
    if (!confirm(`Bạn có chắc muốn xóa level ${level.level}?`)) return;
    deleteMutation.mutate(level.id);
  };

  const startEdit = (level: Level) => {
    setEditingLevel(level);
    setFormData({
      level: level.level,
      experienceRequired: level.experienceRequired,
      maxHp: level.maxHp,
      maxMp: level.maxMp,
      attack: level.attack,
      defense: level.defense,
      speed: level.speed,
    });
  };

  const columns = [
    {
      key: 'level' as keyof Level,
      label: 'Level',
      sortable: true,
    },
    {
      key: 'experienceRequired' as keyof Level,
      label: 'EXP yêu cầu',
      sortable: true,
    },
    {
      key: 'maxHp' as keyof Level,
      label: 'Max HP',
      sortable: true,
    },
    {
      key: 'maxMp' as keyof Level,
      label: 'Max MP',
      sortable: true,
    },
    {
      key: 'attack' as keyof Level,
      label: 'Attack',
      sortable: true,
    },
    {
      key: 'defense' as keyof Level,
      label: 'Defense',
      sortable: true,
    },
    {
      key: 'speed' as keyof Level,
      label: 'Speed',
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Levels</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{levels?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Level đã cấu hình</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Level</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {levels?.length ? Math.max(...levels.map(l => l.level)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Level cao nhất</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng EXP</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {levels?.reduce((sum, level) => sum + level.experienceRequired, 0).toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">Tổng EXP để lên level max</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Stats</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {levels?.length ? Math.max(...levels.map(l => l.maxHp)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Max HP tại level cao nhất</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create/Edit Form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>
              {editingLevel ? 'Chỉnh sửa Level' : 'Tạo Level mới'}
            </CardTitle>
            <CardDescription>
              {editingLevel ? 'Cập nhật thông tin level' : 'Thêm level mới vào hệ thống'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  type="number"
                  min="1"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experienceRequired">EXP yêu cầu</Label>
                <Input
                  id="experienceRequired"
                  type="number"
                  min="0"
                  value={formData.experienceRequired}
                  onChange={(e) => setFormData({...formData, experienceRequired: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stats</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxHp" className="text-sm">Max HP</Label>
                  <Input
                    id="maxHp"
                    type="number"
                    min="1"
                    value={formData.maxHp}
                    onChange={(e) => setFormData({...formData, maxHp: parseInt(e.target.value) || 1})}
                  />
                </div>
                <div>
                  <Label htmlFor="maxMp" className="text-sm">Max MP</Label>
                  <Input
                    id="maxMp"
                    type="number"
                    min="0"
                    value={formData.maxMp}
                    onChange={(e) => setFormData({...formData, maxMp: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="attack" className="text-sm">Attack</Label>
                  <Input
                    id="attack"
                    type="number"
                    min="0"
                    value={formData.attack}
                    onChange={(e) => setFormData({...formData, attack: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="defense" className="text-sm">Defense</Label>
                  <Input
                    id="defense"
                    type="number"
                    min="0"
                    value={formData.defense}
                    onChange={(e) => setFormData({...formData, defense: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="speed" className="text-sm">Speed</Label>
                  <Input
                    id="speed"
                    type="number"
                    min="0"
                    value={formData.speed}
                    onChange={(e) => setFormData({...formData, speed: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={editingLevel ? handleUpdateLevel : handleCreateLevel}
                className="flex-1"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingLevel ? 'Cập nhật' : 'Tạo Level'}
              </Button>
              {editingLevel && (
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Levels List */}
        <div className="lg:col-span-2">
          <DataTable
            title="Danh sách Levels"
            data={levels || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm level..."
            searchFields={['level']}
            onCreate={() => resetForm()}
            onEdit={startEdit}
            onDelete={handleDeleteLevel}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
