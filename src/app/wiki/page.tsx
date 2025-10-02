"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BookOpen, Sword, Users, Skull, Sparkles } from 'lucide-react';
import WikiItemsTab from '@/components/wiki/WikiItemsTab';
import WikiMonstersTab from '@/components/wiki/WikiMonstersTab';
import WikiDungeonsTab from '@/components/wiki/WikiDungeonsTab';
import WikiSkillsTab from '@/components/wiki/WikiSkillsTab';

export default function WikiPage() {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BookOpen className="h-10 w-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">
              Game Wiki
            </h1>
          </div>
          <p className="text-purple-200 text-lg">
            Khám phá tất cả các vật phẩm, quái vật, dungeon và kỹ năng trong game
          </p>
        </div>

        {/* Tabs Container */}
        <Card className="bg-slate-800/50 border-purple-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Danh mục</CardTitle>
            <CardDescription className="text-purple-200">
              Chọn danh mục để xem thông tin chi tiết
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-slate-700/50">
                <TabsTrigger 
                  value="items" 
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Sword className="h-4 w-4 mr-2" />
                  Vật phẩm
                </TabsTrigger>
                <TabsTrigger 
                  value="monsters"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Skull className="h-4 w-4 mr-2" />
                  Quái vật
                </TabsTrigger>
                <TabsTrigger 
                  value="dungeons"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Dungeon
                </TabsTrigger>
                <TabsTrigger 
                  value="skills"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Kỹ năng
                </TabsTrigger>
              </TabsList>

              <TabsContent value="items" className="mt-6">
                <WikiItemsTab />
              </TabsContent>

              <TabsContent value="monsters" className="mt-6">
                <WikiMonstersTab />
              </TabsContent>

              <TabsContent value="dungeons" className="mt-6">
                <WikiDungeonsTab />
              </TabsContent>

              <TabsContent value="skills" className="mt-6">
                <WikiSkillsTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
