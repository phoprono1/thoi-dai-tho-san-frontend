import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus, X, Search, Package } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface Item {
  id: number;
  name: string;
  description: string;
  rarity: string;
  type: string;
}

interface RewardItem {
  itemId: number;
  quantity: number;
  item?: Item;
}

interface ItemSelectorProps {
  items: RewardItem[];
  onItemsChange: (items: RewardItem[]) => void;
  label: string;
}

export function ItemSelector({ items, onItemsChange, label }: ItemSelectorProps) {
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Fetch available items
  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get('/items');
      setAvailableItems(response.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Lỗi khi tải danh sách items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const addItem = (item: Item) => {
    const existingIndex = items.findIndex(i => i.itemId === item.id);
    if (existingIndex >= 0) {
      // Update quantity if item already exists
      const newItems = [...items];
      newItems[existingIndex].quantity += 1;
      onItemsChange(newItems);
    } else {
      // Add new item
      onItemsChange([...items, { itemId: item.id, quantity: 1, item }]);
    }
    setSearchOpen(false);
  };

  const removeItem = (itemId: number) => {
    onItemsChange(items.filter(item => item.itemId !== itemId));
  };

  const updateQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    
    const newItems = items.map(item => 
      item.itemId === itemId ? { ...item, quantity } : item
    );
    onItemsChange(newItems);
  };

  const filteredItems = availableItems.filter(item =>
    item.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.description.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getRarityColor = (rarity: string | number) => {
    const rarityStr = typeof rarity === 'string' ? rarity.toLowerCase() : String(rarity);
    switch (rarityStr) {
      case 'common':
      case '1': return 'bg-gray-100 text-gray-800';
      case 'uncommon':
      case '2': return 'bg-green-100 text-green-800';
      case 'rare':
      case '3': return 'bg-blue-100 text-blue-800';
      case 'epic':
      case '4': return 'bg-purple-100 text-purple-800';
      case 'legendary':
      case '5': return 'bg-orange-100 text-orange-800';
      case 'mythical':
      case '6': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" />
              Thêm item
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput 
                placeholder="Tìm kiếm items..." 
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandList>
                <CommandEmpty>Không tìm thấy item nào.</CommandEmpty>
                <CommandGroup>
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => addItem(item)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <Badge className={getRarityColor(item.rarity)}>
                        {item.rarity}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected Items */}
      <div className="space-y-2">
        {items.map((rewardItem) => (
          <div key={rewardItem.itemId} className="flex items-center gap-3 p-3 border rounded-lg">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">
                {rewardItem.item?.name || `Item ID: ${rewardItem.itemId}`}
              </div>
              {rewardItem.item?.description && (
                <div className="text-xs text-muted-foreground">
                  {rewardItem.item.description}
                </div>
              )}
            </div>
            {rewardItem.item?.rarity && (
              <Badge className={getRarityColor(rewardItem.item.rarity)}>
                {rewardItem.item.rarity}
              </Badge>
            )}
            <div className="flex items-center gap-2">
              <Label className="text-xs">Số lượng:</Label>
              <Input
                type="number"
                min="1"
                value={rewardItem.quantity}
                onChange={(e) => updateQuantity(rewardItem.itemId, parseInt(e.target.value) || 1)}
                className="w-20 h-8"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeItem(rewardItem.itemId)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
            Chưa có item nào được chọn
          </div>
        )}
      </div>
    </div>
  );
}
