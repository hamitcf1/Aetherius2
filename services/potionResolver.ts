import { InventoryItem } from '../types';

export type PotionStat = 'health' | 'magicka' | 'stamina';

// Centralized resolver for potion effects. Determines intended target stat and amount.
export const resolvePotionEffect = (item: InventoryItem): { stat?: PotionStat; amount?: number; reason?: string } => {
  if (!item || item.type !== 'potion') return { reason: 'not_a_potion' };

  // Determine stat (explicit subtype preferred, otherwise infer from name)
  let stat: PotionStat | undefined;
  if (item.subtype === 'health' || item.subtype === 'magicka' || item.subtype === 'stamina') {
    stat = item.subtype as PotionStat;
  } else {
    const name = (item.name || '').toLowerCase();
    const keywords: Record<PotionStat, string[]> = {
      health: ['health', 'heal', 'healing', 'vitality', 'hp'],
      magicka: ['magicka', 'mana', 'magick', 'spell'],
      stamina: ['stamina', 'endurance', 'energy', 'fatigue']
    };

    const matches: PotionStat[] = [];
    (Object.keys(keywords) as PotionStat[]).forEach(s => {
      for (const kw of keywords[s]) {
        if (name.includes(kw)) {
          matches.push(s);
          break;
        }
      }
    });

    if (matches.length === 1) {
      stat = matches[0];
    }
  }

  // Determine amount: prefer explicit item.damage, otherwise parse numeric value from description or name
  let amount: number | undefined = typeof item.damage === 'number' ? item.damage : undefined;
  if (amount == null) {
    const text = ((item.description || '') + ' ' + (item.name || '')).toLowerCase();
    const m = text.match(/(-?\d+(?:\.\d+)?)/);
    if (m) {
      const parsed = Number(m[1]);
      if (!Number.isNaN(parsed)) amount = parsed;
    }
  }

  if (stat && typeof amount === 'number') {
    const reason = item.subtype ? 'explicit_subtype' : 'inferred_from_name';
    return { stat, amount, reason };
  }

  // If we inferred the stat but couldn't find an explicit amount, provide sensible defaults
  if (stat && amount == null) {
    const name = (item.name || '').toLowerCase();
    // Common tiers: minor -> ~25, standard/unspecified -> ~50, major/plentiful -> ~100
    if (name.includes('minor') || name.includes('small')) {
      amount = 25;
    } else if (name.includes('major') || name.includes('plentiful') || name.includes('grand')) {
      amount = 100;
    } else {
      amount = 50;
    }
    const reason = item.subtype ? 'explicit_subtype_default_amount' : 'inferred_default_amount';
    return { stat, amount, reason };
  }

  return { reason: stat ? 'ambiguous_inference' : 'no_inference' };
};

export default resolvePotionEffect;
