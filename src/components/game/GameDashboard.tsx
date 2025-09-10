'use client';

import { useState } from 'react';
import GameLayout from './GameLayout';
import StatusTab from './tabs/StatusTab';
import InventoryTab from './tabs/InventoryTab';
import ExploreTab from './tabs/ExploreTab';
import QuestTab from './tabs/QuestTab';
import GuildTab from './tabs/GuildTab';

export default function GameDashboard() {
  const [activeTab, setActiveTab] = useState('status');

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
    setActiveTab(tabId);
  };

  return (
    <GameLayout activeTab={activeTab} onTabChange={handleTabChange}>
      {renderActiveTab()}
    </GameLayout>
  );
}
