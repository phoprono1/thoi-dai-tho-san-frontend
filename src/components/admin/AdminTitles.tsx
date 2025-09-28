'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Crown, Plus, Edit, Trash2, Star, Award, Shield, Zap, Heart, Sparkles, Send } from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
import { toast } from 'sonner';
import { Title, TitleRarity, TitleSource, UserTitle, HunterRank, RANK_NAMES, TitleAnimation } from '@/types/game';

export default function AdminTitles() {
  const [editingTitle, setEditingTitle] = useState<Title | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'titles' | 'user-titles'>('titles');
  const [showSendTitleModal, setShowSendTitleModal] = useState(false);
  const [selectedTitleToSend, setSelectedTitleToSend] = useState<Title | null>(null);
  const [sendTitleForm, setSendTitleForm] = useState({
    username: '',
    reason: ''
  });
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rarity: TitleRarity.COMMON,
    source: TitleSource.ACHIEVEMENT,
    stats: {
      strength: 0,
      intelligence: 0,
      dexterity: 0,
      vitality: 0,
      luck: 0,
    },
    displayEffects: {
      color: '#000000',
      backgroundColor: '',
      borderColor: '',
      glow: false,
      animation: '',
      prefix: '',
      suffix: '',
    },
    requirements: {
      level: 0,
      pvpRank: '',
      guildLevel: 0,
      totalKills: 0,
      dungeonClears: 0,
      description: '',
      // Specific requirements - now arrays for multiple selections
      specificDungeons: [] as Array<{dungeonId: number, dungeonName: string, clearCount: number}>,
      specificEnemies: [] as Array<{enemyName: string, killCount: number}>,
      specificItems: [] as Array<{itemId: number, itemName: string, collectCount: number}>,
    },
    isActive: true,
    isHidden: false,
  });

  const queryClient = useQueryClient();

  // Fetch dungeons for dropdown
  const { data: dungeons = [] } = useQuery({
    queryKey: ['dungeons'],
    queryFn: async () => {
      const response = await api.get('/dungeons');
      return response.data || [];
    },
  });

  // Fetch items for dropdown  
  const { data: items = [] } = useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const response = await api.get('/items');
      return response.data || [];
    },
  });

  // Fetch monsters for dropdown  
  const { data: monsters = [] } = useQuery({
    queryKey: ['monsters'],
    queryFn: async () => {
      const response = await api.get('/monsters');
      return response.data || [];
    },
  });

  // Fetch user titles
  const { data: userTitles, isLoading: userTitlesLoading } = useQuery({
    queryKey: ['adminUserTitles'],
    queryFn: async (): Promise<UserTitle[]> => {
      // This would need an admin endpoint to get all user titles
      // For now, return empty array
      return [];
    },
    enabled: activeTab === 'user-titles',
  });

  // Fetch titles
  const { data: titles, isLoading: titlesLoading } = useQuery({
    queryKey: ['adminTitles'],
    queryFn: async () => {
      const response = await api.get('/titles/admin');
      return response.data;
    },
  });

  // Search users for dropdown
  const { data: searchUsers } = useQuery({
    queryKey: ['searchUsers', userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery || userSearchQuery.length < 2) return [];
      const response = await api.get(`/users/admin/search?q=${userSearchQuery}`);
      return response.data;
    },
    enabled: userSearchQuery.length >= 2,
  });

  // Create title mutation
  const createTitleMutation = useMutation({
    mutationFn: async (titleData: Partial<Title>) => {
      const response = await api.post('/titles/admin/create', titleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTitles'] });
      toast.success('Danh hiệu đã được tạo!');
      resetForm();
    },
    onError: (error: any) => {
    },
  });

  // Update title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, ...titleData }: { id: number } & Partial<Title>) => {
      const response = await api.put(`/titles/admin/${id}`, titleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTitles'] });
      toast.success('Danh hiệu đã được cập nhật!');
      setEditingTitle(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi cập nhật danh hiệu: ${error.response?.data?.message || error.message}`);
    },
  });

  // Delete title mutation
  const deleteTitleMutation = useMutation({
    mutationFn: async (titleId: number) => {
      const response = await api.delete(`/titles/admin/${titleId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTitles'] });
      toast.success('Danh hiệu đã được xóa!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi xóa danh hiệu: ${error.response?.data?.message || error.message}`);
    },
  });

  // Send title to user mutation
  const sendTitleMutation = useMutation({
    mutationFn: async ({ titleId, username, reason }: { titleId: number; username: string; reason: string }) => {
      const response = await api.post(`/titles/admin/send-to-user`, {
        titleId,
        username,
        reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUserTitles'] });
      toast.success('Đã gửi danh hiệu độc quyền cho user!');
      setShowSendTitleModal(false);
      setSendTitleForm({ username: '', reason: '' });
      setSelectedTitleToSend(null);
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi gửi danh hiệu: ${error.response?.data?.message || error.message}`);
    },
  });

  // Initialize default titles mutation
  const initializeTitlesMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/titles/admin/initialize');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminTitles'] });
      toast.success('Danh hiệu mặc định đã được khởi tạo!');
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi khởi tạo danh hiệu: ${error.response?.data?.message || error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rarity: TitleRarity.COMMON,
      source: TitleSource.ACHIEVEMENT,
      stats: {
        strength: 0,
        intelligence: 0,
        dexterity: 0,
        vitality: 0,
        luck: 0,
      },
      displayEffects: {
        color: '#000000',
        backgroundColor: '',
        borderColor: '',
        glow: false,
        animation: '',
        prefix: '',
        suffix: '',
      },
      requirements: {
        level: 0,
        pvpRank: '',
        guildLevel: 0,
        totalKills: 0,
        dungeonClears: 0,
        description: '',
        // Specific requirements - now arrays for multiple selections
        specificDungeons: [] as Array<{dungeonId: number, dungeonName: string, clearCount: number}>,
        specificEnemies: [] as Array<{enemyName: string, killCount: number}>,
        specificItems: [] as Array<{itemId: number, itemName: string, collectCount: number}>,
      },
      isActive: true,
      isHidden: false,
    });
    setShowCreateForm(false);
    setEditingTitle(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Tên danh hiệu không được để trống');
      return;
    }

    if (editingTitle) {
      updateTitleMutation.mutate({ id: editingTitle.id, ...formData });
    } else {
      createTitleMutation.mutate(formData);
    }
  };

  const handleSendTitle = (title: Title) => {
    setSelectedTitleToSend(title);
    setShowSendTitleModal(true);
  };

  const handleSendTitleSubmit = () => {
    if (!selectedTitleToSend || !sendTitleForm.username.trim()) {
      toast.error('Vui lòng nhập username');
      return;
    }

    sendTitleMutation.mutate({
      titleId: selectedTitleToSend.id,
      username: sendTitleForm.username,
      reason: sendTitleForm.reason
    });
  };

  const startEdit = (title: Title) => {
    setEditingTitle(title);
    setFormData({
      name: title.name,
      description: title.description,
      rarity: title.rarity,
      source: title.source,
      stats: {
        strength: title.stats?.strength || 0,
        intelligence: title.stats?.intelligence || 0,
        dexterity: title.stats?.dexterity || 0,
        vitality: title.stats?.vitality || 0,
        luck: title.stats?.luck || 0,
      },
      displayEffects: {
        color: title.displayEffects?.color || '#000000',
        backgroundColor: title.displayEffects?.backgroundColor || '',
        borderColor: title.displayEffects?.borderColor || '',
        glow: title.displayEffects?.glow || false,
        animation: title.displayEffects?.animation || '',
        prefix: title.displayEffects?.prefix || '',
        suffix: title.displayEffects?.suffix || '',
      },
      requirements: {
        level: title.requirements?.level || 0,
        pvpRank: title.requirements?.pvpRank || '',
        guildLevel: title.requirements?.guildLevel || 0,
        totalKills: title.requirements?.totalKills || 0,
        dungeonClears: title.requirements?.dungeonClears || 0,
        description: title.requirements?.description || '',
        // Specific requirements - now arrays for multiple selections
        specificDungeons: (title.requirements as any)?.specificDungeons || [],
        specificEnemies: (title.requirements as any)?.specificEnemies || [],
        specificItems: (title.requirements as any)?.specificItems || [],
      },
      isActive: title.isActive,
      isHidden: title.isHidden,
    });
    setShowCreateForm(true);
  };

  const getRarityColor = (rarity: TitleRarity) => {
    switch (rarity) {
      case TitleRarity.COMMON: return 'bg-gray-100 text-gray-800';
      case TitleRarity.UNCOMMON: return 'bg-green-100 text-green-800';
      case TitleRarity.RARE: return 'bg-blue-100 text-blue-800';
      case TitleRarity.EPIC: return 'bg-purple-100 text-purple-800';
      case TitleRarity.LEGENDARY: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSourceIcon = (source: TitleSource) => {
    switch (source) {
      case TitleSource.ACHIEVEMENT: return <Award className="h-4 w-4" />;
      case TitleSource.PVP_RANK: return <Shield className="h-4 w-4" />;
      case TitleSource.GUILD_RANK: return <Crown className="h-4 w-4" />;
      case TitleSource.EVENT: return <Sparkles className="h-4 w-4" />;
      case TitleSource.ADMIN: return <Star className="h-4 w-4" />;
      default: return <Award className="h-4 w-4" />;
    }
  };

  // DataTable columns for titles
  const titleColumns = [
    {
      key: 'name' as keyof Title,
      label: 'Tên',
      render: (value: unknown, item: Title) => (
        <div className="flex items-center gap-2">
          {getSourceIcon(item.source)}
          <span className="font-medium">{value as string}</span>
          {item.displayEffects?.prefix && (
            <Badge variant="outline" style={{ color: item.displayEffects.color }}>
              {item.displayEffects.prefix}
            </Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'rarity' as keyof Title,
      label: 'Độ hiếm',
      render: (value: unknown) => (
        <Badge className={getRarityColor(value as TitleRarity)}>
          {value as string}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: 'source' as keyof Title,
      label: 'Nguồn',
      render: (value: unknown) => (
        <span className="capitalize">{(value as string).replace('_', ' ')}</span>
      ),
      sortable: true,
    },
    {
      key: 'stats' as keyof Title,
      label: 'Stats',
      render: (value: unknown) => {
        const stats = value as Title['stats'];
        if (!stats) return '-';
        const statEntries = Object.entries(stats).filter(([_, val]) => val && val > 0);
        if (statEntries.length === 0) return '-';
        return (
          <div className="flex gap-1 flex-wrap">
            {statEntries.map(([stat, val]) => (
              <Badge key={stat} variant="secondary" className="text-xs">
                {stat.slice(0, 3)}: +{val}
              </Badge>
            ))}
          </div>
        );
      },
      sortable: false,
    },
    {
      key: 'isActive' as keyof Title,
      label: 'Trạng thái',
      render: (value: unknown, item: Title) => (
        <div className="flex gap-1">
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? 'Active' : 'Inactive'}
          </Badge>
          {item.isHidden && (
            <Badge variant="outline">Hidden</Badge>
          )}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'actions' as keyof Title,
      label: 'Actions',
      render: (value: unknown, item: Title) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => startEdit(item)}
          >
            <Edit className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleSendTitle(item)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Send className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteTitleMutation.mutate(item.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crown className="h-6 w-6 text-yellow-600" />
            Quản lý Danh hiệu
          </h2>
          <p className="text-muted-foreground">
            Tạo và quản lý danh hiệu cho người chơi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => initializeTitlesMutation.mutate()}
            disabled={initializeTitlesMutation.isPending}
            variant="outline"
          >
            Khởi tạo Danh hiệu Mặc định
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Tạo Danh hiệu
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList>
          <TabsTrigger value="titles">Danh hiệu</TabsTrigger>
          <TabsTrigger value="user-titles">Danh hiệu Người chơi</TabsTrigger>
        </TabsList>

        <TabsContent value="titles" className="space-y-6">
          {showCreateForm && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingTitle ? 'Chỉnh sửa Danh hiệu' : 'Tạo Danh hiệu Mới'}
                </CardTitle>
                <CardDescription>
                  {editingTitle ? 'Cập nhật thông tin danh hiệu' : 'Tạo danh hiệu mới cho hệ thống'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Tên danh hiệu</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập tên danh hiệu"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="rarity">Độ hiếm</Label>
                    <Select
                      value={formData.rarity}
                      onValueChange={(value) => setFormData({ ...formData, rarity: value as TitleRarity })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TitleRarity).map((rarity) => (
                          <SelectItem key={rarity} value={rarity}>
                            {rarity}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="source">Nguồn</Label>
                    <Select
                      value={formData.source}
                      onValueChange={(value) => setFormData({ ...formData, source: value as TitleSource })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TitleSource).map((source) => (
                          <SelectItem key={source} value={source}>
                            {source.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="isHidden"
                        checked={formData.isHidden}
                        onCheckedChange={(checked) => setFormData({ ...formData, isHidden: checked })}
                      />
                      <Label htmlFor="isHidden">Hidden</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả danh hiệu"
                    rows={3}
                  />
                </div>

                {/* Stats Section */}
                <div>
                  <Label className="text-base font-medium">Chỉ số Bonus</Label>
                  <div className="grid grid-cols-5 gap-4 mt-2">
                    {Object.entries(formData.stats).map(([stat, value]) => (
                      <div key={stat}>
                        <Label htmlFor={stat} className="text-sm capitalize">
                          {stat}
                        </Label>
                        <Input
                          id={stat}
                          type="number"
                          min="0"
                          value={value}
                          onChange={(e) => setFormData({
                            ...formData,
                            stats: {
                              ...formData.stats,
                              [stat]: parseInt(e.target.value) || 0
                            }
                          })}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Display Effects Section */}
                <div>
                  <Label className="text-base font-medium">Hiệu ứng Hiển thị</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="prefix">Prefix</Label>
                      <Input
                        id="prefix"
                        value={formData.displayEffects.prefix}
                        onChange={(e) => setFormData({
                          ...formData,
                          displayEffects: {
                            ...formData.displayEffects,
                            prefix: e.target.value
                          }
                        })}
                        placeholder="[Prefix]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="suffix">Suffix</Label>
                      <Input
                        id="suffix"
                        value={formData.displayEffects.suffix}
                        onChange={(e) => setFormData({
                          ...formData,
                          displayEffects: {
                            ...formData.displayEffects,
                            suffix: e.target.value
                          }
                        })}
                        placeholder="[Suffix]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="color">Màu chữ</Label>
                      <Input
                        id="color"
                        type="color"
                        value={formData.displayEffects.color}
                        onChange={(e) => setFormData({
                          ...formData,
                          displayEffects: {
                            ...formData.displayEffects,
                            color: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="animation">Animation Effect</Label>
                      <Select
                        value={formData.displayEffects.animation}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          displayEffects: {
                            ...formData.displayEffects,
                            animation: value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn hiệu ứng" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TitleAnimation).map((animation) => (
                            <SelectItem key={animation} value={animation}>
                              {animation.charAt(0).toUpperCase() + animation.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="glow"
                        checked={formData.displayEffects.glow}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          displayEffects: {
                            ...formData.displayEffects,
                            glow: checked
                          }
                        })}
                      />
                      <Label htmlFor="glow">Glow Effect</Label>
                    </div>
                  </div>
                </div>

                {/* Requirements Section */}
                <div>
                  <Label className="text-base font-medium">Điều kiện Mở khóa</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="reqLevel">Level tối thiểu</Label>
                      <Input
                        id="reqLevel"
                        type="number"
                        min="0"
                        value={formData.requirements.level}
                        onChange={(e) => setFormData({
                          ...formData,
                          requirements: {
                            ...formData.requirements,
                            level: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="totalKills">Tổng số quái giết</Label>
                      <Input
                        id="totalKills"
                        type="number"
                        min="0"
                        value={formData.requirements.totalKills}
                        onChange={(e) => setFormData({
                          ...formData,
                          requirements: {
                            ...formData.requirements,
                            totalKills: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dungeonClears">Số lần clear dungeon</Label>
                      <Input
                        id="dungeonClears"
                        type="number"
                        min="0"
                        value={formData.requirements.dungeonClears}
                        onChange={(e) => setFormData({
                          ...formData,
                          requirements: {
                            ...formData.requirements,
                            dungeonClears: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pvpRank">PvP Rank</Label>
                      <Select
                        value={formData.requirements.pvpRank || 'none'}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          requirements: {
                            ...formData.requirements,
                            pvpRank: value === 'none' ? '' : value
                          }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn PvP Rank" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không yêu cầu</SelectItem>
                          {Object.entries(RANK_NAMES).map(([rank, name]) => (
                            <SelectItem key={rank} value={rank}>
                              {name} ({rank})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Specific Requirements Section */}
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <Label className="text-sm font-medium text-gray-700">Điều kiện đặc thù</Label>
                    
                    {/* Dungeon Requirements */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Hầm ngục cụ thể</Label>
                      <div className="space-y-2 mt-2">
                        {formData.requirements.specificDungeons.map((dungeon, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Select
                              value={dungeon.dungeonId.toString()}
                              onValueChange={(value) => {
                                const selectedDungeon = dungeons.find((d: any) => d.id.toString() === value);
                                const newDungeons = [...formData.requirements.specificDungeons];
                                newDungeons[index] = {
                                  ...newDungeons[index],
                                  dungeonId: parseInt(value),
                                  dungeonName: selectedDungeon?.name || ''
                                };
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificDungeons: newDungeons }
                                });
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Chọn hầm ngục" />
                              </SelectTrigger>
                              <SelectContent>
                                {dungeons.map((dungeon: any) => (
                                  <SelectItem key={dungeon.id} value={dungeon.id.toString()}>
                                    {dungeon.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Số lần"
                              min="0"
                              className="w-24"
                              value={dungeon.clearCount}
                              onChange={(e) => {
                                const newDungeons = [...formData.requirements.specificDungeons];
                                newDungeons[index].clearCount = parseInt(e.target.value) || 0;
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificDungeons: newDungeons }
                                });
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newDungeons = formData.requirements.specificDungeons.filter((_, i) => i !== index);
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificDungeons: newDungeons }
                                });
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              requirements: {
                                ...formData.requirements,
                                specificDungeons: [...formData.requirements.specificDungeons, { dungeonId: 0, dungeonName: '', clearCount: 1 }]
                              }
                            });
                          }}
                        >
                          + Thêm hầm ngục
                        </Button>
                      </div>
                    </div>

                    {/* Enemy Requirements */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Quái vật cụ thể</Label>
                      <div className="space-y-2 mt-2">
                        {formData.requirements.specificEnemies.map((enemy, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Select
                              value={enemy.enemyName}
                              onValueChange={(value) => {
                                const newEnemies = [...formData.requirements.specificEnemies];
                                newEnemies[index].enemyName = value;
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificEnemies: newEnemies }
                                });
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Chọn quái vật" />
                              </SelectTrigger>
                              <SelectContent>
                                {monsters.map((monster: any) => (
                                  <SelectItem key={monster.id} value={monster.name}>
                                    {monster.name} (Lv.{monster.level})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Số lượng"
                              min="0"
                              className="w-24"
                              value={enemy.killCount}
                              onChange={(e) => {
                                const newEnemies = [...formData.requirements.specificEnemies];
                                newEnemies[index].killCount = parseInt(e.target.value) || 0;
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificEnemies: newEnemies }
                                });
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newEnemies = formData.requirements.specificEnemies.filter((_, i) => i !== index);
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificEnemies: newEnemies }
                                });
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              requirements: {
                                ...formData.requirements,
                                specificEnemies: [...formData.requirements.specificEnemies, { enemyName: '', killCount: 1 }]
                              }
                            });
                          }}
                        >
                          + Thêm quái vật
                        </Button>
                      </div>
                    </div>

                    {/* Item Requirements */}
                    <div className="mt-4">
                      <Label className="text-sm font-medium">Vật phẩm cụ thể</Label>
                      <div className="space-y-2 mt-2">
                        {formData.requirements.specificItems.map((item, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Select
                              value={item.itemId.toString()}
                              onValueChange={(value) => {
                                const selectedItem = items.find((i: any) => i.id.toString() === value);
                                const newItems = [...formData.requirements.specificItems];
                                newItems[index] = {
                                  ...newItems[index],
                                  itemId: parseInt(value),
                                  itemName: selectedItem?.name || ''
                                };
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificItems: newItems }
                                });
                              }}
                            >
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Chọn vật phẩm" />
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((item: any) => (
                                  <SelectItem key={item.id} value={item.id.toString()}>
                                    {item.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              placeholder="Số lượng"
                              min="0"
                              className="w-24"
                              value={item.collectCount}
                              onChange={(e) => {
                                const newItems = [...formData.requirements.specificItems];
                                newItems[index].collectCount = parseInt(e.target.value) || 0;
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificItems: newItems }
                                });
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newItems = formData.requirements.specificItems.filter((_, i) => i !== index);
                                setFormData({
                                  ...formData,
                                  requirements: { ...formData.requirements, specificItems: newItems }
                                });
                              }}
                            >
                              Xóa
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              requirements: {
                                ...formData.requirements,
                                specificItems: [...formData.requirements.specificItems, { itemId: 0, itemName: '', collectCount: 1 }]
                              }
                            });
                          }}
                        >
                          + Thêm vật phẩm
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <Label htmlFor="reqDescription">Mô tả điều kiện</Label>
                    <Textarea
                      id="reqDescription"
                      value={formData.requirements.description}
                      onChange={(e) => setFormData({
                        ...formData,
                        requirements: {
                          ...formData.requirements,
                          description: e.target.value
                        }
                      })}
                      placeholder="Mô tả chi tiết điều kiện mở khóa"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSubmit}
                    disabled={createTitleMutation.isPending || updateTitleMutation.isPending}
                  >
                    {editingTitle ? 'Cập nhật' : 'Tạo'} Danh hiệu
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Hủy
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Danh sách Danh hiệu</CardTitle>
              <CardDescription>
                Tất cả danh hiệu trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={titles || []}
                columns={titleColumns}
                loading={titlesLoading}
                title="Danh sách Danh hiệu"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="user-titles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh hiệu Người chơi</CardTitle>
              <CardDescription>
                Quản lý danh hiệu của từng người chơi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Cách gửi danh hiệu độc quyền:</h4>
                <ol className="text-sm text-blue-700 space-y-1">
                  <li><strong>1.</strong> Tạo danh hiệu mới và đánh dấu <strong>"Hidden"</strong> ✅</li>
                  <li><strong>2.</strong> Danh hiệu Hidden sẽ không hiển thị trong danh sách công khai</li>
                  <li><strong>3.</strong> Chỉ admin có thể gửi Hidden titles cho users cụ thể</li>
                  <li><strong>4.</strong> Click nút <strong>Send</strong> (📤) để gửi cho user</li>
                </ol>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">⚠️ Lưu ý quan trọng:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• <strong>Hidden titles</strong> không thể unlock bằng achievements</li>
                  <li>• Chỉ admin có thể phân phối thông qua Send Title</li>
                  <li>• Phù hợp cho: Event rewards, Special recognition, VIP titles</li>
                  <li>• User search dropdown giúp tránh nhập sai tên</li>
                </ul>
              </div>

              <p className="text-muted-foreground text-center">
                User management features sẽ được phát triển trong tương lai
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Send Title Modal */}
      {showSendTitleModal && selectedTitleToSend && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Gửi Danh hiệu Độc quyền
              </CardTitle>
              <CardDescription>
                Gửi "{selectedTitleToSend.name}" cho user cụ thể
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Nhập username (tối thiểu 2 ký tự)"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setShowUserDropdown(e.target.value.length >= 2);
                  }}
                  onFocus={() => setShowUserDropdown(userSearchQuery.length >= 2)}
                />
                
                {/* User Dropdown */}
                {showUserDropdown && searchUsers && searchUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {searchUsers.map((user: any) => (
                      <div
                        key={user.id}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                        onClick={() => {
                          setSendTitleForm({
                            ...sendTitleForm,
                            username: user.username
                          });
                          setUserSearchQuery(user.username);
                          setShowUserDropdown(false);
                        }}
                      >
                        <span className="font-medium">{user.username}</span>
                        <span className="text-sm text-gray-500">Lv.{user.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="reason">Lý do (tùy chọn)</Label>
                <Textarea
                  id="reason"
                  placeholder="VD: Thưởng event, đóng góp đặc biệt..."
                  value={sendTitleForm.reason}
                  onChange={(e) => setSendTitleForm({
                    ...sendTitleForm,
                    reason: e.target.value
                  })}
                />
              </div>
            </CardContent>
            <div className="flex gap-2 p-6 pt-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSendTitleModal(false);
                  setSendTitleForm({ username: '', reason: '' });
                  setSelectedTitleToSend(null);
                }}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                onClick={handleSendTitleSubmit}
                disabled={sendTitleMutation.isPending || !sendTitleForm.username.trim()}
                className="flex-1"
              >
                {sendTitleMutation.isPending ? 'Đang gửi...' : 'Gửi'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
