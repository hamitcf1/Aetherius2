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
      { id: 'bfb_combat1', type: 'combat', name: 'Bandit Ambush', description: 'A small band of raiders.', x: 20, y: 50, connections: ['bfb_rest1', 'bfb_combat2', 'bfb_reward1'], enemies: [simpleEnemy('b1','Bandit Vagrant','humanoid',1,30,6,40,10)] },
      { id: 'bfb_empty1', type: 'empty', name: 'Dusty Corridor', x: 20, y: 80, connections: ['bfb_reward1', 'bfb_combat3'] },
      // Row 2: Mix of types with cross-connections
      { id: 'bfb_combat2', type: 'combat', name: 'Draugr Patrol', x: 40, y: 15, connections: ['bfb_elite1', 'bfb_rest2'], enemies: [simpleEnemy('d1','Draugr','undead',2,45,8,60,15)] },
      { id: 'bfb_rest1', type: 'rest', name: 'Hidden Alcove', x: 40, y: 35, connections: ['bfb_elite1', 'bfb_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'bfb_reward1', type: 'reward', name: 'Burial Urn', x: 40, y: 65, connections: ['bfb_event2', 'bfb_combat4'], rewards: { gold: 35, items: [{ name: 'Ancient Nord Arrow', type: 'ammo', quantity: 5, rarity: 'common' }] } },
      { id: 'bfb_combat3', type: 'combat', name: 'Spider Nest', x: 40, y: 85, connections: ['bfb_combat4', 'bfb_rest2'], enemies: [simpleEnemy('sp1','Frostbite Spider','beast',1,25,5,35,8)] },
      // Row 3: Convergence toward elite
      { id: 'bfb_elite1', type: 'elite', name: 'Draugr Overlord', x: 60, y: 25, connections: ['bfb_event3', 'bfb_rest3'], enemies: [simpleEnemy('do1','Draugr Overlord','undead',3,80,14,100,30)] },
      { id: 'bfb_event2', type: 'event', name: 'Collapsed Passage', x: 60, y: 50, connections: ['bfb_rest3', 'bfb_combat5'], eventText: 'Rubble blocks the way. You might find something useful.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 30 }, { label: 'Force through', outcome: 'damage', value: 15 }] },
      { id: 'bfb_combat4', type: 'combat', name: 'Skeevers', x: 60, y: 75, connections: ['bfb_combat5', 'bfb_reward2'], enemies: [simpleEnemy('sk1','Skeever','beast',1,20,4,25,5), simpleEnemy('sk2','Skeever','beast',1,20,4,25,5)] },
      { id: 'bfb_rest2', type: 'rest', name: 'Warm Spring', x: 60, y: 95, connections: ['bfb_reward2'], restAmount: { health: 25, magicka: 15, stamina: 20 } },
      // Row 4: Pre-boss area
      { id: 'bfb_event3', type: 'event', name: 'Word Wall', x: 75, y: 20, connections: ['bfb_boss'], eventText: 'Ancient words echo in your mind...', eventChoices: [{ label: 'Meditate', outcome: 'reward', value: 50 }] },
      { id: 'bfb_rest3', type: 'rest', name: 'Sanctuary', x: 75, y: 40, connections: ['bfb_boss'], restAmount: { health: 30, magicka: 20, stamina: 25 } },
      { id: 'bfb_combat5', type: 'combat', name: 'Draugr Guards', x: 75, y: 60, connections: ['bfb_boss'], enemies: [simpleEnemy('dg1','Draugr','undead',2,40,8,50,12), simpleEnemy('dg2','Draugr','undead',2,40,8,50,12)] },
      { id: 'bfb_reward2', type: 'reward', name: 'Ancient Chest', x: 75, y: 85, connections: ['bfb_boss'], rewards: { gold: 60, items: [{ name: 'Nordic Dagger', type: 'weapon', quantity: 1, rarity: 'uncommon' }] } },
      // Boss
      { id: 'bfb_boss', type: 'boss', name: 'Draugr Death Overlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('bw1','Draugr Death Overlord','undead',4,150,18,200,60,true)] }
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
      { id: 'bh_combat1', type: 'combat', name: 'Patrol', x: 20, y: 15, connections: ['bh_elite1', 'bh_reward1'], enemies: [simpleEnemy('bb1','Bandit', 'humanoid', 2, 55, 10, 80, 20)] },
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
      { id: 'bh_boss', type: 'boss', name: 'Bandit Warlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('bboss','Bandit Warlord','humanoid',6,300,36,600,150,true)] }
    ]
  },

  {
    id: 'labyrinthian_dg',
    name: 'Labyrinthian Ruins',
    description: 'Twisting corridors with ancient guardians.',
    location: 'Labyrinthian',
    difficulty: 'hard',
    recommendedLevel: 8,
    theme: 'dwemer_ruin',
    ambientDescription: 'Echoing halls and rune-carved stone.',
    startNodeId: 'lab_start',
    bossNodeId: 'lab_boss',
    completionRewards: { gold: 480, xp: 1200, items: [{ name: 'Staff Fragment', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'lab_start', type: 'start', name: 'Outer Gate', x: 5, y: 50, connections: ['lab_combat1', 'lab_event1', 'lab_empty1', 'lab_reward1'] },
      { id: 'lab_combat1', type: 'combat', name: 'Automaton Sentry', x: 18, y: 10, connections: ['lab_elite1', 'lab_rest1'], enemies: [simpleEnemy('da1','Dwemer Sphere','automaton',7,180,24,350,70)] },
      { id: 'lab_event1', type: 'event', name: 'Unstable Runestone', x: 18, y: 35, connections: ['lab_rest1', 'lab_combat2'], eventText: 'A runestone hums with power.', eventChoices: [{ label: 'Invoke', outcome: 'damage', value: 40 }, { label: 'Harness', outcome: 'reward', value: 90 }] },
      { id: 'lab_empty1', type: 'empty', name: 'Dusty Hall', x: 18, y: 65, connections: ['lab_combat2', 'lab_event2'] },
      { id: 'lab_reward1', type: 'reward', name: 'Lofted Chest', x: 18, y: 90, connections: ['lab_event2', 'lab_combat3'], rewards: { gold: 100, items: [{ name: 'Dwemer Cog', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'lab_elite1', type: 'elite', name: 'Centurion Guardian', x: 35, y: 15, connections: ['lab_rest2', 'lab_combat4'], enemies: [simpleEnemy('cg1','Dwemer Centurion','automaton',9,300,40,700,150)] },
      { id: 'lab_rest1', type: 'rest', name: 'Ancient Library', x: 35, y: 30, connections: ['lab_combat4', 'lab_event3'], restAmount: { health: 35, magicka: 30, stamina: 30 } },
      { id: 'lab_combat2', type: 'combat', name: 'Spider Workers', x: 35, y: 50, connections: ['lab_event3', 'lab_reward2'], enemies: [simpleEnemy('sw1','Dwemer Spider','automaton',6,100,18,200,40), simpleEnemy('sw2','Dwemer Spider','automaton',6,100,18,200,40)] },
      { id: 'lab_event2', type: 'event', name: 'Lever Puzzle', x: 35, y: 70, connections: ['lab_reward2', 'lab_combat5'], eventText: 'Three levers control the gates.', eventChoices: [{ label: 'Solve', outcome: 'reward', value: 120 }, { label: 'Force', outcome: 'damage', value: 50 }] },
      { id: 'lab_combat3', type: 'combat', name: 'Falmer Scouts', x: 35, y: 90, connections: ['lab_combat5'], enemies: [simpleEnemy('fs1','Falmer','humanoid',7,150,22,320,60)] },
      { id: 'lab_rest2', type: 'rest', name: 'Hot Springs', x: 52, y: 20, connections: ['lab_elite2', 'lab_event4'], restAmount: { health: 40, magicka: 35, stamina: 35 } },
      { id: 'lab_combat4', type: 'combat', name: 'Ballistae', x: 52, y: 35, connections: ['lab_elite2', 'lab_combat6'], enemies: [simpleEnemy('bal1','Dwemer Ballista','automaton',8,200,30,450,90)] },
      { id: 'lab_event3', type: 'event', name: 'Tonal Lock', x: 52, y: 50, connections: ['lab_combat6', 'lab_reward3'], eventText: 'Musical tones echo in sequence.', eventChoices: [{ label: 'Repeat', outcome: 'reward', value: 100 }] },
      { id: 'lab_reward2', type: 'reward', name: 'Resonator Core', x: 52, y: 65, connections: ['lab_reward3', 'lab_rest3'], rewards: { gold: 150, items: [{ name: 'Soul Gem (Greater)', type: 'misc', quantity: 1, rarity: 'rare' }] } },
      { id: 'lab_combat5', type: 'combat', name: 'Chaurus', x: 52, y: 85, connections: ['lab_rest3'], enemies: [simpleEnemy('ch1','Chaurus','beast',7,140,20,280,55), simpleEnemy('ch2','Chaurus Hunter','beast',8,160,25,350,70)] },
      { id: 'lab_elite2', type: 'elite', name: 'Rune Warden', x: 70, y: 25, connections: ['lab_event5', 'lab_boss'], enemies: [simpleEnemy('rw1','Rune Warden','automaton',9,360,48,900,200)] },
      { id: 'lab_combat6', type: 'combat', name: 'Sphere Squadron', x: 70, y: 45, connections: ['lab_event5', 'lab_boss'], enemies: [simpleEnemy('ss1','Dwemer Sphere','automaton',7,180,24,350,70), simpleEnemy('ss2','Dwemer Sphere','automaton',7,180,24,350,70)] },
      { id: 'lab_reward3', type: 'reward', name: 'Research Cache', x: 70, y: 60, connections: ['lab_boss'], rewards: { gold: 200, items: [{ name: 'Dwemer Schematic', type: 'misc', quantity: 1, rarity: 'epic' }] } },
      { id: 'lab_rest3', type: 'rest', name: 'Hidden Sanctuary', x: 70, y: 80, connections: ['lab_boss'], restAmount: { health: 50, magicka: 40, stamina: 45 } },
      { id: 'lab_event4', type: 'event', name: 'Power Core', x: 85, y: 30, connections: ['lab_boss'], eventText: 'A glowing core pulses with energy.', eventChoices: [{ label: 'Absorb', outcome: 'reward', value: 150 }, { label: 'Destroy', outcome: 'damage', value: 60 }] },
      { id: 'lab_event5', type: 'event', name: 'Pressure Hallway', x: 85, y: 45, connections: ['lab_boss'], eventText: 'Blades spin in the corridor ahead.', eventChoices: [{ label: 'Time it', outcome: 'nothing' }, { label: 'Sprint', outcome: 'damage', value: 40 }] },
      { id: 'lab_boss', type: 'boss', name: 'Ancient Constructor', x: 95, y: 50, connections: [], enemies: [simpleEnemy('labboss','Ancient Constructor','automaton',12,900,80,2400,400,true)] }
    ]
  },

  {
    id: 'blackreach_dg', name: 'Blackreach Depths', description: 'A cavern of bioluminescent fungi and Falmer hunters.', location: 'Blackreach', difficulty: 'hard', recommendedLevel: 7, theme: 'ice_cave', ambientDescription: 'A cold vast cavern with glows on the stone.', startNodeId: 'br_start', bossNodeId: 'br_boss', completionRewards: { gold: 340, xp: 900, items: [{ name: 'Crimson Nirnroot', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'br_start', type: 'start', name: 'Sunken Entry', x: 5, y: 50, connections: ['br_combat1', 'br_event1', 'br_empty1'] },
      { id: 'br_combat1', type: 'combat', name: 'Falmer Patrol', x: 20, y: 20, connections: ['br_rest1', 'br_combat2'], enemies: [simpleEnemy('f1','Falmer Scout','humanoid',6,140,18,260,40)] },
      { id: 'br_event1', type: 'event', name: 'Glowing Mushrooms', x: 20, y: 50, connections: ['br_combat2', 'br_reward1'], eventText: 'Strange glowing fungi.', eventChoices: [{ label: 'Harvest', outcome: 'reward', value: 60 }] },
      { id: 'br_empty1', type: 'empty', name: 'Fungal Basin', x: 20, y: 80, connections: ['br_reward1', 'br_combat3'] },
      { id: 'br_rest1', type: 'rest', name: 'Warm Spring', x: 40, y: 15, connections: ['br_elite1', 'br_event2'], restAmount: { health: 30, magicka: 25 } },
      { id: 'br_combat2', type: 'combat', name: 'Chaurus Nest', x: 40, y: 35, connections: ['br_elite1', 'br_event2'], enemies: [simpleEnemy('ch1','Chaurus','beast',6,120,16,220,45)] },
      { id: 'br_reward1', type: 'reward', name: 'Sack in Roots', x: 40, y: 60, connections: ['br_event2', 'br_combat4'], rewards: { gold: 70, items: [{ name: 'Ectoplasm', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'br_combat3', type: 'combat', name: 'Frostbite Spiders', x: 40, y: 85, connections: ['br_combat4', 'br_rest2'], enemies: [simpleEnemy('sp1','Giant Frostbite Spider','beast',5,100,14,180,35)] },
      { id: 'br_elite1', type: 'elite', name: 'Falmer Shadowmaster', x: 60, y: 20, connections: ['br_rest3', 'br_boss'], enemies: [simpleEnemy('fsm','Falmer Shadowmaster','humanoid',8,280,32,650,120)] },
      { id: 'br_event2', type: 'event', name: 'Dwarven Lift', x: 60, y: 45, connections: ['br_rest3', 'br_combat5'], eventText: 'An ancient lift mechanism.', eventChoices: [{ label: 'Activate', outcome: 'reward', value: 80 }, { label: 'Bypass', outcome: 'nothing' }] },
      { id: 'br_combat4', type: 'combat', name: 'Falmer Hunters', x: 60, y: 65, connections: ['br_combat5', 'br_reward2'], enemies: [simpleEnemy('fh1','Falmer','humanoid',6,140,18,260,40), simpleEnemy('fh2','Falmer','humanoid',6,140,18,260,40)] },
      { id: 'br_rest2', type: 'rest', name: 'Hidden Grotto', x: 60, y: 90, connections: ['br_reward2'], restAmount: { health: 35, stamina: 30 } },
      { id: 'br_rest3', type: 'rest', name: 'Crystal Chamber', x: 75, y: 25, connections: ['br_boss'], restAmount: { health: 40, magicka: 35, stamina: 35 } },
      { id: 'br_combat5', type: 'combat', name: 'Deep Stalkers', x: 75, y: 50, connections: ['br_boss'], enemies: [simpleEnemy('ds1','Deep Hunter','humanoid',9,360,36,820,160)] },
      { id: 'br_reward2', type: 'reward', name: 'Falmer Hoard', x: 75, y: 75, connections: ['br_boss'], rewards: { gold: 120, items: [{ name: 'Falmer Ear', type: 'misc', quantity: 3, rarity: 'uncommon' }] } },
      { id: 'br_boss', type: 'boss', name: 'Falmer Chieftain', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Falmer Chieftain','humanoid',11,820,64,2000,300,true)] }
    ]
  },

  {
    id: 'vampire_lair_dg', name: 'Vampire Lair', description: 'A dark lair saturated with blood magics.', location: 'Morthal', difficulty: 'medium', recommendedLevel: 5, theme: 'vampire_lair', ambientDescription: 'Dark halls with crimson sigils.', startNodeId: 'vl_start', bossNodeId: 'vl_boss', completionRewards: { gold: 260, xp: 700, items: [{ name: 'Bloodstone Shard', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'vl_start', type: 'start', name: 'Stained Vestibule', x: 5, y: 50, connections: ['vl_combat1', 'vl_event1', 'vl_empty1'] },
      { id: 'vl_combat1', type: 'combat', name: 'Thrall Ambush', x: 20, y: 20, connections: ['vl_rest1', 'vl_combat2'], enemies: [simpleEnemy('vt1','Vampire Thrall','undead',4,120,16,220,45)] },
      { id: 'vl_event1', type: 'event', name: 'Blood Fountain', x: 20, y: 50, connections: ['vl_combat2', 'vl_reward1'], eventText: 'A fountain of blood bubbles.', eventChoices: [{ label: 'Drink', outcome: 'damage', value: 20 }, { label: 'Avoid', outcome: 'nothing' }] },
      { id: 'vl_empty1', type: 'empty', name: 'Dusty Crypt', x: 20, y: 80, connections: ['vl_reward1', 'vl_combat3'] },
      { id: 'vl_rest1', type: 'rest', name: 'Hidden Chamber', x: 40, y: 15, connections: ['vl_elite1', 'vl_event2'], restAmount: { health: 25, magicka: 20 } },
      { id: 'vl_combat2', type: 'combat', name: 'Vampire Spawn', x: 40, y: 35, connections: ['vl_elite1', 'vl_event2'], enemies: [simpleEnemy('vs1','Vampire Spawn','undead',5,140,18,280,55)] },
      { id: 'vl_reward1', type: 'reward', name: 'Coffin Cache', x: 40, y: 60, connections: ['vl_event2', 'vl_combat4'], rewards: { gold: 80, items: [{ name: 'Vampire Dust', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'vl_combat3', type: 'combat', name: 'Death Hounds', x: 40, y: 85, connections: ['vl_combat4', 'vl_rest2'], enemies: [simpleEnemy('dh1','Death Hound','beast',4,100,14,180,35), simpleEnemy('dh2','Death Hound','beast',4,100,14,180,35)] },
      { id: 'vl_elite1', type: 'elite', name: 'Master Vampire', x: 60, y: 20, connections: ['vl_event3', 'vl_boss'], enemies: [simpleEnemy('mv1','Master Vampire','undead',7,260,28,540,100)] },
      { id: 'vl_event2', type: 'event', name: 'Blood Altar', x: 60, y: 45, connections: ['vl_event3', 'vl_combat5'], eventText: 'An altar hums. Sacrifice may grant power.', eventChoices: [{ label: 'Offer', outcome: 'reward', value: 80 }, { label: 'Refuse', outcome: 'nothing' }] },
      { id: 'vl_combat4', type: 'combat', name: 'Vampire Nightstalker', x: 60, y: 65, connections: ['vl_combat5', 'vl_reward2'], enemies: [simpleEnemy('vn1','Vampire Nightstalker','undead',6,180,22,360,70)] },
      { id: 'vl_rest2', type: 'rest', name: 'Safe Corner', x: 60, y: 90, connections: ['vl_reward2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'vl_event3', type: 'event', name: 'Enchanting Table', x: 75, y: 25, connections: ['vl_boss'], eventText: 'A dark enchanting table.', eventChoices: [{ label: 'Use', outcome: 'reward', value: 60 }] },
      { id: 'vl_combat5', type: 'combat', name: 'Gargoyles', x: 75, y: 50, connections: ['vl_boss'], enemies: [simpleEnemy('gar1','Gargoyle','beast',6,200,24,400,80)] },
      { id: 'vl_reward2', type: 'reward', name: 'Blood Treasury', x: 75, y: 75, connections: ['vl_boss'], rewards: { gold: 120, items: [{ name: 'Ring of Blood Magic', type: 'apparel', quantity: 1, rarity: 'rare' }] } },
      { id: 'vl_boss', type: 'boss', name: 'Vampire Matriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('vmb','Vampire Matriarch','undead',10,600,54,1500,220,true)] }
    ]
  },

  {
    id: 'frost_spider_den_dg', name: 'Frost Spider Den', description: 'A nest of giant frost spiders and web traps.', location: 'Winterhold', difficulty: 'easy', recommendedLevel: 2, theme: 'ice_cave', ambientDescription: 'Silvery silk glistening in cold air.', startNodeId: 'fs_start', bossNodeId: 'fs_boss', completionRewards: { gold: 100, xp: 220, items: [{ name: 'Spider Venom', type: 'misc', quantity: 1, rarity: 'uncommon' as LootRarity }] },
    nodes: [
      { id: 'fs_start', type: 'start', name: 'Webbed Entry', x: 5, y: 50, connections: ['fs_combat1', 'fs_event1', 'fs_empty1'] },
      { id: 'fs_combat1', type: 'combat', name: 'Broodlings', x: 20, y: 20, connections: ['fs_rest1', 'fs_combat2'], enemies: [simpleEnemy('sp1','Frost Spiderling','beast',2,40,8,60,10), simpleEnemy('sp2','Frost Spiderling','beast',2,40,8,60,10)] },
      { id: 'fs_event1', type: 'event', name: 'Cocooned Corpse', x: 20, y: 50, connections: ['fs_combat2', 'fs_reward1'], eventText: 'A body wrapped in webs.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 35 }] },
      { id: 'fs_empty1', type: 'empty', name: 'Frozen Chamber', x: 20, y: 80, connections: ['fs_reward1', 'fs_combat3'] },
      { id: 'fs_rest1', type: 'rest', name: 'Heated Pocket', x: 40, y: 15, connections: ['fs_elite1', 'fs_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'fs_combat2', type: 'combat', name: 'Webspinners', x: 40, y: 35, connections: ['fs_elite1', 'fs_event2'], enemies: [simpleEnemy('ws1','Webspinner Spider','beast',3,60,10,80,15)] },
      { id: 'fs_reward1', type: 'reward', name: 'Adventurer Pack', x: 40, y: 60, connections: ['fs_event2', 'fs_combat4'], rewards: { gold: 40, items: [{ name: 'Torch', type: 'misc', quantity: 2, rarity: 'common' }] } },
      { id: 'fs_combat3', type: 'combat', name: 'Ice Wraiths', x: 40, y: 85, connections: ['fs_combat4', 'fs_rest2'], enemies: [simpleEnemy('iw1','Ice Wraith','beast',3,50,12,90,20)] },
      { id: 'fs_elite1', type: 'elite', name: 'Giant Spider', x: 60, y: 20, connections: ['fs_rest3', 'fs_boss'], enemies: [simpleEnemy('gs1','Giant Frostbite Spider','beast',4,150,16,200,40)] },
      { id: 'fs_event2', type: 'event', name: 'Frozen Chest', x: 60, y: 45, connections: ['fs_rest3', 'fs_combat5'], eventText: 'Ice covers a chest.', eventChoices: [{ label: 'Thaw', outcome: 'reward', value: 50 }] },
      { id: 'fs_combat4', type: 'combat', name: 'Ambush Spiders', x: 60, y: 65, connections: ['fs_combat5', 'fs_reward2'], enemies: [simpleEnemy('as1','Ambush Spider','beast',3,55,11,75,18)] },
      { id: 'fs_rest2', type: 'rest', name: 'Sticky Nook', x: 60, y: 90, connections: ['fs_reward2'], restAmount: { stamina: 20, health: 15 } },
      { id: 'fs_rest3', type: 'rest', name: 'Safe Ledge', x: 75, y: 25, connections: ['fs_boss'], restAmount: { health: 25, stamina: 20 } },
      { id: 'fs_combat5', type: 'combat', name: 'Spider Guards', x: 75, y: 50, connections: ['fs_boss'], enemies: [simpleEnemy('sg1','Frost Spider','beast',3,70,12,100,22), simpleEnemy('sg2','Frost Spider','beast',3,70,12,100,22)] },
      { id: 'fs_reward2', type: 'reward', name: 'Egg Sac Loot', x: 75, y: 75, connections: ['fs_boss'], rewards: { gold: 30, items: [{ name: 'Spider Egg', type: 'misc', quantity: 4, rarity: 'common' }] } },
      { id: 'fs_boss', type: 'boss', name: 'Broodmother', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fsboss','Frost Broodmother','beast',5,420,32,540,80,true)] }
    ]
  },

  {
    id: 'daedric_shrine_dg', name: 'Daedric Shrine', description: 'A warped shrine with daedric guardians and bargains.', location: 'Winterhold', difficulty: 'legendary', recommendedLevel: 15, theme: 'daedric_shrine', ambientDescription: 'Whispers in a language you do not know.', startNodeId: 'ds_start', bossNodeId: 'ds_boss', completionRewards: { gold: 1200, xp: 5000, items: [{ name: 'Daedric Relic', type: 'misc', quantity: 1, rarity: 'legendary' as LootRarity }] },
    nodes: [
      { id: 'ds_start', type: 'start', name: 'Ritual Gate', x: 5, y: 50, connections: ['ds_event1', 'ds_combat1', 'ds_empty1'] },
      { id: 'ds_event1', type: 'event', name: 'Unholy Pact', x: 20, y: 20, connections: ['ds_rest1', 'ds_combat2'], eventText: 'A voice offers power for a price.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 400 }, { label: 'Decline', outcome: 'damage', value: 100 }] },
      { id: 'ds_combat1', type: 'combat', name: 'Dremora Scout', x: 20, y: 50, connections: ['ds_combat2', 'ds_reward1'], enemies: [simpleEnemy('dsc1','Dremora','daedra',12,600,80,2000,400)] },
      { id: 'ds_empty1', type: 'empty', name: 'Void Chamber', x: 20, y: 80, connections: ['ds_reward1', 'ds_combat3'] },
      { id: 'ds_rest1', type: 'rest', name: 'Soul Trap', x: 40, y: 15, connections: ['ds_elite1', 'ds_event2'], restAmount: { health: 60, magicka: 50, stamina: 50 } },
      { id: 'ds_combat2', type: 'combat', name: 'Atronachs', x: 40, y: 35, connections: ['ds_elite1', 'ds_event2'], enemies: [simpleEnemy('fa1','Flame Atronach','daedra',11,400,60,1500,300), simpleEnemy('sa1','Storm Atronach','daedra',11,450,55,1600,320)] },
      { id: 'ds_reward1', type: 'reward', name: 'Daedra Heart', x: 40, y: 60, connections: ['ds_event2', 'ds_combat4'], rewards: { gold: 500, items: [{ name: 'Daedra Heart', type: 'misc', quantity: 1, rarity: 'epic' }] } },
      { id: 'ds_combat3', type: 'combat', name: 'Scamps', x: 40, y: 85, connections: ['ds_combat4', 'ds_rest2'], enemies: [simpleEnemy('sc1','Scamp','daedra',10,300,45,1000,200), simpleEnemy('sc2','Scamp','daedra',10,300,45,1000,200)] },
      { id: 'ds_elite1', type: 'elite', name: 'Daedra Knight', x: 60, y: 20, connections: ['ds_event3', 'ds_boss'], enemies: [simpleEnemy('dk1','Daedra Knight','daedra',15,1800,160,4200,800)] },
      { id: 'ds_event2', type: 'event', name: 'Sigil Stone', x: 60, y: 45, connections: ['ds_event3', 'ds_combat5'], eventText: 'A sigil stone pulses with oblivion energy.', eventChoices: [{ label: 'Take', outcome: 'reward', value: 600 }, { label: 'Destroy', outcome: 'damage', value: 150 }] },
      { id: 'ds_combat4', type: 'combat', name: 'Lurkers', x: 60, y: 65, connections: ['ds_combat5', 'ds_reward2'], enemies: [simpleEnemy('lu1','Lurker','daedra',13,800,100,3000,500)] },
      { id: 'ds_rest2', type: 'rest', name: 'Sanctuary', x: 60, y: 90, connections: ['ds_reward2'], restAmount: { health: 70, magicka: 60, stamina: 60 } },
      { id: 'ds_event3', type: 'event', name: 'Dark Bargain', x: 75, y: 25, connections: ['ds_boss'], eventText: 'Ultimate power, for a soul.', eventChoices: [{ label: 'Pay', outcome: 'damage', value: 200 }, { label: 'Refuse', outcome: 'nothing' }] },
      { id: 'ds_combat5', type: 'combat', name: 'Dremora Kynval', x: 75, y: 50, connections: ['ds_boss'], enemies: [simpleEnemy('dky1','Dremora Kynval','daedra',14,1200,120,3500,600)] },
      { id: 'ds_reward2', type: 'reward', name: 'Oblivion Cache', x: 75, y: 75, connections: ['ds_boss'], rewards: { gold: 800, items: [{ name: 'Black Soul Gem', type: 'misc', quantity: 1, rarity: 'legendary' }] } },
      { id: 'ds_boss', type: 'boss', name: 'Dremora Overlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('dboss','Dremora Overlord','daedra',18,3600,300,9000,2500,true)] }
    ]
  },

  {
    id: 'forsworn_camp_dg', name: 'Forsworn Camp', description: 'A tangled network of stone altars and forsworn brutes.', location: 'Markarth', difficulty: 'medium', recommendedLevel: 6, theme: 'forsworn_camp', ambientDescription: 'Wild drums and bitter smoke.', startNodeId: 'fc_start', bossNodeId: 'fc_boss', completionRewards: { gold: 300, xp: 760, items: [{ name: 'Forsworn Token', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] },
    nodes: [
      { id: 'fc_start', type: 'start', name: 'Outskirts', x: 5, y: 50, connections: ['fc_combat1', 'fc_event1', 'fc_empty1'] },
      { id: 'fc_combat1', type: 'combat', name: 'Scouts', x: 20, y: 20, connections: ['fc_rest1', 'fc_combat2'], enemies: [simpleEnemy('fw1','Forsworn','humanoid',5,150,18,280,50)] },
      { id: 'fc_event1', type: 'event', name: 'Ritual Stones', x: 20, y: 50, connections: ['fc_combat2', 'fc_reward1'], eventText: 'A childs offering lies there.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 60 }] },
      { id: 'fc_empty1', type: 'empty', name: 'Empty Tent', x: 20, y: 80, connections: ['fc_reward1', 'fc_combat3'] },
      { id: 'fc_rest1', type: 'rest', name: 'Hidden Cave', x: 40, y: 15, connections: ['fc_elite1', 'fc_event2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'fc_combat2', type: 'combat', name: 'Wildermen', x: 40, y: 35, connections: ['fc_elite1', 'fc_event2'], enemies: [simpleEnemy('fw2','Forsworn Ravager','humanoid',6,180,22,340,65)] },
      { id: 'fc_reward1', type: 'reward', name: 'Totem Cache', x: 40, y: 60, connections: ['fc_event2', 'fc_combat4'], rewards: { gold: 70, items: [{ name: 'Bone Charm', type: 'misc', quantity: 1, rarity: 'uncommon' }] } },
      { id: 'fc_combat3', type: 'combat', name: 'Hagravens', x: 40, y: 85, connections: ['fc_combat4', 'fc_rest2'], enemies: [simpleEnemy('hag1','Hagraven','humanoid',7,200,28,420,85)] },
      { id: 'fc_elite1', type: 'elite', name: 'Forsworn Champion', x: 60, y: 20, connections: ['fc_event3', 'fc_boss'], enemies: [simpleEnemy('fe1','Forsworn Champion','humanoid',8,420,44,980,180)] },
      { id: 'fc_event2', type: 'event', name: 'Blood Ritual', x: 60, y: 45, connections: ['fc_event3', 'fc_combat5'], eventText: 'A sacrifice is underway.', eventChoices: [{ label: 'Interrupt', outcome: 'reward', value: 80 }, { label: 'Watch', outcome: 'damage', value: 30 }] },
      { id: 'fc_combat4', type: 'combat', name: 'Briarheart', x: 60, y: 65, connections: ['fc_combat5', 'fc_reward2'], enemies: [simpleEnemy('bh1','Forsworn Briarheart','humanoid',7,280,36,580,110)] },
      { id: 'fc_rest2', type: 'rest', name: 'Prisoner Cage', x: 60, y: 90, connections: ['fc_reward2'], restAmount: { health: 25, stamina: 20 } },
      { id: 'fc_event3', type: 'event', name: 'Hagraven Nest', x: 75, y: 25, connections: ['fc_boss'], eventText: 'Feathers and bones everywhere.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 100 }] },
      { id: 'fc_combat5', type: 'combat', name: 'Elite Guards', x: 75, y: 50, connections: ['fc_boss'], enemies: [simpleEnemy('fg1','Forsworn Ravager','humanoid',6,180,22,340,65), simpleEnemy('fg2','Forsworn','humanoid',5,150,18,280,50)] },
      { id: 'fc_reward2', type: 'reward', name: 'Headhunter Cache', x: 75, y: 75, connections: ['fc_boss'], rewards: { gold: 90, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 2, rarity: 'common' }] } },
      { id: 'fc_boss', type: 'boss', name: 'Briar Matron', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Briar Matron','humanoid',10,880,76,2200,420,true)] }
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
      { id: 'tc_combat1', type: 'combat', name: 'Young Troll', x: 20, y: 25, connections: ['tc_rest1', 'tc_reward1'], enemies: [simpleEnemy('yt1','Young Troll','beast',2,60,10,80,15)] },
      { id: 'tc_event1', type: 'event', name: 'Adventurer Remains', x: 20, y: 50, connections: ['tc_reward1', 'tc_combat2'], eventText: 'A half-eaten corpse clutches a pack.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 40 }] },
      { id: 'tc_empty1', type: 'empty', name: 'Narrow Passage', x: 20, y: 75, connections: ['tc_combat2', 'tc_rest1'] },
      { id: 'tc_rest1', type: 'rest', name: 'Safe Alcove', x: 40, y: 20, connections: ['tc_elite1', 'tc_event2'], restAmount: { health: 20, stamina: 15 } },
      { id: 'tc_reward1', type: 'reward', name: 'Bone Pile', x: 40, y: 45, connections: ['tc_elite1', 'tc_event2'], rewards: { gold: 30, items: [{ name: 'Bone Meal', type: 'misc', quantity: 2, rarity: 'common' }] } },
      { id: 'tc_combat2', type: 'combat', name: 'Cave Bear', x: 40, y: 70, connections: ['tc_event2', 'tc_reward2'], enemies: [simpleEnemy('cb1','Cave Bear','beast',3,80,14,100,20)] },
      { id: 'tc_elite1', type: 'elite', name: 'Frost Troll', x: 60, y: 30, connections: ['tc_boss'], enemies: [simpleEnemy('ft1','Frost Troll','beast',4,140,20,180,40)] },
      { id: 'tc_event2', type: 'event', name: 'Glowing Mushrooms', x: 60, y: 55, connections: ['tc_boss', 'tc_reward2'], eventText: 'Strange luminescent fungi grow here.', eventChoices: [{ label: 'Harvest', outcome: 'reward', value: 30 }] },
      { id: 'tc_reward2', type: 'reward', name: 'Hidden Cache', x: 60, y: 80, connections: ['tc_boss'], rewards: { gold: 45, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 1, rarity: 'common' }] } },
      { id: 'tc_boss', type: 'boss', name: 'Troll Patriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('tcboss','Troll Patriarch','beast',5,240,28,320,60,true)] }
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
      { id: 'ic_combat1', type: 'combat', name: 'Ice Wolves', x: 20, y: 20, connections: ['ic_rest1', 'ic_combat2'], enemies: [simpleEnemy('iw1','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('iw2','Ice Wolf','beast',3,50,10,70,15)] },
      { id: 'ic_event1', type: 'event', name: 'Frozen Statue', x: 20, y: 50, connections: ['ic_combat2', 'ic_reward1'], eventText: 'An adventurer frozen solid clutches something shiny.', eventChoices: [{ label: 'Thaw', outcome: 'reward', value: 50 }, { label: 'Smash', outcome: 'damage', value: 15 }] },
      { id: 'ic_empty1', type: 'empty', name: 'Icy Corridor', x: 20, y: 80, connections: ['ic_reward1', 'ic_combat3'] },
      { id: 'ic_rest1', type: 'rest', name: 'Warm Pocket', x: 40, y: 15, connections: ['ic_elite1', 'ic_event2'], restAmount: { health: 25, magicka: 15, stamina: 20 } },
      { id: 'ic_combat2', type: 'combat', name: 'Ice Wraith', x: 40, y: 35, connections: ['ic_elite1', 'ic_event2'], enemies: [simpleEnemy('wr1','Ice Wraith','beast',4,70,14,120,25)] },
      { id: 'ic_reward1', type: 'reward', name: 'Frozen Chest', x: 40, y: 60, connections: ['ic_event2', 'ic_combat4'], rewards: { gold: 55, items: [{ name: 'Frost Salts', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'ic_combat3', type: 'combat', name: 'Snowy Sabre Cat', x: 40, y: 85, connections: ['ic_combat4', 'ic_rest2'], enemies: [simpleEnemy('sc1','Snowy Sabre Cat','beast',4,90,16,140,30)] },
      { id: 'ic_elite1', type: 'elite', name: 'Frost Atronach', x: 60, y: 20, connections: ['ic_event3', 'ic_boss'], enemies: [simpleEnemy('fa1','Frost Atronach','daedra',5,180,22,260,50)] },
      { id: 'ic_event2', type: 'event', name: 'Ice Bridge', x: 60, y: 45, connections: ['ic_event3', 'ic_combat5'], eventText: 'A treacherous bridge of ice spans a chasm.', eventChoices: [{ label: 'Careful', outcome: 'nothing' }, { label: 'Sprint', outcome: 'damage', value: 25 }] },
      { id: 'ic_combat4', type: 'combat', name: 'Wolf Pack', x: 60, y: 65, connections: ['ic_combat5', 'ic_reward2'], enemies: [simpleEnemy('wp1','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('wp2','Ice Wolf','beast',3,50,10,70,15), simpleEnemy('wp3','Ice Wolf Alpha','beast',4,80,14,100,25)] },
      { id: 'ic_rest2', type: 'rest', name: 'Sheltered Cave', x: 60, y: 90, connections: ['ic_reward2'], restAmount: { health: 30, stamina: 25 } },
      { id: 'ic_event3', type: 'event', name: 'Word Wall Fragment', x: 75, y: 25, connections: ['ic_boss'], eventText: 'Faint dragon script glows on cracked ice.', eventChoices: [{ label: 'Study', outcome: 'reward', value: 80 }] },
      { id: 'ic_combat5', type: 'combat', name: 'Frost Troll', x: 75, y: 50, connections: ['ic_boss'], enemies: [simpleEnemy('ft1','Frost Troll','beast',5,160,24,220,45)] },
      { id: 'ic_reward2', type: 'reward', name: 'Hunter\'s Cache', x: 75, y: 75, connections: ['ic_boss'], rewards: { gold: 70, items: [{ name: 'Ice Wolf Pelt', type: 'misc', quantity: 1, rarity: 'uncommon' }] } },
      { id: 'ic_boss', type: 'boss', name: 'Frost Giant', x: 95, y: 50, connections: [], enemies: [simpleEnemy('icboss','Frost Giant','beast',7,380,36,540,100,true)] }
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
      { id: 'ms_combat1', type: 'combat', name: 'Bandit Lookouts', x: 20, y: 20, connections: ['ms_rest1', 'ms_combat2'], enemies: [simpleEnemy('bl1','Bandit','humanoid',4,100,14,160,30), simpleEnemy('bl2','Bandit','humanoid',4,100,14,160,30)] },
      { id: 'ms_event1', type: 'event', name: 'Unstable Tunnel', x: 20, y: 50, connections: ['ms_combat2', 'ms_reward1'], eventText: 'The ceiling groans ominously.', eventChoices: [{ label: 'Sneak', outcome: 'nothing' }, { label: 'Run', outcome: 'damage', value: 20 }] },
      { id: 'ms_empty1', type: 'empty', name: 'Collapsed Shaft', x: 20, y: 80, connections: ['ms_reward1', 'ms_combat3'] },
      { id: 'ms_rest1', type: 'rest', name: 'Supply Room', x: 40, y: 15, connections: ['ms_elite1', 'ms_event2'], restAmount: { health: 25, stamina: 20 } },
      { id: 'ms_combat2', type: 'combat', name: 'Mine Guards', x: 40, y: 35, connections: ['ms_elite1', 'ms_event2'], enemies: [simpleEnemy('mg1','Bandit Thug','humanoid',5,130,18,200,40)] },
      { id: 'ms_reward1', type: 'reward', name: 'Ore Vein', x: 40, y: 60, connections: ['ms_event2', 'ms_combat4'], rewards: { gold: 60, items: [{ name: 'Iron Ore', type: 'misc', quantity: 4, rarity: 'common' }] } },
      { id: 'ms_combat3', type: 'combat', name: 'Skeevers', x: 40, y: 85, connections: ['ms_combat4', 'ms_rest2'], enemies: [simpleEnemy('sk1','Skeever','beast',2,35,8,40,8), simpleEnemy('sk2','Skeever','beast',2,35,8,40,8), simpleEnemy('sk3','Skeever','beast',2,35,8,40,8)] },
      { id: 'ms_elite1', type: 'elite', name: 'Bandit Marauder', x: 60, y: 20, connections: ['ms_event3', 'ms_boss'], enemies: [simpleEnemy('bm1','Bandit Marauder','humanoid',6,180,24,320,60)] },
      { id: 'ms_event2', type: 'event', name: 'Trapped Miner', x: 60, y: 45, connections: ['ms_event3', 'ms_combat5'], eventText: 'A miner cries for help under rubble.', eventChoices: [{ label: 'Rescue', outcome: 'reward', value: 60 }, { label: 'Ignore', outcome: 'nothing' }] },
      { id: 'ms_combat4', type: 'combat', name: 'Frostbite Spiders', x: 60, y: 65, connections: ['ms_combat5', 'ms_reward2'], enemies: [simpleEnemy('fs1','Frostbite Spider','beast',4,70,12,100,20), simpleEnemy('fs2','Frostbite Spider','beast',4,70,12,100,20)] },
      { id: 'ms_rest2', type: 'rest', name: 'Hidden Nook', x: 60, y: 90, connections: ['ms_reward2'], restAmount: { health: 30, magicka: 20, stamina: 25 } },
      { id: 'ms_event3', type: 'event', name: 'Forge Room', x: 75, y: 25, connections: ['ms_boss'], eventText: 'An active forge with tools nearby.', eventChoices: [{ label: 'Use', outcome: 'reward', value: 50 }] },
      { id: 'ms_combat5', type: 'combat', name: 'Bandit Archers', x: 75, y: 50, connections: ['ms_boss'], enemies: [simpleEnemy('ba1','Bandit Archer','humanoid',5,90,16,180,35), simpleEnemy('ba2','Bandit Archer','humanoid',5,90,16,180,35)] },
      { id: 'ms_reward2', type: 'reward', name: 'Mining Cache', x: 75, y: 75, connections: ['ms_boss'], rewards: { gold: 85, items: [{ name: 'Corundum Ore', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'ms_boss', type: 'boss', name: 'Bandit Chief', x: 95, y: 50, connections: [], enemies: [simpleEnemy('msboss','Bandit Chief','humanoid',8,340,38,600,120,true)] }
    ]
  }
];

export const getDungeonById = (id: string) => DUNGEON_DEFINITIONS.find(d => d.id === id);
export const listDungeons = () => DUNGEON_DEFINITIONS.map(d => ({ id: d.id, name: d.name, location: d.location, difficulty: d.difficulty, recommendedLevel: d.recommendedLevel }));

export default DUNGEON_DEFINITIONS;
