'use client';
/* Lines 2-18 omitted */

import { directApi } from '@/lib/admin-api';
import { resolveAssetUrl } from '@/lib/asset';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Upload, Coins, Image as ImageIcon } from 'lucide-react';
import { ScratchCardType, PrizeType } from '../../types/scratch-card';

interface CreateCardTypeData {
  name: string;
  description?: string;
  costGold: number;
  gridRows?: number;
  gridCols?: number;
}

interface CreatePrizeData {
  prizeType: PrizeType;
  prizeValue: number;
  prizeQuantity?: number;
  probabilityWeight?: number;
  taxRate?: number;
  maxClaims?: number;
}

export default function AdminScratchCards() {
  const [selectedCard, setSelectedCard] = useState<ScratchCardType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPrizeDialogOpen, setIsPrizeDialogOpen] = useState(false);
  const [uploadingCardId, setUploadingCardId] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Form states
  const [createForm, setCreateForm] = useState<CreateCardTypeData>({
    name: '',
    description: '',
    costGold: 100,
    gridRows: 3,
    gridCols: 3,
  });

  const [editForm, setEditForm] = useState<CreateCardTypeData>({
    name: '',
    description: '',
    costGold: 100,
    gridRows: 3,
    gridCols: 3,
  });

  const [prizeForm, setPrizeForm] = useState<CreatePrizeData>({
    prizeType: PrizeType.GOLD,
    prizeValue: 0,
    prizeQuantity: 1,
    probabilityWeight: 1,
    taxRate: 0.1,
    maxClaims: undefined,
  });
  const [editingPrizeId, setEditingPrizeId] = useState<number | null>(null);

  // Fetch card types
  const { data: cardTypes, isLoading } = useQuery({
    queryKey: ['admin-scratch-cards'],
    queryFn: async () => {
      return directApi.get<ScratchCardType[]>('/admin/casino/scratch-cards');
    },
  });

  // Create card type mutation
  const createCardMutation = useMutation({
    mutationFn: async (data: CreateCardTypeData) => {
      return directApi.post('/admin/casino/scratch-cards', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      setIsCreateDialogOpen(false);
      setCreateForm({
        name: '',
        description: '',
        costGold: 100,
        gridRows: 3,
        gridCols: 3,
      });
      toast.success('Tạo vé số cào thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi tạo vé số cào: ' + error.message);
    },
  });

  // Update card type mutation
  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateCardTypeData> }) => {
      return directApi.patch(`/admin/casino/scratch-cards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      setIsEditDialogOpen(false);
      toast.success('Cập nhật vé số cào thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi cập nhật vé số cào: ' + error.message);
    },
  });

  // Delete card type mutation
  const deleteCardMutation = useMutation({
    mutationFn: async (id: number) => {
      return directApi.delete(`/admin/casino/scratch-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      toast.success('Xóa vé số cào thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi xóa vé số cào: ' + error.message);
    },
  });

  // Add prize mutation
  const addPrizeMutation = useMutation({
    mutationFn: async ({ cardTypeId, data }: { cardTypeId: number; data: CreatePrizeData }) => {
      return directApi.post(`/admin/casino/scratch-cards/${cardTypeId}/prizes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      setIsPrizeDialogOpen(false);
      setPrizeForm({
        prizeType: PrizeType.GOLD,
        prizeValue: 0,
        prizeQuantity: 1,
        probabilityWeight: 1,
        taxRate: 0.1,
        maxClaims: undefined,
      });
      toast.success('Thêm phần thưởng thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi thêm phần thưởng: ' + error.message);
    },
  });

  // Update prize mutation
  const updatePrizeMutation = useMutation({
    mutationFn: async ({ cardTypeId, prizeId, data }: { cardTypeId: number; prizeId: number; data: CreatePrizeData }) => {
      return directApi.post(`/admin/casino/scratch-cards/${cardTypeId}/prizes/${prizeId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      setIsPrizeDialogOpen(false);
      setEditingPrizeId(null);
      setPrizeForm({
        prizeType: PrizeType.GOLD,
        prizeValue: 0,
        prizeQuantity: 1,
        probabilityWeight: 1,
        taxRate: 0.1,
        maxClaims: undefined,
      });
      toast.success('Cập nhật phần thưởng thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi cập nhật phần thưởng: ' + error.message);
    },
  });

  // Delete prize mutation
  const deletePrizeMutation = useMutation({
    mutationFn: async ({ cardTypeId, prizeId }: { cardTypeId: number; prizeId: number }) => {
      return directApi.delete(`/admin/casino/scratch-cards/${cardTypeId}/prizes/${prizeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      toast.success('Xóa phần thưởng thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi xóa phần thưởng: ' + error.message);
    },
  });

  // Upload image mutation
  const uploadImageMutation = useMutation({
    mutationFn: async ({ cardId, file }: { cardId: number; file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      return directApi.post(`/uploads/casino/scratch-cards/${cardId}`, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-scratch-cards'] });
      setUploadingCardId(null);
      toast.success('Upload ảnh thành công!');
    },
    onError: (error) => {
      toast.error('Lỗi khi upload ảnh: ' + error.message);
      setUploadingCardId(null);
    },
  });

  const handleCreateCard = () => {
    if (!createForm.name.trim()) {
      toast.error('Tên vé số cào không được để trống');
      return;
    }
    if (createForm.costGold <= 0) {
      toast.error('Giá vé phải lớn hơn 0');
      return;
    }
    createCardMutation.mutate(createForm);
  };

  const handleEditCard = () => {
    if (!selectedCard) return;
    if (!editForm.name.trim()) {
      toast.error('Tên vé số cào không được để trống');
      return;
    }
    if (editForm.costGold <= 0) {
      toast.error('Giá vé phải lớn hơn 0');
      return;
    }
    updateCardMutation.mutate({ id: selectedCard.id, data: editForm });
  };

  const handleDeleteCard = (card: ScratchCardType) => {
    if (confirm(`Bạn có chắc muốn xóa vé "${card.name}"?`)) {
      deleteCardMutation.mutate(card.id);
    }
  };

  const handleAddPrize = () => {
    if (!selectedCard) return;
    if (prizeForm.prizeValue <= 0) {
      toast.error('Giá trị phần thưởng phải lớn hơn 0');
      return;
    }
    if (editingPrizeId) {
      updatePrizeMutation.mutate({ cardTypeId: selectedCard.id, prizeId: editingPrizeId, data: prizeForm });
    } else {
      addPrizeMutation.mutate({ cardTypeId: selectedCard.id, data: prizeForm });
    }
  };

  const handleImageUpload = (cardId: number, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Chỉ chấp nhận file ảnh');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('File ảnh không được vượt quá 5MB');
      return;
    }
    setUploadingCardId(cardId);
    uploadImageMutation.mutate({ cardId, file });
  };

  const openEditDialog = (card: ScratchCardType) => {
    setSelectedCard(card);
    setEditForm({
      name: card.name,
      description: card.description || '',
      costGold: card.costGold,
      gridRows: card.gridRows,
      gridCols: card.gridCols,
    });
    setIsEditDialogOpen(true);
  };

  const openPrizeDialog = (card: ScratchCardType) => {
    setSelectedCard(card);
    setIsPrizeDialogOpen(true);
  };

  const getPrizeTypeLabel = (type: PrizeType) => {
    switch (type) {
      case PrizeType.GOLD: return 'Gold';
      case PrizeType.ITEM: return 'Item';
      default: return 'Unknown';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Quản lý vé số cào</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Tạo và quản lý các loại vé số cào cho casino
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo vé mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo vé số cào mới</DialogTitle>
              <DialogDescription>
                Tạo một loại vé số cào mới với thông tin cơ bản
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên vé *</Label>
                <Input
                  id="name"
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Vé số cào vàng"
                />
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về vé số cào này"
                />
              </div>
              <div>
                <Label htmlFor="costGold">Giá vé (Gold) *</Label>
                <Input
                  id="costGold"
                  type="number"
                  value={createForm.costGold}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, costGold: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gridRows">Số hàng</Label>
                  <Input
                    id="gridRows"
                    type="number"
                    value={createForm.gridRows}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, gridRows: parseInt(e.target.value) || 3 }))}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <Label htmlFor="gridCols">Số cột</Label>
                  <Input
                    id="gridCols"
                    type="number"
                    value={createForm.gridCols}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, gridCols: parseInt(e.target.value) || 3 }))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button onClick={handleCreateCard} disabled={createCardMutation.isPending}>
                  {createCardMutation.isPending ? 'Đang tạo...' : 'Tạo vé'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card Types List */}
      <div className="grid gap-6">
        {cardTypes?.map((card) => (
          <Card key={card.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {card.name}
                      {!card.isActive && <Badge variant="secondary">Không hoạt động</Badge>}
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(card)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openPrizeDialog(card)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCard(card)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label className="text-sm font-medium">Giá vé</Label>
                  <p className="text-lg font-semibold text-yellow-600">{card.costGold} Gold</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Kích thước lưới</Label>
                  <p className="text-lg font-semibold">{card.gridRows} × {card.gridCols}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Số phần thưởng</Label>
                  <p className="text-lg font-semibold">{card.prizes?.length || 0}</p>
                </div>
              </div>

              {/* Background Image */}
              <div className="mb-4">
                <Label className="text-sm font-medium">Ảnh nền</Label>
                <div className="mt-2 flex items-center space-x-4">
                  {card.backgroundImageUrl ? (
                    <div className="relative">
                      <Image
                        src={resolveAssetUrl(card.backgroundImageUrl) || card.backgroundImageUrl}
                        alt={card.name}
                        width={128}
                        height={80}
                        unoptimized
                        className="object-cover rounded border"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute -top-2 -right-2 w-6 h-6 p-0"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageUpload(card.id, file);
                          };
                          input.click();
                        }}
                        disabled={uploadingCardId === card.id}
                      >
                        {uploadingCardId === card.id ? '...' : <Upload className="w-3 h-3" />}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) handleImageUpload(card.id, file);
                          };
                          input.click();
                        }}
                        disabled={uploadingCardId === card.id}
                      >
                        {uploadingCardId === card.id ? '...' : <ImageIcon className="w-4 h-4 mr-2" />}
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Prizes Table */}
              {card.prizes && card.prizes.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Danh sách phần thưởng</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vị trí</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Giá trị</TableHead>
                        <TableHead>Thuế</TableHead>
                        <TableHead>Max Claims</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                          {card.prizes.map((prize) => (
                            <TableRow key={prize.id}>
                              <TableCell>({prize.positionRow}, {prize.positionCol})</TableCell>
                              <TableCell>
                                <Badge variant={prize.prizeType === PrizeType.GOLD ? 'default' : 'secondary'}>
                                  {getPrizeTypeLabel(prize.prizeType)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {prize.prizeType === PrizeType.GOLD
                                  ? `${prize.prizeValue} Gold`
                                  : `Item ${prize.prizeValue} (x${prize.prizeQuantity})`
                                }
                              </TableCell>
                              <TableCell>{prize.taxRate}%</TableCell>
                              <TableCell>{prize.maxClaims || '∞'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button size="sm" variant="outline" onClick={() => {
                                    // open dialog prefilled for editing
                                    setSelectedCard(card);
                                    setPrizeForm({
                                      prizeType: prize.prizeType,
                                      prizeValue: prize.prizeValue,
                                      prizeQuantity: prize.prizeQuantity ?? 1,
                                      probabilityWeight: prize.probabilityWeight ?? 1,
                                      taxRate: prize.taxRate ?? 0.1,
                                      maxClaims: prize.maxClaims ?? undefined,
                                    });
                                    setEditingPrizeId(prize.id);
                                    setIsPrizeDialogOpen(true);
                                  }}>
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => {
                                    if (confirm('Bạn có chắc muốn xóa phần thưởng này?')) {
                                      deletePrizeMutation.mutate({ cardTypeId: card.id, prizeId: prize.id });
                                    }
                                  }}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {(!cardTypes || cardTypes.length === 0) && (
          <Card>
            <CardContent className="text-center py-8">
              <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Chưa có vé số cào nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Tạo vé số cào đầu tiên để bắt đầu
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo vé đầu tiên
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa vé số cào</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin vé số cào
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên vé *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-costGold">Giá vé (Gold) *</Label>
              <Input
                id="edit-costGold"
                type="number"
                value={editForm.costGold}
                onChange={(e) => setEditForm(prev => ({ ...prev, costGold: parseInt(e.target.value) || 0 }))}
                min="1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-gridRows">Số hàng</Label>
                <Input
                  id="edit-gridRows"
                  type="number"
                  value={editForm.gridRows}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gridRows: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="10"
                />
              </div>
              <div>
                <Label htmlFor="edit-gridCols">Số cột</Label>
                <Input
                  id="edit-gridCols"
                  type="number"
                  value={editForm.gridCols}
                  onChange={(e) => setEditForm(prev => ({ ...prev, gridCols: parseInt(e.target.value) || 3 }))}
                  min="1"
                  max="10"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleEditCard} disabled={updateCardMutation.isPending}>
                {updateCardMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Prize Dialog */}
      <Dialog open={isPrizeDialogOpen} onOpenChange={setIsPrizeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Thêm phần thưởng</DialogTitle>
            <DialogDescription>
              Thêm phần thưởng cho vị trí trên vé số cào
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="prize-type">Loại phần thưởng</Label>
                <Select
                  value={prizeForm.prizeType}
                  onValueChange={(value: PrizeType) => setPrizeForm(prev => ({ ...prev, prizeType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PrizeType.GOLD}>Gold</SelectItem>
                    <SelectItem value={PrizeType.ITEM}>Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="prize-value">Giá trị *</Label>
                <Input
                  id="prize-value"
                  type="number"
                  value={prizeForm.prizeValue}
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, prizeValue: parseInt(e.target.value) || 0 }))}
                  min="1"
                />
              </div>
            </div>

            {prizeForm.prizeType === PrizeType.ITEM && (
              <div>
                <Label htmlFor="prize-quantity">Số lượng</Label>
                <Input
                  id="prize-quantity"
                  type="number"
                  value={prizeForm.prizeQuantity}
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, prizeQuantity: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="tax-rate">Thuế (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  step="0.1"
                  value={prizeForm.taxRate}
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="1"
                />
              </div>
              <div>
                <Label htmlFor="max-claims">Max Claims</Label>
                <Input
                  id="max-claims"
                  type="number"
                  value={prizeForm.maxClaims || ''}
                  onChange={(e) => setPrizeForm(prev => ({
                    ...prev,
                    maxClaims: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  min="1"
                  placeholder="∞"
                />
              </div>
              <div>
                <Label htmlFor="probability">Trọng số xác suất</Label>
                <Input
                  id="probability"
                  type="number"
                  value={prizeForm.probabilityWeight}
                  onChange={(e) => setPrizeForm(prev => ({ ...prev, probabilityWeight: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPrizeDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAddPrize} disabled={addPrizeMutation.isPending}>
                {addPrizeMutation.isPending ? 'Đang thêm...' : 'Thêm phần thưởng'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}