"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Package, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveAssetUrl } from '@/lib/asset';

interface Item {
  id: number;
  name: string;
  image?: string;
  type?: string;
}

interface ItemSet {
  id: number;
  name: string;
  description?: string;
  rarity?: number | string;
  items?: Item[];
  bonuses?: Array<{ pieces: number; effect: string }>;
}

const WikiItemSetsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const { data: sets = [], isLoading, error } = useQuery<ItemSet[]>({
    queryKey: ['wiki-item-sets'],
    queryFn: wikiApi.getItemSets,
  });

  const getRarityText = (rarity?: number | string) => {
    if (typeof rarity === 'number') {
      return ['common', 'uncommon', 'rare', 'epic', 'legendary'][rarity - 1] || 'common';
    }
    return String(rarity ?? 'common').toLowerCase();
  };

  const filtered = useMemo(() => {
    return sets.filter(s => {
      if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (rarityFilter !== 'all' && getRarityText(s.rarity) !== rarityFilter) return false;
      return true;
    });
  }, [sets, searchQuery, rarityFilter]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8 text-purple-400" /></div>;
  if (error) return <div className="text-center py-12 text-red-400"><p>Không thể tải dữ liệu bộ đồ</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm bộ đồ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
          />
        </div>

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

      <div className="text-purple-200 text-sm">Tìm thấy <span className="font-bold text-purple-400">{filtered.length}</span> bộ đồ</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(set => (
          <Card key={set.id} className="bg-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 bg-slate-900/50 rounded-lg flex items-center justify-center overflow-hidden">
                  {set.items && set.items.length > 0 && set.items[0].image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resolveAssetUrl(set.items[0].image)} alt={set.name} className="max-w-full max-h-full object-contain" />
                  ) : (
                    <Package className="h-8 w-8 text-purple-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{set.name}</h3>
                  <Badge className="bg-purple-600 text-white mt-1">{getRarityText(set.rarity).toUpperCase()}</Badge>
                </div>
              </div>

              {set.description && <p className="text-sm text-gray-300 mb-2 line-clamp-3">{set.description}</p>}

              {set.bonuses && set.bonuses.length > 0 && (
                <div className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">Bonuses:</div>
                  <ul className="text-xs text-purple-200 space-y-1">
                    {set.bonuses.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Tag className="h-3 w-3 mt-1 text-purple-300" />
                        <div>{b.pieces} pieces: {b.effect}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {set.items && set.items.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700">
                  <div className="text-xs text-gray-400 mb-2">Items in set</div>
                  <div className="flex flex-wrap gap-2">
                    {set.items.map(i => (
                      <div key={i.id} className="flex items-center gap-2 bg-slate-900/40 p-2 rounded">
                        <div className="w-8 h-8 bg-slate-800/20 rounded overflow-hidden">
                          {i.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={resolveAssetUrl(i.image)} alt={i.name} className="max-w-full max-h-full object-contain" />
                          ) : null}
                        </div>
                        <div className="text-xs text-white">{i.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy bộ đồ nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiItemSetsTab;
