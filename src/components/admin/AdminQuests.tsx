'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  Plus,
  X,
  Target,
  Trophy,
  Calendar,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Sword,
  Package,
  Shield,
  Zap,
  Coins,
  Star
} from 'lucide-react';
import api from '@/lib/api';

// Types
interface Quest {
  id: number;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'event';
  requiredLevel: number;
  requirements: {
    killEnemies: Array<{ enemyType: string; count: number }>;
    collectItems: Array<{ itemId: number; itemName: string; quantity: number }>;
    completeDungeons: Array<{ dungeonId: number; dungeonName: string; count: number }>;
    reachLevel?: number;
    defeatBoss?: { bossId: number; bossName: string };
  };
  rewards: {
    experience: number;
    gold: number;
    items: Array<{ itemId: number; itemName: string; quantity: number }>;
  };
  dependencies: {
    prerequisiteQuests: number[];
    requiredLevel?: number;
    requiredClassTier?: number;
  };
  isActive: boolean;
  expiresAt?: string;
  isRepeatable?: boolean;
}

interface Item {
  id: number;
  name: string;
  type: string;
  price: number;
}

interface Monster {
  id: number;
  name: string;
  level: number;
}

interface Dungeon {
  id: number;
  name: string;
  levelRequirement: number;
}

interface QuestFormData {
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'event';
  requiredLevel: number;
  requirements: {
    killEnemies: Array<{ enemyType: string; count: number }>;
    collectItems: Array<{ itemId: number; itemName: string; quantity: number }>;
    completeDungeons: Array<{ dungeonId: number; dungeonName: string; count: number }>;
    reachLevel?: number;
    defeatBoss?: { bossId: number; bossName: string };
  };
  rewards: {
    experience: number;
    gold: number;
    items: Array<{ itemId: number; itemName: string; quantity: number }>;
  };
  dependencies: {
    prerequisiteQuests: number[];
    requiredLevel?: number;
    requiredClassTier?: number;
  };
  isActive: boolean;
  expiresAt?: string;
  isRepeatable?: boolean;
}

const initialFormData: QuestFormData = {
  name: '',
  description: '',
  type: 'main',
  requiredLevel: 1,
  requirements: {
    killEnemies: [],
    collectItems: [],
    completeDungeons: [],
  },
  rewards: {
    experience: 0,
    gold: 0,
    items: [],
  },
  dependencies: {
    prerequisiteQuests: [],
  },
  isActive: true,
  isRepeatable: false,
};

