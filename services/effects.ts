import { InventoryItem } from '../types';

// Centralized inference for potion stat intent.
// Priority: explicit `subtype`, item.type/subtype, name keywords, id prefix/suffix
export const inferPotionStat = (item: Partial<InventoryItem> | undefined): 'health' | 'magicka' | 'stamina' | null => {
  if (!item) return null;

  // 1. Explicit subtype field
  if (item.subtype && ['health', 'magicka', 'stamina'].includes(item.subtype)) {
    console.debug('[effect.infer] explicit subtype used', { id: item.id, name: item.name, subtype: item.subtype });
    return item.subtype as 'health' | 'magicka' | 'stamina';
  }

  // 2. Item category / type inference (if type indicates potion and subtype not present)
  if (item.type === 'potion' && item.subtype) {
    if (['health', 'magicka', 'stamina'].includes(item.subtype)) {
      console.debug('[effect.infer] category subtype used', { id: item.id, name: item.name, subtype: item.subtype });
      return item.subtype as 'health' | 'magicka' | 'stamina';
    }
  }

  const name = (item.name || '').toLowerCase();
  const id = (item.id || '').toLowerCase();

  // 3. Name keywords
  if (name.includes('stamina')) {
    console.debug('[effect.infer] name keyword -> stamina', { id: item.id, name: item.name });
    return 'stamina';
  }
  if (name.includes('magicka') || name.includes('mana')) {
    console.debug('[effect.infer] name keyword -> magicka', { id: item.id, name: item.name });
    return 'magicka';
  }
  if (name.includes('health') || name.includes('heal')) {
    console.debug('[effect.infer] name keyword -> health', { id: item.id, name: item.name });
    return 'health';
  }

  // 4. ID prefix/suffix
  // Example: pstamina_*, *_st, mag_*
  if (id.startsWith('stamina') || id.endsWith('_stamina') || id.startsWith('sta_') || id.endsWith('_st')) {
    console.debug('[effect.infer] id pattern -> stamina', { id: item.id, name: item.name });
    return 'stamina';
  }
  if (id.startsWith('magicka') || id.endsWith('_magicka') || id.startsWith('mag_') || id.endsWith('_mg')) {
    console.debug('[effect.infer] id pattern -> magicka', { id: item.id, name: item.name });
    return 'magicka';
  }
  if (id.startsWith('health') || id.endsWith('_health') || id.startsWith('hp_') || id.endsWith('_hp')) {
    console.debug('[effect.infer] id pattern -> health', { id: item.id, name: item.name });
    return 'health';
  }

  // Ambiguous: intentionally return null -> no fallback to health
  console.error('[effect.infer] unable to determine potion target stat', { id: item.id, name: item.name });
  return null;
};

export default inferPotionStat;
