import { SHOP_INVENTORY } from '../components/ShopModal';
import { generateLootEnchantment } from './enchantingService';

export interface SpecialShopItem extends Omit<any, 'price'> {
  id: string;
  name: string;
  type: string;
  description: string;
  price: number;
  requiredLevel?: number;
  rarity?: string;
  limited?: boolean;
  expiresAt?: number; // ms timestamp
  enchantment?: { enchantmentId: string; enchantmentName: string; magnitude: number; effect: string };
}

/**
 * Generate a small set of limited-time special shop offers tailored to the player's level.
 * Server-side games would randomize this; we emulate reasonably here.
 */
export function getShopSpecials(characterLevel: number, now: number = Date.now()): SpecialShopItem[] {
  const available = SHOP_INVENTORY.filter(i => i.type === 'weapon' || i.type === 'apparel' || i.category === 'Jewelry' || i.id.startsWith('staff') || i.id.startsWith('enchanted'));
  // Favor items near the player's level
  const candidates = available.filter(i => (i.requiredLevel || 1) <= Math.max(1, characterLevel + 5));
  const count = Math.max(1, Math.min(4, Math.floor(2 + Math.random() * 3)));
  const picked: SpecialShopItem[] = [];

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * candidates.length);
    const base = candidates[idx];
    if (!base) continue;

    // Price multiplier to ensure high cost (economics)
    const priceMul = 4 + Math.floor(Math.random() * 9); // 4x - 12x

    const special: SpecialShopItem = {
      ...base,
      id: `${base.id}_special_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
      price: Math.max(1, Math.floor((base.price || 10) * priceMul)),
      limited: true,
      expiresAt: now + (6 * 60 * 60 * 1000) + Math.floor(Math.random() * (72 * 60 * 60 * 1000)), // 6-78 hours
    };

    // 70% chance to be enchanted in specials
    if (Math.random() < 0.7) {
      const ench = generateLootEnchantment(base.name, base.type, Math.max(1, characterLevel));
      if (ench) {
        special.enchantment = ench;
        special.name = `${base.name} of ${ench.enchantmentName.replace(/^Fortify\s+/i, '')}`;
        special.description = `${base.description} (Temporarily enchanted with ${ench.enchantmentName})`;
        // Increase price a bit further based on magnitude
        special.price += Math.floor(ench.magnitude * 30);
      }
    }

    picked.push(special);
  }

  // Deduplicate by base name
  const unique = picked.reduce<SpecialShopItem[]>((acc, s) => acc.find(u => u.name === s.name) ? acc : [...acc, s], []);
  return unique;
}

export default { getShopSpecials };