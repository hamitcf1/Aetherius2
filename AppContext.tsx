import React, { createContext, useContext } from 'react';
import type { InventoryItem, DifficultyLevel, WeatherState, StatusEffect, Companion } from './types';
import type { RestOptions } from './components/SurvivalModals';
import type { ShopItem } from './components/ShopModal';

export interface AppContextType {
  handleManualSave: () => void;
  isSaving: boolean;
  handleLogout: () => void;
  setCurrentCharacterId: (id: string | null) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
  handleExportPDF: () => void;
  isExporting: boolean;
  handleGenerateProfileImage: () => void;
  isGeneratingProfileImage: boolean;
  handleCreateImagePrompt: () => void;
  handleUploadPhoto: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  // Auth
  isAnonymous: boolean;
  // Survival (now with modals)
  handleRestWithOptions: (options: RestOptions) => void;
  // Open the Bonfire / Rest menu (optional preview options)
  openBonfireMenu: (options?: RestOptions | null) => void;
  handleEatItem: (item: InventoryItem) => void;
  handleDrinkItem: (item: InventoryItem) => void;
  // Shop
  handleShopPurchase: (item: ShopItem, quantity: number) => void;
  handleShopSell: (item: InventoryItem, quantity: number, totalGold: number) => void;
  gold: number;
  inventory: InventoryItem[];
  hasCampingGear: boolean;
  hasBedroll: boolean;
  characterLevel: number;
  // New Game Features
  handleExportJSON: () => void;
  handleImportJSON: () => void;
  difficulty: DifficultyLevel;
  setDifficulty: (level: DifficultyLevel) => void;
  weather: WeatherState;
  statusEffects: StatusEffect[];
  companions: Companion[];
  colorTheme: string;
  setColorTheme: (theme: string) => void;
  showQuantityControls: boolean;
  setShowQuantityControls: (v: boolean) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppContext.Provider');
  return ctx;
};