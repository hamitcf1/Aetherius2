/**
 * Localization / Internationalization Infrastructure
 * 
 * This module provides the foundation for multi-language support in Aetherius.
 * Currently English is the only language, but this infrastructure allows for
 * easy addition of new languages in the future.
 * 
 * Usage:
 *   import { useLocalization, t } from './services/localization';
 *   
 *   // In component:
 *   const { t, language, setLanguage, availableLanguages } = useLocalization();
 *   
 *   // Use translation:
 *   <span>{t('common.save')}</span>
 *   
 *   // With interpolation:
 *   <span>{t('messages.welcome', { name: 'Dragonborn' })}</span>
 */

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

// Supported languages
export type Language = 'en' | 'tr';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
];

// Translation keys structure (type-safe)
export interface TranslationKeys {
  // Common UI elements
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    back: string;
    next: string;
    skip: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    yes: string;
    no: string;
    search: string;
    settings: string;
    help: string;
  };
  
  // Navigation
  nav: {
    adventure: string;
    hero: string;
    equipment: string;
    quests: string;
    journal: string;
    story: string;
    map: string;
  };
  
  // Character related
  character: {
    name: string;
    race: string;
    archetype: string;
    level: string;
    experience: string;
    gold: string;
    health: string;
    magicka: string;
    stamina: string;
    skills: string;
    perks: string;
    stats: string;
    create: string;
    select: string;
    delete: string;
  };
  
  // Tutorial
  tutorial: {
    welcome: string;
    welcomeDescription: string;
    skip: string;
    next: string;
    previous: string;
    step: string;
    complete: string;
  };
  
  // Settings
  settings: {
    theme: string;
    themeLight: string;
    themeDark: string;
    music: string;
    musicOn: string;
    musicOff: string;
    sound: string;
    soundOn: string;
    soundOff: string;
    weather: string;
    weatherSnow: string;
    weatherRain: string;
    weatherClear: string;
    language: string;
  };
  
  // Messages
  messages: {
    welcome: string;
    savingProgress: string;
    progressSaved: string;
    errorSaving: string;
    levelUp: string;
    questComplete: string;
    itemAdded: string;
    itemRemoved: string;
    goldGained: string;
    goldSpent: string;
  };
  
  // Combat
  combat: {
    attack: string;
    defend: string;
    magic: string;
    items: string;
    flee: string;
    victory: string;
    defeat: string;
    enemyAppears: string;
  };
  
  // Survival
  survival: {
    hunger: string;
    thirst: string;
    fatigue: string;
    rest: string;
    eat: string;
    drink: string;
    camp: string;
  };
}

// English translations (default)
const EN_TRANSLATIONS: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    skip: 'Skip',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    yes: 'Yes',
    no: 'No',
    search: 'Search',
    settings: 'Settings',
    help: 'Help',
  },
  nav: {
    adventure: 'Adventure',
    hero: 'Hero',
    equipment: 'Equipment',
    quests: 'Quests',
    journal: 'Journal',
    story: 'Story',
    map: 'Map',
  },
  character: {
    name: 'Name',
    race: 'Race',
    archetype: 'Class',
    level: 'Level',
    experience: 'Experience',
    gold: 'Gold',
    health: 'Health',
    magicka: 'Magicka',
    stamina: 'Stamina',
    skills: 'Skills',
    perks: 'Perks',
    stats: 'Stats',
    create: 'Create Character',
    select: 'Select Character',
    delete: 'Delete Character',
  },
  tutorial: {
    welcome: 'Welcome to Aetherius',
    welcomeDescription: 'An AI-powered Skyrim roleplay experience',
    skip: 'Skip Tutorial',
    next: 'Next',
    previous: 'Previous',
    step: 'Step {{current}} of {{total}}',
    complete: 'Start Adventure',
  },
  settings: {
    theme: 'Theme',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode',
    music: 'Music',
    musicOn: 'Music On',
    musicOff: 'Music Off',
    sound: 'Sound Effects',
    soundOn: 'Sound On',
    soundOff: 'Sound Off',
    weather: 'Weather Effects',
    weatherSnow: 'Snow',
    weatherRain: 'Rain',
    weatherClear: 'Clear',
    language: 'Language',
  },
  messages: {
    welcome: 'Welcome, {{name}}!',
    savingProgress: 'Saving progress...',
    progressSaved: 'Progress saved',
    errorSaving: 'Error saving progress',
    levelUp: 'Level Up! You are now level {{level}}',
    questComplete: 'Quest Complete: {{quest}}',
    itemAdded: 'Added {{item}} to inventory',
    itemRemoved: 'Removed {{item}} from inventory',
    goldGained: 'Gained {{amount}} gold',
    goldSpent: 'Spent {{amount}} gold',
  },
  combat: {
    attack: 'Attack',
    defend: 'Defend',
    magic: 'Magic',
    items: 'Items',
    flee: 'Flee',
    victory: 'Victory!',
    defeat: 'Defeat...',
    enemyAppears: 'A {{enemy}} appears!',
  },
  survival: {
    hunger: 'Hunger',
    thirst: 'Thirst',
    fatigue: 'Fatigue',
    rest: 'Rest',
    eat: 'Eat',
    drink: 'Drink',
    camp: 'Make Camp',
  },
};

