'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  Hammer, 
  Clock, 
  Coins, 
  Package,
  Beaker,
  Sword,
  Shield,
  Plus,
  Minus,
  Zap,
  Heart,
  Star
} from 'lucide-react';
import { toast } from 'sonner';

interface CraftingRecipe {
  id: number;
  name: string;
  description?: string;
  resultItemId: number;
  resultQuantity: number;
  materials: CraftingMaterial[];
  craftingLevel: number;
  goldCost: number;
  craftingTime: number;
  isActive: boolean;
  category: number;
  resultItem?: Item;
}

interface CraftingMaterial {
  itemId: number;
  quantity: number;
  item?: Item;
}

interface Item {
  id: number;
  name: string;
  type: string;
  rarity: number;
  price: number;
  description?: string;
  stats?: {
    strength?: number;
    intelligence?: number;
    dexterity?: number;
    vitality?: number;
    luck?: number;
  };
  consumableEffect?: {
    hp?: number;
    energy?: number;
    exp?: number;
  };
}

interface UserItem {
  id: number;
  itemId: number;
  quantity: number;
  item: Item;
}

interface CraftingResult {
  success: boolean;
  message: string;
  craftedItems?: {
    itemId: number;
    itemName: string;
    quantity: number;
  }[];
}

const CATEGORIES = [
  { value: 0, label: 'Thuốc & Dược phẩm', icon: Beaker },
  { value: 1, label: 'Trang bị', icon: Sword },
  { value: 2, label: 'Nguyên liệu', icon: Package },
];

