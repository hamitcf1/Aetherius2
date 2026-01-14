/**
 * Main Quest Lines for Skyrim Aetherius
 * 
 * These quest chains are based on character archetype and provide
 * 25+ connected quests that form a complete storyline.
 */

import { CustomQuest, Character } from '../types';

export interface QuestChain {
  id: string;
  name: string;
  description: string;
  archetypes: string[]; // Which character archetypes this fits
  quests: QuestTemplate[];
}

export interface QuestTemplate {
  id: string;
  title: string;
  description: string;
  location: string;
  questType: 'main' | 'side' | 'misc' | 'bounty';
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  goldReward: number;
  objectives: { description: string; completed: boolean }[];
  prerequisiteQuestId?: string; // Must complete this quest first
  unlocks?: string[]; // Quest IDs this unlocks when completed
}

// ============================================================
// WARRIOR QUEST LINE: "The Dragon's Legacy"
// A warrior-focused epic about an ancient Nordic hero's weapon
// ============================================================
const WARRIOR_QUEST_LINE: QuestChain = {
  id: 'dragons_legacy',
  name: "The Dragon's Legacy",
  description: "Seek the legendary weapon of Ysgramor's forgotten champion",
  archetypes: ['warrior', 'barbarian', 'knight', 'berserker', 'soldier'],
  quests: [
    {
      id: 'dl_01_rumors',
      title: "Whispers of the Ancients",
      description: "Investigate rumors of an ancient Nordic weapon in Whiterun's tavern",
      location: "Whiterun",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 50,
      goldReward: 100,
      objectives: [
        { description: "Speak with travelers at The Bannered Mare about Nordic legends", completed: false },
        { description: "Learn about the Blade of the Dragon-Slayer", completed: false }
      ],
      unlocks: ['dl_02_scholar']
    },
    {
      id: 'dl_02_scholar',
      title: "The Scholar's Knowledge",
      description: "Find a scholar who knows the blade's history",
      location: "College of Winterhold",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 75,
      goldReward: 150,
      objectives: [
        { description: "Travel to the College of Winterhold", completed: false },
        { description: "Speak with the history keeper about the Dragon-Slayer", completed: false },
        { description: "Obtain the translated text about the blade's location", completed: false }
      ],
      prerequisiteQuestId: 'dl_01_rumors',
      unlocks: ['dl_03_barrow']
    },
    {
      id: 'dl_03_barrow',
      title: "Into the Ancient Barrow",
      description: "Explore Dustman's Cairn for clues to the weapon's location",
      location: "Dustman's Cairn",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 150,
      goldReward: 300,
      objectives: [
        { description: "Enter Dustman's Cairn", completed: false },
        { description: "Fight through the draugr guardians", completed: false },
        { description: "Find the ancient stone tablet", completed: false },
        { description: "Decipher the tablet's riddle", completed: false }
      ],
      prerequisiteQuestId: 'dl_02_scholar',
      unlocks: ['dl_04_trial']
    },
    {
      id: 'dl_04_trial',
      title: "Trial of the Worthy",
      description: "Prove your worth at the Trial Grounds of Ysgramor",
      location: "Ysgramor's Tomb",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 200,
      goldReward: 400,
      objectives: [
        { description: "Locate the hidden Trial Grounds", completed: false },
        { description: "Complete the Trial of Strength", completed: false },
        { description: "Complete the Trial of Endurance", completed: false },
        { description: "Receive the blessing of the Companions", completed: false }
      ],
      prerequisiteQuestId: 'dl_03_barrow',
      unlocks: ['dl_05_forge']
    },
    {
      id: 'dl_05_forge',
      title: "The Skyforge Secret",
      description: "Discover the Skyforge's connection to the legendary blade",
      location: "Whiterun",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 175,
      goldReward: 350,
      objectives: [
        { description: "Speak with the Skyforge blacksmith", completed: false },
        { description: "Learn about the ancient Nordic forging technique", completed: false },
        { description: "Gather materials: Quicksilver Ore (3), Mammoth Tusk (1)", completed: false }
      ],
      prerequisiteQuestId: 'dl_04_trial',
      unlocks: ['dl_06_giants']
    },
    {
      id: 'dl_06_giants',
      title: "The Giant's Hoard",
      description: "Obtain a mammoth tusk from a giant camp",
      location: "Bleakwind Basin",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 250,
      goldReward: 500,
      objectives: [
        { description: "Locate Bleakwind Basin giant camp", completed: false },
        { description: "Deal with the giants (combat or cunning)", completed: false },
        { description: "Retrieve a pristine mammoth tusk", completed: false }
      ],
      prerequisiteQuestId: 'dl_05_forge',
      unlocks: ['dl_07_reforge']
    },
    {
      id: 'dl_07_reforge',
      title: "Reforging Legend",
      description: "Work with the blacksmith to prepare the ceremonial components",
      location: "Whiterun",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 100,
      goldReward: 200,
      objectives: [
        { description: "Deliver materials to the Skyforge", completed: false },
        { description: "Assist in the forging ritual", completed: false },
        { description: "Receive the Blade Fragment", completed: false }
      ],
      prerequisiteQuestId: 'dl_06_giants',
      unlocks: ['dl_08_labyrinthian']
    },
    {
      id: 'dl_08_labyrinthian',
      title: "The Dragon Priest's Domain",
      description: "The second fragment lies in Labyrinthian, guarded by an ancient evil",
      location: "Labyrinthian",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 300,
      goldReward: 600,
      objectives: [
        { description: "Enter Labyrinthian", completed: false },
        { description: "Navigate the magical traps", completed: false },
        { description: "Defeat the Dragon Priest guardian", completed: false },
        { description: "Claim the second Blade Fragment", completed: false }
      ],
      prerequisiteQuestId: 'dl_07_reforge',
      unlocks: ['dl_09_final_piece']
    },
    {
      id: 'dl_09_final_piece',
      title: "The Throat of the World",
      description: "The final fragment rests at the peak of the highest mountain",
      location: "Throat of the World",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 350,
      goldReward: 700,
      objectives: [
        { description: "Climb to High Hrothgar", completed: false },
        { description: "Gain permission from the Greybeards", completed: false },
        { description: "Ascend to the Throat of the World", completed: false },
        { description: "Retrieve the final Blade Fragment", completed: false }
      ],
      prerequisiteQuestId: 'dl_08_labyrinthian',
      unlocks: ['dl_10_assembly']
    },
    {
      id: 'dl_10_assembly',
      title: "The Dragon-Slayer Reborn",
      description: "Assemble the legendary blade at the Skyforge under the ancient stars",
      location: "Whiterun",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 500,
      goldReward: 1000,
      objectives: [
        { description: "Return to the Skyforge with all three fragments", completed: false },
        { description: "Wait for the proper celestial alignment", completed: false },
        { description: "Complete the reforging ritual", completed: false },
        { description: "Claim the Blade of the Dragon-Slayer", completed: false }
      ],
      prerequisiteQuestId: 'dl_09_final_piece'
    }
  ]
};

