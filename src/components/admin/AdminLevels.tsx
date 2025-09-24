'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
import { BarChart3 } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';

interface Level {
  id: number;
  level: number;
  experienceRequired: number;
  name?: string;
  rewards?: {
    gold?: number;
    items?: { itemId: number; quantity: number }[];
  };
  // Core attribute bonuses
  strength: number;
  intelligence: number;
  dexterity: number;
  vitality: number;
  luck: number;
  // Free attribute points rewarded
  attributePointsReward: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminLevels() {
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState({
    level: 1,
    experienceRequired: 100,
    strength: 0,
    intelligence: 0,
    dexterity: 0,
    vitality: 0,
    luck: 0,
    attributePointsReward: 5,
  });

  const queryClient = useQueryClient();

  // Fetch all levels
  const { data: levels, isLoading } = useQuery({
    queryKey: ['adminLevels'],
    queryFn: async (): Promise<Level[]> => {
      try {
        const response = await adminApiEndpoints.getLevels();
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
      strength: number;
      intelligence: number;
      dexterity: number;
      vitality: number;
      luck: number;
      attributePointsReward: number;
    }) => {
      return await adminApiEndpoints.createLevel(data);
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
        strength: number;
        intelligence: number;
        dexterity: number;
        vitality: number;
        luck: number;
        attributePointsReward: number;
      };
    }) => {
      return await adminApiEndpoints.updateLevel(id, data);
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
      return await adminApiEndpoints.deleteLevel(id);
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
      strength: 0,
      intelligence: 0,
      dexterity: 0,
      vitality: 0,
      luck: 0,
      attributePointsReward: 5,
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
      strength: level.strength,
      intelligence: level.intelligence,
      dexterity: level.dexterity,
      vitality: level.vitality,
      luck: level.luck,
      attributePointsReward: level.attributePointsReward,
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
      key: 'strength' as keyof Level,
      label: 'Strength',
      sortable: true,
    },
    {
      key: 'intelligence' as keyof Level,
      label: 'Intelligence',
      sortable: true,
    },
    {
      key: 'dexterity' as keyof Level,
      label: 'Dexterity',
      sortable: true,
    },
    {
      key: 'vitality' as keyof Level,
      label: 'Vitality',
      sortable: true,
    },
    {
      key: 'luck' as keyof Level,
      label: 'Luck',
      sortable: true,
    },
    {
      key: 'attributePointsReward' as keyof Level,
      label: 'Attribute Points',
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
              {levels?.length ? Math.max(...levels.map(l => l.strength + l.intelligence + l.dexterity + l.vitality + l.luck)) : 0}
            </div>
            <p className="text-xs text-muted-foreground">Tổng core attributes tại level cao nhất</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex space-x-2 mt-4 lg:col-span-3">
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await adminApiEndpoints.exportLevelsTemplate();
              const blob = new Blob([res.data]);
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'levels-template.csv';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (err) {
              console.error(err);
              toast.error('Không thể tải template');
            }
          }}>
            Tải mẫu
          </Button>
            <Button size="sm" variant="ghost" onClick={async () => {
              try {
                const res = await adminApiEndpoints.exportLevels();
                const blob = new Blob([res.data]);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'levels-export.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch (e) {
                console.error('Download all levels failed', e);
                toast.error('Không thể tải toàn bộ levels');
              }
            }}>
              Tải toàn bộ
            </Button>

          <input id="levels-import-input" type="file" accept=".csv" className="hidden" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            const form = new FormData();
            form.append('file', file);
            form.append('sync', 'true');
            try {
              console.info('Uploading levels CSV', file.name, file.size);
              toast('Uploading file...');
              const resp = await adminApiEndpoints.importLevels(form);
              const data = resp.data;
              console.info('Import response', data);
              if (data?.result) {
                const parsed = data.result.parsed || data.parsed || 0;
                const parseErrors = data.result.result?.parseErrors || data.result.parseErrors || [];
                if (parseErrors.length > 0) {
                  toast.error(`Import completed with ${parseErrors.length} parse errors (check console)`);
                  console.error('Import parseErrors', parseErrors, data);
                } else {
                  toast.success(`Import finished, parsed ${parsed} rows`);
                }
              } else {
                toast.success('Đã gửi import job: ' + (data.jobId || 'unknown'));
              }
            } catch (errUnknown: unknown) {
              console.error('Import request failed', errUnknown);
              const respErr = errUnknown as unknown as { response?: { data?: { message?: string }; statusText?: string }; message?: string };
              let msg = 'Lỗi khi import file';
              if (respErr?.response) {
                msg = respErr.response.data?.message || respErr.response.statusText || respErr.message || msg;
                console.error('Server response error', respErr.response);
              } else if (errUnknown instanceof Error) {
                msg = errUnknown.message;
              }
              toast.error(String(msg));
            } finally {
              try { (e.target as HTMLInputElement).value = ''; } catch { }
            }
          }} />
          <Button size="sm" className="ml-2" onClick={() => document.getElementById('levels-import-input')?.click()}>Import CSV</Button>
        </div>
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
              <Label>Core Attributes (bonuses for this level)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="strength" className="text-sm">Strength</Label>
                  <Input
                    id="strength"
                    type="number"
                    min="0"
                    value={formData.strength}
                    onChange={(e) => setFormData({...formData, strength: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="intelligence" className="text-sm">Intelligence</Label>
                  <Input
                    id="intelligence"
                    type="number"
                    min="0"
                    value={formData.intelligence}
                    onChange={(e) => setFormData({...formData, intelligence: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="dexterity" className="text-sm">Dexterity</Label>
                  <Input
                    id="dexterity"
                    type="number"
                    min="0"
                    value={formData.dexterity}
                    onChange={(e) => setFormData({...formData, dexterity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="vitality" className="text-sm">Vitality</Label>
                  <Input
                    id="vitality"
                    type="number"
                    min="0"
                    value={formData.vitality}
                    onChange={(e) => setFormData({...formData, vitality: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="luck" className="text-sm">Luck</Label>
                  <Input
                    id="luck"
                    type="number"
                    min="0"
                    value={formData.luck}
                    onChange={(e) => setFormData({...formData, luck: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="attributePointsReward" className="text-sm">Attribute Points Reward</Label>
                  <Input
                    id="attributePointsReward"
                    type="number"
                    min="0"
                    value={formData.attributePointsReward}
                    onChange={(e) => setFormData({...formData, attributePointsReward: parseInt(e.target.value) || 5})}
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
