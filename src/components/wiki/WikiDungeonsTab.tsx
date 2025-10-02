"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, MapPin, TrendingUp, Gift } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset';

interface Dungeon {
  id: number;
  name: string;
  description?: string;
  levelRequirement: number;
  image?: string;
  dropItems?: Array<{ itemId: number; dropRate: number }>;
  monsterIds?: number[];
  monsterCounts?: Array<{ monsterId: number; count: number }>;
}

const WikiDungeonsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all dungeons
  const { data: dungeons = [], isLoading, error } = useQuery<Dungeon[]>({
    queryKey: ['wiki-dungeons'],
    queryFn: wikiApi.getAllDungeons,
  });

  // Fetch all items to display names
  const { data: items = [] } = useQuery<Array<{ id: number; name: string }>>({
    queryKey: ['wiki-items-for-dungeons'],
    queryFn: wikiApi.getAllItems,
  });

  // Helper to get item name by ID
  const getItemName = (itemId: number) => {
    const item = items.find(i => i.id === itemId);
    return item?.name || `Item #${itemId}`;
  };

  // Filter dungeons
  const filteredDungeons = useMemo(() => {
    return dungeons.filter(dungeon => {
      if (searchQuery && !dungeon.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [dungeons, searchQuery]);

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
        <p>Không thể tải dữ liệu dungeon</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Tìm kiếm dungeon..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
        />
      </div>

      {/* Results count */}
      <div className="text-purple-200 text-sm">
        Tìm thấy <span className="font-bold text-purple-400">{filteredDungeons.length}</span> dungeon
      </div>

      {/* Dungeons List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDungeons.map((dungeon) => (
          <Card 
            key={dungeon.id} 
            className="bg-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/50 transition-colors overflow-hidden"
          >
            <CardContent className="p-0">
              {/* Dungeon Image Banner */}
              <div className="relative w-full h-48 bg-slate-900/50">
                {dungeon.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(dungeon.image)}
                    alt={dungeon.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${dungeon.image ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                  <MapPin className="h-20 w-20 text-purple-400 opacity-50" />
                </div>
              </div>

              {/* Dungeon Info */}
              <div className="p-4">
                <h3 className="font-bold text-xl mb-2 text-white">{dungeon.name}</h3>
                
                {dungeon.description && (
                  <p className="text-sm text-gray-400 mb-4">
                    {dungeon.description}
                  </p>
                )}

                {/* Requirements */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 bg-slate-900/50 p-3 rounded">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="text-xs text-gray-400">Cấp tối thiểu</div>
                      <div className="font-bold text-white">Level {dungeon.levelRequirement}</div>
                    </div>
                  </div>
                </div>

                {/* Drop Items */}
                {dungeon.dropItems && dungeon.dropItems.length > 0 && (
                  <div className="border-t border-slate-700 pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Gift className="h-4 w-4 text-purple-400" />
                      <span className="text-sm font-semibold text-purple-300">Vật phẩm rơi:</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      {dungeon.dropItems.map((drop, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-purple-500/10 p-2 rounded">
                          <span className="text-gray-400">{getItemName(drop.itemId)}</span>
                          <span className="font-bold text-purple-400">{(drop.dropRate * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDungeons.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy dungeon nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiDungeonsTab;