// ============================================================
// THIEF QUEST LINE: "The Shadow Syndicate"
// A thief-focused storyline about an underground guild war
// ============================================================
const THIEF_QUEST_LINE: QuestChain = {
  id: 'shadow_syndicate',
  name: "The Shadow Syndicate",
  description: "Rise through the criminal underworld and claim your place as the Shadow Master",
  archetypes: ['thief', 'assassin', 'rogue', 'nightblade', 'spy'],
  quests: [
    {
      id: 'ss_01_contact',
      title: "A Whisper in the Dark",
      description: "Make contact with the Thieves Guild in Riften",
      location: "Riften",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 50,
      goldReward: 100,
      objectives: [
        { description: "Travel to Riften", completed: false },
        { description: "Find the entrance to the Ratway", completed: false },
        { description: "Speak with the guild contact", completed: false }
      ],
      unlocks: ['ss_02_prove']
    },
    {
      id: 'ss_02_prove',
      title: "Proving Your Worth",
      description: "Complete a test job to prove your skills",
      location: "Riften",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 75,
      goldReward: 200,
      objectives: [
        { description: "Steal the merchant's ledger from his shop", completed: false },
        { description: "Plant false evidence in the guard captain's quarters", completed: false },
        { description: "Return to the guild without being caught", completed: false }
      ],
      prerequisiteQuestId: 'ss_01_contact',
      unlocks: ['ss_03_rival']
    },
    {
      id: 'ss_03_rival',
      title: "The Rival Guild",
      description: "Investigate a rival criminal organization threatening guild territory",
      location: "Windhelm",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 125,
      goldReward: 300,
      objectives: [
        { description: "Travel to Windhelm", completed: false },
        { description: "Gather information about the Shadow Syndicate", completed: false },
        { description: "Identify their leader", completed: false },
        { description: "Report findings to the guild", completed: false }
      ],
      prerequisiteQuestId: 'ss_02_prove',
      unlocks: ['ss_04_sabotage']
    },
    {
      id: 'ss_04_sabotage',
      title: "Sabotage",
      description: "Disrupt the Shadow Syndicate's operations",
      location: "Windhelm",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 150,
      goldReward: 400,
      objectives: [
        { description: "Infiltrate the Syndicate's warehouse", completed: false },
        { description: "Destroy their smuggled goods", completed: false },
        { description: "Steal their client list", completed: false },
        { description: "Escape without raising the alarm", completed: false }
      ],
      prerequisiteQuestId: 'ss_03_rival',
      unlocks: ['ss_05_double']
    },
    {
      id: 'ss_05_double',
      title: "The Double Agent",
      description: "Go undercover within the Shadow Syndicate",
      location: "Windhelm",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 175,
      goldReward: 450,
      objectives: [
        { description: "Create a cover identity", completed: false },
        { description: "Get recruited by the Syndicate", completed: false },
        { description: "Gain their trust through jobs", completed: false },
        { description: "Learn their ultimate plan", completed: false }
      ],
      prerequisiteQuestId: 'ss_04_sabotage',
      unlocks: ['ss_06_heist']
    },
    {
      id: 'ss_06_heist',
      title: "The Grand Heist",
      description: "Participate in the Syndicate's major heist while secretly undermining it",
      location: "Solitude",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 250,
      goldReward: 600,
      objectives: [
        { description: "Travel to Solitude with the Syndicate crew", completed: false },
        { description: "Infiltrate the East Empire Company warehouse", completed: false },
        { description: "Secure the valuable shipment", completed: false },
        { description: "Secretly send word to the Thieves Guild", completed: false }
      ],
      prerequisiteQuestId: 'ss_05_double',
      unlocks: ['ss_07_betrayal']
    },
    {
      id: 'ss_07_betrayal',
      title: "Betrayal",
      description: "The Syndicate discovers a traitor in their midst",
      location: "Solitude",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 275,
      goldReward: 550,
      objectives: [
        { description: "Escape the Syndicate's trap", completed: false },
        { description: "Fight or sneak your way to safety", completed: false },
        { description: "Reach the Thieves Guild safehouse", completed: false },
        { description: "Plan the counterattack", completed: false }
      ],
      prerequisiteQuestId: 'ss_06_heist',
      unlocks: ['ss_08_war']
    },
    {
      id: 'ss_08_war',
      title: "Guild War",
      description: "Lead the assault on the Shadow Syndicate's stronghold",
      location: "Windhelm",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 300,
      goldReward: 700,
      objectives: [
        { description: "Rally guild members for the attack", completed: false },
        { description: "Infiltrate the Syndicate headquarters", completed: false },
        { description: "Eliminate Syndicate lieutenants", completed: false },
        { description: "Confront the Syndicate leader", completed: false }
      ],
      prerequisiteQuestId: 'ss_07_betrayal',
      unlocks: ['ss_09_master']
    },
    {
      id: 'ss_09_master',
      title: "The Shadow Master",
      description: "Claim leadership of the unified criminal underworld",
      location: "Riften",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 400,
      goldReward: 1000,
      objectives: [
        { description: "Return to the Thieves Guild in triumph", completed: false },
        { description: "Consolidate power over both organizations", completed: false },
        { description: "Receive the title of Shadow Master", completed: false },
        { description: "Establish your criminal empire", completed: false }
      ],
      prerequisiteQuestId: 'ss_08_war'
    }
  ]
};

