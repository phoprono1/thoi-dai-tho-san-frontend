'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Calendar, Clock, Trophy, Upload, Image } from 'lucide-react';
import { api } from '@/lib/api-client';
import { worldBossApi, BossTemplate, CreateBossFromTemplateDto, Item, itemsApi, ItemReward } from '@/lib/world-boss-api';

interface BossSchedule {
  id: number;
  name: string;
  description?: string;
  dayOfWeek: string;
  startTime: string;
  durationMinutes: number;
  isActive: boolean;
  timezone: string;
  bossTemplate: {
    name: string;
    description: string;
    level: number;
    image?: string;
    stats: {
      attack: number;
      defense: number;
      critRate: number;
      critDamage: number;
    };
    damagePhases: {
      phase1Threshold: number;
      phase2Threshold: number;
      phase3Threshold: number;
    };
    rewards: {
      individual: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2: { gold: number; experience: number; items: unknown[] };
        top3: { gold: number; experience: number; items: unknown[] };
        top4to10: { gold: number; experience: number; items: unknown[] };
        top11to30: { gold: number; experience: number; items: unknown[] };
      };
      guild: {
        top1: { gold: number; experience: number; items: unknown[] };
        top2to5: { gold: number; experience: number; items: unknown[] };
        top6to10: { gold: number; experience: number; items: unknown[] };
      };
    };
  };
}

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
  scheduleId?: number;
  rewards: {
    individual: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2: { gold: number; experience: number; items: unknown[] };
      top3: { gold: number; experience: number; items: unknown[] };
      top4to10: { gold: number; experience: number; items: unknown[] };
      top11to30: { gold: number; experience: number; items: unknown[] };
    };
    guild: {
      top1: { gold: number; experience: number; items: unknown[] };
      top2to5: { gold: number; experience: number; items: unknown[] };
      top6to10: { gold: number; experience: number; items: unknown[] };
    };
  };
  createdAt: string;
  updatedAt: string;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Thứ 2' },
  { value: 'tuesday', label: 'Thứ 3' },
  { value: 'wednesday', label: 'Thứ 4' },
  { value: 'thursday', label: 'Thứ 5' },
  { value: 'friday', label: 'Thứ 6' },
  { value: 'saturday', label: 'Thứ 7' },
  { value: 'sunday', label: 'Chủ nhật' },
];

