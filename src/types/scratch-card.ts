export enum PrizeType {
  GOLD = 'gold',
  ITEM = 'item',
}

export interface User {
  id: number;
  username: string;
  gold: number;
}

export interface Item {
  itemId: number;
  quantity: number;
}

export interface ScratchCardTypePrize {
  id: number;
  prizeType: PrizeType;
  prizeValue: number;
  prizeQuantity: number;
  probabilityWeight: number;
  taxRate: number;
  maxClaims?: number;
  claimsCount: number;
  positionRow: number;
  positionCol: number;
  cardType: ScratchCardType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScratchCardType {
  id: number;
  name: string;
  description?: string;
  backgroundImageUrl?: string;
  costGold: number;
  gridRows: number;
  gridCols: number;
  isActive: boolean;
  prizes: ScratchCardTypePrize[];
  userCards: UserScratchCard[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ScratchedPrize {
  prizeId: number;
  prizeType: PrizeType;
  prizeValue: number;
  prizeQuantity: number;
  taxDeducted: number;
  finalAmount: number;
  positionRow: number;
  positionCol: number;
}

export interface UserScratchCard {
  id: number;
  user: User;
  cardType: ScratchCardType;
  playerNumber: number;
  scratchedPositions: number[];
  revealedPrizes: ScratchedPrize[];
  isCompleted: boolean;
  totalGoldWon: number;
  totalItemsWon: Item[];
  taxDeducted: number;
  finalGoldReceived: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}