// ============================================================
// MAGE QUEST LINE: "The Arcane Convergence"
// A mage-focused storyline about preventing a magical catastrophe
// ============================================================
const MAGE_QUEST_LINE: QuestChain = {
  id: 'arcane_convergence',
  name: "The Arcane Convergence",
  description: "Uncover an ancient magical threat that could tear reality apart",
  archetypes: ['mage', 'wizard', 'sorcerer', 'battlemage', 'necromancer', 'spellsword'],
  quests: [
    {
      id: 'ac_01_anomaly',
      title: "Magical Anomalies",
      description: "Investigate strange magical disturbances across Skyrim",
      location: "College of Winterhold",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 50,
      goldReward: 100,
      objectives: [
        { description: "Speak with the Arch-Mage about the disturbances", completed: false },
        { description: "Study the magical readings", completed: false },
        { description: "Identify the pattern in the anomalies", completed: false }
      ],
      unlocks: ['ac_02_investigate']
    },
    {
      id: 'ac_02_investigate',
      title: "The First Nexus",
      description: "Investigate the magical nexus point near Saarthal",
      location: "Saarthal",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 75,
      goldReward: 150,
      objectives: [
        { description: "Travel to Saarthal excavation", completed: false },
        { description: "Locate the nexus point", completed: false },
        { description: "Collect magical samples", completed: false },
        { description: "Discover ancient Dwemer writings", completed: false }
      ],
      prerequisiteQuestId: 'ac_01_anomaly',
      unlocks: ['ac_03_dwemer']
    },
    {
      id: 'ac_03_dwemer',
      title: "Dwemer Secrets",
      description: "Decipher the Dwemer texts about the Convergence",
      location: "Mzulft",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 150,
      goldReward: 300,
      objectives: [
        { description: "Enter the Dwemer ruins of Mzulft", completed: false },
        { description: "Navigate through Falmer-infested tunnels", completed: false },
        { description: "Find the Dwemer observatory", completed: false },
        { description: "Translate the Convergence prophecy", completed: false }
      ],
      prerequisiteQuestId: 'ac_02_investigate',
      unlocks: ['ac_04_daedric']
    },
    {
      id: 'ac_04_daedric',
      title: "Daedric Interference",
      description: "A Daedric Prince takes interest in the Convergence",
      location: "Shrine of Hermaeus Mora",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 175,
      goldReward: 400,
      objectives: [
        { description: "Seek out Hermaeus Mora's shrine", completed: false },
        { description: "Bargain with the Daedric Prince", completed: false },
        { description: "Complete his trial of knowledge", completed: false },
        { description: "Receive forbidden knowledge about the Convergence", completed: false }
      ],
      prerequisiteQuestId: 'ac_03_dwemer',
      unlocks: ['ac_05_nexus2']
    },
    {
      id: 'ac_05_nexus2',
      title: "The Second Nexus",
      description: "Stabilize the nexus point at Blackreach before it collapses",
      location: "Blackreach",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 250,
      goldReward: 500,
      objectives: [
        { description: "Find the entrance to Blackreach", completed: false },
        { description: "Navigate the underground realm", completed: false },
        { description: "Locate the unstable nexus", completed: false },
        { description: "Perform the stabilization ritual", completed: false }
      ],
      prerequisiteQuestId: 'ac_04_daedric',
      unlocks: ['ac_06_cult']
    },
    {
      id: 'ac_06_cult',
      title: "The Cult of the Convergence",
      description: "Discover that a cult is actively trying to trigger the Convergence",
      location: "Markarth",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 200,
      goldReward: 450,
      objectives: [
        { description: "Investigate cult activity in Markarth", completed: false },
        { description: "Infiltrate their secret meeting", completed: false },
        { description: "Learn their plan to accelerate the Convergence", completed: false },
        { description: "Escape with the information", completed: false }
      ],
      prerequisiteQuestId: 'ac_05_nexus2',
      unlocks: ['ac_07_artifact']
    },
    {
      id: 'ac_07_artifact',
      title: "The Convergence Anchor",
      description: "Find the artifact that can stop the Convergence",
      location: "Labyrinthian",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 275,
      goldReward: 600,
      objectives: [
        { description: "Research the Staff of Magnus's true purpose", completed: false },
        { description: "Enter Labyrinthian", completed: false },
        { description: "Defeat Morokei the Dragon Priest", completed: false },
        { description: "Claim the Staff of Magnus", completed: false }
      ],
      prerequisiteQuestId: 'ac_06_cult',
      unlocks: ['ac_08_final_nexus']
    },
    {
      id: 'ac_08_final_nexus',
      title: "The Final Nexus",
      description: "Race to the primary nexus point before the cult",
      location: "The Throat of the World",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 300,
      goldReward: 700,
      objectives: [
        { description: "Travel to the Throat of the World", completed: false },
        { description: "Fight through the cult's forces", completed: false },
        { description: "Reach the primary nexus", completed: false },
        { description: "Prepare for the final confrontation", completed: false }
      ],
      prerequisiteQuestId: 'ac_07_artifact',
      unlocks: ['ac_09_convergence']
    },
    {
      id: 'ac_09_convergence',
      title: "The Arcane Convergence",
      description: "Stop the Convergence and save reality itself",
      location: "The Throat of the World",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 500,
      goldReward: 1000,
      objectives: [
        { description: "Defeat the cult leader", completed: false },
        { description: "Use the Staff of Magnus to stabilize the nexus", completed: false },
        { description: "Close the dimensional rift", completed: false },
        { description: "Return to the College as a hero", completed: false }
      ],
      prerequisiteQuestId: 'ac_08_final_nexus'
    }
  ]
};

