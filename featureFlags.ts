/**
 * Feature Flags Configuration
 * 
 * Toggle features on/off easily during development.
 * Set to `false` to disable a feature, `true` to enable.
 * 
 * Features marked as WIP will show a badge in the UI.
 */

// Admin user IDs (Firebase UIDs) - only these accounts can see admin features
const ADMIN_UIDS: string[] = ['6bmF8elZmJai6F5XCxeWoM7zTZv1'
  // Add your Firebase UID here, e.g.:
  // 'abc123xyz456',
];

// Current user ID - set this from the auth context
let currentUserId: string | null = null;

export const setCurrentUser = (uid: string | null) => {
  currentUserId = uid;
};

export const isAdmin = (): boolean => {
  return currentUserId !== null && ADMIN_UIDS.includes(currentUserId);
};

export interface FeatureFlag {
  enabled: boolean;
  wip?: boolean; // Show "Work in Progress" badge
  label?: string; // Display label for WIP badge
  adminOnly?: boolean; // Only visible to admin accounts
}

export const FEATURES = {
  // === CORE FEATURES ===
  shop: { enabled: true, wip: false },
  survival: { enabled: true, wip: false },
  adventure: { enabled: true, wip: false },
  story: { enabled: true, wip: false },
  journal: { enabled: true, wip: false },
  quests: { enabled: true, wip: false },
  inventory: { enabled: true, wip: false },

  // === PROGRESSION ===
  timeProgression: { enabled: true, wip: false },
  needsSystem: { enabled: true, wip: false },
  restSystem: { enabled: true, wip: false },
  campingGear: { enabled: true, wip: false },

  // === AI FEATURES ===
  aiScribe: { enabled: true, wip: false },
  aiCharacterGeneration: { enabled: true, wip: false },
  aiProfileImage: { enabled: false, wip: true, label: 'Coming Soon' },
  gemmaModels: { enabled: true, wip: false },

  // === CHARACTER MANAGEMENT ===
  characterDeath: { enabled: true, wip: false },
  profileDeletion: { enabled: true, wip: false },
  characterDeletion: { enabled: true, wip: false },
  
  // === UI/UX ===
  onboarding: { enabled: true, wip: false },
  snowEffect: { enabled: true, wip: false, label: 'Coming Soon' },
  exportPDF: { enabled: true, wip: false, label: 'Coming Soon' },
  photoUpload: { enabled: false, wip: true, label: 'Coming Soon' },

  // === EXPERIMENTAL ===
  multiplayerPresence: { enabled: false, wip: true, label: 'Experimental' },

  // === ADMIN ONLY (only visible when logged in as admin) ===
  debugPanel: { enabled: true, wip: false, adminOnly: true },
  testFeatures: { enabled: true, wip: false, adminOnly: true },
  adminTools: { enabled: true, wip: false, adminOnly: true },
} as const satisfies Record<string, FeatureFlag>;

// Helper to check if a feature is enabled (respects adminOnly)
export const isFeatureEnabled = (feature: keyof typeof FEATURES): boolean => {
  const f = FEATURES[feature] as FeatureFlag;
  if (!f) return false;
  if (f.adminOnly && !isAdmin()) return false;
  return f.enabled;
};

// Helper to check if a feature is WIP
export const isFeatureWIP = (feature: keyof typeof FEATURES): boolean => {
  return FEATURES[feature]?.wip ?? false;
};

// Helper to get WIP label
export const getFeatureLabel = (feature: keyof typeof FEATURES): string | undefined => {
  const f = FEATURES[feature] as FeatureFlag;
  return f?.label;
};

// Type for feature keys
export type FeatureKey = keyof typeof FEATURES;
