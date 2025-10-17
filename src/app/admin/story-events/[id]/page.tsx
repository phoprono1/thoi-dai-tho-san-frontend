"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StoryEventEditor from '@/components/admin/story-events/Editor';
import { sanitizeHtml } from '@/components/admin/story-events/sanitize';
import { storyEventsService } from '@/services/storyEvents';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function EditStoryEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params?.id);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // scoring weights (defaults) — populated from event if available
  const [dungeonWeight, setDungeonWeight] = useState<number>(10);
  const [enemyWeight, setEnemyWeight] = useState<number>(1);
  const [itemWeight, setItemWeight] = useState<number>(5);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [slug, setSlug] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [eventStart, setEventStart] = useState<string>(() => new Date().toISOString().slice(0,16));
  const [eventEnd, setEventEnd] = useState<string | null>(null);
  const [visibilityMode, setVisibilityMode] = useState<'visible'|'hidden'>('visible');
  const [participationRequired, setParticipationRequired] = useState(false);
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [globalTarget, setGlobalTarget] = useState<number | null>(null);
  const [rewardMode, setRewardMode] = useState<'none'|'pool'|'perPoint'>('none');
  const [goldPool, setGoldPool] = useState<number | null>(null);
  const [goldPerPoint, setGoldPerPoint] = useState<number | null>(null);
  const [itemPools, setItemPools] = useState<Array<{ itemId: number; qty: number }>>([]);
  const [allItems, setAllItems] = useState<Array<{id:number; name:string}>>([]);
  const [allDungeons, setAllDungeons] = useState<Array<{id:number; name:string}>>([]);
  const [allMonsters, setAllMonsters] = useState<Array<{id:number; name:string}>>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [dungeonSearch, setDungeonSearch] = useState('');
  const [monsterSearch, setMonsterSearch] = useState('');
  const [requirements, setRequirements] = useState<{
    completeDungeons: Array<{ dungeonId: number; count?: number }>;
    killEnemies: Array<{ enemyType: string; count?: number }>;
    collectItems: Array<{ itemId: number; quantity?: number }>;
    defeatBoss?: boolean;
  }>({ completeDungeons: [], killEnemies: [], collectItems: [], defeatBoss: false });

  type Item = { id: number; name?: string; title?: string };
  type LocalItem = { id: number; name: string };
  type RewardConfig = {
    mode: 'none'|'pool'|'perPoint';
    goldPool?: number;
    goldPerPoint?: number;
    itemPools?: Array<{ itemId: number; qty: number }>;
  };

  const load = React.useCallback(async (idNum: number) => {
    setLoading(true);
    try {
      const data = await storyEventsService.get(idNum);
      setTitle(data?.title || '');
      setContent(data?.contentHtml || '');
      setSlug(data?.slug ?? null);
      setDescription(data?.descriptionHtml || '');
      setEventStart(data?.eventStart ? new Date(data.eventStart).toISOString().slice(0,16) : new Date().toISOString().slice(0,16));
      setEventEnd(data?.eventEnd ? new Date(data.eventEnd).toISOString().slice(0,16) : null);
  // safe visibility parse
  const vis = data?.visibilityMode;
  setVisibilityMode(vis === 'hidden' ? 'hidden' : 'visible');
      setParticipationRequired(!!data?.participationRequired);
      setGlobalEnabled(!!data?.globalEnabled);
      setGlobalTarget(data?.globalTarget ?? null);

      // populate requirements if present
      if (data?.requirements) {
        try {
          const r = data.requirements as Record<string, unknown>;
          setRequirements({
            completeDungeons: Array.isArray(r['completeDungeons']) ? (r['completeDungeons'] as Array<Record<string, unknown>>).map((x)=>({ dungeonId: Number(x['dungeonId']||0), count: Number(x['count']||1) })) : [],
            killEnemies: Array.isArray(r['killEnemies']) ? (r['killEnemies'] as Array<Record<string, unknown>>).map((x)=>({ enemyType: String(x['enemyType']||''), count: Number(x['count']||1) })) : [],
            collectItems: Array.isArray(r['collectItems']) ? (r['collectItems'] as Array<Record<string, unknown>>).map((x)=>({ itemId: Number(x['itemId']||0), quantity: Number(x['quantity']||1) })) : [],
            defeatBoss: !!r['defeatBoss'],
          });
        } catch {
          // ignore
        }
      }

      if (data?.rewardConfig) {
        const rc = data.rewardConfig as unknown as Partial<RewardConfig>;
        if (rc.mode === 'pool') {
          setRewardMode('pool');
          setGoldPool(typeof rc.goldPool === 'number' ? rc.goldPool : null);
          setItemPools(Array.isArray(rc.itemPools) ? (rc.itemPools as Array<Record<string, unknown>>).map(i=> ({ itemId: Number(i['itemId'] || 0), qty: Number(i['qty'] || 0) })) : []);
        } else if (rc.mode === 'perPoint') {
          setRewardMode('perPoint');
          setGoldPerPoint(typeof rc.goldPerPoint === 'number' ? rc.goldPerPoint : null);
        } else {
          setRewardMode('none');
        }
      }
      // populate scoring weights if present
      if (data?.scoringWeights) {
        try {
          const sw = data.scoringWeights as Record<string, number>;
          setDungeonWeight(Number(sw.dungeonClear ?? 10));
          setEnemyWeight(Number(sw.enemyKill ?? 1));
          setItemWeight(Number(sw.itemDonate ?? 5));
        } catch {
          // ignore parse
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(()=>{
    if (!id) return;
    load(id);
  }, [id, load]);

  useEffect(()=>{
    // load items for selector
    (async ()=>{
      try {
        const api = await import('@/lib/admin-api');
  const resp = await api.adminApiEndpoints.getItems();
  const data: Item[] = resp.data || [];
  const mapped: LocalItem[] = data.map((i) => ({ id: i.id, name: i.name || i.title || `#${i.id}`}));
  setAllItems(mapped);
      try {
        const api = await import('@/lib/admin-api');
        const [dresp, mresp] = await Promise.all([api.adminApiEndpoints.getDungeons(), api.adminApiEndpoints.getMonsters()]);
        const ddata = (dresp.data || []) as Array<Record<string, unknown>>;
        const mdata = (mresp.data || []) as Array<Record<string, unknown>>;
        setAllDungeons(ddata.map(d=>({ id: Number(d.id||0), name: String(d.name || d.title || `#${d.id}`) })));
        setAllMonsters(mdata.map(m=>({ id: Number(m.id||0), name: String(m.name || m.title || `#${m.id}`) })));
      } catch (err) {
        console.warn('Failed to load dungeons/monsters for requirements selector', err);
      }
      } catch (err) {
        console.warn('Failed to load items for reward selector', err);
      }
    })();
  }, []);

  const onSave = async () => {
    setSaving(true);
    try {
      let rewardConfig: Partial<RewardConfig> | null = null;
      if (rewardMode !== 'none') {
        const cfg: Partial<RewardConfig> = { mode: rewardMode };
        if (rewardMode === 'pool') {
          if (goldPool != null) cfg.goldPool = goldPool;
          if (itemPools.length) cfg.itemPools = itemPools;
        } else if (rewardMode === 'perPoint') {
          if (goldPerPoint != null) cfg.goldPerPoint = goldPerPoint;
        }
        rewardConfig = cfg;
      }

      const scoringWeights = {
        dungeonClear: Number(dungeonWeight || 0),
        enemyKill: Number(enemyWeight || 0),
        itemDonate: Number(itemWeight || 0),
      };

      const payload = {
        title,
        slug: slug || null,
        descriptionHtml: description || null,
        contentHtml: sanitizeHtml(content),
        eventStart: eventStart ? new Date(eventStart).toISOString() : undefined,
        eventEnd: eventEnd ? new Date(eventEnd).toISOString() : null,
        visibilityMode,
        participationRequired,
        globalEnabled,
        globalTarget: globalTarget ?? null,
        rewardConfig: rewardConfig ?? null,
        scoringWeights,
        requirements,
      };

      await storyEventsService.update(id, payload);
      router.push('/admin/story-events');
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onDistribute = async () => {
    if (!id) return;
    if (!confirm('Run reward distribution for this event? This will mark the event distributed and may credit users.')) return;
    try {
  const spec = { mode: 'pool' } as unknown;
  const res = await storyEventsService.distribute(id, spec);
      // show a quick summary
      alert('Distribution result: ' + JSON.stringify(res));
      // reload to refresh distributedAt status
      await load(id);
    } catch (err) {
      console.error(err);
      alert('Distribution failed: ' + String(err));
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Edit Story Event</h2>
      </div>

      {loading ? <div>Loading...</div> : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium mb-2">Requirements</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block mb-1">Dungeons (add required clears)</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={dungeonSearch} onChange={(e)=>setDungeonSearch(e.target.value)} placeholder="Search dungeons" />
                    <Select onValueChange={(val)=>{
                      if (!val) return;
                      const id = Number(val);
                      if (!id) return;
                      if (requirements.completeDungeons.some(x=>x.dungeonId===id)) return;
                      setRequirements(prev=>({ ...prev, completeDungeons: [...prev.completeDungeons, { dungeonId: id, count: 1 }] }));
                    }}>
                      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allDungeons.filter(d=>d.name.toLowerCase().includes(dungeonSearch.toLowerCase())).map(d=> (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {requirements.completeDungeons.map((cd, idx)=> (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">{allDungeons.find(a=>a.id===cd.dungeonId)?.name || cd.dungeonId}</div>
                        <Input type="number" value={cd.count ?? 1} onChange={(e)=>{
                          const v = Number(e.target.value) || 1;
                          setRequirements(prev=>({ ...prev, completeDungeons: prev.completeDungeons.map((c,i)=> i===idx ? { ...c, count: v } : c) }));
                        }} className="w-20" />
                        <Button variant="ghost" size="sm" onClick={()=>setRequirements(prev=>({ ...prev, completeDungeons: prev.completeDungeons.filter((_,i)=>i!==idx) }))}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Enemies (add enemy types or &apos;any&apos;)</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={monsterSearch} onChange={(e)=>setMonsterSearch(e.target.value)} placeholder="Search monsters" />
                    <Select onValueChange={(val)=>{
                      if (!val) return;
                      const v = String(val);
                      if (requirements.killEnemies.some(x=>x.enemyType===v)) return;
                      setRequirements(prev=>({ ...prev, killEnemies: [...prev.killEnemies, { enemyType: v, count: 1 }] }));
                    }}>
                      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">any</SelectItem>
                        {allMonsters.filter(m=>m.name.toLowerCase().includes(monsterSearch.toLowerCase())).map(m=> (
                          <SelectItem key={m.id} value={String(m.name)}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {requirements.killEnemies.map((ke, idx)=> (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">{ke.enemyType}</div>
                        <Input type="number" value={ke.count ?? 1} onChange={(e)=>{
                          const v = Number(e.target.value) || 1;
                          setRequirements(prev=>({ ...prev, killEnemies: prev.killEnemies.map((c,i)=> i===idx ? { ...c, count: v } : c) }));
                        }} className="w-20" />
                        <Button variant="ghost" size="sm" onClick={()=>setRequirements(prev=>({ ...prev, killEnemies: prev.killEnemies.filter((_,i)=>i!==idx) }))}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Items (add items to collect & donate)</label>
                  <div className="flex gap-2 mb-2">
                    <Input value={itemSearch} onChange={(e)=>setItemSearch(e.target.value)} placeholder="Search items" />
                    <Select onValueChange={(val)=>{
                      if (!val) return;
                      const id = Number(val);
                      if (!id) return;
                      if (requirements.collectItems.some(x=>x.itemId===id)) return;
                      setRequirements(prev=>({ ...prev, collectItems: [...prev.collectItems, { itemId: id, quantity: 1 }] }));
                    }}>
                      <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {allItems.filter(it=>it.name.toLowerCase().includes(itemSearch.toLowerCase())).map(it=> (
                          <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    {requirements.collectItems.map((ci, idx)=> (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="flex-1">{allItems.find(a=>a.id===ci.itemId)?.name || ci.itemId}</div>
                        <Input type="number" value={ci.quantity ?? 1} onChange={(e)=>{
                          const v = Number(e.target.value) || 1;
                          setRequirements(prev=>({ ...prev, collectItems: prev.collectItems.map((c,i)=> i===idx ? { ...c, quantity: v } : c) }));
                        }} className="w-20" />
                        <Button variant="ghost" size="sm" onClick={()=>setRequirements(prev=>({ ...prev, collectItems: prev.collectItems.filter((_,i)=>i!==idx) }))}>Remove</Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2">
                    <label className="inline-flex items-center gap-2"><Input type="checkbox" checked={!!requirements.defeatBoss} onChange={(e)=>setRequirements(prev=>({ ...prev, defeatBoss: e.target.checked }))} /> Defeat boss required</label>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block mb-1">Title</label>
              <Input value={title} onChange={(e)=>setTitle(e.target.value)} />
            </div>

            <div>
              <label className="block mb-1">Slug (optional)</label>
              <Input value={slug ?? ''} onChange={(e)=>setSlug(e.target.value || null)} placeholder="auto-generated if empty" />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1">Short description (optional)</label>
              <Input value={description} onChange={(e)=>setDescription(e.target.value)} />
            </div>

            <div>
              <label className="block mb-1">Event start</label>
              <Input type="datetime-local" value={eventStart} onChange={(e)=>setEventStart(e.target.value)} />
            </div>

            <div>
              <label className="block mb-1">Event end (optional)</label>
              <Input type="datetime-local" value={eventEnd ?? ''} onChange={(e)=>setEventEnd(e.target.value || null)} />
            </div>

            <div>
              <label className="block mb-1">Visibility</label>
              <Select value={visibilityMode} onValueChange={(v)=>setVisibilityMode(v as 'visible'|'hidden')}>
                <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visible">Visible</SelectItem>
                  <SelectItem value="hidden">Hidden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block mb-1">Participation required</label>
              <Input type="checkbox" checked={participationRequired} onChange={(e)=>setParticipationRequired(e.target.checked)} />
            </div>

            <div>
              <label className="block mb-1">Global enabled</label>
              <Input type="checkbox" checked={globalEnabled} onChange={(e)=>setGlobalEnabled(e.target.checked)} />
            </div>

            <div>
              <label className="block mb-1">Global target (optional)</label>
              <Input type="number" value={globalTarget ?? ''} onChange={(e)=>setGlobalTarget(e.target.value ? Number(e.target.value) : null)} />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1">Reward configuration</label>
              <div className="flex gap-2 items-center mb-2">
                <Select value={rewardMode} onValueChange={(v)=>setRewardMode(v as 'none'|'pool'|'perPoint')}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No rewards</SelectItem>
                    <SelectItem value="pool">Pool</SelectItem>
                    <SelectItem value="perPoint">Per Point</SelectItem>
                  </SelectContent>
                </Select>
                {rewardMode !== 'none' && (
                  <>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">Gold pool</label>
                      <Input type="number" value={goldPool ?? ''} onChange={(e)=>setGoldPool(e.target.value ? Number(e.target.value) : null)} className="w-32" />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm">Gold / point</label>
                      <Input type="number" value={goldPerPoint ?? ''} onChange={(e)=>setGoldPerPoint(e.target.value ? Number(e.target.value) : null)} className="w-32" />
                    </div>
                  </>
                )}
              </div>

              <div className="mb-2">
                <label className="block mb-1">Add item reward</label>
                <div className="flex gap-2">
                  <Input value={itemSearch} onChange={(e)=>setItemSearch(e.target.value)} placeholder="Search items" />
                  <Select onValueChange={(val)=>{
                    if (!val) return;
                    const id = Number(val);
                    const it = allItems.find(x=>x.id===id);
                    if (!it) return;
                    setItemPools(prev=>[...prev, { itemId: id, qty: 1 }]);
                  }}>
                    <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allItems.filter(it=>it.name.toLowerCase().includes(itemSearch.toLowerCase())).map(it=> (
                        <SelectItem key={it.id} value={String(it.id)}>{it.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-2 space-y-1">
                  {itemPools.map((ip, idx)=> (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="flex-1">{allItems.find(a=>a.id===ip.itemId)?.name || ip.itemId}</div>
                      <Input type="number" value={ip.qty} onChange={(e)=>{
                        const v = Number(e.target.value);
                        setItemPools(prev=>prev.map((p,i)=> i===idx ? { ...p, qty: v } : p));
                      }} className="w-20" />
                      <Button variant="ghost" size="sm" onClick={()=>setItemPools(prev=>prev.filter((_,i)=>i!==idx))}>Remove</Button>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted mt-1">Values are validated on submit. If you need complex configs you can still edit the event server-side.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-1">Scoring weights (used to calculate leaderboard score)</label>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-sm">Dungeon clear</label>
                  <Input type="number" value={dungeonWeight} onChange={(e)=>setDungeonWeight(Number(e.target.value || 0))} className="w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Enemy kill</label>
                  <Input type="number" value={enemyWeight} onChange={(e)=>setEnemyWeight(Number(e.target.value || 0))} className="w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Item donate</label>
                  <Input type="number" value={itemWeight} onChange={(e)=>setItemWeight(Number(e.target.value || 0))} className="w-32" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-1">Content</label>
            <StoryEventEditor initialHtml={content} onChange={(h)=>setContent(h)} />
          </div>

          <div className="flex space-x-2">
            <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button variant="secondary" onClick={onDistribute}>Distribute</Button>
            <Button variant="ghost" onClick={()=>router.push('/admin/story-events')}>Back</Button>
          </div>
        </>
      )}
    </div>
  );
}