export function AdminWorldBoss() {
  const [schedules, setSchedules] = useState<BossSchedule[]>([]);
  const [currentBoss, setCurrentBoss] = useState<WorldBoss | null>(null);
  const [templates, setTemplates] = useState<BossTemplate[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BossTemplate | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<number | null>(null);
  const [editingRewards, setEditingRewards] = useState(false);
  const [customRewards, setCustomRewards] = useState<any>(null);
  const [deletingScheduleId, setDeletingScheduleId] = useState<number | null>(null);
  const [editingBoss, setEditingBoss] = useState<any>(null);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [deletingBossId, setDeletingBossId] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dayOfWeek: '',
    startTime: '',
    durationMinutes: 120,
    isActive: true,
    bossTemplate: {
      name: '',
      description: '',
      level: 50,
      image: '',
      stats: {
        attack: 5000,
        defense: 3000,
        critRate: 15,
        critDamage: 200,
      },
      damagePhases: {
        phase1Threshold: 1000000,
        phase2Threshold: 3000000,
        phase3Threshold: 5000000,
      },
      rewards: {
        individual: {
          top1: { gold: 100000, experience: 50000, items: [] },
          top2: { gold: 70000, experience: 35000, items: [] },
          top3: { gold: 50000, experience: 25000, items: [] },
          top4to10: { gold: 30000, experience: 15000, items: [] },
          top11to30: { gold: 15000, experience: 7500, items: [] },
        },
        guild: {
          top1: { gold: 200000, experience: 100000, items: [] },
          top2to5: { gold: 100000, experience: 50000, items: [] },
          top6to10: { gold: 50000, experience: 25000, items: [] },
        },
      },
    },
  });

  useEffect(() => {
    fetchSchedules();
    fetchCurrentBoss();
    fetchTemplates();
    fetchItems();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/world-boss/schedule');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchCurrentBoss = async () => {
    try {
      const response = await api.get('/world-boss/current');
      setCurrentBoss(response.data);
    } catch (error) {
      console.error('Failed to fetch current boss:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await worldBossApi.getActiveTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchItems = async () => {
    try {
      const data = await itemsApi.getAllItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleCreateSchedule = async () => {
    setLoading(true);
    try {
      await api.post('/world-boss/schedule', formData);
      toast.success('Tạo lịch boss thành công!');
      fetchSchedules();
      resetForm();
    } catch {
      toast.error('Lỗi khi tạo lịch boss!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManualBoss = async () => {
    setLoading(true);
    try {
      await api.post('/world-boss', {
        name: formData.bossTemplate.name,
        description: formData.bossTemplate.description,
        maxHp: 999999999,
        level: formData.bossTemplate.level,
        stats: formData.bossTemplate.stats,
        durationMinutes: formData.durationMinutes,
        image: formData.bossTemplate.image,
      });
      toast.success('Tạo boss thủ công thành công!');
      fetchCurrentBoss();
    } catch {
      toast.error('Lỗi khi tạo boss!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBossFromTemplate = async () => {
    if (!selectedTemplate) {
      toast.error('Vui lòng chọn template boss!');
      return;
    }

    setLoading(true);
    try {
      const data: CreateBossFromTemplateDto = {
        templateId: selectedTemplate.id,
        scheduleId: selectedSchedule || undefined,
        durationMinutes: formData.durationMinutes,
      };

      await worldBossApi.createBossFromTemplate(data);
      toast.success('Tạo boss từ template thành công!');
      fetchCurrentBoss();
      setSelectedTemplate(null);
      setSelectedSchedule(null);
    } catch {
      toast.error('Lỗi khi tạo boss từ template!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa lịch này không?')) {
      return;
    }

    setDeletingScheduleId(scheduleId);
    try {
      await api.delete(`/world-boss/schedule/${scheduleId}`);
      toast.success('Xóa lịch boss thành công!');
      fetchSchedules();
    } catch (error) {
      console.error('Delete schedule error:', error);
      toast.error('Lỗi khi xóa lịch boss!');
    } finally {
      setDeletingScheduleId(null);
    }
  };

  const handleEditBoss = (boss: any) => {
    setEditingBoss({
      id: boss.id,
      name: boss.name,
      description: boss.description,
      level: boss.level,
      maxHp: boss.maxHp,
      durationMinutes: boss.durationMinutes,
      stats: boss.stats,
      image: boss.image
    });
  };

  const handleUpdateBoss = async () => {
    if (!editingBoss) return;

    setLoading(true);
    try {
      await api.put(`/world-boss/${editingBoss.id}`, editingBoss);
      toast.success('Cập nhật boss thành công!');
      fetchCurrentBoss();
      setEditingBoss(null);
    } catch (error) {
      console.error('Update boss error:', error);
      toast.error('Lỗi khi cập nhật boss!');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoss = async (bossId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa boss này không? Hành động này không thể hoàn tác!')) {
      return;
    }

    setDeletingBossId(bossId);
    try {
      await api.delete(`/world-boss/${bossId}`);
      toast.success('Xóa boss thành công!');
      fetchCurrentBoss();
    } catch (error) {
      console.error('Delete boss error:', error);
      toast.error('Lỗi khi xóa boss!');
    } finally {
      setDeletingBossId(null);
    }
  };

  const handleEditSchedule = (schedule: any) => {
    setEditingSchedule({
      id: schedule.id,
      name: schedule.name,
      description: schedule.description,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      durationMinutes: schedule.durationMinutes,
      isActive: schedule.isActive
    });
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    setLoading(true);
    try {
      await api.put(`/world-boss/schedule/${editingSchedule.id}`, editingSchedule);
      toast.success('Cập nhật lịch thành công!');
      fetchSchedules();
      setEditingSchedule(null);
    } catch (error) {
      console.error('Update schedule error:', error);
      toast.error('Lỗi khi cập nhật lịch!');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBossToSchedule = async (bossId: number, scheduleId: number) => {
    try {
      await worldBossApi.assignBossToSchedule(bossId, scheduleId);
      toast.success('Gán boss vào lịch thành công!');
      fetchCurrentBoss();
    } catch {
      toast.error('Lỗi khi gán boss vào lịch!');
    }
  };

  const handleRemoveBossFromSchedule = async (bossId: number) => {
    try {
      await worldBossApi.removeBossFromSchedule(bossId);
      toast.success('Gỡ boss khỏi lịch thành công!');
      fetchCurrentBoss();
    } catch {
      toast.error('Lỗi khi gỡ boss khỏi lịch!');
    }
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await api.post('/uploads/world-boss', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setFormData(prev => ({
        ...prev,
        bossTemplate: {
          ...prev.bossTemplate,
          image: response.data.path
        }
      }));
      toast.success('Upload ảnh thành công!');
    } catch {
      toast.error('Lỗi khi upload ảnh!');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      dayOfWeek: '',
      startTime: '',
      durationMinutes: 120,
      isActive: true,
      bossTemplate: {
        name: '',
        description: '',
        level: 50,
        image: '',
        stats: {
          attack: 5000,
          defense: 3000,
          critRate: 15,
          critDamage: 200,
        },
        damagePhases: {
          phase1Threshold: 1000000,
          phase2Threshold: 3000000,
          phase3Threshold: 5000000,
        },
        rewards: {
          individual: {
            top1: { gold: 100000, experience: 50000, items: [] },
            top2: { gold: 70000, experience: 35000, items: [] },
            top3: { gold: 50000, experience: 25000, items: [] },
            top4to10: { gold: 30000, experience: 15000, items: [] },
            top11to30: { gold: 15000, experience: 7500, items: [] },
          },
          guild: {
            top1: { gold: 200000, experience: 100000, items: [] },
            top2to5: { gold: 100000, experience: 50000, items: [] },
            top6to10: { gold: 50000, experience: 25000, items: [] },
          },
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý World Boss</h1>
          <p className="text-muted-foreground">
            Tạo và quản lý lịch boss thế giới, tạo boss thủ công
          </p>
        </div>
      </div>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList>
          <TabsTrigger value="current">Boss Hiện Tại</TabsTrigger>
          <TabsTrigger value="schedules">Lịch Boss</TabsTrigger>
          <TabsTrigger value="templates">Boss Templates</TabsTrigger>
          <TabsTrigger value="rewards">Phần Thưởng</TabsTrigger>
          <TabsTrigger value="create">Tạo Mới</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Boss Thế Giới Hiện Tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentBoss ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Tên Boss</Label>
                      <p className="text-lg font-semibold">{currentBoss.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Level</Label>
                      <p className="text-lg">{currentBoss.level}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Trạng thái</Label>
                      <Badge variant={currentBoss.status === 'alive' ? 'default' : 'secondary'}>
                        {currentBoss.status === 'alive' ? 'Đang sống' : 'Đã chết'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phase hiện tại</Label>
                      <p className="text-lg">x{currentBoss.currentPhase}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Mô tả</Label>
                    <p className="text-sm text-muted-foreground">{currentBoss.description}</p>
                  </div>

                  {/* Boss Management Actions */}
                  <div className="border-t pt-4">
                    <Label className="text-sm font-medium mb-3 block">Quản lý boss</Label>
                    <div className="space-y-3">
                      {/* Schedule Management */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Quản lý lịch</Label>
                        <div className="flex flex-wrap gap-2">
                          {currentBoss.scheduleId ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="default">
                                Đã gán lịch #{currentBoss.scheduleId}
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveBossFromSchedule(currentBoss.id)}
                              >
                                Gỡ khỏi lịch
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Select
                                onValueChange={(value) => {
                                  if (value) {
                                    handleAssignBossToSchedule(currentBoss.id, parseInt(value));
                                  }
                                }}
                              >
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="Gán vào lịch" />
                                </SelectTrigger>
                                <SelectContent>
                                  {schedules.map((schedule) => (
                                    <SelectItem key={schedule.id} value={schedule.id.toString()}>
                                      {schedule.name} - {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Boss Actions */}
                      <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">Hành động</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Bạn có chắc muốn kết thúc boss này và phát thưởng?')) {
                                try {
                                  await worldBossApi.endBoss(currentBoss.id);
                                  toast.success('Đã kết thúc boss và phát thưởng!');
                                  fetchCurrentBoss();
                                } catch {
                                  toast.error('Lỗi khi kết thúc boss!');
                                }
                              }
                            }}
                          >
                            Kết thúc Boss & Phát thưởng
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                await worldBossApi.endExpiredBosses();
                                toast.success('Đã xử lý tất cả boss hết hạn!');
                                fetchCurrentBoss();
                              } catch {
                                toast.error('Lỗi khi xử lý boss hết hạn!');
                              }
                            }}
                          >
                            Xử lý Boss hết hạn
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBoss(currentBoss)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Sửa Boss
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBoss(currentBoss.id)}
                            disabled={deletingBossId === currentBoss.id}
                          >
                            {deletingBossId === currentBoss.id ? (
                              <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <Trash2 className="h-4 w-4 mr-1" />
                            )}
                            {deletingBossId === currentBoss.id ? 'Đang xóa...' : 'Xóa Boss'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Không có boss nào đang hoạt động</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch Boss Thế Giới
              </CardTitle>
              <CardDescription>
                Quản lý lịch spawn boss tự động theo thứ trong tuần
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div key={schedule.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {schedule.bossTemplate.image && (
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                              <img 
                                src={`http://localhost:3005${schedule.bossTemplate.image}`} 
                                alt={schedule.bossTemplate.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{schedule.name}</h3>
                            <p className="text-sm text-muted-foreground">{schedule.description}</p>
                          </div>
                        </div>
                        
                        {/* Boss Template Info */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Trophy className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-sm">Boss: {schedule.bossTemplate.name} (Lv.{schedule.bossTemplate.level})</span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                            <span>ATK: {schedule.bossTemplate.stats.attack.toLocaleString()}</span>
                            <span>DEF: {schedule.bossTemplate.stats.defense.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {schedule.startTime}
                          </span>
                          <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                            {schedule.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </Badge>
                        </div>

                        {/* Current Boss Status */}
                        {currentBoss && currentBoss.scheduleId === schedule.id && (
                          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs">
                            <div className="flex items-center gap-1 text-green-700">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="font-medium">Boss đang hoạt động</span>
                              <span>- HP: {Math.round((currentBoss.currentHp / currentBoss.maxHp) * 100)}%</span>
                              <span>- Phase: {currentBoss.currentPhase}/3</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="Chỉnh sửa lịch"
                          onClick={() => handleEditSchedule(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteSchedule(schedule.id)}
                          disabled={deletingScheduleId === schedule.id}
                          title="Xóa lịch"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {deletingScheduleId === schedule.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Boss Templates
              </CardTitle>
              <CardDescription>
                Quản lý các mẫu boss có thể tái sử dụng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          {template.image && (
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center overflow-hidden">
                              <img 
                                src={`http://localhost:3005${template.image}`} 
                                alt={template.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                            {template.category && (
                              <Badge variant="outline" className="mt-1">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <span>Level: {template.level}</span>
                            <span>ATK: {template.stats.attack.toLocaleString()}</span>
                            <span>DEF: {template.stats.defense.toLocaleString()}</span>
                            <span>Crit: {template.stats.critRate}%</span>
                          </div>
                        </div>

                        <div className="text-xs text-gray-600">
                          <span>Phases: {template.damagePhases.phase1Threshold.toLocaleString()} / </span>
                          <span>{template.damagePhases.phase2Threshold.toLocaleString()} / </span>
                          <span>{template.damagePhases.phase3Threshold.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          Chọn Template
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tạo Boss Từ Template</CardTitle>
                <CardDescription>
                  Tạo boss nhanh từ template có sẵn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="templateSelect">Chọn Template</Label>
                  <Select
                    value={selectedTemplate?.id.toString() || ''}
                    onValueChange={(value) => {
                      const template = templates.find(t => t.id === parseInt(value));
                      setSelectedTemplate(template || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn boss template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{template.name}</span>
                            {template.category && (
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium mb-2">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{selectedTemplate.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span>Level: {selectedTemplate.level}</span>
                      <span>ATK: {selectedTemplate.stats.attack.toLocaleString()}</span>
                      <span>DEF: {selectedTemplate.stats.defense.toLocaleString()}</span>
                      <span>Crit: {selectedTemplate.stats.critRate}%</span>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="scheduleSelect">Gán vào lịch (tùy chọn)</Label>
                  <Select
                    value={selectedSchedule?.toString() || 'none'}
                    onValueChange={(value) => setSelectedSchedule(value === 'none' ? null : parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Không gán lịch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không gán lịch</SelectItem>
                      {schedules.map((schedule) => (
                        <SelectItem key={schedule.id} value={schedule.id.toString()}>
                          {schedule.name} - {DAYS_OF_WEEK.find(d => d.value === schedule.dayOfWeek)?.label} {schedule.startTime}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="templateDuration">Thời gian (phút)</Label>
                  <Input
                    id="templateDuration"
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                  />
                </div>

                <Button onClick={handleCreateBossFromTemplate} disabled={loading || !selectedTemplate} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Boss Từ Template
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tạo Lịch Boss</CardTitle>
                <CardDescription>
                  Tạo lịch boss tự động spawn theo thứ trong tuần
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tên lịch</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Weekly Dragon Boss"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dayOfWeek">Thứ trong tuần</Label>
                    <Select
                      value={formData.dayOfWeek}
                      onValueChange={(value) => setFormData({ ...formData, dayOfWeek: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn thứ" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Giờ bắt đầu</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">Thời gian (phút)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả về lịch boss này..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Kích hoạt ngay</Label>
                </div>

                <Button onClick={handleCreateSchedule} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Lịch Boss
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tạo Boss Thủ Công</CardTitle>
                <CardDescription>
                  Tạo boss ngay lập tức để test hoặc event đặc biệt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="bossName">Tên Boss</Label>
                  <Input
                    id="bossName"
                    value={formData.bossTemplate.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      bossTemplate: { ...formData.bossTemplate, name: e.target.value }
                    })}
                    placeholder="Ancient Fire Dragon"
                  />
                </div>

                <div>
                  <Label htmlFor="bossDescription">Mô tả Boss</Label>
                  <Textarea
                    id="bossDescription"
                    value={formData.bossTemplate.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      bossTemplate: { ...formData.bossTemplate, description: e.target.value }
                    })}
                    placeholder="Một con rồng huyền thoại..."
                  />
                </div>

                <div>
                  <Label htmlFor="bossImage">Hình ảnh Boss</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={uploadingImage}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <>Đang tải...</>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    {formData.bossTemplate.image && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Image className="h-4 w-4" />
                        <span>Đã có ảnh: {formData.bossTemplate.image}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bossLevel">Level</Label>
                    <Input
                      id="bossLevel"
                      type="number"
                      value={formData.bossTemplate.level}
                      onChange={(e) => setFormData({
                        ...formData,
                        bossTemplate: { ...formData.bossTemplate, level: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="manualDuration">Thời gian (phút)</Label>
                    <Input
                      id="manualDuration"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="attack">Tấn công</Label>
                    <Input
                      id="attack"
                      type="number"
                      value={formData.bossTemplate.stats.attack}
                      onChange={(e) => setFormData({
                        ...formData,
                        bossTemplate: {
                          ...formData.bossTemplate,
                          stats: { ...formData.bossTemplate.stats, attack: parseInt(e.target.value) }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="defense">Phòng thủ</Label>
                    <Input
                      id="defense"
                      type="number"
                      value={formData.bossTemplate.stats.defense}
                      onChange={(e) => setFormData({
                        ...formData,
                        bossTemplate: {
                          ...formData.bossTemplate,
                          stats: { ...formData.bossTemplate.stats, defense: parseInt(e.target.value) }
                        }
                      })}
                    />
                  </div>
                </div>

                <Button onClick={handleCreateManualBoss} disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Boss Ngay
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Quản Lý Phần Thưởng
              </CardTitle>
              <CardDescription>
                Cấu hình phần thưởng cho các hạng trong bảng xếp hạng
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentBoss ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Phần thưởng boss hiện tại: {currentBoss.name}</h3>
                      <p className="text-sm text-muted-foreground">Chỉnh sửa phần thưởng cho boss đang hoạt động</p>
                    </div>
                    <Button
                      onClick={() => {
                        setEditingRewards(!editingRewards);
                        if (!editingRewards) {
                          setCustomRewards(currentBoss.rewards);
                        }
                      }}
                      variant={editingRewards ? "secondary" : "default"}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {editingRewards ? 'Hủy chỉnh sửa' : 'Chỉnh sửa phần thưởng'}
                    </Button>
                  </div>

                  {/* Individual Rewards */}
                  <div>
                    <h4 className="text-md font-semibold mb-4">Phần thưởng cá nhân</h4>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg">
                        <RewardEditor
                          title="🥇 Hạng 1"
                          titleClass="text-yellow-600"
                          reward={editingRewards ? customRewards?.individual?.top1 : currentBoss.rewards.individual.top1}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                individual: {
                                  ...customRewards.individual,
                                  top1: reward
                                }
                              });
                            }
                          }}
                        />
                        <RewardEditor
                          title="🥈 Hạng 2"
                          titleClass="text-gray-600"
                          reward={editingRewards ? customRewards?.individual?.top2 : currentBoss.rewards.individual.top2}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                individual: {
                                  ...customRewards.individual,
                                  top2: reward
                                }
                              });
                            }
                          }}
                        />
                        <RewardEditor
                          title="🥉 Hạng 3"
                          titleClass="text-amber-600"
                          reward={editingRewards ? customRewards?.individual?.top3 : currentBoss.rewards.individual.top3}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                individual: {
                                  ...customRewards.individual,
                                  top3: reward
                                }
                              });
                            }
                          }}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg">
                          <RewardEditor
                            title="Hạng 4-10"
                            reward={editingRewards ? customRewards?.individual?.top4to10 : currentBoss.rewards.individual.top4to10}
                            editable={editingRewards}
                            items={items}
                            onChange={(reward) => {
                              if (editingRewards && customRewards) {
                                setCustomRewards({
                                  ...customRewards,
                                  individual: {
                                    ...customRewards.individual,
                                    top4to10: reward
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="p-4 border rounded-lg">
                          <RewardEditor
                            title="Hạng 11-30"
                            reward={editingRewards ? customRewards?.individual?.top11to30 : currentBoss.rewards.individual.top11to30}
                            editable={editingRewards}
                            items={items}
                            onChange={(reward) => {
                              if (editingRewards && customRewards) {
                                setCustomRewards({
                                  ...customRewards,
                                  individual: {
                                    ...customRewards.individual,
                                    top11to30: reward
                                  }
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Guild Rewards */}
                  <div>
                    <h4 className="text-md font-semibold mb-4">Phần thưởng bang hội</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <RewardEditor
                          title="🏆 Bang hội #1"
                          titleClass="text-yellow-600"
                          reward={editingRewards ? customRewards?.guild?.top1 : currentBoss.rewards.guild.top1}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                guild: {
                                  ...customRewards.guild,
                                  top1: reward
                                }
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="p-4 border rounded-lg">
                        <RewardEditor
                          title="Bang hội #2-5"
                          reward={editingRewards ? customRewards?.guild?.top2to5 : currentBoss.rewards.guild.top2to5}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                guild: {
                                  ...customRewards.guild,
                                  top2to5: reward
                                }
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="p-4 border rounded-lg">
                        <RewardEditor
                          title="Bang hội #6-10"
                          reward={editingRewards ? customRewards?.guild?.top6to10 : currentBoss.rewards.guild.top6to10}
                          editable={editingRewards}
                          items={items}
                          onChange={(reward) => {
                            if (editingRewards && customRewards) {
                              setCustomRewards({
                                ...customRewards,
                                guild: {
                                  ...customRewards.guild,
                                  top6to10: reward
                                }
                              });
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {editingRewards && (
                    <div className="flex justify-center gap-2">
                      <Button
                        onClick={async () => {
                          try {
                            await worldBossApi.updateBossRewards(currentBoss.id, customRewards);
                            toast.success('Cập nhật phần thưởng thành công!');
                            setEditingRewards(false);
                            fetchCurrentBoss();
                          } catch {
                            toast.error('Lỗi khi cập nhật phần thưởng!');
                          }
                        }}
                        disabled={loading}
                      >
                        Lưu thay đổi
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingRewards(false);
                          setCustomRewards(null);
                        }}
                      >
                        Hủy
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Không có boss nào đang hoạt động để chỉnh sửa phần thưởng</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Boss Modal */}
      {editingBoss && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chỉnh sửa Boss</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingBoss(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tên Boss</Label>
                  <Input
                    value={editingBoss.name}
                    onChange={(e) => setEditingBoss({...editingBoss, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Level</Label>
                  <Input
                    type="number"
                    value={editingBoss.level}
                    onChange={(e) => setEditingBoss({...editingBoss, level: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={editingBoss.description}
                  onChange={(e) => setEditingBoss({...editingBoss, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Max HP</Label>
                  <Input
                    type="number"
                    value={editingBoss.maxHp}
                    onChange={(e) => setEditingBoss({...editingBoss, maxHp: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label>Thời gian (phút)</Label>
                  <Input
                    type="number"
                    value={editingBoss.durationMinutes}
                    onChange={(e) => setEditingBoss({...editingBoss, durationMinutes: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingBoss(null)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdateBoss} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Schedule Modal */}
      {editingSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Chỉnh sửa Lịch Boss</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingSchedule(null)}>
                ✕
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tên lịch</Label>
                  <Input
                    value={editingSchedule.name}
                    onChange={(e) => setEditingSchedule({...editingSchedule, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Thứ trong tuần</Label>
                  <Select
                    value={editingSchedule.dayOfWeek}
                    onValueChange={(value) => setEditingSchedule({...editingSchedule, dayOfWeek: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={editingSchedule.description}
                  onChange={(e) => setEditingSchedule({...editingSchedule, description: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Thời gian bắt đầu</Label>
                  <Input
                    type="time"
                    value={editingSchedule.startTime}
                    onChange={(e) => setEditingSchedule({...editingSchedule, startTime: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Thời gian (phút)</Label>
                  <Input
                    type="number"
                    value={editingSchedule.durationMinutes}
                    onChange={(e) => setEditingSchedule({...editingSchedule, durationMinutes: parseInt(e.target.value)})}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch
                    checked={editingSchedule.isActive}
                    onCheckedChange={(checked) => setEditingSchedule({...editingSchedule, isActive: checked})}
                  />
                  <Label>Hoạt động</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingSchedule(null)}>
                  Hủy
                </Button>
                <Button onClick={handleUpdateSchedule} disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Cập nhật'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// RewardEditor component
interface RewardEditorProps {
  title: string;
  titleClass?: string;
  reward: {
    gold: number;
    experience: number;
    items: ItemReward[];
  };
  editable: boolean;
  items: Item[];
  onChange: (reward: any) => void;
}

function RewardEditor({ title, titleClass, reward, editable, items, onChange }: RewardEditorProps) {
  const addItem = () => {
    const newReward = {
      ...reward,
      items: [...(reward.items || []), { itemId: 0, quantity: 1 }]
    };
    onChange(newReward);
  };

  const removeItem = (index: number) => {
    const newReward = {
      ...reward,
      items: reward.items.filter((_, i) => i !== index)
    };
    onChange(newReward);
  };

  const updateItem = (index: number, field: 'itemId' | 'quantity', value: number) => {
    const newReward = {
      ...reward,
      items: reward.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    };
    onChange(newReward);
  };

  return (
    <div>
      <Label className={`text-sm font-medium ${titleClass || ''}`}>{title}</Label>
      <div className="space-y-3 mt-2">
        {/* Gold and Experience */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Vàng</Label>
            <Input 
              type="number" 
              value={reward.gold} 
              readOnly={!editable}
              onChange={(e) => onChange({ ...reward, gold: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="text-xs">EXP</Label>
            <Input 
              type="number" 
              value={reward.experience} 
              readOnly={!editable}
              onChange={(e) => onChange({ ...reward, experience: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Vật phẩm</Label>
            {editable && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
                className="h-6 px-2 text-xs"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {(reward.items || []).map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Select
                  value={item.itemId.toString()}
                  onValueChange={(value) => updateItem(index, 'itemId', parseInt(value))}
                  disabled={!editable}
                >
                  <SelectTrigger className="h-8 text-xs flex-1">
                    <SelectValue placeholder="Chọn item" />
                  </SelectTrigger>
                  <SelectContent>
                    {items.map((gameItem) => (
                      <SelectItem key={gameItem.id} value={gameItem.id.toString()}>
                        <div className="flex items-center gap-2">
                          <span>{gameItem.name}</span>
                          <Badge variant="outline" className="text-xs">
                            R{gameItem.rarity}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                  className="h-8 w-16 text-xs"
                  min="1"
                  readOnly={!editable}
                />
                {editable && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {(!reward.items || reward.items.length === 0) && (
              <p className="text-xs text-muted-foreground">Không có vật phẩm</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
