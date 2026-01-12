import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MinimalQuestModal } from './MinimalQuestModal';
import { Character, InventoryItem, CustomQuest, JournalEntry, StoryChapter, GameStateUpdate } from '../types';
import { Send, Loader2, Swords, User, Scroll, RefreshCw, Trash2, Settings, ChevronDown, ChevronUp, X, AlertTriangle, Users, Sun, Moon, Sunrise, Sunset, Clock, Map, Lock, Key, Flag } from 'lucide-react';
import { EquipmentHUD, getDefaultSlotForItem, SLOT_CONFIGS_EXPORT } from './EquipmentHUD';
import { isShield, isTwoHandedWeapon } from '../services/equipment';
import { useAppContext } from '../AppContext';
import { LockpickingMinigame, LockDifficulty } from './LockpickingMinigame';
import { SkyrimMap, findLocationByName } from './SkyrimMap';
import { ThinkingBubble } from './ThinkingBubble';
import AdventureInput from './AdventureInput';
import { RateLimitIndicator } from './StatusIndicators';
import type { EquipmentSlot } from '../types';
import { saveInventoryItem } from '../services/firestore';
import { getRateLimitStats, isRateLimited } from '../services/geminiService';
import type { PreferredAIModel } from '../services/geminiService';
import { getSimulationManager, processAISimulationUpdate, SimulationStateManager, NPC, PlayerFact } from '../services/stateManager';
import { subscribeToCombatResolved } from '../services/events';
import { getTransactionLedger, filterDuplicateTransactions } from '../services/transactionLedger';

interface ChatMessage {
  id: string;
  role: 'player' | 'gm';
  content: string;
  timestamp: number;
  updates?: GameStateUpdate;
}

interface AdventureChatProps {
  userId?: string | null;
  model?: PreferredAIModel | string;
  character: Character | null;
  inventory: InventoryItem[];
  quests: CustomQuest[];
  journal: JournalEntry[];
  story: StoryChapter[];
  onUpdateState: (updates: GameStateUpdate) => void;
}

