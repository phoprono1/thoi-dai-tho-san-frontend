"use client";

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import GameLayout from './GameLayout';
import StatusTab from './tabs/StatusTab';
import InventoryTab from './tabs/InventoryTab';
import ExploreTab from './tabs/ExploreTab';
import QuestTab from './tabs/QuestTab';
import GuildTab from './tabs/GuildTab';

const validTabs = ['status', 'inventory', 'explore', 'quests', 'guild'];

export default function GameDashboard() {
  const router = useRouter();
  const pathname = usePathname();

  const deriveTabFromPath = (path: string | null) => {
    if (!path) return 'status';
    // expected paths: /game, /game/status, /game/explore, /game/explore/..., /game/inventory, etc.
    const parts = path.split('/').filter(Boolean);
    if (parts.length === 0) return 'status';
    if (parts[0] !== 'game') return 'status';
    if (parts.length === 1) return 'status';
    const maybeTab = parts[1];
    return validTabs.includes(maybeTab) ? maybeTab : 'status';
  };

  const [activeTab, setActiveTab] = useState(() => deriveTabFromPath(pathname));

  useEffect(() => {
    if (!pathname) return setActiveTab('status');
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length === 0) return setActiveTab('status');
    if (parts[0] !== 'game') return setActiveTab('status');
    if (parts.length === 1) return setActiveTab('status');
    const maybeTab = parts[1];
    setActiveTab(validTabs.includes(maybeTab) ? maybeTab : 'status');
  }, [pathname]);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'status':
        return <StatusTab />;
      case 'inventory':
        return <InventoryTab />;
      case 'explore':
        return <ExploreTab />;
      case 'quests':
        return <QuestTab />;
      case 'guild':
        return <GuildTab />;
      default:
        return <StatusTab />;
    }
  };

  const handleTabChange = (tabId: string) => {
    if (!validTabs.includes(tabId)) return;
    setActiveTab(tabId);
    // navigate to the path-based tab route
    const target = tabId === 'status' ? '/game' : `/game/${tabId}`;
    router.replace(target);
  };

  return (
    <GameLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderActiveTab()}
    </GameLayout>
  );
}
