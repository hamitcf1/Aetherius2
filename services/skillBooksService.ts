/**
 * Skill Books Service
 * Reading skill books grants permanent skill increases
 */

import { LootRarity, InventoryItem, SkillName } from '../types';

// ========== TYPES ==========

export interface SkillBook {
  id: string;
  title: string;
  author: string;
  skill: SkillName;
  description: string;
  loreText: string; // Short excerpt from the book
  rarity: LootRarity;
  value: number;
  locations: string[];
  isSpellTome: boolean;
  spellName?: string;
}

export interface SkillBookState {
  readBooks: string[]; // Book IDs that have been read for skill gain
  totalBooksRead: number;
  skillPointsGained: number;
}

// ========== SKILL BOOK DATABASE ==========

export const SKILL_BOOKS: Record<string, SkillBook> = {
  // ===== COMBAT SKILLS =====
  // One-Handed
  fire_and_darkness: {
    id: 'fire_and_darkness',
    title: 'Fire and Darkness',
    author: 'Ynir Gorming',
    skill: 'One-Handed',
    description: 'A tale of a sword-wielding hero battling forces of darkness.',
    loreText: 'The blade sang through the air, each strike precise and deadly. Gorming understood that the sword was not merely a weapon, but an extension of will.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Fort Amol', 'Broken Oar Grotto', 'Haemar\'s Shame'],
    isSpellTome: false,
  },
  mace_etiquette: {
    id: 'mace_etiquette',
    title: 'Mace Etiquette',
    author: 'Athyn Sarethi',
    skill: 'One-Handed',
    description: 'A guide to the noble art of mace combat.',
    loreText: 'A mace is not merely a bludgeon. In skilled hands, it becomes an instrument of precise devastation.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Cracked Tusk Keep', 'Solitude', 'Understone Keep'],
    isSpellTome: false,
  },
  
  // Two-Handed
  battle_of_sancre_tor: {
    id: 'battle_of_sancre_tor',
    title: 'The Battle of Sancre Tor',
    author: 'Unknown',
    skill: 'Two-Handed',
    description: 'Chronicles of a legendary battle involving two-handed weapons.',
    loreText: 'With greatswords raised high, the warriors charged into the mist. None would emerge unchanged.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Fort Neugrad', 'Forelhost', 'Valthume'],
    isSpellTome: false,
  },
  song_of_hrormir: {
    id: 'song_of_hrormir',
    title: 'Song of Hrormir',
    author: 'Hrormir',
    skill: 'Two-Handed',
    description: 'An epic Nord poem about a legendary warrior.',
    loreText: 'Hrormir swung his battleaxe with the fury of a storm, each blow felling giants like wheat before the scythe.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Dustman\'s Cairn', 'Labyrinthian', 'Volunruud'],
    isSpellTome: false,
  },
  
  // Archery
  the_gold_ribbon_of_merit: {
    id: 'the_gold_ribbon_of_merit',
    title: 'The Gold Ribbon of Merit',
    author: 'Ampyrian Brum',
    skill: 'Archery',
    description: 'A tale of an archer who won a legendary competition.',
    loreText: 'The arrow flew true, threading through impossible obstacles. In that moment, Brum understood the bow\'s secret.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Angi\'s Camp', 'Froki\'s Shack', 'Gallows Rock'],
    isSpellTome: false,
  },
  vernaccus_and_bourlor: {
    id: 'vernaccus_and_bourlor',
    title: 'Vernaccus and Bourlor',
    author: 'Tavi Dromio',
    skill: 'Archery',
    description: 'A comedic tale involving an archer\'s precise skills.',
    loreText: 'Bourlor nocked his arrow, took aim at the distant apple, and in one fluid motion, changed everything.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Stony Creek Cave', 'Lost Knife Hideout', 'Pinewatch'],
    isSpellTome: false,
  },
  
  // Block
  death_blow_of_abernanit: {
    id: 'death_blow_of_abernanit',
    title: 'Death Blow of Abernanit',
    author: 'Geocrates Vargas',
    skill: 'Block',
    description: 'A treatise on defensive combat techniques.',
    loreText: 'The shield is more than protection. It is potential energy, waiting to be unleashed.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Bloodlet Throne', 'Fort Greymoor', 'Harmugstahl'],
    isSpellTome: false,
  },
  
  // Heavy Armor
  hallgerd_tale: {
    id: 'hallgerd_tale',
    title: 'Hallgerd\'s Tale',
    author: 'Hallgerd',
    skill: 'Heavy Armor',
    description: 'A warrior\'s account of surviving battle through armor.',
    loreText: 'My steel was my salvation. Where others fell, I stood, the blows of my enemies ringing harmlessly against my shell.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Broken Helm Hollow', 'Ironbind Barrow', 'Fellglow Keep'],
    isSpellTome: false,
  },
  chimarvamidium: {
    id: 'chimarvamidium',
    title: 'Chimarvamidium',
    author: 'Marobar Sul',
    skill: 'Heavy Armor',
    description: 'A Dwemer-related text about armor construction.',
    loreText: 'The Dwemer knew that true armor was not just metal, but mathematics made manifest.',
    rarity: 'rare',
    value: 90,
    locations: ['Alftand', 'Mzulft', 'Nchuand-Zel'],
    isSpellTome: false,
  },
  
  // Light Armor
  jornibret_last_dance: {
    id: 'jornibret_last_dance',
    title: 'Jornibret\'s Last Dance',
    author: 'Jornibret',
    skill: 'Light Armor',
    description: 'A rogue\'s philosophy on agility over armor.',
    loreText: 'Why wear steel when you can wear shadow? The blade that misses harms less than the one that glances.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Riften Ratway', 'Irkngthand', 'Sunderstone Gorge'],
    isSpellTome: false,
  },
  the_rear_guard: {
    id: 'the_rear_guard',
    title: 'The Rear Guard',
    author: 'Tenace Mourl',
    skill: 'Light Armor',
    description: 'Tactical advice for lightly armored warriors.',
    loreText: 'Mobility is the light armor user\'s greatest asset. Never stand when you can move.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Mistwatch', 'Nilheim', 'Pinemoon Cave'],
    isSpellTome: false,
  },
  
  // ===== MAGIC SKILLS =====
  // Destruction
  a_hypothetical_treachery: {
    id: 'a_hypothetical_treachery',
    title: 'A Hypothetical Treachery',
    author: 'Anthil Morvir',
    skill: 'Destruction',
    description: 'A mage\'s theoretical work on combat magic.',
    loreText: 'Fire, frost, and shock are but the beginning. The true destruction mage understands that magic is physics made malleable.',
    rarity: 'uncommon',
    value: 65,
    locations: ['High Gate Ruins', 'Shriekwind Bastion', 'Wolfskull Cave'],
    isSpellTome: false,
  },
  response_to_bero: {
    id: 'response_to_bero',
    title: 'Response to Bero\'s Speech',
    author: 'Malviser',
    skill: 'Destruction',
    description: 'A scholarly debate about destruction magic.',
    loreText: 'Bero argues that destruction is the most primal of schools. I counter that it is the most refined.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Fort Snowhawk', 'Rannveig\'s Fast', 'Ustengrav'],
    isSpellTome: false,
  },
  
  // Conjuration
  the_doors_of_oblivion: {
    id: 'the_doors_of_oblivion',
    title: 'The Doors of Oblivion',
    author: 'Seif-ij Hidja',
    skill: 'Conjuration',
    description: 'An exploration of the planes of Oblivion and summoning.',
    loreText: 'To summon is to command. But remember, the Daedra you call are not slaves—they are prisoners, and prisoners yearn for freedom.',
    rarity: 'rare',
    value: 90,
    locations: ['Midden', 'Fellglow Keep', 'Morvunskar'],
    isSpellTome: false,
  },
  liminal_bridges: {
    id: 'liminal_bridges',
    title: '2920, Morning Star',
    author: 'Carlovac Townway',
    skill: 'Conjuration',
    description: 'A historical text with insights into conjuration.',
    loreText: 'The barrier between worlds is thin for those who know how to look. Conjuration is simply learning to reach through.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Broken Fang Cave', 'Hob\'s Fall Cave', 'Driftshade Refuge'],
    isSpellTome: false,
  },
  
  // Restoration
  withershins: {
    id: 'withershins',
    title: 'Withershins',
    author: 'Yaqut Tansen',
    skill: 'Restoration',
    description: 'A philosophical text on the nature of healing magic.',
    loreText: 'Restoration is not about reversing damage—it is about convincing flesh to remember its perfect state.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Glenmoril Coven', 'Hall of the Dead', 'Temple of Dibella'],
    isSpellTome: false,
  },
  racial_phylogeny: {
    id: 'racial_phylogeny',
    title: 'Racial Phylogeny',
    author: 'Council of Healers',
    skill: 'Restoration',
    description: 'A medical text about healing different races.',
    loreText: 'Each race heals differently. The wise healer studies all, for one never knows whose wounds they must mend.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Arcadia\'s Cauldron', 'College of Winterhold', 'Temple of Kynareth'],
    isSpellTome: false,
  },
  
  // Alteration
  breathing_water: {
    id: 'breathing_water',
    title: 'Breathing Water',
    author: 'Haliel Myrm',
    skill: 'Alteration',
    description: 'A text on the alteration of physical states.',
    loreText: 'Alteration teaches us that nothing is fixed. The water does not change—you change your relationship to it.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Bthardamz', 'Cronvangr Cave', 'Darkwater Crossing'],
    isSpellTome: false,
  },
  daughter_of_the_niben: {
    id: 'daughter_of_the_niben',
    title: 'Daughter of the Niben',
    author: 'Sathyr Longleat',
    skill: 'Alteration',
    description: 'A historical tale involving powerful alteration magic.',
    loreText: 'She walked through walls as if they were mist. In her hands, reality was but clay to be sculpted.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Blind Cliff Cave', 'Snapleg Cave', 'Shimmermist Cave'],
    isSpellTome: false,
  },
  
  // Illusion
  before_the_ages_of_man: {
    id: 'before_the_ages_of_man',
    title: 'Before the Ages of Man',
    author: 'Aicantar of Shimerene',
    skill: 'Illusion',
    description: 'An ancient text on perception and reality.',
    loreText: 'The Mer understood that reality is perception. Change what is perceived, and you change what is real.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Broken Tower Redoubt', 'Potema\'s Catacombs', 'Swindler\'s Den'],
    isSpellTome: false,
  },
  incident_at_necrom: {
    id: 'incident_at_necrom',
    title: 'Incident at Necrom',
    author: 'Jonquilla Bothe',
    skill: 'Illusion',
    description: 'A tale of illusion magic gone wrong.',
    loreText: 'The danger of illusion is believing your own tricks. The mind convinced can lose itself forever.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Blackreach', 'Darklight Tower', 'Druadach Redoubt'],
    isSpellTome: false,
  },
  
  // Enchanting
  a_tragedy_in_black: {
    id: 'a_tragedy_in_black',
    title: 'A Tragedy in Black',
    author: 'Gor Felim',
    skill: 'Enchanting',
    description: 'A story involving powerful enchanted artifacts.',
    loreText: 'The ring whispered to him, promising power. He did not understand that every enchantment has a cost.',
    rarity: 'rare',
    value: 90,
    locations: ['Arcane Enchanter locations', 'Farengar\'s quarters', 'Sergius Turrianus'],
    isSpellTome: false,
  },
  catalogue_of_armor: {
    id: 'catalogue_of_armor',
    title: 'Catalogue of Armor Enchantments',
    author: 'Direnni Tower',
    skill: 'Enchanting',
    description: 'A reference guide to armor enchantments.',
    loreText: 'Fortify, resist, regenerate. These are the three pillars of defensive enchanting.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Ansilvund', 'Clearpine Pond', 'Ravenscar Hollow'],
    isSpellTome: false,
  },
  
  // ===== STEALTH SKILLS =====
  // Sneak
  three_thieves: {
    id: 'three_thieves',
    title: 'Three Thieves',
    author: 'Anonymous',
    skill: 'Sneak',
    description: 'Tales of legendary thieves and their techniques.',
    loreText: 'The greatest thief is not the one who takes the most. It is the one who is never seen, never heard, never known.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Riften Ratway', 'Twilight Sepulcher', 'Snow Veil Sanctum'],
    isSpellTome: false,
  },
  the_red_kitchen_reader: {
    id: 'the_red_kitchen_reader',
    title: 'The Red Kitchen Reader',
    author: 'Simocles Quo',
    skill: 'Sneak',
    description: 'A cooking book with hidden advice on stealth.',
    loreText: 'The best kitchen is like the best thief—silent, efficient, and leaving no trace.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Honningbrew Meadery', 'Nightgate Inn', 'Soljund\'s Sinkhole'],
    isSpellTome: false,
  },
  
  // Lockpicking
  the_locked_room: {
    id: 'the_locked_room',
    title: 'The Locked Room',
    author: 'Arthion',
    skill: 'Lockpicking',
    description: 'A mystery story featuring impressive lock-picking.',
    loreText: 'Every lock has a weakness. Every tumbler has a sweet spot. Patience and touch will reveal all secrets.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Riften Jail', 'Mercer\'s House', 'Broken Helm Hollow'],
    isSpellTome: false,
  },
  proper_lock_design: {
    id: 'proper_lock_design',
    title: 'Proper Lock Design',
    author: 'Guild of Locksmiths',
    skill: 'Lockpicking',
    description: 'A technical manual on lock mechanisms.',
    loreText: 'Understanding how a lock works is the first step to understanding how it fails.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Dwemer ruins', 'Calcelmo\'s quarters', 'Irkngthand'],
    isSpellTome: false,
  },
  
  // Pickpocket
  beggar: {
    id: 'beggar',
    title: 'Beggar',
    author: 'Reven',
    skill: 'Pickpocket',
    description: 'Confessions of a pickpocket turned beggar.',
    loreText: 'The fingers remember what the mind forgets. Light touch, quick hands, and above all—never meet their eyes.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Riften streets', 'Thieves Guild', 'Markarth Warrens'],
    isSpellTome: false,
  },
  the_wolf_queen_v2: {
    id: 'the_wolf_queen_v2',
    title: 'The Wolf Queen, v2',
    author: 'Waughin Jarth',
    skill: 'Pickpocket',
    description: 'A historical text with insights on court intrigue.',
    loreText: 'In the court of the Wolf Queen, the most valuable skill was not swordplay—it was the art of taking without being seen.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Blue Palace', 'Potema\'s Catacombs', 'Wolfskull Cave'],
    isSpellTome: false,
  },
  
  // Speech
  a_dance_in_fire_v2: {
    id: 'a_dance_in_fire_v2',
    title: 'A Dance in Fire, v2',
    author: 'Waughin Jarth',
    skill: 'Speech',
    description: 'A tale of negotiation and verbal warfare.',
    loreText: 'Words are weapons sharper than any blade. A well-placed phrase can topple kingdoms.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Bards College', 'Palace of the Kings', 'Dragonsreach'],
    isSpellTome: false,
  },
  biography_of_barenziah: {
    id: 'biography_of_barenziah',
    title: 'Biography of Barenziah',
    author: 'Stern Gamboge',
    skill: 'Speech',
    description: 'The life of the famous Dunmer queen.',
    loreText: 'Barenziah spoke with a voice that could charm dragons. Her words shaped empires.',
    rarity: 'rare',
    value: 90,
    locations: ['Riften', 'Mistveil Keep', 'Temple of Mara'],
    isSpellTome: false,
  },
  
  // ===== CRAFTING SKILLS =====
  // Alchemy
  a_game_at_dinner: {
    id: 'a_game_at_dinner',
    title: 'A Game at Dinner',
    author: 'Anonymous',
    skill: 'Alchemy',
    description: 'A story of poison and intrigue.',
    loreText: 'The poisoner knows that the deadliest concoctions taste the sweetest. A drop of nightshade in honey...',
    rarity: 'uncommon',
    value: 65,
    locations: ['Dark Brotherhood Sanctuary', 'Hag\'s End', 'Arcadia\'s Cauldron'],
    isSpellTome: false,
  },
  herbalist_guide: {
    id: 'herbalist_guide',
    title: 'Herbalist\'s Guide to Skyrim',
    author: 'Agneta Falia',
    skill: 'Alchemy',
    description: 'A comprehensive guide to Skyrim\'s flora.',
    loreText: 'Blue mountain flowers for health, deathbell for harm. Nature provides all, if you know where to look.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Alchemy shops', 'Angeline\'s Aromatics', 'White Phial'],
    isSpellTome: false,
  },
  
  // Smithing
  cherim_heart: {
    id: 'cherim_heart',
    title: 'Cherim\'s Heart',
    author: 'Marobar Sul',
    skill: 'Smithing',
    description: 'A legendary tale of Dwemer smithing.',
    loreText: 'The Dwemer forged not with fire alone, but with mathematical precision. Each strike calculated, each fold exact.',
    rarity: 'rare',
    value: 90,
    locations: ['Dwemer ruins', 'Blacksmith shops', 'Understone Keep'],
    isSpellTome: false,
  },
  light_armor_forging: {
    id: 'light_armor_forging',
    title: 'Light Armor Forging',
    author: 'Revus Sarvani',
    skill: 'Smithing',
    description: 'A technical guide to crafting light armor.',
    loreText: 'The art of light armor is the art of compromise—protection without weight, coverage without constraint.',
    rarity: 'uncommon',
    value: 65,
    locations: ['Warmaiden\'s', 'Skyforge', 'Gloombound Mine'],
    isSpellTome: false,
  },
};

