
import { InventoryItem } from '../types';

export function getItemName(
    item: { baseId?: string; enchantmentId?: string; name: string },
    t: (key: string, params?: Record<string, string | number>) => string
): string {
    // Try to localize the base name
    let name = item.name;
    if (item.baseId) {
        // Strip out the special suffix if it exists (e.g. "iron_sword_special_...")
        const actualBaseId = item.baseId.split('_special_')[0];
        const key = `items.data.${actualBaseId}`;
        const localized = t(key);
        // If translation differs from key, use it
        if (localized !== key) {
            name = localized;
        }
    }

    // Handle enchantment suffix/prefix
    if (item.enchantmentId) {
        const enchantKey = `items.enchantment.${item.enchantmentId}`;
        const localizedEnchant = t(enchantKey);
        if (localizedEnchant !== enchantKey) {
            // Use a format string for composition (e.g. "{{item}} {{enchantment}}")
            // We assume standard English format "[Item] [Enchantment]" if no format is provided,
            // but ideally we have a specific key for this pattern.
            const format = t('items.enchantedItemFormat', { item: name, enchantment: localizedEnchant });
            if (format !== 'items.enchantedItemFormat') {
                return format;
            }
            return `${name} ${localizedEnchant}`;
        }
    }

    return name;
}
