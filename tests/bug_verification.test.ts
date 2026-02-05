
import { describe, it, expect } from 'vitest';
import { generatePlayerAbilities } from '../services/combatService';
import { Character, InventoryItem } from '../types';

describe('Bug Verification: Combat Abilities', () => {
    const mockCharacter: Character = {
        id: 'test-char',
        userId: 'test-user',
        name: 'Dragonborn',
        race: 'Nord',
        level: 10,
        skills: [
            { name: 'One-Handed', level: 15, xp: 0 },
            { name: 'Block', level: 15, xp: 0 },
            { name: 'Archery', level: 15, xp: 0 }
        ],
        perks: [],
        attributes: { health: 100, magicka: 100, stamina: 100 },
        inventory: [],
        equipment: {},
        gold: 0,
        created: Date.now(),
        lastPlayed: Date.now()
    };

    it('should generate "ranged" basic_attack when a Bow is equipped', () => {
        const bowItem: InventoryItem = {
            id: 'bow-1',
            name: 'Hunting Bow',
            type: 'weapon',
            equipped: true,
            slot: 'weapon',
            damage: 12,
            value: 50,
            weight: 5
        };

        const abilities = generatePlayerAbilities(mockCharacter, [bowItem]);
        const basicAttack = abilities.find(a => a.id === 'basic_attack');

        expect(basicAttack).toBeDefined();
        expect(basicAttack?.type).toBe('ranged');
        expect(basicAttack?.name).toContain('Strike with Hunting Bow');
    });

    it('should generate "melee" basic_attack when a Sword is equipped', () => {
        const swordItem: InventoryItem = {
            id: 'sword-1',
            name: 'Iron Sword',
            type: 'weapon',
            equipped: true,
            slot: 'weapon',
            damage: 10,
            value: 25,
            weight: 10
        };

        const abilities = generatePlayerAbilities(mockCharacter, [swordItem]);
        const basicAttack = abilities.find(a => a.id === 'basic_attack');

        expect(basicAttack).toBeDefined();
        expect(basicAttack?.type).toBe('melee');
    });

    it('should generate "utility" Shield Wall ability when Block skill is high', () => {
        const shieldItem: InventoryItem = {
            id: 'shield-1',
            name: 'Iron Shield',
            type: 'armor',
            subtype: 'shield', // Important for recognition
            equipped: true,
            slot: 'offhand',
            value: 15,
            weight: 12,
            armor: 20 // Required for shield calculation
        };

        const skilledChar = {
            ...mockCharacter,
            skills: [{ name: 'Block', level: 40, xp: 0 }]
        };

        // Pass the shield in equipment array
        const abilities = generatePlayerAbilities(skilledChar, [shieldItem]);
        const shieldWall = abilities.find(a => a.id === 'shield_wall');

        expect(shieldWall).toBeDefined();
        expect(shieldWall?.type).toBe('utility'); // The fix changed this from 'melee'
    });
});
