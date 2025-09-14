"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import RoomPageContent from '@/components/room/RoomPageContent';

export default function RoomCompatPage() {
  const params = useParams();
  const router = useRouter();
  const idParam = params?.id;
  const roomId = Array.isArray(idParam) ? idParam[0] : idParam;
  const [loading, setLoading] = useState(true);
  // room shape is dynamic from legacy API; allow any here with an inline ESLint exception
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [room, setRoom] = useState<any | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;
    (async () => {
      try {
        const resp = await api.get(`/room-lobby/${roomId}`);
        if (!mounted) return;
        setRoom(resp.data || null);
      } catch {
        // ignore - fallback to in-place render
        setRoom(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [roomId]);

  useEffect(() => {
    if (!loading && room && room.dungeon && typeof room.dungeon.id !== 'undefined') {
      router.replace(`/game/explore/dungeons/${room.dungeon.id}/rooms/${room.id}`);
    }
  }, [loading, room, router]);

  if (loading) return <div className="p-6">Đang tải phòng...</div>;

  if (room && room.dungeon && typeof room.dungeon.id !== 'undefined') {
    return <div className="p-6">Đang chuyển hướng tới phòng...</div>;
  }

  // Fallback render for legacy links
  return <RoomPageContent roomId={roomId || ''} />;
}