// ========== STATE MANAGEMENT ==========

export function getInitialSkillBookState(): SkillBookState {
  return {
    readBooks: [],
    totalBooksRead: 0,
    skillPointsGained: 0,
  };
}

export function readSkillBook(
  state: SkillBookState,
  bookId: string
): { 
  success: boolean; 
  newState: SkillBookState; 
  skillGained: SkillName | null; 
  alreadyRead: boolean;
  message: string 
} {
  const book = SKILL_BOOKS[bookId];
  
  if (!book) {
    return {
      success: false,
      newState: state,
      skillGained: null,
      alreadyRead: false,
      message: 'Book not found.',
    };
  }
  
  // Check if already read for skill gain
  if (state.readBooks.includes(bookId)) {
    return {
      success: true,
      newState: state,
      skillGained: null,
      alreadyRead: true,
      message: `You read "${book.title}" by ${book.author}. You have already learned what this book has to teach.`,
    };
  }
  
  // First time reading - gain skill
  return {
    success: true,
    newState: {
      ...state,
      readBooks: [...state.readBooks, bookId],
      totalBooksRead: state.totalBooksRead + 1,
      skillPointsGained: state.skillPointsGained + 1,
    },
    skillGained: book.skill,
    alreadyRead: false,
    message: `You read "${book.title}" by ${book.author}. Your ${book.skill} skill has increased!`,
  };
}

