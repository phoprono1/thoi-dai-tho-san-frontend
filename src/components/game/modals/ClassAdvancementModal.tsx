/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { characterClassesApi } from '@/lib/api-client';
import { adminApi } from '@/lib/admin-api';
import { toast } from 'sonner';

interface ClassAdvancementModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentClass: any;
}

export function ClassAdvancementModal({ 
  open, 
  onOpenChange, 
  currentClass 
}: ClassAdvancementModalProps) {
  const [activeTab, setActiveTab] = React.useState<'choosable' | 'random'>('choosable');
  const [isProcessing, setIsProcessing] = React.useState(false);
  // randomResult not used in this component; kept for future use
  const queryClient = useQueryClient();

  // Check for pending advancement
  const { data: pendingAdvancement } = useQuery({
    queryKey: ['pending-advancement'],
    queryFn: characterClassesApi.getPendingAdvancement,
    enabled: open,
  });

  // Fetch available advancement paths for current class
  const { data: advancementPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ['class-advancement-paths', currentClass?.id],
    queryFn: async () => {
      if (!currentClass?.id) return [];
      const response = await adminApi.get(`/admin/character-class-mappings/${currentClass.id}`);
      console.log('Advancement paths response:', response.data);
      return response.data;
    },
    enabled: open && !!currentClass?.id,
  });

  // Filter paths based on allowPlayerChoice
  const choosablePaths = advancementPaths?.filter((path: any) => path.allowPlayerChoice) || [];
  const hiddenPaths = advancementPaths?.filter((path: any) => !path.allowPlayerChoice) || [];

  const [advancementChecks, setAdvancementChecks] = React.useState<Record<number, any>>({});

  // Fetch requirement checks for each candidate class so we can show current progress
  React.useEffect(() => {
    if (!open) return;
    const classIds = [...new Set([...choosablePaths.map((p: any) => p.toClassId), ...hiddenPaths.map((p: any) => p.toClassId)])];
    classIds.forEach((id) => {
      // avoid refetching if already present
      if (advancementChecks[id]) return;
      characterClassesApi.checkAdvancementRequirements(id)
        .then((res) => setAdvancementChecks((s) => ({ ...s, [id]: res })))
        .catch(() => {
          // ignore errors for now; missing checks will keep placeholders
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, choosablePaths, hiddenPaths]);

  // Helper renderers to keep JSX tidy and avoid nested IIFEs
  const renderStatReq = (path: any, required: number) => {
    const check = advancementChecks[path.toClassId];
    const statMissing = check?.missingRequirements?.stats;
    const current = statMissing?.current ?? 0;
    const satisfied = !statMissing;
    return (
      <div className="flex items-center gap-2">
        <span className="text-blue-600">📊 Tổng chỉ số:</span>
        <span className="font-medium">{satisfied ? <span className="text-green-600">✓</span> : <span>{current} / {required}</span>}</span>
      </div>
    );
  };

  const renderDungeonReq = (path: any, dungeon: any, key: React.Key) => {
    const check = advancementChecks[path.toClassId];
    const missing = check?.missingRequirements?.dungeons?.find((d: any) => (d.dungeonId ?? d.id) === (dungeon.dungeonId ?? dungeon.id));
    const current = missing?.current ?? dungeon.currentCompletions ?? dungeon.requiredCompletions ?? 0;
    const required = missing?.required ?? dungeon.requiredCompletions ?? 0;
    const satisfied = !missing;
    return (
      <div key={key} className="flex items-center gap-2">
        <span className="text-purple-600">🏰 {dungeon.dungeonName}:</span>
        <span className="text-purple-600 font-medium">{satisfied ? <span className="text-green-600">✓</span> : <span>{current} / {required} lần</span>}</span>
      </div>
    );
  };

  const renderQuestReq = (path: any, quest: any, key: React.Key) => {
    const check = advancementChecks[path.toClassId];
    const missing = check?.missingRequirements?.quests?.find((q: any) => q.questId === quest.questId);
    const satisfied = !missing;
    return (
      <div key={key} className="flex items-center gap-2">
        <span className="text-purple-600">📜 {quest.questName}</span>
        <span className="text-sm font-medium">{satisfied ? <span className="text-green-600">✓</span> : <span className="text-red-600">✗</span>}</span>
      </div>
    );
  };

  const renderItemReq = (path: any, item: any, key: React.Key) => {
    const check = advancementChecks[path.toClassId];
    const missing = check?.missingRequirements?.items?.find((it: any) => it.itemId === item.itemId);
    const current = missing?.current ?? item.currentQuantity ?? 0;
    const required = missing?.required ?? item.quantity ?? 0;
    const satisfied = !missing;
    return (
      <div key={key} className="flex items-center gap-2">
        <span className="text-purple-600">🎒 {item.itemName}:</span>
        <span className="text-purple-600 font-medium">{satisfied ? <span className="text-green-600">✓</span> : <span>{current} / {required}</span>}</span>
      </div>
    );
  };

  // Fetch class details for each path
  const { data: classDetails } = useQuery({
    queryKey: ['class-details', choosablePaths.map((p: any) => p.toClassId)],
    queryFn: async () => {
      const classIds = [...new Set([...choosablePaths.map((p: any) => p.toClassId), ...hiddenPaths.map((p: any) => p.toClassId)])];
      const classPromises = classIds.map(id => characterClassesApi.getCharacterClass(id));
      const classes = await Promise.all(classPromises);
      const classMap: Record<number, any> = {};
      classes.forEach((cls, index) => {
        classMap[classIds[index]] = cls;
      });
      return classMap;
    },
    enabled: open && (choosablePaths.length > 0 || hiddenPaths.length > 0),
  });

  const handleClassAdvancement = async (targetClassId: number) => {
    setIsProcessing(true);
    try {
      // Use existing performAdvancement API
      const result = await characterClassesApi.performAdvancement(0, targetClassId); // userId will be handled by backend
      toast.success(`Chuyển chức thành công: ${result.newClass?.name || 'Lớp mới'}`);
      
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['user-status'] });
      queryClient.invalidateQueries({ queryKey: ['user-stats'] });
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Không đủ điều kiện chuyển chức';
      const missingRequirements = error.response?.data?.missingRequirements;
      
      if (missingRequirements) {
        let detailMessage = 'Thiếu yêu cầu:\n';
        if (missingRequirements.level) detailMessage += `• Level: ${missingRequirements.level}\n`;
        if (missingRequirements.dungeons?.length) {
          missingRequirements.dungeons.forEach((d: any) => {
            detailMessage += `• ${d.dungeonName}: ${d.required - d.current} lần nữa\n`;
          });
        }
        if (missingRequirements.quests?.length) {
          missingRequirements.quests.forEach((q: any) => {
            detailMessage += `• Quest: ${q.questName}\n`;
          });
        }
        if (missingRequirements.items?.length) {
          missingRequirements.items.forEach((i: any) => {
            detailMessage += `• ${i.itemName}: ${i.required - i.current} cái nữa\n`;
          });
        }
        toast.error(detailMessage);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRandomAdvancement = async () => {
    setIsProcessing(true);
    try {
      const allPaths = [...choosablePaths, ...hiddenPaths];
      if (allPaths.length === 0) {
        toast.error('Không có lớp nào có thể chuyển');
        return;
      }

      const randomIndex = Math.floor(Math.random() * allPaths.length);
      const selectedPath = allPaths[randomIndex];
      
      if (selectedPath.isAwakening) {
        // Create pending advancement for secret awakening
        await characterClassesApi.createPendingAdvancement({
          mappingId: selectedPath.id,
          toClassId: selectedPath.toClassId,
          description: `Secret awakening: ${classDetails?.[selectedPath.toClassId]?.name || 'Unknown Class'}`
        });
        
        // Refresh pending advancement data
        queryClient.invalidateQueries({ queryKey: ['pending-advancement'] });
        
        toast.info('Bạn đã mở khóa lớp bí mật! Hoàn thành yêu cầu để thức tỉnh.');
      } else {
        // Direct advancement for hidden class
        const result = await characterClassesApi.performAdvancement(0, selectedPath.toClassId);
        toast.success(`Chuyển chức thành công: ${result.newClass?.name || classDetails?.[selectedPath.toClassId]?.name}`);
        
        queryClient.invalidateQueries({ queryKey: ['user-status'] });
        queryClient.invalidateQueries({ queryKey: ['user-stats'] });
        onOpenChange(false);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Chuyển chức thất bại');
    } finally {
      setIsProcessing(false);
    }
  };
  // Note: secret awakening acceptance is handled in the pendingAdvancement accept button above


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Chuyển Chức - {currentClass?.name || 'Chưa xác định'}
          </DialogTitle>
          <DialogDescription>
            Chọn lớp tiếp theo hoặc thử vận may với chuyển chức ngẫu nhiên
          </DialogDescription>
        </DialogHeader>

        {pendingAdvancement ? (
          // Requirements view for secret awakening
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                🌟 Lớp Bí Mật: {pendingAdvancement.options?.[0]?.classInfo?.name || 'Unknown Class'}
              </h3>
              <p className="text-sm text-purple-700 mb-3">{pendingAdvancement.options?.[0]?.classInfo?.description || 'Lớp bí mật với sức mạnh đặc biệt'}</p>
              
              <div className="bg-orange-100 border border-orange-300 rounded p-2 mb-3">
                <p className="text-xs text-orange-800 font-medium">
                  ⚠️ Đây là kết quả ngẫu nhiên cuối cùng! Hoàn thành yêu cầu để thức tỉnh.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-purple-800">Yêu cầu để thức tỉnh:</h4>
                {(() => {
                  const targetClassId = pendingAdvancement.options?.[0]?.toClassId;
                  const path = [...choosablePaths, ...hiddenPaths].find(p => p.toClassId === targetClassId);
                  const requirements = path?.requirements;

                  return requirements ? (
                    <div className="space-y-1 text-sm">
                      {requirements.stats?.minTotalStats && (
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">📊 Tổng chỉ số:</span>
                          <span>{requirements.stats.minTotalStats}</span>
                        </div>
                      )}

                      {requirements.dungeons?.map((dungeon: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-purple-600">🏰 {dungeon.dungeonName}:</span>
                          <span>{dungeon.requiredCompletions} lần</span>
                        </div>
                      ))}

                      {requirements.quests?.map((quest: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-purple-600">📜 {quest.questName}</span>
                        </div>
                      ))}

                      {requirements.items?.map((item: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-purple-600">🎒 {item.itemName}:</span>
                          <span>{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-purple-600">Không có yêu cầu đặc biệt</div>
                  );
                })()}
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    const result = await characterClassesApi.acceptPendingAdvancement();
                    toast.success(`Thức tỉnh thành công: ${result.newClass?.name}`);
                    
                    queryClient.invalidateQueries({ queryKey: ['user-status'] });
                    queryClient.invalidateQueries({ queryKey: ['user-stats'] });
                    queryClient.invalidateQueries({ queryKey: ['pending-advancement'] });
                    onOpenChange(false);
                  } catch (error: any) {
                        // If backend returned detailed missing requirements, format them
                        const missing = error?.response?.data?.missingRequirements;
                        if (missing) {
                          let detailMessage = 'Thiếu yêu cầu:\n';
                          if (missing.level) detailMessage += `• Level: ${missing.level}\n`;
                          if (missing.dungeons?.length) {
                            missing.dungeons.forEach((d: any) => {
                              detailMessage += `• ${d.dungeonName}: cần ${d.required - (d.current || 0)} lần nữa\n`;
                            });
                          }
                          if (missing.quests?.length) {
                            missing.quests.forEach((q: any) => {
                              detailMessage += `• Quest: ${q.questName || q.questId}\n`;
                            });
                          }
                          if (missing.items?.length) {
                            missing.items.forEach((i: any) => {
                              detailMessage += `• ${i.itemName}: cần ${i.required - (i.current || 0)} cái nữa\n`;
                            });
                          }
                          if (missing.stats) {
                            detailMessage += `• Tổng chỉ số yêu cầu: ${missing.stats.required} (hiện tại: ${missing.stats.current})\n`;
                          }

                          // Show as toast; for longer messages we could open a modal instead.
                          toast.error(detailMessage);
                        } else {
                          toast.error(error.response?.data?.message || 'Chưa đủ điều kiện thức tỉnh');
                        }
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                className="bg-purple-600 hover:bg-purple-700 px-8"
                size="lg"
              >
                {isProcessing ? 'Đang kiểm tra...' : '⚡ Kiểm tra & Thức tỉnh'}
              </Button>
            </div>
          </div>
        ) : (
          // Main advancement tabs
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'choosable' | 'random')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="choosable">Chọn Lớp ({choosablePaths.length})</TabsTrigger>
                <TabsTrigger value="random">Ngẫu Nhiên ({choosablePaths.length + hiddenPaths.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="choosable" className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Các lớp bạn có thể chọn dựa trên lớp hiện tại
                </div>
                
                {pathsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Spinner className="h-6 w-6" />
                  </div>
                ) : choosablePaths.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Không có lớp nào có thể chọn
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {choosablePaths.map((path: any) => {
                      const classInfo = classDetails?.[path.toClassId];
                      const requirements = path.requirements || {};

                      return (
                        <Card key={path.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="text-center mb-3">
                              <h3 className="font-semibold text-lg">
                                {classInfo?.name || `Lớp ID: ${path.toClassId}`}
                              </h3>
                              <div className="text-xs text-muted-foreground">
                                Tier {classInfo?.tier || '?'} • Level {path.levelRequired}+
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3 text-center">
                              {classInfo?.description || 'Lớp mạnh mẽ với khả năng đặc biệt'}
                            </p>

                            {path.isAwakening && (
                              <div className="text-center mb-3">
                                <Badge className="bg-yellow-100 text-yellow-800">
                                  ⭐ Awakening Required
                                </Badge>
                              </div>
                            )}

                            {/* Requirements Display (use helper renderers) */}
                            { (requirements.stats || requirements.dungeons || requirements.quests || requirements.items) ? (
                              <div className="space-y-1 text-sm">
                                {requirements.stats?.minTotalStats && (
                                  renderStatReq(path, requirements.stats.minTotalStats)
                                )}

                                {requirements.dungeons?.map((dungeon: any, index: number) => (
                                  renderDungeonReq(path, dungeon, index)
                                ))}

                                {requirements.quests?.map((quest: any, index: number) => (
                                  renderQuestReq(path, quest, index)
                                ))}

                                {requirements.items?.map((item: any, index: number) => (
                                  renderItemReq(path, item, index)
                                ))}

                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <p className="text-xs text-gray-600">
                                    💡 Tiến độ hiện tại sẽ được kiểm tra khi chuyển chức
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-purple-600">Không có yêu cầu đặc biệt</div>
                            )}

                            <Button 
                              className="w-full mt-3"
                              onClick={() => handleClassAdvancement(path.toClassId)}
                              disabled={isProcessing}
                            >
                              {path.isAwakening ? 'Kiểm tra & Chuyển chức' : 'Chuyển chức'}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="random" className="space-y-4">
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-semibold text-orange-800 mb-2">🎲 Chuyển chức ngẫu nhiên</h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Thử vận may! Có thể nhận được lớp thường hoặc lớp bí mật với yêu cầu đặc biệt.
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">⚡ Lớp thường:</span>
                      <span>{choosablePaths.filter((p: any) => !p.isAwakening).length + hiddenPaths.filter((p: any) => !p.isAwakening).length} lớp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">🌟 Lớp awakening:</span>
                      <span>{choosablePaths.filter((p: any) => p.isAwakening).length + hiddenPaths.filter((p: any) => p.isAwakening).length} lớp</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-orange-600">📊 Tổng cộng:</span>
                      <span>{choosablePaths.length + hiddenPaths.length} lớp</span>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button 
                    size="lg"
                    onClick={handleRandomAdvancement}
                    disabled={isProcessing || (choosablePaths.length + hiddenPaths.length) === 0}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  >
                    {isProcessing ? 'Đang xử lý...' : '🎲 Chuyển chức ngẫu nhiên'}
                  </Button>
                  
                  {(choosablePaths.length + hiddenPaths.length) === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Không có lớp nào để chuyển
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!pendingAdvancement && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
