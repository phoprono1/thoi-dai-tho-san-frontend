import { api } from '@/lib/api-client';
import { ItemType, ConsumableType } from '@/types/game';

export const seedConsumableItems = async () => {
  const consumableItems = [
    {
      name: 'Small Health Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.HP_POTION,
      rarity: 1,
      price: 50,
      consumableValue: 100,
      stats: {}
    },
    {
      name: 'Medium Health Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.HP_POTION,
      rarity: 2,
      price: 150,
      consumableValue: 300,
      stats: {}
    },
    {
      name: 'Large Health Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.HP_POTION,
      rarity: 3,
      price: 400,
      consumableValue: 800,
      stats: {}
    },
    {
      name: 'Small EXP Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.EXP_POTION,
      rarity: 2,
      price: 200,
      consumableValue: 500,
      stats: {}
    },
    {
      name: 'Medium EXP Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.EXP_POTION,
      rarity: 3,
      price: 600,
      consumableValue: 1500,
      stats: {}
    },
    {
      name: 'Large EXP Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.EXP_POTION,
      rarity: 4,
      price: 1500,
      consumableValue: 4000,
      stats: {}
    },
    {
      name: 'Strength Boost Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.STAT_BOOST,
      rarity: 3,
      price: 800,
      consumableValue: 20,
      duration: 30,
      stats: {
        strength: 20
      }
    },
    {
      name: 'Intelligence Boost Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.STAT_BOOST,
      rarity: 3,
      price: 800,
      consumableValue: 20,
      duration: 30,
      stats: {
        intelligence: 20
      }
    },
    {
      name: 'All Stats Boost Potion',
      type: ItemType.CONSUMABLE,
      consumableType: ConsumableType.STAT_BOOST,
      rarity: 5,
      price: 3000,
      consumableValue: 50,
      duration: 60,
      stats: {
        strength: 50,
        intelligence: 50,
        dexterity: 50,
        vitality: 50,
        luck: 50
      }
    }
  ];

  try {
    for (const item of consumableItems) {
      await api.post('/items', item);
      // Created consumable item
    }
    // All consumable items seeded successfully
  } catch (error) {
    console.error('Error seeding consumable items:', error);
  }
};

// Uncomment to run seeding
// seedConsumableItems();