// ============================================================
// UNIVERSAL QUEST LINE: "Dragonborn Rising"
// Works for any character archetype
// ============================================================
const DRAGONBORN_QUEST_LINE: QuestChain = {
  id: 'dragonborn_rising',
  name: "Dragonborn Rising",
  description: "Discover your destiny as the legendary Dragonborn",
  archetypes: ['any'],
  quests: [
    {
      id: 'db_01_dragon',
      title: "Dragon Attack",
      description: "Survive a dragon attack on Whiterun's watchtower",
      location: "Western Watchtower",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 100,
      goldReward: 200,
      objectives: [
        { description: "Travel to the Western Watchtower", completed: false },
        { description: "Investigate the dragon sighting", completed: false },
        { description: "Survive the dragon attack", completed: false },
        { description: "Absorb the dragon's soul", completed: false }
      ],
      unlocks: ['db_02_greybeards']
    },
    {
      id: 'db_02_greybeards',
      title: "The Way of the Voice",
      description: "Answer the Greybeards' summons",
      location: "High Hrothgar",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 75,
      goldReward: 150,
      objectives: [
        { description: "Climb the 7000 steps to High Hrothgar", completed: false },
        { description: "Speak with the Greybeards", completed: false },
        { description: "Demonstrate your Thu'um", completed: false },
        { description: "Learn the meaning of Dragonborn", completed: false }
      ],
      prerequisiteQuestId: 'db_01_dragon',
      unlocks: ['db_03_horn']
    },
    {
      id: 'db_03_horn',
      title: "The Horn of Jurgen Windcaller",
      description: "Retrieve the horn from Ustengrav to prove yourself",
      location: "Ustengrav",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 150,
      goldReward: 300,
      objectives: [
        { description: "Travel to Ustengrav", completed: false },
        { description: "Navigate the ancient tomb", completed: false },
        { description: "Solve the puzzle of the gates", completed: false },
        { description: "Discover who took the horn", completed: false }
      ],
      prerequisiteQuestId: 'db_02_greybeards',
      unlocks: ['db_04_blades']
    },
    {
      id: 'db_04_blades',
      title: "A Blade in the Shadows",
      description: "Meet the mysterious person who took the horn",
      location: "Riverwood",
      questType: 'main',
      difficulty: 'easy',
      xpReward: 100,
      goldReward: 200,
      objectives: [
        { description: "Meet Delphine in Riverwood", completed: false },
        { description: "Learn about the Blades", completed: false },
        { description: "Receive the Horn of Jurgen Windcaller", completed: false },
        { description: "Agree to help investigate the dragon resurrection", completed: false }
      ],
      prerequisiteQuestId: 'db_03_horn',
      unlocks: ['db_05_kynesgrove']
    },
    {
      id: 'db_05_kynesgrove',
      title: "A Cornered Rat",
      description: "Witness a dragon resurrection at Kynesgrove",
      location: "Kynesgrove",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 175,
      goldReward: 350,
      objectives: [
        { description: "Travel to Kynesgrove with Delphine", completed: false },
        { description: "Witness Alduin resurrect a dragon", completed: false },
        { description: "Defeat the resurrected dragon", completed: false },
        { description: "Report to the Greybeards", completed: false }
      ],
      prerequisiteQuestId: 'db_04_blades',
      unlocks: ['db_06_esbern']
    },
    {
      id: 'db_06_esbern',
      title: "The Loremaster",
      description: "Find Esbern, the last Blades loremaster",
      location: "Riften",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 150,
      goldReward: 300,
      objectives: [
        { description: "Travel to Riften", completed: false },
        { description: "Find the entrance to the Ratway", completed: false },
        { description: "Locate Esbern in the Ratway Warrens", completed: false },
        { description: "Escort Esbern to safety", completed: false }
      ],
      prerequisiteQuestId: 'db_05_kynesgrove',
      unlocks: ['db_07_wall']
    },
    {
      id: 'db_07_wall',
      title: "Alduin's Wall",
      description: "Discover the secret of Alduin's Wall in Sky Haven Temple",
      location: "Sky Haven Temple",
      questType: 'main',
      difficulty: 'medium',
      xpReward: 200,
      goldReward: 400,
      objectives: [
        { description: "Travel to Sky Haven Temple", completed: false },
        { description: "Navigate the ancient Akaviri defenses", completed: false },
        { description: "Study Alduin's Wall", completed: false },
        { description: "Learn about the Shout that defeated Alduin", completed: false }
      ],
      prerequisiteQuestId: 'db_06_esbern',
      unlocks: ['db_08_paarthurnax']
    },
    {
      id: 'db_08_paarthurnax',
      title: "The Throat of the World",
      description: "Meet with Paarthurnax atop the mountain",
      location: "Throat of the World",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 250,
      goldReward: 500,
      objectives: [
        { description: "Learn the Clear Skies shout", completed: false },
        { description: "Ascend to the Throat of the World", completed: false },
        { description: "Meet Paarthurnax", completed: false },
        { description: "Learn about Dragonrend", completed: false }
      ],
      prerequisiteQuestId: 'db_07_wall',
      unlocks: ['db_09_scroll']
    },
    {
      id: 'db_09_scroll',
      title: "Elder Knowledge",
      description: "Obtain an Elder Scroll to learn Dragonrend",
      location: "Blackreach",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 300,
      goldReward: 600,
      objectives: [
        { description: "Find the Elder Scroll in Blackreach", completed: false },
        { description: "Navigate the Dwemer ruins", completed: false },
        { description: "Reach the Tower of Mzark", completed: false },
        { description: "Retrieve the Elder Scroll", completed: false }
      ],
      prerequisiteQuestId: 'db_08_paarthurnax',
      unlocks: ['db_10_alduin']
    },
    {
      id: 'db_10_alduin',
      title: "Alduin's Bane",
      description: "Use the Elder Scroll to learn Dragonrend and face Alduin",
      location: "Throat of the World",
      questType: 'main',
      difficulty: 'hard',
      xpReward: 500,
      goldReward: 1000,
      objectives: [
        { description: "Read the Elder Scroll at the Time-Wound", completed: false },
        { description: "Learn the Dragonrend shout", completed: false },
        { description: "Battle Alduin", completed: false },
        { description: "Drive Alduin away", completed: false }
      ],
      prerequisiteQuestId: 'db_09_scroll'
    }
  ]
};

