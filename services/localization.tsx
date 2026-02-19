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

// Return a platform-appropriate flag: on Windows systems use inline SVGs (better visual fidelity),
// otherwise return the emoji fallback. This helps when Windows fonts render flags as two-letter
// sequences (GB/TR) instead of colorful emoji.
export const getLanguageFlag = (code: Language): React.ReactNode => {
  const isWindows = (typeof navigator !== 'undefined') && /Windows/.test(navigator.userAgent);
  if (!isWindows) {
    const flag = (AVAILABLE_LANGUAGES.find(l => l.code === code)?.flag) || '';
    return <span role="img" aria-label={`${AVAILABLE_LANGUAGES.find(l => l.code === code)?.name || code} flag`}>{flag}</span>;
  }

  // Inline SVGs for GB and TR (small, 20x14 aspect) - keeps styling consistent with surrounding text
  switch (code) {
    case 'en':
      return (
        <svg width="20" height="14" viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="English flag">
          <rect width="20" height="14" fill="#012169" />
          <path d="M0 0L20 14M20 0L0 14" stroke="#FFF" strokeWidth="2" />
          <path d="M0 0L12 0M8 14L20 14" stroke="#C8102E" strokeWidth="1.4" />
          <path d="M10 0V14M0 7H20" stroke="#FFF" strokeWidth="2" />
          <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="1" />
        </svg>
      );
    case 'tr':
      return (
        <svg width="20" height="14" viewBox="0 0 20 14" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Turkish flag">
          <rect width="20" height="14" fill="#E30A17" />
          <circle cx="8" cy="7" r="3.5" fill="#fff" />
          <path d="M9.6 7a2 2 0 100-2.5 2 2 0 000 2.5z" transform="translate(0 .2)" fill="#E30A17" />
          <path d="M11.8 5.5l-0.6 0.4 0.2-0.8-0.6-0.4 0.8 0 0.2-0.8 0.2 0.8 0.8 0-0.6 0.4 0.2 0.8z" fill="#fff" />
        </svg>
      );
    default:
      const fallback = (AVAILABLE_LANGUAGES.find(l => l.code === code)?.flag) || '';
      return <span role="img" aria-label={`${AVAILABLE_LANGUAGES.find(l => l.code === code)?.name || code} flag`}>{fallback}</span>;
  }
};

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
    show: string;
    hide: string;
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
    gameMenu: string;
  };

  // Auth / App Shell
  auth: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    login: string;
    register: string;
    email: string;
    password: string;
    username: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    guestParam: string;
    guestLogin: string;
    logout: string;
    offlineMode: string;
    googleLogin: string;
  };

  // Sidebar Sections & Items
  sidebar: {
    crafting: string;
    magic: string;
    world: string;
    social: string;
    aiTools: string;
    progress: string;
    // Items
    alchemy: string;
    cooking: string;
    enchanting: string;
    shouts: string;
    standingStones: string;
    transformations: string;
    travel: string;
    factions: string;
    bounty: string;
    training: string;
    housing: string;
    companions: string;
    gameMaster: string;
    bugReports: string;
    achievements: string;
  };

  app: {
    title: string;
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
    levelUpAvailable: string;
    levelReq: string;
    maxStats: string;
    combatStats: string;
    armorRating: string;
    weaponDamage: string;
    equipped: string;
    inGameTime: string;
    needsStatus: string;
    gender: string;
    coreIdentity: string;
    psychology: string;
    moralCode: string;
    breakingPoint: string;
    talents: string;
    magicApproach: string;
    fears: string;
    weaknesses: string;
    roleplayBehavior: string;
    forcedBehavior: string;
    longTermEvolution: string;
    evolutionMilestones: string;
    skillProficiency: string;
    activePerks: string;
    perkName: string;
    perkRank: string;
    perkDesc: string;
    addPerk: string;
    allowedActions: string;
    forbiddenActions: string;
    factionAllegiance: string;
    generalWorldview: string;
    daedricPerception: string;
    backstory: string;
    fullHistory: string;
    noPerks: string;
    noMilestones: string;
    savedToCloud: string;
    maxHealth: string;
    maxMagicka: string;
    maxStamina: string;
    sortName: string;
    groupSkill: string;
    sections: {
      identity: string;
      talents: string;
      fears: string;
      evolution: string;
      skills: string;
      rules: string;
      faction: string;
      backstory: string;
    };
  };
  adventure: {
    welcome: string;
    title: string;
    modelTip: string;
    warnings: string;
    quests: string;
    new: string;
    clear: string;
    state: string;
    equip: string;
    simulation: {
      title: string;
      noData: string;
      currentScene: string;
      phase: string;
      attempts: string;
      resolved: string;
      presentNPCs: string;
      establishedFacts: string;
      knownBy: string;
      pending: string;
      noActive: string;
    };
    equipment: {
      title: string;
      close: string;
      inventory: string;
      unequip: string;
      equip: string;
      slot: string;
      selectFor: string;
      noItems: string;
      cancel: string;
      twoHandedDisabled: string;
      equippedByCompanion: string;
      equipToSlot: string;
      stats: string;
      legend: string;
    };
    settings: {
      title: string;
      autoApply: string;
      showRateLimit: string;
      textSettings: string;
      voiceSettings: string;
      voiceOn: string;
      voiceOff: string;
      resetAll: string;
      reset: string;
      voiceGender: string;
      voiceStyle: string;
      pitch: string;
      speed: string;
      lower: string;
      higher: string;
      slower: string;
      faster: string;
      voiceNote: string;
      testVoice: string;
      testNPC: string;
      playSample: string;
      preview: string;
      previewText: string;
    };
    empty: {
      continue: string;
      start: string;
      continueBtn: string;
      startBtn: string;
    };
    actions: {
      listen: string;
      youWillSay: string;
    };
    updates: {
      questStarted: string;
      minPassed: string;
      apply: string;
    };
    inputPlaceholder: string;
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
    title: string;
    round: string;
    time: string;
    playerTurn: string;
    enemyTurn: string;
    speed: string;
    auto: string;
    loot: string;
    showLoot: string;
    showLootNow: string;
    close: string;
    stunned: string;
    shielded: string;
    defending: string;
    summons: string;
    decaying: string;
    actions: string;
    actions_mobile: string;
    mainAction: string;
    bonusAction: string;
    used: string;
    available: string;
    skipTurn: string;
    recommended: string;
    defend: string;
    flee: string;
    surrender: string;
    allies: string;
    enemies: string;
    physical: string;
    magical: string;
    companionTurn: string;
    selectTarget: string;
    control: string;
    skipCompanion: string;
    chooseTarget: string;
    useSelf: string;
    confirmTarget: string;
    cancel: string;
    noAbilities: string;
    inventory: string;
    useItem: string;
    back: string;
    noItems: string;
    log: string;
    autoScroll: string;
    defeated: string;
    fallen: string;
    acceptFate: string;
    equip: string;
    equipped: string;
    equipTo: string;
    alreadySummoned: string;
    level: string;
    health: string;
    magicka: string;
    stamina: string;
    damage: string;
    armor: string;
    crit: string;
    dodge: string;
    criticalHealth: string;
    stunWarning: string;
    roll: string;
    attack: string;
    defendBtn: string;
    magic: string;
    items: string;
    fleeBtn: string;
    victory: string;
    defeat: string;
    enemyAppears: string;
    confirm: string;
    abilities: string;
    equipBtn: string;
    chooseTargetFor: string;
    cannotTargetAllies: string;
    hideActions: string;
    showActions: string;
    combatLog: string;
    invalidTarget: string;
    autoScrollOn: string;
    autoScrollOff: string;
    companionAbilities: string;
    selectSelfOrAlly: string;
    selectItem: string;
    itemBonusAction: string;
    summonBonusAction: string;
  };


  loot: {
    title: string;
    instruction: string;
    xp: string;
    gold: string;
    empty: string;
    lootAll: string;
    confirm: string;
    skip: string;
    cancel: string;
    header: string;
  };

  equipment: {
    head: string;
    necklace: string;
    chest: string;
    hands: string;
    weapon: string;
    offhand: string;
    ring: string;
    feet: string;
    armor: string;
    damage: string;
    clickToEquip: string;
    empty: string;
    twoHandedDisabled: string;
    equippedByCompanion: string;
    equipToSlot: string;
    stats: string;
    legend: string;
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
    starving: string;
    starvingDesc: string;
    hungry: string;
    hungryDesc: string;
    dehydrated: string;
    dehydratedDesc: string;
    thirsty: string;
    thirstyDesc: string;
    exhausted: string;
    exhaustedDesc: string;
    tired: string;
    tiredDesc: string;
    rested: string;
    restedDesc: string;
    wellFed: string;
    wellFedDesc: string;
    hydrated: string;
    hydratedDesc: string;
  };

  // Inventory & Equipment
  inventory: {
    title: string;
    subtitle: string;
    gold: string;
    weight: string;
    equip: string;
    unequip: string;
    use: string;
    drop: string;
    deleteTitle: string;
    deleteConfirm: string;
    overEncumbered: string;
    empty: string;
    emptyCategory: string;
    addItem: string;
    manualAdd: string;
    manualAddWarning: string;
    shop: string;
    blacksmith: string;
    equipped: string;
    viewInventory: string;
    viewEquipment: string;
    quickSelect: string;
    itemName: string;
    itemType: string;
    itemDesc: string;
    addToInventory: string;
    showIds: string;
    hideIds: string;
    favoritesOnly: string;
    markFavorite: string;
    unmarkFavorite: string;
    selectItem: string;
    noSuitable: string;
  };

  category: {
    all: string;
    weapons: string;
    apparel: string;
    potions: string;
    food: string;
    drink: string;
    camping: string;
    ingredients: string;
    keys: string;
    misc: string;
    favorites: string;
  };

  item: {
    food: string;
    drink: string;
    healthPotion: string;
    magickaPotion: string;
    staminaPotion: string;
  };

  sort: {

    name: string;
    type: string;
    rarity: string;
    newest: string;
    quantity: string;
    damage: string;
    value: string;
  };

  map: {
    title: string;
    current: string;
    level: string;
    filter: {
      all: string;
      cities: string;
      dungeons: string;
      landmarks: string;
      unlocked: string;
      quests: string;
    };
    tooltips: {
      toggleEvents: string;
      toggleMissions: string;
      toggleLabels: string;
      centerPlayer: string;
      locked: string;
    };
    legend: {
      city: string;
      town: string;
      village: string;
      dungeon: string;
      landmark: string;
      event: string;
    };
  };

  dungeon: {
    nodes: {
      start: string;
      combat: string;
      elite: string;
      boss: string;
      rest: string;
      reward: string;
      event: string;
      empty: string;
    };
    actions: {
      fight: string;
      challengeElite: string;
      engageBoss: string;
      rest: string;
      loot: string;
      investigate: string;
      proceed: string;
      doom: string;
      exit: string;
    };
    warnings: {
      minLevel: string;
      recLevel: string;
    };
    stats: {
      floor: string;
      gold: string;
      xp: string;
    };
    currentLocation: string;
  };

  // Shop
  shop: {
    title: string;
    buy: string;
    sell: string;
    searchShop: string;
    searchInventory: string;
    noItems: string;
    noItemsSell: string;
    noMatchingInventory: string;
    notBuying: string;
    sort: string;
    itemsAvailable: string;
    category: string;
    sellOne: string;
    sellAll: string;
    bought: string;
    needGold: string;
  };

  // Companions
  companions: {
    title: string;
    recruit: string;
    dismiss: string;
    fire: string;
    wait: string;
    follow: string;
    trade: string;
    combat: string;
    stats: string;
    behaviors: {
      aggressive: string;
      passive: string;
      defensive: string;
      ranged: string;
    };
    races: Record<string, string>;
    animals: Record<string, string>;
    animalCompanion: string;
    humanCompanion: string;
  };

  // Actions Bar
  actions: {
    label: string;
    save: string;
    switch: string;
    exit: string;
    exitGuest: string;
    createImage: string;
    uploadPhoto: string;
    export: string;
    exportJson: string;
    import: string;
    generateProfile: string;
    generating: string;
    version: string;
    madeBy: string;
  };

  // Status & XP
  status: {
    offline: string;
    online: string;
    offlineDesc: string;
    pending: string;
    saving: string;
    saved: string;
    saveFailed: string;
    savedLocally: string;
    encumbered: string;
    encumberedWarning: string;
  };

  xp: {
    experience: string;
    total: string;
  };

  rest: {
    title: string;
    description: string;
    method: string;
    hours: string;
    actions: {
      camp: string;
      bed: string;
      cancel: string;
      confirm: string;
    };
    labels: {
      hour: string;
      hours: string;
      minutes: string;
    };
    location: string;
    locations: {
      outside: string;
      camp: string;
      inn: string;
    };
    quality: {
      well: string;
      wellDesc: string;
      normal: string;
      normalDesc: string;
      somewhat: string;
      somewhatDesc: string;
      poor: string;
      poorDesc: string;
    };
    warnings: {
      noGear: string;
    };
    visitShop: string;
  };
  spells: {
    title: string;
    points: string;
    refund: string;
    learn: string;
    labels: {
      magicka: string;
      perkCost: string;
      damage: string;
      heal: string;
      effects: string;
      requires: string;
      empoweredAvailable: string;
      empoweredLocked: string;
      learnEmpowered: string;
      needPoints: string;
    };
    schools: {
      Destruction: string;
      Restoration: string;
      Conjuration: string;
      Alteration: string;
      Illusion: string;
      General: string;
    };
    data: Record<string, {
      name: string;
      description: string;
    }>;
  };
  items: {
    enchantedItemFormat: string;
    data: Record<string, string>;
    enchantment: Record<string, string>;
  };
  perks: {
    title: string;
    points: string;
    spent: string;
    expandAll: string;
    collapseAll: string;
    refund: string;
    staged: string;
    cancel: string;
    leave: string;
    confirm: string;
    stage: string;
    undo: string;
    master: string;
    cancelMaster: string;
    force: string;
    refundDesc: string;
    reallocateDesc: string;
    requires: string;
    rank: string;
    masterCost: string;
    perRank: string;
    current: string;
    selectPrompt: string;
    categories: {
      attributes: string;
      combat: string;
      armor: string;
      magic: string;
      stealth: string;
    };
    data: Record<string, {
      name: string;
      description: string;
    }>;
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
    show: 'Show',
    hide: 'Hide',
  },
  nav: {
    adventure: 'Adventure',
    hero: 'Hero',
    equipment: 'Inventory',
    quests: 'Quests',
    journal: 'Journal',
    story: 'Story',
    map: 'Map',
    gameMenu: 'Game Menu',
  },
  auth: {
    welcomeTitle: 'SKYRIM',
    welcomeSubtitle: 'Welcome to Aetherius',
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    username: 'Username',
    forgotPassword: 'Forgot Password?',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    guestParam: 'Guest',
    guestLogin: 'Continue as Guest',
    logout: 'Logout',
    offlineMode: 'Offline Mode',
    googleLogin: 'Sign in with Google',
  },
  sidebar: {
    crafting: 'Crafting',
    magic: 'Magic & Powers',
    world: 'World',
    social: 'Social',
    aiTools: 'AI Tools',
    progress: 'Progress',
    alchemy: 'Alchemy',
    cooking: 'Cooking',
    enchanting: 'Enchanting',
    shouts: 'Shouts',
    standingStones: 'Standing Stones',
    transformations: 'Transformations',
    travel: 'Travel',
    factions: 'Factions',
    bounty: 'Bounty',
    training: 'Training',
    housing: 'Housing',
    companions: 'Companions',
    gameMaster: 'Consult Game Master',
    bugReports: 'Bug Reports',
    achievements: 'Achievements',
  },
  shop: {
    title: 'General Goods',
    buy: 'Buy',
    sell: 'Sell',
    searchShop: 'Search shop...',
    searchInventory: 'Search inventory...',
    noItems: 'No items found.',
    noItemsSell: 'No items to sell.',
    noMatchingInventory: 'No matching items in your inventory.',
    notBuying: 'This vendor is not buying items right now.',
    sort: 'Sort',
    itemsAvailable: 'items available',
    category: 'Category',
    sellOne: 'Sell 1',
    sellAll: 'Sell All',
    bought: 'Bought!',
    needGold: 'Need',
  },
  companions: {
    title: 'Companions',
    recruit: 'Recruit',
    dismiss: 'Dismiss',
    fire: 'Part Ways',
    wait: 'Wait Here',
    follow: 'Follow Me',
    trade: 'Trade Items',
    combat: 'Combat',
    stats: 'Stats',
    behaviors: {
      aggressive: 'Aggressive',
      passive: 'Passive',
      defensive: 'Defensive',
      ranged: 'Ranged',
    },
    races: {
      Nord: 'Nord',
      Imperial: 'Imperial',
      Breton: 'Breton',
      Redguard: 'Redguard',
      Altmer: 'High Elf',
      Bosmer: 'Wood Elf',
      Dunmer: 'Dark Elf',
      Orc: 'Orc',
      Khajiit: 'Khajiit',
      Argonian: 'Argonian',
    },
    animals: {
      dog: 'Dog',
      husky: 'Husky',
      wolf: 'Wolf',
      bear: 'Bear',
      saber: 'Sabre Cat',
      spider: 'Frostbite Spider',
      troll: 'Troll',
    },
    animalCompanion: 'Animal Companion',
    humanCompanion: 'Human Follower',
  },
  actions: {
    label: 'Actions',
    save: 'Save',
    switch: 'Switch',
    exit: 'Exit',
    exitGuest: 'Exit (Guest)',
    createImage: 'Create Image Prompt',
    uploadPhoto: 'Upload Photo',
    export: 'Export Full Record',
    exportJson: 'Export JSON',
    import: 'Import',
    generateProfile: 'Generate Profile Photo',
    generating: 'Generating...',
    version: 'Version',
    madeBy: 'Made by',
  },
  status: {
    offline: 'You\'re offline.',
    online: 'Back online! Syncing changes...',
    offlineDesc: 'Changes will be saved locally and synced when reconnected.',
    pending: 'pending',
    saving: 'Saving...',
    saved: 'Saved',
    saveFailed: 'Save failed',
    savedLocally: 'Saved locally',
    encumbered: 'Over-encumbered!',
    encumberedWarning: 'You are carrying too much to run.',
  },
  xp: {
    experience: 'Experience',
    total: 'Total',
  },
  app: {
    title: 'SkyAetherius',
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
    levelUpAvailable: 'Level up available',
    levelReq: '{{level}} requires {{xp}} XP',
    maxStats: 'Max Stats (Character Creation)',
    combatStats: 'Combat Stats (from Equipment)',
    armorRating: 'Armor Rating',
    weaponDamage: 'Weapon Damage',
    equipped: 'Equipped',
    inGameTime: 'In-Game Time',
    needsStatus: 'Hunger / Thirst / Fatigue (0 = good, 100 = bad)',
    gender: 'Gender',
    coreIdentity: 'Core Identity',
    psychology: 'Psychology',
    moralCode: 'Moral Code',
    breakingPoint: 'Breaking Point',
    talents: 'Talents',
    magicApproach: 'Approach to Magic',
    fears: 'Fears',
    weaknesses: 'Weaknesses',
    roleplayBehavior: 'Roleplay Behavior',
    forcedBehavior: 'Forced Behavior',
    longTermEvolution: 'Long Term Evolution',
    evolutionMilestones: 'Evolution Milestones',
    skillProficiency: 'Skill Proficiency',
    activePerks: 'Active Perks',
    perkName: 'Perk Name',
    perkRank: 'Rank',
    perkDesc: 'Description',
    addPerk: 'Add Perk',
    allowedActions: 'What is Allowed',
    forbiddenActions: 'What is NOT Allowed',
    factionAllegiance: 'Faction Allegiance',
    generalWorldview: 'General Worldview',
    daedricPerception: 'Daedric Perception',
    backstory: 'Backstory',
    fullHistory: 'Full History',
    noPerks: 'No perks learned.',
    noMilestones: 'No milestones set.',
    savedToCloud: 'Saved to cloud',
    maxHealth: 'Max Health',
    maxMagicka: 'Max Magicka',
    maxStamina: 'Max Stamina',
    sortName: 'Sort by Name',
    groupSkill: 'Group by Skill',
    sections: {
      identity: 'Identity & Psychology',
      talents: 'Talents & Skills',
      fears: 'Fears & Weaknesses',
      evolution: 'Evolution & Roleplay',
      "skills": 'Skills & Perks',
      rules: 'Rules & Constraints',
      faction: 'Faction & Worldview',
      backstory: 'Backstory',
    },
  },
  adventure: {
    welcome: 'Select a character to begin your adventure.',
    title: 'Adventure',
    modelTip: 'Tip: For the best adventure experience, use Gemma 2 27B.',
    warnings: 'Warnings:',
    quests: 'Quests',
    new: 'New',
    clear: 'Clear',
    state: 'State',
    equip: 'Equip',
    simulation: {
      title: 'Simulation State',
      noData: 'No simulation data available.',
      currentScene: 'Current Scene',
      phase: 'Phase',
      attempts: 'Attempts',
      resolved: 'Resolved',
      presentNPCs: 'Present NPCs',
      establishedFacts: 'Established Facts',
      knownBy: 'known by',
      pending: 'pending consequence(s)',
      noActive: 'No active simulation state. Start an adventure to begin tracking.',
    },
    equipment: {
      title: 'Equipment',
      close: 'Close',
      inventory: 'Inventory',
      unequip: 'Unequip',
      equip: 'Equip',
      slot: 'Slot...',
      selectFor: 'Select item for',
      noItems: 'No suitable items for this slot',
      cancel: 'Cancel',
      twoHandedDisabled: 'Disabled due to two-handed main weapon',
      equippedByCompanion: 'Equipped by companion',
      equipToSlot: 'Equip {{slot}}',
      stats: 'Armor: {{armor}} • Damage: {{damage}}',
      legend: 'Click empty slot to equip • Click equipped item to unequip',
    },
    settings: {
      title: 'Chat Settings',
      autoApply: 'Auto-apply game changes (items, quests, gold)',
      showRateLimit: 'Show rate limit bar',
      textSettings: 'Text Settings',
      voiceSettings: 'Voice Settings',
      voiceOn: 'Voice On',
      voiceOff: 'Voice Off',
      resetAll: 'Reset All Settings to Defaults',
      reset: 'Reset to Default',
      voiceGender: 'Voice Gender',
      voiceStyle: 'Voice Style',
      pitch: 'Pitch',
      speed: 'Speed',
      lower: 'Lower',
      higher: 'Higher',
      slower: 'Slower',
      faster: 'Faster',
      voiceNote: 'Note: Voice changes take effect on the next message. Custom voices count against your daily quota.',
      testVoice: 'Test Voice',
      testNPC: 'Test NPC',
      playSample: 'Play Sample',
      preview: 'Preview',
      previewText: 'The wind howls through the mountain pass as you approach the ancient ruins...',
    },
    empty: {
      continue: 'Continue where you left off...',
      start: 'Your adventure awaits...',
      continueBtn: 'Continue Adventure',
      startBtn: 'Begin Your Journey',
    },
    actions: {
      listen: 'Listen',
      youWillSay: 'You will say:',
    },
    updates: {
      questStarted: 'quest(s) started',
      minPassed: 'min passed',
      apply: 'Apply Changes',
    },
    inputPlaceholder: 'What do you do? (Enter to send)',
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
    title: 'COMBAT',
    round: 'Round {{round}}',
    time: 'Time {{min}}:{{sec}}',
    playerTurn: '🎯 Your Turn',
    enemyTurn: '⏳ Enemy Turn',
    speed: 'Speed',
    auto: 'Auto {{state}}',
    loot: 'Loot',
    showLoot: 'Show loot on victory',
    showLootNow: 'Show Loot Now',
    close: 'Close',
    stunned: '⚡ Stunned ({{turns}})',
    shielded: '🛡️ Shielded ({{turns}})',
    defending: '🛡️ Defending',
    summons: '⚔️ Summons: {{names}}',
    decaying: '⚡ Decaying: {{names}}',
    actions: 'ACTIONS',
    actions_mobile: 'Actions',
    mainAction: 'Main Action',
    bonusAction: 'Bonus Action',
    used: '(Used)',
    available: '(Available)',
    skipTurn: 'Skip Turn',
    recommended: '(Recommended)',
    defend: 'Defend',
    flee: 'Flee',
    surrender: 'Surrender',
    allies: 'ALLIES',
    enemies: 'ENEMIES',
    physical: 'PHYSICAL',
    magical: 'MAGICAL',
    companionTurn: 'COMPANION TURN',
    selectTarget: 'SELECT TARGET',
    control: 'Control {{name}} (Companion)',
    skipCompanion: 'Skip Companion Turn',
    chooseTarget: 'Choose target for {{ability}}',
    useSelf: 'Use on Self',
    confirmTarget: 'Confirm Target',
    cancel: 'Cancel',
    noAbilities: 'No {{type}} abilities available.',
    inventory: 'INVENTORY',
    useItem: 'Use Item',
    back: 'Back',
    noItems: 'No usable items',
    log: 'COMBAT LOG',
    autoScroll: 'Auto-scroll {{state}}',
    defeated: 'DEFEATED',
    fallen: 'You have fallen in battle...',
    acceptFate: 'Accept Fate',
    equip: 'Equip',
    equipped: 'Equipped',
    equipTo: 'Equip to: {{slot}}',
    alreadySummoned: 'Already summoned',
    level: 'Lv.{{level}}',
    health: 'Health',
    magicka: 'Magicka',
    stamina: 'Stamina',
    damage: 'Damage',
    armor: 'Armor',
    crit: 'Crit',
    dodge: 'Dodge',
    criticalHealth: '⚠️ Critical Health!',
    stunWarning: '⚡ You are stunned! You can only Skip Turn this round.',
    roll: 'Roll',
    attack: 'Attack',
    defendBtn: 'Defend', // using 'defend' key above is fine too, but explicit naming is safer if needed. Reusing 'defend'
    magic: 'Magic',
    items: 'Items',
    fleeBtn: 'Flee', // reusing 'flee'
    victory: 'Victory!',
    defeat: 'Defeat...',
    enemyAppears: 'A {{enemy}} appears!',
    confirm: 'Confirm',
    abilities: '{{type}} ABILITIES',
    equipBtn: 'Equipment',
    chooseTargetFor: 'Choose target for {{abilityName}}',
    cannotTargetAllies: 'This ability cannot target allies.',
    hideActions: 'Hide Actions',
    showActions: 'Show Actions',
    combatLog: 'Combat Log',
    invalidTarget: 'Invalid target selected.',
    autoScrollOn: 'Auto-scroll ON',
    autoScrollOff: 'Auto-scroll OFF',
    companionAbilities: 'Companion Abilities',
    selectSelfOrAlly: 'Select self or an ally.',
    selectItem: 'Select an item to use.',
    itemBonusAction: 'Uses bonus action',
    summonBonusAction: 'Conjuration spells use the Bonus action.',
  },

  loot: {
    title: 'Loot Phase',
    instruction: 'Select items to loot from defeated enemies, or skip looting entirely.',
    xp: 'Experience',
    gold: 'Gold',
    empty: 'There is nothing to loot.',
    lootAll: 'Loot All',
    confirm: 'Confirm',
    skip: 'Skip',
    cancel: 'Cancel',
    header: 'Loot',
  },
  equipment: {
    head: 'Head',
    necklace: 'Necklace',
    chest: 'Chest',
    hands: 'Hands',
    weapon: 'Weapon',
    offhand: 'Off-hand',
    ring: 'Ring',
    feet: 'Feet',
    armor: 'Armor',
    damage: 'Damage',
    clickToEquip: 'Click empty slot to equip',
    empty: 'Empty',
    twoHandedDisabled: 'Disabled due to two-handed main weapon',
    equippedByCompanion: 'Equipped by companion',
    equipToSlot: 'Equip {{slot}}',
    stats: 'Armor: {{armor}} • Damage: {{damage}}',
    legend: 'Click empty slot to equip • Click equipped item to unequip',
  },
  survival: {
    hunger: 'Hunger',
    thirst: 'Thirst',
    fatigue: 'Fatigue',
    rest: 'Rest',
    eat: 'Eat',
    drink: 'Drink',
    camp: 'Make Camp',
    starving: 'Starving',
    starvingDesc: 'Weakness and slowed reactions. Fighting and travel suffer until you eat.',
    hungry: 'Hungry',
    hungryDesc: 'Your body demands food. Stamina and focus start to slip.',
    dehydrated: 'Dehydrated',
    dehydratedDesc: 'Your endurance is failing. Fatigue rises faster until you drink.',
    thirsty: 'Thirsty',
    thirstyDesc: 'Your throat is dry. Stamina recovery slows down.',
    exhausted: 'Exhausted',
    exhaustedDesc: 'You are collapsing. Movement is agonizing, combat is impossible.',
    tired: 'Tired',
    tiredDesc: 'You need sleep. Skills and focus are dulled.',
    rested: 'Rested',
    restedDesc: 'You feel fresh and alert. XP gain increased by 5%.',
    wellFed: 'Well Fed',
    wellFedDesc: 'Stomach full and warm. Health regenerates slightly faster.',
    hydrated: 'Hydrated',
    hydratedDesc: 'Refreshingly cool. Stamina regenerates slightly faster.',
  },
  inventory: {
    title: 'Inventory',
    subtitle: 'Your burdens and your treasures.',
    gold: 'Gold Septims',
    weight: 'Weight',
    equip: 'Equip',
    unequip: 'Unequip',
    use: 'Use',
    drop: 'Drop',
    deleteTitle: 'Delete Item',
    deleteConfirm: 'Permanently delete {{item}} from your inventory?',
    overEncumbered: '⚠️ You are over-encumbered and cannot run!',
    empty: 'Your pockets are empty.',
    emptyCategory: 'No {{category}} in your inventory.',
    addItem: 'Add Item',
    manualAdd: 'Manual Add',
    manualAddWarning: 'Only use this if you cannot find the item you want in the shop. Remember to manually deduct the gold cost from yourself.',
    shop: 'Shop',
    blacksmith: 'Blacksmith',
    equipped: 'Equipped',
    viewInventory: 'Inventory',
    viewEquipment: 'Equipment',
    quickSelect: 'Quick Select',
    itemName: 'Item Name',
    itemType: 'Type',
    itemDesc: 'Description',
    addToInventory: 'Add to Inventory',
    showIds: 'Show IDs',
    hideIds: 'Hide IDs',
    favoritesOnly: 'Show favorites only',
    markFavorite: 'Mark Favorite',
    unmarkFavorite: 'Unmark Favorite',
    selectItem: 'Select item for {{slot}}',
    noSuitable: 'No suitable items',
  },
  category: {
    all: 'All',
    weapons: 'Weapons',
    apparel: 'Apparel',
    potions: 'Potions',
    food: 'Food',
    drink: 'Drink',
    camping: 'Camping',
    ingredients: 'Ingredients',
    keys: 'Keys',
    misc: 'Misc',
    favorites: 'Favorites',
  },
  item: {
    food: 'Food',
    drink: 'Drink',
    healthPotion: 'Health Potion',
    magickaPotion: 'Magicka Potion',
    staminaPotion: 'Stamina Potion',
  },
  sort: {

    name: 'Name (A-Z)',
    type: 'Type',
    rarity: 'Rarity',
    newest: 'Newest First',
    quantity: 'Quantity',
    damage: 'Damage / Power',
    value: 'Value (Gold)',
  },
  map: {
    title: 'Map of Skyrim',
    current: 'Current',
    level: 'Level',
    filter: {
      all: 'All',
      cities: 'Cities',
      dungeons: 'Dungeons',
      landmarks: 'Landmarks',
      unlocked: 'Unlocked',
      quests: 'Quests',
    },
    tooltips: {
      toggleEvents: 'Toggle Events',
      toggleMissions: 'Toggle Missions',
      toggleLabels: 'Toggle Labels',
      centerPlayer: 'Center on you',
      locked: 'Requires Level {{level}}',
    },
    legend: {
      city: 'City',
      town: 'Town',
      village: 'Village',
      dungeon: 'Dungeon',
      landmark: 'Landmark',
      event: 'Event',
    },
  },
  dungeon: {
    nodes: {
      start: 'Start',
      combat: 'Combat',
      elite: 'Elite',
      boss: 'Boss',
      rest: 'Rest',
      reward: 'Treasure',
      event: 'Event',
      empty: 'Empty',
    },
    actions: {
      fight: 'Fight',
      challengeElite: 'Challenge Elite',
      engageBoss: 'Engage Boss',
      rest: 'Rest Here',
      loot: 'Collect Treasure',
      investigate: 'Investigate',
      proceed: 'Proceed',
      doom: 'Doom Mode',
      exit: 'Exit',
    },
    warnings: {
      minLevel: 'You must be at least level {{level}}',
      recLevel: 'Recommended: Level {{level}}+',
    },
    stats: {
      floor: 'Floor',
      gold: 'Gold',
      xp: 'XP',
    },
    currentLocation: 'Current Location',
  },
  rest: {
    title: 'Rest',
    description: 'Choose how long to rest. Time will pass and vital stats will be partially restored.',
    method: 'Method',
    hours: 'Hours to rest',
    actions: {
      camp: 'Camp (50% restore)',
      bed: 'Bed (90% restore)',
      cancel: 'Cancel',
      confirm: 'Rest',
    },
    labels: {
      hour: 'hour',
      hours: 'hours',
      minutes: 'minutes',
    },
    location: 'Where to rest',
    locations: {
      outside: 'Outside',
      camp: 'Camp',
      inn: 'Inn',
    },
    quality: {
      well: 'Well Rested',
      wellDesc: 'A warm bed at the inn. Full rest.',
      normal: 'Rested',
      normalDesc: 'Your tent provides good shelter.',
      somewhat: 'Somewhat Rested',
      somewhatDesc: 'Bedroll offers basic comfort.',
      poor: 'Poorly Rested',
      poorDesc: 'Sleeping on the ground. Uncomfortable.',
    },
    warnings: {
      noGear: 'No gear',
    },
    visitShop: 'Visit the shop to buy supplies.',
  },
  spells: {
    title: 'Spell Tome',
    points: 'Points',
    refund: 'Refund All',
    learn: 'Learn',
    labels: {
      magicka: 'Magicka Cost',
      perkCost: 'Perk Cost',
      damage: 'Damage',
      heal: 'Healing',
      effects: 'Effects:',
      requires: 'Requires:',
      empoweredAvailable: 'Empowered variant available!',
      empoweredLocked: 'Empowered variant locked',
      learnEmpowered: 'Learn Empowered',
      needPoints: 'Need more points',
    },
    schools: {
      Destruction: 'Destruction',
      Restoration: 'Restoration',
      Conjuration: 'Conjuration',
      Alteration: 'Alteration',
      Illusion: 'Illusion',
      General: 'General',
    },
    data: {
      flames: { name: 'Flames', description: 'A small jet of fire that deals ongoing damage.' },
      ice_spike: { name: 'Ice Spike', description: 'A focused spike of ice that deals cold damage and may slow.' },
      healing: { name: 'Healing', description: 'Restore a moderate amount of health.' },
      spark: { name: 'Spark', description: 'A small shock of lightning that deals modest damage.' },
      fireball: { name: 'Fireball', description: 'A powerful explosion of fire that hits multiple targets.' },
      frost_nova: { name: 'Frost Nova', description: 'A chilling burst that damages and slows nearby enemies.' },
      lightning_bolt: { name: 'Lightning Bolt', description: 'A concentrated bolt of lightning that pierces armor.' },
      chain_lightning: { name: 'Chain Lightning', description: 'Lightning that arcs between multiple foes.' },
      summon_skeleton: { name: 'Summon Skeleton', description: 'Summons a skeletal minion to fight for you.' },
      summon_familiar: { name: 'Conjure Familiar', description: 'Summons a ghostly wolf familiar to aid you in combat.' },
      summon_flame_atronach: { name: 'Conjure Flame Atronach', description: 'Summons a Flame Atronach that attacks enemies with fire.' },
      summon_frost_atronach: { name: 'Conjure Frost Atronach', description: 'Summons a powerful Frost Atronach to tank and deal cold damage.' },
      summon_storm_atronach: { name: 'Conjure Storm Atronach', description: 'Summons a devastating Storm Atronach crackling with lightning.' },
      summon_wolf: { name: 'Call of the Wild: Wolf', description: 'Calls a wild wolf to aid you in battle.' },
      summon_bear: { name: 'Call of the Wild: Bear', description: 'Summons a fearsome cave bear to fight alongside you.' },
      summon_sabre_cat: { name: 'Call of the Wild: Sabre Cat', description: 'Summons a deadly sabre cat to hunt your enemies.' },
      summon_spriggan: { name: 'Conjure Spriggan', description: 'Summons a nature spirit that heals allies and attacks foes.' },
      summon_wrathman: { name: 'Conjure Wrathman', description: 'Summons an ancient Nord spirit warrior to battle for you.' },
      invisibility: { name: 'Invisibility', description: 'Become unseen for a short duration.' },
      slow: { name: 'Slow', description: 'Reduces target movement speed considerably.' },
      heal_major: { name: 'Heal Major', description: 'Restores a large amount of health to the caster or an ally.' },
      aeonic_pulse: { name: 'Aeonic Pulse', description: 'A focused pulse of aeonic energy — lesser AoE heal + damage.' },
      aeonic_surge: { name: 'Aeonic Surge', description: 'Unleash a pulse of aeonic energy that wounds nearby foes while restoring allies.' },
      aeonic_wave: { name: 'Aeonic Wave', description: 'A sweeping wave of aeonic energy — powerful and costly.' },
      fire_bolt: { name: 'Fire Bolt', description: 'A bolt of concentrated fire damage.' },
      frostbite: { name: 'Frostbite', description: 'A bolt of frost that slows enemies.' },
      inferno: { name: 'Inferno', description: 'A powerful fire spell that burns all nearby enemies.' },
      absolute_zero: { name: 'Absolute Zero', description: 'Extreme frost that freezes enemies, dealing heavy damage.' },
      blizzard: { name: 'Blizzard', description: 'A devastating ice storm that freezes all enemies, dealing damage over time.' },
      meteor_storm: { name: 'Meteor Storm', description: 'Rain meteors on all enemies, dealing massive AoE damage.' },
      close_wounds: { name: 'Close Wounds', description: 'Heal yourself more effectively.' },
      cure_disease: { name: 'Cure Disease', description: 'Cure all diseases and poisons affecting you.' },
      magicka_restoration: { name: 'Magicka Restoration', description: 'Restore your magicka pool.' },
      grand_healing: { name: 'Grand Healing', description: 'Restore a large amount of health to yourself.' },
      healing_circle: { name: 'Healing Circle', description: 'A circle of healing light that restores health to you and all allies.' },
      guardian_circle: { name: 'Guardian Circle', description: 'A powerful ward that heals and buffs all allies with increased armor.' },
      mass_restoration: { name: 'Mass Restoration', description: 'Restore health and magicka to all allies.' },
      soul_trap: { name: 'Soul Trap', description: 'Damage an enemy while trapping its soul.' },
      bound_weapon: { name: 'Bound Weapon', description: 'Conjure a spectral weapon to strike your foe.' },
      conjure_daedra: { name: 'Conjure Daedra', description: 'Summon a daedric servant to fight for you.' },
      summon_dremora_lord: { name: 'Summon Dremora Lord', description: 'Summon a powerful Dremora Lord to dominate the battlefield.' },
      oakflesh: { name: 'Oakflesh', description: 'Harden your skin, increasing armor.' },
      stoneskin: { name: 'Stoneskin', description: 'Turn your skin to stone, increasing armor significantly.' },
      iron_skin: { name: 'Iron Skin', description: 'Become nearly invulnerable for a short time.' },
      paralyze: { name: 'Paralyze', description: 'Paralyze an enemy, preventing them from acting.' },
      telekinesis: { name: 'Telekinesis', description: 'Hurl objects at enemies with telekinetic force.' },
      candlelight: { name: 'Candlelight', description: 'Create magical light around you.' },
      muffle: { name: 'Muffle', description: 'Silence your footsteps.' },
      fear: { name: 'Fear', description: 'Fill an enemy with terror, reducing their damage.' },
      mayhem: { name: 'Mayhem', description: 'Make all enemies attack each other.' },
      mass_paralysis: { name: 'Mass Paralysis', description: 'Paralyze all enemies in a wide area.' },
    }
  },
  items: {
    enchantedItemFormat: '{{item}} {{enchantment}}',
    data: {
      petty_soul_gem: 'Petty Soul Gem (Empty)',
      lesser_soul_gem: 'Lesser Soul Gem (Empty)',
      garnet: 'Garnet',
      amethyst: 'Amethyst',
      common_soul_gem: 'Common Soul Gem (Empty)',
      ruby: 'Ruby',
      sapphire: 'Sapphire',
      emerald: 'Emerald',
      greater_soul_gem: 'Greater Soul Gem (Empty)',
      diamond: 'Diamond',
      flawless_ruby: 'Flawless Ruby',
      flawless_sapphire: 'Flawless Sapphire',
      grand_soul_gem: 'Grand Soul Gem (Empty)',
      flawless_diamond: 'Flawless Diamond',
      black_soul_gem: 'Black Soul Gem',
      iron_dagger: 'Iron Dagger',
      iron_sword: 'Iron Sword',
      hunting_bow: 'Hunting Bow',
      iron_war_axe: 'Iron War Axe',
      steel_dagger: 'Steel Dagger',
      steel_sword: 'Steel Sword',
      steel_greatsword: 'Steel Greatsword',
      elven_dagger: 'Elven Dagger',
      dwarven_bow: 'Dwarven Bow',
      elven_sword: 'Elven Sword',
      orcish_war_axe: 'Orcish War Axe',
      glass_dagger: 'Glass Dagger',
      ebony_mace: 'Ebony Mace',
      glass_sword: 'Glass Sword',
      ebony_bow: 'Ebony Bow',
      ebony_war_axe: 'Ebony War Axe',
      daedric_sword: 'Daedric Sword',
      daedric_war_axe: 'Daedric War Axe',
      dragonbone_bow: 'Dragonbone Bow',
      daedric_greatsword: 'Daedric Greatsword',
      // Missing Shop & Unique Weapons
      iron_mace: 'Iron Mace',
      iron_battleaxe: 'Iron Battleaxe',
      iron_warhammer: 'Iron Warhammer',
      novice_staff: 'Novice Staff',
      basic_staff_sparks: 'Basic Staff of Sparks',
      basic_staff_flames: 'Basic Staff of Flames',
      basic_staff_frost: 'Basic Staff of Frostbite',
      apprentice_staff: 'Apprentice Staff',
      steel_war_axe: 'Steel War Axe',
      steel_mace: 'Steel Mace',
      steel_battleaxe: 'Steel Battleaxe',
      steel_warhammer: 'Steel Warhammer',
      long_bow: 'Long Bow',
      fire_arrows: 'Fire Arrows',
      ice_arrows: 'Ice Arrows',
      shock_arrows: 'Shock Arrows',
      paralyze_arrows: 'Paralyze Arrows',
      allycall_arrows: 'Command Arrows',
      travelers_shortsword: 'Traveler\'s Shortsword',
      honed_steel_longsword: 'Honed Steel Longsword',
      frosted_dagger: 'Frosted Dagger',
      emberbrand_staff: 'Emberbrand Staff',
      stormcall_bow: 'Stormcall Bow',
      orcish_dagger: 'Orcish Dagger',
      orcish_sword: 'Orcish Sword',
      orcish_mace: 'Orcish Mace',
      orcish_greatsword: 'Orcish Greatsword',
      orcish_battleaxe: 'Orcish Battleaxe',
      orcish_warhammer: 'Orcish Warhammer',
      orcish_bow: 'Orcish Bow',
      dwarven_dagger: 'Dwarven Dagger',
      dwarven_sword: 'Dwarven Sword',
      dwarven_war_axe: 'Dwarven War Axe',
      dwarven_mace: 'Dwarven Mace',
      dwarven_greatsword: 'Dwarven Greatsword',
      dwarven_battleaxe: 'Dwarven Battleaxe',
      dwarven_warhammer: 'Dwarven Warhammer',
      elven_war_axe: 'Elven War Axe',
      elven_mace: 'Elven Mace',
      elven_greatsword: 'Elven Greatsword',
      elven_battleaxe: 'Elven Battleaxe',
      elven_warhammer: 'Elven Warhammer',
      elven_bow: 'Elven Bow',
      glass_war_axe: 'Glass War Axe',
      glass_mace: 'Glass Mace',
      glass_greatsword: 'Glass Greatsword',
      glass_battleaxe: 'Glass Battleaxe',
      glass_warhammer: 'Glass Warhammer',
      glass_bow: 'Glass Bow',
      ebony_dagger: 'Ebony Dagger',
      ebony_sword: 'Ebony Sword',
      ebony_greatsword: 'Ebony Greatsword',
      ebony_battleaxe: 'Ebony Battleaxe',
      ebony_warhammer: 'Ebony Warhammer',
      daedric_dagger: 'Daedric Dagger',
      daedric_mace: 'Daedric Mace',
      daedric_battleaxe: 'Daedric Battleaxe',
      daedric_warhammer: 'Daedric Warhammer',
      daedric_bow: 'Daedric Bow',
      staff_flames: 'Staff of Flames',
      staff_frost: 'Staff of Frost',
      staff_lightning: 'Staff of Lightning',
      elven_dagger_of_flame: 'Elven Dagger of Flames',
      steel_sword_of_frost: 'Steel Sword of Frost',
      glass_bow_of_lightning: 'Glass Bow of Lightning',
      dwarven_dagger_of_shock: 'Dwarven Dagger of Shock',
      orcish_mace_of_bleeding: 'Orcish Mace of Bleeding',
      enchanted_bow: 'Enchanted Hunting Bow',
      silver_sword: 'Silver Sword',
      silver_greatsword: 'Silver Greatsword',
      crossbow: 'Crossbow',
      steel_bolts: 'Steel Bolts',
      hide_helmet: 'Hide Helmet',
      leather_boots: 'Leather Boots',
      iron_helmet: 'Iron Helmet',
      leather_armor: 'Leather Armor',
      steel_armor: 'Steel Armor',
      scaled_helmet: 'Scaled Helmet',
      elven_boots: 'Elven Boots',
      elven_armor: 'Elven Armor',
      glass_helmet: 'Glass Helmet',
      orcish_armor: 'Orcish Armor',
      glass_armor: 'Glass Armor',
      ebony_boots: 'Ebony Boots',
      ebony_shield: 'Ebony Shield',
      daedric_armor: 'Daedric Armor',
      dragonplate_helmet: 'Dragonplate Helmet',
      daedric_shield: 'Daedric Shield',
      // Missing Shop & Unique Armor
      hide_armor: 'Hide Armor',
      hide_boots: 'Hide Boots',
      hide_gauntlets: 'Hide Gauntlets',
      leather_helmet: 'Leather Helmet',
      leather_gloves: 'Leather Gloves',
      iron_boots: 'Iron Boots',
      iron_gauntlets: 'Iron Gauntlets',
      iron_shield: 'Iron Shield',
      steel_boots: 'Steel Boots',
      steel_helmet: 'Steel Helmet',
      steel_gauntlets: 'Steel Gauntlets',
      steel_shield: 'Steel Shield',
      steel_plate_armor: 'Steel Plate Armor',
      elven_light_armor: 'Elven Light Armor',
      elven_helmet: 'Elven Helmet',
      elven_gauntlets: 'Elven Gauntlets',
      elven_shield: 'Elven Shield',
      scaled_armor: 'Scaled Armor',
      scaled_boots: 'Scaled Boots',
      scaled_gauntlets: 'Scaled Gauntlets',
      orcish_boots: 'Orcish Boots',
      orcish_helmet: 'Orcish Helmet',
      orcish_gauntlets: 'Orcish Gauntlets',
      orcish_shield: 'Orcish Shield',
      dwarven_armor: 'Dwarven Armor',
      dwarven_boots: 'Dwarven Boots',
      dwarven_helmet: 'Dwarven Helmet',
      dwarven_gauntlets: 'Dwarven Gauntlets',
      dwarven_shield: 'Dwarven Shield',
      elven_gilded_armor: 'Elven Gilded Armor',
      elven_gilded_boots: 'Elven Gilded Boots',
      elven_gilded_helmet: 'Elven Gilded Helmet',
      elven_gilded_gauntlets: 'Elven Gilded Gauntlets',
      glass_boots: 'Glass Boots',
      glass_gauntlets: 'Glass Gauntlets',
      glass_shield: 'Glass Shield',
      dragonscale_armor: 'Dragonscale Armor',
      dragonscale_boots: 'Dragonscale Boots',
      dragonscale_helmet: 'Dragonscale Helmet',
      dragonscale_gauntlets: 'Dragonscale Gauntlets',
      dragonscale_shield: 'Dragonscale Shield',
      ebony_armor: 'Ebony Armor',
      ebony_helmet: 'Ebony Helmet',
      ebony_gauntlets: 'Ebony Gauntlets',
      dragonplate_armor: 'Dragonplate Armor',
      dragonplate_boots: 'Dragonplate Boots',
      dragonplate_gauntlets: 'Dragonplate Gauntlets',
      dragonplate_shield: 'Dragonplate Shield',
      daedric_boots: 'Daedric Boots',
      daedric_helmet: 'Daedric Helmet',
      daedric_gauntlets: 'Daedric Gauntlets',
      // Jewelry
      silver_ring: 'Silver Ring',
      gold_necklace: 'Gold Necklace',
      gold_circlet: 'Gold Circlet',
      // Promo/Legendary
      legendary_sword_of_ages: 'Sword of Ages (Legendary)',
      legendary_aeon_greatsword: 'Aeon Greatsword (Legendary)',
      legendary_bow_of_apocalypse: 'Bow of the Apocalypse (Legendary)',
      legendary_void_dagger: 'Void Dagger (Legendary)',
      legendary_plate_of_titans: 'Plate of Titans (Legendary)',
      legendary_helm_of_eternity: 'Helm of Eternity (Legendary)',
      legendary_shield_of_sol: 'Shield of Sol (Legendary)',
      legendary_epic_legion_armor: 'Epic Legion Armor (Legendary)',
      epic_sword_of_ages: 'Sword of Ages (Epic)',
      epic_aeon_greatsword: 'Aeon Greatsword (Epic)',
      epic_bow_of_apocalypse: 'Bow of the Apocalypse (Epic)',
      epic_void_dagger: 'Void Dagger (Epic)',
      epic_plate_of_titans: 'Plate of Titans (Epic)',
      epic_helm_of_eternity: 'Helm of Eternity (Epic)',
      epic_shield_of_sol: 'Shield of Sol (Epic)',
      epic_legion_armor: 'Epic Legion Armor (Epic)',
      minor_health: 'Minor Health Potion',
      minor_stamina: 'Minor Stamina Potion',
      health_potion: 'Health Potion',
      magicka_potion: 'Magicka Potion',
      plentiful_magicka: 'Plentiful Magicka Potion',
      healing_potion: 'Potion of Healing',
      plentiful_health: 'Plentiful Health Potion',
      plentiful_stamina: 'Plentiful Stamina Potion',
      fortify_smithing: 'Potion of Fortify Smithing',
      ultimate_health: 'Ultimate Health Potion',
      warrior_potion: 'Potion of the Warrior',
      regeneration_elixir: 'Elixir of Regeneration',
      tome_flames: 'Spell Tome: Flames',
      tome_healing: 'Spell Tome: Healing',
      tome_firebolt: 'Spell Tome: Firebolt',
      tome_fast_healing: 'Spell Tome: Fast Healing',
      tome_fireball: 'Spell Tome: Fireball',
      tome_chain_lightning: 'Spell Tome: Chain Lightning',
      tome_incinerate: 'Spell Tome: Incinerate',
      tome_blizzard: 'Spell Tome: Blizzard',
      tome_fire_storm: 'Spell Tome: Fire Storm',
      silver_necklace: 'Silver Necklace',
      gold_ring: 'Gold Ring',
      silver_candlestick: 'Silver Candlestick',
      gold_ingot: 'Gold Ingot',
      silver_ingot: 'Silver Ingot',
      jeweled_amulet: 'Jeweled Amulet',
      ornate_goblet: 'Ornate Goblet',
      dwemer_gyro: 'Dwemer Gyro',
      gold: 'Gold',
    },
    enchantment: {
      minor_flames: 'of Minor Flames',
      frost: 'of Frost',
      shock: 'of Shock',
      dread: 'of Dread',
      fiery_souls: 'of Fiery Souls',
      absorbing: 'of Absorbing',
      chaos: 'of Chaos',
      vampire: 'of the Vampire',
    }
  },
  perks: {
    title: 'Perk Tree',
    points: 'Points',
    spent: 'spent',
    expandAll: 'Expand All',
    collapseAll: 'Collapse All',
    refund: 'Refund All',
    staged: 'staged',
    cancel: 'Cancel',
    leave: 'Leave',
    confirm: 'Confirm',
    stage: 'Stage',
    undo: 'Undo',
    master: 'Master',
    cancelMaster: 'Cancel Master',
    force: 'Force',
    refundDesc: 'This will reset all {{count}} unlocked perks and refund {{points}} perk points.',
    reallocateDesc: 'You can re-allocate perks later by spending perk points again.',
    requires: 'Requires:',
    rank: 'Rank',
    masterCost: 'Master Cost',
    perRank: 'Per rank:',
    current: 'Current:',
    selectPrompt: 'Select a perk to view details',
    categories: {
      attributes: 'Attributes',
      combat: 'Combat',
      armor: 'Armor',
      magic: 'Magic',
      stealth: 'Stealth',
    },
    data: {
      toughness: { name: 'Toughness', description: 'Increase max health by 10 per rank.' },
      vitality: { name: 'Vitality', description: 'Increase max health by 20 per rank.' },
      arcane_focus: { name: 'Arcane Focus', description: 'Increase max magicka by 10 per rank.' },
      mana_mastery: { name: 'Mana Mastery', description: 'Increase max magicka by 20 per rank.' },
      endurance: { name: 'Endurance', description: 'Increase max stamina by 10 per rank.' },
      fleet_foot: { name: 'Fleet Foot', description: 'Increase max stamina by 15 per rank.' },
      reroll_on_failure: { name: 'Lucky Strike', description: 'When an attack critically fails, automatically reroll the attack once (passive).' },
      health_regen: { name: 'Health Regeneration', description: 'Passively regenerate health during combat. Each rank increases regen rate by 25%. Requires level 10.' },
      magicka_regen: { name: 'Magicka Regeneration', description: 'Passively regenerate magicka during combat. Each rank increases regen rate by 25%. Requires level 10.' },
      stamina_regen: { name: 'Stamina Regeneration', description: 'Passively regenerate stamina during combat. Each rank increases regen rate by 25%. Requires level 10.' },
      armsman: { name: 'Armsman', description: 'Increases one-handed weapon damage by 10% per rank.' },
      fighting_stance: { name: 'Fighting Stance', description: 'Power attacks with one-handed weapons cost 15% less stamina per rank.' },
      dual_flurry: { name: 'Dual Flurry', description: 'When dual wielding, gain +8% attack speed per rank.' },
      dual_savagery: { name: 'Dual Savagery', description: 'Dual wielding power attacks deal 25% bonus damage per rank.' },
      bladesman: { name: 'Bladesman', description: 'Critical hits with swords deal 15% more damage per rank.' },
      riposte_mastery: { name: 'Riposte Mastery', description: 'Unlocks the Riposte ability (quick counter attack). Requires One-Handed skill 25+.' },
      slash_mastery: { name: 'Slash Mastery', description: 'Unlocks the Slash ability (wide AoE slash). Requires One-Handed skill 40+.' },
      mortal_strike_mastery: { name: 'Mortal Strike Mastery', description: 'Unlocks Mortal Strike (high damage, damage-reducing debuff). Requires One-Handed skill 60+.' },
      bone_breaker: { name: 'Bone Breaker', description: 'Maces ignore 15% of armor per rank.' },
      hack_and_slash: { name: 'Hack and Slash', description: 'Axes have 10% chance per rank to cause bleeding (5 damage/turn for 3 turns).' },
      unarmed_mastery: { name: 'Unarmed Mastery', description: 'Unlocks the Unarmed Strike ability and increases unarmed damage by 8% per rank.' },
      barbarian: { name: 'Barbarian', description: 'Increases two-handed weapon damage by 12% per rank.' },
      champions_stance: { name: "Champion's Stance", description: 'Power attacks with two-handed weapons cost 15% less stamina per rank.' },
      deep_wounds: { name: 'Deep Wounds', description: 'Critical hits with greatswords deal 20% more damage per rank.' },
      skull_crusher: { name: 'Skull Crusher', description: 'Warhammers ignore 20% of armor per rank.' },
      limbsplitter: { name: 'Limbsplitter', description: 'Battleaxes have 15% chance per rank to cause bleeding (7 damage/turn for 3 turns).' },
      devastating_blow: { name: 'Devastating Blow', description: 'Standing power attacks have 15% chance per rank to decapitate (instant kill on low health enemies).' },
      shield_wall: { name: 'Shield Wall', description: 'Blocking is 10% more effective per rank.' },
      deflect_arrows: { name: 'Deflect Arrows', description: 'Arrows that hit your shield do no damage.' },
      elemental_protection: { name: 'Elemental Protection', description: 'Blocking with a shield reduces incoming fire, frost, and shock damage by 25% per rank.' },
      power_bash: { name: 'Power Bash', description: 'Shield bash can be held to deliver a more powerful strike with 20% stun chance per rank.' },
      deadly_bash: { name: 'Deadly Bash', description: 'Shield bashing does 5x more damage per rank.' },
      disarming_bash: { name: 'Disarming Bash', description: 'Shield bash has 15% chance per rank to disarm opponents.' },
      tactical_guard_mastery: { name: 'Tactical Guard Mastery', description: 'Increases the duration of Tactical Guard by +1 round per rank (max +2), allowing Guard to last up to 3 rounds.' },
      whirlwind_mastery: { name: 'Whirlwind Mastery', description: 'Unlocks Whirlwind Attack (AoE physical) even without the high Two/One-Handed skill thresholds.' },
      cleaving_mastery: { name: 'Cleaving Mastery', description: 'Unlocks Cleaving Strike (AoE two-handed cleave) even without the high Two-Handed skill threshold.' },
      overdraw: { name: 'Overdraw', description: 'Increases bow damage by 12% per rank.' },
      eagle_eye: { name: 'Eagle Eye', description: 'Increases critical hit chance with bows by 5% per rank.' },
      steady_hand: { name: 'Steady Hand', description: 'Reduces stamina cost for bows by 15% per rank.' },
      power_shot: { name: 'Power Shot', description: 'Arrows have 25% chance per rank to stagger enemies.' },
      quick_shot: { name: 'Quick Shot', description: 'Can draw bow 15% faster per rank.' },
      hunters_discipline: { name: "Hunter's Discipline", description: '50% chance per rank to recover arrows from dead bodies.' },
      agile_defender: { name: 'Agile Defender', description: 'Increases light armor rating by 10% per rank.' },
      custom_fit: { name: 'Custom Fit', description: 'Wearing a matched set of light armor grants +10% armor bonus per rank.' },
      unhindered: { name: 'Unhindered', description: 'Light armor weighs nothing and doesn\'t slow you down.' },
      wind_walker: { name: 'Wind Walker', description: 'Stamina regenerates 25% faster per rank while wearing light armor.' },
      deft_movement: { name: 'Deft Movement', description: '10% chance per rank to dodge melee attacks while wearing light armor.' },
      juggernaut: { name: 'Juggernaut', description: 'Increases heavy armor rating by 12% per rank.' },
      well_fitted: { name: 'Well Fitted', description: 'Wearing a matched set of heavy armor grants +15% armor bonus per rank.' },
      tower_of_strength: { name: 'Tower of Strength', description: '25% less stagger per rank when wearing heavy armor.' },
      conditioning: { name: 'Conditioning', description: 'Heavy armor weighs nothing and doesn\'t slow you down.' },
      reflect_blows: { name: 'Reflect Blows', description: '10% chance per rank to reflect melee damage back to attacker.' },
      destruction_novice: { name: 'Novice Destruction', description: 'Novice-level destruction spells cost 25% less magicka per rank.' },
      augmented_flames: { name: 'Augmented Flames', description: 'Fire spells deal 15% more damage per rank.' },
      augmented_frost: { name: 'Augmented Frost', description: 'Frost spells deal 15% more damage per rank.' },
      augmented_shock: { name: 'Augmented Shock', description: 'Shock spells deal 15% more damage per rank.' },
      intense_flames: { name: 'Intense Flames', description: 'Fire spells have 15% chance per rank to cause fear in targets below 20% health.' },
      deep_freeze: { name: 'Deep Freeze', description: 'Frost spells have 15% chance per rank to paralyze targets below 20% health.' },
      disintegrate: { name: 'Disintegrate', description: 'Shock spells have 15% chance per rank to instantly kill targets below 15% health.' },
      restoration_novice: { name: 'Novice Restoration', description: 'Novice-level restoration spells cost 25% less magicka per rank.' },
      regeneration: { name: 'Regeneration', description: 'Healing spells are 25% more effective per rank.' },
      recovery: { name: 'Recovery', description: 'Magicka regenerates 15% faster per rank.' },
      avoid_death: { name: 'Avoid Death', description: 'Once per combat, when health drops below 10%, automatically heal 50 health per rank.' },
      conjuration_novice: { name: 'Novice Conjuration', description: 'Novice-level conjuration spells cost 25% less magicka per rank.' },
      summoner: { name: 'Summoner', description: 'Summoned creatures have 15% more health per rank.' },
      atromancy: { name: 'Atromancy', description: 'Summoned Atronachs last 25% longer per rank.' },
      twin_souls: { name: 'Twin Souls', description: 'Can summon an additional creature per rank (up to 3 total when fully ranked).' },
      pact_warrior: { name: 'Pact Warrior', description: 'Summoned creatures deal 20% more damage per rank.' },
      spell_shield: { name: 'Spell Shield', description: 'Summoned creatures grant you 15% damage reduction per rank.' },
      stealth: { name: 'Stealth', description: 'You are 15% harder to detect per rank.' },
      backstab: { name: 'Backstab', description: 'Sneak attacks with one-handed weapons deal 3x damage (per rank: +1x).' },
      deadly_aim: { name: 'Deadly Aim', description: 'Sneak attacks with bows deal 2x damage (per rank: +1x).' },
      assassins_blade: { name: "Assassin's Blade", description: 'Sneak attacks with daggers deal 15x damage.' },
      shadow_warrior: { name: 'Shadow Warrior', description: '15% chance per rank to enter stealth mid-combat when crouching.' },
      phantom_strike: { name: 'Phantom Strike', description: 'Sneak attacks ignore 25% of target armor per rank.' },
      poison_mastery: { name: 'Poison Mastery', description: 'Poisons applied to sneak attacks are 30% more potent per rank.' },
      berserker_rage: { name: 'Berserker Rage', description: 'When below 25% health, deal 20% more damage per rank.' },
      vampiric_strikes: { name: 'Vampiric Strikes', description: 'Melee attacks restore 3% of damage dealt as health per rank.' },
      executioner: { name: 'Executioner', description: 'Attacks against enemies below 20% health deal 25% more damage per rank.' },
      dragon_skin: { name: 'Dragon Skin', description: 'Take 5% less damage from all sources per rank.' },
      ricochet: { name: 'Ricochet', description: 'Arrows have 15% chance per rank to ricochet and hit another enemy.' },
      piercing_shot: { name: 'Piercing Shot', description: 'Arrow attacks ignore 20% of enemy armor per rank.' },
      alteration_novice: { name: 'Novice Alteration', description: 'Novice-level alteration spells cost 25% less magicka per rank.' },
      stoneskin: { name: 'Stoneskin', description: 'Increase armor by 30 per rank when cast.' },
      blur: { name: 'Blur', description: 'Decrease enemy accuracy by 10% per rank when cast.' },
      paralysis_mastery: { name: 'Paralysis Mastery', description: 'Paralysis effects have 15% higher chance per rank to trigger.' },
      illusion_novice: { name: 'Novice Illusion', description: 'Novice-level illusion spells cost 25% less magicka per rank.' },
      confidence: { name: 'Confidence', description: 'Fear effects cause 20% more damage to affected enemies per rank.' },
      Fury: { name: 'Fury', description: 'Chaotic spells make enemies attack each other 30% more often per rank.' },
      invisibility_mastery: { name: 'Invisibility Mastery', description: 'Invisibility lasts 25% longer per rank.' },
      spell_absorption: { name: 'Spell Absorption', description: 'Absorb 10% of spell damage taken as magicka per rank.' },
      inferno: { name: 'Inferno', description: 'Fire spells spread to nearby enemies, dealing 40% damage per rank.' },
      absolute_zero: { name: 'Absolute Zero', description: 'Frost spells freeze enemies solid, disabling them for 2 turns per rank.' },
      overcharge: { name: 'Overcharge', description: 'Shock spells restore 15% of magicka spent per rank when they hit.' },
    }
  },
};