const SYSTEM_PROMPT = `You are an immersive Game Master (GM) for a text-based Skyrim adventure. You are strictly a NARRATOR: describe scenes, NPCs, outcomes, and offer choices — but DO NOT make or apply mechanical changes. The game ENGINE is the only authority that applies items, gold, experience, potions, or stat changes. Adventure AI RESPONSES MUST BE NARRATIVE-ONLY. The player controls their character's actions.

CORE RULES:
1. Always stay in character as a Skyrim GM. Use Tamrielic lore, locations, factions, and NPCs.
2. Describe scenes vividly but concisely (2-4 paragraphs max).
3. React to player actions realistically. Combat has consequences. Choices matter.
4. Introduce challenges, NPCs, and plot hooks naturally.
5. Track the flow of the adventure and maintain continuity.
6. If the player does something impossible or lore-breaking, gently redirect them.
7. End responses with a clear situation the player can respond to.

=== ANTI-REPETITION RULES (CRITICAL) ===

NEVER REPEAT YOURSELF! This is a continuous flowing narrative.

DO NOT:
- Re-describe scenes you already described in your previous messages
- Re-introduce NPCs or enemies that are already present
- Repeat the same environmental details (smells, sounds, weather)
- Echo back what the player just said or did
- Start responses with summaries of what happened before
- Use the same phrases or sentence structures repeatedly

DO:
- Build upon the previous scene seamlessly
- Show consequences and changes from the player's actions
- Introduce NEW details, reactions, or developments
- Move the story FORWARD with each response
- Vary your writing style and vocabulary
- Focus on what's DIFFERENT or CHANGED

Example of BAD continuation (don't do this):
Previous: "The tavern is warm and crowded. A bard plays in the corner."
Player: "I order an ale"
BAD: "The tavern is warm and crowded. The bard continues playing. The innkeeper brings you ale."

Example of GOOD continuation:
Player: "I order an ale"
GOOD: "The innkeeper slides a frothy tankard across the worn counter, wiping her hands on her apron. 'Two septims, friend.' A drunk Nord at the next table eyes you curiously."

=== TIME FLOW SYSTEM (REALISTIC PACING) ===

Time passes based on the ACTION TYPE. Use timeAdvanceMinutes appropriately:

INSTANT ACTIONS (0-2 minutes):
- Single line of dialogue: 0-1 min
- Quick observation/looking around: 1-2 min
- Simple reaction or short exchange: 1-2 min

QUICK ACTIONS (2-10 minutes):
- Brief conversation: 3-5 min
- Searching a small area: 5-8 min
- Picking a simple lock: 3-5 min
- Reading a short note: 2-3 min
- Drinking/eating at a table: 5-10 min

MODERATE ACTIONS (10-30 minutes):
- Extended conversation: 10-20 min
- Detailed search of a room: 15-25 min
- Combat encounter (few enemies): 10-20 min
- Shopping/trading: 15-25 min
- Crafting a simple item: 20-30 min

LONG ACTIONS (30-120 minutes):
- Major combat encounter: 30-60 min
- Exploring a dungeon level: 45-90 min
- Traveling between nearby locations: 30-60 min
- Detailed crafting: 60-120 min
- Full meal at inn: 30-45 min

EXTENDED ACTIONS (2+ hours):
- Traveling between distant locations: 120-480 min (use actual travel time)
- Sleeping/resting: 360-480 min (6-8 hours)
- Training a skill: 120-240 min
- Major quest activities: 180-360 min

IMPORTANT: Most dialogue and simple actions should be 1-10 minutes MAX!
Don't add an hour for a quick conversation - that's unrealistic.

Example time applications:
- "I look at the barkeep" → timeAdvanceMinutes: 1
- "I ask about rumors" → timeAdvanceMinutes: 3
- "I have a long discussion about the civil war" → timeAdvanceMinutes: 15
- "I search the entire house for clues" → timeAdvanceMinutes: 25
- "I travel to Whiterun from Riverwood" → timeAdvanceMinutes: 90

=== SURVIVAL NEEDS SYSTEM (IMPORTANT) ===

The character has survival needs tracked on a 0-100 scale:
- hunger: 0 = satisfied, 100 = starving
- thirst: 0 = hydrated, 100 = dehydrated  
- fatigue: 0 = rested, 100 = exhausted

TIME & NEEDS PROGRESSION (be conservative!):
- Dialogue, talking, basic interactions: hunger/thirst/fatigue +0.2 to +0.5 MAX (very minor)
- Light activity (walking, shopping, exploring town): hunger/thirst +0.5-1.5, fatigue +0.3-1
- Moderate activity (hiking, light combat, searching): hunger/thirst +1-3, fatigue +1-2
- Heavy exertion (intense combat, running, climbing): hunger/thirst +2-5, fatigue +2-4
- Extended travel (hours of walking): hunger/thirst +4-8, fatigue +3-6

CRITICAL: Scale needs changes to TIME! If only 5 minutes pass, needs barely change.
- 5 min of talking = hunger +0.2, thirst +0.2, fatigue +0.1
- 30 min of searching = hunger +1, thirst +1.5, fatigue +0.8
- 1 hour of travel = hunger +2, thirst +3, fatigue +1.5

AUTO-CONSUMPTION RULES:
- When hunger > 70: If player has food items, automatically suggest/consume food
- When thirst > 70: If player has drink items, automatically suggest/consume drinks
- When fatigue > 80: Warn player about exhaustion, suggest rest

REST HANDLING:
- Player says "rest", "sleep", "make camp", etc: Handle it IN THE ADVENTURE
- With bedroll/tent: Good rest, fatigue reduced by 60-80, hunger/thirst +10-20
- At inn with bed: Excellent rest, fatigue reduced by 80-100, hunger/thirst +5-10
- Sleeping rough: Poor rest, fatigue reduced by 30-50, hunger/thirst +20-30
- Use timeAdvanceMinutes to advance 6-8 hours for a full rest
- Use needsChange to reduce fatigue and apply any hunger/thirst increase

EATING/DRINKING IN ADVENTURE:
There are TWO types of food/drink consumption:

1. INN/TAVERN FOOD (purchased and eaten on the spot):
   - Use goldChange: -X (NEGATIVE) to charge the cost
   - Use needsChange with NEGATIVE values to REDUCE needs: { "hunger": -30, "thirst": -20 }
   - NEVER use newItems for inn food - don't add tankards/plates to inventory!
   - NEVER use removedItems for inn food - nothing to remove!
   - Example response for ordering ale: goldChange: -5, needsChange: { "thirst": -25 }

2. INVENTORY FOOD (eating from player's own supplies):
   - Check survivalResources.foodItems to see what food player has
   - Use removedItems to remove the consumed item from inventory
   - Use needsChange with NEGATIVE values to reduce needs
   - Do NOT charge gold - player already owns the item

CRITICAL: needsChange values must be NEGATIVE to REDUCE needs!
- hunger: -30 means hunger DECREASES by 30 (good, player is less hungry)
- hunger: +30 means hunger INCREASES by 30 (bad, player gets hungrier)
- Same for thirst and fatigue

IMPORTANT: When showing food purchase OPTIONS at an inn, use previewCost in choices.
When player SELECTS a food option, charge gold and apply hunger reduction - never add/remove inventory items.

NEED EFFECTS (Narrate these when high):
- hunger > 60: Character feels hungry, stomach growls
- hunger > 80: Weakness from hunger, difficulty concentrating
- thirst > 60: Throat dry, craving water
- thirst > 80: Dehydration symptoms, headache
- fatigue > 60: Yawning, heavy limbs
- fatigue > 80: Stumbling, blurred vision, penalties to actions

=== EXPERIENCE & LEVELING SYSTEM ===

XP REWARDS (use xpChange field):
- Minor achievement (good roleplay, clever solution): 5-10 XP
- Defeating minor enemy: 10-15 XP
- Defeating challenging enemy: 20-30 XP
- Completing quest objective: 15-25 XP
- Completing full quest: 30-50 XP
- Major story milestone: 50-100 XP
- Exceptional roleplay or creative solution: 20-40 XP bonus

When to award XP:
- After combat victories
- When quest objectives are completed
- For clever problem-solving
- For significant character growth moments
- Do NOT award XP for trivial actions

Level thresholds: 100 XP per level (Level 2 = 100 XP, Level 3 = 200 XP, etc.)
The game will handle level-ups automatically when XP threshold is reached.

=== VITALS SYSTEM (COMBAT & ADVENTURE) ===

The character has current vitals that change during adventure:
- currentHealth: Current HP (can be lower than max health, NEVER higher)
- currentMagicka: Current magicka pool (for spells)
- currentStamina: Current stamina (for power attacks, sprinting)

Use "vitalsChange" to modify vitals (values are ADDITIVE):
- vitalsChange: { "currentHealth": -15 }  → Character takes 15 damage
- vitalsChange: { "currentHealth": 25 }   → Character heals 25 HP (e.g., potion)
- vitalsChange: { "currentMagicka": -30 } → Character uses 30 magicka (casting spell)
- vitalsChange: { "currentStamina": -20 } → Character uses 20 stamina (power attack)

DAMAGE GUIDELINES (scale to enemy difficulty):
- Weak enemy hit (wolf, skeever): 5-10 damage
- Standard enemy hit (bandit, draugr): 10-20 damage
- Strong enemy hit (bear, troll): 20-35 damage
- Boss/powerful enemy hit: 30-50 damage
- Critical/ambush damage: +50% bonus

HEALING:
- Minor healing potion: +25 health
- Standard healing potion: +50 health
- Major healing potion: +100 health
- Restoration spell: +20-40 health (uses magicka)
- Food healing: +5-15 health (slow over time)
- Rest at inn: Full heal

COMBAT FLOW:
1. When combat starts, describe the situation
2. Player actions determine hits/misses/dodges
3. Apply damage via vitalsChange when hits land
4. If currentHealth <= 0, character is incapacitated (not necessarily dead - can be captured, knocked out, etc.)
5. Offer choices like "Use health potion", "Try to flee", "Continue fighting"

Example combat response:
{
  "narrative": { "title": "Bandit Attack!", "content": "The bandit's axe finds its mark..." },
  "vitalsChange": { "currentHealth": -15 },
  "choices": [
    { "label": "Use Health Potion", "playerText": "I drink my healing potion" },
    { "label": "Counter Attack", "playerText": "I strike back with my sword" },
    { "label": "Try to Flee", "playerText": "I attempt to disengage and run" }
  ]
}

=== EQUIPMENT & ITEMS SYSTEM ===

When giving WEAPONS or ARMOR, include stats:
- Weapons: Include "damage" value (Iron: 5-8, Steel: 9-12, Dwarven: 13-16, Orcish: 17-20, Ebony: 21-25, Daedric: 26-30)
- Armor/Apparel: Include "armor" value (Leather: 10-15, Iron: 16-22, Steel: 23-30, Dwarven: 31-38, Ebony: 39-50, Daedric: 51-60)
- Include "slot" for equipment: head, chest, hands, feet, weapon, offhand, ring, necklace

Item Type Guidelines:
- "weapon": swords, axes, maces, daggers, bows, staves (requires "damage" stat)
- "apparel": armor, clothing, jewelry (requires "armor" stat for armor pieces)
- "potion": health/magicka/stamina potions
- "food": bread, cheese, meat, vegetables
- "drink": ale, mead, water, wine
- "misc": lockpicks, gems, misc items
- "key": keys to doors/chests
- "camping": bedroll, tent, firewood

Example weapon: { "name": "Steel Sword", "type": "weapon", "description": "A fine steel blade", "quantity": 1, "damage": 11, "slot": "weapon" }
Example armor: { "name": "Leather Armor", "type": "apparel", "description": "Light leather cuirass", "quantity": 1, "armor": 14, "slot": "chest" }

=== AMBIENT MUSIC CONTEXT (IMPORTANT) ===

Include "ambientContext" in EVERY response to control background music:
{
  "ambientContext": {
    "localeType": "wilderness|tavern|city|dungeon|interior|road",
    "inCombat": true/false,
    "mood": "peaceful|tense|mysterious|triumphant"
  }
}

LOCALE TYPE GUIDE:
- "tavern": Inns, taverns, bars, The Bannered Mare, Bee and Barb, etc.
- "city": Inside city walls - Whiterun, Solitude, Riften, Windhelm, Markarth
- "dungeon": Dungeons, caves, ruins, crypts, Dwemer ruins, Nordic tombs
- "interior": Shops, houses, temples, halls (non-tavern indoors)
- "road": Roads, paths, traveling between locations
- "wilderness": Forests, mountains, plains, outside areas

COMBAT STATE:
- Set inCombat: true when combat begins or continues
- Set inCombat: false when combat ends or during peaceful scenes
- Combat music takes priority over all other music

MOOD HINTS:
- "peaceful": Safe areas, friendly NPCs, rest
- "tense": Danger nearby, suspicious situations, stealth
- "mysterious": Ruins, magic, unknown areas
- "triumphant": Victory, quest completion, major achievement

Example responses:
- Entering tavern: "ambientContext": { "localeType": "tavern", "inCombat": false, "mood": "peaceful" }
- Starting combat: "ambientContext": { "localeType": "wilderness", "inCombat": true, "mood": "tense" }
- Exploring ruins: "ambientContext": { "localeType": "dungeon", "inCombat": false, "mood": "mysterious" }
- Night travel: "ambientContext": { "localeType": "road", "inCombat": false, "mood": "tense" }

=== SIMULATION STATE RULES (CRITICAL) ===

NPC IDENTITY CONSISTENCY:
- When an NPC is introduced, their name and role are PERMANENT
- NEVER change an NPC's name or role mid-scene
- Reference NPCs by their established name consistently
- If an NPC is listed in PRESENT NPCs, use their exact name and role

SCENE STATE MACHINE:
- Scenes progress through phases: exploration → encounter → questioning → negotiation/confrontation → resolution → exit
- Track the current phase and advance it based on player actions
- Do NOT reset scenes or restart dialogue without player request
- Each interaction should ADVANCE the situation, not loop

PLAYER FACT MEMORY:
- If the player has ESTABLISHED FACTS listed, DO NOT ask for that information again
- NPCs who have been told a fact should REMEMBER it
- Reference known facts naturally in dialogue
- Only contradict established facts if the player explicitly lies

CONSEQUENCE ENFORCEMENT:
- When tension with an NPC exceeds their tolerance, TRIGGER a consequence
- Do not allow infinite escalation - force a resolution
- Consequences include: entry granted, entry denied, arrest, combat, retreat
- Once a scene is resolved, move forward - don't replay it

DIALOGUE OPTION PRUNING:
- Do not offer dialogue options for topics already resolved
- If the player has explained something, don't show "Explain X" again
- Track exhausted options and don't repeat them

WORLD AUTHORITY:
- Riverwood has NO Jarl (it's a village under Whiterun's jurisdiction)
- Only Hold capitals have Jarls
- Use canonical Skyrim lore unless specifically told otherwise

TRANSACTION RULES (CRITICAL):
When presenting purchase/trade OPTIONS to the player:
- DO NOT include goldChange in the response - this is just showing options
- Include previewCost in choices to show what each option costs
- The transaction only occurs when the player SELECTS an option

When EXECUTING a transaction (player explicitly confirms purchase/payment):
- Include goldChange for the ACTUAL transaction
- Include transactionId to track unique purchases
- Only charge ONCE per logical transaction

Example - SHOWING options (no goldChange yet):
{
  "narrative": { "title": "The Innkeeper", "content": "Hulda gestures to the rooms upstairs..." },
  "choices": [
    { "label": "Pay 10 gold for a bed", "playerText": "I'll take a bed for the night", "previewCost": { "gold": 10 } },
    { "label": "Pay 25 gold for a room", "playerText": "I'd like a private room", "previewCost": { "gold": 25 } }
  ]
}

Example - EXECUTING a transaction (player selected):
{
  "narrative": { "title": "Room Purchased", "content": "Hulda takes your coin and hands you a key..." },
  "goldChange": -25,
  "transactionId": "room_purchase_bannered_mare_1",
  "newItems": [{ "name": "Room Key", "type": "misc", "description": "Key to your room", "quantity": 1 }]
}

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "narrative": { "title": "Short title", "content": "Your story response here..." },
  "newItems": [{ "name": "Item", "type": "weapon|apparel|potion|misc|key|food|drink|camping|ingredient", "description": "...", "quantity": 1, "armor": 0, "damage": 0, "slot": "head|chest|hands|feet|weapon|offhand|ring|necklace" }],
  "removedItems": [{ "name": "Item", "quantity": 1 }],
  "newQuests": [{ "title": "Quest", "description": "...", "location": "...", "dueDate": "...", "objectives": [{ "description": "...", "completed": false }] }],
  "updateQuests": [{ "title": "Quest Title", "status": "completed" }],
  "goldChange": 0,
  "transactionId": "optional_unique_id_for_purchases",
  "statUpdates": {},
  "timeAdvanceMinutes": 0,
  "needsChange": { "hunger": 0, "thirst": 0, "fatigue": 0 },
  "vitalsChange": { "currentHealth": 0, "currentMagicka": 0, "currentStamina": 0 },
  "ambientContext": { "localeType": "wilderness|tavern|city|dungeon|interior|road", "inCombat": false, "mood": "peaceful|tense|mysterious|triumphant" },
  "combatStart": {
    "enemies": [{ "name": "Bandit", "type": "humanoid", "level": 5, "maxHealth": 60, "currentHealth": 60, "armor": 15, "damage": 12, "behavior": "aggressive", "abilities": [{ "id": "slash", "name": "Slash", "type": "melee", "damage": 12, "cost": 10, "description": "A quick slash" }], "xpReward": 25, "goldReward": 10, "isBoss": false }],
    "location": "Forest Clearing",
    "ambush": false,
    "fleeAllowed": true,
    "surrenderAllowed": false
  },
  "discoveredLocations": [{ "name": "Hidden Cave", "type": "cave|dungeon|camp|fort|ruin|landmark", "x": 45, "y": 60, "description": "A secret cave behind the waterfall", "dangerLevel": "dangerous", "rumors": ["Bandits use this as a hideout"] }],
  "choices": [
    { "label": "Short option shown as button", "playerText": "Exact text to send", "topic": "optional_topic", "previewCost": { "gold": 10 } }
  ],
  "simulationUpdate": {
    "npcsIntroduced": [{ "name": "Guard Captain Hrolf", "role": "City Guard Captain", "disposition": "wary", "description": "A weathered Nord in steel plate" }],
    "npcUpdates": [{ "name": "Guard Captain Hrolf", "tensionChange": 10, "newKnowledge": { "player_profession": "alchemist" } }],
    "sceneStart": { "type": "checkpoint", "location": "Whiterun Gates" },
    "phaseChange": "questioning",
    "sceneResolution": "success",
    "topicsResolved": ["profession", "travel_purpose"],
    "optionsExhausted": ["Explain I'm an alchemist"],
    "factsEstablished": [{ "category": "identity", "key": "profession", "value": "alchemist", "disclosedToNPCs": ["Guard Captain Hrolf"] }],
    "newConsequences": [{ "type": "entry_denied", "description": "Guards will not allow entry", "triggerCondition": { "tensionThreshold": 80 } }]
  }
}

=== TURN-BASED COMBAT SYSTEM (POKEMON STYLE) ===

When HOSTILE combat begins, use "combatStart" to trigger the turn-based combat minigame:

WHEN TO USE combatStart:
- Player attacks an enemy or is attacked
- Hostile NPCs initiate combat
- Ambush encounters
- Boss fights
- Any situation where tactical turn-based combat makes sense

DO NOT use combatStart for:
- Simple scuffles that end quickly (use narrative + vitalsChange instead)
- Negotiations or intimidation
- Situations player can easily avoid

ENEMY STAT GUIDELINES (scale to player level):
- Level: Within 2 of player level (min 1)
- Health: 30-50 (weak), 50-80 (standard), 80-150 (strong), 150+ (boss)
- Armor: 5-15 (light), 15-35 (medium), 35-60 (heavy)
- Damage: 8-15 (low), 15-25 (medium), 25-40 (high)
- XP: 15-30 (weak), 30-60 (medium), 60-150 (strong), 150+ (boss)

ENEMY TYPES:
- humanoid: Bandits, soldiers, mages, vampires
- beast: Wolves, bears, sabre cats, spiders
- undead: Draugr, skeletons, ghosts
- daedra: Dremora, atronachs
- dragon: Dragons (boss only)
- automaton: Dwemer constructs

BEHAVIOR TYPES:
- aggressive: Attacks frequently, low defense
- defensive: High block chance, counterattacks
- tactical: Uses abilities strategically
- support: Heals/buffs allies
- berserker: High damage, ignores defense

Example combat encounter:
{
  "narrative": { "title": "Ambush!", "content": "Three bandits emerge from behind the rocks, weapons drawn! 'Your gold or your life!'" },
  "combatStart": {
    "enemies": [
      { "name": "Bandit Marauder", "type": "humanoid", "level": 6, "maxHealth": 70, "currentHealth": 70, "armor": 20, "damage": 15, "behavior": "aggressive", "abilities": [{ "id": "slash", "name": "Slash", "type": "melee", "damage": 15, "cost": 10, "description": "A vicious slash" }, { "id": "power_attack", "name": "Power Attack", "type": "melee", "damage": 25, "cost": 25, "description": "A devastating overhead strike" }], "xpReward": 35, "goldReward": 20, "isBoss": false },
      { "name": "Bandit Archer", "type": "humanoid", "level": 5, "maxHealth": 50, "currentHealth": 50, "armor": 10, "damage": 18, "behavior": "tactical", "abilities": [{ "id": "arrow", "name": "Arrow Shot", "type": "ranged", "damage": 18, "cost": 0, "description": "A precise arrow shot" }], "xpReward": 25, "goldReward": 15, "isBoss": false }
    ],
    "location": "Forest Road",
    "ambush": true,
    "fleeAllowed": true,
    "surrenderAllowed": true
  },
  "ambientContext": { "localeType": "wilderness", "inCombat": true, "mood": "tense" }
}

=== DISCOVERED LOCATIONS (MAP UPDATES) ===

When the player discovers a NEW location (not from the base Skyrim map), add it to the map:
- Use "discoveredLocations" to add new places the player finds
- Only add locations that are NOT standard Skyrim cities/towns (Whiterun, Riften, etc. are already on the map)
- Perfect for: hidden caves, bandit camps, secret ruins, unmarked locations, story-specific places
- Coordinates (x, y) are percentages 0-100 on the map (NW corner = 0,0; SE corner = 100,100)
- Approximate positions: Whiterun ~42,52; Solitude ~15,17; Riften ~88,78; Markarth ~8,48

Example discovering a hidden location:
{
  "narrative": { "title": "Secret Discovery", "content": "Behind the waterfall, you discover a hidden cave entrance..." },
  "discoveredLocations": [{
    "name": "Moonshade Grotto",
    "type": "cave",
    "x": 35,
    "y": 55,
    "description": "A hidden cave behind a waterfall, used by smugglers",
    "dangerLevel": "moderate",
    "rumors": ["Local thieves use this as a drop point", "Strange lights seen at night"]
  }]
}

SIMULATION UPDATE GUIDELINES:
- npcsIntroduced: Add when a new named NPC enters the scene
- npcUpdates: Use for tension changes (+10 for suspicion, -10 for trust), disposition shifts, new knowledge
- sceneStart: Use when entering a new location or encounter type
- phaseChange: Advance the phase based on what's happening
- sceneResolution: Set when an encounter concludes
- topicsResolved: Mark topics that have been fully addressed
- factsEstablished: When player reveals information about themselves
- newConsequences: Set up triggers for automatic outcomes

Only include fields that changed. The narrative field is always required.`;

