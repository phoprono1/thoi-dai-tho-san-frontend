"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Filter, Sword, Shield, Zap, Star, Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveAssetUrl } from '@/lib/asset';

interface Item {
  id: number;
  name: string;
  description?: string;
  type: string;
  rarity: number | string;
  level?: number;
  price: number;
  image?: string;
  stats?: Record<string, number>;
}

const WikiItemsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  // Fetch all items
  const { data: items = [], isLoading, error } = useQuery<Item[]>({
    queryKey: ['wiki-items'],
    queryFn: wikiApi.getAllItems,
  });

  // Helper to convert rarity number to text
  const getRarityText = (rarity: number | string): string => {
    if (typeof rarity === 'number') {
      return ['common', 'uncommon', 'rare', 'epic', 'legendary'][rarity - 1] || 'common';
    }
    return String(rarity).toLowerCase();
  };

  // Rarity styling
  const getRarityColor = (rarity: number | string): string => {
    const rarityText = getRarityText(rarity);
    switch (rarityText) {
      case 'common': return 'bg-gray-500/20 text-gray-300 border-gray-500';
      case 'uncommon': return 'bg-green-500/20 text-green-300 border-green-500';
      case 'rare': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'epic': return 'bg-purple-500/20 text-purple-300 border-purple-500';
      case 'legendary': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  // Type icons
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'weapon': return <Sword className="h-4 w-4" />;
      case 'armor': return <Shield className="h-4 w-4" />;
      case 'helmet': case 'boots': case 'gloves': return <Shield className="h-4 w-4" />;
      case 'accessory': return <Star className="h-4 w-4" />;
      case 'consumable': return <Zap className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // Filter and search items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && item.type.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      // Rarity filter
      if (rarityFilter !== 'all') {
        const itemRarity = getRarityText(item.rarity);
        if (itemRarity !== rarityFilter) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchQuery, typeFilter, rarityFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8 text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        <p>Không thể tải dữ liệu vật phẩm</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm vật phẩm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="weapon">Vũ khí</SelectItem>
            <SelectItem value="armor">Áo giáp</SelectItem>
            <SelectItem value="helmet">Mũ</SelectItem>
            <SelectItem value="boots">Giày</SelectItem>
            <SelectItem value="gloves">Găng tay</SelectItem>
            <SelectItem value="accessory">Phụ kiện</SelectItem>
            <SelectItem value="consumable">Tiêu hao</SelectItem>
          </SelectContent>
        </Select>

        {/* Rarity Filter */}
        <Select value={rarityFilter} onValueChange={setRarityFilter}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <SelectValue placeholder="Độ hiếm" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả độ hiếm</SelectItem>
            <SelectItem value="common">Common</SelectItem>
            <SelectItem value="uncommon">Uncommon</SelectItem>
            <SelectItem value="rare">Rare</SelectItem>
            <SelectItem value="epic">Epic</SelectItem>
            <SelectItem value="legendary">Legendary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-purple-200 text-sm">
        Tìm thấy <span className="font-bold text-purple-400">{filteredItems.length}</span> vật phẩm
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <Card 
            key={item.id} 
            className={`
              bg-slate-800/50 border-2 ${getRarityColor(item.rarity).split(' ').pop()} 
              hover:scale-105 transition-transform cursor-pointer
            `}
          >
            <CardContent className="p-4">
              {/* Item Image */}
              <div className="relative w-full h-32 mb-3 flex items-center justify-center bg-slate-900/50 rounded-lg">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(item.image)}
                    alt={item.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${item.image ? 'hidden' : ''} text-6xl opacity-50`}>
                  {getTypeIcon(item.type)}
                </div>
              </div>

              {/* Item Name */}
              <h3 className={`font-bold text-sm mb-2 ${getRarityColor(item.rarity).split(' ')[1]}`}>
                {item.name}
              </h3>

              {/* Badges */}
              <div className="flex flex-wrap gap-1 mb-2">
                <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                  {getRarityText(item.rarity).toUpperCase()}
                </Badge>
                {item.level && (
                  <Badge variant="secondary" className="text-xs">
                    Lv.{item.level}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                  {getTypeIcon(item.type)}
                  <span className="ml-1 capitalize">{item.type}</span>
                </Badge>
              </div>

              {/* Description */}
              {item.description && (
                <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                  {item.description}
                </p>
              )}

              {/* Stats */}
              {item.stats && Object.keys(item.stats).length > 0 && (
                <div className="space-y-1">
                  {Object.entries(item.stats).slice(0, 3).map(([stat, value]) => (
                    <div key={stat} className="flex justify-between text-xs">
                      <span className="text-gray-400 capitalize">{stat}:</span>
                      <span className="text-green-400 font-semibold">+{value}</span>
                    </div>
                  ))}
                  {Object.keys(item.stats).length > 3 && (
                    <div className="text-xs text-purple-400 text-center">
                      +{Object.keys(item.stats).length - 3} more...
                    </div>
                  )}
                </div>
              )}

              {/* Price */}
              <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                <span className="text-xs text-gray-400">Giá:</span>
                <span className="text-sm font-bold text-yellow-400">
                  {item.price ? item.price.toLocaleString() : '0'}G
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy vật phẩm nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiItemsTab;