export default function AdminQuests() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [previewData, setPreviewData] = useState<QuestFormData | null>(null);
  const [formData, setFormData] = useState<QuestFormData>(initialFormData);

  const queryClient = useQueryClient();

  // Fetch quests
  const { data: quests, isLoading } = useQuery({
    queryKey: ['adminQuests'],
    queryFn: async () => {
      const response = await api.get('/quests');
      return response.data;
    },
  });

  // Fetch items
  const { data: items } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/items');
      return response.data;
    },
  });

  // Fetch monsters
  const { data: monsters } = useQuery({
    queryKey: ['monsters'],
    queryFn: async () => {
      const response = await api.get('/monsters');
      return response.data;
    },
  });

  // Fetch dungeons
  const { data: dungeons } = useQuery({
    queryKey: ['dungeons'],
    queryFn: async () => {
      const response = await api.get('/dungeons');
      return response.data;
    },
  });

  // Create quest mutation
  const createQuestMutation = useMutation({
    mutationFn: async (data: QuestFormData) => {
      const response = await api.post('/quests', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quest đã được tạo thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminQuests'] });
      setIsCreateDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: Error) => {
      toast.error(`Lỗi tạo quest: ${error.message}`);
    },
  });

  // Update quest mutation
  const updateQuestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QuestFormData> }) => {
      const response = await api.put(`/quests/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Quest đã được cập nhật thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminQuests'] });
      setIsEditDialogOpen(false);
      setSelectedQuest(null);
    },
    onError: (error: Error) => {
      toast.error(`Lỗi cập nhật quest: ${error.message}`);
    },
  });

  // Delete quest mutation
  const deleteQuestMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/quests/${id}`);
    },
    onSuccess: () => {
      toast.success('Quest đã được xóa thành công!');
      queryClient.invalidateQueries({ queryKey: ['adminQuests'] });
    },
    onError: (error: Error) => {
      toast.error(`Lỗi xóa quest: ${error.message}`);
    },
  });

  const handleCreateQuest = () => {
    if (!formData.name.trim()) {
      toast.error('Tên quest không được để trống!');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Mô tả quest không được để trống!');
      return;
    }
    createQuestMutation.mutate(formData);
  };

  const handleUpdateQuest = () => {
    if (!selectedQuest) return;
    if (!formData.name.trim()) {
      toast.error('Tên quest không được để trống!');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Mô tả quest không được để trống!');
      return;
    }
    updateQuestMutation.mutate({ id: selectedQuest.id, data: formData });
  };

  const handleDeleteQuest = (quest: Quest) => {
    if (confirm(`Bạn có chắc muốn xóa quest "${quest.name}"?`)) {
      deleteQuestMutation.mutate(quest.id);
    }
  };

  const handleEditQuest = (quest: Quest) => {
    setSelectedQuest(quest);
    setFormData({
      name: quest.name,
      description: quest.description,
      type: quest.type,
      requiredLevel: quest.requiredLevel,
      requirements: {
        killEnemies: quest.requirements.killEnemies || [],
        collectItems: quest.requirements.collectItems || [],
        completeDungeons: quest.requirements.completeDungeons || [],
        reachLevel: quest.requirements.reachLevel,
        defeatBoss: quest.requirements.defeatBoss,
      },
      rewards: {
        experience: quest.rewards.experience || 0,
        gold: quest.rewards.gold || 0,
        items: quest.rewards.items || [],
      },
      dependencies: {
        prerequisiteQuests: quest.dependencies?.prerequisiteQuests || [],
        requiredLevel: quest.dependencies?.requiredLevel,
        requiredClassTier: quest.dependencies?.requiredClassTier,
      },
      isActive: quest.isActive,
      expiresAt: quest.expiresAt,
      isRepeatable: quest.isRepeatable || false,
    });
    setIsEditDialogOpen(true);
  };

  const handlePreviewQuest = (quest: Quest) => {
    setPreviewData({
      name: quest.name,
      description: quest.description,
      type: quest.type,
      requiredLevel: quest.requiredLevel,
      requirements: {
        killEnemies: quest.requirements.killEnemies || [],
        collectItems: quest.requirements.collectItems || [],
        completeDungeons: quest.requirements.completeDungeons || [],
        reachLevel: quest.requirements.reachLevel,
        defeatBoss: quest.requirements.defeatBoss,
      },
      rewards: {
        experience: quest.rewards.experience || 0,
        gold: quest.rewards.gold || 0,
        items: quest.rewards.items || [],
      },
      dependencies: {
        prerequisiteQuests: quest.dependencies?.prerequisiteQuests || [],
        requiredLevel: quest.dependencies?.requiredLevel,
        requiredClassTier: quest.dependencies?.requiredClassTier,
      },
      isActive: quest.isActive,
      expiresAt: quest.expiresAt,
      isRepeatable: quest.isRepeatable || false,
    });
    setIsPreviewDialogOpen(true);
  };

  const addKillEnemyRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        killEnemies: [...prev.requirements.killEnemies, { enemyType: '', count: 1 }],
      },
    }));
  };

  const removeKillEnemyRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        killEnemies: prev.requirements.killEnemies.filter((_, i) => i !== index),
      },
    }));
  };

  const addCollectItemRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        collectItems: [...prev.requirements.collectItems, { itemId: 0, itemName: '', quantity: 1 }],
      },
    }));
  };

  const removeCollectItemRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        collectItems: prev.requirements.collectItems.filter((_, i) => i !== index),
      },
    }));
  };

  const addDungeonRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        completeDungeons: [...prev.requirements.completeDungeons, { dungeonId: 0, dungeonName: '', count: 1 }],
      },
    }));
  };

  const removeDungeonRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        completeDungeons: prev.requirements.completeDungeons.filter((_, i) => i !== index),
      },
    }));
  };

  const addRewardItem = () => {
    setFormData(prev => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        items: [...prev.rewards.items, { itemId: 0, itemName: '', quantity: 1 }],
      },
    }));
  };

  const removeRewardItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rewards: {
        ...prev.rewards,
        items: prev.rewards.items.filter((_, i) => i !== index),
      },
    }));
  };

  const getQuestTypeIcon = (type: string) => {
    switch (type) {
      case 'main': return <Trophy className="w-4 h-4" />;
      case 'side': return <Target className="w-4 h-4" />;
      case 'daily': return <Calendar className="w-4 h-4" />;
      case 'event': return <Star className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const getQuestTypeColor = (type: string) => {
    switch (type) {
      case 'main': return 'bg-purple-100 text-purple-800';
      case 'side': return 'bg-blue-100 text-blue-800';
      case 'daily': return 'bg-green-100 text-green-800';
      case 'event': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Đang tải danh sách quests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quest Management</h1>
            <p className="text-gray-600 mt-2">Quản lý nhiệm vụ trong hệ thống game</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Tạo Quest Mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tạo Quest Mới</DialogTitle>
                <DialogDescription>
                  Tạo một quest mới với các yêu cầu và phần thưởng
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                  <TabsTrigger value="requirements">Yêu cầu</TabsTrigger>
                  <TabsTrigger value="rewards">Phần thưởng</TabsTrigger>
                  <TabsTrigger value="dependencies">Điều kiện</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Tên Quest</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nhập tên quest..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="type">Loại Quest</Label>
                      <Select
                        value={formData.type}
                        onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value as 'main' | 'side' | 'daily' | 'event' }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn loại quest" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main">Main Quest (Chính)</SelectItem>
                          <SelectItem value="side">Side Quest (Phụ)</SelectItem>
                          <SelectItem value="daily">Daily Quest (Hàng ngày)</SelectItem>
                          <SelectItem value="event">Event Quest (Sự kiện)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Mô tả chi tiết về quest..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="requiredLevel">Level yêu cầu</Label>
                      <Input
                        id="requiredLevel"
                        type="number"
                        value={formData.requiredLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiredLevel: parseInt(e.target.value) || 1 }))}
                        min={1}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
                      />
                      <Label htmlFor="isActive">Quest đang hoạt động</Label>
                    </div>
                  </div>

                  {formData.type === 'daily' && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="isRepeatable"
                        checked={formData.isRepeatable}
                        onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isRepeatable: checked }))}
                      />
                      <Label htmlFor="isRepeatable">Quest có thể lặp lại</Label>
                    </div>
                  )}

                  {formData.type === 'event' && (
                    <div>
                      <Label htmlFor="expiresAt">Thời gian hết hạn</Label>
                      <Input
                        id="expiresAt"
                        type="datetime-local"
                        value={formData.expiresAt}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="requirements" className="space-y-4">
                  <div>
                    <Label>Yêu cầu giết quái</Label>
                    {formData.requirements.killEnemies.map((enemy, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={enemy.enemyType}
                          onValueChange={(value) => {
                            const newEnemies = [...formData.requirements.killEnemies];
                            newEnemies[index].enemyType = value;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, killEnemies: newEnemies }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn quái..." />
                          </SelectTrigger>
                          <SelectContent>
                            {monsters?.map((monster: Monster) => (
                              <SelectItem key={monster.id} value={monster.name}>
                                {monster.name} (Lv.{monster.level})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Số lượng"
                          value={enemy.count}
                          onChange={(e) => {
                            const newEnemies = [...formData.requirements.killEnemies];
                            newEnemies[index].count = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, killEnemies: newEnemies }
                            }));
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeKillEnemyRequirement(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKillEnemyRequirement}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm yêu cầu giết quái
                    </Button>
                  </div>

                  <div>
                    <Label>Yêu cầu thu thập vật phẩm</Label>
                    {formData.requirements.collectItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={item.itemName}
                          onValueChange={(value) => {
                            const selectedItem = items?.find((i: Item) => i.name === value);
                            const newItems = [...formData.requirements.collectItems];
                            newItems[index].itemName = value;
                            newItems[index].itemId = selectedItem?.id || 0;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, collectItems: newItems }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn vật phẩm..." />
                          </SelectTrigger>
                          <SelectContent>
                            {items?.map((item: Item) => (
                              <SelectItem key={item.id} value={item.name}>
                                {item.name} ({item.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.requirements.collectItems];
                            newItems[index].quantity = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, collectItems: newItems }
                            }));
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCollectItemRequirement(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCollectItemRequirement}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm yêu cầu thu thập
                    </Button>
                  </div>

                  <div>
                    <Label>Yêu cầu hoàn thành dungeon</Label>
                    {formData.requirements.completeDungeons.map((dungeon, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={dungeon.dungeonName}
                          onValueChange={(value) => {
                            const selectedDungeon = dungeons?.find((d: Dungeon) => d.name === value);
                            const newDungeons = [...formData.requirements.completeDungeons];
                            newDungeons[index].dungeonName = value;
                            newDungeons[index].dungeonId = selectedDungeon?.id || 0;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, completeDungeons: newDungeons }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn dungeon..." />
                          </SelectTrigger>
                          <SelectContent>
                            {dungeons?.map((dungeon: Dungeon) => (
                              <SelectItem key={dungeon.id} value={dungeon.name}>
                                {dungeon.name} (Lv.{dungeon.levelRequirement})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Số lần"
                          value={dungeon.count}
                          onChange={(e) => {
                            const newDungeons = [...formData.requirements.completeDungeons];
                            newDungeons[index].count = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              requirements: { ...prev.requirements, completeDungeons: newDungeons }
                            }));
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeDungeonRequirement(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDungeonRequirement}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm yêu cầu dungeon
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="reachLevel">Yêu cầu đạt level</Label>
                      <Input
                        id="reachLevel"
                        type="number"
                        value={formData.requirements.reachLevel || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: {
                            ...prev.requirements,
                            reachLevel: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        placeholder="Không bắt buộc"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Yêu cầu đánh bại boss</Label>
                    <div className="flex items-center space-x-2 mt-2">
                      <Input
                        placeholder="Tên boss"
                        value={formData.requirements.defeatBoss?.bossName || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: {
                            ...prev.requirements,
                            defeatBoss: {
                              bossId: formData.requirements.defeatBoss?.bossId || 0,
                              bossName: e.target.value
                            }
                          }
                        }))}
                      />
                      <Input
                        type="number"
                        placeholder="ID boss"
                        value={formData.requirements.defeatBoss?.bossId || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          requirements: {
                            ...prev.requirements,
                            defeatBoss: {
                              bossId: parseInt(e.target.value) || 0,
                              bossName: formData.requirements.defeatBoss?.bossName || ''
                            }
                          }
                        }))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="rewards" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experience">Kinh nghiệm</Label>
                      <Input
                        id="experience"
                        type="number"
                        value={formData.rewards.experience}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          rewards: { ...prev.rewards, experience: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="gold">Vàng</Label>
                      <Input
                        id="gold"
                        type="number"
                        value={formData.rewards.gold}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          rewards: { ...prev.rewards, gold: parseInt(e.target.value) || 0 }
                        }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Vật phẩm thưởng</Label>
                    {formData.rewards.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={item.itemName}
                          onValueChange={(value) => {
                            const selectedItem = items?.find((i: Item) => i.name === value);
                            const newItems = [...formData.rewards.items];
                            newItems[index].itemName = value;
                            newItems[index].itemId = selectedItem?.id || 0;
                            setFormData(prev => ({
                              ...prev,
                              rewards: { ...prev.rewards, items: newItems }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn vật phẩm thưởng..." />
                          </SelectTrigger>
                          <SelectContent>
                            {items?.map((item: Item) => (
                              <SelectItem key={item.id} value={item.name}>
                                {item.name} ({item.type}) - {item.price} gold
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          placeholder="Số lượng"
                          value={item.quantity}
                          onChange={(e) => {
                            const newItems = [...formData.rewards.items];
                            newItems[index].quantity = parseInt(e.target.value) || 1;
                            setFormData(prev => ({
                              ...prev,
                              rewards: { ...prev.rewards, items: newItems }
                            }));
                          }}
                          className="w-24"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRewardItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRewardItem}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm vật phẩm thưởng
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-4">
                  <div>
                    <Label>Quest tiên quyết</Label>
                    {formData.dependencies.prerequisiteQuests.map((questId, index) => (
                      <div key={index} className="flex items-center space-x-2 mt-2">
                        <Select
                          value={questId.toString()}
                          onValueChange={(value) => {
                            const newPrerequisites = [...formData.dependencies.prerequisiteQuests];
                            newPrerequisites[index] = parseInt(value);
                            setFormData(prev => ({
                              ...prev,
                              dependencies: {
                                ...prev.dependencies,
                                prerequisiteQuests: newPrerequisites
                              }
                            }));
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Chọn quest tiên quyết..." />
                          </SelectTrigger>
                          <SelectContent>
                            {quests?.filter((q: Quest) => q.id !== selectedQuest?.id).map((quest: Quest) => (
                              <SelectItem key={quest.id} value={quest.id.toString()}>
                                {quest.name} (ID: {quest.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPrerequisites = formData.dependencies.prerequisiteQuests.filter((_, i) => i !== index);
                            setFormData(prev => ({
                              ...prev,
                              dependencies: {
                                ...prev.dependencies,
                                prerequisiteQuests: newPrerequisites
                              }
                            }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          dependencies: {
                            ...prev.dependencies,
                            prerequisiteQuests: [...prev.dependencies.prerequisiteQuests, 0]
                          }
                        }));
                      }}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Thêm quest tiên quyết
                    </Button>
                    <p className="text-sm text-gray-500 mt-1">
                      Các quest này phải được hoàn thành trước khi có thể nhận quest này
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="depLevel">Level tối thiểu</Label>
                      <Input
                        id="depLevel"
                        type="number"
                        value={formData.dependencies.requiredLevel || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dependencies: {
                            ...prev.dependencies,
                            requiredLevel: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        placeholder="Không bắt buộc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="depTier">Tier class tối thiểu</Label>
                      <Input
                        id="depTier"
                        type="number"
                        value={formData.dependencies.requiredClassTier || ''}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          dependencies: {
                            ...prev.dependencies,
                            requiredClassTier: e.target.value ? parseInt(e.target.value) : undefined
                          }
                        }))}
                        placeholder="Không bắt buộc"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCreateQuest}
                  disabled={createQuestMutation.isPending}
                >
                  {createQuestMutation.isPending ? 'Đang tạo...' : 'Tạo Quest'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Quest</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quests?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Quest trong hệ thống</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Quest</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quests?.filter((q: Quest) => q.type === 'main').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Quest chính</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Quest</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quests?.filter((q: Quest) => q.type === 'daily').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Quest hàng ngày</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Quest</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {quests?.filter((q: Quest) => q.isActive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Quest đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Quests List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách Quest</CardTitle>
          <CardDescription>
            Quản lý tất cả quest trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {quests?.map((quest: Quest) => (
              <div
                key={quest.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${getQuestTypeColor(quest.type)}`}>
                    {getQuestTypeIcon(quest.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{quest.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{quest.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">
                        Level {quest.requiredLevel}
                      </Badge>
                      <Badge variant={quest.isActive ? "default" : "secondary"}>
                        {quest.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {quest.type === 'daily' && quest.isRepeatable && (
                        <Badge variant="outline">
                          Repeatable
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-right text-sm text-gray-600">
                    <p>Rewards:</p>
                    <p>EXP: {quest.rewards.experience || 0}</p>
                    <p>Gold: {quest.rewards.gold || 0}</p>
                    {quest.rewards.items && quest.rewards.items.length > 0 && (
                      <p>Items: {quest.rewards.items.length}</p>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreviewQuest(quest)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditQuest(quest)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteQuest(quest)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {(!quests || quests.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có quest nào trong hệ thống</p>
                <p className="text-sm">Hãy tạo quest đầu tiên!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Quest</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin quest
            </DialogDescription>
          </DialogHeader>

          {/* Same form as create dialog */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
              <TabsTrigger value="requirements">Yêu cầu</TabsTrigger>
              <TabsTrigger value="rewards">Phần thưởng</TabsTrigger>
              <TabsTrigger value="dependencies">Điều kiện</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Tên Quest</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên quest..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-type">Loại Quest</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, type: value as 'main' | 'side' | 'daily' | 'event' }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại quest" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Quest (Chính)</SelectItem>
                      <SelectItem value="side">Side Quest (Phụ)</SelectItem>
                      <SelectItem value="daily">Daily Quest (Hàng ngày)</SelectItem>
                      <SelectItem value="event">Event Quest (Sự kiện)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả chi tiết về quest..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-requiredLevel">Level yêu cầu</Label>
                  <Input
                    id="edit-requiredLevel"
                    type="number"
                    value={formData.requiredLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiredLevel: parseInt(e.target.value) || 1 }))}
                    min={1}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="edit-isActive">Quest đang hoạt động</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="requirements" className="space-y-4">
              <div>
                <Label>Yêu cầu giết quái</Label>
                {formData.requirements.killEnemies.map((enemy, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Loại quái"
                      value={enemy.enemyType}
                      onChange={(e) => {
                        const newEnemies = [...formData.requirements.killEnemies];
                        newEnemies[index].enemyType = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, killEnemies: newEnemies }
                        }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={enemy.count}
                      onChange={(e) => {
                        const newEnemies = [...formData.requirements.killEnemies];
                        newEnemies[index].count = parseInt(e.target.value) || 1;
                        setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, killEnemies: newEnemies }
                        }));
                      }}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeKillEnemyRequirement(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addKillEnemyRequirement}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm yêu cầu giết quái
                </Button>
              </div>

              <div>
                <Label>Yêu cầu thu thập vật phẩm</Label>
                {formData.requirements.collectItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Tên vật phẩm"
                      value={item.itemName}
                      onChange={(e) => {
                        const newItems = [...formData.requirements.collectItems];
                        newItems[index].itemName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, collectItems: newItems }
                        }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="ID vật phẩm"
                      value={item.itemId}
                      onChange={(e) => {
                        const newItems = [...formData.requirements.collectItems];
                        newItems[index].itemId = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, collectItems: newItems }
                        }));
                      }}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.requirements.collectItems];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setFormData(prev => ({
                          ...prev,
                          requirements: { ...prev.requirements, collectItems: newItems }
                        }));
                      }}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCollectItemRequirement(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCollectItemRequirement}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm yêu cầu thu thập
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="rewards" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-experience">Kinh nghiệm</Label>
                  <Input
                    id="edit-experience"
                    type="number"
                    value={formData.rewards.experience}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rewards: { ...prev.rewards, experience: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gold">Vàng</Label>
                  <Input
                    id="edit-gold"
                    type="number"
                    value={formData.rewards.gold}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      rewards: { ...prev.rewards, gold: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label>Vật phẩm thưởng</Label>
                {formData.rewards.items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Tên vật phẩm"
                      value={item.itemName}
                      onChange={(e) => {
                        const newItems = [...formData.rewards.items];
                        newItems[index].itemName = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          rewards: { ...prev.rewards, items: newItems }
                        }));
                      }}
                    />
                    <Input
                      type="number"
                      placeholder="ID vật phẩm"
                      value={item.itemId}
                      onChange={(e) => {
                        const newItems = [...formData.rewards.items];
                        newItems[index].itemId = parseInt(e.target.value) || 0;
                        setFormData(prev => ({
                          ...prev,
                          rewards: { ...prev.rewards, items: newItems }
                        }));
                      }}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      placeholder="Số lượng"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.rewards.items];
                        newItems[index].quantity = parseInt(e.target.value) || 1;
                        setFormData(prev => ({
                          ...prev,
                          rewards: { ...prev.rewards, items: newItems }
                        }));
                      }}
                      className="w-24"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRewardItem(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRewardItem}
                  className="mt-2"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm vật phẩm thưởng
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="dependencies" className="space-y-4">
              <div>
                <Label>Quest tiên quyết (ID)</Label>
                <Input
                  placeholder="Nhập ID các quest cách nhau bằng dấu phẩy (vd: 1,2,3)"
                  value={formData.dependencies.prerequisiteQuests.join(',')}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    dependencies: {
                      ...prev.dependencies,
                      prerequisiteQuests: e.target.value.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
                    }
                  }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Các quest này phải được hoàn thành trước khi có thể nhận quest này
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-depLevel">Level tối thiểu</Label>
                  <Input
                    id="edit-depLevel"
                    type="number"
                    value={formData.dependencies.requiredLevel || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dependencies: {
                        ...prev.dependencies,
                        requiredLevel: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    }))}
                    placeholder="Không bắt buộc"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-depTier">Tier class tối thiểu</Label>
                  <Input
                    id="edit-depTier"
                    type="number"
                    value={formData.dependencies.requiredClassTier || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      dependencies: {
                        ...prev.dependencies,
                        requiredClassTier: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    }))}
                    placeholder="Không bắt buộc"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateQuest}
              disabled={updateQuestMutation.isPending}
            >
              {updateQuestMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật Quest'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview Quest</DialogTitle>
            <DialogDescription>
              Xem trước quest trước khi lưu
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`p-2 rounded-full ${getQuestTypeColor(previewData.type)}`}>
                      {getQuestTypeIcon(previewData.type)}
                    </div>
                    <span>{previewData.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{previewData.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">Level {previewData.requiredLevel}</Badge>
                    <Badge variant={previewData.isActive ? "default" : "secondary"}>
                      {previewData.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {previewData.type === 'daily' && previewData.isRepeatable && (
                      <Badge variant="outline">Repeatable</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Yêu cầu hoàn thành</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.requirements.killEnemies.map((enemy, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Sword className="w-4 h-4 text-red-500" />
                        <span>Giết {enemy.count} con {enemy.enemyType}</span>
                      </div>
                    ))}

                    {previewData.requirements.collectItems.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span>Thu thập {item.quantity} {item.itemName}</span>
                      </div>
                    ))}

                    {previewData.requirements.completeDungeons.map((dungeon, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-500" />
                        <span>Hoàn thành {dungeon.dungeonName} {dungeon.count} lần</span>
                      </div>
                    ))}

                    {previewData.requirements.reachLevel && (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>Đạt level {previewData.requirements.reachLevel}</span>
                      </div>
                    )}

                    {previewData.requirements.defeatBoss && (
                      <div className="flex items-center space-x-2">
                        <Trophy className="w-4 h-4 text-orange-500" />
                        <span>Đánh bại {previewData.requirements.defeatBoss.bossName}</span>
                      </div>
                    )}

                    {previewData.requirements.killEnemies.length === 0 &&
                     previewData.requirements.collectItems.length === 0 &&
                     previewData.requirements.completeDungeons.length === 0 &&
                     !previewData.requirements.reachLevel &&
                     !previewData.requirements.defeatBoss && (
                      <p className="text-gray-500">Không có yêu cầu cụ thể</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Rewards */}
              <Card>
                <CardHeader>
                  <CardTitle>Phần thưởng</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.rewards.experience > 0 && (
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>{previewData.rewards.experience} EXP</span>
                      </div>
                    )}

                    {previewData.rewards.gold > 0 && (
                      <div className="flex items-center space-x-2">
                        <Coins className="w-4 h-4 text-yellow-600" />
                        <span>{previewData.rewards.gold} Gold</span>
                      </div>
                    )}

                    {previewData.rewards.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Package className="w-4 h-4 text-green-500" />
                        <span>{item.quantity} x {item.itemName}</span>
                      </div>
                    ))}

                    {previewData.rewards.experience === 0 &&
                     previewData.rewards.gold === 0 &&
                     previewData.rewards.items.length === 0 && (
                      <p className="text-gray-500">Không có phần thưởng</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Dependencies */}
              {(previewData.dependencies.prerequisiteQuests.length > 0 ||
                previewData.dependencies.requiredLevel ||
                previewData.dependencies.requiredClassTier) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Điều kiện tiên quyết</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {previewData.dependencies.prerequisiteQuests.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span>Hoàn thành quest: {previewData.dependencies.prerequisiteQuests.join(', ')}</span>
                        </div>
                      )}

                      {previewData.dependencies.requiredLevel && (
                        <div className="flex items-center space-x-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>Level tối thiểu: {previewData.dependencies.requiredLevel}</span>
                        </div>
                      )}

                      {previewData.dependencies.requiredClassTier && (
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-purple-500" />
                          <span>Tier class tối thiểu: {previewData.dependencies.requiredClassTier}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
