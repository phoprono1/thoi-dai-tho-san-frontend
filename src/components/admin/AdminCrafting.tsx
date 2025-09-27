'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { 
  Hammer, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Clock, 
  Coins, 
  Package,
  Beaker,
  Sword,
  Shield,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { DataTable } from '@/components/admin/DataTable';
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
  createdAt: string;
  updatedAt: string;
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
}

interface CreateRecipeForm {
  name: string;
  description: string;
  resultItemId: number;
  resultQuantity: number;
  materials: CraftingMaterial[];
  craftingLevel: number;
  goldCost: number;
  craftingTime: number;
  category: number;
}

const CATEGORIES = [
  { value: 0, label: 'Consumables', icon: Beaker },
  { value: 1, label: 'Equipment', icon: Sword },
  { value: 2, label: 'Materials', icon: Package },
];

export default function AdminCrafting() {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<CraftingRecipe | null>(null);
  const [createForm, setCreateForm] = useState<CreateRecipeForm>({
    name: '',
    description: '',
    resultItemId: 0,
    resultQuantity: 1,
    materials: [],
    craftingLevel: 1,
    goldCost: 0,
    craftingTime: 60,
    category: 0,
  });
  
  const [openResultItem, setOpenResultItem] = useState(false);
  const [openMaterialSelectors, setOpenMaterialSelectors] = useState<{ [key: number]: boolean }>({});
  
  const queryClient = useQueryClient();

  // Fetch all recipes
  const { data: recipes, isLoading: isLoadingRecipes } = useQuery({
    queryKey: ['adminCraftingRecipes'],
    queryFn: async (): Promise<CraftingRecipe[]> => {
      try {
        const response = await api.get('/crafting/admin/recipes');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch recipes:', error);
        return [];
      }
    },
  });

  // Fetch all items for selection
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['adminItems'],
    queryFn: async (): Promise<Item[]> => {
      try {
        const response = await api.get('/items');
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch items:', error);
        return [];
      }
    },
  });

  // Create recipe mutation
  const createRecipeMutation = useMutation({
    mutationFn: async (recipe: CreateRecipeForm) => {
      const response = await api.post('/crafting/admin/recipes', recipe);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCraftingRecipes'] });
      toast.success('Tạo công thức thành công!');
      setIsCreating(false);
      resetCreateForm();
    },
    onError: () => {
      toast.error('Lỗi khi tạo công thức!');
    },
  });

  // Update recipe mutation
  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, recipe }: { id: number; recipe: CreateRecipeForm }) => {
      const response = await api.put(`/crafting/admin/recipes/${id}`, recipe);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCraftingRecipes'] });
      toast.success('Cập nhật công thức thành công!');
      setEditingRecipe(null);
    },
    onError: () => {
      toast.error('Lỗi khi cập nhật công thức!');
    },
  });

  // Delete recipe mutation
  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await api.delete(`/crafting/admin/recipes/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCraftingRecipes'] });
      toast.success('Xóa công thức thành công!');
    },
    onError: () => {
      toast.error('Lỗi khi xóa công thức!');
    },
  });

  const resetCreateForm = () => {
    setCreateForm({
      name: '',
      description: '',
      resultItemId: 0,
      resultQuantity: 1,
      materials: [],
      craftingLevel: 1,
      goldCost: 0,
      craftingTime: 60,
      category: 0,
    });
  };

  // Edit form state
  const [editForm, setEditForm] = useState<CreateRecipeForm>({
    name: '',
    description: '',
    resultItemId: 0,
    resultQuantity: 1,
    materials: [],
    craftingLevel: 1,
    goldCost: 0,
    craftingTime: 60,
    category: 0,
  });

  // Populate edit form when editingRecipe changes
  useEffect(() => {
    if (editingRecipe) {
      setEditForm({
        name: editingRecipe.name || '',
        description: editingRecipe.description || '',
        resultItemId: editingRecipe.resultItemId || 0,
        resultQuantity: editingRecipe.resultQuantity || 1,
        materials: editingRecipe.materials || [],
        craftingLevel: editingRecipe.craftingLevel || 1,
        goldCost: editingRecipe.goldCost || 0,
        craftingTime: editingRecipe.craftingTime || 60,
        category: editingRecipe.category || 0,
      });
    }
  }, [editingRecipe]);

  const addMaterial = () => {
    setCreateForm(prev => ({
      ...prev,
      materials: [...prev.materials, { itemId: 0, quantity: 1 }]
    }));
  };

  const removeMaterial = (index: number) => {
    setCreateForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, field: keyof CraftingMaterial, value: number) => {
    setCreateForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  // Edit form helpers
  const addEditMaterial = () => {
    setEditForm(prev => ({
      ...prev,
      materials: [...prev.materials, { itemId: 0, quantity: 1 }]
    }));
  };

  const removeEditMaterial = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateEditMaterial = (index: number, field: keyof CraftingMaterial, value: number) => {
    setEditForm(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const getCategoryIcon = (category: number) => {
    const categoryData = CATEGORIES.find(c => c.value === category);
    const Icon = categoryData?.icon || Package;
    return <Icon className="h-4 w-4" />;
  };

  const getCategoryLabel = (category: number) => {
    return CATEGORIES.find(c => c.value === category)?.label || 'Unknown';
  };

  const columns = [
    {
      key: 'name' as keyof CraftingRecipe,
      label: 'Tên công thức',
      sortable: true,
    },
    {
      key: 'category' as keyof CraftingRecipe,
      label: 'Loại',
      render: (value: unknown) => (
        <div className="flex items-center gap-2">
          {getCategoryIcon(value as number)}
          <span>{getCategoryLabel(value as number)}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'craftingLevel' as keyof CraftingRecipe,
      label: 'Level yêu cầu',
      sortable: true,
    },
    {
      key: 'goldCost' as keyof CraftingRecipe,
      label: 'Chi phí vàng',
      render: (value: unknown) => (
        <div className="flex items-center gap-1">
          <Coins className="h-3 w-3 text-yellow-500" />
          {(value as number).toLocaleString()}
        </div>
      ),
      sortable: true,
    },
    {
      key: 'craftingTime' as keyof CraftingRecipe,
      label: 'Thời gian',
      render: (value: unknown) => (
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-blue-500" />
          {value as number}s
        </div>
      ),
      sortable: true,
    },
    {
      key: 'isActive' as keyof CraftingRecipe,
      label: 'Trạng thái',
      render: (value: unknown) => (
        <Badge variant={(value as boolean) ? "default" : "secondary"}>
          {(value as boolean) ? 'Hoạt động' : 'Tạm dừng'}
        </Badge>
      ),
      sortable: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Hammer className="h-8 w-8 text-orange-600" />
            Quản lý Crafting
          </h1>
          <p className="text-muted-foreground">Quản lý công thức chế tạo và luyện dược</p>
        </div>
        <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tạo công thức mới
        </Button>
      </div>

      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipes">Công thức</TabsTrigger>
          <TabsTrigger value="stats">Thống kê</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-6">
          {/* Recipes List */}
          <DataTable
            title="Danh sách công thức chế tạo"
            data={recipes || []}
            columns={columns}
            searchPlaceholder="Tìm kiếm công thức..."
            searchFields={['name', 'description']}
            loading={isLoadingRecipes}
            actions={true}
            onEdit={(recipe) => setEditingRecipe(recipe)}
            onDelete={(recipe) => {
              if (confirm('Bạn có chắc muốn xóa công thức này?')) {
                deleteRecipeMutation.mutate(recipe.id);
              }
            }}
          />
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng công thức</CardTitle>
                <Hammer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{recipes?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Công thức đã tạo</p>
              </CardContent>
            </Card>

            {CATEGORIES.map(category => {
              const count = recipes?.filter(r => r.category === category.value).length || 0;
              const Icon = category.icon;
              return (
                <Card key={category.value}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{category.label}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{count}</div>
                    <p className="text-xs text-muted-foreground">Công thức {category.label.toLowerCase()}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Recipe Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Tạo công thức mới
              </CardTitle>
              <CardDescription>
                Tạo công thức chế tạo cho người chơi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Tên công thức</Label>
                  <Input
                    id="name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="VD: Bình Thuốc Hồi Máu Lớn"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Loại</Label>
                  <Select
                    value={createForm.category.toString()}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, category: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value.toString()}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả công thức..."
                />
              </div>

              {/* Result Item */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="resultItem">Item kết quả</Label>
                  <Popover open={openResultItem} onOpenChange={setOpenResultItem}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openResultItem}
                        className="w-full justify-between"
                      >
                        {createForm.resultItemId
                          ? items?.find((item) => item.id === createForm.resultItemId)?.name
                          : "Chọn item kết quả..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm item..." />
                        <CommandEmpty>Không tìm thấy item nào.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {items?.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.name} ${item.type}`}
                              onSelect={() => {
                                setCreateForm(prev => ({ ...prev, resultItemId: item.id }));
                                setOpenResultItem(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  createForm.resultItemId === item.id ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {item.name} ({item.type})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="resultQuantity">Số lượng</Label>
                  <Input
                    id="resultQuantity"
                    type="number"
                    min="1"
                    value={createForm.resultQuantity}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, resultQuantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Nguyên liệu cần thiết</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
                    <Plus className="h-3 w-3 mr-1" />
                    Thêm nguyên liệu
                  </Button>
                </div>
                <div className="space-y-2">
                  {createForm.materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Popover 
                        open={openMaterialSelectors[index] || false} 
                        onOpenChange={(open) => setOpenMaterialSelectors(prev => ({ ...prev, [index]: open }))}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openMaterialSelectors[index] || false}
                            className="flex-1 justify-between"
                          >
                            {material.itemId
                              ? items?.find((item) => item.id === material.itemId)?.name
                              : "Chọn nguyên liệu..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Tìm kiếm nguyên liệu..." />
                            <CommandEmpty>Không tìm thấy item nào.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {items?.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={`${item.name} ${item.type}`}
                                  onSelect={() => {
                                    updateMaterial(index, 'itemId', item.id);
                                    setOpenMaterialSelectors(prev => ({ ...prev, [index]: false }));
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      material.itemId === item.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  {item.name} ({item.type})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Input
                        type="number"
                        min="1"
                        value={material.quantity}
                        onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-20"
                        placeholder="SL"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeMaterial(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="craftingLevel">Level yêu cầu</Label>
                  <Input
                    id="craftingLevel"
                    type="number"
                    min="1"
                    max="10"
                    value={createForm.craftingLevel}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, craftingLevel: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="goldCost">Chi phí vàng</Label>
                  <Input
                    id="goldCost"
                    type="number"
                    min="0"
                    value={createForm.goldCost}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, goldCost: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="craftingTime">Thời gian (giây)</Label>
                  <Input
                    id="craftingTime"
                    type="number"
                    min="1"
                    value={createForm.craftingTime}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, craftingTime: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button 
                  onClick={() => createRecipeMutation.mutate(createForm)}
                  disabled={createRecipeMutation.isPending || !createForm.name || !createForm.resultItemId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Tạo công thức
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {editingRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Chỉnh sửa công thức: {editingRecipe.name}
              </CardTitle>
              <CardDescription>
                Cập nhật thông tin công thức chế tạo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Tên công thức</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nhập tên công thức..."
                  />
                </div>
                <div>
                  <Label htmlFor="edit-category">Loại</Label>
                  <Select
                    value={editForm.category.toString()}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, category: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value.toString()}>
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="edit-description">Mô tả</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Nhập mô tả công thức..."
                  rows={3}
                />
              </div>

              {/* Result Item */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Vật phẩm kết quả</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {editForm.resultItemId ? 
                          items?.find(item => item.id === editForm.resultItemId)?.name || 'Chọn vật phẩm...' 
                          : 'Chọn vật phẩm...'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <Command>
                        <CommandInput placeholder="Tìm vật phẩm..." />
                        <CommandEmpty>Không tìm thấy vật phẩm.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          {items?.map((item) => (
                            <CommandItem
                              key={item.id}
                              onSelect={() => setEditForm(prev => ({ ...prev, resultItemId: item.id }))}
                            >
                              {item.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="edit-resultQuantity">Số lượng kết quả</Label>
                  <Input
                    id="edit-resultQuantity"
                    type="number"
                    min="1"
                    value={editForm.resultQuantity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, resultQuantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              {/* Materials */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label>Nguyên liệu cần thiết</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addEditMaterial}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm nguyên liệu
                  </Button>
                </div>
                <div className="space-y-3">
                  {editForm.materials.map((material, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              {material.itemId ? 
                                items?.find(item => item.id === material.itemId)?.name || 'Chọn vật phẩm...' 
                                : 'Chọn vật phẩm...'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80 p-0">
                            <Command>
                              <CommandInput placeholder="Tìm vật phẩm..." />
                              <CommandEmpty>Không tìm thấy vật phẩm.</CommandEmpty>
                              <CommandGroup className="max-h-64 overflow-y-auto">
                                {items?.map((item) => (
                                  <CommandItem
                                    key={item.id}
                                    onSelect={() => updateEditMaterial(index, 'itemId', item.id)}
                                  >
                                    {item.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={material.quantity}
                          onChange={(e) => updateEditMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Số lượng"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeEditMaterial(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-craftingLevel">Level yêu cầu</Label>
                  <Input
                    id="edit-craftingLevel"
                    type="number"
                    min="1"
                    value={editForm.craftingLevel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, craftingLevel: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-goldCost">Chi phí vàng</Label>
                  <Input
                    id="edit-goldCost"
                    type="number"
                    min="0"
                    value={editForm.goldCost}
                    onChange={(e) => setEditForm(prev => ({ ...prev, goldCost: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-craftingTime">Thời gian (giây)</Label>
                  <Input
                    id="edit-craftingTime"
                    type="number"
                    min="1"
                    value={editForm.craftingTime}
                    onChange={(e) => setEditForm(prev => ({ ...prev, craftingTime: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingRecipe(null)}>
                  <X className="h-4 w-4 mr-2" />
                  Hủy
                </Button>
                <Button 
                  onClick={() => updateRecipeMutation.mutate({ id: editingRecipe.id, recipe: editForm })}
                  disabled={updateRecipeMutation.isPending || !editForm.name || !editForm.resultItemId}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Cập nhật công thức
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