export function getBooksBySkill(skill: SkillName): SkillBook[] {
  return Object.values(SKILL_BOOKS).filter(book => book.skill === skill);
}

export function getUnreadBooks(state: SkillBookState): SkillBook[] {
  return Object.values(SKILL_BOOKS).filter(book => !state.readBooks.includes(book.id));
}

export function getReadBooks(state: SkillBookState): SkillBook[] {
  return state.readBooks.map(id => SKILL_BOOKS[id]).filter(Boolean);
}

export function hasReadBook(state: SkillBookState, bookId: string): boolean {
  return state.readBooks.includes(bookId);
}

export function getBookLoreExcerpt(bookId: string): string {
  const book = SKILL_BOOKS[bookId];
  return book?.loreText || 'The pages are blank.';
}

export function skillBookToInventoryItem(book: SkillBook): InventoryItem {
  return {
    id: book.id,
    name: book.title,
    type: 'book',
    quantity: 1,
    description: `${book.description} (${book.skill} skill book)`,
    rarity: book.rarity,
    value: book.value,
    weight: 1,
    effects: [`Reading grants +1 ${book.skill}`],
  };
}

// ========== SPELL TOMES ==========
// Spell tomes are special books that teach spells instead of skills

export interface SpellTome {
  id: string;
  name: string;
  spell: string;
  school: SkillName;
  level: 'novice' | 'apprentice' | 'adept' | 'expert' | 'master';
  description: string;
  value: number;
  rarity: LootRarity;
}