// All quest chains
export const QUEST_CHAINS: QuestChain[] = [
  WARRIOR_QUEST_LINE,
  THIEF_QUEST_LINE,
  MAGE_QUEST_LINE,
  DRAGONBORN_QUEST_LINE
];

/**
 * Get the appropriate quest chain for a character based on their archetype
 */
export function getQuestChainForCharacter(character: Character): QuestChain | null {
  const archetype = (character.archetype || 'warrior').toLowerCase();
  
  // First try to find an exact match
  for (const chain of QUEST_CHAINS) {
    if (chain.archetypes.includes(archetype)) {
      return chain;
    }
  }
  
  // Check for partial matches
  for (const chain of QUEST_CHAINS) {
    for (const a of chain.archetypes) {
      if (archetype.includes(a) || a.includes(archetype)) {
        return chain;
      }
    }
  }
  
  // Default to Dragonborn (universal)
  return DRAGONBORN_QUEST_LINE;
}

/**
 * Get the starting quest for a character
 */
export function getStartingQuest(character: Character): QuestTemplate | null {
  const chain = getQuestChainForCharacter(character);
  if (!chain || chain.quests.length === 0) return null;
  return chain.quests[0];
}

/**
 * Get the next available quest in the chain
 */
export function getNextQuest(character: Character, completedQuestIds: string[]): QuestTemplate | null {
  const chain = getQuestChainForCharacter(character);
  if (!chain) return null;
  
  for (const quest of chain.quests) {
    // Skip already completed quests
    if (completedQuestIds.includes(quest.id)) continue;
    
    // Check prerequisites
    if (quest.prerequisiteQuestId && !completedQuestIds.includes(quest.prerequisiteQuestId)) {
      continue;
    }
    
    return quest;
  }
  
  return null;
}

