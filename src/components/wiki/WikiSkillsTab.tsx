"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { wikiApi } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Search, Sparkles, Zap, Timer, Target } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolveAssetUrl } from '@/lib/asset';

interface SkillDefinition {
  id: number;
  skillId: string;
  name: string;
  description: string;
  category: string;
  skillType: string;
  manaCost?: number | null;
  cooldown?: number | null;
  damageFormula?: string | null;
  effects?: Record<string, unknown>;
  requiredLevel: number;
  requiredAttribute: string;
  requiredAttributeValue: number;
  maxLevel: number;
  image?: string | null;
}

interface UserSkill {
  id: number;
  userId: number;
  skillDefinitionId: number;
  level: number;
  isEquipped: boolean;
  skillDefinition: SkillDefinition;
}

const WikiSkillsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch all skills
  const { data: userSkills = [], isLoading, error } = useQuery<UserSkill[]>({
    queryKey: ['wiki-skills'],
    queryFn: wikiApi.getAllSkills,
  });

  // Extract skill definitions from user skills
  const skills = useMemo(() => {
    return userSkills.map(us => us.skillDefinition);
  }, [userSkills]);

  // Filter skills
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Search
      if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && skill.category?.toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }

      // Type filter
      if (typeFilter !== 'all' && skill.skillType?.toLowerCase() !== typeFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [skills, searchQuery, categoryFilter, typeFilter]);

  // Get skill type color
  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'active': return 'bg-red-500/20 text-red-300 border-red-500';
      case 'passive': return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case 'toggle': return 'bg-purple-500/20 text-purple-300 border-purple-500';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'warrior': return 'bg-orange-500/20 text-orange-300';
      case 'mage': return 'bg-cyan-500/20 text-cyan-300';
      case 'archer': return 'bg-green-500/20 text-green-300';
      case 'assassin': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
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
        <p>Không thể tải dữ liệu kỹ năng</p>
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
            placeholder="Tìm kiếm kỹ năng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-700/50 border-purple-500/30 text-white placeholder:text-gray-400"
          />
        </div>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <SelectValue placeholder="Danh mục" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả danh mục</SelectItem>
            <SelectItem value="warrior">Warrior</SelectItem>
            <SelectItem value="mage">Mage</SelectItem>
            <SelectItem value="archer">Archer</SelectItem>
            <SelectItem value="assassin">Assassin</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="bg-slate-700/50 border-purple-500/30 text-white">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-purple-500/30">
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="passive">Passive</SelectItem>
            <SelectItem value="toggle">Toggle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-purple-200 text-sm">
        Tìm thấy <span className="font-bold text-purple-400">{filteredSkills.length}</span> kỹ năng
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredSkills.map((skill) => (
          <Card 
            key={skill.id} 
            className="bg-slate-800/50 border-2 border-purple-500/20 hover:border-purple-500/50 transition-colors"
          >
            <CardContent className="p-4">
              {/* Header with Image */}
              <div className="flex items-start gap-3 mb-3">
                {/* Skill Image */}
                {skill.image && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-900/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={resolveAssetUrl(skill.image)}
                      alt={skill.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-white mb-2">{skill.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={getTypeColor(skill.skillType)}>
                      {skill.skillType?.toUpperCase()}
                    </Badge>
                    <Badge className={getCategoryColor(skill.category)}>
                      {skill.category?.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>

              {/* Description */}
              <p className="text-sm text-gray-400 mb-4">
                {skill.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {skill.manaCost !== null && skill.manaCost !== undefined && skill.manaCost > 0 && (
                  <div className="flex items-center gap-2 bg-blue-500/10 p-2 rounded text-xs">
                    <Zap className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-gray-400">Mana</div>
                      <div className="font-bold text-blue-400">{skill.manaCost}</div>
                    </div>
                  </div>
                )}
                
                {skill.cooldown && (
                  <div className="flex items-center gap-2 bg-orange-500/10 p-2 rounded text-xs">
                    <Timer className="h-4 w-4 text-orange-400" />
                    <div>
                      <div className="text-gray-400">Cooldown</div>
                      <div className="font-bold text-orange-400">{skill.cooldown}s</div>
                    </div>
                  </div>
                )}

                {skill.damageFormula && (
                  <div className="flex items-center gap-2 bg-red-500/10 p-2 rounded text-xs">
                    <Target className="h-4 w-4 text-red-400" />
                    <div>
                      <div className="text-gray-400">Công thức</div>
                      <div className="font-bold text-red-400">{skill.damageFormula}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Max Level */}
              <div className="mb-3 text-xs">
                <span className="text-gray-400">Max Level: </span>
                <span className="font-bold text-purple-400">{skill.maxLevel}</span>
              </div>

              {/* Requirements */}
              <div className="border-t border-slate-700 pt-3">
                <div className="text-xs text-purple-300 font-semibold mb-2">Yêu cầu:</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="border-blue-500/30">
                    Lv.{skill.requiredLevel}
                  </Badge>
                  <Badge variant="outline" className="border-green-500/30">
                    {skill.requiredAttribute} ≥ {skill.requiredAttributeValue}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>Không tìm thấy kỹ năng nào</p>
        </div>
      )}
    </div>
  );
};

export default WikiSkillsTab;
