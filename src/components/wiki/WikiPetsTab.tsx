"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveAssetUrl } from '@/lib/asset';

interface PetDef {
  id: number;
  name: string;
  description?: string;
  rarity?: number | string;
  images?: string[];
  baseStats?: Record<string, number>;
  abilities?: Array<{ id: string; name: string; description?: string }>;
}

const WikiPetsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');

  const { data: pets = [], isLoading, error } = useQuery<PetDef[]>({
    queryKey: ['wiki-pets'],
    queryFn: wikiApi.getAllPets,
  });

  const getRarityText = (rarity: number | string | undefined) => {
    if (typeof rarity === 'number') {
      return ['common', 'uncommon', 'rare', 'epic', 'legendary'][rarity - 1] || 'common';
    }
    return String(rarity || 'common').toLowerCase();
  };

  const filtered = useMemo(() => {
    return pets.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (rarityFilter !== 'all' && getRarityText(p.rarity) !== rarityFilter) return false;
      return true;
    });
  }, [pets, searchQuery, rarityFilter]);

  if (isLoading) return <div className="flex items-center justify-center py-12"><Spinner className="h-8 w-8 text-purple-400" /></div>;
  if (error) return <div className="text-center py-12 text-red-400"><p>Không thể tải dữ liệu pet</p></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm pet..."
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

      <div className="text-purple-200 text-sm">Tìm thấy <span className="font-bold text-purple-400">{filtered.length}</span> pets</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className="bg-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/50 transition-colors">
            <CardContent className="p-4">
              <div className="relative w-full h-40 mb-3 flex items-center justify-center bg-slate-900/50 rounded-lg overflow-hidden">
                {p.images && p.images.length > 0 && p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveAssetUrl(p.images[0])} alt={p.name} className="max-w-full max-h-full object-contain" />
                ) : (
                  <div className="text-6xl opacity-40"><Star className="h-8 w-8 text-yellow-400" /></div>
                )}
              </div>

              <h3 className="font-bold text-lg mb-1 text-white">{p.name}</h3>
              <Badge className="mb-2 bg-purple-600 text-white">{getRarityText(p.rarity).toUpperCase()}</Badge>

              {p.baseStats && (
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  {Object.entries(p.baseStats).slice(0,4).map(([k,v]) => (
                    <div key={k} className="flex justify-between bg-slate-900/50 p-2 rounded">
                      <span className="text-gray-400 capitalize">{k}</span>
                      <span className="font-bold text-white">{v}</span>
                    </div>
                  ))}
                </div>
              )}

              {p.abilities && p.abilities.length > 0 && (
                <div className="text-xs text-gray-300">
                  <div className="text-gray-400 mb-1">Abilities</div>
                  <ul className="space-y-1">
                    {p.abilities.slice(0,3).map(a => (
                      <li key={a.id} className="truncate">{a.name}{a.description ? ` — ${a.description}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Star className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy pet nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiPetsTab;
