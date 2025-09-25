'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiEndpoints } from '@/lib/admin-api';
import { toast } from 'sonner';
import { Calendar, Gift, Plus, Edit, Save, X } from 'lucide-react';

interface RewardData {
  gold?: number;
  exp?: number;
  items?: Array<{
    itemId: number;
    quantity: number;
  }>;
}

interface RewardForm {
  gold: number;
  exp: number;
  items: Array<{
    itemId: number;
    quantity: number;
  }>;
}

interface DailyReward {
  day: number;
  rewards: RewardData;
}

interface StreakReward {
  streak: number;
  rewards: RewardData;
}

interface Item {
  id: number;
  name: string;
  description?: string;
  type?: string;
  rarity?: string;
}

interface ConfigForm {
  year: number;
  month: number;
  enabled: boolean;
  metadata: {
    dailyRewards: DailyReward[];
    streakRewards: StreakReward[];
  };
}

interface DailyLoginConfig {
  id: number;
  year: number;
  month: number;
  enabled: boolean;
  metadata: {
    dailyRewards: {
      day: number;
      rewards: {
        gold?: number;
        items?: { itemId: number; quantity: number }[];
        exp?: number;
      };
    }[];
    streakRewards: {
      streak: number;
      rewards: {
        gold?: number;
        items?: { itemId: number; quantity: number }[];
        exp?: number;
      };
    }[];
  };
  createdAt: string;
  updatedAt: string;
}

interface RewardForm {
  gold: number;
  exp: number;
  items: { itemId: number; quantity: number }[];
}