export default function CraftingInterface() {
  const [selectedCategory, setSelectedCategory] = useState(0);
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [craftQuantity, setCraftQuantity] = useState(1);
  const [isCrafting, setIsCrafting] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch available recipes
  const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['craftingRecipes'],
    queryFn: async (): Promise<CraftingRecipe[]> => {
      try {
        const response = await api.get('/crafting/recipes');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        return [];
      }
    },
  });

  // Fetch user inventory
  const { data: userItems, isLoading: isLoadingItems } = useQuery({
    queryKey: ['userItems'],
    queryFn: async (): Promise<UserItem[]> => {
      try {
        const response = await api.get('/user-items');
        const items = response.data || [];
        
        // Debug log
        console.log('📦 User Items API Response:', {
          total: items.length,
          items: items.slice(0, 5), // Show first 5 items
          slimeEssence: items.find((item: any) => item.itemId === 81)
        });
        
        return items;
      } catch (error) {
        console.error('Failed to fetch user items:', error);
        return [];
      }
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnMount: true, // Refetch when component mounts
  });

  // Fetch all items for material names
  const { data: allItems } = useQuery({
    queryKey: ['allItems'],
    queryFn: async (): Promise<Item[]> => {
      try {
        const response = await api.get('/items');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch all items:', error);
        return [];
      }
    },
  });

  // Craft item mutation
  const craftMutation = useMutation({
    mutationFn: async ({ recipeId, quantity }: { recipeId: number; quantity: number }) => {
      const response = await api.post('/crafting/craft', { recipeId, quantity });
      return response.data;
    },
    onSuccess: (result: CraftingResult) => {
      queryClient.invalidateQueries({ queryKey: ['userItems'] });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      setIsCrafting(false);
    },
    onError: () => {
      toast.error('Lỗi khi chế tạo!');
      setIsCrafting(false);
    },
  });

  const getCategoryIcon = (category: number) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    const Icon = categoryData?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: number) => {
    return CATEGORIES.find(c => c.value === category)?.label || 'Unknown';
  };

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'strength': return <Sword className="h-3 w-3 text-red-500" />;
      case 'intelligence': return <Zap className="h-3 w-3 text-blue-500" />;
      case 'dexterity': return <Star className="h-3 w-3 text-green-500" />;
      case 'vitality': return <Heart className="h-3 w-3 text-pink-500" />;
      case 'luck': return <Star className="h-3 w-3 text-yellow-500" />;
      default: return <Shield className="h-3 w-3" />;
    }
  };

  const getRarityColor = (rarity: number) => {
    switch (rarity) {
      case 1: return 'text-gray-600';
      case 2: return 'text-green-600';
      case 3: return 'text-blue-600';
      case 4: return 'text-purple-600';
      case 5: return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getRarityLabel = (rarity: number) => {
    switch (rarity) {
      case 1: return 'Thường';
      case 2: return 'Hiếm';
      case 3: return 'Quý';
      case 4: return 'Huyền thoại';
      case 5: return 'Thần thoại';
      default: return 'Thường';
    }
  };

  const getUserItemQuantity = (itemId: number): number => {
    const userItem = userItems?.find(ui => ui.itemId === itemId);
    const quantity = userItem?.quantity || 0;
    
    // Debug log
    if (itemId === 81) { // Tinh Chất Slime ID
      console.log('🔍 Debug getUserItemQuantity:', {
        itemId,
        userItem,
        quantity,
        allUserItems: userItems?.map(ui => ({ itemId: ui.itemId, quantity: ui.quantity }))
      });
    }
    
    return quantity;
  };

  const canCraft = (recipe: CraftingRecipe, quantity: number = 1): boolean => {
    if (!recipe.materials) return false;
    
    return recipe.materials.every(material => {
      const available = getUserItemQuantity(material.itemId);
      const required = material.quantity * quantity;
      return available >= required;
    });
  };

  const getMaxCraftableQuantity = (recipe: CraftingRecipe): number => {
    if (!recipe.materials || recipe.materials.length === 0) return 0;
    
    let maxQuantity = Infinity;
    
    recipe.materials.forEach(material => {
      const available = getUserItemQuantity(material.itemId);
      const maxFromThisMaterial = Math.floor(available / material.quantity);
      maxQuantity = Math.min(maxQuantity, maxFromThisMaterial);
    });
    
    return maxQuantity === Infinity ? 0 : maxQuantity;
  };

  const handleCraft = () => {
    if (!selectedRecipe) return;
    
    setIsCrafting(true);
    craftMutation.mutate({
      recipeId: selectedRecipe.id,
      quantity: craftQuantity,
    });
  };

  const filteredRecipes = recipes?.filter(recipe => recipe.category === selectedCategory) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Hammer className="h-8 w-8 text-orange-600" />
        <div>
          <h1 className="text-2xl font-bold">Chế tạo & Luyện dược</h1>
          <p className="text-sm text-muted-foreground">Tạo ra các vật phẩm hữu ích từ nguyên liệu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recipes List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <Tabs value={selectedCategory.toString()} onValueChange={(value) => setSelectedCategory(parseInt(value))}>
            <TabsList className="grid w-full grid-cols-3">
              {CATEGORIES.map(category => (
                <TabsTrigger key={category.value} value={category.value.toString()}>
                  <div className="flex items-center gap-2">
                    <category.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.label}</span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map(category => (
              <TabsContent key={category.value} value={category.value.toString()} className="space-y-3">
                {filteredRecipes.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <category.icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Chưa có công thức nào trong danh mục này</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRecipes.map(recipe => {
                    const maxCraftable = getMaxCraftableQuantity(recipe);
                    const canCraftThis = canCraft(recipe);
                    
                    return (
                      <Card 
                        key={recipe.id} 
                        className={`cursor-pointer transition-colors ${
                          selectedRecipe?.id === recipe.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        } ${!canCraftThis ? 'opacity-60' : ''}`}
                        onClick={() => setSelectedRecipe(recipe)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{recipe.name}</h3>
                                {recipe.resultItem && (
                                  <Badge variant="outline" className={getRarityColor(recipe.resultItem.rarity)}>
                                    {getRarityLabel(recipe.resultItem.rarity)}
                                  </Badge>
                                )}
                              </div>
                              
                              {recipe.description && (
                                <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {recipe.craftingTime}s
                                </div>
                                <div className="flex items-center gap-1">
                                  <Coins className="h-3 w-3 text-yellow-500" />
                                  {recipe.goldCost.toLocaleString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  x{recipe.resultQuantity}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm font-medium mb-1">
                                Có thể chế tạo: {maxCraftable}
                              </div>
                              <Badge variant={canCraftThis ? "default" : "secondary"}>
                                {canCraftThis ? "Có thể chế tạo" : "Thiếu nguyên liệu"}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Recipe Details & Crafting */}
        <div className="space-y-4">
          {selectedRecipe ? (
            <>
              {/* Recipe Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getCategoryIcon(selectedRecipe.category)}
                    {selectedRecipe.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedRecipe.description && (
                    <p className="text-sm text-muted-foreground">{selectedRecipe.description}</p>
                  )}

                  {/* Result Item Info */}
                  {selectedRecipe.resultItem && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Kết quả:</h4>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{selectedRecipe.resultItem.name}</span>
                        <Badge variant="outline" className={getRarityColor(selectedRecipe.resultItem.rarity)}>
                          {getRarityLabel(selectedRecipe.resultItem.rarity)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">x{selectedRecipe.resultQuantity}</span>
                      </div>
                      
                      {/* Stats */}
                      {selectedRecipe.resultItem.stats && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {Object.entries(selectedRecipe.resultItem.stats).map(([stat, value]) => (
                            <div key={stat} className="flex items-center gap-1 text-xs">
                              {getStatIcon(stat)}
                              <span>+{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Consumable Effects */}
                      {selectedRecipe.resultItem.consumableEffect && (
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(selectedRecipe.resultItem.consumableEffect).map(([effect, value]) => (
                            <div key={effect} className="flex items-center gap-1 text-xs">
                              {effect === 'hp' && <Heart className="h-3 w-3 text-red-500" />}
                              {effect === 'energy' && <Zap className="h-3 w-3 text-blue-500" />}
                              {effect === 'exp' && <Star className="h-3 w-3 text-yellow-500" />}
                              <span>+{value} {effect.toUpperCase()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {/* Materials Required */}
                  <div>
                    <h4 className="font-medium mb-2">Nguyên liệu cần thiết:</h4>
                    <div className="space-y-2">
                      {selectedRecipe.materials.map((material, index) => {
                        const available = getUserItemQuantity(material.itemId);
                        const required = material.quantity * craftQuantity;
                        const hasEnough = available >= required;
                        const materialItem = allItems?.find(item => item.id === material.itemId);
                        
                        return (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className={hasEnough ? '' : 'text-red-500'}>
                              {materialItem?.name || `Item ${material.itemId}`}
                            </span>
                            <span className={hasEnough ? 'text-green-600' : 'text-red-500'}>
                              {available}/{required}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Level:</span>
                      <span className="ml-2 font-medium">{selectedRecipe.craftingLevel}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Thời gian:</span>
                      <span className="ml-2 font-medium">{selectedRecipe.craftingTime}s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Crafting Controls */}
              <Card>
                <CardHeader>
                  <CardTitle>Chế tạo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quantity Controls */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Số lượng:</label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCraftQuantity(Math.max(1, craftQuantity - 1))}
                        disabled={craftQuantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max={getMaxCraftableQuantity(selectedRecipe)}
                        value={craftQuantity}
                        onChange={(e) => setCraftQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCraftQuantity(Math.min(getMaxCraftableQuantity(selectedRecipe), craftQuantity + 1))}
                        disabled={craftQuantity >= getMaxCraftableQuantity(selectedRecipe)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tối đa: {getMaxCraftableQuantity(selectedRecipe)}
                    </p>
                  </div>

                  {/* Total Cost */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Tổng chi phí:</span>
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3 text-yellow-500" />
                        <span className="font-medium">{(selectedRecipe.goldCost * craftQuantity).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Thời gian:</span>
                      <span className="font-medium">{selectedRecipe.craftingTime * craftQuantity}s</span>
                    </div>
                  </div>

                  {/* Craft Button */}
                  <Button
                    className="w-full"
                    onClick={handleCraft}
                    disabled={!canCraft(selectedRecipe, craftQuantity) || isCrafting || craftMutation.isPending}
                  >
                    {isCrafting || craftMutation.isPending ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Đang chế tạo...
                      </>
                    ) : (
                      <>
                        <Hammer className="h-4 w-4 mr-2" />
                        Chế tạo {craftQuantity}x
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Chọn một công thức để xem chi tiết</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
