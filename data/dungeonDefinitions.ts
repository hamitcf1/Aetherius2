import { DungeonDefinition, DungeonNode, LootRarity, CombatEnemy } from '../types';

// Small helper to create simple combat enemies for definitions
const simpleEnemy = (id: string, name: string, type: CombatEnemy['type'], level: number, hp: number, damage: number, xp: number, gold?: number, isBoss = false): CombatEnemy => ({
  id,
  name,
  type,
  level,
  maxHealth: hp,
  currentHealth: hp,
  armor: Math.floor(level * 2),
  damage,
  abilities: [],
  xpReward: xp,
  goldReward: gold,
  behavior: 'aggressive',
  isBoss
});

// NOTE: These definitions are intentionally data-focused and small. Gameplay scaling and
// final tuning occurs in the dungeon service and combat integration.
// UPDATED: All dungeons now have extensive branching paths with 3+ branches at each junction

export const DUNGEON_DEFINITIONS: DungeonDefinition[] = [
  {
    id: 'bleak_falls_barrow_dg',
    name: 'Bleak Falls Barrow',
    description: 'An ancient Nordic tomb infested with draugr and minor bandits.',
    location: 'Bleak Falls Barrow',
    difficulty: 'easy',
    recommendedLevel: 1,
    theme: 'nordic_tomb',
    ambientDescription: 'Cold stone halls. The air tastes old and metal-rich.',
    startNodeId: 'bfb_start',
    bossNodeId: 'bfb_boss',
    completionRewards: { gold: 120, xp: 300, items: [{ name: 'Golden Claw (trinket)', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      // Row 0: Start
      { id: 'bfb_start', type: 'start', name: 'Entrance Hall', x: 5, y: 50, connections: ['bfb_event1', 'bfb_combat1', 'bfb_empty1'] },
      // Row 1: Three paths
      { id: 'bfb_event1', type: 'event', name: 'Suspicious Altar', x: 20, y: 20, connections: ['bfb_combat2', 'bfb_rest1'], eventText: 'A strange altar hums with energy.', eventChoices: [{ label: 'Touch', outcome: 'reward', value: 25 }, { label: 'Smash', outcome: 'damage', value: 10 }] },
      { id: 'bfb_combat1', type: 'combat', name: 'Bandit Ambush', description: 'A small band of raiders.', x: 20, y: 50, connections: ['bfb_rest1', 'bfb_combat2', 'bfb_reward1'], enemies: [simpleEnemy('b1','Bandit Vagrant','humanoid',1,30,6,40,10), simpleEnemy('b2','Bandit Thug','humanoid',1,25,5,30,8)] },
      { id: 'bfb_empty1', type: 'empty', name: 'Dusty Corridor', x: 20, y: 80, connections: ['bfb_reward1', 'bfb_combat3'] },
      // Row 2: Mix of types with cross-connections
      { id: 'bfb_combat2', type: 'combat', name: 'Draugr Patrol', x: 40, y: 15, connections: ['bfb_elite1', 'bfb_rest2'], enemies: [simpleEnemy('d1','Draugr','undead',2,45,8,60,15), simpleEnemy('d2','Restless Draugr','undead',1,35,6,45,10)] },
      { id: 'bfb_rest1', type: 'rest', name: 'Hidden Alcove', x: 40, y: 35, connections: ['bfb_elite1', 'bfb_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'bfb_reward1', type: 'reward', name: 'Burial Urn', x: 40, y: 65, connections: ['bfb_event2', 'bfb_combat4'], rewards: { gold: 35, items: [{ name: 'Ancient Nord Arrow', type: 'ammo', quantity: 5, rarity: 'common' }] } },
      { id: 'bfb_combat3', type: 'combat', name: 'Spider Nest', x: 40, y: 85, connections: ['bfb_combat4', 'bfb_rest2'], enemies: [simpleEnemy('sp1','Frostbite Spider','beast',1,25,5,35,8), simpleEnemy('sp2','Spiderling','beast',1,15,3,20,5), simpleEnemy('sp3','Spiderling','beast',1,15,3,20,5)] },
      // Row 3: Convergence toward elite
      { id: 'bfb_elite1', type: 'elite', name: 'Draugr Overlord', x: 60, y: 25, connections: ['bfb_event3', 'bfb_rest3'], enemies: [simpleEnemy('do1','Draugr Overlord','undead',3,80,14,100,30), simpleEnemy('do2','Draugr Thrall','undead',2,40,7,50,15)] },
      { id: 'bfb_event2', type: 'event', name: 'Collapsed Passage', x: 60, y: 50, connections: ['bfb_rest3', 'bfb_combat5'], eventText: 'Rubble blocks the way. You might find something useful.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 30 }, { label: 'Force through', outcome: 'damage', value: 15 }] },
      { id: 'bfb_combat4', type: 'combat', name: 'Skeevers', x: 60, y: 75, connections: ['bfb_combat5', 'bfb_reward2'], enemies: [simpleEnemy('sk1','Skeever','beast',1,20,4,25,5), simpleEnemy('sk2','Skeever','beast',1,20,4,25,5)] },
      { id: 'bfb_rest2', type: 'rest', name: 'Warm Spring', x: 60, y: 95, connections: ['bfb_reward2'], restAmount: { health: 25, magicka: 15, stamina: 20 } },
      // Row 4: Pre-boss area
      { id: 'bfb_event3', type: 'event', name: 'Word Wall', x: 75, y: 20, connections: ['bfb_boss'], eventText: 'Ancient words echo in your mind...', eventChoices: [{ label: 'Meditate', outcome: 'reward', value: 50 }] },
      { id: 'bfb_rest3', type: 'rest', name: 'Sanctuary', x: 75, y: 40, connections: ['bfb_boss'], restAmount: { health: 30, magicka: 20, stamina: 25 } },
      { id: 'bfb_combat5', type: 'combat', name: 'Draugr Guards', x: 75, y: 60, connections: ['bfb_boss'], enemies: [simpleEnemy('dg1','Draugr','undead',2,40,8,50,12), simpleEnemy('dg2','Draugr','undead',2,40,8,50,12)] },
      { id: 'bfb_reward2', type: 'reward', name: 'Ancient Chest', x: 75, y: 85, connections: ['bfb_boss'], rewards: { gold: 60, items: [{ name: 'Nordic Dagger', type: 'weapon', quantity: 1, rarity: 'uncommon' }] } },
      // Boss - now with minions
      { id: 'bfb_boss', type: 'boss', name: 'Draugr Death Overlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('bw1','Draugr Death Overlord','undead',4,150,18,200,60,true), simpleEnemy('bw2','Draugr Wight','undead',2,45,8,50,15), simpleEnemy('bw3','Draugr Wight','undead',2,45,8,50,15)] }
    ]
  },

  {
    id: 'bandit_hideout_dg',
    name: 'Bandit Hideout',
    description: 'A network of crude camps and traps inhabited by bandits.',
    location: 'Helgen',
    difficulty: 'medium',
    recommendedLevel: 3,
    theme: 'bandit_hideout',
    ambientDescription: 'Low tents and smoky torches. Loose gravel crunches underfoot.',
    startNodeId: 'bh_start',
    bossNodeId: 'bh_boss',
    completionRewards: { gold: 240, xp: 500, items: [{ name: 'Worn Bandit Helm', type: 'apparel', quantity: 1, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'bh_start', type: 'start', name: 'Camp Entrance', x: 5, y: 50, connections: ['bh_combat1', 'bh_event1', 'bh_empty1', 'bh_combat2'] },
      { id: 'bh_combat1', type: 'combat', name: 'Patrol', x: 20, y: 15, connections: ['bh_elite1', 'bh_reward1'], enemies: [simpleEnemy('bb1','Bandit', 'humanoid', 2, 55, 10, 80, 20), simpleEnemy('bb2','Bandit Lookout', 'humanoid', 2, 45, 8, 60, 15)] },
      { id: 'bh_event1', type: 'event', name: 'Tinder Pile', x: 20, y: 35, connections: ['bh_reward1', 'bh_rest1'], eventText: 'Supplies under a tarp.', eventChoices: [{ label: 'Check', outcome: 'reward', value: 40 }] },
      { id: 'bh_empty1', type: 'empty', name: 'Empty Tent', x: 20, y: 65, connections: ['bh_rest1', 'bh_combat3'] },
      { id: 'bh_combat2', type: 'combat', name: 'Guard Dogs', x: 20, y: 85, connections: ['bh_combat3', 'bh_event2'], enemies: [simpleEnemy('dog1','War Dog','beast',2,40,8,50,10), simpleEnemy('dog2','War Dog','beast',2,40,8,50,10)] },
      { id: 'bh_elite1', type: 'elite', name: 'Bandit Chief', x: 40, y: 10, connections: ['bh_rest2', 'bh_event3'], enemies: [simpleEnemy('bc1','Bandit Chief','humanoid',4,100,16,150,40)] },
      { id: 'bh_reward1', type: 'reward', name: 'Stolen Goods', x: 40, y: 30, connections: ['bh_rest2', 'bh_combat4'], rewards: { gold: 80, items: [{ name: 'Lockpick', type: 'misc', quantity: 3, rarity: 'common' }] } },
      { id: 'bh_rest1', type: 'rest', name: 'Prisoner Cell', x: 40, y: 50, connections: ['bh_combat4', 'bh_event3'], restAmount: { health: 25, stamina: 20 } },
      { id: 'bh_combat3', type: 'combat', name: 'Thugs', x: 40, y: 70, connections: ['bh_event3', 'bh_reward2'], enemies: [simpleEnemy('bt1','Bandit Thug','humanoid',3,70,12,90,25)] },
      { id: 'bh_event2', type: 'event', name: 'Trap Room', x: 40, y: 90, connections: ['bh_reward2'], eventText: 'Pressure plates everywhere...', eventChoices: [{ label: 'Careful', outcome: 'reward', value: 50 }, { label: 'Rush', outcome: 'damage', value: 25 }] },
      { id: 'bh_rest2', type: 'rest', name: 'Safe Corner', x: 60, y: 20, connections: ['bh_combat5', 'bh_elite2'], restAmount: { health: 30, magicka: 15, stamina: 25 } },
      { id: 'bh_combat4', type: 'combat', name: 'Archers', x: 60, y: 40, connections: ['bh_elite2', 'bh_event4'], enemies: [simpleEnemy('ba1','Bandit Archer','humanoid',3,50,10,70,20), simpleEnemy('ba2','Bandit Archer','humanoid',3,50,10,70,20)] },
      { id: 'bh_event3', type: 'event', name: 'Hostage', x: 60, y: 60, connections: ['bh_event4', 'bh_combat6'], eventText: 'A prisoner begs for help.', eventChoices: [{ label: 'Free', outcome: 'reward', value: 30 }, { label: 'Ignore', outcome: 'nothing' }] },
      { id: 'bh_reward2', type: 'reward', name: 'Hidden Cache', x: 60, y: 80, connections: ['bh_combat6'], rewards: { gold: 60, items: [{ name: 'Health Potion', type: 'potion', quantity: 2, rarity: 'common' }] } },
      { id: 'bh_combat5', type: 'combat', name: 'Elite Guards', x: 75, y: 25, connections: ['bh_boss'], enemies: [simpleEnemy('eg1','Bandit Marauder','humanoid',4,90,14,120,35)] },
      { id: 'bh_elite2', type: 'elite', name: 'Bandit Plunderer', x: 75, y: 45, connections: ['bh_boss'], enemies: [simpleEnemy('bp1','Bandit Plunderer','humanoid',5,120,18,180,50)] },
      { id: 'bh_event4', type: 'event', name: 'Armory', x: 75, y: 65, connections: ['bh_boss'], eventText: 'Weapons rack with various arms.', eventChoices: [{ label: 'Arm up', outcome: 'reward', value: 40 }] },
      { id: 'bh_combat6', type: 'combat', name: 'Last Stand', x: 75, y: 85, connections: ['bh_boss'], enemies: [simpleEnemy('ls1','Bandit Outlaw','humanoid',3,60,11,80,25), simpleEnemy('ls2','Bandit','humanoid',2,50,9,60,20)] },
      { id: 'bh_boss', type: 'boss', name: 'Bandit Warlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('bboss','Bandit Warlord','humanoid',6,300,36,600,150,true), simpleEnemy('bboss2','Bandit Marauder','humanoid',4,100,18,120,40), simpleEnemy('bboss3','Bandit Thug','humanoid',3,80,14,90,30)] }
    ]
  },

  {
    id: 'labyrinthian_dg',
    name: 'Labyrinthian Ruins',
    description: 'Twisting corridors with ancient guardians.',
    location: 'Labyrinthian',
    difficulty: 'hard',
    recommendedLevel: 8,
    minimumLevel: 5,
    theme: 'dwemer_ruin',
    ambientDescription: 'Echoing halls and rune-carved stone.',
    startNodeId: 'lab_start',
    bossNodeId: 'lab_boss',
    completionRewards: { gold: 480, xp: 1200, items: [{ name: 'Staff Fragment', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'lab_start', type: 'start', name: 'Outer Gate', x: 5, y: 50, connections: ['lab_combat1', 'lab_event1', 'lab_empty1', 'lab_reward1'] },
      { id: 'lab_combat1', type: 'combat', name: 'Automaton Sentry', x: 18, y: 10, connections: ['lab_elite1', 'lab_rest1'], enemies: [simpleEnemy('da1','Dwemer Sphere','automaton',7,180,24,350,70), simpleEnemy('da2','Dwemer Spider','automaton',5,80,14,150,30)] },
      { id: 'lab_event1', type: 'event', name: 'Unstable Runestone', x: 18, y: 35, connections: ['lab_rest1', 'lab_combat2'], eventText: 'A runestone hums with power.', eventChoices: [{ label: 'Invoke', outcome: 'damage', value: 40 }, { label: 'Harness', outcome: 'reward', value: 90 }] },
      { id: 'lab_empty1', type: 'empty', name: 'Dusty Hall', x: 18, y: 65, connections: ['lab_combat2', 'lab_event2'] },
      { id: 'lab_reward1', type: 'reward', name: 'Lofted Chest', x: 18, y: 90, connections: ['lab_event2', 'lab_combat3'], rewards: { gold: 100, items: [{ name: 'Dwemer Cog', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'lab_elite1', type: 'elite', name: 'Centurion Guardian', x: 35, y: 15, connections: ['lab_rest2', 'lab_combat4'], enemies: [simpleEnemy('cg1','Dwemer Centurion','automaton',9,300,40,700,150), simpleEnemy('cg2','Dwemer Spider','automaton',5,80,14,150,30), simpleEnemy('cg3','Dwemer Spider','automaton',5,80,14,150,30)] },
      { id: 'lab_rest1', type: 'rest', name: 'Ancient Library', x: 35, y: 30, connections: ['lab_combat4', 'lab_event3'], restAmount: { health: 35, magicka: 30, stamina: 30 } },
      { id: 'lab_combat2', type: 'combat', name: 'Spider Workers', x: 35, y: 50, connections: ['lab_event3', 'lab_reward2'], enemies: [simpleEnemy('sw1','Dwemer Spider','automaton',6,100,18,200,40), simpleEnemy('sw2','Dwemer Spider','automaton',6,100,18,200,40), simpleEnemy('sw3','Dwemer Spider','automaton',5,80,14,150,30)] },
      { id: 'lab_event2', type: 'event', name: 'Lever Puzzle', x: 35, y: 70, connections: ['lab_reward2', 'lab_combat5'], eventText: 'Three levers control the gates.', eventChoices: [{ label: 'Solve', outcome: 'reward', value: 120 }, { label: 'Force', outcome: 'damage', value: 50 }] },
      { id: 'lab_combat3', type: 'combat', name: 'Falmer Scouts', x: 35, y: 90, connections: ['lab_combat5'], enemies: [simpleEnemy('fs1','Falmer','humanoid',7,150,22,320,60), simpleEnemy('fs2','Falmer Scout','humanoid',6,120,18,260,45)] },
      { id: 'lab_rest2', type: 'rest', name: 'Hot Springs', x: 52, y: 20, connections: ['lab_elite2', 'lab_event4'], restAmount: { health: 40, magicka: 35, stamina: 35 } },
      { id: 'lab_combat4', type: 'combat', name: 'Ballistae', x: 52, y: 35, connections: ['lab_elite2', 'lab_combat6'], enemies: [simpleEnemy('bal1','Dwemer Ballista','automaton',8,200,30,450,90), simpleEnemy('bal2','Dwemer Spider','automaton',5,80,14,150,30)] },
      { id: 'lab_event3', type: 'event', name: 'Tonal Lock', x: 52, y: 50, connections: ['lab_combat6', 'lab_reward3'], eventText: 'Musical tones echo in sequence.', eventChoices: [{ label: 'Repeat', outcome: 'reward', value: 100 }] },
      { id: 'lab_reward2', type: 'reward', name: 'Resonator Core', x: 52, y: 65, connections: ['lab_reward3', 'lab_rest3'], rewards: { gold: 150, items: [{ name: 'Soul Gem (Greater)', type: 'misc', quantity: 1, rarity: 'rare' }] } },
      { id: 'lab_combat5', type: 'combat', name: 'Chaurus', x: 52, y: 85, connections: ['lab_rest3'], enemies: [simpleEnemy('ch1','Chaurus','beast',7,140,20,280,55), simpleEnemy('ch2','Chaurus Hunter','beast',8,160,25,350,70)] },
      { id: 'lab_elite2', type: 'elite', name: 'Rune Warden', x: 70, y: 25, connections: ['lab_event5', 'lab_boss'], enemies: [simpleEnemy('rw1','Rune Warden','automaton',9,360,48,900,200), simpleEnemy('rw2','Dwemer Sphere','automaton',6,140,20,280,55)] },
      { id: 'lab_combat6', type: 'combat', name: 'Sphere Squadron', x: 70, y: 45, connections: ['lab_event5', 'lab_boss'], enemies: [simpleEnemy('ss1','Dwemer Sphere','automaton',7,180,24,350,70), simpleEnemy('ss2','Dwemer Sphere','automaton',7,180,24,350,70), simpleEnemy('ss3','Dwemer Spider','automaton',5,80,14,150,30)] },
      { id: 'lab_reward3', type: 'reward', name: 'Research Cache', x: 70, y: 60, connections: ['lab_boss'], rewards: { gold: 200, items: [{ name: 'Dwemer Schematic', type: 'misc', quantity: 1, rarity: 'epic' }] } },
      { id: 'lab_rest3', type: 'rest', name: 'Hidden Sanctuary', x: 70, y: 80, connections: ['lab_boss'], restAmount: { health: 50, magicka: 40, stamina: 45 } },
      { id: 'lab_event4', type: 'event', name: 'Power Core', x: 85, y: 30, connections: ['lab_boss'], eventText: 'A glowing core pulses with energy.', eventChoices: [{ label: 'Absorb', outcome: 'reward', value: 150 }, { label: 'Destroy', outcome: 'damage', value: 60 }] },
      { id: 'lab_event5', type: 'event', name: 'Pressure Hallway', x: 85, y: 45, connections: ['lab_boss'], eventText: 'Blades spin in the corridor ahead.', eventChoices: [{ label: 'Time it', outcome: 'nothing' }, { label: 'Sprint', outcome: 'damage', value: 40 }] },
      { id: 'lab_boss', type: 'boss', name: 'Ancient Constructor', x: 95, y: 50, connections: [], enemies: [simpleEnemy('labboss','Ancient Constructor','automaton',12,900,80,2400,400,true), simpleEnemy('labboss2','Dwemer Centurion','automaton',8,250,35,500,100), simpleEnemy('labboss3','Dwemer Sphere','automaton',6,140,20,280,55)] }
    ]
  },

  {
    id: 'blackreach_dg', name: 'Blackreach Depths', description: 'A cavern of bioluminescent fungi and Falmer hunters.', location: 'Blackreach', difficulty: 'hard', recommendedLevel: 7, minimumLevel: 4, theme: 'ice_cave', ambientDescription: 'A cold vast cavern with glows on the stone.', startNodeId: 'br_start', bossNodeId: 'br_boss', completionRewards: { gold: 340, xp: 900, items: [{ name: 'Crimson Nirnroot', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'br_start', type: 'start', name: 'Sunken Entry', x: 5, y: 50, connections: ['br_combat1', 'br_event1', 'br_empty1'] },
      { id: 'br_combat1', type: 'combat', name: 'Falmer Patrol', x: 20, y: 20, connections: ['br_rest1', 'br_combat2'], enemies: [simpleEnemy('f1','Falmer Scout','humanoid',6,140,18,260,40), simpleEnemy('f2','Falmer','humanoid',5,120,16,220,35)] },
      { id: 'br_event1', type: 'event', name: 'Glowing Mushrooms', x: 20, y: 50, connections: ['br_combat2', 'br_reward1'], eventText: 'Strange glowing fungi.', eventChoices: [{ label: 'Harvest', outcome: 'reward', value: 60 }] },
      { id: 'br_empty1', type: 'empty', name: 'Fungal Basin', x: 20, y: 80, connections: ['br_reward1', 'br_combat3'] },
      { id: 'br_rest1', type: 'rest', name: 'Warm Spring', x: 40, y: 15, connections: ['br_elite1', 'br_event2'], restAmount: { health: 30, magicka: 25 } },
      { id: 'br_combat2', type: 'combat', name: 'Chaurus Nest', x: 40, y: 35, connections: ['br_elite1', 'br_event2'], enemies: [simpleEnemy('ch1','Chaurus','beast',6,120,16,220,45), simpleEnemy('ch2','Chaurus Reaper','beast',5,100,14,180,35)] },
      { id: 'br_reward1', type: 'reward', name: 'Sack in Roots', x: 40, y: 60, connections: ['br_event2', 'br_combat4'], rewards: { gold: 70, items: [{ name: 'Ectoplasm', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'br_combat3', type: 'combat', name: 'Frostbite Spiders', x: 40, y: 85, connections: ['br_combat4', 'br_rest2'], enemies: [simpleEnemy('sp1','Giant Frostbite Spider','beast',5,100,14,180,35), simpleEnemy('sp2','Frostbite Spider','beast',4,70,10,120,25), simpleEnemy('sp3','Frostbite Spider','beast',4,70,10,120,25)] },
      { id: 'br_elite1', type: 'elite', name: 'Falmer Shadowmaster', x: 60, y: 20, connections: ['br_rest3', 'br_boss'], enemies: [simpleEnemy('fsm','Falmer Shadowmaster','humanoid',8,280,32,650,120), simpleEnemy('fsm2','Falmer Skulker','humanoid',6,140,18,260,45)] },
      { id: 'br_event2', type: 'event', name: 'Dwarven Lift', x: 60, y: 45, connections: ['br_rest3', 'br_combat5'], eventText: 'An ancient lift mechanism.', eventChoices: [{ label: 'Activate', outcome: 'reward', value: 80 }, { label: 'Bypass', outcome: 'nothing' }] },
      { id: 'br_combat4', type: 'combat', name: 'Falmer Hunters', x: 60, y: 65, connections: ['br_combat5', 'br_reward2'], enemies: [simpleEnemy('fh1','Falmer','humanoid',6,140,18,260,40), simpleEnemy('fh2','Falmer','humanoid',6,140,18,260,40)] },
      { id: 'br_rest2', type: 'rest', name: 'Hidden Grotto', x: 60, y: 90, connections: ['br_reward2'], restAmount: { health: 35, stamina: 30 } },
      { id: 'br_rest3', type: 'rest', name: 'Crystal Chamber', x: 75, y: 25, connections: ['br_boss'], restAmount: { health: 40, magicka: 35, stamina: 35 } },
      { id: 'br_combat5', type: 'combat', name: 'Deep Stalkers', x: 75, y: 50, connections: ['br_boss'], enemies: [simpleEnemy('ds1','Deep Hunter','humanoid',9,360,36,820,160), simpleEnemy('ds2','Falmer Skulker','humanoid',6,140,18,260,45)] },
      { id: 'br_reward2', type: 'reward', name: 'Falmer Hoard', x: 75, y: 75, connections: ['br_boss'], rewards: { gold: 120, items: [{ name: 'Falmer Ear', type: 'misc', quantity: 3, rarity: 'uncommon' }] } },
      { id: 'br_boss', type: 'boss', name: 'Falmer Chieftain', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Falmer Chieftain','humanoid',11,820,64,2000,300,true), simpleEnemy('fboss2','Falmer Warmonger','humanoid',8,280,32,650,120), simpleEnemy('fboss3','Chaurus Hunter','beast',7,140,20,280,55)] }
    ]
  },

  {
    id: 'vampire_lair_dg', name: 'Vampire Lair', description: 'A dark lair saturated with blood magics.', location: 'Morthal', difficulty: 'medium', recommendedLevel: 5, theme: 'vampire_lair', ambientDescription: 'Dark halls with crimson sigils.', startNodeId: 'vl_start', bossNodeId: 'vl_boss', completionRewards: { gold: 260, xp: 700, items: [{ name: 'Bloodstone Shard', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'vl_start', type: 'start', name: 'Stained Vestibule', x: 5, y: 50, connections: ['vl_combat1', 'vl_event1', 'vl_empty1'] },
      { id: 'vl_combat1', type: 'combat', name: 'Thrall Ambush', x: 20, y: 20, connections: ['vl_rest1', 'vl_combat2'], enemies: [simpleEnemy('vt1','Vampire Thrall','undead',4,120,16,220,45), simpleEnemy('vt2','Enthralled Peasant','undead',3,80,12,150,30)] },
      { id: 'vl_event1', type: 'event', name: 'Blood Fountain', x: 20, y: 50, connections: ['vl_combat2', 'vl_reward1'], eventText: 'A fountain of blood bubbles.', eventChoices: [{ label: 'Drink', outcome: 'damage', value: 20 }, { label: 'Avoid', outcome: 'nothing' }] },
      { id: 'vl_empty1', type: 'empty', name: 'Dusty Crypt', x: 20, y: 80, connections: ['vl_reward1', 'vl_combat3'] },
      { id: 'vl_rest1', type: 'rest', name: 'Hidden Chamber', x: 40, y: 15, connections: ['vl_elite1', 'vl_event2'], restAmount: { health: 25, magicka: 20 } },
      { id: 'vl_combat2', type: 'combat', name: 'Vampire Spawn', x: 40, y: 35, connections: ['vl_elite1', 'vl_event2'], enemies: [simpleEnemy('vs1','Vampire Spawn','undead',5,140,18,280,55), simpleEnemy('vs2','Vampire Fledgling','undead',4,100,14,200,40)] },
      { id: 'vl_reward1', type: 'reward', name: 'Coffin Cache', x: 40, y: 60, connections: ['vl_event2', 'vl_combat4'], rewards: { gold: 80, items: [{ name: 'Vampire Dust', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'vl_combat3', type: 'combat', name: 'Death Hounds', x: 40, y: 85, connections: ['vl_combat4', 'vl_rest2'], enemies: [simpleEnemy('dh1','Death Hound','beast',4,100,14,180,35), simpleEnemy('dh2','Death Hound','beast',4,100,14,180,35), simpleEnemy('dh3','Death Hound Pup','beast',3,60,10,100,20)] },
      { id: 'vl_elite1', type: 'elite', name: 'Master Vampire', x: 60, y: 20, connections: ['vl_event3', 'vl_boss'], enemies: [simpleEnemy('mv1','Master Vampire','undead',7,260,28,540,100), simpleEnemy('mv2','Vampire Thrall','undead',4,120,16,220,45)] },
      { id: 'vl_event2', type: 'event', name: 'Blood Altar', x: 60, y: 45, connections: ['vl_event3', 'vl_combat5'], eventText: 'An altar hums. Sacrifice may grant power.', eventChoices: [{ label: 'Offer', outcome: 'reward', value: 80 }, { label: 'Refuse', outcome: 'nothing' }] },
      { id: 'vl_combat4', type: 'combat', name: 'Vampire Nightstalker', x: 60, y: 65, connections: ['vl_combat5', 'vl_reward2'], enemies: [simpleEnemy('vn1','Vampire Nightstalker','undead',6,180,22,360,70), simpleEnemy('vn2','Vampire Thrall','undead',4,120,16,220,45)] },
      { id: 'vl_rest2', type: 'rest', name: 'Safe Corner', x: 60, y: 90, connections: ['vl_reward2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'vl_event3', type: 'event', name: 'Enchanting Table', x: 75, y: 25, connections: ['vl_boss'], eventText: 'A dark enchanting table.', eventChoices: [{ label: 'Use', outcome: 'reward', value: 60 }] },
      { id: 'vl_combat5', type: 'combat', name: 'Gargoyles', x: 75, y: 50, connections: ['vl_boss'], enemies: [simpleEnemy('gar1','Gargoyle','beast',6,200,24,400,80), simpleEnemy('gar2','Gargoyle Brute','beast',5,150,20,320,60)] },
      { id: 'vl_reward2', type: 'reward', name: 'Blood Treasury', x: 75, y: 75, connections: ['vl_boss'], rewards: { gold: 120, items: [{ name: 'Ring of Blood Magic', type: 'apparel', quantity: 1, rarity: 'rare' }] } },
      { id: 'vl_boss', type: 'boss', name: 'Vampire Matriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('vmb','Vampire Matriarch','undead',10,600,54,1500,220,true), simpleEnemy('vmb2','Death Hound','beast',4,100,14,180,35), simpleEnemy('vmb3','Vampire Mistwalker','undead',6,180,22,360,70)] }
    ]
  },

  {
    id: 'frost_spider_den_dg', name: 'Frost Spider Den', description: 'A nest of giant frost spiders and web traps.', location: 'Winterhold', difficulty: 'easy', recommendedLevel: 2, theme: 'ice_cave', ambientDescription: 'Silvery silk glistening in cold air.', startNodeId: 'fs_start', bossNodeId: 'fs_boss', completionRewards: { gold: 100, xp: 220, items: [{ name: 'Spider Venom', type: 'misc', quantity: 1, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'fs_start', type: 'start', name: 'Webbed Entry', x: 5, y: 50, connections: ['fs_combat1', 'fs_event1', 'fs_empty1'] },
      { id: 'fs_combat1', type: 'combat', name: 'Broodlings', x: 20, y: 20, connections: ['fs_rest1', 'fs_combat2'], enemies: [simpleEnemy('sp1','Frost Spiderling','beast',2,40,8,60,10), simpleEnemy('sp2','Frost Spiderling','beast',2,40,8,60,10), simpleEnemy('sp3','Frost Spiderling','beast',1,30,6,45,8)] },
      { id: 'fs_event1', type: 'event', name: 'Cocooned Corpse', x: 20, y: 50, connections: ['fs_combat2', 'fs_reward1'], eventText: 'A body wrapped in webs.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 35 }] },
      { id: 'fs_empty1', type: 'empty', name: 'Frozen Chamber', x: 20, y: 80, connections: ['fs_reward1', 'fs_combat3'] },
      { id: 'fs_rest1', type: 'rest', name: 'Heated Pocket', x: 40, y: 15, connections: ['fs_elite1', 'fs_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'fs_combat2', type: 'combat', name: 'Webspinners', x: 40, y: 35, connections: ['fs_elite1', 'fs_event2'], enemies: [simpleEnemy('ws1','Webspinner Spider','beast',3,60,10,80,15), simpleEnemy('ws2','Frostbite Spider','beast',2,50,8,65,12)] },
      { id: 'fs_reward1', type: 'reward', name: 'Adventurer Pack', x: 40, y: 60, connections: ['fs_event2', 'fs_combat4'], rewards: { gold: 40, items: [{ name: 'Torch', type: 'misc', quantity: 2, rarity: 'common' }] } },
      { id: 'fs_combat3', type: 'combat', name: 'Ice Wraiths', x: 40, y: 85, connections: ['fs_combat4', 'fs_rest2'], enemies: [simpleEnemy('iw1','Ice Wraith','beast',3,50,12,90,20), simpleEnemy('iw2','Lesser Ice Wraith','beast',2,35,8,60,12)] },
      { id: 'fs_elite1', type: 'elite', name: 'Giant Spider', x: 60, y: 20, connections: ['fs_rest3', 'fs_boss'], enemies: [simpleEnemy('gs1','Giant Frostbite Spider','beast',4,150,16,200,40), simpleEnemy('gs2','Frost Spiderling','beast',2,40,8,60,10)] },
      { id: 'fs_event2', type: 'event', name: 'Frozen Chest', x: 60, y: 45, connections: ['fs_rest3', 'fs_combat5'], eventText: 'Ice covers a chest.', eventChoices: [{ label: 'Thaw', outcome: 'reward', value: 50 }] },
      { id: 'fs_combat4', type: 'combat', name: 'Ambush Spiders', x: 60, y: 65, connections: ['fs_combat5', 'fs_reward2'], enemies: [simpleEnemy('as1','Ambush Spider','beast',3,55,11,75,18), simpleEnemy('as2','Frost Spiderling','beast',2,40,8,60,10)] },
      { id: 'fs_rest2', type: 'rest', name: 'Sticky Nook', x: 60, y: 90, connections: ['fs_reward2'], restAmount: { stamina: 20, health: 15 } },
      { id: 'fs_rest3', type: 'rest', name: 'Safe Ledge', x: 75, y: 25, connections: ['fs_boss'], restAmount: { health: 25, stamina: 20 } },
      { id: 'fs_combat5', type: 'combat', name: 'Spider Guards', x: 75, y: 50, connections: ['fs_boss'], enemies: [simpleEnemy('sg1','Frost Spider','beast',3,70,12,100,22), simpleEnemy('sg2','Frost Spider','beast',3,70,12,100,22), simpleEnemy('sg3','Frost Spiderling','beast',2,40,8,60,10)] },
      { id: 'fs_reward2', type: 'reward', name: 'Egg Sac Loot', x: 75, y: 75, connections: ['fs_boss'], rewards: { gold: 30, items: [{ name: 'Spider Egg', type: 'misc', quantity: 4, rarity: 'common' }] } },
      { id: 'fs_boss', type: 'boss', name: 'Broodmother', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fsboss','Frost Broodmother','beast',5,420,32,540,80,true), simpleEnemy('fsboss2','Frost Spider','beast',3,70,12,100,22), simpleEnemy('fsboss3','Frost Spider','beast',3,70,12,100,22)] }
    ]
  },

  {
    id: 'daedric_shrine_dg', name: 'Daedric Shrine', description: 'A warped shrine with daedric guardians and bargains.', location: 'Winterhold', difficulty: 'legendary', recommendedLevel: 15, minimumLevel: 10, theme: 'daedric_shrine', ambientDescription: 'Whispers in a language you do not know.', startNodeId: 'ds_start', bossNodeId: 'ds_boss', completionRewards: { gold: 1200, xp: 5000, items: [{ name: 'Daedric Relic', type: 'misc', quantity: 1, rarity: 'legendary' as LootRarity }] },
    nodes: [
      { id: 'ds_start', type: 'start', name: 'Ritual Gate', x: 5, y: 50, connections: ['ds_event1', 'ds_combat1', 'ds_empty1'] },
      { id: 'ds_event1', type: 'event', name: 'Unholy Pact', x: 20, y: 20, connections: ['ds_rest1', 'ds_combat2'], eventText: 'A voice offers power for a price.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 400 }, { label: 'Decline', outcome: 'damage', value: 100 }] },
      { id: 'ds_combat1', type: 'combat', name: 'Dremora Scout', x: 20, y: 50, connections: ['ds_combat2', 'ds_reward1'], enemies: [simpleEnemy('dsc1','Dremora','daedra',12,600,80,2000,400), simpleEnemy('dsc2','Scamp','daedra',10,300,45,1000,200)] },
      { id: 'ds_empty1', type: 'empty', name: 'Void Chamber', x: 20, y: 80, connections: ['ds_reward1', 'ds_combat3'] },
      { id: 'ds_rest1', type: 'rest', name: 'Soul Trap', x: 40, y: 15, connections: ['ds_elite1', 'ds_event2'], restAmount: { health: 60, magicka: 50, stamina: 50 } },
      { id: 'ds_combat2', type: 'combat', name: 'Atronachs', x: 40, y: 35, connections: ['ds_elite1', 'ds_event2'], enemies: [simpleEnemy('fa1','Flame Atronach','daedra',11,400,60,1500,300), simpleEnemy('sa1','Storm Atronach','daedra',11,450,55,1600,320), simpleEnemy('ia1','Frost Atronach','daedra',11,420,50,1550,310)] },
      { id: 'ds_reward1', type: 'reward', name: 'Daedra Heart', x: 40, y: 60, connections: ['ds_event2', 'ds_combat4'], rewards: { gold: 500, items: [{ name: 'Daedra Heart', type: 'misc', quantity: 1, rarity: 'epic' }] } },
      { id: 'ds_combat3', type: 'combat', name: 'Scamps', x: 40, y: 85, connections: ['ds_combat4', 'ds_rest2'], enemies: [simpleEnemy('sc1','Scamp','daedra',10,300,45,1000,200), simpleEnemy('sc2','Scamp','daedra',10,300,45,1000,200), simpleEnemy('sc3','Lesser Scamp','daedra',8,220,35,700,150)] },
      { id: 'ds_elite1', type: 'elite', name: 'Daedra Knight', x: 60, y: 20, connections: ['ds_event3', 'ds_boss'], enemies: [simpleEnemy('dk1','Daedra Knight','daedra',15,1800,160,4200,800), simpleEnemy('dk2','Dremora Caitiff','daedra',12,600,80,2000,400)] },
      { id: 'ds_event2', type: 'event', name: 'Sigil Stone', x: 60, y: 45, connections: ['ds_event3', 'ds_combat5'], eventText: 'A sigil stone pulses with oblivion energy.', eventChoices: [{ label: 'Take', outcome: 'reward', value: 600 }, { label: 'Destroy', outcome: 'damage', value: 150 }] },
      { id: 'ds_combat4', type: 'combat', name: 'Lurkers', x: 60, y: 65, connections: ['ds_combat5', 'ds_reward2'], enemies: [simpleEnemy('lu1','Lurker','daedra',13,800,100,3000,500), simpleEnemy('lu2','Lurker Guardian','daedra',12,650,85,2500,420)] },
      { id: 'ds_rest2', type: 'rest', name: 'Sanctuary', x: 60, y: 90, connections: ['ds_reward2'], restAmount: { health: 70, magicka: 60, stamina: 60 } },
      { id: 'ds_event3', type: 'event', name: 'Dark Bargain', x: 75, y: 25, connections: ['ds_boss'], eventText: 'Ultimate power, for a soul.', eventChoices: [{ label: 'Pay', outcome: 'damage', value: 200 }, { label: 'Refuse', outcome: 'nothing' }] },
      { id: 'ds_combat5', type: 'combat', name: 'Dremora Kynval', x: 75, y: 50, connections: ['ds_boss'], enemies: [simpleEnemy('dky1','Dremora Kynval','daedra',14,1200,120,3500,600), simpleEnemy('dky2','Dremora Caitiff','daedra',12,600,80,2000,400)] },
      { id: 'ds_reward2', type: 'reward', name: 'Oblivion Cache', x: 75, y: 75, connections: ['ds_boss'], rewards: { gold: 800, items: [{ name: 'Black Soul Gem', type: 'misc', quantity: 1, rarity: 'legendary' }] } },
      { id: 'ds_boss', type: 'boss', name: 'Dremora Overlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('dboss','Dremora Overlord','daedra',18,3600,300,9000,2500,true), simpleEnemy('dboss2','Dremora Kynval','daedra',14,1200,120,3500,600), simpleEnemy('dboss3','Flame Atronach','daedra',11,400,60,1500,300), simpleEnemy('dboss4','Storm Atronach','daedra',11,450,55,1600,320)] }
    ]
  },

  {
    id: 'forsworn_camp_dg', name: 'Forsworn Camp', description: 'A tangled network of stone altars and forsworn brutes.', location: 'Markarth', difficulty: 'medium', recommendedLevel: 6, theme: 'forsworn_camp', ambientDescription: 'Wild drums and bitter smoke.', startNodeId: 'fc_start', bossNodeId: 'fc_boss', completionRewards: { gold: 300, xp: 760, items: [{ name: 'Forsworn Token', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'fc_start', type: 'start', name: 'Outskirts', x: 5, y: 50, connections: ['fc_combat1', 'fc_event1', 'fc_empty1'] },
      { id: 'fc_combat1', type: 'combat', name: 'Scouts', x: 20, y: 20, connections: ['fc_rest1', 'fc_combat2'], enemies: [simpleEnemy('fw1','Forsworn','humanoid',5,150,18,280,50), simpleEnemy('fw1b','Forsworn Looter','humanoid',4,120,14,220,40)] },
      { id: 'fc_event1', type: 'event', name: 'Ritual Stones', x: 20, y: 50, connections: ['fc_combat2', 'fc_reward1'], eventText: 'A childs offering lies there.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 60 }] },
      { id: 'fc_empty1', type: 'empty', name: 'Empty Tent', x: 20, y: 80, connections: ['fc_reward1', 'fc_combat3'] },
      { id: 'fc_rest1', type: 'rest', name: 'Hidden Cave', x: 40, y: 15, connections: ['fc_elite1', 'fc_event2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'fc_combat2', type: 'combat', name: 'Wildermen', x: 40, y: 35, connections: ['fc_elite1', 'fc_event2'], enemies: [simpleEnemy('fw2','Forsworn Ravager','humanoid',6,180,22,340,65), simpleEnemy('fw2b','Forsworn','humanoid',5,150,18,280,50)] },
      { id: 'fc_reward1', type: 'reward', name: 'Totem Cache', x: 40, y: 60, connections: ['fc_event2', 'fc_combat4'], rewards: { gold: 70, items: [{ name: 'Bone Charm', type: 'misc', quantity: 1, rarity: 'uncommon' }] } },
      { id: 'fc_combat3', type: 'combat', name: 'Hagravens', x: 40, y: 85, connections: ['fc_combat4', 'fc_rest2'], enemies: [simpleEnemy('hag1','Hagraven','humanoid',7,200,28,420,85), simpleEnemy('hag1b','Forsworn Briarheart','humanoid',6,180,24,380,75)] },
      { id: 'fc_elite1', type: 'elite', name: 'Forsworn Champion', x: 60, y: 20, connections: ['fc_event3', 'fc_boss'], enemies: [simpleEnemy('fe1','Forsworn Champion','humanoid',8,420,44,980,180), simpleEnemy('fe1b','Forsworn Ravager','humanoid',6,180,22,340,65)] },
      { id: 'fc_event2', type: 'event', name: 'Blood Ritual', x: 60, y: 45, connections: ['fc_event3', 'fc_combat5'], eventText: 'A sacrifice is underway.', eventChoices: [{ label: 'Interrupt', outcome: 'reward', value: 80 }, { label: 'Watch', outcome: 'damage', value: 30 }] },
      { id: 'fc_combat4', type: 'combat', name: 'Briarheart', x: 60, y: 65, connections: ['fc_combat5', 'fc_reward2'], enemies: [simpleEnemy('bh1','Forsworn Briarheart','humanoid',7,280,36,580,110), simpleEnemy('bh1b','Forsworn','humanoid',5,150,18,280,50)] },
      { id: 'fc_rest2', type: 'rest', name: 'Prisoner Cage', x: 60, y: 90, connections: ['fc_reward2'], restAmount: { health: 25, stamina: 20 } },
      { id: 'fc_event3', type: 'event', name: 'Hagraven Nest', x: 75, y: 25, connections: ['fc_boss'], eventText: 'Feathers and bones everywhere.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 100 }] },
      { id: 'fc_combat5', type: 'combat', name: 'Elite Guards', x: 75, y: 50, connections: ['fc_boss'], enemies: [simpleEnemy('fg1','Forsworn Ravager','humanoid',6,180,22,340,65), simpleEnemy('fg2','Forsworn','humanoid',5,150,18,280,50), simpleEnemy('fg3','Forsworn Looter','humanoid',4,120,14,220,40)] },
      { id: 'fc_reward2', type: 'reward', name: 'Headhunter Cache', x: 75, y: 75, connections: ['fc_boss'], rewards: { gold: 90, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 2, rarity: 'common' }] } },
      { id: 'fc_boss', type: 'boss', name: 'Briar Matron', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Briar Matron','humanoid',10,880,76,2200,420,true), simpleEnemy('fboss2','Hagraven','humanoid',7,200,28,420,85), simpleEnemy('fboss3','Forsworn Briarheart','humanoid',7,280,36,580,110)] }
    ]
  },

  {
    id: 'troll_cave_dg',
    name: 'Troll Cave',
    description: 'A shallow cave dominated by a territorial troll near Rorikstead.',
    location: 'Troll Cave',
    difficulty: 'easy',
    recommendedLevel: 3,
    theme: 'ice_cave',
    ambientDescription: 'The smell of damp stone and rotting meat. Bones litter the floor.',
    startNodeId: 'tc_start',
    bossNodeId: 'tc_boss',
    completionRewards: { gold: 80, xp: 180, items: [{ name: 'Troll Fat', type: 'misc', quantity: 2, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'tc_start', type: 'start', name: 'Cave Entrance', x: 5, y: 50, connections: ['tc_combat1', 'tc_event1', 'tc_empty1'] },
      { id: 'tc_combat1', type: 'combat', name: 'Young Troll', x: 20, y: 25, connections: ['tc_rest1', 'tc_reward1'], enemies: [simpleEnemy('yt1','Young Troll','beast',2,60,10,80,15), simpleEnemy('yt2','Wolf','beast',2,35,7,50,10)] },
      { id: 'tc_event1', type: 'event', name: 'Adventurer Remains', x: 20, y: 50, connections: ['tc_reward1', 'tc_combat2'], eventText: 'A half-eaten corpse clutches a pack.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 40 }] },
      { id: 'tc_empty1', type: 'empty', name: 'Narrow Passage', x: 20, y: 75, connections: ['tc_combat2', 'tc_rest1'] },
      { id: 'tc_rest1', type: 'rest', name: 'Safe Alcove', x: 40, y: 20, connections: ['tc_elite1', 'tc_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'tc_reward1', type: 'reward', name: 'Bone Pile', x: 40, y: 45, connections: ['tc_elite1', 'tc_event2'], rewards: { gold: 30, items: [{ name: 'Bone Meal', type: 'misc', quantity: 2, rarity: 'common' }] } },
      { id: 'tc_combat2', type: 'combat', name: 'Cave Bear', x: 40, y: 70, connections: ['tc_event2', 'tc_reward2'], enemies: [simpleEnemy('cb1','Cave Bear','beast',3,80,14,100,20), simpleEnemy('cb2','Wolf','beast',2,35,7,50,10)] },
      { id: 'tc_elite1', type: 'elite', name: 'Frost Troll', x: 60, y: 30, connections: ['tc_boss'], enemies: [simpleEnemy('ft1','Frost Troll','beast',4,140,20,180,40), simpleEnemy('ft2','Wolf','beast',2,35,7,50,10)] },
      { id: 'tc_event2', type: 'event', name: 'Glowing Mushrooms', x: 60, y: 55, connections: ['tc_boss', 'tc_reward2'], eventText: 'Strange luminescent fungi grow here.', eventChoices: [{ label: 'Harvest', outcome: 'reward', value: 30 }] },
      { id: 'tc_reward2', type: 'reward', name: 'Hidden Cache', x: 60, y: 80, connections: ['tc_boss'], rewards: { gold: 45, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 1, rarity: 'common' }] } },
      { id: 'tc_boss', type: 'boss', name: 'Troll Patriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('tcboss','Troll Patriarch','beast',5,240,28,320,60,true), simpleEnemy('tcboss2','Young Troll','beast',3,80,12,100,20), simpleEnemy('tcboss3','Wolf','beast',2,35,7,50,10)] }
    ]
  },

  {
    id: 'ice_cavern_dg',
    name: 'Shattered Ice Cavern',
    description: 'A winding cave of ice and whirling winds in The Pale.',
    location: 'Shattered Ice Cavern',
    difficulty: 'medium',
    recommendedLevel: 4,
    theme: 'ice_cave',
    ambientDescription: 'Breath clouds in the freezing air. Ice crackles underfoot.',
    startNodeId: 'ic_start',
    bossNodeId: 'ic_boss',
    completionRewards: { gold: 160, xp: 380, items: [{ name: 'Ice Wolf Pelt', type: 'misc', quantity: 2, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'ic_start', type: 'start', name: 'Frozen Entry', x: 5, y: 50, connections: ['ic_combat1', 'ic_event1', 'ic_empty1'] },
      { id: 'ic_combat1', type: 'combat', name: 'Ice Wolves', x: 20, y: 20, connections: ['ic_rest1', 'ic_combat2'], enemies: [simpleEnemy('iw1','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('iw2','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('iw3','Ice Wolf Pup','beast',2,30,6,45,10)] },
      { id: 'ic_event1', type: 'event', name: 'Frozen Statue', x: 20, y: 50, connections: ['ic_combat2', 'ic_reward1'], eventText: 'An adventurer frozen solid clutches something shiny.', eventChoices: [{ label: 'Thaw', outcome: 'reward', value: 50 }, { label: 'Smash', outcome: 'damage', value: 15 }] },
      { id: 'ic_empty1', type: 'empty', name: 'Icy Corridor', x: 20, y: 80, connections: ['ic_reward1', 'ic_combat3'] },
      { id: 'ic_rest1', type: 'rest', name: 'Warm Pocket', x: 40, y: 15, connections: ['ic_elite1', 'ic_event2'], restAmount: { health: 25, magicka: 15, stamina: 20 } },
      { id: 'ic_combat2', type: 'combat', name: 'Ice Wraith', x: 40, y: 35, connections: ['ic_elite1', 'ic_event2'], enemies: [simpleEnemy('wr1','Ice Wraith','beast',4,70,14,120,25), simpleEnemy('wr2','Lesser Ice Wraith','beast',3,50,10,80,18)] },
      { id: 'ic_reward1', type: 'reward', name: 'Frozen Chest', x: 40, y: 60, connections: ['ic_event2', 'ic_combat4'], rewards: { gold: 55, items: [{ name: 'Frost Salts', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'ic_combat3', type: 'combat', name: 'Snowy Sabre Cat', x: 40, y: 85, connections: ['ic_combat4', 'ic_rest2'], enemies: [simpleEnemy('sc1','Snowy Sabre Cat','beast',4,90,16,140,30), simpleEnemy('sc2','Sabre Cat Cub','beast',3,55,10,85,18)] },
      { id: 'ic_elite1', type: 'elite', name: 'Frost Atronach', x: 60, y: 20, connections: ['ic_event3', 'ic_boss'], enemies: [simpleEnemy('fa1','Frost Atronach','daedra',5,180,22,260,50), simpleEnemy('fa2','Ice Wolf','beast',3,50,10,70,15)] },
      { id: 'ic_event2', type: 'event', name: 'Ice Bridge', x: 60, y: 45, connections: ['ic_event3', 'ic_combat5'], eventText: 'A treacherous bridge of ice spans a chasm.', eventChoices: [{ label: 'Careful', outcome: 'nothing' }, { label: 'Sprint', outcome: 'damage', value: 25 }] },
      { id: 'ic_combat4', type: 'combat', name: 'Wolf Pack', x: 60, y: 65, connections: ['ic_combat5', 'ic_reward2'], enemies: [simpleEnemy('wp1','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('wp2','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('wp3','Ice Wolf Alpha','beast',4,80,14,100,25)] },
      { id: 'ic_rest2', type: 'rest', name: 'Sheltered Cave', x: 60, y: 90, connections: ['ic_reward2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'ic_event3', type: 'event', name: 'Word Wall Fragment', x: 75, y: 25, connections: ['ic_boss'], eventText: 'Faint dragon script glows on cracked ice.', eventChoices: [{ label: 'Study', outcome: 'reward', value: 80 }] },
      { id: 'ic_combat5', type: 'combat', name: 'Frost Troll', x: 75, y: 50, connections: ['ic_boss'], enemies: [simpleEnemy('ft1','Frost Troll','beast',5,160,24,220,45), simpleEnemy('ft2','Ice Wolf','beast',3,50,10,70,15)] },
      { id: 'ic_reward2', type: 'reward', name: 'Hunter\'s Cache', x: 75, y: 75, connections: ['ic_boss'], rewards: { gold: 70, items: [{ name: 'Ice Wolf Pelt', type: 'misc', quantity: 1, rarity: 'uncommon' }] } },
      { id: 'ic_boss', type: 'boss', name: 'Frost Giant', x: 95, y: 50, connections: [], enemies: [simpleEnemy('icboss','Frost Giant','beast',7,380,36,540,100,true), simpleEnemy('icboss2','Frost Troll','beast',4,120,18,160,35), simpleEnemy('icboss3','Ice Wolf','beast',3,50,10,70,15)] }
    ]
  },

  {
    id: 'mineshaft_dg',
    name: 'Abandoned Mineshaft',
    description: 'Collapsed galleries and bandit squatters near Riften.',
    location: 'Abandoned Mineshaft',
    difficulty: 'medium',
    recommendedLevel: 5,
    theme: 'bandit_hideout',
    ambientDescription: 'Echoes of pickaxes and falling rock. Ore fragments litter the floor.',
    startNodeId: 'ms_start',
    bossNodeId: 'ms_boss',
    completionRewards: { gold: 200, xp: 450, items: [{ name: 'Corundum Ore', type: 'misc', quantity: 3, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'ms_start', type: 'start', name: 'Mine Entrance', x: 5, y: 50, connections: ['ms_combat1', 'ms_event1', 'ms_empty1'] },
      { id: 'ms_combat1', type: 'combat', name: 'Bandit Lookouts', x: 20, y: 20, connections: ['ms_rest1', 'ms_combat2'], enemies: [simpleEnemy('bl1','Bandit','humanoid',4,100,14,160,30), simpleEnemy('bl2','Bandit','humanoid',4,100,14,160,30), simpleEnemy('bl3','Bandit Thug','humanoid',3,80,12,130,25)] },
      { id: 'ms_event1', type: 'event', name: 'Unstable Tunnel', x: 20, y: 50, connections: ['ms_combat2', 'ms_reward1'], eventText: 'The ceiling groans ominously.', eventChoices: [{ label: 'Sneak', outcome: 'nothing' }, { label: 'Run', outcome: 'damage', value: 20 }] },
      { id: 'ms_empty1', type: 'empty', name: 'Collapsed Shaft', x: 20, y: 80, connections: ['ms_reward1', 'ms_combat3'] },
      { id: 'ms_rest1', type: 'rest', name: 'Supply Room', x: 40, y: 15, connections: ['ms_elite1', 'ms_event2'], restAmount: { health: 25, stamina: 20 } },
      { id: 'ms_combat2', type: 'combat', name: 'Mine Guards', x: 40, y: 35, connections: ['ms_elite1', 'ms_event2'], enemies: [simpleEnemy('mg1','Bandit Thug','humanoid',5,130,18,200,40), simpleEnemy('mg2','Bandit','humanoid',4,100,14,160,30)] },
      { id: 'ms_reward1', type: 'reward', name: 'Ore Vein', x: 40, y: 60, connections: ['ms_event2', 'ms_combat4'], rewards: { gold: 60, items: [{ name: 'Iron Ore', type: 'misc', quantity: 4, rarity: 'common' }] } },
      { id: 'ms_combat3', type: 'combat', name: 'Skeevers', x: 40, y: 85, connections: ['ms_combat4', 'ms_rest2'], enemies: [simpleEnemy('sk1','Skeever','beast',2,35,8,40,8), simpleEnemy('sk2','Skeever','beast',2,35,8,40,8), simpleEnemy('sk3','Skeever','beast',2,35,8,40,8), simpleEnemy('sk4','Giant Skeever','beast',3,50,10,60,12)] },
      { id: 'ms_elite1', type: 'elite', name: 'Bandit Marauder', x: 60, y: 20, connections: ['ms_event3', 'ms_boss'], enemies: [simpleEnemy('bm1','Bandit Marauder','humanoid',6,180,24,320,60), simpleEnemy('bm2','Bandit Thug','humanoid',5,130,18,200,40)] },
      { id: 'ms_event2', type: 'event', name: 'Trapped Miner', x: 60, y: 45, connections: ['ms_event3', 'ms_combat5'], eventText: 'A miner cries for help under rubble.', eventChoices: [{ label: 'Rescue', outcome: 'reward', value: 60 }, { label: 'Ignore', outcome: 'nothing' }] },
      { id: 'ms_combat4', type: 'combat', name: 'Frostbite Spiders', x: 60, y: 65, connections: ['ms_combat5', 'ms_reward2'], enemies: [simpleEnemy('fs1','Frostbite Spider','beast',4,70,12,100,20), simpleEnemy('fs2','Frostbite Spider','beast',4,70,12,100,20)] },
      { id: 'ms_rest2', type: 'rest', name: 'Hidden Nook', x: 60, y: 90, connections: ['ms_reward2'], restAmount: { health: 30, magicka: 20, stamina: 25 } },
      { id: 'ms_event3', type: 'event', name: 'Forge Room', x: 75, y: 25, connections: ['ms_boss'], eventText: 'An active forge with tools nearby.', eventChoices: [{ label: 'Use', outcome: 'reward', value: 50 }] },
      { id: 'ms_combat5', type: 'combat', name: 'Bandit Archers', x: 75, y: 50, connections: ['ms_boss'], enemies: [simpleEnemy('ba1','Bandit Archer','humanoid',5,90,16,180,35), simpleEnemy('ba2','Bandit Archer','humanoid',5,90,16,180,35), simpleEnemy('ba3','Bandit','humanoid',4,100,14,160,30)] },
      { id: 'ms_reward2', type: 'reward', name: 'Mining Cache', x: 75, y: 75, connections: ['ms_boss'], rewards: { gold: 85, items: [{ name: 'Corundum Ore', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'ms_boss', type: 'boss', name: 'Bandit Chief', x: 95, y: 50, connections: [], enemies: [simpleEnemy('msboss','Bandit Chief','humanoid',8,340,38,600,120,true), simpleEnemy('msboss2','Bandit Marauder','humanoid',6,180,24,320,60), simpleEnemy('msboss3','Bandit Thug','humanoid',5,130,18,200,40)] }
    ]
  },


  // Additional smaller/placeholder dungeon definitions added for map linkage
  {
    id: 'dustmans_cairn_dg',
    name: 'Dustmans Cairn',
    description: 'An ancient Nordic barrow infested by Silver Hand hunters.',
    location: "Dustman's Cairn",
    difficulty: 'medium',
    recommendedLevel: 10,
    theme: 'nordic_tomb',
    startNodeId: 'dc_start',
    bossNodeId: 'dc_boss',
    completionRewards: { gold: 420, xp: 900, items: [{ name: 'Silver Dagger', type: 'weapon', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'dc_start', type: 'start', name: 'Collapsed Entrance', x: 5, y: 50, connections: ['dc_combat1'] },
      { id: 'dc_combat1', type: 'combat', name: 'Silver Hand Patrol', x: 50, y: 50, connections: ['dc_boss'], enemies: [simpleEnemy('sh1','Silver Hand Hunter','humanoid',8,220,28,600,120)] },
      { id: 'dc_boss', type: 'boss', name: 'Silver Hand Captain', x: 95, y: 50, connections: [], enemies: [simpleEnemy('dcb','Silver Hand Captain','humanoid',12,600,50,1500,300,true)] }
    ]
  },

  {
    id: 'silent_moons_camp_dg',
    name: 'Silent Moons Camp',
    description: 'Nordic ruins where a lunar forge can enchant weapons under moonlight.',
    location: 'Silent Moons Camp',
    difficulty: 'medium',
    recommendedLevel: 12,
    theme: 'nordic_tomb',
    startNodeId: 'sm_start',
    bossNodeId: 'sm_boss',
    completionRewards: { gold: 380, xp: 850, items: [{ name: 'Lunar Blade', type: 'weapon', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'sm_start', type: 'start', name: 'Moonlit Gate', x: 5, y: 50, connections: ['sm_combat1'] },
      { id: 'sm_combat1', type: 'combat', name: 'Ruins Guardians', x: 50, y: 50, connections: ['sm_boss'], enemies: [simpleEnemy('rg1','Cultist Guardian','humanoid',9,260,30,700,140)] },
      { id: 'sm_boss', type: 'boss', name: 'Lunar Smith', x: 95, y: 50, connections: [], enemies: [simpleEnemy('smb','Lunar Smith','humanoid',13,680,54,1700,360,true)] }
    ]
  },

  {
    id: 'shroud_hearth_barrow_dg',
    name: 'Shroud Hearth Barrow',
    description: 'A haunted barrow with restless spirits near Ivarstead.',
    location: 'Shroud Hearth Barrow',
    difficulty: 'medium',
    recommendedLevel: 14,
    theme: 'nordic_tomb',
    startNodeId: 'sh_start',
    bossNodeId: 'sh_boss',
    completionRewards: { gold: 460, xp: 1000 },
    nodes: [
      { id: 'sh_start', type: 'start', name: 'Fogged Vestibule', x: 5, y: 50, connections: ['sh_combat1'] },
      { id: 'sh_combat1', type: 'combat', name: 'Restless Dead', x: 50, y: 50, connections: ['sh_boss'], enemies: [simpleEnemy('rd1','Restless Wight','undead',10,300,32,800,160)] },
      { id: 'sh_boss', type: 'boss', name: 'Guardian Specter', x: 95, y: 50, connections: [], enemies: [simpleEnemy('shboss','Guardian Specter','undead',14,720,56,1800,380,true)] }
    ]
  },

  {
    id: 'broken_fang_cave_dg',
    name: 'Broken Fang Cave',
    description: 'A vampire den and lair for nocturnal predators.',
    location: 'Broken Fang Cave',
    difficulty: 'medium',
    recommendedLevel: 16,
    theme: 'vampire_lair',
    startNodeId: 'bf_start',
    bossNodeId: 'bf_boss',
    completionRewards: { gold: 520, xp: 1100 },
    nodes: [
      { id: 'bf_start', type: 'start', name: 'Moonlit Mouth', x: 5, y: 50, connections: ['bf_combat1'] },
      { id: 'bf_combat1', type: 'combat', name: 'Nightstalkers', x: 50, y: 50, connections: ['bf_boss'], enemies: [simpleEnemy('ns1','Nightstalker Vampire','undead',11,340,36,900,200)] },
      { id: 'bf_boss', type: 'boss', name: 'Vampire Matron', x: 95, y: 50, connections: [], enemies: [simpleEnemy('bfboss','Vampire Matron','undead',16,900,68,2200,480,true)] }
    ]
  },

  {
    id: 'forelhost_dg',
    name: 'Forelhost',
    description: 'Dragon cult temple high in the Jerall Mountains.',
    location: 'Forelhost',
    difficulty: 'hard',
    recommendedLevel: 22,
    theme: 'dragon_lair',
    startNodeId: 'fh_start',
    bossNodeId: 'fh_boss',
    completionRewards: { gold: 1200, xp: 2400 },
    nodes: [
      { id: 'fh_start', type: 'start', name: 'High Gate', x: 5, y: 50, connections: ['fh_combat1'] },
      { id: 'fh_combat1', type: 'combat', name: 'Cultists', x: 50, y: 50, connections: ['fh_boss'], enemies: [simpleEnemy('rc1','Dragon Cultist','humanoid',18,700,60,1600,320)] },
      { id: 'fh_boss', type: 'boss', name: 'Cult Warlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fhboss','Cult Warlord','humanoid',26,2000,110,4200,900,true)] }
    ]
  },

  {
    id: 'nchuand_zel_dg',
    name: 'Nchuand-Zel',
    description: 'Dwemer ruin beneath Markarth.',
    location: 'Nchuand-Zel',
    difficulty: 'hard',
    recommendedLevel: 25,
    theme: 'dwemer_ruin',
    startNodeId: 'nz_start',
    bossNodeId: 'nz_boss',
    completionRewards: { gold: 1800, xp: 2600 },
    nodes: [
      { id: 'nz_start', type: 'start', name: 'Ruined Gate', x: 5, y: 50, connections: ['nz_combat1'] },
      { id: 'nz_combat1', type: 'combat', name: 'Falmer Patrol', x: 50, y: 50, connections: ['nz_boss'], enemies: [simpleEnemy('fp1','Falmer Hunter','humanoid',20,820,64,1800,380)] },
      { id: 'nz_boss', type: 'boss', name: 'Dwemer Guardian', x: 95, y: 50, connections: [], enemies: [simpleEnemy('nzb','Dwemer Guardian','automaton',28,2500,120,5600,1200,true)] }
    ]
  },

  {
    id: 'volunruud_dg',
    name: 'Volunruud',
    description: 'An ancient Nordic tomb with powerful shouts.',
    location: 'Volunruud',
    difficulty: 'hard',
    recommendedLevel: 28,
    theme: 'nordic_tomb',
    startNodeId: 'vv_start',
    bossNodeId: 'vv_boss',
    completionRewards: { gold: 1400, xp: 2600 },
    nodes: [
      { id: 'vv_start', type: 'start', name: 'Frozen Gate', x: 5, y: 50, connections: ['vv_combat1'] },
      { id: 'vv_combat1', type: 'combat', name: 'Undead Guards', x: 50, y: 50, connections: ['vv_boss'], enemies: [simpleEnemy('ug1','Undead Guardian','undead',22,920,72,2000,420)] },
      { id: 'vv_boss', type: 'boss', name: 'Shout Warden', x: 95, y: 50, connections: [], enemies: [simpleEnemy('vvboss','Shout Warden','undead',30,3200,140,7200,1400,true)] }
    ]
  },

  {
    id: 'skuldafn_dg',
    name: 'Skuldafn',
    description: 'Temple that serves as a portal to Sovngarde.',
    location: 'Skuldafn',
    difficulty: 'legendary',
    recommendedLevel: 40,
    theme: 'nordic_tomb',
    startNodeId: 'sk_start',
    bossNodeId: 'sk_boss',
    completionRewards: { gold: 5000, xp: 6000 },
    nodes: [
      { id: 'sk_start', type: 'start', name: 'High Stair', x: 5, y: 50, connections: ['sk_combat1'] },
      { id: 'sk_combat1', type: 'combat', name: 'Dragon Guards', x: 50, y: 50, connections: ['sk_boss'], enemies: [simpleEnemy('dg1','Dragon Priest Guard','humanoid',34,1800,96,4200,900)] },
      { id: 'sk_boss', type: 'boss', name: 'Portal Warden', x: 95, y: 50, connections: [], enemies: [simpleEnemy('skboss','Portal Warden','humanoid',46,5200,220,12000,2400,true)] }
    ]
  },

  {
    id: 'forgotten_vale_dg',
    name: 'Forgotten Vale',
    description: 'Hidden glacial valley with ancient Snow Elf holdings.',
    location: 'Forgotten Vale',
    difficulty: 'legendary',
    recommendedLevel: 45,
    theme: 'ice_cave',
    startNodeId: 'fv_start',
    bossNodeId: 'fv_boss',
    completionRewards: { gold: 6000, xp: 10000 },
    nodes: [
      { id: 'fv_start', type: 'start', name: 'Icy Gate', x: 5, y: 50, connections: ['fv_combat1'] },
      { id: 'fv_combat1', type: 'combat', name: 'Snow Elf Sentinels', x: 50, y: 50, connections: ['fv_boss'], enemies: [simpleEnemy('se1','Snow Elf Sentinel','humanoid',36,1600,88,3600,760)] },
      { id: 'fv_boss', type: 'boss', name: 'Auriel\'s Guardian', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fvboss','Auriel\'s Guardian','humanoid',50,8000,300,20000,4000,true)] }
    ]
  },

  {
    id: 'soul_cairn_dg',
    name: 'Soul Cairn',
    description: 'A plane of Oblivion filled with trapped souls.',
    location: 'Soul Cairn',
    difficulty: 'legendary',
    recommendedLevel: 50,
    theme: 'daedric_shrine',
    startNodeId: 'sc_start',
    bossNodeId: 'sc_boss',
    completionRewards: { gold: 8000, xp: 14000 },
    nodes: [
      { id: 'sc_start', type: 'start', name: 'Phantom Gate', x: 5, y: 50, connections: ['sc_combat1'] },
      { id: 'sc_combat1', type: 'combat', name: 'Lost Shades', x: 50, y: 50, connections: ['sc_boss'], enemies: [simpleEnemy('ls1','Lost Shade','undead',40,2400,120,4800,900)] },
      { id: 'sc_boss', type: 'boss', name: 'Archon of Souls', x: 95, y: 50, connections: [], enemies: [simpleEnemy('scboss','Archon of Souls','undead',60,12000,420,40000,8000,true)] }
    ]
  }
];

// Enrichment: convert minimal (start-middle-boss) placeholder dungeons into richer three-stage branching layouts
// This keeps the data authoring simple while making map dungeons feel more like Bleak Falls Barrow.
(function enrichSmallDungeons() {
  const makeEnemy = (prefix: string, idx: number, level: number, type?: CombatEnemy['type'], theme?: string) => {
    // Infer type from explicit type or dungeon theme
    const inferredType: CombatEnemy['type'] = type || (
      theme === 'bandit_hideout' ? 'humanoid' :
      theme === 'nordic_tomb' ? 'undead' :
      theme === 'ice_cave' ? 'beast' :
      theme === 'dwemer_ruin' ? 'automaton' :
      theme === 'daedric_shrine' ? 'daedra' :
      theme === 'vampire_lair' ? 'undead' :
      'humanoid'
    );

    const namePools: Record<CombatEnemy['type'], string[]> = {
      humanoid: ['Bandit', 'Raider', 'Guard', 'Cultist'],
      undead: ['Draugr', 'Wight', 'Shade', 'Restless Dead'],
      beast:  ['Wolf', 'Skeever', 'Chaurus', 'Bear'],
      daedra: ['Scamp', 'Atronach', 'Lurker'],
      dragon: ['Drake', 'Wyrmling'],
      automaton: ['Dwemer Sphere', 'Dwemer Spider', 'Centurion']
    };

    const pool = namePools[inferredType] || ['Foe'];
    const baseName = pool[idx % pool.length];
    const name = `${baseName} ${idx}`;
    const id = `${prefix}_${baseName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${idx}`;

    return simpleEnemy(id, name, inferredType, Math.max(1, level + Math.floor(Math.random()*2)), 40 + level * 10, 6 + level * 2, 40 + level * 20);
  };

  DUNGEON_DEFINITIONS.forEach(def => {
    if (!def.nodes || def.nodes.length > 3) return; // already rich

    const base = def.id.replace(/_dg$/,'');
    const lvl = Math.max(1, Math.floor((def.recommendedLevel || 1)));

    // find or create boss node
    let boss = def.nodes.find(n => n.type === 'boss');
    if (!boss) {
      boss = { id: `${base}_boss`, type: 'boss', name: `${def.name} Boss`, x: 95, y: 50, connections: [], enemies: [simpleEnemy(`${base}boss`, `${def.name} Boss`, 'humanoid', lvl+4, 300 + lvl*40, 30 + lvl*6, 800, true)] };
    }

    const start = { id: `${base}_start`, type: 'start', name: 'Entrance Hall', x: 5, y: 50, connections: [`${base}_event1`, `${base}_combat1`, `${base}_empty1`] };

    const event1 = { id: `${base}_event1`, type: 'event', name: 'Strange Marker', x: 20, y: 20, connections: [`${base}_combat2`, `${base}_rest1`], eventText: 'An odd marker glows faintly.', eventChoices: [{ label: 'Inspect', outcome: 'reward', value: 30 }] };

    const combat1 = { id: `${base}_combat1`, type: 'combat', name: 'Ambush Party', x: 20, y: 50, connections: [`${base}_rest1`, `${base}_combat2`, `${base}_reward1`], enemies: [makeEnemy(base,1,lvl, undefined, def.theme)] };

    const empty1 = { id: `${base}_empty1`, type: 'empty', name: 'Dusty Corridor', x: 20, y: 80, connections: [`${base}_reward1`, `${base}_combat3`] };

    const combat2 = { id: `${base}_combat2`, type: 'combat', name: 'Guard Patrol', x: 40, y: 20, connections: [`${base}_elite1`, `${base}_rest2`], enemies: [makeEnemy(base,2,lvl+1, undefined, def.theme)] };

    const rest1 = { id: `${base}_rest1`, type: 'rest', name: 'Hidden Alcove', x: 40, y: 35, connections: [`${base}_elite1`, `${base}_event2`], restAmount: { health: 20, stamina: 15 } };

    const reward1 = { id: `${base}_reward1`, type: 'reward', name: 'Loot Cache', x: 40, y: 65, connections: [`${base}_event2`, `${boss.id}`], rewards: { gold: Math.max(20, lvl * 20), items: [{ name: 'Curious Trinket', type: 'misc', quantity: 1, rarity: 'common' as LootRarity }] } };

    const combat3 = { id: `${base}_combat3`, type: 'combat', name: 'Lurkers', x: 40, y: 85, connections: [`${base}_combat4`, `${base}_rest2`], enemies: [makeEnemy(base,3,lvl, undefined, def.theme)] };

    const elite1 = { id: `${base}_elite1`, type: 'elite', name: 'Veteran Guard', x: 60, y: 25, connections: [`${base}_event3`, boss.id], enemies: [makeEnemy(base,4,lvl+2, undefined, def.theme), makeEnemy(base,5,lvl+1, undefined, def.theme)] };

    const event2 = { id: `${base}_event2`, type: 'event', name: 'Collapsed Niche', x: 60, y: 45, connections: [`${base}_event3`, `${base}_combat4`], eventText: 'Rubble suggests something valuable hid here.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 40 }] };

    const combat4 = { id: `${base}_combat4`, type: 'combat', name: 'Pre-Boss Guard', x: 60, y: 65, connections: [boss.id], enemies: [makeEnemy(base,6,lvl+1, undefined, def.theme)] };

    const event3 = { id: `${base}_event3`, type: 'event', name: 'Ancient Inscription', x: 75, y: 30, connections: [boss.id], eventText: 'An inscription hums with old magic.', eventChoices: [{ label: 'Translate', outcome: 'reward', value: 60 }] };

    // assign new nodes (keep boss but ensure it is present)
    def.nodes = [start, event1, combat1, empty1, combat2, rest1, reward1, combat3, elite1, event2, combat4, event3, boss];

    def.startNodeId = start.id;
    def.bossNodeId = boss.id;
  });
})();

// Auto-fix: ensure all referenced connection IDs exist by inserting placeholder 'empty' nodes
// This keeps the runtime map generator and dev UI from breaking due to typos or incomplete data
(function patchMissingDungeonNodes() {
  DUNGEON_DEFINITIONS.forEach(def => {
    if (!def.nodes) return;
    const nodeMap = new Map(def.nodes.map(n => [n.id, n]));
    const missing = new Set<string>();

    def.nodes.forEach(n => {
      if (!n || !Array.isArray(n.connections)) return;
      n.connections.forEach(cid => {
        if (!nodeMap.has(cid)) missing.add(cid);
      });
    });

    if (missing.size === 0) return;

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[DungeonDefs] auto-adding ${missing.size} placeholder node(s) for dungeon '${def.name || def.id}': ${Array.from(missing).join(', ')}`);
    }

    missing.forEach(cid => {
      // Only add if truly missing (race-safety)
      if (nodeMap.has(cid)) return;
      const placeholder: any = {
        id: cid,
        type: 'empty',
        name: `Placeholder (${cid})`,
        x: 75, // place near end so it typically sits before the boss
        y: 50,
        connections: def.bossNodeId ? [def.bossNodeId] : []
      };
      def.nodes.push(placeholder);
      nodeMap.set(cid, placeholder);
    });
  });
})();

export const getDungeonById = (id: string) => DUNGEON_DEFINITIONS.find(d => d.id === id);
export const listDungeons = () => DUNGEON_DEFINITIONS.map(d => ({ id: d.id, name: d.name, location: d.location, difficulty: d.difficulty, recommendedLevel: d.recommendedLevel }));

export default DUNGEON_DEFINITIONS;