// Turkish translations (placeholder - to be filled in)
const TR_TRANSLATIONS: TranslationKeys = {
  common: {
    save: 'Kaydet',
    cancel: 'İptal',
    confirm: 'Onayla',
    delete: 'Sil',
    edit: 'Düzenle',
    close: 'Kapat',
    back: 'Geri',
    next: 'İleri',
    skip: 'Atla',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı',
    yes: 'Evet',
    no: 'Hayır',
    search: 'Ara',
    settings: 'Ayarlar',
    help: 'Yardım',
  },
  nav: {
    adventure: 'Macera',
    hero: 'Kahraman',
    equipment: 'Ekipman',
    quests: 'Görevler',
    journal: 'Günlük',
    story: 'Hikaye',
    map: 'Harita',
  },
  character: {
    name: 'İsim',
    race: 'Irk',
    archetype: 'Sınıf',
    level: 'Seviye',
    experience: 'Deneyim',
    gold: 'Altın',
    health: 'Can',
    magicka: 'Büyü',
    stamina: 'Dayanıklılık',
    skills: 'Yetenekler',
    perks: 'Özellikler',
    stats: 'İstatistikler',
    create: 'Karakter Oluştur',
    select: 'Karakter Seç',
    delete: 'Karakter Sil',
  },
  tutorial: {
    welcome: 'Aetherius\'a Hoş Geldiniz',
    welcomeDescription: 'Yapay zeka destekli Skyrim rol yapma deneyimi',
    skip: 'Öğreticiyi Atla',
    next: 'İleri',
    previous: 'Geri',
    step: 'Adım {{current}} / {{total}}',
    complete: 'Maceraya Başla',
  },
  settings: {
    theme: 'Tema',
    themeLight: 'Aydınlık Mod',
    themeDark: 'Karanlık Mod',
    music: 'Müzik',
    musicOn: 'Müzik Açık',
    musicOff: 'Müzik Kapalı',
    sound: 'Ses Efektleri',
    soundOn: 'Ses Açık',
    soundOff: 'Ses Kapalı',
    weather: 'Hava Efektleri',
    weatherSnow: 'Kar',
    weatherRain: 'Yağmur',
    weatherClear: 'Açık',
    language: 'Dil',
  },
  messages: {
    welcome: 'Hoş geldin, {{name}}!',
    savingProgress: 'İlerleme kaydediliyor...',
    progressSaved: 'İlerleme kaydedildi',
    errorSaving: 'Kaydetme hatası',
    levelUp: 'Seviye Atladın! Artık {{level}}. seviyedesin',
    questComplete: 'Görev Tamamlandı: {{quest}}',
    itemAdded: '{{item}} envantere eklendi',
    itemRemoved: '{{item}} envanterden çıkarıldı',
    goldGained: '{{amount}} altın kazanıldı',
    goldSpent: '{{amount}} altın harcandı',
  },
  combat: {
    attack: 'Saldır',
    defend: 'Savun',
    magic: 'Büyü',
    items: 'Eşyalar',
    flee: 'Kaç',
    victory: 'Zafer!',
    defeat: 'Yenilgi...',
    enemyAppears: 'Bir {{enemy}} belirdi!',
  },
  survival: {
    hunger: 'Açlık',
    thirst: 'Susuzluk',
    fatigue: 'Yorgunluk',
    rest: 'Dinlen',
    eat: 'Ye',
    drink: 'İç',
    camp: 'Kamp Kur',
  },
};

// All translations
const TRANSLATIONS: Record<Language, TranslationKeys> = {
  en: EN_TRANSLATIONS,
  tr: TR_TRANSLATIONS,
};

// Context type
interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  availableLanguages: LanguageOption[];
}

// Create context
const LocalizationContext = createContext<LocalizationContextType | null>(null);

// Storage key
const LANGUAGE_STORAGE_KEY = 'aetherius:language';

// Provider component
export const LocalizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'tr')) {
        return saved as Language;
      }
    } catch (e) {}
    return 'en'; // Default to English
  });

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) {}
  }, [language]);

  // Set language handler
  const setLanguage = useCallback((lang: Language) => {
    if (TRANSLATIONS[lang]) {
      setLanguageState(lang);
    }
  }, []);

  // Translation function with interpolation
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translations = TRANSLATIONS[language];
    
    // Navigate nested keys like 'common.save'
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Key not found, return the key itself
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string: ${key}`);
      return key;
    }
    
    // Handle interpolation {{variable}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
        return params[paramKey] !== undefined ? String(params[paramKey]) : `{{${paramKey}}}`;
      });
    }
    
    return value;
  }, [language]);

  return (
    <LocalizationContext.Provider value={{
      language,
      setLanguage,
      t,
      availableLanguages: AVAILABLE_LANGUAGES,
    }}>
      {children}
    </LocalizationContext.Provider>
  );
};

// Hook to use localization
export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};

// Standalone translation function for use outside of React components
// Note: This uses English by default. For dynamic language, use the hook.
export const t = (key: string, params?: Record<string, string | number>): string => {
  const translations = TRANSLATIONS['en'];
  
  const keys = key.split('.');
  let value: any = translations;
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  if (params) {
    return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : `{{${paramKey}}}`;
    });
  }
  
  return value;
};

export default LocalizationProvider;