// Builds the enhanced system prompt with simulation context
const buildSimulationSystemPrompt = (simulationContext: string): string => {
  if (!simulationContext || simulationContext.trim() === '') {
    return SYSTEM_PROMPT;
  }
  
  return `${SYSTEM_PROMPT}

=== ACTIVE SIMULATION STATE ===
${simulationContext}
=== END SIMULATION STATE ===

IMPORTANT: The above simulation state shows:
- Which NPCs are present and their current tension/disposition
- What facts the player has already established (DO NOT RE-ASK)
- What topics have been resolved (DO NOT REPEAT)
- What consequences are pending (ENFORCE THEM)

Maintain consistency with this state. Do not contradict it.`;
};

export const AdventureChat: React.FC<AdventureChatProps> = ({
  userId,
  model,
  character,
  inventory,
  quests,
  journal,
  story,
  onUpdateState
}) => {
  const { showToast, openBonfireMenu } = useAppContext();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showQuestModal, setShowQuestModal] = useState(false);
  const [toastMessages, setToastMessages] = useState<{ id: string; message: string; type: string }[]>([]);
    // Show toast notification for new quest
    useEffect(() => {
      if (!messages.length) return;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'gm' && lastMsg.updates?.newQuests?.length) {
        lastMsg.updates.newQuests.forEach((q: any) => {
          setToastMessages((prev) => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), message: `New Quest Started: ${q.title}`, type: 'success' }
          ]);
        });
      }
    }, [messages]);
    // Remove toast after 5s
    useEffect(() => {
      if (!toastMessages.length) return;
      const timers = toastMessages.map(t => setTimeout(() => setToastMessages(msgs => msgs.filter(m => m.id !== t.id)), 5000));
      return () => { timers.forEach(clearTimeout); };
    }, [toastMessages]);
    // ToastNotification import (assume already exists)
    // import { ToastNotification } from './ToastNotification';
  const [autoApply, setAutoApply] = useState(true);
  const [showModelTip, setShowModelTip] = useState(true);
  const [showSimulationPanel, setShowSimulationPanel] = useState(false);
  const [showEquipment, setShowEquipment] = useState(false);
  const [equipModalOpen, setEquipModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<EquipmentSlot | null>(null);
  const [localInventory, setLocalInventory] = useState<InventoryItem[]>(inventory || []);
  const [simulationWarnings, setSimulationWarnings] = useState<string[]>([]);
  const [rateLimitStats, setRateLimitStats] = useState(getRateLimitStats());
  
  // Lockpicking state
  const [showLockpicking, setShowLockpicking] = useState(false);
  const [lockpickingDifficulty, setLockpickingDifficulty] = useState<LockDifficulty>('novice');
  const [lockpickingName, setLockpickingName] = useState('Lock');
  
  // Map state
  const [showMap, setShowMap] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<string>('Riverwood');
  const [discoveredLocations, setDiscoveredLocations] = useState<Array<{
    name: string;
    type: 'city' | 'town' | 'village' | 'dungeon' | 'landmark' | 'camp' | 'fort' | 'ruin' | 'cave';
    x: number;
    y: number;
    hold?: string;
    description?: string;
    dangerLevel?: 'safe' | 'moderate' | 'dangerous' | 'deadly';
    faction?: string;
    rumors?: string[];
    discoveredAt?: number;
  }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const simulationManagerRef = useRef<SimulationStateManager | null>(null);

  const storageKey = character ? `aetherius:adventureChat:${character.id}` : '';

  const hasEstablishedState = Boolean(
    character &&
      (
        (story?.length || 0) > 0 ||
        (journal?.length || 0) > 0 ||
        (quests?.length || 0) > 0 ||
        (inventory?.length || 0) > 0 ||
        Boolean((character.identity || '').trim())
      )
  );

  // Rate limit stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimitStats(getRateLimitStats());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Initialize simulation state manager and transaction ledger
  useEffect(() => {
    if (!character) {
      simulationManagerRef.current = null;
      getTransactionLedger().setCharacter(null);
      return;
    }

    const manager = getSimulationManager(character.id, userId || null);
    simulationManagerRef.current = manager;
    
    // Set character on transaction ledger
    getTransactionLedger().setCharacter(character.id);
    
    // Load simulation state
    manager.load().catch(e => {
      console.warn('Failed to load simulation state:', e);
    });

    // Cleanup: save on unmount
    return () => {
      manager.forceSave().catch(e => {
        console.warn('Failed to save simulation state on unmount:', e);
      });
    };
  }, [character?.id, userId]);

  // Keep local inventory in sync with prop updates
  useEffect(() => {
    setLocalInventory(inventory || []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory]);

  // Equip an item locally and persist change
  const equipItem = async (item: InventoryItem, slot?: EquipmentSlot) => {
    const targetSlot = slot || getDefaultSlotForItem(item) || undefined;
    if (!targetSlot) return;

    // Prevent equipping shields in main hand
    if (targetSlot === 'weapon' && isShield(item)) {
      showToast?.('Cannot equip shields in main hand.', 'warning');
      return;
    }

    // If equipping to offhand while a two-handed weapon is in main hand, auto-unequip that two-handed weapon
    const mainEquipped = localInventory.find(i => i.equipped && i.slot === 'weapon');
    let unequipMainTwoHandedId: string | null = null;
    if (targetSlot === 'offhand' && mainEquipped && isTwoHandedWeapon(mainEquipped)) {
      unequipMainTwoHandedId = mainEquipped.id;
    }

    setLocalInventory(prev => {
      return prev.map(i => {
        if (i.id === item.id) return { ...i, equipped: true, slot: targetSlot };
        if (i.equipped && i.slot === targetSlot) return { ...i, equipped: false, slot: undefined };
        if (unequipMainTwoHandedId && i.id === unequipMainTwoHandedId) return { ...i, equipped: false, slot: undefined };
        // Auto-unequip offhand when equipping two-handed in main
        if (targetSlot === 'weapon' && isTwoHandedWeapon(item) && i.equipped && i.slot === 'offhand') {
          return { ...i, equipped: false, slot: undefined };
        }
        return i;
      });
    });

    if (userId) {
      try {
        // Persist changed items: the equipped item and any previously equipped in same slot
        const changed = [item];
        // Attempt to persist any previously equipped item in same slot
        const prevEquipped = localInventory.find(i => i.equipped && i.slot === targetSlot && i.id !== item.id);
        if (prevEquipped) changed.push({ ...prevEquipped, equipped: false, slot: undefined });
        await Promise.all(changed.map(c => saveInventoryItem(userId, { ...c, characterId: (character?.id || '') } as any)));
        try { (window as any).aetheriusUtils?.reloadItems?.(); } catch { /* ignore */ }
      } catch (e) {
        console.warn('Failed to save equipped item:', e);
      }
    }
  };

  const unequipItem = async (item: InventoryItem) => {
    setLocalInventory(prev => prev.map(i => i.id === item.id ? { ...i, equipped: false, slot: undefined } : i));
    if (userId) {
      try {
        await saveInventoryItem(userId, { ...item, equipped: false, slot: undefined, characterId: (character?.id || '') } as any);
        try { (window as any).aetheriusUtils?.reloadItems?.(); } catch { /* ignore */ }
      } catch (e) {
        console.warn('Failed to save unequipped item:', e);
      }
    }
  };

  const getEquippableItemsForSlot = (slot: EquipmentSlot) => {
    const slotConfig = SLOT_CONFIGS_EXPORT.find(s => s.slot === slot);
    if (!slotConfig) return [] as InventoryItem[];

    return localInventory.filter(item => {
      if (item.equipped) return false;
      if (!slotConfig.allowedTypes.includes(item.type)) return false;
      const defaultSlot = getDefaultSlotForItem(item);
      return defaultSlot === slot || !defaultSlot;
    });
  };

  // ============================================================================
  // LOCKPICKING SYSTEM
  // ============================================================================
  
  // Count lockpicks in inventory
  const lockpickCount = localInventory
    .filter(i => i.name.toLowerCase().includes('lockpick'))
    .reduce((sum, i) => sum + (i.quantity || 0), 0);

  // Get lockpicking skill level
  const lockpickingSkill = character?.skills?.find(s => s.name === 'Lockpicking')?.level || 15;

  // Start lockpicking attempt
  const startLockpicking = useCallback((difficulty: LockDifficulty, lockName?: string) => {
    if (lockpickCount <= 0) {
      // No lockpicks - show message in chat
      const noPicksMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'gm',
        content: `*You reach for your lockpicks, but find none.* You don't have any lockpicks! You'll need to find or purchase some before attempting to pick this lock.`,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, noPicksMessage]);
      return;
    }
    
    setLockpickingDifficulty(difficulty);
    setLockpickingName(lockName || `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Lock`);
    setShowLockpicking(true);
  }, [lockpickCount]);

  // Handle lockpicking success
  const handleLockpickSuccess = useCallback(() => {
    setShowLockpicking(false);
    const successMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'gm',
      content: `*Click!* The lock opens with a satisfying sound. Your lockpicking skills have served you well.`,
      timestamp: Date.now(),
      updates: {
        xpChange: lockpickingDifficulty === 'master' ? 25 : lockpickingDifficulty === 'expert' ? 20 : lockpickingDifficulty === 'adept' ? 15 : lockpickingDifficulty === 'apprentice' ? 10 : 5,
      }
    };
    setMessages(prev => [...prev, successMessage]);
    
    // Apply XP if auto-apply is on
    if (autoApply && successMessage.updates) {
      onUpdateState(successMessage.updates);
    }
  }, [lockpickingDifficulty, autoApply, onUpdateState]);

  // Handle lockpicking failure
  const handleLockpickFailure = useCallback((lockpicksBroken: number) => {
    setShowLockpicking(false);
    
    // Remove broken lockpicks from inventory
    if (lockpicksBroken > 0) {
      const lockpickItem = localInventory.find(i => i.name.toLowerCase().includes('lockpick'));
      if (lockpickItem) {
        onUpdateState({
          removedItems: [{ name: lockpickItem.name, quantity: lockpicksBroken }]
        });
      }
    }
    
    const failMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'gm',
      content: lockpicksBroken > 0 
        ? `*Snap!* ${lockpicksBroken > 1 ? `${lockpicksBroken} lockpicks break` : 'Your lockpick breaks'} in the lock. The mechanism remains stubbornly closed.`
        : `You step back from the lock, unable to open it this time.`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, failMessage]);
  }, [localInventory, onUpdateState]);

  // Handle no lockpicks
  const handleNoLockpicks = useCallback(() => {
    setShowLockpicking(false);
  }, []);

  // ============================================================================
  // MAP & LOCATION TRACKING
  // ============================================================================
  
  // Extract current location from recent story/messages
  useEffect(() => {
    // Try to find location from recent messages or story chapters
    const recentContent = [
      ...messages.slice(-5).map(m => m.content),
      ...story.slice(-3).map(s => s.content)
    ].join(' ');
    
    // Look for location patterns
    const locationPatterns = [
      /(?:arrive[ds]? (?:at|in)|enter[s]?|reach[es]?|approach[es]?|(?:you are|you're) (?:in|at)|inside|within)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      /(?:in|at|near|outside|inside)\s+(?:the\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:tavern|inn|city|town|village|hold|keep|temple|barrow|cave|mine|camp)/gi,
    ];
    
    for (const pattern of locationPatterns) {
      const matches = [...recentContent.matchAll(pattern)];
      for (const match of matches.reverse()) {
        const potentialLocation = match[1];
        if (potentialLocation && findLocationByName(potentialLocation)) {
          setCurrentLocation(potentialLocation);
          return;
        }
      }
    }
    
    // Check for direct city/town mentions
    const knownLocations = ['Whiterun', 'Solitude', 'Windhelm', 'Riften', 'Markarth', 'Falkreath', 'Morthal', 'Dawnstar', 'Winterhold', 'Riverwood', 'Rorikstead', 'Ivarstead', 'Helgen', 'Dragon Bridge'];
    for (const loc of knownLocations) {
      if (recentContent.toLowerCase().includes(loc.toLowerCase())) {
        setCurrentLocation(loc);
        return;
      }
    }
  }, [messages, story]);

  // Get visited locations from story
  const visitedLocations = React.useMemo(() => {
    const visited = new Set<string>();
    const allContent = [...story.map(s => s.content), ...journal.map(j => j.content)].join(' ');
    
    const knownLocations = ['Whiterun', 'Solitude', 'Windhelm', 'Riften', 'Markarth', 'Falkreath', 'Morthal', 'Dawnstar', 'Winterhold', 'Riverwood', 'Rorikstead', 'Ivarstead', 'Helgen', 'Dragon Bridge', 'High Hrothgar', 'Bleak Falls Barrow'];
    for (const loc of knownLocations) {
      if (allContent.toLowerCase().includes(loc.toLowerCase())) {
        visited.add(loc);
      }
    }
    
    return Array.from(visited);
  }, [story, journal]);

  // Get quest locations
  const questLocations = React.useMemo(() => {
    return quests
      .filter(q => q.status === 'active' && q.location)
      .map(q => ({ name: q.location!, questName: q.title }));
  }, [quests]);

  useEffect(() => {
    const key = userId ? `aetherius:hideAdventureModelTip:${userId}` : 'aetherius:hideAdventureModelTip';
    try {
      setShowModelTip(localStorage.getItem(key) !== '1');
    } catch {
      setShowModelTip(true);
    }
  }, [userId]);

  const dismissModelTip = () => {
    setShowModelTip(false);
    const key = userId ? `aetherius:hideAdventureModelTip:${userId}` : 'aetherius:hideAdventureModelTip';
    try {
      localStorage.setItem(key, '1');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!character) return;

    // Prefer Firestore sync when authenticated
    if (userId) {
      (async () => {
        try {
          const { loadAdventureMessages } = await import('../services/firestore');
          const loaded = await loadAdventureMessages(userId, character.id);
          if (Array.isArray(loaded)) {
            setMessages(loaded as unknown as ChatMessage[]);
          }
        } catch (e) {
          console.warn('Failed to load adventure messages from Firestore; falling back to local storage.', e);
          try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) setMessages(parsed);
          } catch {
            // ignore
          }
        }
      })();
      return;
    }

    // Local-only persistence
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setMessages(parsed);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character?.id, userId]);

  useEffect(() => {
    if (!character) return;
    if (userId) return; // Firestore handles persistence
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, character, storageKey, userId]);

  const scrollToBottom = () => {
    // Scroll only within the chat container, not the whole page
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Small delay to ensure content is rendered before scrolling
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages]);

  // XP threshold for leveling - 100 XP per level
  const XP_PER_LEVEL = 100;
  
  const buildContext = () => {
    if (!character) return '';
    
    // Get simulation context if available
    const simulationContext = simulationManagerRef.current?.buildContext() || '';
    
    // Calculate XP progress toward next level
    const currentXP = character.experience || 0;
    const xpForNextLevel = (character.level || 1) * XP_PER_LEVEL;
    const xpProgress = currentXP % XP_PER_LEVEL;
    
    // Categorize food and drink items in inventory
    const foodItems = inventory.filter(i => i.type === 'food' && (i.quantity || 0) > 0);
    const drinkItems = inventory.filter(i => (i.type === 'drink' || i.type === 'potion') && (i.quantity || 0) > 0);
    const restItems = inventory.filter(i => 
      i.name.toLowerCase().includes('bedroll') || 
      i.name.toLowerCase().includes('tent') || 
      i.name.toLowerCase().includes('camping') ||
      i.name.toLowerCase().includes('sleeping bag')
    );
    
    return JSON.stringify({
      character: {
        name: character.name,
        race: character.race,
        gender: character.gender,
        archetype: character.archetype,
        level: character.level,
        experience: currentXP,
        xpToNextLevel: xpForNextLevel,
        xpProgress: xpProgress,
        gold: character.gold || 0,
        stats: character.stats,
        currentVitals: character.currentVitals || {
          currentHealth: character.stats.health,
          currentMagicka: character.stats.magicka,
          currentStamina: character.stats.stamina
        },
        needs: character.needs || { hunger: 0, thirst: 0, fatigue: 0 },
        time: character.time || { day: 1, hour: 8, minute: 0 },
        identity: character.identity,
        psychology: character.psychology,
        moralCode: character.moralCode,
        allowedActions: character.allowedActions,
        forbiddenActions: character.forbiddenActions,
        skills: character.skills?.slice(0, 6),
      },
      survivalResources: {
        foodItems: foodItems.slice(0, 10).map(i => ({ name: i.name, qty: i.quantity })),
        drinkItems: drinkItems.slice(0, 10).map(i => ({ name: i.name, qty: i.quantity })),
        restItems: restItems.slice(0, 5).map(i => ({ name: i.name, qty: i.quantity })),
      },
      inventory: inventory.slice(0, 25).map(i => ({ name: i.name, type: i.type, qty: i.quantity })),
      quests: quests.slice(0, 20).map(q => ({ title: q.title, status: q.status, location: q.location, description: q.description })),
      journal: journal.slice(-10).map(j => ({ date: j.date, title: j.title, content: j.content.substring(0, 400) })),
      story: story.slice(-5).map(s => ({ title: s.title, summary: s.summary, date: s.date })),
      storySnippets: story.slice(-2).map(s => ({ title: s.title, content: s.content.substring(0, 600) })),
      recentChat: messages.slice(-8).map(m => ({ role: m.role, content: m.content.substring(0, 250) })),
      simulationState: simulationContext
    });
  };

  // Get the dynamic system prompt with simulation context
  const getSystemPrompt = (): string => {
    const simulationContext = simulationManagerRef.current?.buildContext() || '';
    return buildSimulationSystemPrompt(simulationContext);
  };

  const formatList = (items: string[], max: number) => {
    const trimmed = items.filter(Boolean).slice(0, max);
    if (trimmed.length === 0) return '';
    return trimmed.join(', ') + (items.length > max ? ', …' : '');
  };

  const snippet = (text: string, maxLen: number) => {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (t.length <= maxLen) return t;
    return t.slice(0, maxLen).trimEnd() + '…';
  };

  // Process rest logic for adventure chat to ensure proper fatigue reduction
  const processRestLogicForAdventure = (result: any, content: string, inventory: InventoryItem[]) => {
    // Check if this is a rest action by looking at content and updates
    const contentLower = content.toLowerCase();
    const isRestAction = (
      contentLower.includes('rest') || 
      contentLower.includes('sleep') || 
      contentLower.includes('camp') ||
      contentLower.includes('bed down') ||
      contentLower.includes('lie down') ||
      (result.needsChange?.fatigue && result.needsChange.fatigue < 0) // fatigue reduction
    );

    if (!isRestAction || !result.timeAdvanceMinutes) {
      return result; // Not a rest action, return unchanged
    }

    // Determine rest type from content
    let restType: 'outside' | 'camp' | 'inn' = 'outside';
    if (contentLower.includes('inn') || contentLower.includes('tavern') || contentLower.includes('bed')) {
      restType = 'inn';
    } else if (contentLower.includes('camp') || contentLower.includes('tent') || contentLower.includes('camping')) {
      restType = 'camp';
    }

    // Check for camping gear
    const hasCampingGear = inventory.some(i => 
      (i.quantity || 0) > 0 &&
      ((i.name || '').toLowerCase().includes('camping kit') || 
       (i.name || '').toLowerCase().includes('tent'))
    );
    
    const hasBedroll = inventory.some(i => 
      (i.quantity || 0) > 0 &&
      (i.name || '').toLowerCase().includes('bedroll')
    );

    // Calculate proper fatigue reduction based on rest type and equipment
    const hours = Math.max(1, Math.round(result.timeAdvanceMinutes / 60));
    let fatigueReduction = 15; // outside (poor rest)
    
    if (restType === 'camp') {
      if (hasCampingGear) fatigueReduction = 40;
      else if (hasBedroll) fatigueReduction = 30;
      else fatigueReduction = 15;
    } else if (restType === 'inn') {
      fatigueReduction = 50;
    }
    
    // Scale by hours (base is 8 hours)
    const scaledReduction = Math.round(fatigueReduction * (hours / 8));
    
    // Apply proper fatigue reduction
    const processedResult = { ...result };
    if (!processedResult.needsChange) {
      processedResult.needsChange = {};
    }
    processedResult.needsChange.fatigue = -Math.abs(scaledReduction); // Ensure negative for reduction
    
    console.log(`[Adventure Rest] Applied ${restType} rest logic: ${scaledReduction} fatigue reduction over ${hours} hours`);
    
    return processedResult;
  };

  const buildContextualIntro = (): string => {
    if (!character) return '';

    const lastChapter = story.slice(-1)[0];
    const lastJournal = journal.slice(-1)[0];
    const activeQuests = quests.filter(q => q.status === 'active');

    const questLine = activeQuests.length
      ? `Active quests: ${formatList(activeQuests.map(q => q.title), 4)}.`
      : '';

    const itemsLine = inventory.length
      ? `Notable gear: ${formatList(
          inventory
            .filter(i => (i.quantity || 0) > 0)
            .slice(0, 8)
            .map(i => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ''}`),
          6
        )}.`
      : '';

    const identityLine = character.identity ? snippet(character.identity, 180) : '';

    // If we have no prior state at all, fall back to the classic opener.
    const hasEstablishedState = Boolean(lastChapter || lastJournal || activeQuests.length || inventory.length || identityLine);
    if (!hasEstablishedState) {
      return `*The mists of time part before you...*\n\nWelcome, ${character.name}, ${character.race} ${character.archetype}. The land of Skyrim stretches before you, cold and unforgiving, yet ripe with opportunity.\n\nYou find yourself at a crossroads. The cobblestones beneath your feet are worn by centuries of travelers. To the north, smoke rises from a small village. To the east, a dark forest looms. A weathered signpost creaks in the wind.\n\n*What do you do?*`;
    }

    const recapParts: string[] = [];
    if (lastChapter) {
      recapParts.push(`Last chapter: “${lastChapter.title}”. ${snippet(lastChapter.content, 320)}`);
    } else if (lastJournal) {
      recapParts.push(`Last journal entry: “${lastJournal.title}”. ${snippet(lastJournal.content, 320)}`);
    }
    if (questLine) recapParts.push(questLine);
    if (itemsLine) recapParts.push(itemsLine);
    if (identityLine) recapParts.push(`You remind yourself who you are: ${identityLine}`);

    const recap = recapParts.join('\n\n');
    return `*You draw a slow breath and feel Skyrim’s cold air bite at your lungs...*\n\n${recap}\n\nThe world hasn’t reset—only turned another page.\n\n*What do you do next?*`;
  };

  const sendPlayerText = async (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed || loading || !character) return;

    // Check rate limiting
    if (isRateLimited()) {
      const stats = getRateLimitStats();
      setSimulationWarnings([
        `Rate limited! Please wait. (${stats.callsThisMinute}/${stats.maxPerMinute} calls this minute)`
      ]);
      return;
    }

    const playerMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'player',
      content: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, playerMessage]);
    setInput('');
    setLoading(true);
    setSimulationWarnings([]); // Clear previous warnings

    if (userId) {
      void import('../services/firestore')
        .then(m => m.saveAdventureMessage(userId, character.id, playerMessage))
        .catch(e => console.warn('Failed to save player message to Firestore', e));
    }

    try {
      const { generateAdventureResponse } = await import('../services/geminiService');
      // Build strict read-only AdventureContext to pass to the AI (engine state only - no mechanics allowed)
      const simulationContext = buildContext();
      const recentTx = getTransactionLedger().getRecentTransactions(5).map(t => ({ type: t.type, gold: t.goldAmount, xp: t.xpAmount, items: t.items, timestamp: t.timestamp }));
      const playerReadOnly = character ? {
        id: character.id,
        name: character.name,
        currentVitals: character.currentVitals || { currentHealth: character.stats.health, currentMagicka: character.stats.magicka, currentStamina: character.stats.stamina },
        gold: character.gold || 0,
        experience: character.experience || 0,
        inventorySummary: inventory.map(i => ({ name: i.name, qty: i.quantity || 1 }))
      } : null;

      // Last combat summary (read-only): find last resolved combat scene
      let lastCombatSummary: any = null;
      try {
        const state = simulationManagerRef.current?.getState();
        const history = state?.sceneHistory || [];
        for (let i = history.length - 1; i >= 0; i--) {
          const s = history[i];
          if (s.type === 'combat' && s.resolution && s.resolution !== 'none') {
            lastCombatSummary = { resolution: s.resolution, location: s.location, events: s.events || [] };
            break;
          }
        }
      } catch (e) {
        // ignore
      }

      const adventureContext = {
        readOnly: true,
        player: playerReadOnly,
        recentEngineTransactions: recentTx,
        lastCombat: lastCombatSummary
      };

      const context = `${simulationContext}\n\nADVENTURE_CONTEXT_JSON:\n${JSON.stringify(adventureContext, null, 2)}`;
      const systemPrompt = getSystemPrompt(); // Use dynamic system prompt with simulation context
      const result = await generateAdventureResponse(trimmed, context, systemPrompt, { model });
      
      // Process simulation state updates if present
      if (result.simulationUpdate && simulationManagerRef.current) {
        const { warnings, appliedChanges } = processAISimulationUpdate(
          simulationManagerRef.current,
          result.simulationUpdate
        );
        
        if (warnings.length > 0) {
          setSimulationWarnings(warnings);
          console.warn('Simulation warnings:', warnings);
        }
        
        if (appliedChanges.length > 0) {
          console.log('Simulation changes applied:', appliedChanges);
        }
      }
      
      // Sanitize narrative text to remove any explicit mechanical deltas (defense-in-depth)
      const sanitizeMechanicalNarrative = (text: string) => {
        if (!text || typeof text !== 'string') return text;
        let s = text;
        s = s.replace(/\+\s*\d+\s*(gold|gp|g)\b/gi, 'some coin');
        s = s.replace(/gained\s+\d+\s+(gold|gp|g)\b/gi, 'found some coin');
        s = s.replace(/gained\s+\d+\s+experience\b/gi, 'learned something useful');
        s = s.replace(/\+\s*\d+\s*(xp|experience)\b/gi, 'some experience');
        s = s.replace(/you\s+(?:drink|consume|used?)\s+[^\.\,\n]*/gi, 'you use an item');
        s = s.replace(/regain(?:ed)?\s+\d+\s+(health|hp|stamina|magicka)\b/gi, 'feel restored');
        s = s.replace(/lost\s+\d+\s+(health|hp|stamina|magicka)\b/gi, 'took damage');
        s = s.replace(/\b\d+\s+gold\b/gi, 'some coin');
        s = s.replace(/\b\+?\d+\s*xp\b/gi, 'some experience');
        // Final pass to remove leftover +50 or similar
        s = s.replace(/\+\d+\b/gi, '');
        s = s.replace(/\b\d+\b/gi, (m) => (isNaN(Number(m)) ? m : ''));
        return s.trim();
      };

      const sanitizedContent = sanitizeMechanicalNarrative(result.narrative?.content || 'The winds of fate are silent...');
      if (sanitizedContent !== (result.narrative?.content || '')) {
        setSimulationWarnings(prev => [...prev, 'Adventure response contained mechanical details which were removed to preserve engine authority.']);
      }

      const gmMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'gm',
        content: sanitizedContent || 'The winds of fate are silent...',
        timestamp: Date.now(),
        updates: result
      };

      setMessages(prev => [...prev, gmMessage]);

      if (userId) {
        void import('../services/firestore')
          .then(m => m.saveAdventureMessage(userId, character.id, gmMessage))
          .catch(e => console.warn('Failed to save GM message to Firestore', e));
      }

      // Auto-apply game state changes if enabled
      // Filter out duplicate/preview transactions to prevent double-charging
      if (autoApply && result) {
        // Detect rest logic but ONLY open Bonfire when the PLAYER explicitly requested rest (or the GM included '@bonfire').
        // This prevents Bonfire from appearing on arbitrary GM responses.
        const processedResult = processRestLogicForAdventure(result, gmMessage.content, inventory);
        let skipAutoApply = false;

        if (processedResult && processedResult.timeAdvanceMinutes) {
          const contentLower = (gmMessage.content || '').toLowerCase();
          const hasBonfireTag = contentLower.includes('@bonfire') || (Array.isArray(result?.tags) && result!.tags!.includes('bonfire')) || (result?.narrative?.content && String(result.narrative.content).toLowerCase().includes('@bonfire'));

          // Check if the player's last message explicitly requested rest/sleep/camp
          const playerRequestedRest = /\b(rest|sleep|make camp|camp|bed down|lie down)\b/i.test(playerMessage.content || '');

          // Only open Bonfire if the player requested rest (preferred), or there is an explicit tag
          if (playerRequestedRest || hasBonfireTag) {
            // Determine rest type by inspecting content (same heuristics as before)
            let restType: 'outside' | 'camp' | 'inn' = 'outside';
            if (contentLower.includes('inn') || contentLower.includes('bed')) restType = 'inn';
            else if (contentLower.includes('camp') || contentLower.includes('tent')) restType = 'camp';
            const hours = Math.max(1, Math.min(12, Math.round((processedResult.timeAdvanceMinutes || 480) / 60)));

            // Open bonfire menu with a preview — player must confirm
            if (openBonfireMenu) {
              try {
                openBonfireMenu({ type: restType, hours });
                skipAutoApply = true;
              } catch (e) {
                // ignore any opener errors and fall back to normal processing
              }
            }
          }
        }

        if (skipAutoApply) {
          console.log('[Bonfire] Rest detected (explicit player request or tag); opened Bonfire menu and skipped auto-apply.');
          return; // don't apply any auto-update now — user will confirm via Bonfire UI
        }

        // Only treat as preview if:
        // 1. Explicitly marked as preview by AI, OR
        // 2. Has choices AND has previewCost in choices (showing options, not executing)
        // If player just executed a choice (has goldChange but choices are for NEXT action), apply it
        const hasPreviewCosts = Array.isArray(processedResult.choices) && 
          processedResult.choices.some((c: any) => c?.previewCost?.gold);
        const isPreviewResponse = processedResult.isPreview || hasPreviewCosts;
        
        const { filteredUpdate, wasFiltered, reason } = filterDuplicateTransactions({
          ...processedResult,
          isPreview: isPreviewResponse
        });
        
        if (wasFiltered) {
          console.log(`[Transaction] Gold change filtered: ${reason} (would have been ${processedResult.goldChange})`);
        }
        
        // If transaction was applied, record it
        if (!wasFiltered && processedResult.goldChange && processedResult.transactionId) {
          getTransactionLedger().recordTransaction(processedResult.transactionId, {
            goldAmount: processedResult.goldChange
          });
        }
        
        onUpdateState(filteredUpdate as GameStateUpdate);
      }
    } catch (error) {
      console.error('Adventure chat error:', error);
      const errorMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'gm',
        content: '*The connection to Aetherius wavers...* (Error generating response. Please try again.)',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);

      if (userId) {
        void import('../services/firestore')
          .then(m => m.saveAdventureMessage(userId, character.id, errorMessage))
          .catch(e => console.warn('Failed to save error message to Firestore', e));
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async () => {
    await sendPlayerText(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewAdventure = () => {
    if (!character) return;
    const intro: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: 'gm',
      content: buildContextualIntro(),
      timestamp: Date.now()
    };
    setMessages([intro]);
    setSimulationWarnings([]);

    // Reset simulation state for new adventure
    if (simulationManagerRef.current) {
      simulationManagerRef.current.reset();
    }

    if (userId) {
      void import('../services/firestore')
        .then(async m => {
          await m.clearAdventureMessages(userId, character.id);
          await m.saveAdventureMessage(userId, character.id, intro);
          // Also clear simulation state in Firestore
          await m.clearSimulationState(userId, character.id);
        })
        .catch(e => console.warn('Failed to reset adventure messages in Firestore', e));
    }
  };

  const clearChat = () => {
    if (confirm('Clear all messages and simulation state? This will reset NPCs, scenes, and tracked facts.')) {
      setMessages([]);
      setSimulationWarnings([]);

      // Reset simulation state
      if (simulationManagerRef.current) {
        simulationManagerRef.current.reset();
      }

      if (userId && character) {
        void import('../services/firestore')
          .then(async m => {
            await m.clearAdventureMessages(userId, character.id);
            await m.clearSimulationState(userId, character.id);
          })
          .catch(e => console.warn('Failed to clear adventure messages in Firestore', e));
      }
    }
  };

  const applyUpdates = (updates: GameStateUpdate) => {
    const toApply: GameStateUpdate = {};
    if (updates.newItems?.length) toApply.newItems = updates.newItems;
    if (updates.removedItems?.length) toApply.removedItems = updates.removedItems;
    if (updates.newQuests?.length) toApply.newQuests = updates.newQuests;
    if (updates.updateQuests?.length) toApply.updateQuests = updates.updateQuests;
    if (typeof updates.goldChange === 'number' && updates.goldChange !== 0) toApply.goldChange = updates.goldChange;
    if (updates.statUpdates && Object.keys(updates.statUpdates).length) toApply.statUpdates = updates.statUpdates;
    if (typeof updates.timeAdvanceMinutes === 'number' && updates.timeAdvanceMinutes !== 0) toApply.timeAdvanceMinutes = updates.timeAdvanceMinutes;
    if (updates.needsChange && Object.keys(updates.needsChange).length) toApply.needsChange = updates.needsChange;
    
    // Handle discovered locations - add to map
    if (updates.discoveredLocations?.length) {
      setDiscoveredLocations(prev => {
        const existingNames = new Set(prev.map(l => l.name.toLowerCase()));
        const newLocations = updates.discoveredLocations!.filter(
          loc => !existingNames.has(loc.name.toLowerCase())
        ).map(loc => ({ ...loc, discoveredAt: Date.now() }));
        return [...prev, ...newLocations];
      });
    }
    
    if (Object.keys(toApply).length > 0) {
      onUpdateState(toApply);
    }
  };

  // Subscribe to explicit CombatResolved events so Adventure can narrate confirmed combat outcomes (narrative-only)
  useEffect(() => {
    const unsub = subscribeToCombatResolved((payload) => {
      // Build a strictly narrative description (no mechanical deltas, per policy)
      const outcomeText = payload.result === 'victory' ? 'You were victorious.' : payload.result === 'defeat' ? 'You were defeated.' : payload.result === 'fled' ? 'You fled the battle.' : payload.result === 'surrendered' ? 'You surrendered.' : 'Combat concluded.';
      const narrative = `*Combat Resolved* — ${outcomeText} The engine has already applied loot and rewards where appropriate. ${payload.finalVitals ? 'Your vitals have been updated accordingly.' : ''} What do you do next?`;
      const gmMessage: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: 'gm',
        content: narrative,
        timestamp: Date.now(),
        updates: { narrative: { title: 'Combat Update', content: narrative }, isPreview: true }
      };
      setMessages(prev => [...prev, gmMessage]);

      if (userId && character) {
        void import('../services/firestore')
          .then(m => m.saveAdventureMessage(userId, character.id, gmMessage))
          .catch(e => console.warn('Failed to save combat GM message to Firestore', e));
      }

      // Also surface a short UI warning so players see we applied an engine action
      setSimulationWarnings(prev => [...prev, `Combat resolved: ${payload.result}. Engine-applied rewards verified.`]);
    });

    return () => unsub();
  }, [userId, character]);

  // Get simulation state summary for display
  const getSimulationSummary = () => {
    if (!simulationManagerRef.current) return null;
    const state = simulationManagerRef.current.getState();
    const presentNPCs = (Object.values(state.npcs) as NPC[]).filter(npc => npc.isPresent);
    const allFacts = simulationManagerRef.current.getAllFacts();
    const scene = state.currentScene;
    
    return {
      npcCount: presentNPCs.length,
      npcs: presentNPCs.map(npc => ({
        name: npc.name,
        role: npc.role,
        disposition: npc.disposition,
        tension: npc.tension
      })),
      factCount: Object.keys(allFacts).length,
      facts: allFacts as Record<string, PlayerFact>,
      scene: scene ? {
        type: scene.type,
        location: scene.location,
        phase: scene.phase,
        attempts: scene.attempts,
        resolvedTopics: scene.resolvedTopics
      } : null,
      pendingConsequences: state.pendingConsequences.filter(c => !c.applied).length
    };
  };

  // Time of day helper functions
  const getTimeOfDay = (hour: number): { period: string; icon: React.ReactNode; bgClass: string } => {
    if (hour >= 5 && hour < 7) {
      return { period: 'Dawn', icon: <Sunrise size={16} className="text-orange-400" />, bgClass: 'bg-gradient-to-r from-orange-900/30 to-yellow-900/30' };
    } else if (hour >= 7 && hour < 12) {
      return { period: 'Morning', icon: <Sun size={16} className="text-yellow-400" />, bgClass: 'bg-gradient-to-r from-yellow-900/20 to-blue-900/20' };
    } else if (hour >= 12 && hour < 14) {
      return { period: 'Noon', icon: <Sun size={16} className="text-yellow-300" />, bgClass: 'bg-gradient-to-r from-yellow-800/30 to-yellow-900/30' };
    } else if (hour >= 14 && hour < 17) {
      return { period: 'Afternoon', icon: <Sun size={16} className="text-yellow-500" />, bgClass: 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' };
    } else if (hour >= 17 && hour < 20) {
      return { period: 'Evening', icon: <Sunset size={16} className="text-orange-500" />, bgClass: 'bg-gradient-to-r from-orange-900/30 to-purple-900/30' };
    } else if (hour >= 20 && hour < 22) {
      return { period: 'Dusk', icon: <Moon size={16} className="text-purple-400" />, bgClass: 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30' };
    } else {
      return { period: 'Night', icon: <Moon size={16} className="text-blue-300" />, bgClass: 'bg-gradient-to-r from-indigo-900/40 to-slate-900/40' };
    }
  };

  // Skyrim/Tamrielic Calendar System
  const TAMRIEL_DAYS = ['Sundas', 'Morndas', 'Tirdas', 'Middas', 'Turdas', 'Fredas', 'Loredas'];
  const TAMRIEL_MONTHS = [
    { name: 'Morning Star', days: 31 },   // January
    { name: "Sun's Dawn", days: 28 },      // February
    { name: 'First Seed', days: 31 },      // March
    { name: "Rain's Hand", days: 30 },     // April
    { name: 'Second Seed', days: 31 },     // May
    { name: 'Midyear', days: 30 },         // June
    { name: "Sun's Height", days: 31 },    // July
    { name: 'Last Seed', days: 31 },       // August
    { name: 'Hearthfire', days: 30 },      // September
    { name: 'Frostfall', days: 31 },       // October
    { name: "Sun's Dusk", days: 30 },      // November
    { name: 'Evening Star', days: 31 }     // December
  ];

  const getTamrielDate = (totalDays: number): { dayName: string; dayOfMonth: number; monthName: string; year: number } => {
    // Start at 4E 201 (Skyrim's year), 17th of Last Seed (game start)
    const baseYear = 201;
    const startMonth = 7; // Last Seed (August, 0-indexed)
    const startDay = 17;
    
    // Calculate starting point in days from year start
    let daysFromYearStart = startDay - 1;
    for (let i = 0; i < startMonth; i++) {
      daysFromYearStart += TAMRIEL_MONTHS[i].days;
    }
    
    // Add player's elapsed days
    let currentDays = daysFromYearStart + (totalDays - 1);
    let year = baseYear;
    
    // Handle year overflow
    const daysInYear = TAMRIEL_MONTHS.reduce((sum, m) => sum + m.days, 0);
    while (currentDays >= daysInYear) {
      currentDays -= daysInYear;
      year++;
    }
    
    // Find month and day
    let monthIndex = 0;
    while (currentDays >= TAMRIEL_MONTHS[monthIndex].days) {
      currentDays -= TAMRIEL_MONTHS[monthIndex].days;
      monthIndex++;
      if (monthIndex >= 12) monthIndex = 0;
    }
    
    const dayOfMonth = currentDays + 1;
    const dayName = TAMRIEL_DAYS[(totalDays - 1) % 7];
    
    return {
      dayName,
      dayOfMonth,
      monthName: TAMRIEL_MONTHS[monthIndex].name,
      year
    };
  };

  const formatTime = (hour: number, minute: number): string => {
    const h = hour % 12 || 12;
    const m = minute.toString().padStart(2, '0');
    const ampm = hour < 12 ? 'AM' : 'PM';
    return `${h}:${m} ${ampm}`;
  };

  const getOrdinalSuffix = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  // Time display component
  const TimeDisplay = () => {
    const time = character?.time || { day: 1, hour: 8, minute: 0 };
    const { period, icon, bgClass } = getTimeOfDay(time.hour);
    const tamrielDate = getTamrielDate(time.day);
    
    return (
      <div className={`flex flex-col sm:flex-row items-center gap-2 sm:gap-3 px-4 py-2 rounded-lg border border-skyrim-border ${bgClass}`}>
        {/* Time of day */}
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-gray-200">{period}</span>
        </div>
        
        <div className="hidden sm:block h-4 w-px bg-skyrim-gold/30" />
        
        {/* Clock */}
        <div className="flex items-center gap-2 text-sm">
          <Clock size={14} className="text-skyrim-text" />
          <span className="text-skyrim-text font-mono">{formatTime(time.hour, time.minute)}</span>
        </div>
        
        <div className="hidden sm:block h-4 w-px bg-skyrim-gold/30" />
        
        {/* Tamrielic Date */}
        <div className="text-xs sm:text-sm text-center sm:text-left">
          <span className="text-skyrim-gold">{tamrielDate.dayName}</span>
          <span className="text-skyrim-text">, </span>
          <span className="text-skyrim-text">{tamrielDate.dayOfMonth}{getOrdinalSuffix(tamrielDate.dayOfMonth)} of </span>
          <span className="text-skyrim-gold">{tamrielDate.monthName}</span>
          <span className="text-gray-500 text-xs ml-1">4E {tamrielDate.year}</span>
        </div>
      </div>
    );
  };

  if (!character) {
    return (
      <div className="h-full flex items-center justify-center px-2 sm:px-4">
        <div className="text-center py-20 text-gray-500">
          <Swords size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a character to begin your adventure.</p>
        </div>
      </div>
    );
  }

  // --- Show/hide rate limit bar state ---
  const [showRateLimit, setShowRateLimit] = useState(() => {
    const stored = localStorage.getItem('showRateLimitBar');
    return stored === null ? true : stored === 'true';
  });
  useEffect(() => {
    localStorage.setItem('showRateLimitBar', showRateLimit ? 'true' : 'false');
  }, [showRateLimit]);

  // --- Rate Limit Toggle Button ---
  const RateLimitToggle = () => (
    <button
      className="ml-2 px-2 py-1 text-xs rounded bg-gray-800/60 hover:bg-gray-700/80 border border-skyrim-border text-gray-300 hover:text-skyrim-gold transition-colors"
      style={{ marginTop: 4 }}
      onClick={() => setShowRateLimit(v => !v)}
      title={showRateLimit ? 'Hide rate limit bar' : 'Show rate limit bar'}
    >
      {showRateLimit ? 'Hide Rate Limit Bar' : 'Show Rate Limit Bar'}
    </button>
  );

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto px-2 sm:px-4 overflow-hidden">
      {/* Header - compact */}
      <div className="flex-shrink-0 py-3 sm:py-4 bg-skyrim-paper border-y-4 border-skyrim-border text-center">
        <h1 className="text-2xl sm:text-3xl font-serif text-skyrim-gold mb-1 flex items-center justify-center gap-2">
          <Swords size={24} />
          Adventure
        </h1>
        {/* Time Display */}
        <TimeDisplay />
        <RateLimitToggle />
        {/* Rate Limit Indicator */}
        {showRateLimit && (rateLimitStats.callsThisMinute > 0 || rateLimitStats.callsThisHour > 0) && (
          <div className="mt-2 flex justify-center">
            <RateLimitIndicator stats={rateLimitStats} />
          </div>
        )}
      </div>

      {/* AI Model Tip */}
      {showModelTip && (
        <div className="flex-shrink-0 mt-2 bg-blue-900/20 border border-blue-600/50 rounded-lg p-2 sm:p-3 relative">
          <button
            onClick={dismissModelTip}
            className="absolute top-2 right-2 text-blue-200/70 hover:text-blue-200 transition-colors"
            aria-label="Dismiss tip"
            type="button"
          >
            <X size={16} />
          </button>
          <div className="flex items-start gap-2 pr-6">
            <span className="text-blue-400 text-lg">💡</span>
            <div className="flex-1">
              <p className="text-blue-200 text-xs">
                <strong>Tip:</strong> For the best adventure experience, use <strong>Gemma 2 27B</strong>. Change it in the Actions menu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Controls - compact */}
      <div className="flex-shrink-0 py-2 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowQuestModal(v => !v)}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-skyrim-gold hover:border-skyrim-gold transition-colors flex items-center gap-1.5 text-xs"
            title="Show Quests"
          >
            <Flag size={12} /> Quests
          </button>
                {/* Minimal Quest Modal */}
                <MinimalQuestModal quests={quests} open={showQuestModal} onClose={() => setShowQuestModal(false)} />

                {/* Toast Notification for new quest */}
                {toastMessages.length > 0 && (
                  <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 9999 }}>
                    {/* Use your ToastNotification component here if available */}
                    {toastMessages.map(t => (
                      <div key={t.id} style={{ background: '#2ecc40', color: '#fff', borderRadius: 8, padding: '12px 20px', marginBottom: 8, minWidth: 240, maxWidth: 400, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontWeight: 500, fontSize: 16, opacity: 0.95 }}>
                        {t.message}
                      </div>
                    ))}
                  </div>
                )}
          <button
            onClick={startNewAdventure}
            className="px-2 py-1.5 bg-skyrim-gold/20 text-skyrim-gold border border-skyrim-gold/50 rounded hover:bg-skyrim-gold hover:text-skyrim-dark transition-colors flex items-center gap-1.5 text-xs"
          >
            <RefreshCw size={12} /> New
          </button>
          <button
            onClick={clearChat}
            disabled={messages.length === 0}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-red-400 hover:border-red-400 transition-colors flex items-center gap-1.5 text-xs disabled:opacity-50"
          >
            <Trash2 size={12} /> Clear
          </button>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowSimulationPanel(!showSimulationPanel)}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-skyrim-gold hover:border-skyrim-gold transition-colors flex items-center gap-1.5 text-xs"
          >
            <Users size={12} /> State {showSimulationPanel ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          <button
            onClick={() => setShowEquipment(true)}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-skyrim-gold hover:border-skyrim-gold transition-colors flex items-center gap-1.5 text-xs"
            title="Open Equipment"
          >
            <User size={12} /> Equip
          </button>
          <button
            onClick={() => setShowMap(true)}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-skyrim-gold hover:border-skyrim-gold transition-colors flex items-center gap-1.5 text-xs"
            title="View Skyrim Map"
          >
            <Map size={12} /> Map
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-2 py-1.5 text-skyrim-text border border-skyrim-border rounded hover:text-skyrim-gold hover:border-skyrim-gold transition-colors flex items-center gap-1.5 text-xs"
          >
            <Settings size={12} /> {showSettings ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        </div>
      </div>

      {/* Simulation Warnings */}
      {simulationWarnings.length > 0 && (
        <div className="flex-shrink-0 mb-2 bg-yellow-900/20 border border-yellow-600/50 rounded-lg p-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-yellow-200 text-xs font-semibold mb-1">Warnings:</p>
              <ul className="text-yellow-200/80 text-xs space-y-0.5">
                {simulationWarnings.map((warning, idx) => (
                  <li key={idx}>• {warning}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setSimulationWarnings([])}
              className="text-yellow-200/50 hover:text-yellow-200"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Simulation State Panel */}
      {showSimulationPanel && (
        <div className="mb-4 p-4 bg-skyrim-paper/40 border border-skyrim-border rounded animate-in fade-in">
          <h3 className="text-skyrim-gold font-semibold mb-3 flex items-center gap-2">
            <Users size={16} /> Simulation State
          </h3>
          {(() => {
            const summary = getSimulationSummary();
            if (!summary) return <p className="text-gray-500 text-sm">No simulation data available.</p>;
            
            return (
              <div className="space-y-3 text-sm">
                {/* Current Scene */}
                {summary.scene && (
                  <div className="bg-skyrim-paper/30 p-2 rounded">
                    <p className="text-skyrim-text text-xs uppercase mb-1">Current Scene</p>
                    <p className="text-skyrim-text">
                      <span className="text-skyrim-gold">{summary.scene.type}</span> at {summary.scene.location}
                    </p>
                    <p className="text-skyrim-text text-xs">
                      Phase: {summary.scene.phase} | Attempts: {summary.scene.attempts}
                    </p>
                    {summary.scene.resolvedTopics.length > 0 && (
                      <p className="text-green-400/80 text-xs mt-1">
                        ✓ Resolved: {summary.scene.resolvedTopics.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Present NPCs */}
                {summary.npcs.length > 0 && (
                  <div className="bg-skyrim-paper/30 p-2 rounded">
                    <p className="text-skyrim-text text-xs uppercase mb-1">Present NPCs ({summary.npcCount})</p>
                    <div className="space-y-1">
                      {summary.npcs.map((npc, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-gray-200">
                            <span className="text-skyrim-gold">{npc.name}</span>
                            <span className="text-gray-500 text-xs ml-1">({npc.role})</span>
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            npc.disposition === 'hostile' ? 'bg-red-900/50 text-red-400' :
                            npc.disposition === 'wary' ? 'bg-yellow-900/50 text-yellow-400' :
                            npc.disposition === 'friendly' ? 'bg-green-900/50 text-green-400' :
                            npc.disposition === 'allied' ? 'bg-blue-900/50 text-blue-400' :
                            'bg-skyrim-dark/50 text-skyrim-text'
                          }`}>
                            {npc.disposition} ({npc.tension}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Established Facts */}
                {summary.factCount > 0 && (
                  <div className="bg-skyrim-paper/30 p-2 rounded">
                    <p className="text-skyrim-text text-xs uppercase mb-1">Established Facts ({summary.factCount})</p>
                    <div className="space-y-1">
                      {Object.entries(summary.facts).slice(0, 5).map(([key, fact]) => (
                        <p key={key} className="text-xs text-skyrim-text">
                          <span className="text-skyrim-gold">{key}:</span> {fact.value}
                          {fact.disclosedTo.length > 0 && (
                            <span className="text-gray-500 ml-1">(known by {fact.disclosedTo.length})</span>
                          )}
                        </p>
                      ))}
                      {summary.factCount > 5 && (
                        <p className="text-gray-500 text-xs">...and {summary.factCount - 5} more</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Pending Consequences */}
                {summary.pendingConsequences > 0 && (
                  <div className="bg-red-900/20 border border-red-900/30 p-2 rounded">
                    <p className="text-red-400 text-xs">
                      ⚠ {summary.pendingConsequences} pending consequence(s)
                    </p>
                  </div>
                )}
                
                {/* Empty state */}
                {summary.npcs.length === 0 && summary.factCount === 0 && !summary.scene && (
                  <p className="text-gray-500 text-sm">No active simulation state. Start an adventure to begin tracking.</p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Equipment Modal */}
      {showEquipment && (
        <div className="fixed inset-0 bg-skyrim-dark/60 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg shadow-2xl p-6 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif text-skyrim-gold">Equipment</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowEquipment(false)} className="px-3 py-1 bg-gray-600 text-white rounded">Close</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <EquipmentHUD
                  items={localInventory}
                  onUnequip={(it) => unequipItem(it)}
                  onEquipFromSlot={(slot) => { setSelectedSlot(slot); setEquipModalOpen(true); }}
                />
              </div>

              <div className="space-y-3">
                <div className="bg-skyrim-paper/30 p-3 rounded border border-skyrim-border">
                  <p className="text-skyrim-text text-sm mb-2">Inventory</p>
                  <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-2">
                    {localInventory.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-skyrim-paper/40 rounded border border-skyrim-border">
                        <div>
                          <div className="text-skyrim-gold font-semibold">{item.name} <span className="text-xs text-skyrim-text">x{item.quantity}</span></div>
                          <div className="text-xs text-skyrim-text">{item.description}</div>
                          <div className="flex gap-2 mt-1 text-xs">
                            {item.damage ? <span className="text-red-400">Damage: {item.damage}</span> : null}
                            {item.armor ? <span className="text-blue-400">Armor: {item.armor}</span> : null}
                            {item.slot ? <span className="text-skyrim-text">Slot: {item.slot}</span> : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.equipped ? (
                            <button onClick={() => unequipItem(item)} className="px-3 py-1 bg-red-700/60 text-white rounded text-xs">Unequip</button>
                          ) : (
                            <>
                              <button onClick={() => equipItem(item)} className="px-3 py-1 bg-green-700/60 text-white rounded text-xs">Equip</button>
                              <button onClick={() => { const slot = getDefaultSlotForItem(item); if (slot) { setSelectedSlot(slot); setEquipModalOpen(true); } }} className="px-2 py-1 bg-gray-700 text-white rounded text-xs">Slot…</button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Equip-from-slot modal (sub-modal) */}
            {equipModalOpen && selectedSlot && (
              <div className="fixed inset-0 bg-skyrim-dark/50 flex items-center justify-center z-60 p-4">
                <div className="bg-skyrim-paper border-2 border-skyrim-gold rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                  <h4 className="text-lg font-serif text-skyrim-gold mb-3">Select item for {selectedSlot}</h4>
                  {getEquippableItemsForSlot(selectedSlot).length > 0 ? (
                    <div className="space-y-2">
                      {getEquippableItemsForSlot(selectedSlot).map(it => (
                        <button key={it.id} onClick={() => { equipItem(it, selectedSlot); setEquipModalOpen(false); setSelectedSlot(null); }} className="w-full p-3 bg-skyrim-paper/40 border border-skyrim-border rounded hover:border-skyrim-gold hover:bg-skyrim-paper/60 transition-colors text-left flex items-center gap-3">
                          <div className="flex-1">
                            <div className="text-skyrim-gold font-serif">{it.name}</div>
                            <div className="text-xs text-skyrim-text">{it.description}</div>
                          </div>
                          {(it.armor || it.damage) && (
                            <div className="text-xs text-skyrim-text">
                              {it.armor && <div>Armor: {it.armor}</div>}
                              {it.damage && <div>Damage: {it.damage}</div>}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-center py-4">No suitable items for this slot</p>
                  )}

                  <div className="mt-4">
                    <button onClick={() => { setEquipModalOpen(false); setSelectedSlot(null); }} className="w-full py-2 bg-gray-600 text-white rounded">Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="flex-shrink-0 mb-2 p-2 bg-skyrim-paper/40 border border-skyrim-border rounded animate-in fade-in">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoApply}
              onChange={() => setAutoApply(!autoApply)}
              className="accent-skyrim-gold w-4 h-4"
            />
            <span className="text-xs text-skyrim-text">Auto-apply game changes (items, quests, gold)</span>
          </label>
        </div>
      )}

      {/* Chat Messages - flex-1 to fill available space */}
      <div 
        ref={chatContainerRef}
        className="flex-1 min-h-0 bg-skyrim-paper/30 border border-skyrim-border rounded-lg overflow-y-auto scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-gray-500">
            <Scroll size={40} className="mb-3 opacity-50" />
            <p className="text-center text-sm mb-3">
              {hasEstablishedState ? 'Continue where you left off...' : 'Your adventure awaits...'}
            </p>
            <button
              onClick={startNewAdventure}
              className="px-3 py-1.5 bg-skyrim-gold text-skyrim-dark font-bold rounded text-sm hover:bg-skyrim-goldHover transition-colors"
            >
              {hasEstablishedState ? 'Continue Adventure' : 'Begin Your Journey'}
            </button>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'player' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'player' 
                    ? 'bg-blue-900/50 text-blue-400 border border-blue-700' 
                    : 'bg-skyrim-gold/20 text-skyrim-gold border border-skyrim-gold/50'
                }`}>
                  {msg.role === 'player' ? <User size={14} /> : <Swords size={14} />}
                </div>
                <div className={`flex-1 max-w-[85%] ${msg.role === 'player' ? 'text-right' : ''}`}>
                  <div className={`inline-block p-3 rounded-lg ${
                    msg.role === 'player'
                      ? 'bg-blue-900/30 border border-blue-800 text-gray-200'
                      : 'bg-skyrim-paper/60 border border-skyrim-border text-gray-200'
                  }`}>
                    <p className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{msg.content}</p>
                  </div>

                  {/* Clickable dialogue choices */}
                  {msg.role === 'gm' && Array.isArray(msg.updates?.choices) && (msg.updates?.choices?.length || 0) > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.updates!.choices!.slice(0, 6).map((c, idx) => {
                        const playerText = (c?.playerText || c?.label || '').trim();
                        return (
                          <div key={`${msg.id}:choice:${idx}`} className="group relative">
                            <button
                              onClick={() => sendPlayerText(playerText)}
                              disabled={loading}
                              className="px-3 py-2 bg-skyrim-gold/20 text-skyrim-gold border border-skyrim-gold/40 rounded hover:bg-skyrim-gold hover:text-skyrim-dark transition-colors text-sm font-sans disabled:opacity-50 flex items-center gap-2"
                            >
                              <span>{c?.label || 'Choose'}</span>
                              {/* Show preview cost badge if present */}
                              {c?.previewCost?.gold && (
                                <span className="text-xs px-1.5 py-0.5 bg-yellow-900/40 text-yellow-400 rounded border border-yellow-700/50">
                                  {c.previewCost.gold} gold
                                </span>
                              )}
                            </button>
                            {/* Hover tooltip showing what will be typed */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900/95 border border-skyrim-gold/50 rounded shadow-lg text-xs text-gray-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 max-w-[250px]">
                              <div className="text-skyrim-text text-[10px] mb-1">You will say:</div>
                              <div className="text-skyrim-gold italic truncate">"{playerText}"</div>
                              {/* Tooltip arrow */}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900/95"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Game state changes indicator */}
                  {msg.role === 'gm' && msg.updates && (
                    <>
                      {/* Time passage indicator - show prominently when time advances */}
                      {typeof msg.updates.timeAdvanceMinutes === 'number' && msg.updates.timeAdvanceMinutes > 0 && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-sans">
                          <div className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-900/30 border border-indigo-700/50 text-indigo-300">
                            <Clock size={12} />
                            <span>
                              {msg.updates.timeAdvanceMinutes >= 60 
                                ? `${Math.floor(msg.updates.timeAdvanceMinutes / 60)}h ${msg.updates.timeAdvanceMinutes % 60}m passed`
                                : `${msg.updates.timeAdvanceMinutes} min passed`
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Inline item changes (always show) */}
                      {(msg.updates.removedItems?.length || msg.updates.newItems?.length || 
                        (typeof msg.updates.goldChange === 'number' && msg.updates.goldChange !== 0) ||
                        (typeof msg.updates.xpChange === 'number' && msg.updates.xpChange !== 0) ||
                        (msg.updates.needsChange && Object.keys(msg.updates.needsChange).length > 0)) && (
                        <div className="mt-1 flex flex-wrap gap-2 text-xs font-sans">
                          {msg.updates.removedItems?.map((item, idx) => (
                            <span key={`removed-${idx}`} className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-900/30">
                              -{item.quantity} {item.name}
                            </span>
                          ))}
                          {msg.updates.newItems?.map((item, idx) => (
                            <span key={`added-${idx}`} className="text-green-400 bg-green-900/20 px-2 py-0.5 rounded border border-green-900/30">
                              +{item.quantity} {item.name}
                            </span>
                          ))}
                          {typeof msg.updates.goldChange === 'number' && msg.updates.goldChange !== 0 && (
                            <span className={`px-2 py-0.5 rounded border ${
                              msg.updates.goldChange > 0 
                                ? 'text-yellow-400 bg-yellow-900/20 border-yellow-900/30' 
                                : 'text-orange-400 bg-orange-900/20 border-orange-900/30'
                            }`}>
                              {msg.updates.goldChange > 0 ? '+' : ''}{msg.updates.goldChange} gold
                            </span>
                          )}
                          {typeof msg.updates.xpChange === 'number' && msg.updates.xpChange !== 0 && (
                            <span className={`px-2 py-0.5 rounded border ${
                              msg.updates.xpChange > 0 
                                ? 'text-purple-400 bg-purple-900/20 border-purple-900/30' 
                                : 'text-skyrim-text bg-gray-900/20 border-skyrim-border/30'
                            }`}>
                              {msg.updates.xpChange > 0 ? '+' : ''}{msg.updates.xpChange} XP ✨
                            </span>
                          )}
                          {/* Vitals changes (damage/healing) */}
                          {msg.updates.vitalsChange && (
                            <>
                              {typeof msg.updates.vitalsChange.currentHealth === 'number' && msg.updates.vitalsChange.currentHealth !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.vitalsChange.currentHealth > 0 
                                    ? 'text-green-400 bg-green-900/20 border-green-900/30' 
                                    : 'text-red-400 bg-red-900/20 border-red-900/30'
                                }`}>
                                  {msg.updates.vitalsChange.currentHealth > 0 ? '💚 +' : '💔 '}{msg.updates.vitalsChange.currentHealth} HP
                                </span>
                              )}
                              {typeof msg.updates.vitalsChange.currentMagicka === 'number' && msg.updates.vitalsChange.currentMagicka !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.vitalsChange.currentMagicka > 0 
                                    ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' 
                                    : 'text-purple-400 bg-purple-900/20 border-purple-900/30'
                                }`}>
                                  {msg.updates.vitalsChange.currentMagicka > 0 ? '🔵 +' : '🔮 '}{msg.updates.vitalsChange.currentMagicka} MP
                                </span>
                              )}
                              {typeof msg.updates.vitalsChange.currentStamina === 'number' && msg.updates.vitalsChange.currentStamina !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.vitalsChange.currentStamina > 0 
                                    ? 'text-green-400 bg-green-900/20 border-green-900/30' 
                                    : 'text-yellow-400 bg-yellow-900/20 border-yellow-900/30'
                                }`}>
                                  {msg.updates.vitalsChange.currentStamina > 0 ? '⚡ +' : '💨 '}{msg.updates.vitalsChange.currentStamina} SP
                                </span>
                              )}
                            </>
                          )}
                          {/* Survival needs changes */}
                          {msg.updates.needsChange && (
                            <>
                              {typeof msg.updates.needsChange.hunger === 'number' && msg.updates.needsChange.hunger !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.needsChange.hunger < 0 
                                    ? 'text-green-400 bg-green-900/20 border-green-900/30' 
                                    : 'text-orange-400 bg-orange-900/20 border-orange-900/30'
                                }`}>
                                  {msg.updates.needsChange.hunger < 0 ? '🍖 ' : ''}{msg.updates.needsChange.hunger > 0 ? '+' : ''}{msg.updates.needsChange.hunger} hunger
                                </span>
                              )}
                              {typeof msg.updates.needsChange.thirst === 'number' && msg.updates.needsChange.thirst !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.needsChange.thirst < 0 
                                    ? 'text-blue-400 bg-blue-900/20 border-blue-900/30' 
                                    : 'text-orange-400 bg-orange-900/20 border-orange-900/30'
                                }`}>
                                  {msg.updates.needsChange.thirst < 0 ? '💧 ' : ''}{msg.updates.needsChange.thirst > 0 ? '+' : ''}{msg.updates.needsChange.thirst} thirst
                                </span>
                              )}
                              {typeof msg.updates.needsChange.fatigue === 'number' && msg.updates.needsChange.fatigue !== 0 && (
                                <span className={`px-2 py-0.5 rounded border ${
                                  msg.updates.needsChange.fatigue < 0 
                                    ? 'text-cyan-400 bg-cyan-900/20 border-cyan-900/30' 
                                    : 'text-orange-400 bg-orange-900/20 border-orange-900/30'
                                }`}>
                                  {msg.updates.needsChange.fatigue < 0 ? '😴 ' : ''}{msg.updates.needsChange.fatigue > 0 ? '+' : ''}{msg.updates.needsChange.fatigue} fatigue
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Full update panel (only when not auto-apply) */}
                      {!autoApply && (
                        <div className="mt-2 p-2 bg-skyrim-paper/40 rounded border border-skyrim-border/50 text-xs">
                          {msg.updates.newQuests?.length ? (
                            <div className="text-skyrim-gold">+ {msg.updates.newQuests.length} quest(s) started</div>
                          ) : null}
                          {typeof msg.updates.timeAdvanceMinutes === 'number' && msg.updates.timeAdvanceMinutes !== 0 ? (
                            <div className="text-skyrim-text">⏳ {msg.updates.timeAdvanceMinutes > 0 ? '+' : ''}{msg.updates.timeAdvanceMinutes} min</div>
                          ) : null}
                          <button
                            onClick={() => applyUpdates(msg.updates!)}
                            className="mt-1 px-2 py-1 bg-skyrim-gold/20 text-skyrim-gold border border-skyrim-gold/50 rounded text-xs hover:bg-skyrim-gold hover:text-skyrim-dark transition-colors"
                          >
                            Apply Changes
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Thinking bubble while AI is processing */}
            {loading && <ThinkingBubble />}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area - fixed at bottom */}
      <div className="flex-shrink-0 mt-2 bg-skyrim-paper/60 border border-skyrim-border rounded-lg p-2">
        <div className="flex gap-2">
          <AdventureInput
            ref={inputRef}
            value={input}
            onChange={setInput}
            onSend={handleSend}
            placeholder="What do you do? (Enter to send)"
            disabled={loading || messages.length === 0}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim() || messages.length === 0}
            className="px-3 bg-skyrim-gold hover:bg-skyrim-goldHover disabled:opacity-50 disabled:cursor-not-allowed text-skyrim-dark font-bold rounded flex items-center justify-center transition-colors"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {/* Lockpicking Minigame Modal */}
      <LockpickingMinigame
        isOpen={showLockpicking}
        onClose={() => setShowLockpicking(false)}
        difficulty={lockpickingDifficulty}
        lockpickCount={lockpickCount}
        lockpickingSkill={lockpickingSkill}
        onSuccess={handleLockpickSuccess}
        onFailure={handleLockpickFailure}
        onNoLockpicks={handleNoLockpicks}
        lockName={lockpickingName}
      />

      {/* Skyrim Map Modal */}
      <SkyrimMap
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        currentLocation={currentLocation}
        visitedLocations={visitedLocations}
        questLocations={questLocations}
        discoveredLocations={discoveredLocations}
      />
    </div>
  );
};
