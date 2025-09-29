'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Crown, Sword, Target, Trophy, Users, Clock, Search } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';

interface Requirements {
  stats?: {
    minStrength?: number;
    minIntelligence?: number;
    minDexterity?: number;
    minVitality?: number;
    minLuck?: number;
    minTotalStats?: number;
  };
  dungeons?: Array<{
    dungeonId: number;
    dungeonName: string;
    requiredCompletions: number;
  }>;
  quests?: Array<{
    questId: number;
    questName: string;
  }>;
  items?: Array<{
    itemId: number;
    itemName: string;
    quantity: number;
  }>;
  achievements?: Array<{
    achievementId: number;
    achievementName: string;
  }>;
  pvpRank?: {
    minRank?: number;
    minPoints?: number;
  };
  guildLevel?: number;
  playtime?: number; // in minutes
}

interface RequirementsEditorProps {
  requirements: Requirements;
  onChange: (requirements: Requirements) => void;
  className?: string;
}

export default function RequirementsEditor({ 
  requirements, 
  onChange, 
  className = '' 
}: RequirementsEditorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch dungeons
  const { data: dungeons = [] } = useQuery({
    queryKey: ['adminDungeons'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/dungeons');
      return response.data;
    },
  });

  // Fetch quests
  const { data: quests = [] } = useQuery({
    queryKey: ['adminQuests'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/quests');
      return response.data;
    },
  });

  // Fetch items
  const { data: items = [] } = useQuery({
    queryKey: ['adminItems'],
    queryFn: async () => {
      const response = await adminApi.get('/admin/items');
      return response.data;
    },
  });

  const updateRequirements = (section: keyof Requirements, value: any) => {
    const newRequirements = {
      ...requirements,
      [section]: value,
    };
    console.log('updateRequirements:', { section, value, newRequirements });
    onChange(newRequirements);
  };

  const StatRequirements = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <Sword className="h-4 w-4 text-red-500" />
            Min Strength
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minStrength || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minStrength: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-blue-500" />
            Min Intelligence
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minIntelligence || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minIntelligence: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4 text-green-500" />
            Min Dexterity
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minDexterity || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minDexterity: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-purple-500" />
            Min Vitality
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minVitality || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minVitality: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <span className="h-4 w-4 text-yellow-500">★</span>
            Min Luck
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minLuck || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minLuck: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gray-500" />
            Min Total Stats
          </Label>
          <Input
            type="number"
            value={requirements.stats?.minTotalStats || ''}
            onChange={(e) => updateRequirements('stats', {
              ...requirements.stats,
              minTotalStats: parseInt(e.target.value) || undefined,
            })}
            placeholder="0"
          />
        </div>
      </div>

      {/* Current Stats Display */}
      {requirements.stats && Object.values(requirements.stats).some(v => v && v > 0) && (
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Current Stat Requirements:</h4>
          <div className="flex flex-wrap gap-2">
            {requirements.stats.minStrength && (
              <Badge variant="outline">STR ≥ {requirements.stats.minStrength}</Badge>
            )}
            {requirements.stats.minIntelligence && (
              <Badge variant="outline">INT ≥ {requirements.stats.minIntelligence}</Badge>
            )}
            {requirements.stats.minDexterity && (
              <Badge variant="outline">DEX ≥ {requirements.stats.minDexterity}</Badge>
            )}
            {requirements.stats.minVitality && (
              <Badge variant="outline">VIT ≥ {requirements.stats.minVitality}</Badge>
            )}
            {requirements.stats.minLuck && (
              <Badge variant="outline">LUK ≥ {requirements.stats.minLuck}</Badge>
            )}
            {requirements.stats.minTotalStats && (
              <Badge variant="outline">Total ≥ {requirements.stats.minTotalStats}</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const DungeonRequirements = () => {
    const addDungeon = () => {
      const newDungeon = {
        dungeonId: 0,
        dungeonName: '',
        requiredCompletions: 1,
      };
      updateRequirements('dungeons', [
        ...(requirements.dungeons || []),
        newDungeon,
      ]);
    };

    const updateDungeon = (index: number, field: string, value: any) => {
      const dungeons = [...(requirements.dungeons || [])];
      dungeons[index] = { ...dungeons[index], [field]: value };
      console.log('updateDungeon:', { index, field, value, dungeons });
      updateRequirements('dungeons', dungeons);
    };

    const removeDungeon = (index: number) => {
      const dungeons = [...(requirements.dungeons || [])];
      dungeons.splice(index, 1);
      updateRequirements('dungeons', dungeons);
    };

    const selectDungeon = (index: number, dungeonId: string) => {
      console.log('selectDungeon:', { index, dungeonId, dungeons });
      const selectedDungeon = dungeons.find((d: any) => d.id.toString() === dungeonId);
      console.log('selectedDungeon:', selectedDungeon);
      if (selectedDungeon) {
        // Update both fields in single call to avoid race condition
        const dungeonsList = [...(requirements.dungeons || [])];
        dungeonsList[index] = {
          ...dungeonsList[index],
          dungeonId: selectedDungeon.id,
          dungeonName: selectedDungeon.name
        };
        console.log('Updated dungeon batch:', { id: selectedDungeon.id, name: selectedDungeon.name, dungeonsList });
        updateRequirements('dungeons', dungeonsList);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Dungeon Completions Required</h4>
          <Button size="sm" onClick={addDungeon}>
            <Plus className="h-4 w-4 mr-1" />
            Add Dungeon
          </Button>
        </div>

        {requirements.dungeons?.map((dungeon, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Dungeon</Label>
                  <Select
                    value={dungeon.dungeonId.toString()}
                    onValueChange={(value) => selectDungeon(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose dungeon..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dungeons.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Lv.{d.level}</Badge>
                            {d.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {dungeon.dungeonName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {dungeon.dungeonName}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Manual Override (Optional)</Label>
                  <Input
                    value={dungeon.dungeonName}
                    onChange={(e) => updateDungeon(index, 'dungeonName', e.target.value)}
                    placeholder="Override dungeon name"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Completions</Label>
                    <Input
                      type="number"
                      value={dungeon.requiredCompletions}
                      onChange={(e) => updateDungeon(index, 'requiredCompletions', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeDungeon(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!requirements.dungeons?.length && (
          <div className="text-center py-8 text-muted-foreground">
            No dungeon requirements configured
          </div>
        )}
      </div>
    );
  };

  const QuestRequirements = () => {
    const addQuest = () => {
      const newQuest = {
        questId: 0,
        questName: '',
      };
      updateRequirements('quests', [
        ...(requirements.quests || []),
        newQuest,
      ]);
    };

    const updateQuest = (index: number, field: string, value: any) => {
      const quests = [...(requirements.quests || [])];
      quests[index] = { ...quests[index], [field]: value };
      updateRequirements('quests', quests);
    };

    const removeQuest = (index: number) => {
      const quests = [...(requirements.quests || [])];
      quests.splice(index, 1);
      updateRequirements('quests', quests);
    };

    const selectQuest = (index: number, questId: string) => {
      const selectedQuest = quests.find((q: any) => q.id.toString() === questId);
      if (selectedQuest) {
        // Update both fields in single call to avoid race condition
        const questsList = [...(requirements.quests || [])];
        questsList[index] = {
          ...questsList[index],
          questId: selectedQuest.id,
          questName: selectedQuest.title
        };
        console.log('Updated quest batch:', { id: selectedQuest.id, name: selectedQuest.title, questsList });
        updateRequirements('quests', questsList);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Quest Completions Required</h4>
          <Button size="sm" onClick={addQuest}>
            <Plus className="h-4 w-4 mr-1" />
            Add Quest
          </Button>
        </div>

        {requirements.quests?.map((quest, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Select Quest</Label>
                  <Select
                    value={quest.questId.toString()}
                    onValueChange={(value) => selectQuest(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose quest..." />
                    </SelectTrigger>
                    <SelectContent>
                      {quests.map((q: any) => (
                        <SelectItem key={q.id} value={q.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Lv.{q.level}</Badge>
                            {q.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {quest.questName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {quest.questName}
                    </p>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Manual Override (Optional)</Label>
                    <Input
                      value={quest.questName}
                      onChange={(e) => updateQuest(index, 'questName', e.target.value)}
                      placeholder="Override quest name"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeQuest(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!requirements.quests?.length && (
          <div className="text-center py-8 text-muted-foreground">
            No quest requirements configured
          </div>
        )}
      </div>
    );
  };

  const ItemRequirements = () => {
    const addItem = () => {
      const newItem = {
        itemId: 0,
        itemName: '',
        quantity: 1,
      };
      updateRequirements('items', [
        ...(requirements.items || []),
        newItem,
      ]);
    };

    const updateItem = (index: number, field: string, value: any) => {
      const items = [...(requirements.items || [])];
      items[index] = { ...items[index], [field]: value };
      updateRequirements('items', items);
    };

    const removeItem = (index: number) => {
      const items = [...(requirements.items || [])];
      items.splice(index, 1);
      updateRequirements('items', items);
    };

    const selectItem = (index: number, itemId: string) => {
      const selectedItem = items.find((i: any) => i.id.toString() === itemId);
      if (selectedItem) {
        // Update both fields in single call to avoid race condition
        const itemsList = [...(requirements.items || [])];
        itemsList[index] = {
          ...itemsList[index],
          itemId: selectedItem.id,
          itemName: selectedItem.name
        };
        console.log('Updated item batch:', { id: selectedItem.id, name: selectedItem.name, itemsList });
        updateRequirements('items', itemsList);
      }
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Item Requirements</h4>
          <Button size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        {requirements.items?.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Select Item</Label>
                  <Select
                    value={item.itemId.toString()}
                    onValueChange={(value) => selectItem(index, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose item..." />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((i: any) => (
                        <SelectItem key={i.id} value={i.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{i.rarity}</Badge>
                            {i.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.itemName && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Selected: {item.itemName}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Manual Override (Optional)</Label>
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    placeholder="Override item name"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!requirements.items?.length && (
          <div className="text-center py-8 text-muted-foreground">
            No item requirements configured
          </div>
        )}
      </div>
    );
  };

  const OtherRequirements = () => (
    <div className="space-y-6">
      {/* PvP Rank */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            PvP Rank Requirement
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <Label>Minimum Rank</Label>
            <Input
              type="number"
              value={requirements.pvpRank?.minRank || ''}
              onChange={(e) => updateRequirements('pvpRank', {
                ...requirements.pvpRank,
                minRank: parseInt(e.target.value) || undefined,
              })}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Minimum Points</Label>
            <Input
              type="number"
              value={requirements.pvpRank?.minPoints || ''}
              onChange={(e) => updateRequirements('pvpRank', {
                ...requirements.pvpRank,
                minPoints: parseInt(e.target.value) || undefined,
              })}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Guild Level */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Guild Level Requirement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Minimum Guild Level</Label>
            <Input
              type="number"
              value={requirements.guildLevel || ''}
              onChange={(e) => updateRequirements('guildLevel', parseInt(e.target.value) || undefined)}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Playtime */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Playtime Requirement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label>Minimum Playtime (minutes)</Label>
            <Input
              type="number"
              value={requirements.playtime || ''}
              onChange={(e) => updateRequirements('playtime', parseInt(e.target.value) || undefined)}
              placeholder="0"
            />
            {requirements.playtime && (
              <p className="text-sm text-muted-foreground mt-1">
                ≈ {Math.floor(requirements.playtime / 60)} hours {requirements.playtime % 60} minutes
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className={className}>
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="dungeons">Dungeons</TabsTrigger>
          <TabsTrigger value="quests">Quests</TabsTrigger>
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <StatRequirements />
        </TabsContent>

        <TabsContent value="dungeons" className="mt-6">
          <DungeonRequirements />
        </TabsContent>

        <TabsContent value="quests" className="mt-6">
          <QuestRequirements />
        </TabsContent>

        <TabsContent value="items" className="mt-6">
          <ItemRequirements />
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <OtherRequirements />
        </TabsContent>
      </Tabs>
    </div>
  );
}
