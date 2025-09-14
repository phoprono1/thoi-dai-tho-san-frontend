"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import RoomPageContent from '@/components/room/RoomPageContent';

export default function NestedRoomPage() {
  const params = useParams();
  const dungeonId = params?.id ? Number(params.id) : undefined;
  const roomId = params?.roomId ? Number(params.roomId) : undefined;

  if (!roomId) return null;

  return <RoomPageContent roomId={roomId} dungeonId={dungeonId} />;
}