/**
 * Convert a QuestTemplate to a CustomQuest
 */
export function templateToQuest(template: QuestTemplate, characterId: string): CustomQuest {
  return {
    id: `${characterId}_${template.id}`,
    characterId: characterId,
    title: template.title,
    description: template.description,
    location: template.location,
    questType: template.questType,
    difficulty: template.difficulty,
    xpReward: template.xpReward,
    goldReward: template.goldReward,
    objectives: template.objectives.map((obj, idx) => ({
      id: `obj_${idx}`,
      description: obj.description,
      completed: obj.completed
    })),
    status: 'active',
    createdAt: Date.now()
  };
}

/**
 * Generate a prompt fragment describing the main quest line for the AI
 */
export function generateQuestLinePrompt(character: Character): string {
  const chain = getQuestChainForCharacter(character);
  if (!chain) return '';
  
  return `
=== MAIN QUEST LINE: "${chain.name}" ===
${chain.description}

This character should be guided through this epic quest chain. The quests are:
${chain.quests.slice(0, 5).map((q, i) => `${i + 1}. "${q.title}" - ${q.description} (${q.location})`).join('\n')}
... and ${chain.quests.length - 5} more quests in the chain.

When introducing quests from this line, use the "newQuests" field with proper rewards.
Guide the player naturally toward these quests through NPCs and story hooks.
`;
}