export const SPELL_TOMES: Record<string, SpellTome> = {
  // Destruction
  flames: { id: 'flames', name: 'Spell Tome: Flames', spell: 'Flames', school: 'Destruction', level: 'novice', description: 'A stream of fire from your hand.', value: 50, rarity: 'common' },
  firebolt: { id: 'firebolt', name: 'Spell Tome: Firebolt', spell: 'Firebolt', school: 'Destruction', level: 'apprentice', description: 'A bolt of fire that explodes on impact.', value: 100, rarity: 'uncommon' },
  fireball: { id: 'fireball', name: 'Spell Tome: Fireball', spell: 'Fireball', school: 'Destruction', level: 'adept', description: 'A ball of fire that explodes on impact.', value: 350, rarity: 'rare' },
  incinerate: { id: 'incinerate', name: 'Spell Tome: Incinerate', spell: 'Incinerate', school: 'Destruction', level: 'expert', description: 'A blast of fire that does devastating damage.', value: 650, rarity: 'epic' },
  fire_storm: { id: 'fire_storm', name: 'Spell Tome: Fire Storm', spell: 'Fire Storm', school: 'Destruction', level: 'master', description: 'An inferno that engulfs all nearby enemies.', value: 1200, rarity: 'legendary' },
  
  frostbite: { id: 'frostbite', name: 'Spell Tome: Frostbite', spell: 'Frostbite', school: 'Destruction', level: 'novice', description: 'A blast of cold from your hand.', value: 50, rarity: 'common' },
  ice_spike: { id: 'ice_spike', name: 'Spell Tome: Ice Spike', spell: 'Ice Spike', school: 'Destruction', level: 'apprentice', description: 'A spike of ice that damages health and stamina.', value: 100, rarity: 'uncommon' },
  ice_storm: { id: 'ice_storm', name: 'Spell Tome: Ice Storm', spell: 'Ice Storm', school: 'Destruction', level: 'adept', description: 'A freezing whirlwind that damages all in its path.', value: 350, rarity: 'rare' },
  
  sparks: { id: 'sparks', name: 'Spell Tome: Sparks', spell: 'Sparks', school: 'Destruction', level: 'novice', description: 'Lightning from your fingertips.', value: 50, rarity: 'common' },
  lightning_bolt: { id: 'lightning_bolt', name: 'Spell Tome: Lightning Bolt', spell: 'Lightning Bolt', school: 'Destruction', level: 'apprentice', description: 'A bolt of lightning that damages health and magicka.', value: 100, rarity: 'uncommon' },
  chain_lightning: { id: 'chain_lightning', name: 'Spell Tome: Chain Lightning', spell: 'Chain Lightning', school: 'Destruction', level: 'adept', description: 'Lightning that jumps between targets.', value: 350, rarity: 'rare' },
  
  // Restoration
  healing: { id: 'healing', name: 'Spell Tome: Healing', spell: 'Healing', school: 'Restoration', level: 'novice', description: 'Heals the caster over time.', value: 50, rarity: 'common' },
  fast_healing: { id: 'fast_healing', name: 'Spell Tome: Fast Healing', spell: 'Fast Healing', school: 'Restoration', level: 'apprentice', description: 'Heals the caster instantly.', value: 100, rarity: 'uncommon' },
  close_wounds: { id: 'close_wounds', name: 'Spell Tome: Close Wounds', spell: 'Close Wounds', school: 'Restoration', level: 'adept', description: 'Heals a significant amount instantly.', value: 350, rarity: 'rare' },
  grand_healing: { id: 'grand_healing', name: 'Spell Tome: Grand Healing', spell: 'Grand Healing', school: 'Restoration', level: 'expert', description: 'Heals everyone nearby.', value: 650, rarity: 'epic' },
  
  // Conjuration
  conjure_familiar: { id: 'conjure_familiar', name: 'Spell Tome: Conjure Familiar', spell: 'Conjure Familiar', school: 'Conjuration', level: 'novice', description: 'Summons a familiar to fight for you.', value: 50, rarity: 'common' },
  conjure_flame_atronach: { id: 'conjure_flame_atronach', name: 'Spell Tome: Conjure Flame Atronach', spell: 'Conjure Flame Atronach', school: 'Conjuration', level: 'apprentice', description: 'Summons a flame atronach.', value: 100, rarity: 'uncommon' },
  conjure_frost_atronach: { id: 'conjure_frost_atronach', name: 'Spell Tome: Conjure Frost Atronach', spell: 'Conjure Frost Atronach', school: 'Conjuration', level: 'adept', description: 'Summons a frost atronach.', value: 350, rarity: 'rare' },
  conjure_dremora: { id: 'conjure_dremora', name: 'Spell Tome: Conjure Dremora Lord', spell: 'Conjure Dremora Lord', school: 'Conjuration', level: 'expert', description: 'Summons a powerful Dremora.', value: 650, rarity: 'epic' },
  
  // Alteration
  oakflesh: { id: 'oakflesh', name: 'Spell Tome: Oakflesh', spell: 'Oakflesh', school: 'Alteration', level: 'novice', description: 'Improves armor rating.', value: 50, rarity: 'common' },
  stoneflesh: { id: 'stoneflesh', name: 'Spell Tome: Stoneflesh', spell: 'Stoneflesh', school: 'Alteration', level: 'apprentice', description: 'Greatly improves armor rating.', value: 100, rarity: 'uncommon' },
  ironflesh: { id: 'ironflesh', name: 'Spell Tome: Ironflesh', spell: 'Ironflesh', school: 'Alteration', level: 'adept', description: 'Significantly improves armor rating.', value: 350, rarity: 'rare' },
  
  // Illusion
  courage: { id: 'courage', name: 'Spell Tome: Courage', spell: 'Courage', school: 'Illusion', level: 'novice', description: 'Makes an ally fight harder.', value: 50, rarity: 'common' },
  fury: { id: 'fury', name: 'Spell Tome: Fury', spell: 'Fury', school: 'Illusion', level: 'novice', description: 'Makes a creature attack anything nearby.', value: 50, rarity: 'common' },
  calm: { id: 'calm', name: 'Spell Tome: Calm', spell: 'Calm', school: 'Illusion', level: 'apprentice', description: 'Calms a creature.', value: 100, rarity: 'uncommon' },
  invisibility: { id: 'invisibility', name: 'Spell Tome: Invisibility', spell: 'Invisibility', school: 'Illusion', level: 'expert', description: 'Become invisible.', value: 650, rarity: 'epic' },
};

export function spellTomeToInventoryItem(tome: SpellTome): InventoryItem {
  return {
    id: tome.id,
    name: tome.name,
    type: 'book',
    quantity: 1,
    description: `${tome.description} (${tome.level} ${tome.school})`,
    rarity: tome.rarity,
    value: tome.value,
    weight: 1,
    effects: [`Teaches: ${tome.spell}`],
  };
}