export default function AdminDailyLogin() {
  const [selectedConfig, setSelectedConfig] = useState<DailyLoginConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');

  // Form state for daily rewards (31 days)
  const [dailyRewards, setDailyRewards] = useState<RewardForm[]>(
    Array.from({ length: 31 }, () => ({
      gold: 0,
      exp: 0,
      items: [],
    }))
  );

  // Form state for streak rewards
  const [streakRewards, setStreakRewards] = useState<RewardForm[]>(
    Array.from({ length: 7 }, () => ({
      gold: 0,
      exp: 0,
      items: [],
    }))
  );

  const queryClient = useQueryClient();

  // Fetch all configs
  const { data: configs, isLoading } = useQuery({
    queryKey: ['daily-login-configs'],
    queryFn: async () => {
      const response = await adminApiEndpoints.getDailyLoginConfigs();
      return response.data.configs as DailyLoginConfig[];
    },
  });

  // Fetch all items for selection
  const { data: items } = useQuery({
    queryKey: ['admin-items'],
    queryFn: async () => {
      const response = await adminApiEndpoints.getItems();
      return response.data as Item[];
    },
  });

  // Create/Update config mutation
  const createOrUpdateMutation = useMutation({
    mutationFn: async (data: ConfigForm) => {
      const response = await adminApiEndpoints.createOrUpdateDailyLoginConfig(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-login-configs'] });
      toast.success('Daily login config saved successfully!');
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(`Failed to save config: ${err.response?.data?.message || err.message}`);
    },
  });

  const handleEditConfig = (config: DailyLoginConfig) => {
    setSelectedConfig(config);
    setCurrentYear(config.year);
    setCurrentMonth(config.month);
    setIsEditing(true);

    // Load existing rewards
    if (config.metadata?.dailyRewards) {
      const loadedDailyRewards = Array.from({ length: 31 }, (_, i) => {
        const dayReward = config.metadata.dailyRewards.find(r => r.day === i + 1);
        return dayReward ? {
          gold: dayReward.rewards.gold || 0,
          exp: dayReward.rewards.exp || 0,
          items: dayReward.rewards.items || [],
        } : {
          gold: 0,
          exp: 0,
          items: [],
        };
      });
      setDailyRewards(loadedDailyRewards);
    }

    if (config.metadata?.streakRewards) {
      const loadedStreakRewards = Array.from({ length: 7 }, (_, i) => {
        const streakReward = config.metadata.streakRewards.find(r => r.streak === i + 1);
        return streakReward ? {
          gold: streakReward.rewards.gold || 0,
          exp: streakReward.rewards.exp || 0,
          items: streakReward.rewards.items || [],
        } : {
          gold: 0,
          exp: 0,
          items: [],
        };
      });
      setStreakRewards(loadedStreakRewards);
    }
  };

  const handleNewConfig = () => {
    setSelectedConfig(null);
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth() + 1);
    setIsEditing(true);

    // Reset form
    setDailyRewards(Array.from({ length: 31 }, () => ({
      gold: 0,
      exp: 0,
      items: [],
    })));
    setStreakRewards(Array.from({ length: 7 }, () => ({
      gold: 0,
      exp: 0,
      items: [],
    })));
  };

  const handleAddItem = (dayIndex: number, isStreak: boolean, itemId: number) => {
    if (!itemId) return;
    const rewards = isStreak ? [...streakRewards] : [...dailyRewards];
    const index = dayIndex;

    if (rewards[index].items.find(s => s.itemId === itemId)) return; // Already added
    rewards[index].items.push({ itemId, quantity: 1 });

    if (isStreak) {
      setStreakRewards(rewards);
    } else {
      setDailyRewards(rewards);
    }
    setSelectedItemId('');
  };

  const handleSaveConfig = () => {
    const dailyRewardsData = dailyRewards
      .map((reward, index) => ({
        day: index + 1,
        rewards: {
          gold: reward.gold || undefined,
          exp: reward.exp || undefined,
          items: reward.items.length > 0 ? reward.items : undefined,
        },
      }))
      .filter(reward => reward.rewards.gold || reward.rewards.exp || reward.rewards.items);

    const streakRewardsData = streakRewards
      .map((reward, index) => ({
        streak: index + 1,
        rewards: {
          gold: reward.gold || undefined,
          exp: reward.exp || undefined,
          items: reward.items.length > 0 ? reward.items : undefined,
        },
      }))
      .filter(reward => reward.rewards.gold || reward.rewards.exp || reward.rewards.items);

    const configData = {
      year: currentYear,
      month: currentMonth,
      enabled: true,
      metadata: {
        dailyRewards: dailyRewardsData,
        streakRewards: streakRewardsData,
      },
    };

    createOrUpdateMutation.mutate(configData);
  };

  const updateDailyReward = (dayIndex: number, field: keyof RewardForm, value: number | Array<{ itemId: number; quantity: number }>) => {
    const newRewards = [...dailyRewards];
    if (field === 'items') {
      newRewards[dayIndex] = { ...newRewards[dayIndex], items: value as Array<{ itemId: number; quantity: number }> };
    } else {
      newRewards[dayIndex] = { ...newRewards[dayIndex], [field]: value as number };
    }
    setDailyRewards(newRewards);
  };

  const updateStreakReward = (streakIndex: number, field: keyof RewardForm, value: number | Array<{ itemId: number; quantity: number }>) => {
    const newRewards = [...streakRewards];
    if (field === 'items') {
      newRewards[streakIndex] = { ...newRewards[streakIndex], items: value as Array<{ itemId: number; quantity: number }> };
    } else {
      newRewards[streakIndex] = { ...newRewards[streakIndex], [field]: value as number };
    }
    setStreakRewards(newRewards);
  };

  const removeItemFromReward = (dayIndex: number, isStreak: boolean, itemId: number) => {
    const rewards = isStreak ? [...streakRewards] : [...dailyRewards];
    const index = isStreak ? Math.floor(dayIndex / 31) : dayIndex;

    if (rewards[index].items) {
      rewards[index].items = rewards[index].items.filter(item => item.itemId !== itemId);
    }

    if (isStreak) {
      setStreakRewards(rewards);
    } else {
      setDailyRewards(rewards);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Daily Login Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Configure daily login rewards and streak bonuses for players
          </p>
        </div>
        <Button onClick={handleNewConfig} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Config
        </Button>
      </div>

      {/* Existing Configs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Existing Configurations
          </CardTitle>
          <CardDescription>
            Manage monthly daily login reward configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs && configs.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {configs.map((config) => (
                <Card key={`${config.year}-${config.month}`} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {new Date(config.year, config.month - 1).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                          })}
                        </CardTitle>
                        <CardDescription>
                          {config.metadata?.dailyRewards?.length || 0} daily rewards,{' '}
                          {config.metadata?.streakRewards?.length || 0} streak rewards
                        </CardDescription>
                      </div>
                      <Badge variant={config.enabled ? 'default' : 'secondary'}>
                        {config.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditConfig(config)}
                      className="w-full"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No configurations found. Create your first daily login config!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              {selectedConfig ? 'Edit' : 'Create'} Configuration
            </CardTitle>
            <CardDescription>
              Set up rewards for {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Month/Year Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                  min="2024"
                  max="2030"
                />
              </div>
              <div>
                <Label htmlFor="month">Month</Label>
                <Select value={currentMonth.toString()} onValueChange={(value) => setCurrentMonth(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Item selector */}
            <div>
              <Label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Chọn vật phẩm để thêm vào phần thưởng</Label>
              <div className="flex items-center gap-2">
                <select
                  className="p-2 border rounded bg-white dark:bg-slate-800 flex-1"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                >
                  <option value="">-- Chọn item --</option>
                  {items?.map(it => (
                    <option key={it.id} value={it.id}>{it.name} (ID: {it.id})</option>
                  ))}
                </select>
              </div>
            </div>

            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily Rewards</TabsTrigger>
                <TabsTrigger value="streak">Streak Rewards</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {dailyRewards.map((reward, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Day {index + 1}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Gold</Label>
                          <Input
                            type="number"
                            value={reward.gold}
                            onChange={(e) => updateDailyReward(index, 'gold', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">EXP</Label>
                          <Input
                            type="number"
                            value={reward.exp}
                            onChange={(e) => updateDailyReward(index, 'exp', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Items</Label>
                          <div className="space-y-1">
                            {reward.items && reward.items.map((item, itemIndex) => {
                              const itemName = items?.find(i => i.id === item.itemId)?.name || `Item ${item.itemId}`;
                              return (
                                <div key={itemIndex} className="flex items-center gap-2 text-xs">
                                  <span className="flex-1">{itemName}</span>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 1;
                                      const newItems = [...reward.items];
                                      newItems[itemIndex] = { ...newItems[itemIndex], quantity: newQuantity };
                                      updateDailyReward(index, 'items', newItems);
                                    }}
                                    className="w-16 h-6 text-xs"
                                    min="1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItemFromReward(index, false, item.itemId)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              );
                            })}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddItem(index, false, Number(selectedItemId))}
                              disabled={!selectedItemId}
                              className="w-full text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="streak" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {streakRewards.map((reward, index) => (
                    <Card key={index} className="relative">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">{index + 1} Day Streak</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label className="text-xs">Gold</Label>
                          <Input
                            type="number"
                            value={reward.gold}
                            onChange={(e) => updateStreakReward(index, 'gold', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">EXP</Label>
                          <Input
                            type="number"
                            value={reward.exp}
                            onChange={(e) => updateStreakReward(index, 'exp', parseInt(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Items</Label>
                          <div className="space-y-1">
                            {reward.items && reward.items.map((item, itemIndex) => {
                              const itemName = items?.find(i => i.id === item.itemId)?.name || `Item ${item.itemId}`;
                              return (
                                <div key={itemIndex} className="flex items-center gap-2 text-xs">
                                  <span className="flex-1">{itemName}</span>
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const newQuantity = parseInt(e.target.value) || 1;
                                      const newItems = [...reward.items];
                                      newItems[itemIndex] = { ...newItems[itemIndex], quantity: newQuantity };
                                      updateStreakReward(index, 'items', newItems);
                                    }}
                                    className="w-16 h-6 text-xs"
                                    min="1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItemFromReward(index, true, item.itemId)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              );
                            })}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddItem(index, true, Number(selectedItemId))}
                              disabled={!selectedItemId}
                              className="w-full text-xs"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add Item
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveConfig}
                disabled={createOrUpdateMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {createOrUpdateMutation.isPending ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}