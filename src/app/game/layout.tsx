"use client";
import React from 'react';
import GameLayout from '@/components/game/GameLayout';

export default function GameAppLayout({ children }: { children: React.ReactNode }) {
  // This layout makes GameLayout persistent across all /game/* routes
  return (
    <GameLayout>
      {children}
    </GameLayout>
  );
}
