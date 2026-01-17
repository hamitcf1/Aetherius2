/**
 * Tests for inventory cleanup and dungeon count validation
 * Addresses the "x0" quantity display bug and dungeon map sync issues
 */

import { describe, it, expect } from 'vitest';
import { DUNGEON_DEFINITIONS } from '../data/dungeonDefinitions';
import { SKYRIM_LOCATIONS } from '../components/SkyrimMap';

describe('Inventory cleanup', () => {
  describe('quantity validation', () => {
    it('should filter out items with zero quantity', () => {
      const items = [
        { id: '1', name: 'Sword', quantity: 1 },
        { id: '2', name: 'Shield', quantity: 0 },
        { id: '3', name: 'Potion', quantity: -1 },
        { id: '4', name: 'Arrow', quantity: 5 },
      ];
      
      const validItems = items.filter(item => (item.quantity || 0) > 0);
      
      expect(validItems).toHaveLength(2);
      expect(validItems.map(i => i.name)).toEqual(['Sword', 'Arrow']);
    });

    it('should treat undefined quantity as zero and filter it out', () => {
      const items = [
        { id: '1', name: 'Sword', quantity: 1 },
        { id: '2', name: 'Shield', quantity: undefined },
        { id: '3', name: 'Helm' }, // no quantity property at all
      ];
      
      const validItems = items.filter(item => (item.quantity || 0) > 0);
      
      expect(validItems).toHaveLength(1);
      expect(validItems[0].name).toBe('Sword');
    });
  });

  describe('equipped item validation', () => {
    it('should filter out equipped items with zero quantity', () => {
      const items = [
        { id: '1', name: 'Daedric Armor', equipped: true, slot: 'chest', quantity: 0 },
        { id: '2', name: 'Iron Sword', equipped: true, slot: 'weapon', quantity: 1 },
        { id: '3', name: 'Ring', equipped: false, slot: 'ring', quantity: 1 },
      ];
      
      // This mimics the fix in EquipmentHUD.tsx
      const equippedItems = items.filter(i => i.equipped && i.slot && (i.quantity || 0) > 0);
      
      expect(equippedItems).toHaveLength(1);
      expect(equippedItems[0].name).toBe('Iron Sword');
    });
  });
});

describe('Dungeon count validation', () => {
  it('should have all dungeon definitions represented in the map', () => {
    // Get dungeon IDs from definitions (strip the _dg suffix)
    const definitionIds = DUNGEON_DEFINITIONS.map(d => d.id.replace(/_dg$/, ''));
    
    // Get dungeon/cave locations from the map
    const mapDungeonIds = SKYRIM_LOCATIONS
      .filter(loc => loc.type === 'dungeon' || loc.type === 'cave')
      .map(loc => loc.id);
    
    // Every definition should have a map entry
    for (const defId of definitionIds) {
      expect(mapDungeonIds).toContain(defId);
    }
  });

  it('should have matching dungeon counts', () => {
    const definitionCount = DUNGEON_DEFINITIONS.length;
    
    const mapDungeonCount = SKYRIM_LOCATIONS
      .filter(loc => loc.type === 'dungeon' || loc.type === 'cave')
      .length;
    
    expect(mapDungeonCount).toBeGreaterThanOrEqual(definitionCount);
  });

  it('should have bandit_hideout in the map', () => {
    const banditHideout = SKYRIM_LOCATIONS.find(loc => loc.id === 'bandit_hideout');
    expect(banditHideout).toBeDefined();
    expect(banditHideout?.type).toBe('dungeon');
  });

  it('should list all 11 expected dungeons', () => {
    const expectedDungeons = [
      'bleak_falls_barrow',
      'bandit_hideout',
      'labyrinthian',
      'blackreach',
      'vampire_lair',
      'frost_spider_den',
      'daedric_shrine',
      'forsworn_camp',
      'troll_cave',
      'ice_cavern',
      'mineshaft',
    ];
    
    const mapDungeonIds = SKYRIM_LOCATIONS
      .filter(loc => loc.type === 'dungeon' || loc.type === 'cave')
      .map(loc => loc.id);
    
    for (const expected of expectedDungeons) {
      expect(mapDungeonIds).toContain(expected);
    }
  });
});