// Turkish translations
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
    show: 'Göster',
    hide: 'Gizle',
  },
  nav: {
    adventure: 'Macera',
    hero: 'Kahraman',
    equipment: 'Envanter',
    quests: 'Görevler',
    journal: 'Günlük',
    story: 'Hikaye',
    map: 'Harita',
    gameMenu: 'Oyun Menüsü',
  },
  auth: {
    welcomeTitle: 'SKYRIM',
    welcomeSubtitle: 'Aetherius\'a Hoş Geldiniz',
    login: 'Giriş Yap',
    register: 'Kayıt Ol',
    email: 'E-posta',
    password: 'Şifre',
    username: 'Kullanıcı Adı',
    forgotPassword: 'Şifremi Unuttum',
    noAccount: 'Hesabınız yok mu?',
    hasAccount: 'Zaten hesabınız var mı?',
    guestParam: 'Misafir',
    guestLogin: 'Misafir Olarak Devam Et',
    logout: 'Çıkış Yap',
    offlineMode: 'Çevrimdışı Mod',
    googleLogin: 'Google ile Giriş Yap',
  },
  sidebar: {
    crafting: 'Zanaat',
    magic: 'Büyü ve Güçler',
    world: 'Dünya',
    social: 'Sosyal',
    aiTools: 'Yapay Zeka',
    progress: 'İlerleme',
    alchemy: 'Simya',
    cooking: 'Aşçılık',
    enchanting: 'Efsunlama',
    shouts: 'Naralar',
    standingStones: 'Kader Taşları',
    transformations: 'Dönüşümler',
    travel: 'Seyahat',
    factions: 'Birlikler',
    bounty: 'Aranma',
    training: 'Eğitim',
    housing: 'Konut',
    companions: 'Yoldaşlar',
    gameMaster: 'Oyun Yöneticisi',
    bugReports: 'Hata Bildir',
    achievements: 'Başarımlar',
  },
  shop: {
    title: 'Genel Ürünler',
    buy: 'Satın Al',
    sell: 'Sat',
    searchShop: 'Mağazada ara...',
    searchInventory: 'Envanterde ara...',
    noItems: 'Eşya bulunamadı.',
    noItemsSell: 'Satılacak eşya yok.',
    noMatchingInventory: 'Envanterinizde eşleşen eşya yok.',
    notBuying: 'Bu tüccar şu anda eşya almıyor.',
    sort: 'Sırala',
    itemsAvailable: 'eşya mevcut',
    category: 'Kategori',
    sellOne: '1 tane Sat',
    sellAll: 'Hepsini Sat',
    bought: 'Satın Alındı!',
    needGold: 'Gereken',
  },
  companions: {
    title: 'Yoldaşlar',
    recruit: 'İşe Al',
    dismiss: 'Gönder',
    fire: 'Yolları Ayır',
    wait: 'Burada Bekle',
    follow: 'Beni Takip Et',
    trade: 'Eşya Takas Et',
    combat: 'Savaş',
    stats: 'İstatistikler',
    behaviors: {
      aggressive: 'Saldırgan',
      passive: 'Pasif',
      defensive: 'Defansif',
      ranged: 'Menzilli',
    },
    races: {
      Nord: 'Nord',
      Imperial: 'İmparatorluklu',
      Breton: 'Breton',
      Redguard: 'Kızılmuhafız',
      Altmer: 'Yüce Elf',
      Bosmer: 'Orman Elfi',
      Dunmer: 'Kara Elf',
      Orc: 'Oruk',
      Khajiit: 'Kajiit',
      Argonian: 'Argonyalı',
    },
    animals: {
      dog: 'Köpek',
      husky: 'Haski',
      wolf: 'Kurt',
      bear: 'Ayı',
      saber: 'Kılıç Diş',
      spider: 'Örümcek',
      troll: 'Trol',
    },
    animalCompanion: 'Hayvan Yoldaş',
    humanCompanion: 'İnsan Takipçi',
  },
  actions: {
    label: 'İşlemler',
    save: 'Kaydet',
    switch: 'Değiştir',
    exit: 'Çıkış',
    exitGuest: 'Çıkış (Misafir)',
    createImage: 'Görüntü İstemi Oluştur',
    uploadPhoto: 'Fotoğraf Yükle',
    export: 'Tam Kaydı Dışa Aktar',
    exportJson: 'JSON Dışa Aktar',
    import: 'İçe Aktar',
    generateProfile: 'Profil Resmi Oluştur',
    generating: 'Oluşturuluyor...',
    version: 'Sürüm',
    madeBy: 'Geliştirici:',
  },
  status: {
    offline: 'Çevrimdışısınız.',
    online: 'Tekrar çevrimiçi! Senkronize ediliyor...',
    offlineDesc: 'Değişiklikler yerel olarak kaydedilecek ve bağlantı kurulduğunda senkronize edilecek.',
    pending: 'beklemede',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi',
    saveFailed: 'Kaydetme başarısız',
    savedLocally: 'Yerel olarak kaydedildi',
    encumbered: 'Aşırı Yüklü!',
    encumberedWarning: 'Koşmak için çok fazla yük taşıyorsunuz.',
  },
  xp: {
    experience: 'Tecrübe',
    total: 'Toplam',
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
    levelUpAvailable: 'Seviye atlanabilir',
    levelReq: '{{level}} için {{xp}} XP gerekiyor',
    maxStats: 'Maksimum İstatistikler (Karakter Yaratma)',
    combatStats: 'Savaş İstatistikleri (Ekipmandan)',
    armorRating: 'Zırh Değeri (AR)',
    weaponDamage: 'Silah Hasarı',
    equipped: 'Kuşanılanlar',
    inGameTime: 'Oyun Saati',
    needsStatus: 'Açlık / Susuzluk / Yorgunluk (0 = iyi, 100 = kötü)',
    gender: 'Cinsiyet',
    coreIdentity: 'Temel Kimlik',
    psychology: 'Psikoloji',
    moralCode: 'Ahlaki Kod',
    breakingPoint: 'Kırılma Noktası',
    talents: 'Yetenekler',
    magicApproach: 'Büyüye Yaklaşım',
    fears: 'Korkular',
    weaknesses: 'Zayıflıklar',
    roleplayBehavior: 'Rol Yapma Davranışı',
    forcedBehavior: 'Zorunlu Davranış',
    longTermEvolution: 'Uzun Vadeli Gelişim',
    evolutionMilestones: 'Gelişim Aşamaları',
    skillProficiency: 'Yetenek Ustalığı',
    activePerks: 'Aktif Özellikler',
    perkName: 'Özellik Adı',
    perkRank: 'Kademe',
    perkDesc: 'Açıklama',
    addPerk: 'Özellik Ekle',
    allowedActions: 'İzin Verilenler',
    forbiddenActions: 'Yasaklananlar',
    factionAllegiance: 'Birlik Sadakati',
    generalWorldview: 'Dünya Görüşü',
    daedricPerception: 'Daedrik Algı',
    backstory: 'Arka Plan Hikayesi',
    fullHistory: 'Tam Hikaye',
    noPerks: 'Henüz öğrenilen özellik yok.',
    noMilestones: 'Aşama belirlenmedi.',
    savedToCloud: 'Buluta kaydedildi',
    maxHealth: 'Maks Can',
    maxMagicka: 'Maks Büyü',
    maxStamina: 'Maks Dayanıklılık',
    sortName: 'İsme Göre Sırala',
    groupSkill: 'Yeteneğe Göre Grupla',
    sections: {
      identity: 'Kimlik ve Psikoloji',
      talents: 'Yetenekler ve Beceriler',
      fears: 'Korkular ve Zayıflıklar',
      evolution: 'Gelişim ve Rol Yapma',
      skills: 'Yetenekler ve Özellikler',
      rules: 'Kurallar ve Kısıtlamalar',
      faction: 'Birlik ve Dünya Görüşü',
      backstory: 'Arka Plan Hikayesi',
    },
  },
  adventure: {
    welcome: 'Maceraya başlamak için bir karakter seçin.',
    title: 'Macera',
    modelTip: 'İpucu: En iyi macera deneyimi için Gemma 2 27B kullanın.',
    warnings: 'Uyarılar:',
    quests: 'Görevler',
    new: 'Yeni',
    clear: 'Temizle',
    state: 'Durum',
    equip: 'Ekipman',
    simulation: {
      title: 'Simülasyon Durumu',
      noData: 'Simülasyon verisi yok.',
      currentScene: 'Mevcut Sahne',
      phase: 'Evre',
      attempts: 'Denemeler',
      resolved: 'Çözüldü',
      presentNPCs: 'Mevcut NPC\'ler',
      establishedFacts: 'Bilinen Gerçekler',
      knownBy: 'bilen',
      pending: 'bekleyen sonuç(lar)',
      noActive: 'Aktif simülasyon durumu yok. Takip etmek için bir macera başlatın.',
    },
    equipment: {
      title: 'Ekipman',
      close: 'Kapat',
      inventory: 'Envanter',
      unequip: 'Çıkar',
      equip: 'Kuşan',
      slot: 'Yuva...',
      selectFor: 'Şunun için eşya seç:',
      noItems: 'Bu yuva için uygun eşya yok',
      cancel: 'İptal',
      twoHandedDisabled: 'Çift elli silah nedeniyle devre dışı',
      equippedByCompanion: 'Yoldaş tarafından kuşanıldı',
      equipToSlot: '{{slot}} Kuşan',
      stats: 'Zırh: {{armor}} • Hasar: {{damage}}',
      legend: 'Kuşanmak için boş yuvaya, çıkarmak için eşyaya tıklayın',
    },
    settings: {
      title: 'Sohbet Ayarları',
      autoApply: 'Oyun değişikliklerini otomatik uygula (eşya, görev, altın)',
      showRateLimit: 'Hız sınırı çubuğunu göster',
      textSettings: 'Metin Ayarları',
      voiceSettings: 'Ses Ayarları',
      voiceOn: 'Ses Açık',
      voiceOff: 'Ses Kapalı',
      resetAll: 'Tüm Ayarları Sıfırla',
      reset: 'Varsayılana Sıfırla',
      voiceGender: 'Ses Cinsiyeti',
      voiceStyle: 'Ses Tarzı',
      pitch: 'Perde',
      speed: 'Hız',
      lower: 'Daha Düşük',
      higher: 'Daha Yüksek',
      slower: 'Daha Yavaş',
      faster: 'Daha Hızlı',
      voiceNote: 'Not: Ses değişiklikleri bir sonraki mesajda geçerli olur. Özel sesler günlük kotanızdan düşer.',
      testVoice: 'Sesi Test Et',
      testNPC: 'NPC Test',
      playSample: 'Örnek Çal',
      preview: 'Önizleme',
      previewText: 'Kadim harabelere yaklaşırken rüzgar dağ geçidinde uğulduyor...',
    },
    empty: {
      continue: 'Kaldığınız yerden devam edin...',
      start: 'Maceranız sizi bekliyor...',
      continueBtn: 'Maceraya Devam Et',
      startBtn: 'Yolculuğa Başla',
    },
    actions: {
      listen: 'Dinle',
      youWillSay: 'Şunu söyleyeceksiniz:',
    },
    updates: {
      questStarted: 'görev başladı',
      minPassed: 'dk geçti',
      apply: 'Değişiklikleri Uygula',
    },
    inputPlaceholder: 'Ne yapacaksın? (Göndermek için Enter)',
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
  app: {
    title: 'SkyAetherius',
  },
  combat: {
    title: 'SAVAŞ',
    round: 'Tur {{round}}',
    time: 'Süre {{min}}:{{sec}}',
    playerTurn: '🎯 Sıra Sende',
    enemyTurn: '⏳ Düşman Sırası',
    speed: 'Hız',
    auto: 'Oto {{state}}',
    loot: 'Yağma',
    showLoot: 'Zaferde yağmayı göster',
    showLootNow: 'Şimdi Yağmala',
    close: 'Kapat',
    stunned: '⚡ Sersemledi ({{turns}})',
    shielded: '🛡️ Kalkanlı ({{turns}})',
    defending: '🛡️ Savunuyor',
    summons: '⚔️ Çağrılanlar: {{names}}',
    decaying: '⚡ Yok Oluyor: {{names}}',
    actions: 'EYLEMLER',
    actions_mobile: 'Eylemler',
    mainAction: 'Ana Eylem',
    bonusAction: 'Bonus Eylem',
    used: '(Kullanıldı)',
    available: '(Mevcut)',
    skipTurn: 'Turu Geç',
    recommended: '(Önerilen)',
    defend: 'Savun',
    flee: 'Kaç',
    surrender: 'Teslim Ol',
    allies: 'DOSTLAR',
    enemies: 'DÜŞMANLAR',
    physical: 'FİZİKSEL',
    magical: 'BÜYÜSEL',
    companionTurn: 'YOLDAŞ SIRASI',
    selectTarget: 'HEDEF SEÇ',
    control: '{{name}} (Yoldaş) Kontrolü',
    skipCompanion: 'Yoldaş Turunu Geç',
    chooseTarget: '{{ability}} için hedef seç',
    useSelf: 'Kendine Kullan',
    confirmTarget: 'Hedefi Onayla',
    cancel: 'İptal',
    noAbilities: 'Mevcut {{type}} yeteneği yok.',
    inventory: 'ENVANTER',
    useItem: 'Eşya Kullan',
    back: 'Geri',
    noItems: 'Kullanılabilir eşya yok',
    log: 'SAVAŞ GÜNLÜĞÜ',
    autoScroll: 'Oto-kaydırma {{state}}',
    defeated: 'YENİLDİN',
    fallen: 'Savaşta düştün...',
    acceptFate: 'Kaderi Kabullen',
    equip: 'Kuşan',
    equipped: 'Kuşanıldı',
    equipTo: 'Kuşan: {{slot}}',
    alreadySummoned: 'Zaten çağrıldı',
    level: 'Sv.{{level}}',
    health: 'Can',
    magicka: 'Büyü',
    stamina: 'Dayanıklılık',
    damage: 'Hasar',
    armor: 'Zırh',
    crit: 'Kritik',
    dodge: 'Kaçınma',
    criticalHealth: '⚠️ Kritik Can!',
    stunWarning: '⚡ Sersemledin! Bu tur sadece Turu Geçebilirsin.',
    roll: 'Zar',
    attack: 'Saldır',
    defendBtn: 'Savun',
    magic: 'Büyü',
    items: 'Eşyalar',
    fleeBtn: 'Kaç',
    victory: 'Zafer!',
    defeat: 'Yenilgi...',
    enemyAppears: 'Bir {{enemy}} belirdi!',
    confirm: 'Onayla',
    abilities: '{{type}} YETENEKLERİ',
    equipBtn: 'Ekipman',
    chooseTargetFor: '{{abilityName}} için hedef seç',
    cannotTargetAllies: 'Bu yetenek dostları hedefleyemez.',
    hideActions: 'Eylemleri Gizle',
    showActions: 'Eylemleri Göster',
    combatLog: 'Savaş Günlüğü',
    invalidTarget: 'Geçersiz hedef seçildi.',
    autoScrollOn: 'Oto-kaydırma AÇIK',
    autoScrollOff: 'Oto-kaydırma KAPALI',
    companionAbilities: 'Yoldaş Yetenekleri',
    selectSelfOrAlly: 'Kendini veya bir dostu seç.',
    selectItem: 'Kullanmak için eşya seç.',
    itemBonusAction: 'Bonus eylem kullanır',
    summonBonusAction: 'Çağırma büyüleri Bonus eylemi kullanır.',
  },

  loot: {
    title: 'Yağma Aşaması',
    instruction: 'Yenilen düşmanlardan ganimet topla veya yağmayı atla.',
    xp: 'Deneyim',
    gold: 'Altın',
    empty: 'Yağmalanacak bir şey yok.',
    lootAll: 'Hepsini Al',
    confirm: 'Onayla',
    skip: 'Atla',
    cancel: 'İptal',
    header: 'Yağma',
  },
  equipment: {
    head: 'Baş',
    necklace: 'Kolye',
    chest: 'Gövde',
    hands: 'Eller',
    weapon: 'Silah',
    offhand: 'Yan El',
    ring: 'Yüzük',
    feet: 'Ayaklar',
    armor: 'Zırh',
    damage: 'Hasar',
    clickToEquip: 'Kuşanmak için boş yuvaya tıklayın',
    empty: 'Boş',
    twoHandedDisabled: 'Çift elli silah nedeniyle devre dışı',
    equippedByCompanion: 'Yoldaş tarafından kuşanıldı',
    equipToSlot: '{{slot}} Kuşan',
    stats: 'Zırh: {{armor}} • Hasar: {{damage}}',
    legend: 'Kuşanmak için boş yuvaya, çıkarmak için eşyaya tıklayın',
  },
  survival: {
    hunger: 'Açlık',
    thirst: 'Susuzluk',
    fatigue: 'Yorgunluk',
    rest: 'Dinlen',
    eat: 'Ye',
    drink: 'İç',
    camp: 'Kamp Kur',
    starving: 'Açlıktan Ölmek Üzere',
    starvingDesc: 'Zayıflık ve yavaş tepkiler. Yemek yiyene kadar savaş ve seyahat zorlaşır.',
    hungry: 'Aç',
    hungryDesc: 'Vücudun yemek istiyor. Dayanıklılık ve odaklanma azalıyor.',
    dehydrated: 'Susuzluktan Kurumuş',
    dehydratedDesc: 'Dayanıklılığın tükeniyor. İçene kadar yorgunluk daha hızlı artar.',
    thirsty: 'Susamış',
    thirstyDesc: 'Boğazın kurudu. Dayanıklılık yenilenmesi yavaşlıyor.',
    exhausted: 'Bitkin',
    exhaustedDesc: 'Yığılıp kalıyorsun. Hareket etmek ızdırap, savaşmak imkansız.',
    tired: 'Yorgun',
    tiredDesc: 'Uykuya ihtiyacın var. Yetenekler ve odaklanma köreliyor.',
    rested: 'Dinlenmiş',
    restedDesc: 'Zinde ve tetikte hissediyorsun. %5 daha fazla XP kazanırsın.',
    wellFed: 'Tok',
    wellFedDesc: 'Karnın tok ve sıcak. Can yenilenmesi hafifçe artar.',
    hydrated: 'Sulu',
    hydratedDesc: 'Ferahlamış. Dayanıklılık yenilenmesi hafifçe artar.',
  },
  inventory: {
    title: 'Envanter',
    subtitle: 'Yüklerin ve hazinelerin.',
    gold: 'Altın Septim',
    weight: 'Ağırlık',
    equip: 'Kuşan',
    unequip: 'Çıkar',
    use: 'Kullan',
    drop: 'Bırak',
    deleteTitle: 'Eşyayı Sil',
    deleteConfirm: '{{item}} envanterinden kalıcı olarak silinsin mi?',
    overEncumbered: '⚠️ Aşırı yüklüsün ve koşamazsın!',
    empty: 'Ceplerin boş.',
    emptyCategory: 'Envanterinde hiç {{category}} yok.',
    addItem: 'Eşya Ekle',
    manualAdd: 'Manuel Ekle',
    manualAddWarning: 'Bunu sadece dükkanda aradığın eşyayı bulamazsan kullan. Altın maliyetini kendinden düşmeyi unutma.',
    shop: 'Dükkan',
    blacksmith: 'Demirci',
    equipped: 'Kuşanıldı',
    viewInventory: 'Envanter',
    viewEquipment: 'Ekipman',
    quickSelect: 'Hızlı Seçim',
    itemName: 'Eşya Adı',
    itemType: 'Tür',
    itemDesc: 'Açıklama',
    addToInventory: 'Envantere Ekle',
    showIds: 'ID Göster',
    hideIds: 'ID Gizle',
    favoritesOnly: 'Sadece favorileri göster',
    markFavorite: 'Favorilere Ekle',
    unmarkFavorite: 'Favorilerden Çıkar',
    selectItem: '{{slot}} için eşya seç',
    noSuitable: 'Uygun eşya yok',
  },
  category: {
    all: 'Tümü',
    weapons: 'Silahlar',
    apparel: 'Zırh/Giysi',
    potions: 'İksirler',
    food: 'Yiyecek',
    drink: 'İçecek',
    camping: 'Kamp',
    ingredients: 'Malzemeler',
    keys: 'Anahtarlar',
    misc: 'Diğer',
    favorites: 'Favoriler',
  },
  item: {
    food: 'Yiyecek',
    drink: 'İçecek',
    healthPotion: 'Can İksiri',
    magickaPotion: 'Büyü İksiri',
    staminaPotion: 'Dayanıklılık İksiri',
  },
  sort: {

    name: 'İsim (A-Z)',
    type: 'Tür',
    rarity: 'Nadirlik',
    newest: 'En Yeni',
    quantity: 'Miktar',
    damage: 'Hasar / Güç',
    value: 'Değer (Altın)',
  },
  map: {
    title: 'Skyrim Haritası',
    current: 'Mevcut',
    level: 'Seviye',
    filter: {
      all: 'Tümü',
      cities: 'Şehirler',
      dungeons: 'Zindanlar',
      landmarks: 'Önemli Yerler',
      unlocked: 'Açık',
      quests: 'Görevler',
    },
    tooltips: {
      toggleEvents: 'Etkinlikleri Göster',
      toggleMissions: 'Görevleri Göster',
      toggleLabels: 'Etiketleri Göster',
      centerPlayer: 'Kendine Odakla',
      locked: 'Gereksinim: Seviye {{level}}',
    },
    legend: {
      city: 'Şehir',
      town: 'Kasaba',
      village: 'Köy',
      dungeon: 'Zindan',
      landmark: 'Önemli Yer',
      event: 'Etkinlik',
    },
  },
  dungeon: {
    nodes: {
      start: 'Başlangıç',
      combat: 'Savaş',
      elite: 'Seçkin',
      boss: 'Patron',
      rest: 'Dinlenme',
      reward: 'Hazine',
      event: 'Etkinlik',
      empty: 'Boş',
    },
    actions: {
      fight: 'Savaş',
      challengeElite: 'Meydan Oku',
      engageBoss: 'Canavarla Savaş',
      rest: 'Burada Dinlen',
      loot: 'Hazineyi Al',
      investigate: 'İncele',
      proceed: 'İlerle',
      doom: 'Doom Modu',
      exit: 'Çıkış',
    },
    warnings: {
      minLevel: 'En az {{level}} seviye olmalısınız',
      recLevel: 'Önerilen: Seviye {{level}}+',
    },
    stats: {
      floor: 'Kat',
      gold: 'Altın',
      xp: 'DP',
    },
    currentLocation: 'Mevcut Konum',
  },
  rest: {
    title: 'Dinlen',
    description: 'Ne kadar dinleneceğinizi seçin. Zaman geçecek ve yaşamsal değerleriniz kısmen yenilenecek.',
    method: 'Yöntem',
    hours: 'Dinlenme Süresi',
    actions: {
      camp: 'Kamp Kur (%50 yenilenme)',
      bed: 'Yatak (%90 yenilenme)',
      cancel: 'İptal',
      confirm: 'Dinlen',
    },
    labels: {
      hour: 'saat',
      hours: 'saat',
      minutes: 'dakika',
    },
    location: 'Nerede dinlenilecek',
    locations: {
      outside: 'Dışarıda',
      camp: 'Kamp',
      inn: 'Han',
    },
    quality: {
      well: 'İyice Dinlenmiş',
      wellDesc: 'Handa sıcak bir yatak. Tam dinlenme.',
      normal: 'Dinlenmiş',
      normalDesc: 'Çadırın iyi bir koruma sağlıyor.',
      somewhat: 'Kısmen Dinlenmiş',
      somewhatDesc: 'Uyku tulumu temel konfor sağlar.',
      poor: 'Kötü Dinlenmiş',
      poorDesc: 'Yerde uyumak. Rahatsız.',
    },
    warnings: {
      noGear: 'Ekipman yok',
    },
    visitShop: 'Malzeme almak için dükkanı ziyaret et.',
  },
  spells: {
    title: 'Büyü Kitabı',
    points: 'Puan',
    refund: 'İade Et',
    learn: 'Öğren',
    labels: {
      magicka: 'Maji Bedeli',
      perkCost: 'Puan Bedeli',
      damage: 'Hasar',
      heal: 'İyileştirme',
      effects: 'Etkiler:',
      requires: 'Gereksinim:',
      empoweredAvailable: 'Güçlendirilmiş versiyon mevcut!',
      empoweredLocked: 'Güçlendirilmiş versiyon kilitli',
      learnEmpowered: 'Güçlendirilmişi Öğren',
      needPoints: 'Daha fazla puan gerekli',
    },
    schools: {
      Destruction: 'Yıkım',
      Restoration: 'Yenilenme',
      Conjuration: 'Çağırma',
      Alteration: 'Başkalaşım',
      Illusion: 'İlüzyon',
      General: 'Genel',
    },
    data: {
      flames: { name: 'Alevler', description: 'Sürekli hasar veren küçük bir ateş püskürtür.' },
      ice_spike: { name: 'Buz Oku', description: 'Soğuk hasarı veren ve yavaşlatma ihtimali olan buz oku.' },
      healing: { name: 'İyileştirme', description: 'Orta miktarda sağlık yeniler.' },
      spark: { name: 'Kıvılcım', description: 'Mütevazı hasar veren küçük bir yıldırım çarpması.' },
      fireball: { name: 'Ateş Topu', description: 'Birden fazla hedefe vuran güçlü bir ateş patlaması.' },
      frost_nova: { name: 'Buz Novası', description: 'Yakındaki düşmanlara hasar veren ve yavaşlatan dondurucu bir patlama.' },
      lightning_bolt: { name: 'Yıldırım Oku', description: 'Zırhı delen yoğunlaştırılmış bir yıldırım oku.' },
      chain_lightning: { name: 'Zincirleme Yıldırım', description: 'Birden fazla düşman arasında seken yıldırım.' },
      summon_skeleton: { name: 'İskelet Çağır', description: 'Sizin için savaşacak iskelet bir minyon çağırır.' },
      summon_familiar: { name: 'Ruhani Kurt Çağır', description: 'Savaşta size yardım etmesi için hayalet bir kurt çağırır.' },
      summon_flame_atronach: { name: 'Ateş İfriti Çağır', description: 'Düşmanlara ateşle saldıran bir Ateş İfriti çağırır.' },
      summon_frost_atronach: { name: 'Buz İfriti Çağır', description: 'Tanklık yapması ve soğuk hasarı vermesi için güçlü bir Buz İfriti çağırır.' },
      summon_storm_atronach: { name: 'Fırtına İfriti Çağır', description: 'Yıldırımlarla çatırdayan yıkıcı bir Fırtına İfriti çağırır.' },
      summon_wolf: { name: 'Vahşi Çağrı: Kurt', description: 'Savaşta yardım etmesi için vahşi bir kurt çağırır.' },
      summon_bear: { name: 'Vahşi Çağrı: Ayı', description: 'Yanınızda savaşması için korkunç bir mağara ayısı çağırır.' },
      summon_sabre_cat: { name: 'Vahşi Çağrı: Kılıç Diş', description: 'Düşmanlarınızı avlaması için ölümcül bir kılıç dişli kaplan çağırır.' },
      summon_spriggan: { name: 'Spriggan Çağır', description: 'Müttefikleri iyileştiren ve düşmanlara saldıran bir doğa ruhu çağırır.' },
      summon_wrathman: { name: 'Gazaplı Çağır', description: 'Sizin için savaşacak kadim bir Nord ruh savaşçısı çağırır.' },
      invisibility: { name: 'Görünmezlik', description: 'Kısa bir süreliğine görünmez olursunuz.' },
      slow: { name: 'Yavaşlat', description: 'Hedefin hareket hızını önemli ölçüde azaltır.' },
      heal_major: { name: 'Büyük Şifa', description: 'Kullanıcının veya bir müttefikin sağlığını büyük miktarda yeniler.' },
      aeonic_pulse: { name: 'Ebedi Nabız', description: 'Odaklanmış ebedi enerji nabzı — az miktarda alan iyileştirmesi + hasar.' },
      aeonic_surge: { name: 'Ebedi Dalgalanma', description: 'Müttefikleri iyileştirirken yakındaki düşmanları yaralayan bir enerji dalgası.' },
      aeonic_wave: { name: 'Ebedi Dalga', description: 'Süpürücü bir ebedi enerji dalgası — güçlü ve maliyetli.' },
      fire_bolt: { name: 'Ateş Oku', description: 'Yoğunlaştırılmış ateş hasarı veren bir ok.' },
      frostbite: { name: 'Ayaz', description: 'Düşmanları yavaşlatan bir buz oku.' },
      inferno: { name: 'Cehennem', description: 'Yakındaki tüm düşmanları yakan güçlü bir ateş büyüsü.' },
      absolute_zero: { name: 'Mutlak Sıfır', description: 'Düşmanları dondurup ağır hasar veren aşırı soğuk.' },
      blizzard: { name: 'Tip', description: 'Tüm düşmanları dondurup zamanla hasar veren yıkıcı bir buz fırtınası.' },
      meteor_storm: { name: 'Meteor Fırtınası', description: 'Tüm düşmanların üzerine meteor yağdırarak devasa alan hasarı verir.' },
      close_wounds: { name: 'Yaraları Kapat', description: 'Kendinizi daha etkili bir şekilde iyileştirin.' },
      cure_disease: { name: 'Hastalık İyileştir', description: 'Sizi etkileyen tüm hastalıkları ve zehirleri iyileştirir.' },
      magicka_restoration: { name: 'Maji Yenileme', description: 'Maji havuzunuzu yeniler.' },
      grand_healing: { name: 'Yüce Şifa', description: 'Kendize büyük miktarda sağlık yeniler.' },
      healing_circle: { name: 'Şifa Çemberi', description: 'Size ve tüm müttefiklere sağlık veren bir şifa ışığı çemberi.' },
      guardian_circle: { name: 'Muhafız Çemberi', description: 'Tüm müttefikleri iyileştiren ve zırhlarını artıran güçlü bir koruma.' },
      mass_restoration: { name: 'Kitle Yenilenme', description: 'Tüm müttefiklerin sağlık ve majisini yeniler.' },
      soul_trap: { name: 'Ruh Kapanı', description: 'Bir düşmanın ruhunu hapsederken hasar verir.' },
      bound_weapon: { name: 'Bağlı Silah', description: 'Düşmanınıza vurmak için hayalet bir silah çağırır.' },
      conjure_daedra: { name: 'Daedra Çağır', description: 'Sizin için savaşması adına bir daedrik hizmetkar çağırır.' },
      summon_dremora_lord: { name: 'Dremora Lordu Çağır', description: 'Savaş alanına hükmetmek için güçlü bir Dremora Lordu çağırır.' },
      oakflesh: { name: 'Meşe Derisi', description: 'Cildinizi sertleştirerek zırhı artırır.' },
      stoneskin: { name: 'Taş Derisi', description: 'Cildinizi taşa çevirerek zırhı önemli ölçüde artırır.' },
      iron_skin: { name: 'Demir Derisi', description: 'Kısa bir süreliğine neredeyse hasar almaz olursunuz.' },
      paralyze: { name: 'Felç Et', description: 'Bir düşmanı felç ederek hareket etmesini engeller.' },
      telekinesis: { name: 'Telekinezi', description: 'Telekinetik güçle nesneleri düşmanlara fırlatır.' },
      candlelight: { name: 'Mum Işığı', description: 'Etrafınızda büyülü bir ışık oluşturur.' },
      muffle: { name: 'Sessiz Adımlar', description: 'Ayak seslerinizi susturur.' },
      fear: { name: 'Korku', description: 'Bir düşmanı dehşete düşürerek hasarını azaltır.' },
      mayhem: { name: 'Kargaşa', description: 'Tüm düşmanların birbirine saldırmasını sağlar.' },
      mass_paralysis: { name: 'Kitle Felci', description: 'Geniş bir alandaki tüm düşmanları felç eder.' },
    }
  },
  perks: {
    title: 'Yetenek Ağacı',
    points: 'Puan',
    spent: 'harcandı',
    expandAll: 'Hepsini Aç',
    collapseAll: 'Hepsini Kapat',
    refund: 'Hepsini İade Et',
    staged: 'planlanan',
    cancel: 'İptal',
    leave: 'Çık',
    confirm: 'Onayla',
    stage: 'Planla',
    undo: 'Geri Al',
    master: 'Ustalaş',
    cancelMaster: 'Ustalığı İptal Et',
    force: 'Zorla',
    refundDesc: 'Bu, {{count}} açık yeteneği sıfırlayacak ve {{points}} yetenek puanını iade edecek.',
    reallocateDesc: 'Daha sonra yetenek puanlarını harcayarak yetenekleri tekrar dağıtabilirsin.',
    requires: 'Gereksinim:',
    rank: 'Seviye',
    masterCost: 'Ustalık Bedeli',
    perRank: 'Seviye başı:',
    current: 'Mevcut:',
    selectPrompt: 'Detayları görmek için bir yetenek seçin',
    categories: {
      attributes: 'Nitelikler',
      combat: 'Savaş',
      armor: 'Zırh',
      magic: 'Büyü',
      stealth: 'Gizlilik',
    },
    data: {
      toughness: { name: 'Dayanıklılık', description: 'Maksimum sağlığı seviye başına 10 artırır.' },
      vitality: { name: 'Canlılık', description: 'Maksimum sağlığı seviye başına 20 artırır.' },
      arcane_focus: { name: 'Büyülü Odak', description: 'Maksimum majiyi seviye başına 10 artırır.' },
      mana_mastery: { name: 'Maji Ustalığı', description: 'Maksimum majiyi seviye başına 20 artırır.' },
      endurance: { name: 'Dayanım', description: 'Maksimum dayanıklılığı seviye başına 10 artırır.' },
      fleet_foot: { name: 'Çabuk Ayak', description: 'Maksimum dayanıklılığı seviye başına 15 artırır.' },
      reroll_on_failure: { name: 'Şanslı Vuruş', description: 'Bir saldırı kritik başarısız olduğunda, otomatik olarak bir kez daha dener (pasif).' },
      health_regen: { name: 'Sağlık Yenilenmesi', description: 'Savaş sırasında pasif olarak sağlık yeniler. Her seviye yenilenme hızını %25 artırır. Seviye 10 gerektirir.' },
      magicka_regen: { name: 'Maji Yenilenmesi', description: 'Savaş sırasında pasif olarak maji yeniler. Her seviye yenilenme hızını %25 artırır. Seviye 10 gerektirir.' },
      stamina_regen: { name: 'Dayanıklılık Yenilenmesi', description: 'Savaş sırasında pasif olarak dayanıklılık yeniler. Her seviye yenilenme hızını %25 artırır. Seviye 10 gerektirir.' },
      armsman: { name: 'Silahşör', description: 'Tek elli silah hasarını seviye başına %10 artırır.' },
      fighting_stance: { name: 'Savaş Duruşu', description: 'Tek elli silahlarla yapılan güç saldırıları seviye başına %15 daha az dayanıklılık harcar.' },
      dual_flurry: { name: 'Çifte Rüzgar', description: 'Çift silah kullanırken saldırı hızını seviye başına %8 artırır.' },
      dual_savagery: { name: 'Çifte Vahşet', description: 'Çift silahlı güç saldırıları seviye başına %25 bonus hasar verir.' },
      bladesman: { name: 'Kılıç Ustası', description: 'Kılıçlarla yapılan kritik vuruşlar seviye başına %15 daha fazla hasar verir.' },
      riposte_mastery: { name: 'Karşı Saldırı Ustalığı', description: 'Karşı Saldırı yeteneğini açar (hızlı karşı saldırı). Tek Elli silah yeteneği 25+ gerektirir.' },
      slash_mastery: { name: 'Kesme Ustalığı', description: 'Kesme yeteneğini açar (geniş alanlı kesme). Tek Elli silah yeteneği 40+ gerektirir.' },
      mortal_strike_mastery: { name: 'Ölümcül Vuruş Ustalığı', description: 'Ölümcül Vuruş yeteneğini açar (yüksek hasar, hasar azaltıcı zayıflatma). Tek Elli silah yeteneği 60+ gerektirir.' },
      bone_breaker: { name: 'Kemik Kıran', description: 'Gürzler seviye başına zırhın %15\'ini yok sayar.' },
      hack_and_slash: { name: 'Kes ve Biç', description: 'Baltaların kanamaya neden olma şansı seviye başına %10 artar (3 tur boyunca 5 hasar).' },
      unarmed_mastery: { name: 'Silahsız Ustalık', description: 'Silahsız Saldırı yeteneğini açar ve silahsız hasarı seviye başına %8 artırır.' },
      barbarian: { name: 'Barbar', description: 'Çift elli silah hasarını seviye başına %12 artırır.' },
      champions_stance: { name: 'Şampiyon Duruşu', description: 'Çift elli silahlarla yapılan güç saldırıları seviye başına %15 daha az dayanıklılık harcar.' },
      deep_wounds: { name: 'Derin Yaralar', description: 'Büyük kılıçlarla yapılan kritik vuruşlar seviye başına %20 daha fazla hasar verir.' },
      skull_crusher: { name: 'Kafatası Kıran', description: 'Savaş çekiçleri seviye başına zırhın %20\'sini yok sayar.' },
      limbsplitter: { name: 'Uzuv Koparan', description: 'Savaş baltalarının kanamaya neden olma şansı seviye başına %15 artar (3 tur boyunca 7 hasar).' },
      devastating_blow: { name: 'Yıkıcı Darbe', description: 'Duran güç saldırılarının düşmanın kafasını kesme (düşük sağlıkta anında ölüm) şansı seviye başına %15 artar.' },
      shield_wall: { name: 'Kalkan Duvarı', description: 'Bloklama seviye başına %10 daha etkilidir.' },
      deflect_arrows: { name: 'Okları Saptır', description: 'Kalkanınıza isabet eden oklar hasar vermez.' },
      elemental_protection: { name: 'Elemental Koruma', description: 'Kalkanla bloklamak gelen ateş, buz ve şok hasarını seviye başına %25 azaltır.' },
      power_bash: { name: 'Güçlü Darbe', description: 'Kalkan darbesi basılı tutularak seviye başına %20 sersemletme şansıyla daha güçlü vurabilir.' },
      deadly_bash: { name: 'Ölümcül Darbe', description: 'Kalkan darbesi seviye başına 5 kat daha fazla hasar verir.' },
      disarming_bash: { name: 'Silahsızlandıran Darbe', description: 'Kalkan darbesinin rakibi silahsızlandırma şansı seviye başına %15 artar.' },
      tactical_guard_mastery: { name: 'Taktiksel Koruma Ustalığı', description: 'Taktiksel Koruma süresini seviye başına +1 tur artırır (maks +2), Korumanın 3 tura kadar sürmesini sağlar.' },
      whirlwind_mastery: { name: 'Kasırga Ustalığı', description: 'Yüksek silah yeteneği gereksinimleri olmadan Kasırga Saldırısı\'nı (Alan etkili fiziksel) açar.' },
      cleaving_mastery: { name: 'Yarma Ustalığı', description: 'Yüksek Çift Elli silah yeteneği gereksinimleri olmadan Yarma Saldırısı\'nı (Alan etkili çift elli yarma) açar.' },
      overdraw: { name: 'Aşırı Gerilim', description: 'Yay hasarını seviye başına %12 artırır.' },
      eagle_eye: { name: 'Kartal Gözü', description: 'Yaylarla kritik vuruş şansını seviye başına %5 artırır.' },
      steady_hand: { name: 'Titrek Olmayan El', description: 'Yaylar için dayanıklılık maliyetini seviye başına %15 azaltır.' },
      power_shot: { name: 'Güçlü Atış', description: 'Okların düşmanları sersemletme şansı seviye başına %25 artar.' },
      quick_shot: { name: 'Hızlı Atış', description: 'Yayı seviye başına %15 daha hızlı gerebilirsiniz.' },
      hunters_discipline: { name: 'Avcı Disiplini', description: 'Ölü bedenlerden okları geri alma şansı seviye başına %50 artar.' },
      agile_defender: { name: 'Çevik Savunucu', description: 'Hafif zırh derecesini seviye başına %10 artırır.' },
      custom_fit: { name: 'Özel Kesim', description: 'Uyumlu bir hafif zırh seti giymek seviye başına +%10 zırh bonusu sağlar.' },
      unhindered: { name: 'Engel Tanımaz', description: 'Hafif zırh ağırlık yapmaz ve sizi yavaşlatmaz.' },
      wind_walker: { name: 'Rüzgar Yürüyüşçüsü', description: 'Hafif zırh giyerken dayanıklılık seviye başına %25 daha hızlı yenilenir.' },
      deft_movement: { name: 'Usta Hareket', description: 'Hafif zırh giyerken yakın dövüş saldırılarından kaçınma şansı seviye başına %10 artar.' },
      juggernaut: { name: 'Ezip Geçen', description: 'Ağır zırh derecesini seviye başına %12 artırır.' },
      well_fitted: { name: 'İyi Oturan', description: 'Uyumlu bir ağır zırh seti giymek seviye başına +%15 zırh bonusu sağlar.' },
      tower_of_strength: { name: 'Güç Kulesi', description: 'Ağır zırh giyerken sersemletilme şansı seviye başına %25 azalır.' },
      conditioning: { name: 'Kondisyon', description: 'Ağır zırh ağırlık yapmaz ve sizi yavaşlatmaz.' },
      reflect_blows: { name: 'Darbeleri Yansıt', description: 'Yakın dövüş hasarını saldırgana geri yansıtma şansı seviye başına %10 artar.' },
      destruction_novice: { name: 'Acemi Yıkım', description: 'Acemi seviye yıkım büyüleri seviye başına %25 daha az maji harcar.' },
      augmented_flames: { name: 'Güçlendirilmiş Alevler', description: 'Ateş büyüleri seviye başına %15 daha fazla hasar verir.' },
      augmented_frost: { name: 'Güçlendirilmiş Buz', description: 'Buz büyüleri seviye başına %15 daha fazla hasar verir.' },
      augmented_shock: { name: 'Güçlendirilmiş Şok', description: 'Şok büyüleri seviye başına %15 daha fazla hasar verir.' },
      intense_flames: { name: 'Yoğun Alevler', description: 'Ateş büyüleri, sağlığı %20\'nin altındaki hedeflerde seviye başına %15 korku yaratma şansına sahiptir.' },
      deep_freeze: { name: 'Derin Dondurucu', description: 'Buz büyüleri, sağlığı %20\'nin altındaki hedefleri seviye başına %15 felç etme şansına sahiptir.' },
      disintegrate: { name: 'Parçala', description: 'Şok büyüleri, sağlığı %15\'in altındaki hedefleri seviye başına %15 anında öldürme şansına sahiptir.' },
      restoration_novice: { name: 'Acemi Yenilenme', description: 'Acemi seviye yenilenme büyüleri seviye başına %25 daha az maji harcar.' },
      regeneration: { name: 'Yenilenme', description: 'İyileştirme büyüleri seviye başına %25 daha etkilidir.' },
      recovery: { name: 'İyileşme', description: 'Maji seviye başına %15 daha hızlı yenilenir.' },
      avoid_death: { name: 'Ölümden Kaçış', description: 'Savaşta bir kez, sağlık %10\'un altına düştüğünde, seviye başına 50 sağlık otomatik olarak yenilenir.' },
      conjuration_novice: { name: 'Acemi Çağrı', description: 'Acemi seviye çağırma büyüleri seviye başına %25 daha az maji harcar.' },
      summoner: { name: 'Çağırıcısı', description: 'Çağrılan yaratıklar seviye başına %15 daha fazla sağlığa sahiptir.' },
      atromancy: { name: 'İfrit Uzmanlığı', description: 'Çağrılan İfritler seviye başına %25 daha uzun süre kalır.' },
      twin_souls: { name: 'İkiz Ruhlar', description: 'Seviye başına fazladan bir yaratık çağırabilirsiniz (tam seviyede toplam 3).' },
      pact_warrior: { name: 'Anlaşmalı Savaşçı', description: 'Çağrılan yaratıklar seviye başına %20 daha fazla hasar verir.' },
      spell_shield: { name: 'Büyü Kalkanı', description: 'Çağrılan yaratıklar size seviye başına %15 hasar azaltma sağlar.' },
      stealth: { name: 'Gizlilik', description: 'Seviye başına tespit edilmeniz %15 daha zordur.' },
      backstab: { name: 'Sırttan Bıçaklama', description: 'Tek elli silahlarla yapılan gizli saldırılar 3x hasar verir (seviye başı: +1x).' },
      deadly_aim: { name: 'Ölümcül Nişan', description: 'Yaylarla yapılan gizli saldırılar 2x hasar verir (seviye başı: +1x).' },
      assassins_blade: { name: 'Suikastçı Bıçağı', description: 'Hançerlerle yapılan gizli saldırılar 15x hasar verir.' },
      shadow_warrior: { name: 'Gölge Savaşçısı', description: 'Eğilirken savaşın ortasında gizliliğe girme şansı seviye başına %15 artar.' },
      phantom_strike: { name: 'Hayalet Vuruş', description: 'Gizli saldırılar seviye başına hedef zırhının %25\'ini yok sayar.' },
      poison_mastery: { name: 'Zehir Ustalığı', description: 'Gizli saldırılara uygulanan zehirler seviye başına %30 daha etkilidir.' },
      berserker_rage: { name: 'Öfke Nöbeti', description: 'Sağlık %25\'in altındayken, seviye başına %20 daha fazla hasar verir.' },
      vampiric_strikes: { name: 'Vampir Vuruşları', description: 'Yakın dövüş saldırıları verilen hasarın %3\'ünü seviye başına sağlık olarak yeniler.' },
      executioner: { name: 'Cellat', description: 'Sağlığı %20\'nin altındaki düşmanlara yapılan saldırılar seviye başına %25 daha fazla hasar verir.' },
      dragon_skin: { name: 'Ejderha Derisi', description: 'Tüm kaynaklardan seviye başına %5 daha az hasar alırsınız.' },
      ricochet: { name: 'Sekme', description: 'Okların sekip başka bir düşmana vurma şansı seviye başına %15 artar.' },
      piercing_shot: { name: 'Delici Atış', description: 'Ok saldırıları seviye başına düşman zırhının %20\'sini yok sayar.' },
      alteration_novice: { name: 'Acemi Başkalaşım', description: 'Acemi seviye başkalaşım büyüleri seviye başına %25 daha az maji harcar.' },
      stoneskin: { name: 'Taş Derisi', description: 'Kullanıldığında zırhı seviye başına 30 artırır.' },
      blur: { name: 'Bulanıklık', description: 'Kullanıldığında düşman isabet oranını seviye başına %10 azaltır.' },
      paralysis_mastery: { name: 'Felç Ustalığı', description: 'Felç etkilerinin tetiklenme şansı seviye başına %15 artar.' },
      illusion_novice: { name: 'Acemi İlüzyon', description: 'Acemi seviye ilüzyon büyüleri seviye başına %25 daha az maji harcar.' },
      confidence: { name: 'Özgüven', description: 'Korku etkileri etkilenen düşmanlara seviye başına %20 daha fazla hasar verir.' },
      Fury: { name: 'Öfke', description: 'Kaotik büyüler düşmanların birbirine saldırma ihtimalini seviye başına %30 artırır.' },
      invisibility_mastery: { name: 'Görünmezlik Ustalığı', description: 'Görünmezlik seviye başına %25 daha uzun sürer.' },
      spell_absorption: { name: 'Büyü Emilimi', description: 'Alınan büyü hasarının %10\'unu seviye başına maji olarak emer.' },
      inferno: { name: 'Cehennem', description: 'Ateş büyüleri yakındaki düşmanlara sıçrayarak seviye başına %40 hasar verir.' },
      absolute_zero: { name: 'Mutlak Sıfır', description: 'Buz büyüleri düşmanları dondurarak seviye başına 2 tur devre dışı bırakır.' },
      overcharge: { name: 'Aşırı Yükleme', description: 'Şok büyüleri isabet ettiğinde harcanan majinin %15\'ini seviye başına yeniler.' },
    }
  },
  items: {
    enchantedItemFormat: '{{enchantment}} {{item}}',
    data: {
      petty_soul_gem: 'Küçük Ruh Cevheri (Boş)',
      lesser_soul_gem: 'Düşük Ruh Cevheri (Boş)',
      garnet: 'Lal Taşı',
      amethyst: 'Ametist',
      common_soul_gem: 'Sıradan Ruh Cevheri (Boş)',
      ruby: 'Yakut',
      sapphire: 'Safir',
      emerald: 'Zümrüt',
      greater_soul_gem: 'Büyük Ruh Cevheri (Boş)',
      diamond: 'Elmas',
      flawless_ruby: 'Kusursuz Yakut',
      flawless_sapphire: 'Kusursuz Safir',
      grand_soul_gem: 'Yüce Ruh Cevheri (Boş)',
      flawless_diamond: 'Kusursuz Elmas',
      black_soul_gem: 'Siyah Ruh Cevheri',
      iron_dagger: 'Demir Hançer',
      iron_sword: 'Demir Kılıç',
      hunting_bow: 'Avcı Yayı',
      iron_war_axe: 'Demir Savaş Baltası',
      steel_dagger: 'Çelik Hançer',
      steel_sword: 'Çelik Kılıç',
      steel_greatsword: 'Çelik Büyük Kılıç',
      elven_dagger: 'Elf Hançeri',
      dwarven_bow: 'Cüce Yayı',
      elven_sword: 'Elf Kılıcı',
      orcish_war_axe: 'Ork Savaş Baltası',
      glass_dagger: 'Cam Hançer',
      ebony_mace: 'Ebon Topuz',
      glass_sword: 'Cam Kılıç',
      ebony_bow: 'Ebon Yay',
      ebony_war_axe: 'Ebon Savaş Baltası',
      daedric_sword: 'Daedrik Kılıç',
      daedric_war_axe: 'Daedrik Savaş Baltası',
      dragonbone_bow: 'Ejderkemiği Yay',
      daedric_greatsword: 'Daedrik Ulu Kılıç',
      // Missing Shop & Unique Weapons
      iron_mace: 'Demir Topuz',
      iron_battleaxe: 'Demir Çift Elli Balta',
      iron_warhammer: 'Demir Savaş Çekici',
      novice_staff: 'Acemi Asası',
      basic_staff_sparks: 'Kıvılcım Asası',
      basic_staff_flames: 'Alev Asası',
      basic_staff_frost: 'Don Asası',
      apprentice_staff: 'Çırak Asası',
      steel_war_axe: 'Çelik Savaş Baltası',
      steel_mace: 'Çelik Topuz',
      steel_battleaxe: 'Çelik Çift Elli Balta',
      steel_warhammer: 'Çelik Savaş Çekici',
      long_bow: 'Uzun Yay',
      fire_arrows: 'Ateş Okları',
      ice_arrows: 'Buz Okları',
      shock_arrows: 'Şok Okları',
      paralyze_arrows: 'Felç Okları',
      allycall_arrows: 'Komut Okları',
      travelers_shortsword: 'Gezginin Kısa Kılıcı',
      honed_steel_longsword: 'Bilenmiş Çelik Uzun Kılıç',
      frosted_dagger: 'Donmuş Hançer',
      emberbrand_staff: 'Kor Marka Asası',
      stormcall_bow: 'Fırtına Çağıran Yay',
      orcish_dagger: 'Ork Hançeri',
      orcish_sword: 'Ork Kılıcı',
      orcish_mace: 'Ork Topuzu',
      orcish_greatsword: 'Ork Ulu Kılıcı',
      orcish_battleaxe: 'Ork Çift Elli Baltası',
      orcish_warhammer: 'Ork Savaş Çekici',
      orcish_bow: 'Ork Yayı',
      dwarven_dagger: 'Cüce Hançeri',
      dwarven_sword: 'Cüce Kılıcı',
      dwarven_war_axe: 'Cüce Savaş Baltası',
      dwarven_mace: 'Cüce Topuzu',
      dwarven_greatsword: 'Cüce Ulu Kılıcı',
      dwarven_battleaxe: 'Cüce Çift Elli Baltası',
      dwarven_warhammer: 'Cüce Savaş Çekici',
      elven_war_axe: 'Elf Savaş Baltası',
      elven_mace: 'Elf Topuzu',
      elven_greatsword: 'Elf Ulu Kılıcı',
      elven_battleaxe: 'Elf Çift Elli Baltası',
      elven_warhammer: 'Elf Savaş Çekici',
      elven_bow: 'Elf Yayı',
      glass_war_axe: 'Cam Savaş Baltası',
      glass_mace: 'Cam Topuz',
      glass_greatsword: 'Cam Ulu Kılıç',
      glass_battleaxe: 'Cam Çift Elli Balta',
      glass_warhammer: 'Cam Savaş Çekici',
      glass_bow: 'Cam Yay',
      ebony_dagger: 'Ebon Hançer',
      ebony_sword: 'Ebon Kılıç',
      ebony_greatsword: 'Ebon Ulu Kılıç',
      ebony_battleaxe: 'Ebon Çift Elli Balta',
      ebony_warhammer: 'Ebon Savaş Çekici',
      daedric_dagger: 'Daedrik Hançer',
      daedric_mace: 'Daedrik Topuz',
      daedric_battleaxe: 'Daedrik Çift Elli Balta',
      daedric_warhammer: 'Daedrik Savaş Çekici',
      daedric_bow: 'Daedrik Yay',
      staff_flames: 'Alev Asası',
      staff_frost: 'Buz Asası',
      staff_lightning: 'Şimşek Asası',
      elven_dagger_of_flame: 'Alevli Elf Hançeri',
      steel_sword_of_frost: 'Buzlu Çelik Kılıç',
      glass_bow_of_lightning: 'Şimşekli Cam Yay',
      dwarven_dagger_of_shock: 'Şoklu Cüce Hançeri',
      orcish_mace_of_bleeding: 'Kanamalı Ork Topuzu',
      enchanted_bow: 'Efsunlu Avcı Yayı',
      silver_sword: 'Gümüş Kılıç',
      silver_greatsword: 'Gümüş Ulu Kılıç',
      crossbow: 'Arbalet',
      steel_bolts: 'Çelik Oklar (Arbalet)',
      hide_helmet: 'Post Miğfer',
      leather_boots: 'Deri Çizme',
      iron_helmet: 'Demir Miğfer',
      leather_armor: 'Deri Zırh',
      steel_armor: 'Çelik Zırh',
      scaled_helmet: 'Pullu Miğfer',
      elven_boots: 'Elf Çizmesi',
      elven_armor: 'Elf Zırhı',
      glass_helmet: 'Cam Miğfer',
      orcish_armor: 'Ork Zırhı',
      glass_armor: 'Cam Zırh',
      ebony_boots: 'Ebon Çizme',
      ebony_shield: 'Ebon Kalkan',
      daedric_armor: 'Daedrik Zırh',
      dragonplate_helmet: 'Ejderplaka Miğfer',
      daedric_shield: 'Daedrik Kalkan',
      // Missing Shop & Unique Armor
      hide_armor: 'Post Zırh',
      hide_boots: 'Post Çizme',
      hide_gauntlets: 'Post Eldiven',
      leather_helmet: 'Deri Miğfer',
      leather_gloves: 'Deri Eldiven',
      iron_boots: 'Demir Çizme',
      iron_gauntlets: 'Demir Eldiven',
      iron_shield: 'Demir Kalkan',
      steel_boots: 'Çelik Çizme',
      steel_helmet: 'Çelik Miğfer',
      steel_gauntlets: 'Çelik Eldiven',
      steel_shield: 'Çelik Kalkan',
      steel_plate_armor: 'Çelik Plaka Zırh',
      elven_light_armor: 'Hafif Elf Zırhı',
      elven_helmet: 'Elf Miğferi',
      elven_gauntlets: 'Elf Eldiveni',
      elven_shield: 'Elf Kalkanı',
      scaled_armor: 'Pullu Zırh',
      scaled_boots: 'Pullu Çizme',
      scaled_gauntlets: 'Pullu Eldiven',
      orcish_boots: 'Ork Çizmesi',
      orcish_helmet: 'Ork Miğferi',
      orcish_gauntlets: 'Ork Eldiveni',
      orcish_shield: 'Ork Kalkanı',
      dwarven_armor: 'Cüce Zırhı',
      dwarven_boots: 'Cüce Çizmesi',
      dwarven_helmet: 'Cüce Miğferi',
      dwarven_gauntlets: 'Cüce Eldiveni',
      dwarven_shield: 'Cüce Kalkanı',
      elven_gilded_armor: 'Yaldızlı Elf Zırhı',
      elven_gilded_boots: 'Yaldızlı Elf Çizmesi',
      elven_gilded_helmet: 'Yaldızlı Elf Miğferi',
      elven_gilded_gauntlets: 'Yaldızlı Elf Eldiveni',
      glass_boots: 'Cam Çizme',
      glass_gauntlets: 'Cam Eldiven',
      glass_shield: 'Cam Kalkan',
      dragonscale_armor: 'Ejderpulu Zırh',
      dragonscale_boots: 'Ejderpulu Çizme',
      dragonscale_helmet: 'Ejderpulu Miğfer',
      dragonscale_gauntlets: 'Ejderpulu Eldiven',
      dragonscale_shield: 'Ejderpulu Kalkan',
      ebony_armor: 'Ebon Zırh',
      ebony_helmet: 'Ebon Miğfer',
      ebony_gauntlets: 'Ebon Eldiven',
      dragonplate_armor: 'Ejderplaka Zırh',
      dragonplate_boots: 'Ejderplaka Çizme',
      dragonplate_gauntlets: 'Ejderplaka Eldiven',
      dragonplate_shield: 'Ejderplaka Kalkan',
      daedric_boots: 'Daedrik Çizme',
      daedric_helmet: 'Daedrik Miğfer',
      daedric_gauntlets: 'Daedrik Eldiven',
      // Jewelry
      silver_ring: 'Gümüş Yüzük',
      gold_necklace: 'Altın Kolye',
      gold_circlet: 'Altın Taç',
      // Promo/Legendary
      legendary_sword_of_ages: 'Çağların Kılıcı (Efsanevi)',
      legendary_aeon_greatsword: 'Aeon Ulu Kılıcı (Efsanevi)',
      legendary_bow_of_apocalypse: 'Kıyamet Yayı (Efsanevi)',
      legendary_void_dagger: 'Boşluk Hançeri (Efsanevi)',
      legendary_plate_of_titans: 'Titan Plakası (Efsanevi)',
      legendary_helm_of_eternity: 'Sonsuzluk Miğferi (Efsanevi)',
      legendary_shield_of_sol: 'Sol Kalkanı (Efsanevi)',
      legendary_epic_legion_armor: 'Epik Lejyon Zırhı (Efsanevi)',
      epic_sword_of_ages: 'Çağların Kılıcı (Epik)',
      epic_aeon_greatsword: 'Aeon Ulu Kılıcı (Epik)',
      epic_bow_of_apocalypse: 'Kıyamet Yayı (Epik)',
      epic_void_dagger: 'Boşluk Hançeri (Epik)',
      epic_plate_of_titans: 'Titan Plakası (Epik)',
      epic_helm_of_eternity: 'Sonsuzluk Miğferi (Epik)',
      epic_shield_of_sol: 'Sol Kalkanı (Epik)',
      epic_legion_armor: 'Epik Lejyon Zırhı (Epik)',
      minor_health: 'Küçük Sağlık İksiri',
      minor_stamina: 'Küçük Dayanıklılık İksiri',
      health_potion: 'Sağlık İksiri',
      magicka_potion: 'Efsun İksiri',
      plentiful_magicka: 'Bol Efsun İksiri',
      healing_potion: 'İyileşme İksiri',
      plentiful_health: 'Bol Sağlık İksiri',
      plentiful_stamina: 'Bol Dayanıklılık İksiri',
      fortify_smithing: 'Demircilik Güçlendirme İksiri',
      ultimate_health: 'Üstün Sağlık İksiri',
      warrior_potion: 'Savaşçı İksiri',
      regeneration_elixir: 'Yenilenme İksiri',
      tome_flames: 'Büyü Kitabı: Alevler',
      tome_healing: 'Büyü Kitabı: İyileşme',
      tome_firebolt: 'Büyü Kitabı: Ateş Oku',
      tome_fast_healing: 'Büyü Kitabı: Hızlı İyileşme',
      tome_fireball: 'Büyü Kitabı: Ateş Topu',
      tome_chain_lightning: 'Büyü Kitabı: Zincirleme Şimşek',
      tome_incinerate: 'Büyü Kitabı: Kül Etme',
      tome_blizzard: 'Büyü Kitabı: Tipi',
      tome_fire_storm: 'Büyü Kitabı: Ateş Fırtınası',
      silver_necklace: 'Gümüş Kolye',
      gold_ring: 'Altın Yüzük',
      silver_candlestick: 'Gümüş Şamdan',
      gold_ingot: 'Altın Külçe',
      silver_ingot: 'Gümüş Külçe',
      jeweled_amulet: 'Mücevherli Muska',
      ornate_goblet: 'Süslü Kadeh',
      dwemer_gyro: 'Dwemer Jiroskopu',
      gold: 'Altın',
      // Missing Misc & Consumables
      bread: 'Ekmek',
      apple: 'Elma',
      cheese_wheel: 'Peynir Tekeri',
      venison: 'Geyik Eti (Pişmiş)',
      salmon_steak: 'Izgara Somon',
      sweetroll: 'Sweetroll',
      beef_stew: 'Sığır Etli Yahni',
      cabbage: 'Lahana',
      potato: 'Patates',
      leek: 'Pırasa',
      rabbit_haunch: 'Tavşan Budu',
      mammoth_snout: 'Mamut Hortumu',
      horker_meat: 'Horker Eti',
      travel_rations: 'Yol Azığı',
      water_skin: 'Su Matarası',
      alto_wine: 'Alto Şarabı',
      nord_mead: 'Nord Ballı Birası',
      black_briar_mead: 'Kara-Diken Ballı Birası',
      ale: 'Bira',
      milk: 'Süt',
      spiced_wine: 'Baharatlı Şarap',
      skooma: 'Skooma',
      health_potion_minor: 'Küçük Sağlık İksiri',
      health_potion_major: 'Bol Sağlık İksiri',
      magicka_potion_minor: 'Küçük Efsun İksiri',
      magicka_potion_major: 'Bol Efsun İksiri',
      stamina_potion_minor: 'Küçük Dayanıklılık İksiri',
      stamina_potion: 'Dayanıklılık İksiri',
      stamina_potion_major: 'Bol Dayanıklılık İksiri',
      bedroll: 'Uyku Tulumu',
      tent: 'Gezgin Çadırı',
      camping_kit: 'Kamp Seti',
      firewood: 'Odun Demeti',
      cooking_pot: 'Tencere',
      fur_blanket: 'Kürk Battaniye',
      torch: 'Meşale',
      lantern: 'Fener',
      lockpick: 'Maymuncuk',
      lockpick_bundle: 'Maymuncuk Demeti (10)',
      rope: 'Halat (50ft)',
      soul_gem_petty: 'Küçük Ruh Cevheri',
      soul_gem_lesser: 'Az Ruh Cevheri',
      soul_gem_common: 'Sıradan Ruh Cevheri',
      inkwell_quill: 'Hokka ve Tüy Kalem',
      journal_blank: 'Boş Günlük',
      map_skyrim: 'Skyrim Haritası',
      backpack: 'Gezgin Sırt Çantası',
      shovel: 'Kürek',
      pickaxe: 'Kazma',
      woodcutter_axe: 'Oduncu Baltası',
      blue_mountain_flower: 'Mavi Dağ Çiçeği',
      red_mountain_flower: 'Kırmızı Dağ Çiçeği',
      lavender: 'Lavanta',
      salt_pile: 'Tuz Yığını',
      garlic: 'Sarımsak',
      deathbell: 'Ölümçanı',
      nightshade: 'Güzelavrat Otu',
      giants_toe: 'Dev Parmağı',
      moon_sugar: 'Ay Şekeri',
      iron_ingot: 'Demir Külçe',
      steel_ingot: 'Çelik Külçe',
      mithril_ingot: 'Mithril Külçe',
      ebony_ingot: 'Ebon Külçe',
      daedric_core: 'Daedrik Öz',
      leather_strip: 'Deri Şerit',
      metal_scrap: 'Metal Hurda',
      // Unique Items from uniqueItemsService
      volendrung: 'Volendrung',
      mace_of_molag_bal: 'Molag Bal Topuzu',
      mehrunes_razor: 'Mehrunesin Hançeri',
      wabbajack: 'Wabbajack',
      blade_of_woe: 'Izdırap Bıçağı',
      chillrend: 'Buzkesen',
      nightingale_blade: 'Bülbül Bıçağı',
      staff_of_magnus: 'Magnusun Asası',
      wuuthrad: 'Wuuthrad',
      ebony_mail: 'Ebon Zırh (Efsunlu)',
      masque_of_clavicus: 'Clavicus Vilenin Maskesi',
      saviors_hide: 'Kurtarıcının Postu',
      ring_of_hircine: 'Hircinenin Yüzüğü',
      ring_of_namira: 'Namiranın Yüzüğü',
      nightingale_armor: 'Bülbül Zırhı',
      nightingale_boots: 'Bülbül Çizmesi',
      nightingale_gloves: 'Bülbül Eldiveni',
      nightingale_hood: 'Bülbül Kapüşonu',
      archmage_robes: 'Başbüyücü Cübbesi',
      morokei: 'Morokei',
      konahrik: 'Konahrik',
      krosis: 'Krosis',
      auriel_bow: 'Aurielin Yayı',
      miraak_robes: 'Miraakın Cübbesi',
      elder_scroll: 'Kadim Tomar',
      skeleton_key: 'İskelet Anahtar',
    },
    enchantment: {
      minor_flames: 'Ufak Alevli',
      frost: 'Buzlu',
      shock: 'Elektrikli',
      dread: 'Dehşet Verici',
      fiery_souls: 'Alevli Ruhlu',
      absorbing: 'Emici',
      chaos: 'Kaoslu',
      vampire: 'Vampirik',
    }
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
    } catch (e) { }
    return 'en'; // Default to English
  });

  // Save language preference
  useEffect(() => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (e) { }
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
let hasWarnedMissingProvider = false;

export const useLocalization = (): LocalizationContextType => {
  const context = useContext(LocalizationContext);
  if (!context) {
    if (!hasWarnedMissingProvider) {
      console.warn('useLocalization used without a provider - returning default localization values');
      hasWarnedMissingProvider = true;
    }
    // Provide a safe default to avoid runtime crashes when components are rendered outside of the provider
    return {
      language: 'en',
      setLanguage: () => { },
      t: (key: string, params?: Record<string, string | number>) => {
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
        if (typeof value !== 'string') return key;
        if (params) return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => (params[paramKey] !== undefined ? String(params[paramKey]) : `{{${paramKey}}}`));
        return value;
      },
      availableLanguages: AVAILABLE_LANGUAGES
    } as LocalizationContextType;
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
