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
      { id: 'bfb_start', type: 'start', name: 'Entrance Hall', x: 10, y: 50, connections: ['bfb_path1'] },
      { id: 'bfb_path1', type: 'combat', name: 'Bandit Ambush', description: 'A small band of raiders ambushes the party.', x: 30, y: 40, connections: ['bfb_rest'], enemies: [simpleEnemy('b1','Bandit Vagrant','humanoid',1,30,6,40,10)] },
      { id: 'bfb_rest', type: 'rest', name: 'Dusty Alcove', description: 'A sheltered alcove to catch your breath.', x: 50, y: 45, connections: ['bfb_event'] , restAmount: { health: 15, stamina: 15 }},
      { id: 'bfb_event', type: 'event', name: 'Collapsed Passage', description: 'The ceiling has partially collapsed. A weak spot might yield supplies.', x: 70, y: 42, connections: ['bfb_boss'], eventText: 'You clear rubble and find a small pouch of coins.', eventChoices: [{ label: 'Search', outcome: 'reward', value: 30 }] },
      { id: 'bfb_boss', type: 'boss', name: 'Draugr Wight', description: 'A restless draugr rises to challenge you.', x: 90, y: 50, connections: [], enemies: [simpleEnemy('bw1','Draugr Wight','undead',3,120,16,180,50,true)] }
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
      { id: 'bh_start', type: 'start', name: 'Camp Entrance', x: 10, y: 50, connections: ['bh_path1','bh_path2'] },
      { id: 'bh_path1', type: 'combat', name: 'Patrols', x: 30, y: 35, connections: ['bh_elite'], enemies: [simpleEnemy('bb1','Bandit', 'humanoid', 2, 55, 10, 80, 20)] },
      { id: 'bh_path2', type: 'event', name: 'Tinder Pile', x: 30, y: 65, connections: ['bh_reward'], eventText: 'A stash of supplies sits under a tarp.', eventChoices: [{ label: 'Check', outcome: 'reward', value: 40 }] },
      { id: 'bh_elite', type: 'elite', name: 'Elite Watch', x: 60, y: 40, connections: ['bh_boss'], enemies: [simpleEnemy('be1','Bandit Captain','humanoid',4,160,20,220,40)] },
      { id: 'bh_reward', type: 'reward', name: 'Hidden Cache', x: 60, y: 70, connections: ['bh_boss'], rewards: { gold: 60, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 1, rarity: 'common' }] } },
      { id: 'bh_boss', type: 'boss', name: 'Bandit Warlord', x: 90, y: 50, connections: [], enemies: [simpleEnemy('bboss','Bandit Warlord','humanoid',6,300,36,600,150,true)] }
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
      { id: 'lab_start', type: 'start', name: 'Outer Gate', x: 5, y: 50, connections: ['lab_path1','lab_path2'] },
      { id: 'lab_path1', type: 'combat', name: 'Dwemer Automata', x: 30, y: 35, connections: ['lab_event'], enemies: [simpleEnemy('da1','Automaton Guard','automaton',7,220,26,420,80)] },
      { id: 'lab_path2', type: 'empty', name: 'Dusty Hall', x: 30, y: 65, connections: ['lab_reward'] , description: 'A room of broken pillars. Not much here.'},
      { id: 'lab_event', type: 'event', name: 'Unstable Runestone', x: 55, y: 40, connections: ['lab_elite'], eventText: 'A runestone hums with power. It might weaken enemies or hurt you.', eventChoices: [{ label: 'Invoke', outcome: 'damage', value: 40 }, { label: 'Harness', outcome: 'reward', value: 90 }] },
      { id: 'lab_reward', type: 'reward', name: 'Lofted Chest', x: 55, y: 70, connections: ['lab_elite'], rewards: { gold: 120, items: [{ name: 'Dwemer Coil', type: 'misc', quantity: 1, rarity: 'uncommon' }] } },
      { id: 'lab_elite', type: 'elite', name: 'Rune Warden', x: 75, y: 55, connections: ['lab_boss'], enemies: [simpleEnemy('rw1','Rune Warden','automaton',9,360,48,900,200)] },
      { id: 'lab_boss', type: 'boss', name: 'Ancient Constructor', x: 95, y: 50, connections: [], enemies: [simpleEnemy('labboss','Ancient Constructor','automaton',12,900,80,2400,400,true)] }
    ]
  },

  // More dungeons (11+ additional) kept concise but meeting variety and branching
  {
    id: 'blackreach_dg', name: 'Blackreach Depths', description: 'A cavern of bioluminescent fungi and Falmer hunters.', location: 'Blackreach', difficulty: 'hard', recommendedLevel: 7, theme: 'ice_cave', ambientDescription: 'A cold vast cavern with glows on the stone.', startNodeId: 'br_start', bossNodeId: 'br_boss', completionRewards: { gold: 340, xp: 900, items: [{ name: 'Crimson Piece', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] }, nodes: [
      { id: 'br_start', type: 'start', name: 'Sunken Curtain', x: 10, y: 50, connections: ['br_path1','br_path2'] },
      { id: 'br_path1', type: 'combat', name: 'Falmer Patrol', x: 30, y: 35, connections: ['br_rest'], enemies: [simpleEnemy('f1','Falmer Scout','humanoid',6,140,18,260,40)] },
      { id: 'br_path2', type: 'empty', name: 'Fungal Basin', x: 30, y: 65, connections: ['br_reward'] },
      { id: 'br_rest', type: 'rest', name: 'Warm Spring', x: 55, y: 45, connections: ['br_elite'], restAmount: { health: 30 } },
      { id: 'br_reward', type: 'reward', name: 'Sack in Roots', x: 55, y: 70, connections: ['br_elite'], rewards: { items: [{ name: 'Ectoplasm', type: 'misc', quantity: 2, rarity: 'uncommon' }] } },
      { id: 'br_elite', type: 'elite', name: 'Deep Hunter', x: 75, y: 55, connections: ['br_boss'], enemies: [simpleEnemy('dh1','Deep Hunter','humanoid',9,360,36,820,160)] },
      { id: 'br_boss', type: 'boss', name: 'Falmer Chieftain', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Falmer Chieftain','humanoid',11,820,64,2000,300,true)] }
    ]
  },

  {
    id: 'vampire_lair_dg', name: 'Vampire Lair', description: 'A dark lair saturated with blood magics.', location: 'Morthal', difficulty: 'medium', recommendedLevel: 5, theme: 'vampire_lair', ambientDescription: 'Dark halls with crimson sigils.', startNodeId: 'vl_start', bossNodeId: 'vl_boss', completionRewards: { gold: 260, xp: 700, items: [{ name: 'Bloodstone Shard', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] }, nodes: [
      { id: 'vl_start', type: 'start', name: 'Stained Vestibule', x: 10, y: 50, connections: ['vl_combat'] },
      { id: 'vl_combat', type: 'combat', name: 'Thrall Ambush', x: 40, y: 50, connections: ['vl_event'], enemies: [simpleEnemy('vt1','Vampire Thrall','undead',5,160,22,300,60)] },
      { id: 'vl_event', type: 'event', name: 'Blood Altar', x: 65, y: 50, connections: ['vl_boss'], eventText: 'An altar hums. Sacrifice may grant power or danger.', eventChoices: [{ label: 'Offer', outcome: 'reward', value: 80 }, { label: 'Refuse', outcome: 'nothing' }] },
      { id: 'vl_boss', type: 'boss', name: 'Vampire Matriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('vmb','Vampire Matriarch','undead',10,600,54,1500,220,true)] }
    ]
  },

  {
    id: 'frost_spider_den_dg', name: 'Frost Spider Den', description: 'A nest of giant frost spiders and web traps.', location: 'Winterhold', difficulty: 'easy', recommendedLevel: 2, theme: 'ice_cave', ambientDescription: 'Silvery silk glistening in cold air.', startNodeId: 'fs_start', bossNodeId: 'fs_boss', completionRewards: { gold: 100, xp: 220, items: [{ name: 'Spider Venom', type: 'misc', quantity: 1, rarity: 'uncommon' as LootRarity }] }, nodes: [
      { id: 'fs_start', type: 'start', name: 'Webbed Entry', x: 10, y: 50, connections: ['fs_combat'] },
      { id: 'fs_combat', type: 'combat', name: 'Broodlings', x: 40, y: 50, connections: ['fs_rest'], enemies: [simpleEnemy('sp1','Frost Spiderling','beast',2,60,10,90,10)] },
      { id: 'fs_rest', type: 'rest', name: 'Sticky Nook', x: 70, y: 50, connections: ['fs_boss'], restAmount: { stamina: 20 } },
      { id: 'fs_boss', type: 'boss', name: 'Broodmother', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fsboss','Frost Broodmother','beast',5,420,32,540,80,true)] }
    ]
  },

  {
    id: 'troll_cave_dg', name: 'Troll Cave', description: 'A shallow cave dominated by a territorial troll.', location: 'Rorikstead', difficulty: 'easy', recommendedLevel: 2, theme: 'mine', ambientDescription: 'The smell of damp stone and rotting meat.', startNodeId: 'tc_start', bossNodeId: 'tc_boss', completionRewards: { gold: 80, xp: 160, items: [{ name: 'Troll Fat', type: 'misc', quantity: 1, rarity: 'common' as LootRarity }] }, nodes: [
      { id: 'tc_start', type: 'start', name: 'Cave Mouth', x: 10, y: 50, connections: ['tc_path'] },
      { id: 'tc_path', type: 'combat', name: 'Small Trolls', x: 50, y: 50, connections: ['tc_boss'], enemies: [simpleEnemy('t1','Cave Troll','beast',3,200,24,200,30)] },
      { id: 'tc_boss', type: 'boss', name: 'Troll Patriarch', x: 90, y: 50, connections: [], enemies: [simpleEnemy('tboss','Troll Patriarch','beast',6,520,44,740,120,true)] }
    ]
  },

  {
    id: 'daedric_shrine_dg', name: 'Daedric Shrine', description: 'A warped shrine with daedric guardians and bargains.', location: 'Winterhold', difficulty: 'legendary', recommendedLevel: 15, theme: 'daedric_shrine', ambientDescription: 'Whispers in a language you do not know.', startNodeId: 'ds_start', bossNodeId: 'ds_boss', completionRewards: { gold: 1200, xp: 5000, items: [{ name: 'Daedric Relic', type: 'misc', quantity: 1, rarity: 'legendary' as LootRarity }] }, nodes: [
      { id: 'ds_start', type: 'start', name: 'Ritual Gate', x: 10, y: 50, connections: ['ds_event'] },
      { id: 'ds_event', type: 'event', name: 'Unholy Pact', x: 35, y: 45, connections: ['ds_elite'], eventText: 'A voice offers power for a price.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 400 }, { label: 'Decline', outcome: 'nothing' }] },
      { id: 'ds_elite', type: 'elite', name: 'Daedra Knight', x: 65, y: 45, connections: ['ds_boss'], enemies: [simpleEnemy('dk1','Daedra Knight','daedra',15,1800,160,4200,800)] },
      { id: 'ds_boss', type: 'boss', name: 'Dremora Overlord', x: 95, y: 50, connections: [], enemies: [simpleEnemy('dboss','Dremora Overlord','daedra',18,3600,300,9000,2500,true)] }
    ]
  },

  {
    id: 'ice_cavern_dg', name: 'Shattered Ice Cavern', description: 'A winding cave of ice and whirling winds.', location: 'The Pale', difficulty: 'medium', recommendedLevel: 4, theme: 'ice_cave', ambientDescription: 'Breath clouds in the cold air.', startNodeId: 'ic_start', bossNodeId: 'ic_boss', completionRewards: { gold: 200, xp: 480, items: [{ name: 'Ice Crystal', type: 'misc', quantity: 1, rarity: 'uncommon' as LootRarity }] }, nodes: [
      { id: 'ic_start', type: 'start', name: 'Fractured Mouth', x: 10, y: 50, connections: ['ic_path1','ic_path2'] },
      { id: 'ic_path1', type: 'combat', name: 'Ice Wolves', x: 30, y: 35, connections: ['ic_reward'], enemies: [simpleEnemy('iw1','Ice Wolf','beast',4,120,18,200,30)] },
      { id: 'ic_path2', type: 'event', name: 'Frozen Cache', x: 30, y: 65, connections: ['ic_rest'], eventText: 'A cache of furs and supplies sits trapped under ice.', eventChoices: [{ label: 'Shatter', outcome: 'reward', value: 60 }] },
      { id: 'ic_reward', type: 'reward', name: 'Glittering Pouch', x: 60, y: 40, connections: ['ic_boss'], rewards: { gold: 50, items: [{ name: 'Warm Fur', type: 'misc', quantity: 1, rarity: 'common' }] } },
      { id: 'ic_rest', type: 'rest', name: 'Heated Chamber', x: 60, y: 70, connections: ['ic_boss'], restAmount: { health: 25, stamina: 25 } },
      { id: 'ic_boss', type: 'boss', name: 'Frost Warg Matriarch', x: 95, y: 50, connections: [], enemies: [simpleEnemy('iwboss','Frost Warg Matriarch','beast',7,620,60,1200,200,true)] }
    ]
  },

  {
    id: 'mineshaft_dg', name: 'Abandoned Mineshaft', description: 'Collapsed galleries and bandit squatters.', location: 'Riften', difficulty: 'easy', recommendedLevel: 3, theme: 'mine', ambientDescription: 'Echoes of pickaxes and falling rock.', startNodeId: 'ms_start', bossNodeId: 'ms_boss', completionRewards: { gold: 170, xp: 340, items: [{ name: 'Ore Fragment', type: 'misc', quantity: 2, rarity: 'common' as LootRarity }] }, nodes: [
      { id: 'ms_start', type: 'start', name: 'Shaft Mouth', x: 10, y: 50, connections: ['ms_combat'] },
      { id: 'ms_combat', type: 'combat', name: 'Scrap Bandits', x: 40, y: 50, connections: ['ms_event'], enemies: [simpleEnemy('mb1','Pickman','humanoid',3,140,16,220,40)] },
      { id: 'ms_event', type: 'event', name: 'Dead Cart', x: 65, y: 50, connections: ['ms_boss'], eventText: 'A cart collapsed with a glinting item beneath it.', eventChoices: [{ label: 'Heave', outcome: 'reward', value: 80 }] },
      { id: 'ms_boss', type: 'boss', name: 'Pit Overseer', x: 95, y: 50, connections: [], enemies: [simpleEnemy('mboss','Pit Overseer','humanoid',5,420,36,540,120,true)] }
    ]
  },

  {
    id: 'forsworn_camp_dg', name: 'Forsworn Camp', description: 'A tangled network of stone altars and forsworn brutes.', location: 'Markarth', difficulty: 'medium', recommendedLevel: 6, theme: 'forsworn_camp', ambientDescription: 'Wild drums and bitter smoke.', startNodeId: 'fc_start', bossNodeId: 'fc_boss', completionRewards: { gold: 300, xp: 760, items: [{ name: 'Forsworn Token', type: 'misc', quantity: 1, rarity: 'rare' as LootRarity }] }, nodes: [
      { id: 'fc_start', type: 'start', name: 'Outskirts', x: 10, y: 50, connections: ['fc_path1','fc_path2'] },
      { id: 'fc_path1', type: 'combat', name: 'Wildermen', x: 30, y: 35, connections: ['fc_elite'], enemies: [simpleEnemy('fw1','Wilderman','humanoid',5,180,20,320,60)] },
      { id: 'fc_path2', type: 'event', name: 'Ritual Stones', x: 30, y: 65, connections: ['fc_reward'], eventText: 'A child’s offering lies there.', eventChoices: [{ label: 'Accept', outcome: 'reward', value: 60 }] },
      { id: 'fc_elite', type: 'elite', name: 'Forsworn Champion', x: 65, y: 40, connections: ['fc_boss'], enemies: [simpleEnemy('fe1','Forsworn Champion','humanoid',8,420,44,980,180)] },
      { id: 'fc_reward', type: 'reward', name: 'Headhunter Cache', x: 65, y: 72, connections: ['fc_boss'], rewards: { gold: 90, items: [{ name: 'Minor Health Potion', type: 'potion', quantity: 1, rarity: 'common' }] } },
      { id: 'fc_boss', type: 'boss', name: 'Briar Matron', x: 95, y: 50, connections: [], enemies: [simpleEnemy('fboss','Briar Matron','humanoid',10,880,76,2200,420,true)] }
    ]
  }

];

export const getDungeonById = (id: string) => DUNGEON_DEFINITIONS.find(d => d.id === id);
export const listDungeons = () => DUNGEON_DEFINITIONS.map(d => ({ id: d.id, name: d.name, location: d.location, difficulty: d.difficulty, recommendedLevel: d.recommendedLevel }));

export default DUNGEON_DEFINITIONS;
