"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Skull, Heart, Shield, Zap, TrendingUp, Coins } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveAssetUrl } from '@/lib/asset';

interface Monster {
  id: number;
  name: string;
  type: string;
  level: number;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  speed?: number;
  experienceReward: number;
  goldReward: number;
  image?: string;
}

const WikiMonstersTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [levelRange, setLevelRange] = useState<string>('all');

  // Fetch all monsters
  const { data: monsters = [], isLoading, error } = useQuery<Monster[]>({
    queryKey: ['wiki-monsters'],
    queryFn: wikiApi.getAllMonsters,
  });

  // Filter monsters
  const filteredMonsters = useMemo(() => {
    return monsters.filter(monster => {
      // Search
      if (searchQuery && !monster.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && monster.type?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      // Level range filter
      if (levelRange !== 'all') {
        const [min, max] = levelRange.split('-').map(Number);
        if (monster.level < min || (max && monster.level > max)) {
          return false;
        }
      }

      return true;
    });
  }, [monsters, searchQuery, typeFilter, levelRange]);

  // Get monster type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'normal': return 'bg-gray-500/20 text-gray-300 border-gray-500';
      case 'elite': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'boss': return 'bg-red-500/20 text-red-300 border-red-500';
      case 'miniboss': return 'bg-orange-500/20 text-orange-300 border-orange-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

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
        <p>Không thể tải dữ liệu quái vật</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tìm kiếm quái vật..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <SelectValue placeholder="Loại quái" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="elite">Elite</SelectItem>
            <SelectItem value="miniboss">Mini Boss</SelectItem>
            <SelectItem value="boss">Boss</SelectItem>
          </SelectContent>
        </Select>

        {/* Level Range Filter */}
        <Select value={levelRange} onValueChange={setLevelRange}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <SelectValue placeholder="Cấp độ" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả cấp</SelectItem>
            <SelectItem value="1-10">1-10</SelectItem>
            <SelectItem value="11-20">11-20</SelectItem>
            <SelectItem value="21-30">21-30</SelectItem>
            <SelectItem value="31-40">31-40</SelectItem>
            <SelectItem value="41-50">41-50</SelectItem>
            <SelectItem value="51-999">51+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-purple-200 text-sm">
        Tìm thấy <span className="font-bold text-purple-400">{filteredMonsters.length}</span> quái vật
      </div>

      {/* Monsters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMonsters.map((monster) => (
          <Card 
            key={monster.id} 
            className="bg-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/50 transition-colors"
          >
            <CardContent className="p-4">
              {/* Monster Image */}
              <div className="relative w-full h-40 mb-3 flex items-center justify-center bg-slate-900/50 rounded-lg overflow-hidden">
                {monster.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveAssetUrl(monster.image)}
                    alt={monster.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`${monster.image ? 'hidden' : ''} text-6xl opacity-50`}>
                  <Skull className="h-20 w-20 text-red-400" />
                </div>
                
                {/* Level badge */}
                <div className="absolute top-2 right-2">
                  <Badge className="bg-purple-600 text-white font-bold">
                    Lv.{monster.level}
                  </Badge>
                </div>
              </div>

              {/* Monster Name & Type */}
              <h3 className="font-bold text-lg mb-2 text-white">{monster.name}</h3>
              <Badge className={`mb-3 ${getTypeColor(monster.type)}`}>
                {monster.type?.toUpperCase() || 'NORMAL'}
              </Badge>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
                  <Heart className="h-4 w-4 text-red-400" />
                  <div>
                    <div className="text-gray-400">HP</div>
                    <div className="font-bold text-white">{monster.baseHp ? monster.baseHp.toLocaleString() : '0'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
                  <Zap className="h-4 w-4 text-orange-400" />
                  <div>
                    <div className="text-gray-400">ATK</div>
                    <div className="font-bold text-white">{monster.baseAttack ? monster.baseAttack.toLocaleString() : '0'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <div>
                    <div className="text-gray-400">DEF</div>
                    <div className="font-bold text-white">{monster.baseDefense ? monster.baseDefense.toLocaleString() : '0'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="text-gray-400">SPD</div>
                    <div className="font-bold text-white">{monster.speed ?? '0'}</div>
                  </div>
                </div>
              </div>

              {/* Rewards */}
              <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-blue-500/10 p-2 rounded">
                  <span className="text-gray-400">EXP:</span>
                  <span className="font-bold text-blue-400">{monster.experienceReward ? monster.experienceReward.toLocaleString() : '0'}</span>
                </div>
                <div className="flex items-center justify-between bg-yellow-500/10 p-2 rounded">
                  <Coins className="h-3 w-3 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{monster.goldReward ? monster.goldReward.toLocaleString() : '0'}G</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMonsters.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Skull className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy quái vật nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiMonstersTab;
