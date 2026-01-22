(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // services/logger.ts
  var logger_exports = {};
  __export(logger_exports, {
    log: () => log
  });
  var shouldLog, log;
  var init_logger = __esm({
    "services/logger.ts"() {
      shouldLog = () => {
        if (typeof process !== "undefined" && process.env && false) return false;
        if (typeof process !== "undefined" && process.env && process.env.AETHERIUS_DEBUG === "1") return true;
        return true;
      };
      log = {
        debug: (...args) => {
          if (shouldLog()) console.debug(...args);
        },
        info: (...args) => {
          if (shouldLog()) console.info(...args);
        },
        warn: (...args) => {
          if (shouldLog()) console.warn(...args);
        },
        error: (...args) => {
          if (shouldLog()) console.error(...args);
        }
      };
    }
  });

  // services/nutritionData.ts
  var FOOD_NUTRITION = {
    // Basic foods - low satiety
    "apple": { hungerReduction: 10, thirstReduction: 5 },
    "cabbage": { hungerReduction: 8, thirstReduction: 3 },
    "potato": { hungerReduction: 12, thirstReduction: 0 },
    "leek": { hungerReduction: 8, thirstReduction: 2 },
    "carrot": { hungerReduction: 10, thirstReduction: 3 },
    "tomato": { hungerReduction: 8, thirstReduction: 5 },
    "gourd": { hungerReduction: 10, thirstReduction: 8 },
    // Bread & baked goods - moderate satiety
    "bread": { hungerReduction: 20, thirstReduction: 0 },
    "sweetroll": { hungerReduction: 15, thirstReduction: 0 },
    "honey nut treat": { hungerReduction: 12, thirstReduction: 0 },
    "boiled creme treat": { hungerReduction: 15, thirstReduction: 5 },
    "apple pie": { hungerReduction: 25, thirstReduction: 5 },
    "snowberry crostata": { hungerReduction: 20, thirstReduction: 5 },
    // Cheese - moderate satiety
    "cheese wheel": { hungerReduction: 35, thirstReduction: -5 },
    // cheese makes you thirsty
    "cheese wedge": { hungerReduction: 18, thirstReduction: -3 },
    "eidar cheese wheel": { hungerReduction: 30, thirstReduction: -5 },
    "goat cheese wheel": { hungerReduction: 28, thirstReduction: -5 },
    // Cooked meats - high satiety
    "cooked venison": { hungerReduction: 40, thirstReduction: 0 },
    "venison": { hungerReduction: 40, thirstReduction: 0 },
    "grilled salmon": { hungerReduction: 35, thirstReduction: 5 },
    "salmon steak": { hungerReduction: 35, thirstReduction: 5 },
    "cooked beef": { hungerReduction: 45, thirstReduction: 0 },
    "beef": { hungerReduction: 45, thirstReduction: 0 },
    "rabbit haunch": { hungerReduction: 25, thirstReduction: 0 },
    "roasted rabbit": { hungerReduction: 25, thirstReduction: 0 },
    "horker meat": { hungerReduction: 35, thirstReduction: 0 },
    "horker loaf": { hungerReduction: 40, thirstReduction: 5 },
    "mammoth snout": { hungerReduction: 50, thirstReduction: 0 },
    "mammoth steak": { hungerReduction: 55, thirstReduction: 0 },
    "cooked chicken": { hungerReduction: 30, thirstReduction: 0 },
    "pheasant roast": { hungerReduction: 32, thirstReduction: 0 },
    "grilled leeks": { hungerReduction: 15, thirstReduction: 5 },
    "baked potato": { hungerReduction: 20, thirstReduction: 0 },
    // Stews and soups - very high satiety + some hydration
    "beef stew": { hungerReduction: 55, thirstReduction: 20 },
    "venison stew": { hungerReduction: 50, thirstReduction: 20 },
    "vegetable soup": { hungerReduction: 30, thirstReduction: 25 },
    "cabbage soup": { hungerReduction: 25, thirstReduction: 25 },
    "tomato soup": { hungerReduction: 25, thirstReduction: 25 },
    "horker stew": { hungerReduction: 55, thirstReduction: 20 },
    "apple cabbage stew": { hungerReduction: 35, thirstReduction: 20 },
    "elsweyr fondue": { hungerReduction: 45, thirstReduction: 10 },
    // Travel rations - designed for travel, very filling
    "travel rations": { hungerReduction: 60, thirstReduction: 0 },
    "rations": { hungerReduction: 60, thirstReduction: 0 },
    // Raw/uncooked - less effective
    "raw beef": { hungerReduction: 20, thirstReduction: 0 },
    "raw venison": { hungerReduction: 18, thirstReduction: 0 },
    "raw rabbit leg": { hungerReduction: 12, thirstReduction: 0 },
    // Eggs
    "chicken egg": { hungerReduction: 8, thirstReduction: 2 },
    "pine thrush egg": { hungerReduction: 6, thirstReduction: 2 },
    "rock warbler egg": { hungerReduction: 6, thirstReduction: 2 },
    // Special/exotic
    "long taffy treat": { hungerReduction: 10, thirstReduction: 0 },
    "honey": { hungerReduction: 8, thirstReduction: 0, fatigueReduction: 5 },
    "snowberries": { hungerReduction: 5, thirstReduction: 8 },
    "jazbay grapes": { hungerReduction: 5, thirstReduction: 10 },
    "juniper berries": { hungerReduction: 5, thirstReduction: 8 }
  };
  function getFoodNutrition(itemName) {
    const key = itemName.toLowerCase().trim();
    if (FOOD_NUTRITION[key]) {
      return FOOD_NUTRITION[key];
    }
    for (const [foodKey, nutrition] of Object.entries(FOOD_NUTRITION)) {
      if (key.includes(foodKey) || foodKey.includes(key)) {
        return nutrition;
      }
    }
    return { hungerReduction: 20, thirstReduction: 5 };
  }

  // services/equipment.ts
  var nameIncludes = (item, keywords) => {
    const n = (item.name || "").toLowerCase();
    return keywords.some((k) => n.includes(k));
  };
  var isTwoHandedWeapon = (item) => {
    if (!item || item.type !== "weapon") return false;
    const keywords = ["greatsword", "great sword", "two-handed", "two handed", "battleaxe", "battle axe", "warhammer", "longsword", "war axe", "great axe", "bow", "longbow", "halberd"];
    return nameIncludes(item, keywords);
  };
  var isSmallWeapon = (item) => {
    if (!item || item.type !== "weapon") return false;
    const keywords = ["dagger", "shortsword", "sword", "mace", "handaxe", "club", "knife", "stiletto"];
    if (isTwoHandedWeapon(item)) return false;
    return nameIncludes(item, keywords) || !!item.damage && (item.weight ?? 0) <= 8;
  };

  // services/vitals.ts
  var applyStatToVitals = (currentVitals, maxStats, stat, amount) => {
    const cv = {
      currentHealth: currentVitals?.currentHealth ?? maxStats.health,
      currentMagicka: currentVitals?.currentMagicka ?? maxStats.magicka,
      currentStamina: currentVitals?.currentStamina ?? maxStats.stamina
    };
    if (!Number.isFinite(amount) || amount <= 0) return { newVitals: cv, actual: 0 };
    if (stat === "health") {
      const actual2 = Math.min(amount, Math.max(0, maxStats.health - (cv.currentHealth || 0)));
      cv.currentHealth = Math.min(maxStats.health, (cv.currentHealth || 0) + actual2);
      return { newVitals: cv, actual: actual2 };
    }
    if (stat === "magicka") {
      const actual2 = Math.min(amount, Math.max(0, maxStats.magicka - (cv.currentMagicka || 0)));
      cv.currentMagicka = Math.min(maxStats.magicka, (cv.currentMagicka || 0) + actual2);
      return { newVitals: cv, actual: actual2 };
    }
    const actual = Math.min(amount, Math.max(0, maxStats.stamina - (cv.currentStamina || 0)));
    cv.currentStamina = Math.min(maxStats.stamina, (cv.currentStamina || 0) + actual);
    return { newVitals: cv, actual };
  };
  var modifyPlayerCombatStat = (playerStats, stat, amount) => {
    if (!["health", "magicka", "stamina"].includes(stat)) {
      console.error("[vitals] modifyPlayerStat invalid stat:", stat);
      return { newPlayerStats: playerStats, actual: 0 };
    }
    if (!Number.isFinite(amount) || amount <= 0) return { newPlayerStats: playerStats, actual: 0 };
    const currentVitals = {
      currentHealth: playerStats.currentHealth,
      currentMagicka: playerStats.currentMagicka,
      currentStamina: playerStats.currentStamina
    };
    const max = { health: playerStats.maxHealth, magicka: playerStats.maxMagicka, stamina: playerStats.maxStamina };
    const res = applyStatToVitals(currentVitals, max, stat, amount);
    const ns = { ...playerStats };
    ns.currentHealth = res.newVitals.currentHealth;
    ns.currentMagicka = res.newVitals.currentMagicka;
    ns.currentStamina = res.newVitals.currentStamina;
    return { newPlayerStats: ns, actual: res.actual };
  };

  // services/potionResolver.ts
  var resolvePotionEffect = (item) => {
    if (!item || item.type !== "potion") return { reason: "not_a_potion" };
    let stat;
    if (item.subtype === "health" || item.subtype === "magicka" || item.subtype === "stamina") {
      stat = item.subtype;
    } else {
      const name = (item.name || "").toLowerCase();
      const keywords = {
        health: ["health", "heal", "healing", "vitality", "hp"],
        magicka: ["magicka", "mana", "magick", "spell"],
        stamina: ["stamina", "endurance", "energy", "fatigue"]
      };
      const matches = [];
      Object.keys(keywords).forEach((s) => {
        for (const kw of keywords[s]) {
          if (name.includes(kw)) {
            matches.push(s);
            break;
          }
        }
      });
      if (matches.length === 1) {
        stat = matches[0];
      }
    }
    let amount = typeof item.damage === "number" ? item.damage : void 0;
    if (amount == null) {
      const text = ((item.description || "") + " " + (item.name || "")).toLowerCase();
      const m = text.match(/(-?\d+(?:\.\d+)?)/);
      if (m) {
        const parsed = Number(m[1]);
        if (!Number.isNaN(parsed)) amount = parsed;
      }
    }
    if (stat && typeof amount === "number") {
      const reason = item.subtype ? "explicit_subtype" : "inferred_from_name";
      return { stat, amount, reason };
    }
    if (stat && amount == null) {
      const name = (item.name || "").toLowerCase();
      if (name.includes("minor") || name.includes("small")) {
        amount = 25;
      } else if (name.includes("major") || name.includes("plentiful") || name.includes("grand")) {
        amount = 100;
      } else {
        amount = 50;
      }
      const reason = item.subtype ? "explicit_subtype_default_amount" : "inferred_default_amount";
      return { stat, amount, reason };
    }
    return { reason: stat ? "ambiguous_inference" : "no_inference" };
  };

  // services/storage.ts
  var memory = /* @__PURE__ */ new Map();
  var hasLocalStorage = (() => {
    try {
      return typeof globalThis !== "undefined" && typeof globalThis.localStorage === "object" && typeof globalThis.localStorage.getItem === "function";
    } catch (e) {
      return false;
    }
  })();
  var storage = {
    getItem(key) {
      if (hasLocalStorage) return globalThis.localStorage.getItem(key);
      return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
      if (hasLocalStorage) return globalThis.localStorage.setItem(key, value);
      memory.set(key, value);
    },
    removeItem(key) {
      if (hasLocalStorage) return globalThis.localStorage.removeItem(key);
      memory.delete(key);
    },
    _clearForTests() {
      memory.clear();
    }
  };

  // services/spells.ts
  var SPELL_REGISTRY = {
    flames: {
      id: "flames",
      name: "Flames",
      description: "A small jet of fire that deals ongoing damage.",
      cost: 15,
      perkCost: 1,
      type: "damage",
      damage: 15,
      effects: [{ type: "dot", stat: "health", value: 3, duration: 2 }]
    },
    ice_spike: {
      id: "ice_spike",
      name: "Ice Spike",
      description: "A focused spike of ice that deals cold damage and may slow.",
      cost: 25,
      perkCost: 2,
      type: "damage",
      damage: 25,
      effects: [{ type: "slow", amount: 20, duration: 2 }],
      prerequisites: { level: 10 }
    },
    healing: {
      id: "healing",
      name: "Healing",
      description: "Restore a moderate amount of health.",
      cost: 20,
      perkCost: 1,
      type: "heal",
      heal: 25
    },
    spark: {
      id: "spark",
      name: "Spark",
      description: "A small shock of lightning that deals modest damage.",
      cost: 10,
      perkCost: 1,
      type: "damage",
      damage: 8,
      effects: [{ type: "damage", stat: "health", value: 2 }]
    },
    fireball: {
      id: "fireball",
      name: "Fireball",
      description: "A powerful explosion of fire that hits multiple targets.",
      cost: 40,
      perkCost: 3,
      type: "damage",
      damage: 45,
      effects: [{ type: "dot", stat: "health", value: 6, duration: 3 }],
      prerequisites: { level: 12 }
    },
    frost_nova: {
      id: "frost_nova",
      name: "Frost Nova",
      description: "A chilling burst that damages and slows nearby enemies.",
      cost: 35,
      perkCost: 2,
      type: "debuff",
      damage: 20,
      effects: [{ type: "slow", amount: 30, duration: 3 }],
      prerequisites: { level: 8 }
    },
    lightning_bolt: {
      id: "lightning_bolt",
      name: "Lightning Bolt",
      description: "A concentrated bolt of lightning that pierces armor.",
      cost: 30,
      perkCost: 2,
      type: "damage",
      damage: 30,
      effects: [{ type: "stun", duration: 1 }]
    },
    chain_lightning: {
      id: "chain_lightning",
      name: "Chain Lightning",
      description: "Lightning that arcs between multiple foes.",
      cost: 50,
      perkCost: 4,
      type: "damage",
      damage: 55,
      effects: [{ type: "damage", stat: "health", value: 10 }],
      prerequisites: { level: 18 }
    },
    summon_skeleton: {
      id: "summon_skeleton",
      name: "Summon Skeleton",
      description: "Summons a skeletal minion to fight for you.",
      cost: 40,
      perkCost: 3,
      type: "utility",
      effects: [{ type: "summon", name: "Skeleton", duration: 3 }],
      prerequisites: { level: 10 }
    },
    summon_familiar: {
      id: "summon_familiar",
      name: "Conjure Familiar",
      description: "Summons a ghostly wolf familiar to aid you in combat.",
      cost: 30,
      perkCost: 2,
      type: "utility",
      effects: [{ type: "summon", name: "Spectral Wolf", duration: 3 }],
      prerequisites: { level: 5 }
    },
    summon_flame_atronach: {
      id: "summon_flame_atronach",
      name: "Conjure Flame Atronach",
      description: "Summons a Flame Atronach that attacks enemies with fire.",
      cost: 60,
      perkCost: 4,
      type: "utility",
      effects: [{ type: "summon", name: "Flame Atronach", duration: 4 }],
      prerequisites: { level: 15 }
    },
    summon_frost_atronach: {
      id: "summon_frost_atronach",
      name: "Conjure Frost Atronach",
      description: "Summons a powerful Frost Atronach to tank and deal cold damage.",
      cost: 75,
      perkCost: 5,
      type: "utility",
      effects: [{ type: "summon", name: "Frost Atronach", duration: 4 }],
      prerequisites: { level: 20 }
    },
    summon_storm_atronach: {
      id: "summon_storm_atronach",
      name: "Conjure Storm Atronach",
      description: "Summons a devastating Storm Atronach crackling with lightning.",
      cost: 90,
      perkCost: 6,
      type: "utility",
      effects: [{ type: "summon", name: "Storm Atronach", duration: 4 }],
      prerequisites: { level: 25 }
    },
    summon_dremora: {
      id: "summon_dremora",
      name: "Conjure Dremora Lord",
      description: "Summons a powerful Dremora warrior from Oblivion to fight for you.",
      cost: 100,
      perkCost: 7,
      type: "utility",
      effects: [{ type: "summon", name: "Dremora Lord", duration: 5 }],
      prerequisites: { level: 30 }
    },
    summon_wolf: {
      id: "summon_wolf",
      name: "Call of the Wild: Wolf",
      description: "Calls a wild wolf to aid you in battle.",
      cost: 35,
      perkCost: 2,
      type: "utility",
      effects: [{ type: "summon", name: "Wild Wolf", duration: 3 }],
      prerequisites: { level: 8 }
    },
    summon_bear: {
      id: "summon_bear",
      name: "Call of the Wild: Bear",
      description: "Summons a fearsome cave bear to fight alongside you.",
      cost: 55,
      perkCost: 4,
      type: "utility",
      effects: [{ type: "summon", name: "Cave Bear", duration: 3 }],
      prerequisites: { level: 18 }
    },
    summon_sabre_cat: {
      id: "summon_sabre_cat",
      name: "Call of the Wild: Sabre Cat",
      description: "Summons a deadly sabre cat to hunt your enemies.",
      cost: 50,
      perkCost: 3,
      type: "utility",
      effects: [{ type: "summon", name: "Sabre Cat", duration: 3 }],
      prerequisites: { level: 14 }
    },
    summon_spriggan: {
      id: "summon_spriggan",
      name: "Conjure Spriggan",
      description: "Summons a nature spirit that heals allies and attacks foes.",
      cost: 65,
      perkCost: 4,
      type: "utility",
      effects: [{ type: "summon", name: "Spriggan", duration: 4 }],
      prerequisites: { level: 16 }
    },
    summon_wrathman: {
      id: "summon_wrathman",
      name: "Conjure Wrathman",
      description: "Summons an ancient Nord spirit warrior to battle for you.",
      cost: 85,
      perkCost: 5,
      type: "utility",
      effects: [{ type: "summon", name: "Wrathman", duration: 4 }],
      prerequisites: { level: 22 }
    },
    invisibility: {
      id: "invisibility",
      name: "Invisibility",
      description: "Become unseen for a short duration.",
      cost: 60,
      perkCost: 5,
      type: "utility",
      effects: [{ type: "buff", stat: "stealth", amount: 100, duration: 8 }],
      prerequisites: { level: 20 }
    },
    slow: {
      id: "slow",
      name: "Slow",
      description: "Reduces target movement speed considerably.",
      cost: 18,
      perkCost: 1,
      type: "debuff",
      effects: [{ type: "slow", amount: 40, duration: 4 }]
    },
    heal_major: {
      id: "heal_major",
      name: "Heal Major",
      description: "Restores a large amount of health to the caster or an ally.",
      cost: 45,
      perkCost: 3,
      type: "heal",
      heal: 60,
      prerequisites: { level: 15 }
    },
    // Aeonic Surge family: hybrid AoE attack + heal (magical school: AeO)
    aeonic_pulse: {
      id: "aeonic_pulse",
      name: "Aeonic Pulse",
      description: "A focused pulse of aeonic energy \u2014 lesser AoE heal + damage.",
      cost: 38,
      perkCost: 2,
      type: "damage",
      effects: [{ type: "aoe_damage", value: 10, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 8, aoeTarget: "all_allies" }],
      prerequisites: { level: 8 }
    },
    aeonic_surge: {
      id: "aeonic_surge",
      name: "Aeonic Surge",
      description: "Unleash a pulse of aeonic energy that wounds nearby foes while restoring allies.",
      cost: 45,
      perkCost: 3,
      type: "damage",
      effects: [{ type: "aoe_damage", value: 18, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 14, aoeTarget: "all_allies" }],
      prerequisites: { level: 12 }
    },
    aeonic_wave: {
      id: "aeonic_wave",
      name: "Aeonic Wave",
      description: "A sweeping wave of aeonic energy \u2014 powerful and costly.",
      cost: 60,
      perkCost: 6,
      type: "damage",
      effects: [{ type: "aoe_damage", value: 26, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 22, aoeTarget: "all_allies" }],
      prerequisites: { level: 18 }
    }
  };
  var STORAGE_PREFIX = "aetherius:spells:";
  var getSpellById = (id) => {
    if (!id) return void 0;
    const parts = id.split(/[:_]/);
    if (parts.length > 1 && (parts[1] === "high" || parts[1] === "empowered")) {
      const baseId = parts[0];
      const base = SPELL_REGISTRY[baseId];
      if (!base) return void 0;
      const scale = 1.5;
      const boosted = {
        ...base,
        id,
        name: `${base.name} (Empowered)`,
        description: `${base.description} (Empowered variant: increased potency.)`,
        cost: Math.max(1, Math.floor((base.cost || 0) * scale)),
        // Empowered variants require a larger perk investment
        perkCost: 10,
        damage: base.damage ? Math.max(1, Math.floor(base.damage * scale)) : base.damage,
        heal: base.heal ? Math.max(1, Math.floor(base.heal * scale)) : base.heal
      };
      return boosted;
    }
    return SPELL_REGISTRY[id];
  };
  var getLearnedSpellIds = (characterId) => {
    try {
      const raw = storage.getItem(`${STORAGE_PREFIX}${characterId}`);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch (e) {
      try {
        (init_logger(), __toCommonJS(logger_exports)).log.warn("Failed to read learned spells", e);
      } catch (e2) {
      }
      return [];
    }
  };
  var createAbilityFromSpell = (spellId) => {
    const s = getSpellById(spellId);
    if (!s) return null;
    return {
      id: `spell_${s.id}`,
      spellId: s.id,
      name: s.name,
      type: "magic",
      damage: s.damage || 0,
      heal: s.heal || 0,
      cost: s.cost,
      effects: s.effects || [],
      description: s.description,
      spellType: s.type
    };
  };

  // data/perkDefinitions.ts
  var PERK_DEFINITIONS = [
    // === STAT PERKS (Health, Magicka, Stamina) ===
    { id: "toughness", name: "Toughness", skill: "Health", description: "Increase max health by 10 per rank.", maxRank: 9, masteryCost: 3, effect: { type: "stat", key: "health", amount: 10 } },
    { id: "vitality", name: "Vitality", skill: "Health", description: "Increase max health by 20 per rank.", requires: ["toughness:2"], maxRank: 8, masteryCost: 3, effect: { type: "stat", key: "health", amount: 20 } },
    { id: "arcane_focus", name: "Arcane Focus", skill: "Magicka", description: "Increase max magicka by 10 per rank.", maxRank: 9, masteryCost: 3, effect: { type: "stat", key: "magicka", amount: 10 } },
    { id: "mana_mastery", name: "Mana Mastery", skill: "Magicka", description: "Increase max magicka by 20 per rank.", requires: ["arcane_focus:2"], maxRank: 8, masteryCost: 4, effect: { type: "stat", key: "magicka", amount: 20 } },
    { id: "endurance", name: "Endurance", skill: "Stamina", description: "Increase max stamina by 10 per rank.", maxRank: 9, masteryCost: 3, effect: { type: "stat", key: "stamina", amount: 10 } },
    { id: "fleet_foot", name: "Fleet Foot", skill: "Stamina", description: "Increase max stamina by 15 per rank.", requires: ["endurance:2"], maxRank: 8, masteryCost: 3, effect: { type: "stat", key: "stamina", amount: 15 } },
    // === LUCK & UTILITY PERKS ===
    { id: "reroll_on_failure", name: "Lucky Strike", skill: "Luck", description: "When an attack critically fails, automatically reroll the attack once (passive).", maxRank: 1, masteryCost: 2 },
    // === REGENERATION PERKS (unlock at level 10+) ===
    { id: "health_regen", name: "Health Regeneration", skill: "Restoration", description: "Passively regenerate health during combat. Each rank increases regen rate by 25%. Requires level 10.", requires: ["level:10"], maxRank: 5, masteryCost: 2 },
    { id: "magicka_regen", name: "Magicka Regeneration", skill: "Restoration", description: "Passively regenerate magicka during combat. Each rank increases regen rate by 25%. Requires level 10.", requires: ["level:10"], maxRank: 5, masteryCost: 2 },
    { id: "stamina_regen", name: "Stamina Regeneration", skill: "Restoration", description: "Passively regenerate stamina during combat. Each rank increases regen rate by 25%. Requires level 10.", requires: ["level:10"], maxRank: 5, masteryCost: 2 },
    // === COMBAT PERKS - ONE-HANDED ===
    { id: "armsman", name: "Armsman", skill: "One-Handed", description: "Increases one-handed weapon damage by 10% per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "oneHandedDamage", amount: 10 } },
    { id: "fighting_stance", name: "Fighting Stance", skill: "One-Handed", description: "Power attacks with one-handed weapons cost 15% less stamina per rank.", requires: ["armsman:2"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "oneHandedStaminaCost", amount: -15 } },
    { id: "dual_flurry", name: "Dual Flurry", skill: "One-Handed", description: "When dual wielding, gain +8% attack speed per rank.", requires: ["armsman:3"], maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "dualWieldSpeed", amount: 8 } },
    { id: "dual_savagery", name: "Dual Savagery", skill: "One-Handed", description: "Dual wielding power attacks deal 25% bonus damage per rank.", requires: ["dual_flurry:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "dualWieldPowerAttack", amount: 25 } },
    { id: "bladesman", name: "Bladesman", skill: "One-Handed", description: "Critical hits with swords deal 15% more damage per rank.", requires: ["armsman:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "swordCritDamage", amount: 15 } },
    { id: "bone_breaker", name: "Bone Breaker", skill: "One-Handed", description: "Maces ignore 15% of armor per rank.", requires: ["armsman:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "maceArmorPen", amount: 15 } },
    { id: "hack_and_slash", name: "Hack and Slash", skill: "One-Handed", description: "Axes have 10% chance per rank to cause bleeding (5 damage/turn for 3 turns).", requires: ["armsman:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "axeBleed", amount: 10 } },
    // === UNARMED (new) ===
    { id: "unarmed_mastery", name: "Unarmed Mastery", skill: "Unarmed", description: "Unlocks the Unarmed Strike ability and increases unarmed damage by 8% per rank.", requires: [], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "unarmedDamage", amount: 8 } },
    // === COMBAT PERKS - TWO-HANDED ===
    { id: "barbarian", name: "Barbarian", skill: "Two-Handed", description: "Increases two-handed weapon damage by 12% per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "twoHandedDamage", amount: 12 } },
    { id: "champions_stance", name: "Champion's Stance", skill: "Two-Handed", description: "Power attacks with two-handed weapons cost 15% less stamina per rank.", requires: ["barbarian:2"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "twoHandedStaminaCost", amount: -15 } },
    { id: "deep_wounds", name: "Deep Wounds", skill: "Two-Handed", description: "Critical hits with greatswords deal 20% more damage per rank.", requires: ["barbarian:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "greatswordCritDamage", amount: 20 } },
    { id: "skull_crusher", name: "Skull Crusher", skill: "Two-Handed", description: "Warhammers ignore 20% of armor per rank.", requires: ["barbarian:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "warhammerArmorPen", amount: 20 } },
    { id: "limbsplitter", name: "Limbsplitter", skill: "Two-Handed", description: "Battleaxes have 15% chance per rank to cause bleeding (7 damage/turn for 3 turns).", requires: ["barbarian:3"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "battleaxeBleed", amount: 15 } },
    { id: "devastating_blow", name: "Devastating Blow", skill: "Two-Handed", description: "Standing power attacks have 15% chance per rank to decapitate (instant kill on low health enemies).", requires: ["barbarian:5", "champions_stance:2"], maxRank: 2, masteryCost: 4, effect: { type: "combat", key: "decapitate", amount: 15 } },
    // === COMBAT PERKS - BLOCK ===
    { id: "shield_wall", name: "Shield Wall", skill: "Block", description: "Blocking is 10% more effective per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "blockEffectiveness", amount: 10 } },
    { id: "deflect_arrows", name: "Deflect Arrows", skill: "Block", description: "Arrows that hit your shield do no damage.", requires: ["shield_wall:2"], maxRank: 1, masteryCost: 2 },
    { id: "elemental_protection", name: "Elemental Protection", skill: "Block", description: "Blocking with a shield reduces incoming fire, frost, and shock damage by 25% per rank.", requires: ["shield_wall:3"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "elementalBlock", amount: 25 } },
    { id: "power_bash", name: "Power Bash", skill: "Block", description: "Shield bash can be held to deliver a more powerful strike with 20% stun chance per rank.", requires: ["shield_wall:2"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "bashStun", amount: 20 } },
    { id: "deadly_bash", name: "Deadly Bash", skill: "Block", description: "Shield bashing does 5x more damage per rank.", requires: ["power_bash:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "bashDamage", amount: 500 } },
    { id: "disarming_bash", name: "Disarming Bash", skill: "Block", description: "Shield bash has 15% chance per rank to disarm opponents.", requires: ["power_bash:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "bashDisarm", amount: 15 } },
    // Defensive guard mastery: increases Defensive/Guard duration up to 3 rounds
    { id: "tactical_guard_mastery", name: "Tactical Guard Mastery", skill: "Block", description: "Increases the duration of Tactical Guard by +1 round per rank (max +2), allowing Guard to last up to 3 rounds.", requires: ["shield_wall:1"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "defendDuration", amount: 1 } },
    // AoE physical unlock perks
    { id: "whirlwind_mastery", name: "Whirlwind Mastery", skill: "Combat", description: "Unlocks Whirlwind Attack (AoE physical) even without the high Two/One-Handed skill thresholds.", maxRank: 1, masteryCost: 3 },
    { id: "cleaving_mastery", name: "Cleaving Mastery", skill: "Combat", description: "Unlocks Cleaving Strike (AoE two-handed cleave) even without the high Two-Handed skill threshold.", maxRank: 1, masteryCost: 3 },
    // === COMBAT PERKS - ARCHERY ===
    { id: "overdraw", name: "Overdraw", skill: "Archery", description: "Increases bow damage by 12% per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "bowDamage", amount: 12 } },
    { id: "eagle_eye", name: "Eagle Eye", skill: "Archery", description: "Increases critical hit chance with bows by 5% per rank.", requires: ["overdraw:2"], maxRank: 4, masteryCost: 2, effect: { type: "combat", key: "bowCritChance", amount: 5 } },
    { id: "steady_hand", name: "Steady Hand", skill: "Archery", description: "Reduces stamina cost for bows by 15% per rank.", requires: ["overdraw:2"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "bowStaminaCost", amount: -15 } },
    { id: "power_shot", name: "Power Shot", skill: "Archery", description: "Arrows have 25% chance per rank to stagger enemies.", requires: ["eagle_eye:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "arrowStagger", amount: 25 } },
    { id: "quick_shot", name: "Quick Shot", skill: "Archery", description: "Can draw bow 15% faster per rank.", requires: ["steady_hand:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "bowSpeed", amount: 15 } },
    { id: "hunters_discipline", name: "Hunter's Discipline", skill: "Archery", description: "50% chance per rank to recover arrows from dead bodies.", requires: ["overdraw:3"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "arrowRecovery", amount: 50 } },
    // === COMBAT PERKS - LIGHT ARMOR ===
    { id: "agile_defender", name: "Agile Defender", skill: "Light Armor", description: "Increases light armor rating by 10% per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "lightArmorRating", amount: 10 } },
    { id: "custom_fit", name: "Custom Fit", skill: "Light Armor", description: "Wearing a matched set of light armor grants +10% armor bonus per rank.", requires: ["agile_defender:2"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "lightArmorSetBonus", amount: 10 } },
    { id: "unhindered", name: "Unhindered", skill: "Light Armor", description: "Light armor weighs nothing and doesn't slow you down.", requires: ["custom_fit:1"], maxRank: 1, masteryCost: 2 },
    { id: "wind_walker", name: "Wind Walker", skill: "Light Armor", description: "Stamina regenerates 25% faster per rank while wearing light armor.", requires: ["agile_defender:3"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "lightArmorStaminaRegen", amount: 25 } },
    { id: "deft_movement", name: "Deft Movement", skill: "Light Armor", description: "10% chance per rank to dodge melee attacks while wearing light armor.", requires: ["wind_walker:1"], maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "dodgeChance", amount: 10 } },
    // === COMBAT PERKS - HEAVY ARMOR ===
    { id: "juggernaut", name: "Juggernaut", skill: "Heavy Armor", description: "Increases heavy armor rating by 12% per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "heavyArmorRating", amount: 12 } },
    { id: "well_fitted", name: "Well Fitted", skill: "Heavy Armor", description: "Wearing a matched set of heavy armor grants +15% armor bonus per rank.", requires: ["juggernaut:2"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "heavyArmorSetBonus", amount: 15 } },
    { id: "tower_of_strength", name: "Tower of Strength", skill: "Heavy Armor", description: "25% less stagger per rank when wearing heavy armor.", requires: ["juggernaut:3"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "staggerResist", amount: 25 } },
    { id: "conditioning", name: "Conditioning", skill: "Heavy Armor", description: "Heavy armor weighs nothing and doesn't slow you down.", requires: ["well_fitted:1"], maxRank: 1, masteryCost: 3 },
    { id: "reflect_blows", name: "Reflect Blows", skill: "Heavy Armor", description: "10% chance per rank to reflect melee damage back to attacker.", requires: ["tower_of_strength:2"], maxRank: 2, masteryCost: 4, effect: { type: "combat", key: "reflectDamage", amount: 10 } },
    // === COMBAT PERKS - DESTRUCTION ===
    { id: "destruction_novice", name: "Novice Destruction", skill: "Destruction", description: "Novice-level destruction spells cost 25% less magicka per rank.", maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "noviceDestructionCost", amount: -25 } },
    { id: "augmented_flames", name: "Augmented Flames", skill: "Destruction", description: "Fire spells deal 15% more damage per rank.", requires: ["destruction_novice:1"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "fireDamage", amount: 15 } },
    { id: "augmented_frost", name: "Augmented Frost", skill: "Destruction", description: "Frost spells deal 15% more damage per rank.", requires: ["destruction_novice:1"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "frostDamage", amount: 15 } },
    { id: "augmented_shock", name: "Augmented Shock", skill: "Destruction", description: "Shock spells deal 15% more damage per rank.", requires: ["destruction_novice:1"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "shockDamage", amount: 15 } },
    { id: "intense_flames", name: "Intense Flames", skill: "Destruction", description: "Fire spells have 15% chance per rank to cause fear in targets below 20% health.", requires: ["augmented_flames:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "fireFear", amount: 15 } },
    { id: "deep_freeze", name: "Deep Freeze", skill: "Destruction", description: "Frost spells have 15% chance per rank to paralyze targets below 20% health.", requires: ["augmented_frost:2"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "frostParalyze", amount: 15 } },
    { id: "disintegrate", name: "Disintegrate", skill: "Destruction", description: "Shock spells have 15% chance per rank to instantly kill targets below 15% health.", requires: ["augmented_shock:2"], maxRank: 2, masteryCost: 4, effect: { type: "combat", key: "shockDisintegrate", amount: 15 } },
    // === COMBAT PERKS - RESTORATION ===
    { id: "restoration_novice", name: "Novice Restoration", skill: "Restoration", description: "Novice-level restoration spells cost 25% less magicka per rank.", maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "noviceRestorationCost", amount: -25 } },
    { id: "regeneration", name: "Regeneration", skill: "Restoration", description: "Healing spells are 25% more effective per rank.", requires: ["restoration_novice:1"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "healingEffectiveness", amount: 25 } },
    { id: "recovery", name: "Recovery", skill: "Restoration", description: "Magicka regenerates 15% faster per rank.", requires: ["restoration_novice:1"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "magickaRegenBonus", amount: 15 } },
    { id: "avoid_death", name: "Avoid Death", skill: "Restoration", description: "Once per combat, when health drops below 10%, automatically heal 50 health per rank.", requires: ["recovery:2", "regeneration:2"], maxRank: 2, masteryCost: 4, effect: { type: "combat", key: "avoidDeath", amount: 50 } },
    // === COMBAT PERKS - CONJURATION ===
    { id: "conjuration_novice", name: "Novice Conjuration", skill: "Conjuration", description: "Novice-level conjuration spells cost 25% less magicka per rank.", maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "noviceConjurationCost", amount: -25 } },
    { id: "summoner", name: "Summoner", skill: "Conjuration", description: "Summoned creatures have 15% more health per rank.", requires: ["conjuration_novice:1"], maxRank: 3, masteryCost: 2, effect: { type: "combat", key: "summonHealth", amount: 15 } },
    { id: "atromancy", name: "Atromancy", skill: "Conjuration", description: "Summoned Atronachs last 25% longer per rank.", requires: ["summoner:2"], maxRank: 2, masteryCost: 2, effect: { type: "combat", key: "atronachDuration", amount: 25 } },
    { id: "twin_souls", name: "Twin Souls", skill: "Conjuration", description: "Can summon an additional creature per rank (up to 3 total when fully ranked).", requires: ["atromancy:2", "summoner:3"], maxRank: 2, masteryCost: 4 },
    // === COMBAT PERKS - SNEAK ===
    { id: "stealth", name: "Stealth", skill: "Sneak", description: "You are 15% harder to detect per rank.", maxRank: 5, masteryCost: 2, effect: { type: "combat", key: "sneakBonus", amount: 15 } },
    { id: "backstab", name: "Backstab", skill: "Sneak", description: "Sneak attacks with one-handed weapons deal 3x damage (per rank: +1x).", requires: ["stealth:2"], maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "backstabMultiplier", amount: 100 } },
    { id: "deadly_aim", name: "Deadly Aim", skill: "Sneak", description: "Sneak attacks with bows deal 2x damage (per rank: +1x).", requires: ["stealth:2"], maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "sneakBowMultiplier", amount: 100 } },
    { id: "assassins_blade", name: "Assassin's Blade", skill: "Sneak", description: "Sneak attacks with daggers deal 15x damage.", requires: ["backstab:3"], maxRank: 1, masteryCost: 4, effect: { type: "combat", key: "daggerSneakMultiplier", amount: 1500 } },
    { id: "shadow_warrior", name: "Shadow Warrior", skill: "Sneak", description: "15% chance per rank to enter stealth mid-combat when crouching.", requires: ["stealth:5"], maxRank: 2, masteryCost: 4, effect: { type: "combat", key: "combatStealth", amount: 15 } },
    // === SPECIAL PERKS ===
    { id: "berserker_rage", name: "Berserker Rage", skill: "Combat", description: "When below 25% health, deal 20% more damage per rank.", maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "lowHealthDamage", amount: 20 } },
    { id: "vampiric_strikes", name: "Vampiric Strikes", skill: "Combat", description: "Melee attacks restore 3% of damage dealt as health per rank.", requires: ["level:15"], maxRank: 3, masteryCost: 3, effect: { type: "combat", key: "lifesteal", amount: 3 } },
    { id: "executioner", name: "Executioner", skill: "Combat", description: "Attacks against enemies below 20% health deal 25% more damage per rank.", requires: ["level:10"], maxRank: 2, masteryCost: 3, effect: { type: "combat", key: "executeDamage", amount: 25 } },
    { id: "dragon_skin", name: "Dragon Skin", skill: "Combat", description: "Take 5% less damage from all sources per rank.", requires: ["level:20"], maxRank: 3, masteryCost: 4, effect: { type: "combat", key: "damageReduction", amount: 5 } }
  ];

  // featureFlags.ts
  var ADMIN_UIDS = [
    "42VwiqAFNpfzUYHjFj992gEdxCz1"
    // Add your Firebase UID here, e.g.:
    // 'abc123xyz456',
  ];
  var currentUserId = null;
  var isAdmin = () => {
    return currentUserId !== null && ADMIN_UIDS.includes(currentUserId);
  };
  var FEATURES = {
    // === CORE FEATURES ===
    shop: { enabled: true, wip: false },
    survival: { enabled: true, wip: false },
    adventure: { enabled: true, wip: false },
    story: { enabled: true, wip: false },
    journal: { enabled: true, wip: false },
    quests: { enabled: true, wip: false },
    inventory: { enabled: true, wip: false },
    // === PROGRESSION ===
    timeProgression: { enabled: true, wip: false },
    needsSystem: { enabled: true, wip: false },
    restSystem: { enabled: true, wip: false },
    campingGear: { enabled: true, wip: false },
    // === AI FEATURES ===
    aiScribe: { enabled: true, wip: false },
    aiCharacterGeneration: { enabled: true, wip: false },
    aiProfileImage: { enabled: false, wip: false },
    gemmaModels: { enabled: true, wip: false },
    // === CHARACTER MANAGEMENT ===
    characterDeath: { enabled: true, wip: false },
    profileDeletion: { enabled: true, wip: false },
    characterDeletion: { enabled: true, wip: false },
    maxStatsEditor: { enabled: true, wip: false },
    // Hide max stats editor by default
    // === UI/UX ===
    onboarding: { enabled: true, wip: false },
    snowEffect: { enabled: true, wip: false, label: "Coming Soon" },
    exportPDF: { enabled: true, wip: false, label: "Coming Soon" },
    photoUpload: { enabled: false, wip: false },
    multiplayerPresence: { enabled: false, wip: true, label: "Experimental" },
    // === ADMIN ONLY (only visible when logged in as admin) ===
    debugPanel: { enabled: true, wip: false, adminOnly: true },
    testFeatures: { enabled: true, wip: false, adminOnly: true },
    adminTools: { enabled: true, wip: false, adminOnly: true },
    // Combat Features
    enableUnarmedCombat: { enabled: true, wip: false, label: "Unarmed Strike" }
  };
  var isFeatureEnabled = (feature) => {
    const f = FEATURES[feature];
    if (!f) return false;
    if (f.adminOnly && !isAdmin()) return false;
    return f.enabled;
  };

  // services/combatService.ts
  var getCombatPerkBonus = (character, effectKey) => {
    if (!character || !character.perks) return 0;
    let totalBonus = 0;
    for (const perk of character.perks) {
      const def = PERK_DEFINITIONS.find((d) => d.id === perk.id);
      if (def && def.effect && def.effect.type === "combat" && def.effect.key === effectKey) {
        const rank = perk.rank || 1;
        totalBonus += def.effect.amount * rank;
      }
    }
    return totalBonus;
  };
  var getStatPerkBonus = (character, statKey) => {
    if (!character || !character.perks) return 0;
    let totalBonus = 0;
    for (const perk of character.perks) {
      const def = PERK_DEFINITIONS.find((d) => d.id === perk.id);
      if (def && def.effect && def.effect.type === "stat" && def.effect.key === statKey) {
        const rank = perk.rank || 1;
        totalBonus += def.effect.amount * rank;
      }
    }
    return totalBonus;
  };
  var hasPerk = (character, perkId) => {
    if (!character || !character.perks) return false;
    return character.perks.some((p) => p.id === perkId && (p.rank || 0) >= 1);
  };
  var getPerkRank = (character, perkId) => {
    if (!character || !character.perks) return 0;
    const perk = character.perks.find((p) => p.id === perkId);
    return perk?.rank || 0;
  };
  var ENEMY_NAME_PREFIXES = {
    bandit: ["Savage", "Ruthless", "Desperate", "Scarred", "One-Eyed", "Grizzled", "Sneering", "Bloodthirsty", "Cunning", "Vicious"],
    bandit_chief: ["Chief", "Boss", "Warlord", "Captain", "Leader", "Scourge", "Terror of"],
    wolf: ["Grey", "White", "Black", "Timber", "Dire", "Frost", "Starving", "Alpha", "Rabid", "Wild"],
    skeleton: ["Ancient", "Shambling", "Cursed", "Corrupted", "Risen", "Bound", "Restless", "Decrepit"],
    draugr: ["Ancient", "Restless", "Cursed", "Dread", "Wight", "Scourge", "Death", "Frost-Touched"],
    frost_spider: ["Giant", "Venomous", "Frost", "Albino", "Corrupted", "Nest Guardian", "Broodmother"],
    troll: ["Cave", "Frost", "Unyielding", "Massive", "Rampaging", "Savage", "Ancient"],
    bear: ["Cave", "Snow", "Raging", "Wounded", "Massive", "Territorial", "Starving"],
    sabre_cat: ["Snowy", "Vale", "Frost", "Prowling", "Hunting", "Alpha", "Scarred"],
    vampire: ["Ancient", "Feral", "Blood-Starved", "Noble", "Thrall", "Master", "Corrupted"],
    mage: ["Rogue", "Corrupt", "Apostate", "Flame", "Frost", "Storm", "Necromancer"],
    default: ["Fierce", "Deadly", "Dangerous", "Menacing", "Threatening"]
  };
  var ENEMY_PERSONALITY_TRAITS = [
    "battle-scarred",
    "cunning",
    "reckless",
    "cautious",
    "vengeful",
    "hungry",
    "territorial",
    "desperate",
    "confident",
    "fearless"
  ];
  var randomRange = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  var randomVariation = (base, variance) => Math.floor(base * (1 + (Math.random() - 0.5) * 2 * variance));
  var randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  var shuffleArray = (arr) => {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  var looksLikeAnimal = (name) => /wolf|hound|dog|bear|sabre|saber|horse|fox|warg|sabrecat|cat/i.test((name || "").toLowerCase());
  var pushCombatLogUnique = (state, entry) => {
    state.combatLog = state.combatLog || [];
    const last = state.combatLog[state.combatLog.length - 1];
    try {
      if (entry.nat !== void 0) console.debug && console.debug("[combatService] pushCombatLogUnique adding roll entry", { entry });
    } catch (e) {
    }
    if (!last) {
      if (!entry.id) entry.id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      state.combatLog.push(entry);
      return;
    }
    const sameTurn = last.turn === entry.turn;
    const sameActor = last.actor === entry.actor;
    const sameAction = last.action === entry.action;
    const sameTarget = (last.target || "") === (entry.target || "");
    const sameDamage = last.damage === void 0 && entry.damage === void 0 || last.damage === entry.damage;
    if (sameTurn && sameActor && sameAction && sameTarget && sameDamage && last.narrative === entry.narrative) {
      ensureLogEntryHasId(last);
      last.timestamp = entry.timestamp || Date.now();
      return;
    }
    if (sameTurn && sameActor && sameAction && sameTarget && sameDamage) {
      try {
        const a = (last.narrative || "").trim();
        const b = (entry.narrative || "").trim();
        if (a && b && (a.includes(b) || b.includes(a))) {
          last.narrative = a.length >= b.length ? a : b;
          last.timestamp = entry.timestamp || Date.now();
          last.nat = last.nat ?? entry.nat;
          last.isCrit = last.isCrit ?? entry.isCrit;
          last.rollTier = last.rollTier ?? entry.rollTier;
          ensureLogEntryHasId(last);
          return;
        }
      } catch (e) {
      }
    }
    const _uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    if (!entry.id) entry.id = _uid();
    state.combatLog.push(entry);
  };
  var ensureLogEntryHasId = (entry) => {
    if (!entry.id) entry.id = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  };
  var rollDice = (count, sides) => {
    const rolls = [];
    for (let i = 0; i < count; i++) rolls.push(Math.floor(Math.random() * sides) + 1);
    return { total: rolls.reduce((s, r) => s + r, 0), rolls };
  };
  var resolveAttack = (opts) => {
    const { natRoll } = opts;
    const d20 = natRoll && natRoll >= 1 && natRoll <= 20 ? { rolls: [natRoll] } : rollDice(1, 20);
    const nat = d20.rolls[0];
    if (nat === 1) return { hit: false, isCrit: false, natRoll: nat, rollTier: "fail" };
    if (nat >= 2 && nat <= 4) return { hit: false, isCrit: false, natRoll: nat, rollTier: "miss" };
    if (nat === 7) return { hit: true, isCrit: true, natRoll: nat, rollTier: "crit" };
    if (nat >= 5 && nat <= 9) return { hit: true, isCrit: false, natRoll: nat, rollTier: "low" };
    if (nat >= 10 && nat <= 14) return { hit: true, isCrit: false, natRoll: nat, rollTier: "mid" };
    if (nat >= 15 && nat <= 19) return { hit: true, isCrit: false, natRoll: nat, rollTier: "high" };
    return { hit: true, isCrit: true, natRoll: nat, rollTier: "crit" };
  };
  var computeDamageFromNat = (baseDamage, attackerLevel, natRoll, rollTier, isCrit) => {
    const levelBonus = Math.floor(attackerLevel * 0.2);
    const base = Math.max(1, Math.floor(baseDamage + levelBonus));
    const tierMultipliers = {
      fail: 0,
      miss: 0,
      low: 0.75,
      mid: 1,
      high: 1.25,
      crit: 1.75
    };
    const tierMult = tierMultipliers[rollTier] ?? 1;
    const critExtra = isCrit ? 1.15 : 1;
    const raw = Math.floor(base * tierMult * critExtra);
    const damage = Math.max(0, raw);
    const locs = ["torso", "arm", "leg", "head"];
    const hitLocation = locs[natRoll % locs.length];
    try {
      console.debug("[combat] computeDamageFromNat", { natRoll, rollTier, baseDamage, attackerLevel, base, tierMult, isCrit, critExtra, damage });
    } catch (e) {
    }
    return { damage, hitLocation };
  };
  var normalizeSummonedCompanions = (state) => {
    const newState = { ...state };
    if (!newState.enemies || newState.enemies.length === 0) return newState;
    const misclassified = (newState.enemies || []).filter((e) => e.isCompanion);
    if (misclassified.length === 0) return newState;
    newState.enemies = (newState.enemies || []).filter((e) => !e.isCompanion);
    newState.allies = [...newState.allies || [], ...misclassified.map((m) => ({ ...m, companionMeta: m.companionMeta || { companionId: m.id, autoLoot: false, autoControl: true } }))];
    const playerIndex = newState.turnOrder.indexOf("player");
    for (const m of misclassified) {
      if (!newState.turnOrder.includes(m.id)) {
        if (playerIndex >= 0) {
          const before = newState.turnOrder.slice(0, playerIndex + 1);
          const after = newState.turnOrder.slice(playerIndex + 1);
          newState.turnOrder = [...before, m.id, ...after];
        } else {
          newState.turnOrder = [...newState.turnOrder, m.id];
        }
      }
    }
    return newState;
  };
  var combatHasActiveSummon = (state) => {
    if (!state) return false;
    const aliveSummons = (state.allies || []).concat(state.enemies || []).some((a) => !!a.companionMeta?.isSummon && (a.currentHealth || 0) > 0);
    const pending = (state.pendingSummons || []).length > 0;
    return aliveSummons || pending;
  };
  var getConjurationOutcome = (nat) => {
    if (nat <= 1) return { outcome: "fail", multiplier: 0, extraSummons: 0, durationMod: 0 };
    if (nat >= 2 && nat <= 5) return { outcome: "weak", multiplier: 0.6, extraSummons: 0, durationMod: -1 };
    if (nat >= 6 && nat <= 18) return { outcome: "normal", multiplier: 1, extraSummons: 0, durationMod: 0 };
    if (nat === 19) return { outcome: "powerful", multiplier: 1.35, extraSummons: 0, durationMod: 1 };
    return { outcome: "critical", multiplier: 1.5, extraSummons: 1, durationMod: 1 };
  };
  var adjustAbilityCost = (character, ability) => {
    const base = ability.cost === 0 ? 0 : Math.max(1, Math.floor(ability.cost || 0));
    if (!character) return base;
    const lvlFactor = 1 + (character.level || 1) * 0.01;
    const getSkill = (name) => character.skills.find((s) => s.name === name)?.level || 0;
    let skillReduction = 0;
    if (ability.type === "magic") skillReduction = (getSkill("Destruction") || 0) * 5e-3;
    if (ability.type === "melee") skillReduction = (getSkill("One-Handed") || getSkill("Two-Handed")) * 3e-3;
    if (base === 0) return 0;
    const adjusted = Math.max(1, Math.floor(base * lvlFactor * Math.max(0.6, 1 - skillReduction)));
    return adjusted;
  };
  var validateShieldEquipping = (equipment) => {
    return equipment.map((item) => {
      const nameLower = (item.name || "").toLowerCase();
      const looksLikeShield = nameLower.includes("shield") || item.slot === "offhand" && (item.armor ?? 0) > 0;
      if (looksLikeShield && item.slot !== "offhand") {
        console.warn(`Invalid shield slot detected for ${item.name}. Forcing to off-hand.`);
        return { ...item, slot: "offhand" };
      }
      return item;
    });
  };
  var computeEnemyXP = (enemy) => {
    const lvl = enemy.level || 1;
    const base = Math.max(1, Math.floor(lvl * 10));
    const bonus = enemy.damage ? Math.floor((enemy.damage || 0) / 2) : 0;
    return Math.max(5, base + bonus);
  };
  var calculatePlayerCombatStats = (character, equipment) => {
    const validatedEquipment = validateShieldEquipping(equipment);
    const equippedItems = validatedEquipment.filter((item) => item.equipped && (!item.equippedBy || item.equippedBy === "player"));
    let armor = 0;
    let weaponDamage = 10;
    let critChance = 5;
    let dodgeChance = 0;
    let magicResist = 0;
    let mainWeapon = equippedItems.find((i) => i.slot === "weapon" && i.type === "weapon");
    const offhandItem = equippedItems.find((i) => i.slot === "offhand");
    equippedItems.forEach((item) => {
      if (item.armor) armor += item.armor;
    });
    if (mainWeapon && mainWeapon.damage) {
      weaponDamage = mainWeapon.damage;
    } else {
      equippedItems.forEach((item) => {
        if (item.damage) weaponDamage = Math.max(weaponDamage, item.damage);
      });
    }
    const getSkillLevel = (name) => (character.skills || []).find((s) => s.name === name)?.level || 0;
    const lightArmorSkill = getSkillLevel("Light Armor");
    const heavyArmorSkill = getSkillLevel("Heavy Armor");
    const armorSkillBonus = Math.max(lightArmorSkill, heavyArmorSkill) * 0.5;
    armor = Math.floor(armor * (1 + armorSkillBonus / 100));
    dodgeChance = Math.floor(getSkillLevel("Sneak") * 0.3);
    const oneHandedSkill = getSkillLevel("One-Handed");
    const twoHandedSkill = getSkillLevel("Two-Handed");
    const archerySkill = getSkillLevel("Archery");
    const weaponSkillBonus = Math.max(oneHandedSkill, twoHandedSkill, archerySkill) * 0.5;
    weaponDamage = Math.floor(weaponDamage * (1 + weaponSkillBonus / 100));
    magicResist = Math.floor(getSkillLevel("Alteration") * 0.2);
    try {
      const needs = character.needs || {};
      const hunger = Math.max(0, Math.min(100, Number(needs.hunger || 0)));
      const thirst = Math.max(0, Math.min(100, Number(needs.thirst || 0)));
      const fatigue = Math.max(0, Math.min(100, Number(needs.fatigue || 0)));
      const archetype = String(character.archetype || "").toLowerCase();
      const enduranceFocused = archetype.includes("warrior") || archetype.includes("paladin");
      const thresholdOffset = enduranceFocused ? 10 : 0;
      const mildThreshold = Math.min(95, 60 + thresholdOffset);
      const severeThreshold = Math.min(98, 80 + thresholdOffset);
      const applyTiered = (value, mild, severe, critical) => {
        if (value >= 100) return critical;
        if (value >= severeThreshold) return severe;
        if (value >= mildThreshold) return mild;
        return 0;
      };
      const combatPenalty = applyTiered(hunger, 0.05, 0.15, 0.35) + applyTiered(thirst, 0.03, 0.1, 0.25) + applyTiered(fatigue, 0.07, 0.2, 0.45);
      const dodgePenalty = (hunger >= mildThreshold ? 5 : 0) + (fatigue >= mildThreshold ? 8 : 0) + (fatigue >= severeThreshold ? 8 : 0);
      const critPenalty = thirst >= severeThreshold ? 2 : thirst >= mildThreshold ? 1 : 0;
      weaponDamage = Math.max(1, Math.floor(weaponDamage * Math.max(0.4, 1 - combatPenalty)));
      dodgeChance = Math.max(0, dodgeChance - dodgePenalty);
      critChance = Math.max(0, critChance - critPenalty);
      magicResist = Math.max(0, magicResist - (thirst >= severeThreshold ? 5 : 0));
    } catch (e) {
    }
    const hasLightArmor = equippedItems.some((i) => i.type === "apparel" && (i.name?.toLowerCase().includes("leather") || i.name?.toLowerCase().includes("hide") || i.name?.toLowerCase().includes("scale") || i.name?.toLowerCase().includes("glass") || i.name?.toLowerCase().includes("elven")));
    const hasHeavyArmor = equippedItems.some((i) => i.type === "apparel" && (i.name?.toLowerCase().includes("iron") || i.name?.toLowerCase().includes("steel") || i.name?.toLowerCase().includes("orcish") || i.name?.toLowerCase().includes("daedric") || i.name?.toLowerCase().includes("dwarven") || i.name?.toLowerCase().includes("ebony") || i.name?.toLowerCase().includes("plate")));
    const lightArmorBonus = getCombatPerkBonus(character, "lightArmorRating");
    const heavyArmorBonus = getCombatPerkBonus(character, "heavyArmorRating");
    const lightArmorSetBonus = getCombatPerkBonus(character, "lightArmorSetBonus");
    const heavyArmorSetBonus = getCombatPerkBonus(character, "heavyArmorSetBonus");
    if (hasLightArmor && lightArmorBonus > 0) {
      armor = Math.floor(armor * (1 + lightArmorBonus / 100));
    }
    if (hasHeavyArmor && heavyArmorBonus > 0) {
      armor = Math.floor(armor * (1 + heavyArmorBonus / 100));
    }
    const armorPieceCount = equippedItems.filter((i) => i.type === "apparel" && ["head", "chest", "hands", "feet"].includes(i.slot || "")).length;
    if (armorPieceCount >= 3) {
      if (hasLightArmor && lightArmorSetBonus > 0) {
        armor = Math.floor(armor * (1 + lightArmorSetBonus / 100));
      }
      if (hasHeavyArmor && heavyArmorSetBonus > 0) {
        armor = Math.floor(armor * (1 + heavyArmorSetBonus / 100));
      }
    }
    const dodgeBonus = getCombatPerkBonus(character, "dodgeChance");
    if (hasLightArmor && dodgeBonus > 0) {
      dodgeChance += dodgeBonus;
    }
    const weaponName = mainWeapon?.name?.toLowerCase() || "";
    const isOneHanded = weaponName.includes("sword") || weaponName.includes("axe") || weaponName.includes("mace") || weaponName.includes("dagger") || weaponName.includes("war axe");
    const isTwoHanded = weaponName.includes("greatsword") || weaponName.includes("battleaxe") || weaponName.includes("warhammer");
    const isBow = weaponName.includes("bow");
    const isDualWielding = !!offhandItem && offhandItem.type === "weapon";
    if (isOneHanded) {
      const oneHandedBonus = getCombatPerkBonus(character, "oneHandedDamage");
      if (oneHandedBonus > 0) {
        weaponDamage = Math.floor(weaponDamage * (1 + oneHandedBonus / 100));
      }
    }
    if (isTwoHanded) {
      const twoHandedBonus = getCombatPerkBonus(character, "twoHandedDamage");
      if (twoHandedBonus > 0) {
        weaponDamage = Math.floor(weaponDamage * (1 + twoHandedBonus / 100));
      }
    }
    if (isBow) {
      const bowBonus = getCombatPerkBonus(character, "bowDamage");
      if (bowBonus > 0) {
        weaponDamage = Math.floor(weaponDamage * (1 + bowBonus / 100));
      }
      const bowCritBonus = getCombatPerkBonus(character, "bowCritChance");
      if (bowCritBonus > 0) {
        critChance += bowCritBonus;
      }
    }
    const abilities = generatePlayerAbilities(character, equippedItems);
    const healthPerkBonus = getStatPerkBonus(character, "health");
    const magickaPerkBonus = getStatPerkBonus(character, "magicka");
    const staminaPerkBonus = getStatPerkBonus(character, "stamina");
    const baseHealth = character.stats.health;
    const baseMagicka = character.stats.magicka;
    const baseStamina = character.stats.stamina;
    const maxHealth = baseHealth + healthPerkBonus;
    const maxMagicka = baseMagicka + magickaPerkBonus;
    const maxStamina = baseStamina + staminaPerkBonus;
    const currentHealth = Math.min(maxHealth, character.currentVitals?.currentHealth ?? maxHealth);
    const currentMagicka = Math.min(maxMagicka, character.currentVitals?.currentMagicka ?? maxMagicka);
    const currentStamina = Math.min(maxStamina, character.currentVitals?.currentStamina ?? maxStamina);
    return {
      maxHealth,
      currentHealth,
      maxMagicka,
      currentMagicka,
      maxStamina,
      currentStamina,
      armor,
      weaponDamage,
      critChance,
      dodgeChance,
      magicResist,
      abilities,
      // Regen system: Calculate based on level and perks
      // Characters below level 10 get free passive regen
      // Characters level 10+ need to unlock regen via perks
      ...calculateRegenRates(character)
    };
  };
  var calculateRegenRates = (character) => {
    const level = character.level || 1;
    const perks = character.perks || [];
    const hasHealthRegen = perks.some((p) => p.id === "health_regen" || p.name === "Health Regeneration");
    const hasMagickaRegen = perks.some((p) => p.id === "magicka_regen" || p.name === "Magicka Regeneration");
    const hasStaminaRegen = perks.some((p) => p.id === "stamina_regen" || p.name === "Stamina Regeneration");
    const healthRegenPerk = perks.find((p) => p.id === "health_regen" || p.name === "Health Regeneration");
    const magickaRegenPerk = perks.find((p) => p.id === "magicka_regen" || p.name === "Magicka Regeneration");
    const staminaRegenPerk = perks.find((p) => p.id === "stamina_regen" || p.name === "Stamina Regeneration");
    const BASE_HEALTH_REGEN = 0.5;
    const BASE_MAGICKA_REGEN = 0.75;
    const BASE_STAMINA_REGEN = 0.5;
    if (level < 10) {
      return {
        regenHealthPerSec: BASE_HEALTH_REGEN,
        regenMagickaPerSec: BASE_MAGICKA_REGEN,
        regenStaminaPerSec: BASE_STAMINA_REGEN
      };
    }
    const perkMultiplier = 1.25;
    return {
      regenHealthPerSec: hasHealthRegen ? BASE_HEALTH_REGEN * (1 + ((healthRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0,
      regenMagickaPerSec: hasMagickaRegen ? BASE_MAGICKA_REGEN * (1 + ((magickaRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0,
      regenStaminaPerSec: hasStaminaRegen ? BASE_STAMINA_REGEN * (1 + ((staminaRegenPerk?.rank || 1) - 1) * (perkMultiplier - 1)) : 0
    };
  };
  var UNARMED_SKILL_MODIFIER = 0.5;
  var generatePlayerAbilities = (character, equipment) => {
    const abilities = [];
    const getSkillLevel = (name) => (character.skills || []).find((s) => s.name === name)?.level || 0;
    const weapon = equipment.find((i) => i.equipped && i.slot === "weapon");
    abilities.push({
      id: "basic_attack",
      name: weapon ? `Strike with ${weapon.name}` : "Unarmed Strike",
      type: "melee",
      damage: weapon?.damage || 10,
      cost: 10,
      // stamina
      cooldown: 0,
      // No cooldown for basic attack
      description: "A basic attack with your equipped weapon."
    });
    if (isFeatureEnabled("enableUnarmedCombat")) {
      const unarmedSkill = getSkillLevel("Unarmed");
      const UNARMED_UNLOCK_SKILL_LEVEL = 5;
      const hasUnarmedPerk = hasPerk(character, "unarmed_mastery");
      if (unarmedSkill >= UNARMED_UNLOCK_SKILL_LEVEL || hasUnarmedPerk) {
        abilities.push({
          id: "unarmed_strike",
          name: "Unarmed Strike",
          type: "melee",
          damage: Math.max(4, Math.floor((weapon?.damage || 10) * 0.7)),
          // base unarmed damage (slightly below weapon)
          cost: 0,
          // zero stamina
          cooldown: 0,
          // No cooldown
          unarmed: true,
          description: "A fallback strike that requires no stamina and scales with the Unarmed skill."
        });
      }
    }
    const offhandWeapon = equipment.find((i) => i.equipped && i.slot === "offhand" && i.type === "weapon");
    if (offhandWeapon && isSmallWeapon(offhandWeapon)) {
      abilities.push({
        id: "offhand_attack",
        name: `Off-hand: ${offhandWeapon.name}`,
        type: "melee",
        damage: Math.max(5, Math.floor((offhandWeapon.damage || 6) * 0.6)),
        cost: 8,
        cooldown: 1,
        // Short cooldown to prevent dual-wield spam
        description: `A quick off-hand strike with ${offhandWeapon.name}.`
      });
    }
    const weaponSkill = Math.max(getSkillLevel("One-Handed"), getSkillLevel("Two-Handed"));
    if (weaponSkill >= 20) {
      abilities.push({
        id: "power_attack",
        name: "Power Attack",
        type: "melee",
        damage: Math.floor((weapon?.damage || 10) * 1.5),
        cost: 25,
        cooldown: 2,
        description: "A powerful strike that deals 50% more damage.",
        effects: [{ type: "stun", value: 1, duration: 1, chance: 25 }]
      });
    }
    const twoHandedSkill = getSkillLevel("Two-Handed");
    const oneHandedSkillVal = getSkillLevel("One-Handed");
    const hasWhirlwindPerk = hasPerk(character, "whirlwind_mastery");
    if (twoHandedSkill >= 35 || oneHandedSkillVal >= 40 || hasWhirlwindPerk) {
      const baseDamage = Math.floor((weapon?.damage || 10) * 1.2);
      abilities.push({
        id: "whirlwind_attack",
        name: "Whirlwind Attack",
        type: "melee",
        damage: baseDamage,
        cost: 75,
        // High stamina cost (70-100 range)
        cooldown: 3,
        description: "A powerful spinning attack that hits multiple enemies. Enemies hit depends on your roll.",
        effects: [{ type: "aoe_damage", value: baseDamage, aoeTarget: "all_enemies" }]
      });
    }
    const hasCleavingPerk = hasPerk(character, "cleaving_mastery");
    if (twoHandedSkill >= 50 || hasCleavingPerk) {
      const cleaveDamage = Math.floor((weapon?.damage || 10) * 1.4);
      abilities.push({
        id: "cleaving_strike",
        name: "Cleaving Strike",
        type: "melee",
        damage: cleaveDamage,
        cost: 85,
        // Higher cost for more damage
        cooldown: 4,
        description: "A devastating overhead cleave that damages all enemies in front of you.",
        effects: [{ type: "aoe_damage", value: cleaveDamage, aoeTarget: "all_enemies" }]
      });
    }
    const shield = equipment.find((i) => i.equipped && i.slot === "offhand" && i.armor);
    if (shield) {
      abilities.push({
        id: "shield_bash",
        name: "Shield Bash",
        type: "melee",
        damage: Math.floor(shield.armor * 0.5),
        cost: 15,
        cooldown: 2,
        effects: [{ type: "stun", value: 1, duration: 1, chance: 50 }],
        description: "Bash with your shield, potentially stunning the enemy."
      });
    }
    const destructionSkill = getSkillLevel("Destruction");
    if (destructionSkill >= 20) {
      abilities.push({
        id: "flames",
        name: "Flames",
        type: "magic",
        damage: 15 + Math.floor(destructionSkill * 0.3),
        cost: 15,
        cooldown: 0,
        // Basic spell - no cooldown
        description: "A stream of fire that damages enemies.",
        effects: [{ type: "dot", stat: "health", value: 3, duration: 2, chance: 30 }]
      });
    }
    if (destructionSkill >= 35) {
      abilities.push({
        id: "ice_spike",
        name: "Ice Spike",
        type: "magic",
        damage: 25 + Math.floor(destructionSkill * 0.4),
        cost: 25,
        cooldown: 1,
        // Short cooldown
        description: "A spike of ice that slows enemies.",
        effects: [{ type: "debuff", stat: "stamina", value: -20, duration: 2 }]
      });
    }
    if (destructionSkill >= 50) {
      abilities.push({
        id: "lightning_bolt",
        name: "Lightning Bolt",
        type: "magic",
        damage: 35 + Math.floor(destructionSkill * 0.5),
        cost: 35,
        cooldown: 2,
        // Medium cooldown
        description: "A bolt of lightning that drains magicka.",
        effects: [{ type: "drain", stat: "magicka", value: 15 }]
      });
    }
    if (destructionSkill >= 65) {
      abilities.push({
        id: "chain_lightning",
        name: "Chain Lightning",
        type: "magic",
        damage: 30 + Math.floor(destructionSkill * 0.4),
        cost: 50,
        cooldown: 3,
        description: "Lightning arcs between all enemies, shocking them all.",
        effects: [{ type: "aoe_damage", value: 30 + Math.floor(destructionSkill * 0.4), aoeTarget: "all_enemies" }]
      });
    }
    if (destructionSkill >= 75) {
      abilities.push({
        id: "fireball",
        name: "Fireball",
        type: "magic",
        damage: 40 + Math.floor(destructionSkill * 0.5),
        cost: 60,
        cooldown: 3,
        description: "A massive ball of fire that explodes on impact, burning all enemies.",
        effects: [
          { type: "aoe_damage", value: 40 + Math.floor(destructionSkill * 0.5), aoeTarget: "all_enemies" },
          { type: "dot", stat: "health", value: 5, duration: 3, chance: 50 }
        ]
      });
    }
    if (destructionSkill >= 85) {
      abilities.push({
        id: "blizzard",
        name: "Blizzard",
        type: "magic",
        damage: 25 + Math.floor(destructionSkill * 0.3),
        cost: 70,
        cooldown: 4,
        description: "A devastating ice storm that freezes all enemies, dealing damage over time.",
        effects: [
          { type: "aoe_damage", value: 25 + Math.floor(destructionSkill * 0.3), aoeTarget: "all_enemies" },
          { type: "debuff", stat: "stamina", value: -30, duration: 3 }
        ]
      });
    }
    const restorationSkill = getSkillLevel("Restoration");
    if (restorationSkill >= 20) {
      abilities.push({
        id: "healing",
        name: "Healing",
        type: "magic",
        damage: 0,
        cost: 20,
        cooldown: 1,
        // Short cooldown to prevent heal spam
        description: "Restore your health.",
        effects: [{ type: "heal", stat: "health", value: 25 + Math.floor(restorationSkill * 0.5) }]
      });
    }
    if (restorationSkill >= 50) {
      abilities.push({
        id: "healing_circle",
        name: "Healing Circle",
        type: "magic",
        damage: 0,
        cost: 45,
        cooldown: 3,
        description: "A circle of healing light that restores health to you and all allies.",
        effects: [{ type: "aoe_heal", value: 30 + Math.floor(restorationSkill * 0.4), aoeTarget: "all_allies" }],
        heal: 30 + Math.floor(restorationSkill * 0.4)
      });
    }
    if (restorationSkill >= 70) {
      abilities.push({
        id: "guardian_circle",
        name: "Guardian Circle",
        type: "magic",
        damage: 0,
        cost: 65,
        cooldown: 4,
        description: "A powerful ward that heals and buffs all allies with increased armor.",
        effects: [
          { type: "aoe_heal", value: 40 + Math.floor(restorationSkill * 0.5), aoeTarget: "all_allies" },
          { type: "buff", stat: "armor", value: 25, duration: 3 }
        ],
        heal: 40 + Math.floor(restorationSkill * 0.5)
      });
    }
    const conjurationSkill = getSkillLevel("Conjuration");
    if (conjurationSkill >= 30) {
      abilities.push({
        id: "bound_weapon",
        name: "Bound Weapon",
        type: "magic",
        damage: 30 + Math.floor(conjurationSkill * 0.3),
        cost: 30,
        cooldown: 3,
        description: "Conjure a spectral weapon to strike your foe."
      });
    }
    const bow = equipment.find((i) => i.equipped && i.slot === "weapon" && i.name.toLowerCase().includes("bow"));
    if (bow) {
      const archerySkill = getSkillLevel("Archery");
      abilities.push({
        id: "aimed_shot",
        name: "Aimed Shot",
        type: "ranged",
        damage: Math.floor((bow.damage || 15) * 1.3),
        cost: 20,
        cooldown: 1,
        description: "A carefully aimed arrow for extra damage.",
        effects: [{ type: "damage", value: Math.floor(archerySkill * 0.2), chance: 100 }]
      });
    }
    try {
      const learned = getLearnedSpellIds(character.id || "");
      learned.forEach((spellId) => {
        const ab = createAbilityFromSpell(spellId);
        if (ab) abilities.push(ab);
      });
    } catch (e) {
    }
    return abilities;
  };
  var grantAbilityToPlayer = (playerStats, ability) => {
    const existing = playerStats.abilities.find((a) => a.id === ability.id);
    if (!existing) {
      playerStats.abilities = [...playerStats.abilities, ability];
    }
    return playerStats;
  };
  var getEnemyCountForLevel = (playerLevel) => {
    if (playerLevel <= 3) return randomRange(1, 3);
    if (playerLevel <= 7) return randomRange(2, 4);
    if (playerLevel <= 12) return randomRange(2, 5);
    return randomRange(3, 5);
  };
  var addMinionsToEnemies = (enemies, playerLevel) => {
    const result = [...enemies];
    for (const enemy of enemies) {
      if (enemy.isBoss) {
        const baseMinions = 2;
        const bonusMinions = Math.min(2, Math.floor(playerLevel / 5));
        const minionCount = baseMinions + randomRange(0, bonusMinions);
        let minionTemplateId = "bandit";
        const nameLower = enemy.name.toLowerCase();
        if (enemy.type === "undead") {
          minionTemplateId = nameLower.includes("draugr") ? "draugr" : nameLower.includes("vampire") ? "skeleton" : "skeleton";
        } else if (enemy.type === "beast") {
          minionTemplateId = nameLower.includes("spider") ? "frost_spider" : nameLower.includes("troll") ? "wolf" : "wolf";
        } else if (enemy.type === "daedra") {
          minionTemplateId = "skeleton";
        } else if (enemy.type === "automaton") {
          minionTemplateId = "skeleton";
        } else if (nameLower.includes("vampire")) minionTemplateId = "skeleton";
        else if (nameLower.includes("mage") || nameLower.includes("necromancer")) minionTemplateId = "skeleton";
        else if (nameLower.includes("bandit") || nameLower.includes("forsworn")) minionTemplateId = "bandit";
        else if (nameLower.includes("troll")) minionTemplateId = "wolf";
        try {
          for (let i = 0; i < minionCount; i++) {
            const minion = createEnemyFromTemplate(minionTemplateId, {
              targetLevel: Math.max(1, playerLevel - 2),
              levelModifier: randomRange(-2, 0),
              isElite: false,
              forceUnique: true
            });
            result.push(minion);
          }
        } catch (e) {
          console.warn("Failed to add minions:", e);
        }
      }
    }
    return result;
  };
  var scaleEnemyEncounter = (enemies, playerLevel) => {
    if (enemies.length >= 2) {
      return addMinionsToEnemies(enemies, playerLevel);
    }
    const baseEnemy = enemies[0];
    if (!baseEnemy) return enemies;
    if (baseEnemy.isBoss) {
      return addMinionsToEnemies(enemies, playerLevel);
    }
    const desiredTotal = getEnemyCountForLevel(playerLevel);
    const additionalCount = Math.max(0, desiredTotal - 1);
    if (additionalCount === 0) return enemies;
    const result = [baseEnemy];
    for (let i = 0; i < additionalCount; i++) {
      try {
        const minion = createEnemyFromTemplate(baseEnemy.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").split("_")[0] || "bandit", {
          targetLevel: Math.max(1, playerLevel - 2),
          levelModifier: -1 - Math.floor(i / 2),
          isElite: false,
          forceUnique: false
        });
        result.push(minion);
      } catch (e) {
        result.push({ ...baseEnemy, id: `${baseEnemy.id}_minion_${i}`, level: Math.max(1, (baseEnemy.level || 1) - 2), maxHealth: Math.max(1, (baseEnemy.maxHealth || 10) - 8), currentHealth: Math.max(1, (baseEnemy.maxHealth || 10) - 8), xpReward: 0 });
      }
    }
    return result;
  };
  var initializeCombat = (enemies, location, ambush = false, fleeAllowed = true, surrenderAllowed = false, companions, playerLevel) => {
    let scaledEnemies = enemies;
    if (playerLevel && playerLevel > 0) {
      scaledEnemies = scaleEnemyEncounter(enemies, playerLevel);
    }
    const initializedEnemies = scaledEnemies.map((enemy, index) => ({
      ...enemy,
      id: enemy.id || `enemy_${index}_${Date.now()}`,
      currentHealth: enemy.maxHealth,
      currentMagicka: enemy.maxMagicka,
      currentStamina: enemy.maxStamina,
      activeEffects: [],
      health_state: enemy.health_state || "healthy",
      morale_state: enemy.morale_state || "steady",
      combat_state: enemy.combat_state || "still_hostile",
      // Health regeneration is no longer applied passively; regenerated health mechanics were removed intentionally.
      // Ensure rewards and loot exist to avoid empty loot phases
      xpReward: typeof enemy.xpReward === "number" ? enemy.xpReward : computeEnemyXP(enemy),
      goldReward: typeof enemy.goldReward === "number" ? enemy.goldReward : randomRange(Math.max(1, (enemy.level || 1) * 5), Math.max(5, (enemy.level || 1) * 12)),
      loot: Array.isArray(enemy.loot) && enemy.loot.length ? enemy.loot : BASE_ENEMY_TEMPLATES[(enemy.type || "").toLowerCase()]?.possibleLoot || enemy.loot || []
    }));
    const nameCounts = {};
    initializedEnemies.forEach((e) => {
      const base = e.name.replace(/\s+\d+$/, "");
      nameCounts[base] = (nameCounts[base] || 0) + 1;
    });
    const nameSeen = {};
    Object.keys(nameCounts).forEach((base) => {
      if (nameCounts[base] > 1) {
        initializedEnemies.forEach((e) => {
          const ebase = e.name.replace(/\s+\d+$/, "");
          if (ebase === base) {
            nameSeen[base] = (nameSeen[base] || 0) + 1;
            e.name = `${ebase} ${nameSeen[base]}`;
          }
        });
      }
    });
    const validCompanions = (companions || []).filter(
      (c) => c && c.id && c.name && (c.behavior === "follow" || c.behavior === "guard") && (c.health > 0 || c.maxHealth > 0)
      // must be alive
    );
    const companionAllies = validCompanions.map((c, idx) => {
      const level = c.level || 1;
      const baseDamage = c.damage || 4;
      const isAnimal = !!c.isAnimal;
      const abilities = [];
      if (isAnimal) {
        abilities.push({
          id: `comp_bite_${c.id}`,
          name: `Bite (${c.name})`,
          type: "melee",
          damage: baseDamage,
          cost: 0,
          description: `${c.name} bites the enemy with sharp fangs.`
        });
        abilities.push({
          id: `comp_claw_${c.id}`,
          name: `Claw Swipe (${c.name})`,
          type: "melee",
          damage: Math.floor(baseDamage * 0.8),
          cost: 5,
          description: `${c.name} swipes with sharp claws.`,
          effects: [{ type: "dot", stat: "health", value: 2, duration: 2, chance: 30 }]
        });
        abilities.push({
          id: `comp_pounce_${c.id}`,
          name: `Pounce (${c.name})`,
          type: "melee",
          damage: Math.floor(baseDamage * 1.3),
          cost: 12,
          description: `${c.name} leaps at the enemy.`,
          effects: [{ type: "stun", value: 1, duration: 1, chance: 20 }]
        });
        abilities.push({
          id: `comp_rest_${c.id}`,
          name: `Rest (${c.name})`,
          type: "utility",
          damage: 0,
          cost: 8,
          description: `${c.name} rests briefly to recover.`,
          heal: Math.floor(10 + level * 2)
        });
      } else {
        abilities.push({
          id: `comp_strike_${c.id}`,
          name: `Strike (${c.name})`,
          type: "melee",
          damage: baseDamage,
          cost: 0,
          description: `${c.name} attacks with their weapon.`
        });
        abilities.push({
          id: `comp_power_${c.id}`,
          name: `Power Attack (${c.name})`,
          type: "melee",
          damage: Math.floor(baseDamage * 1.5),
          cost: 15,
          description: `${c.name} delivers a powerful strike.`
        });
        abilities.push({
          id: `comp_defend_${c.id}`,
          name: `Defensive Stance (${c.name})`,
          type: "utility",
          damage: 0,
          cost: 10,
          description: `${c.name} raises their guard.`,
          effects: [{ type: "buff", stat: "armor", value: 15, duration: 2 }]
        });
        const isMageType = (c.name || "").toLowerCase().includes("mage") || (c.species || "").toLowerCase().includes("mage") || (c.description || "").toLowerCase().includes("magic");
        if (isMageType || level >= 5) {
          abilities.push({
            id: `comp_heal_${c.id}`,
            name: `Healing Hands (${c.name})`,
            type: "magic",
            damage: 0,
            cost: 20,
            description: `${c.name} channels healing magic.`,
            heal: Math.floor(15 + level * 3),
            effects: [{ type: "aoe_heal", value: Math.floor(10 + level * 2), aoeTarget: "all_allies" }]
          });
        }
        abilities.push({
          id: `comp_taunt_${c.id}`,
          name: `Battle Cry (${c.name})`,
          type: "utility",
          damage: 0,
          cost: 12,
          description: `${c.name} lets out a battle cry, boosting morale.`,
          effects: [{ type: "buff", stat: "damage", value: 5, duration: 2 }]
        });
      }
      return {
        id: `ally_${c.id}_${Date.now()}_${idx}`,
        name: c.name,
        // Derive combat type from companion data: animals are 'beast', humanoid companions remain 'humanoid'
        type: isAnimal ? "beast" : "humanoid",
        level,
        maxHealth: c.maxHealth || c.health || 50,
        currentHealth: c.maxHealth || c.health || 50,
        maxMagicka: isAnimal ? void 0 : 50 + level * 5,
        currentMagicka: isAnimal ? void 0 : 50 + level * 5,
        maxStamina: 50 + level * 3,
        currentStamina: 50 + level * 3,
        armor: c.armor || 0,
        damage: baseDamage,
        abilities,
        behavior: "support",
        isCompanion: true,
        xpReward: 0,
        // Keep a reference to original companion so we can access autoLoot later
        companionMeta: { companionId: c.id, autoLoot: !!c.autoLoot, autoControl: c.autoControl !== false }
      };
    });
    const turnOrder = ambush ? [...initializedEnemies.map((e) => e.id), "player"] : ["player", ...initializedEnemies.map((e) => e.id)];
    const finalTurnOrder = [...turnOrder, ...companionAllies.map((c) => c.id)];
    const allEnemies = [...initializedEnemies];
    return {
      id: `combat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      active: true,
      // Mark combat start time for duration-based effects
      combatStartTime: Date.now(),
      turn: 1,
      currentTurnActor: finalTurnOrder[0],
      turnOrder: finalTurnOrder,
      enemies: allEnemies,
      allies: companionAllies,
      location,
      fleeAllowed,
      surrenderAllowed,
      combatLog: [{
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        turn: 0,
        actor: "system",
        action: "combat_start",
        narrative: ambush ? `You've been ambushed! ${initializedEnemies.map((e) => e.name).join(", ")} attack!` : `Combat begins against ${initializedEnemies.map((e) => e.name).join(", ")}!`,
        timestamp: Date.now()
      }],
      playerDefending: false,
      playerGuardUsed: false,
      playerActiveEffects: [],
      abilityCooldowns: {},
      lastActorActions: {}
    };
  };
  var calculateDamage = (baseDamage, attackerLevel, targetArmor, targetResistances = [], damageType, critChance = 0) => {
    const resisted = damageType ? targetResistances.includes(damageType) : false;
    const assumedNat = 12;
    const assumedTier = "mid";
    const { damage: rolled } = computeDamageFromNat(baseDamage, attackerLevel, assumedNat, assumedTier, Math.random() * 100 < critChance);
    const armorReduction = targetArmor / (targetArmor + 100);
    let damage = Math.floor(rolled * (1 - armorReduction));
    if (resisted) damage = Math.floor(damage * 0.5);
    damage = Math.max(1, damage);
    const isCrit = Math.random() * 100 < critChance;
    return { damage, isCrit, resisted };
  };
  var executePlayerAction = (state, playerStats, action, targetId, abilityId, itemId, inventory, natRoll, character) => {
    let newState = { ...state };
    let newPlayerStats = { ...playerStats };
    let narrative = "";
    const aoeSummary = { damaged: [], healed: [] };
    const playerStun = (newState.playerActiveEffects || []).find((pe) => pe.effect && pe.effect.type === "stun" && pe.turnsRemaining > 0);
    if (playerStun) {
      const remainingBefore = playerStun.turnsRemaining || 0;
      newState.playerActiveEffects = (newState.playerActiveEffects || []).map((pe) => ({ ...pe, turnsRemaining: (pe.turnsRemaining || 0) - 1 })).filter((pe) => pe.turnsRemaining > 0);
      const remainingAfter = Math.max(0, remainingBefore - 1);
      const stNarr = `You are stunned and skip your turn.${remainingAfter > 0 ? ` (${remainingAfter} turns remaining)` : ""}`;
      pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "stunned", narrative: stNarr, timestamp: Date.now() });
      return { newState, newPlayerStats, narrative: stNarr, aoeSummary };
    }
    switch (action) {
      case "attack":
      case "power_attack":
      case "magic":
      case "shout": {
        const ability = abilityId ? playerStats.abilities.find((a) => a.id === abilityId) : playerStats.abilities[0];
        if (!ability) {
          narrative = "Invalid ability!";
          break;
        }
        if (newState.abilityCooldowns[ability.id] > 0) {
          narrative = `${ability.name} is still on cooldown for ${newState.abilityCooldowns[ability.id]} turns!`;
          break;
        }
        newState.playerActionCounts = newState.playerActionCounts || {};
        const actionKey = ability.type === "magic" ? "magic" : ability.type === "melee" ? ability.id || "melee" : ability.type;
        newState.playerActionCounts[actionKey] = (newState.playerActionCounts[actionKey] || 0) + 1;
        const hasSummonEffectEarly = !!(ability.effects && ability.effects.some((ef) => ef.type === "summon"));
        if (hasSummonEffectEarly) {
          const aliveSummons = (newState.allies || []).concat(newState.enemies || []).filter((a) => !!a.companionMeta?.isSummon && (a.currentHealth || 0) > 0).length;
          const pending = (newState.pendingSummons || []).length;
          const activeSummonCount = aliveSummons + pending;
          const allowedSummons = 1 + getPerkRank(character, "twin_souls");
          if (activeSummonCount >= allowedSummons) {
            const msg = "You already have an active summon.";
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: "player", damage: 0, narrative: msg, timestamp: Date.now() });
            return { newState, newPlayerStats, narrative: msg, aoeSummary };
          }
        }
        const costType = ability.type === "magic" || ability.type === "aeo" ? "currentMagicka" : "currentStamina";
        const isUnarmed = !!ability.unarmed || ability.id === "unarmed_strike";
        let staminaMultiplier = 1;
        const effectiveCost = adjustAbilityCost(character, ability);
        if (ability.type === "magic" || ability.type === "aeo") {
          const availableMagicka = newPlayerStats.currentMagicka || 0;
          const magickaSpent = Math.max(0, Math.min(availableMagicka, effectiveCost));
          if (magickaSpent > 0) {
            newPlayerStats.currentMagicka = Math.max(0, availableMagicka - magickaSpent);
          }
          ability.__magickaSpent = magickaSpent;
        } else if (isUnarmed) {
          staminaMultiplier = 1;
          try {
            (init_logger(), __toCommonJS(logger_exports)).log.info("[telemetry] unarmed_used", { charId: character.id, lowStamina: (newPlayerStats.currentStamina || 0) <= 0, turn: newState.turn });
          } catch (e) {
          }
        } else {
          const available = newPlayerStats.currentStamina || 0;
          if (available <= 0) {
            staminaMultiplier = 0.25;
          } else if (available < effectiveCost) {
            staminaMultiplier = Math.max(0.25, available / effectiveCost);
          }
          newPlayerStats.currentStamina = Math.max(0, newPlayerStats.currentStamina - Math.min(effectiveCost, available));
          if (staminaMultiplier < 1) {
            narrative = `Low stamina reduces the effectiveness of ${ability.name}.`;
          }
        }
        const targetById = targetId ? newState.enemies.find((e) => e.id === targetId) || (newState.allies || []).find((a) => a.id === targetId) : null;
        const defaultTarget = newState.enemies.find((e) => e.currentHealth > 0);
        let target = null;
        let targetIsAlly = false;
        const explicitTargetProvided = !!targetId;
        const isHealingAbility = !!(ability.heal || ability.effects && ability.effects.some((ef) => ef.type === "heal"));
        const hasSummonEffect = !!(ability.effects && ability.effects.some((ef) => ef.type === "summon"));
        const isUtilityOrBuff = !!(ability.type === "utility" || ability.effects && ability.effects.some((ef) => ["buff", "debuff", "slow", "stun", "drain", "dot"].includes(ef.type)));
        if (hasSummonEffect) {
          const aliveSummons = (newState.allies || []).concat(newState.enemies || []).filter((a) => !!a.companionMeta?.isSummon && (a.currentHealth || 0) > 0).length;
          const pending = (newState.pendingSummons || []).length;
          const activeSummonCount = aliveSummons + pending;
          const allowedSummons = 1 + getPerkRank(character, "twin_souls");
          if (activeSummonCount >= allowedSummons) {
            const msg = "You already have an active summon.";
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: "player", damage: 0, narrative: msg, timestamp: Date.now() });
            return { newState, newPlayerStats, narrative: msg, aoeSummary };
          }
        }
        if (isHealingAbility) {
          if (!explicitTargetProvided) {
            target = { id: "player", name: character?.name || "you" };
            targetIsAlly = false;
          } else {
            target = targetById || null;
            targetIsAlly = target ? (newState.allies || []).find((a) => a.id === target.id) !== void 0 : false;
            if (target && (newState.enemies || []).find((e) => e.id === target.id)) {
              const oldTargetName = target.name;
              target = { id: "player", name: character?.name || "you" };
              targetIsAlly = false;
              narrative = `${ability.name} cannot heal ${oldTargetName} \u2014 applying to self instead.`;
              pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: "self", damage: 0, narrative, timestamp: Date.now() });
            }
          }
        } else {
          target = targetById || defaultTarget;
          targetIsAlly = target ? (newState.allies || []).find((a) => a.id === target.id) !== void 0 : false;
        }
        if (!target && !hasSummonEffect) {
          narrative = "No valid target!";
          break;
        }
        if (isHealingAbility) {
          if (!targetIsAlly && target.id !== "player") {
            const oldTargetName = target.name;
            target = { id: "player", name: character?.name || "you" };
            targetIsAlly = false;
            narrative = `${ability.name} cannot heal ${oldTargetName} \u2014 applying to self instead.`;
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: "self", damage: 0, narrative, timestamp: Date.now() });
          }
          let healAmount = ability.heal || 0;
          if (ability.effects) {
            for (const ef of ability.effects) {
              if (ef.type === "heal") healAmount += ef.value || 0;
            }
          }
          const restorationLevel = (character?.skills || []).find((s) => s.name === "Restoration")?.level || 0;
          if (restorationLevel > 0) healAmount += Math.floor(restorationLevel * 0.2);
          const healingEffectivenessBonus = getCombatPerkBonus(character, "healingEffectiveness");
          if (healingEffectivenessBonus > 0) {
            healAmount = Math.floor(healAmount * (1 + healingEffectivenessBonus / 100));
          }
          if (targetIsAlly) {
            const allyIndex2 = (newState.allies || []).findIndex((a) => a.id === target.id);
            if (allyIndex2 >= 0) {
              newState.allies = [...newState.allies || []];
              const updated = { ...newState.allies[allyIndex2] };
              updated.currentHealth = Math.min(updated.maxHealth, (updated.currentHealth || 0) + healAmount);
              newState.allies[allyIndex2] = updated;
            }
          } else if (target.id === "player") {
            newPlayerStats.currentHealth = Math.min(newPlayerStats.maxHealth, (newPlayerStats.currentHealth || 0) + healAmount);
          }
          if (ability.cooldown) {
            newState.abilityCooldowns[ability.id] = ability.cooldown;
          }
          narrative = `You use ${ability.name} on ${target.name} and restore ${healAmount} health.`;
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target.name, damage: -healAmount, narrative, timestamp: Date.now() });
          break;
        }
        if (hasSummonEffect) {
          const aliveSummons = (newState.allies || []).concat(newState.enemies || []).filter((a) => !!a.companionMeta?.isSummon && (a.currentHealth || 0) > 0).length;
          const pending = (newState.pendingSummons || []).length;
          const activeSummonCount = aliveSummons + pending;
          const allowedSummons = 1 + getPerkRank(character, "twin_souls");
          if (activeSummonCount >= allowedSummons) {
            narrative += " The conjuration fizzles \u2014 another summoned ally is already present.";
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target ? target.name : "self", damage: 0, narrative, timestamp: Date.now() });
            break;
          }
          const conjureNat = typeof natRoll === "number" && natRoll >= 1 && natRoll <= 20 ? natRoll : Math.floor(Math.random() * 20) + 1;
          const conjOutcome = getConjurationOutcome(conjureNat);
          const summonEffects = (ability.effects || []).filter((ef) => ef.type === "summon");
          for (const ef of summonEffects) {
            const summonName = ef.name || "Summoned Ally";
            if (conjOutcome.outcome === "fail") {
              narrative += ` You attempt to conjure ${summonName} but roll ${conjureNat} \u2014 the conjuration fails.`;
              pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target ? target.name : "self", damage: 0, nat: conjureNat, narrative, timestamp: Date.now() });
              continue;
            }
            if (ability.damage && target && !targetIsAlly) {
              const enemyIndex2 = newState.enemies.findIndex((e) => e.id === target.id);
              if (enemyIndex2 >= 0) {
                newState.enemies = [...newState.enemies];
                const before = newState.enemies[enemyIndex2].currentHealth;
                const dmg = Math.max(0, ability.damage || 0);
                newState.enemies[enemyIndex2] = { ...newState.enemies[enemyIndex2], currentHealth: Math.max(0, before - dmg) };
                narrative += ` The spell hits ${newState.enemies[enemyIndex2].name} for ${dmg} damage.`;
              }
            }
            const casterLevel = character && character.level ? character.level : Math.max(1, Math.floor((playerStats?.maxHealth || 100) / 20));
            const baseLevel = Math.max(1, Math.floor(casterLevel / 2));
            const level = Math.max(1, Math.floor(baseLevel * conjOutcome.multiplier));
            const baseHealth = ef.baseHealth || 30;
            const hpPerLevel = ef.hpPerLevel || 11;
            const maxHealth = Math.max(8, Math.floor((baseHealth + level * hpPerLevel) * conjOutcome.multiplier));
            const summonId = `summon_${summonName.replace(/\s+/g, "_").toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
            const companion = {
              id: summonId,
              name: summonName,
              level,
              type: looksLikeAnimal(summonName) ? "beast" : "humanoid",
              armor: Math.max(1, Math.floor((ef.baseArmor || 5) * conjOutcome.multiplier)),
              damage: Math.max(1, Math.floor((ef.baseDamage || 6 + level) * conjOutcome.multiplier)),
              maxHealth,
              currentHealth: maxHealth,
              abilities: [{ id: `${summonId}_attack`, name: `${summonName} Attack`, type: "melee", damage: Math.max(2, Math.floor(level * 2 * conjOutcome.multiplier)), cost: 0, description: "Summoned minion attack" }],
              behavior: "support",
              xpReward: 0,
              loot: [],
              isCompanion: true,
              companionMeta: { companionId: summonId, autoLoot: false, autoControl: true, isSummon: true },
              description: `${summonName} (roll ${conjureNat} \u2014 ${conjOutcome.outcome})`
            };
            newState.allies = [...newState.allies || [], companion];
            const playerTurns = Math.max(1, (ef.playerTurns || ef.duration || 3) + (conjOutcome.durationMod || 0));
            const turns = Math.max(1, ef.duration || 3);
            const playerIndex = newState.turnOrder.indexOf("player");
            if (playerIndex >= 0) {
              const before = newState.turnOrder.slice(0, playerIndex + 1);
              const after = newState.turnOrder.slice(playerIndex + 1);
              newState.turnOrder = [...before, companion.id, ...after];
            } else {
              newState.turnOrder = [...newState.turnOrder, companion.id];
            }
            if (conjOutcome.extraSummons > 0) {
              for (let i = 0; i < conjOutcome.extraSummons; i++) {
                const extraId = `${summonId}_x${i}`;
                const extraLevel = Math.max(1, Math.floor(level * 0.6));
                const extraMaxHealth = Math.max(4, Math.floor((baseHealth + extraLevel * hpPerLevel) * conjOutcome.multiplier * 0.6));
                const extra = { ...companion, id: extraId, name: `${summonName} (Lesser)`, level: extraLevel, maxHealth: extraMaxHealth, currentHealth: extraMaxHealth, description: `${summonName} (lesser)` };
                newState.allies.push(extra);
              }
            }
            newState.pendingSummons = [...newState.pendingSummons || [], { companionId: companion.id, turnsRemaining: turns, playerTurnsRemaining: playerTurns }];
            narrative += ` ${summonName} joins the fight to aid you for ${playerTurns} player turns! (roll ${conjureNat} \u2014 ${conjOutcome.outcome})`;
          }
          if (ability.cooldown) {
            newState.abilityCooldowns[ability.id] = ability.cooldown;
          }
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target ? target.name : "self", damage: 0, nat: conjureNat, rollTier: conjOutcome && conjOutcome.outcome || void 0, narrative: `You cast ${ability.name}.${narrative}`, timestamp: Date.now() });
          break;
        }
        if (isUtilityOrBuff && (!ability.damage || ability.damage === 0)) {
          if (ability.effects) {
            ability.effects.forEach((effect) => {
              if (effect.type === "buff" || effect.type === "debuff" || effect.type === "slow" || effect.type === "stun" || effect.type === "drain" || effect.type === "dot") {
                if (targetIsAlly) {
                  const allyIndex2 = (newState.allies || []).findIndex((a) => a.id === target.id);
                  if (allyIndex2 >= 0) {
                    newState.allies = [...newState.allies || []];
                    newState.allies[allyIndex2] = {
                      ...newState.allies[allyIndex2],
                      activeEffects: [...newState.allies[allyIndex2]?.activeEffects || [], { effect, turnsRemaining: effect.duration || 1 }]
                    };
                  }
                } else {
                  const enemyIndex2 = newState.enemies.findIndex((e) => e.id === target.id);
                  if (enemyIndex2 >= 0) {
                    newState.enemies = [...newState.enemies];
                    newState.enemies[enemyIndex2] = {
                      ...newState.enemies[enemyIndex2],
                      activeEffects: [...newState.enemies[enemyIndex2]?.activeEffects || [], { effect, turnsRemaining: effect.duration || 1 }]
                    };
                  }
                }
                narrative += ` ${target.name} is affected by ${effect.type}!`;
              }
            });
          }
          if (ability.cooldown) {
            newState.abilityCooldowns[ability.id] = ability.cooldown;
          }
          narrative = `You use ${ability.name} on ${target.name}.${narrative}`;
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target.name, damage: 0, narrative, timestamp: Date.now() });
          break;
        }
        const attackBonus = Math.floor((playerStats.weaponDamage || 0) / 10);
        const attackerLvl = character?.level || playerStats.maxHealth ? Math.max(1, Math.floor(character?.level || 10)) : 10;
        let attackResolved = resolveAttack({ attackerLevel: attackerLvl, attackBonus, targetArmor: target.armor, targetDodge: target.dodgeChance || 0, critChance: playerStats.critChance, natRoll });
        if (!attackResolved.hit && (attackResolved.rollTier === "fail" || attackResolved.rollTier === "miss")) {
          const hasRerollPerk = !!(character && (character.perks || []).find((p) => p.id === "reroll_on_failure" && (p.rank || 0) > 0));
          const rollText = attackResolved.rollTier === "fail" ? "critical failure" : "miss";
          if (hasRerollPerk) {
            const second = resolveAttack({ attackerLevel: attackerLvl, attackBonus, targetArmor: target.armor, targetDodge: target.dodgeChance || 0, critChance: playerStats.critChance });
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target.name, damage: 0, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative: `First roll ${attackResolved.natRoll} (${rollText}) - rerolling...`, timestamp: Date.now() });
            attackResolved = second;
          } else {
            if (attackResolved.rollTier === "fail") {
              const selfDamage = Math.max(1, Math.floor((playerStats.weaponDamage || 0) * 0.25));
              newPlayerStats = { ...newPlayerStats, currentHealth: Math.max(0, newPlayerStats.currentHealth - selfDamage) };
              narrative = `You roll ${attackResolved.natRoll} - CRITICAL FAILURE! Your ${ability.name} goes horribly wrong, dealing ${selfDamage} damage to yourself!`;
              pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: "self", damage: selfDamage, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative, timestamp: Date.now() });
            } else {
              narrative = `You roll ${attackResolved.natRoll} (${rollText}) and ${ability.name} against ${target.name} fails to connect.`;
              pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target.name, damage: 0, isCrit: false, nat: attackResolved.natRoll, rollTier: attackResolved.rollTier, narrative, timestamp: Date.now() });
            }
            break;
          }
        }
        const tierMultipliers = { low: 0.6, mid: 1, high: 1.25, crit: 1.75 };
        let abilityDamage = ability.damage || 0;
        let damage = 0;
        let hitLocation = void 0;
        if (ability.unarmed) {
          const unarmedSkillLevel = (character.skills || []).find((s) => s.name === "Unarmed")?.level || 0;
          abilityDamage = (ability.damage || 0) + Math.floor(UNARMED_SKILL_MODIFIER * unarmedSkillLevel);
          const tierMult = tierMultipliers[attackResolved.rollTier] ?? 1;
          const scaledBase = Math.max(1, Math.floor(abilityDamage * tierMult));
          const res = computeDamageFromNat(scaledBase, character?.level || 1, attackResolved.natRoll, attackResolved.rollTier, attackResolved.isCrit);
          damage = res.damage;
          hitLocation = res.hitLocation;
        } else {
          if (ability.type === "magic") {
            const magSpent = ability.__magickaSpent || 0;
            const playerLevel = character?.level || 1;
            const levelMultiplier = 1 + Math.max(0, playerLevel - 1) * 0.03;
            if (magSpent <= 0) {
              abilityDamage = ability.damage || 0;
            } else {
              const ratio = effectiveCost > 0 ? magSpent / effectiveCost : 1;
              abilityDamage = Math.max(1, Math.floor((ability.damage || 0) * levelMultiplier * ratio));
            }
            const abilityIdLower = (ability.id || "").toLowerCase();
            const abilityNameLower = (ability.name || "").toLowerCase();
            const spellIdLower = (ability.spellId || "").toLowerCase();
            const isFireSpell = abilityIdLower.includes("fire") || abilityIdLower.includes("flame") || abilityNameLower.includes("fire") || abilityNameLower.includes("flame") || spellIdLower.includes("fire") || spellIdLower.includes("flame");
            if (isFireSpell) {
              const fireBonus = getCombatPerkBonus(character, "fireDamage");
              if (fireBonus > 0) {
                abilityDamage = Math.floor(abilityDamage * (1 + fireBonus / 100));
              }
            }
            const isFrostSpell = abilityIdLower.includes("frost") || abilityIdLower.includes("ice") || abilityNameLower.includes("frost") || abilityNameLower.includes("ice") || spellIdLower.includes("frost") || spellIdLower.includes("ice");
            if (isFrostSpell) {
              const frostBonus = getCombatPerkBonus(character, "frostDamage");
              if (frostBonus > 0) {
                abilityDamage = Math.floor(abilityDamage * (1 + frostBonus / 100));
              }
            }
            const isShockSpell = abilityIdLower.includes("shock") || abilityIdLower.includes("lightning") || abilityIdLower.includes("spark") || abilityNameLower.includes("shock") || abilityNameLower.includes("lightning") || abilityNameLower.includes("spark") || spellIdLower.includes("shock") || spellIdLower.includes("lightning") || spellIdLower.includes("spark");
            if (isShockSpell) {
              const shockBonus = getCombatPerkBonus(character, "shockDamage");
              if (shockBonus > 0) {
                abilityDamage = Math.floor(abilityDamage * (1 + shockBonus / 100));
              }
            }
          }
          const baseDamage = abilityDamage + Math.floor((playerStats.weaponDamage || 0) * (ability.type === "melee" ? 0.5 : 0));
          const tierMult = tierMultipliers[attackResolved.rollTier] ?? 1;
          const scaledBase = Math.max(1, Math.floor(baseDamage * staminaMultiplier * tierMult));
          const res = computeDamageFromNat(scaledBase, character?.level || 1, attackResolved.natRoll, attackResolved.rollTier, attackResolved.isCrit);
          damage = res.damage;
          hitLocation = res.hitLocation;
        }
        let perkDamageMultiplier = 1;
        let perkArmorPenetration = 0;
        let perkLifesteal = 0;
        const berserkerBonus = getCombatPerkBonus(character, "lowHealthDamage");
        const healthPercent = newPlayerStats.currentHealth / newPlayerStats.maxHealth;
        if (berserkerBonus > 0 && healthPercent <= 0.25) {
          perkDamageMultiplier *= 1 + berserkerBonus / 100;
        }
        const executeBonus = getCombatPerkBonus(character, "executeDamage");
        const targetHealthPercent = target.currentHealth / target.maxHealth;
        if (executeBonus > 0 && targetHealthPercent <= 0.2) {
          perkDamageMultiplier *= 1 + executeBonus / 100;
        }
        const equippedWeapon = (inventory || []).find((i) => i.equipped && i.slot === "weapon" && i.type === "weapon");
        const equippedWeaponName = (equippedWeapon?.name || "").toLowerCase();
        const isAxe = equippedWeaponName.includes("axe") && !equippedWeaponName.includes("battle");
        const isBattleaxe = equippedWeaponName.includes("battleaxe");
        const isSword = equippedWeaponName.includes("sword") && !equippedWeaponName.includes("great");
        const isGreatsword = equippedWeaponName.includes("greatsword");
        const isMace = equippedWeaponName.includes("mace");
        const isWarhammer = equippedWeaponName.includes("warhammer");
        const isDagger = equippedWeaponName.includes("dagger");
        if (attackResolved.isCrit) {
          const swordCritBonus = getCombatPerkBonus(character, "swordCritDamage");
          const greatswordCritBonus = getCombatPerkBonus(character, "greatswordCritDamage");
          if (isSword && swordCritBonus > 0) {
            perkDamageMultiplier *= 1 + swordCritBonus / 100;
          }
          if (isGreatsword && greatswordCritBonus > 0) {
            perkDamageMultiplier *= 1 + greatswordCritBonus / 100;
          }
        }
        const maceArmorPen = getCombatPerkBonus(character, "maceArmorPen");
        const warhammerArmorPen = getCombatPerkBonus(character, "warhammerArmorPen");
        if (isMace && maceArmorPen > 0) {
          perkArmorPenetration += maceArmorPen;
        }
        if (isWarhammer && warhammerArmorPen > 0) {
          perkArmorPenetration += warhammerArmorPen;
        }
        const axeBleedChance = getCombatPerkBonus(character, "axeBleed");
        const battleaxeBleedChance = getCombatPerkBonus(character, "battleaxeBleed");
        if (isAxe && axeBleedChance > 0 && Math.random() * 100 < axeBleedChance) {
          const bleedEffect = { type: "dot", stat: "health", value: 5, duration: 3 };
          if (!targetIsAlly) {
            const enemyIndex2 = newState.enemies.findIndex((e) => e.id === target.id);
            if (enemyIndex2 >= 0) {
              newState.enemies = [...newState.enemies];
              newState.enemies[enemyIndex2] = {
                ...newState.enemies[enemyIndex2],
                activeEffects: [...newState.enemies[enemyIndex2]?.activeEffects || [], { effect: bleedEffect, turnsRemaining: 3 }]
              };
            }
          }
          narrative += " The axe causes a bleeding wound!";
        }
        if (isBattleaxe && battleaxeBleedChance > 0 && Math.random() * 100 < battleaxeBleedChance) {
          const bleedEffect = { type: "dot", stat: "health", value: 7, duration: 3 };
          if (!targetIsAlly) {
            const enemyIndex2 = newState.enemies.findIndex((e) => e.id === target.id);
            if (enemyIndex2 >= 0) {
              newState.enemies = [...newState.enemies];
              newState.enemies[enemyIndex2] = {
                ...newState.enemies[enemyIndex2],
                activeEffects: [...newState.enemies[enemyIndex2]?.activeEffects || [], { effect: bleedEffect, turnsRemaining: 3 }]
              };
            }
          }
          narrative += " The battleaxe causes a deep bleeding wound!";
        }
        perkLifesteal = getCombatPerkBonus(character, "lifesteal");
        const effectiveArmor = Math.max(0, target.armor * (1 - perkArmorPenetration / 100));
        const armorReduction = effectiveArmor / (effectiveArmor + 100);
        const finalDamage = Math.max(1, Math.floor(damage * perkDamageMultiplier * (1 - armorReduction)));
        const isCrit = attackResolved.isCrit;
        const resisted = ability.type === "magic" && target.resistances?.includes("magic");
        const appliedDamage = resisted ? Math.floor(finalDamage * 0.5) : finalDamage;
        let enemyIndex = -1;
        let allyIndex = -1;
        if (targetIsAlly) {
          allyIndex = (newState.allies || []).findIndex((a) => a.id === target.id);
          if (allyIndex >= 0) {
            newState.allies = [...newState.allies || []];
            newState.allies[allyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - appliedDamage) };
          }
        } else {
          enemyIndex = newState.enemies.findIndex((e) => e.id === target.id);
          if (enemyIndex >= 0) {
            newState.enemies = [...newState.enemies];
            newState.enemies[enemyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - appliedDamage) };
          }
        }
        if (ability.cooldown) {
          newState.abilityCooldowns[ability.id] = ability.cooldown;
        }
        let damageNarrative = `deals ${appliedDamage} damage to the ${hitLocation}`;
        if (isCrit) damageNarrative = `CRITICAL HIT! ` + damageNarrative;
        if (resisted) damageNarrative += ` (resisted)`;
        narrative = `You use ${ability.name} on ${target.name} and ${damageNarrative}!`;
        if (perkLifesteal > 0 && ability.type === "melee" && appliedDamage > 0 && !targetIsAlly) {
          const lifestealAmount = Math.max(1, Math.floor(appliedDamage * perkLifesteal / 100));
          newPlayerStats.currentHealth = Math.min(
            newPlayerStats.maxHealth,
            newPlayerStats.currentHealth + lifestealAmount
          );
          narrative += ` You drain ${lifestealAmount} health.`;
        }
        try {
          pushCombatLogUnique(newState, {
            turn: newState.turn,
            actor: "player",
            action: ability.name,
            target: target.name,
            damage: appliedDamage,
            isCrit,
            nat: attackResolved.natRoll,
            hitLocation,
            rollTier: attackResolved.rollTier,
            narrative,
            timestamp: Date.now()
          });
        } catch (e) {
          newState.combatLog = newState.combatLog || [];
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: ability.name, target: target.name, damage: appliedDamage, isCrit, nat: attackResolved.natRoll, hitLocation, rollTier: attackResolved.rollTier, narrative, timestamp: Date.now() });
        }
        if (enemyIndex >= 0 && newState.enemies[enemyIndex].currentHealth <= 0) {
          narrative += ` ${target.name} is defeated!`;
        }
        newState.lastActorActions = newState.lastActorActions || {};
        newState.lastActorActions["player"] = [ability.id, ...newState.lastActorActions["player"] || []].slice(0, 4);
        newState = normalizeSummonedCompanions(newState);
        if (ability.effects) {
          ability.effects.forEach((effect) => {
            if (Math.random() * 100 < (effect.chance || 100)) {
              if (effect.type === "heal") {
                const healAmount = effect.value;
                newPlayerStats.currentHealth = Math.min(
                  newPlayerStats.maxHealth,
                  newPlayerStats.currentHealth + healAmount
                );
                narrative += ` You recover ${healAmount} health.`;
              } else if (effect.type === "aoe_damage") {
                const aoeDamage = effect.value || 0;
                let totalAoeDamage = 0;
                let hitCount = 0;
                const aoeDamages = [];
                const isPhysicalAoE = ability.type === "melee" || ability.type === "ranged";
                let maxTargets = newState.enemies.filter((e) => e.currentHealth > 0 && e.id !== target?.id).length;
                if (isPhysicalAoE && attackResolved) {
                  const nat = attackResolved.natRoll || 10;
                  if (nat === 1) maxTargets = 0;
                  else if (nat <= 4) maxTargets = Math.min(1, maxTargets);
                  else if (nat <= 9) maxTargets = Math.min(2, maxTargets);
                  else if (nat <= 14) maxTargets = Math.min(3, maxTargets);
                  else if (nat <= 19) maxTargets = Math.min(4, maxTargets);
                }
                const eligibleEnemies = newState.enemies.filter((e) => e.currentHealth > 0 && e.id !== target?.id);
                const enemiesToHit = eligibleEnemies.slice(0, maxTargets);
                newState.enemies = newState.enemies.map((enemy) => {
                  if (enemy.currentHealth > 0 && enemy.id !== target?.id && enemiesToHit.some((e) => e.id === enemy.id)) {
                    const armorReduction2 = enemy.armor / (enemy.armor + 100);
                    const actualDamage = Math.max(1, Math.floor(aoeDamage * (1 - armorReduction2)));
                    totalAoeDamage += actualDamage;
                    hitCount++;
                    aoeDamages.push({ id: enemy.id, name: enemy.name, amount: actualDamage });
                    return { ...enemy, currentHealth: Math.max(0, enemy.currentHealth - actualDamage) };
                  }
                  return enemy;
                });
                if (hitCount > 0) {
                  if (isPhysicalAoE) {
                    narrative += ` Your sweeping attack hits ${hitCount} other ${hitCount === 1 ? "enemy" : "enemies"} for ${totalAoeDamage} total damage!`;
                  } else {
                    narrative += ` The attack chains to ${hitCount} other ${hitCount === 1 ? "enemy" : "enemies"} for ${totalAoeDamage} total damage!`;
                  }
                } else if (isPhysicalAoE && attackResolved?.natRoll === 1) {
                  narrative += ` Your wild swing misses all other enemies!`;
                }
                aoeSummary.damaged = aoeSummary.damaged || [];
                aoeSummary.damaged.push(...aoeDamages);
              } else if (effect.type === "aoe_heal") {
                const aoeHeal = effect.value || 0;
                let totalHealed = 0;
                const aoeHeals = [];
                const playerHealAmount = Math.min(aoeHeal, newPlayerStats.maxHealth - newPlayerStats.currentHealth);
                newPlayerStats.currentHealth = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + aoeHeal);
                totalHealed += playerHealAmount;
                if (playerHealAmount > 0) aoeHeals.push({ id: "player", name: character && character.name || "You", amount: playerHealAmount });
                if (newState.allies && newState.allies.length > 0) {
                  newState.allies = newState.allies.map((ally) => {
                    if (ally.currentHealth > 0 && ally.currentHealth < ally.maxHealth) {
                      const allyHeal = Math.min(aoeHeal, ally.maxHealth - ally.currentHealth);
                      totalHealed += allyHeal;
                      if (allyHeal > 0) aoeHeals.push({ id: ally.id, name: ally.name, amount: allyHeal });
                      return { ...ally, currentHealth: Math.min(ally.maxHealth, ally.currentHealth + aoeHeal) };
                    }
                    return ally;
                  });
                }
                if (totalHealed > 0) {
                  narrative += ` The healing aura restores ${totalHealed} total health to you and your allies!`;
                }
                aoeSummary.healed = aoeSummary.healed || [];
                aoeSummary.healed.push(...aoeHeals);
              } else if (effect.type === "summon") {
                const summonName = effect.name || "Summoned Ally";
                if (combatHasActiveSummon(newState)) {
                  narrative += ` ${actor.name} attempts to conjure ${summonName} but another summon is already present.`;
                  pushCombatLogUnique(newState, { turn: newState.turn, actor: actor.name, action: "conjure", target: "self", damage: 0, narrative, timestamp: Date.now() });
                  return;
                }
                const conjureResolved = resolveAttack({ attackerLevel: actor.level || 1, attackBonus: 0, targetArmor: 0, targetDodge: 0, critChance: 10, natRoll });
                const conjOutcome = getConjurationOutcome(conjureResolved.natRoll || 1);
                if (conjOutcome.outcome === "fail") {
                  narrative += ` ${actor.name} attempts ${summonName} but the conjuration fails (roll ${conjureResolved.natRoll}).`;
                  pushCombatLogUnique(newState, { turn: newState.turn, actor: actor.name, action: "conjure", target: "self", damage: 0, nat: conjureResolved.natRoll, rollTier: conjureResolved.rollTier, narrative, timestamp: Date.now() });
                  return;
                }
                const summonId = `summon_${summonName.replace(/\s+/g, "_").toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
                const baseLevel = Math.max(1, actor.level ? Math.floor(actor.level / 2) : 1);
                const level = Math.max(1, Math.floor(baseLevel * conjOutcome.multiplier));
                const baseHealth = effect.baseHealth || 30;
                const hpPerLevel = effect.hpPerLevel || 11;
                const maxHealth = Math.max(8, Math.floor((baseHealth + level * hpPerLevel) * conjOutcome.multiplier));
                const companion = {
                  id: summonId,
                  name: summonName,
                  type: looksLikeAnimal(summonName) ? "beast" : "humanoid",
                  level,
                  maxHealth,
                  currentHealth: maxHealth,
                  armor: Math.max(1, Math.floor((effect.baseArmor || 5) * conjOutcome.multiplier)),
                  damage: Math.max(1, Math.floor((effect.baseDamage || 6 + level) * conjOutcome.multiplier)),
                  abilities: [{ id: `${summonId}_attack`, name: `${summonName} Attack`, type: "melee", damage: Math.max(2, Math.floor(level * 2 * conjOutcome.multiplier)), cost: 0, description: "Summoned minion attack" }],
                  behavior: "support",
                  xpReward: 0,
                  loot: [],
                  isCompanion: true,
                  companionMeta: { companionId: summonId, autoLoot: false, autoControl: true, isSummon: true },
                  description: `${summonName} (conjured by ${actor.name}, roll ${conjureResolved.natRoll} \u2014 ${conjOutcome.outcome})`
                };
                newState.allies = [...newState.allies || [], companion];
                if (conjOutcome.extraSummons > 0) {
                  for (let i = 0; i < conjOutcome.extraSummons; i++) {
                    const extraId = `${summonId}_x${i}`;
                    const extraLevel = Math.max(1, Math.floor(level * 0.6));
                    const extraMaxHealth = Math.max(4, Math.floor((baseHealth + extraLevel * hpPerLevel) * conjOutcome.multiplier * 0.6));
                    const extra = { ...companion, id: extraId, name: `${summonName} (Lesser)`, level: extraLevel, maxHealth: extraMaxHealth, currentHealth: extraMaxHealth, description: `${summonName} (lesser)` };
                    newState.allies.push(extra);
                  }
                }
                newState.pendingSummons = [...newState.pendingSummons || [], { companionId: companion.id, turnsRemaining: Math.max(1, effect.duration || 1), playerTurnsRemaining: Math.max(1, effect.playerTurns || effect.duration || 3) }];
                narrative += ` ${companion.name} appears to aid you (roll ${conjureResolved.natRoll} \u2014 ${conjOutcome.outcome}).`;
                pushCombatLogUnique(newState, { turn: newState.turn, actor: actor.name, action: "conjure", target: "self", damage: 0, nat: conjureResolved.natRoll, rollTier: conjureResolved.rollTier, narrative, timestamp: Date.now() });
                newState.allies = [...newState.allies || [], companion];
                const playerIndex = newState.turnOrder.indexOf("player");
                if (playerIndex >= 0) {
                  const before = newState.turnOrder.slice(0, playerIndex + 1);
                  const after = newState.turnOrder.slice(playerIndex + 1);
                  newState.turnOrder = [...before, companion.id, ...after];
                } else {
                  newState.turnOrder = [...newState.turnOrder, companion.id];
                }
                companion.companionMeta = { ...companion.companionMeta || {}, companionId: companion.id, autoLoot: false, autoControl: companion.companionMeta?.autoControl ?? true };
                const turns = Math.max(1, effect.duration || 3);
                newState.pendingSummons = [...newState.pendingSummons || [], { companionId: companion.id, turnsRemaining: turns }];
                narrative += ` ${summonName} joins the fight to aid you for ${turns} turns!`;
              } else if (effect.duration) {
                if (!targetIsAlly && enemyIndex >= 0) {
                  newState.enemies[enemyIndex].activeEffects = [
                    ...newState.enemies[enemyIndex].activeEffects || [],
                    { effect, turnsRemaining: effect.duration }
                  ];
                } else if (targetIsAlly && allyIndex >= 0) {
                  newState.allies = [...newState.allies || []];
                  newState.allies[allyIndex] = {
                    ...newState.allies[allyIndex],
                    activeEffects: [
                      ...newState.allies[allyIndex]?.activeEffects || [],
                      { effect, turnsRemaining: effect.duration }
                    ]
                  };
                }
                narrative += ` ${target.name} is affected by ${effect.type}!`;
              }
            }
          });
        }
        pushCombatLogUnique(newState, {
          turn: newState.turn,
          actor: "player",
          action: ability.name,
          target: target.name,
          damage: appliedDamage,
          isCrit: !!isCrit,
          nat: attackResolved.natRoll,
          rollTier: attackResolved.rollTier,
          narrative,
          timestamp: Date.now()
        });
        break;
      }
      case "defend": {
        if (newState.playerGuardUsed) {
          const msg = "You have already used Guard in this combat.";
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "defend", target: "self", damage: 0, narrative: msg, timestamp: Date.now() });
          return { newState, newPlayerStats, narrative: msg, aoeSummary };
        }
        newState.playerGuardUsed = true;
        const perkBonus = character ? getCombatPerkBonus(character, "defendDuration") : 0;
        const duration = Math.min(3, Math.max(1, 1 + (perkBonus || 0)));
        const guardEffect = { effect: { type: "buff", stat: "guard", value: 40, name: "Tactical Guard", description: `40% damage reduction for ${duration} round${duration > 1 ? "s" : ""}`, duration }, turnsRemaining: duration };
        newState.playerActiveEffects = [...newState.playerActiveEffects || [], guardEffect];
        newState.playerDefending = true;
        newState.playerActionCounts = newState.playerActionCounts || {};
        newState.playerActionCounts["defend"] = (newState.playerActionCounts["defend"] || 0) + 1;
        pushCombatLogUnique(newState, {
          turn: newState.turn,
          actor: "player",
          action: "defend",
          narrative: `You assume a guarded stance \u2014 Tactical Guard active for ${duration} round${duration > 1 ? "s" : ""} (40% DR).`,
          timestamp: Date.now()
        });
        break;
      }
      case "flee": {
        if (!newState.fleeAllowed) {
          narrative = "You cannot flee from this battle!";
          break;
        }
        const fleeChance = 50 + playerStats.dodgeChance;
        if (Math.random() * 100 < fleeChance) {
          newState.result = "fled";
          newState.active = false;
          narrative = "You successfully escape from combat!";
          const fleeStart = newState.combatStartTime || Date.now();
          newState.combatElapsedSec = Math.max(0, Math.floor((Date.now() - fleeStart) / 1e3));
        } else {
          narrative = "You failed to escape! The enemies block your path.";
        }
        pushCombatLogUnique(newState, {
          turn: newState.turn,
          actor: "player",
          action: "flee",
          narrative,
          timestamp: Date.now()
        });
        break;
      }
      case "surrender": {
        if (!newState.surrenderAllowed) {
          narrative = "These enemies will not accept your surrender!";
          break;
        }
        newState.result = "surrendered";
        newState.active = false;
        narrative = "You lay down your arms and surrender...";
        const surrenderStart = newState.combatStartTime || Date.now();
        newState.combatElapsedSec = Math.max(0, Math.floor((Date.now() - surrenderStart) / 1e3));
        pushCombatLogUnique(newState, {
          turn: newState.turn,
          actor: "player",
          action: "surrender",
          narrative,
          timestamp: Date.now()
        });
        break;
      }
      case "skip": {
        narrative = "You skip your turn.";
        pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "skip", narrative, timestamp: Date.now() });
        break;
      }
      case "item": {
        if (!itemId || !inventory) {
          narrative = "No item selected or inventory not available!";
          break;
        }
        const itemIndex = inventory.findIndex((it) => it.id === itemId);
        if (itemIndex === -1) {
          narrative = "Item not found in inventory!";
          break;
        }
        const item = inventory[itemIndex];
        if (!item || item.quantity <= 0) {
          narrative = `You don't have any of that item!`;
          break;
        }
        let usedItem;
        if (item.type === "potion") {
          const resolved = resolvePotionEffect(item);
          const amount = resolved.amount ?? item.damage ?? 0;
          if (!resolved.stat || !amount || amount <= 0) {
            narrative = `The ${item.name} has no clear effect.`;
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, narrative, isCrit: false, timestamp: Date.now() });
            break;
          }
          const mod = modifyPlayerCombatStat(newPlayerStats, resolved.stat, amount);
          if (mod.actual > 0) {
            newPlayerStats = mod.newPlayerStats;
            usedItem = { ...item, quantity: item.quantity - 1 };
            narrative = `You use ${item.name} and recover ${mod.actual} ${resolved.stat}.`;
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, damage: 0, narrative, isCrit: false, timestamp: Date.now() });
            return { newState, newPlayerStats, narrative, usedItem, aoeSummary };
          }
          narrative = `The ${item.name} had no effect.`;
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, narrative, isCrit: false, timestamp: Date.now() });
          break;
        }
        if (item.type === "food" || item.type === "drink") {
          const nutrition = getFoodNutrition(item.name);
          const healAmount = nutrition ? Math.floor((nutrition.hungerReduction || 0) / 2) + 10 : 15;
          const actualHeal = Math.min(healAmount, newPlayerStats.maxHealth - newPlayerStats.currentHealth);
          if (actualHeal > 0) {
            newPlayerStats.currentHealth = newPlayerStats.currentHealth + actualHeal;
            usedItem = { ...item, quantity: item.quantity - 1 };
            newState.survivalDelta = newState.survivalDelta || {};
            newState.survivalDelta.hunger = (newState.survivalDelta.hunger || 0) - (nutrition.hungerReduction || 0);
            newState.survivalDelta.thirst = (newState.survivalDelta.thirst || 0) - (nutrition.thirstReduction || 0);
            narrative = `You consume ${item.name} and recover ${actualHeal} health.`;
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, damage: 0, narrative, isCrit: false, timestamp: Date.now() });
            return { newState, newPlayerStats, narrative, usedItem, aoeSummary };
          }
          narrative = `You cannot use ${item.name} right now.`;
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, narrative, isCrit: false, timestamp: Date.now() });
          break;
        }
        narrative = `You cannot use ${item.name} in combat.`;
        newState.playerActionCounts = newState.playerActionCounts || {};
        newState.playerActionCounts["use_item"] = (newState.playerActionCounts["use_item"] || 0) + 1;
        pushCombatLogUnique(newState, { turn: newState.turn, actor: "player", action: "item", target: item.name, narrative, isCrit: false, timestamp: Date.now() });
        break;
      }
    }
    return { newState, newPlayerStats, narrative, aoeSummary };
  };
  var executeEnemyTurn = (state, enemyId, playerStats, natRoll, character) => {
    let newState = { ...state };
    let newPlayerStats = { ...playerStats };
    let narrative = "";
    const aoeSummary = { damaged: [], healed: [] };
    const actor2 = (newState.enemies || []).find((e) => e.id === enemyId) || (newState.allies || []).find((a) => a.id === enemyId);
    if (!actor2 || actor2.currentHealth <= 0) {
      return { newState, newPlayerStats, narrative: "", aoeSummary };
    }
    const isAlly = !!actor2.isCompanion;
    let isStunned = false;
    if (actor2.activeEffects && actor2.activeEffects.length > 0) {
      for (const ae of actor2.activeEffects) {
        if (ae.effect.type === "dot") {
          const dotDamage = ae.effect.value;
          actor2.currentHealth = Math.max(0, actor2.currentHealth - dotDamage);
        } else if (ae.effect.type === "stun" && ae.turnsRemaining > 0) {
          pushCombatLogUnique(newState, {
            turn: newState.turn,
            actor: actor2.name,
            action: "stunned",
            narrative: `${actor2.name} is stunned and cannot act!`,
            timestamp: Date.now()
          });
          isStunned = true;
        }
      }
      actor2.activeEffects = actor2.activeEffects.map((ae) => ({ ...ae, turnsRemaining: ae.turnsRemaining - 1 })).filter((ae) => ae.turnsRemaining > 0);
      if (isStunned) {
        return { newState, newPlayerStats, narrative: `${actor2.name} is stunned and skips their turn.`, aoeSummary };
      }
    }
    let chosenAbility;
    const availableAbilities = (actor2.abilities || []).filter((a) => {
      if ((a.type === "magic" || a.type === "aeo") && actor2.currentMagicka && actor2.currentMagicka < a.cost) return false;
      return true;
    });
    let forceChoice;
    if (actor2.isBoss && (actor2.currentHealth || 0) > 0 && (actor2.currentHealth || 0) / Math.max(1, actor2.maxHealth || 1) < 0.5 && !combatHasActiveSummon(newState)) {
      const conj = availableAbilities.find((a) => (a.effects || []).some((ef) => ef.type === "summon"));
      if (conj) {
        forceChoice = conj;
      }
    }
    const shouldPreferSpells = actor2.type === "undead" || actor2.type === "daedra" || actor2.name.toLowerCase().includes("mage") || actor2.name.toLowerCase().includes("vampire") || actor2.name.toLowerCase().includes("necromancer") || actor2.name.toLowerCase().includes("warlock") || actor2.name.toLowerCase().includes("lich");
    const magicAbilities = availableAbilities.filter((a) => a.type === "magic" || a.type === "aeo");
    const meleeAbilities = availableAbilities.filter((a) => a.type === "melee" || a.type === "ranged");
    const behaviorSource = actor2.behavior || "tactical";
    switch (behaviorSource) {
      case "aggressive":
      case "berserker":
        if (shouldPreferSpells && magicAbilities.length > 0 && Math.random() < 0.7) {
          chosenAbility = magicAbilities.reduce((best, curr) => curr.damage > best.damage ? curr : best, magicAbilities[0]);
        } else {
          chosenAbility = availableAbilities.reduce((best, curr) => curr.damage > best.damage ? curr : best, availableAbilities[0]);
        }
        break;
      case "defensive":
        chosenAbility = availableAbilities.reduce((best, curr) => curr.cost < best.cost ? curr : best, availableAbilities[0]);
        break;
      case "tactical":
        const withEffects = availableAbilities.filter((a) => a.effects && a.effects.length > 0);
        if (shouldPreferSpells && magicAbilities.length > 0 && Math.random() < 0.65) {
          const magicWithEffects = magicAbilities.filter((a) => a.effects && a.effects.length > 0);
          chosenAbility = magicWithEffects.length > 0 && Math.random() > 0.4 ? magicWithEffects[Math.floor(Math.random() * magicWithEffects.length)] : magicAbilities[Math.floor(Math.random() * magicAbilities.length)];
        } else {
          chosenAbility = withEffects.length > 0 && Math.random() > 0.5 ? withEffects[Math.floor(Math.random() * withEffects.length)] : availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        }
        break;
      default:
        if (shouldPreferSpells && magicAbilities.length > 0 && Math.random() < 0.5) {
          chosenAbility = magicAbilities[Math.floor(Math.random() * magicAbilities.length)];
        } else {
          chosenAbility = availableAbilities[Math.floor(Math.random() * availableAbilities.length)];
        }
    }
    if (forceChoice) chosenAbility = forceChoice;
    if (!chosenAbility) {
      chosenAbility = {
        id: "basic",
        name: "Attack",
        type: "melee",
        damage: actor2.damage,
        cost: 0,
        description: "Basic attack"
      };
    }
    newState.lastActorActions = newState.lastActorActions || {};
    const recent = newState.lastActorActions[actor2.id] || [];
    if (availableAbilities.length > 1 && recent[0] && chosenAbility && recent.includes(chosenAbility.id)) {
      const alt = availableAbilities.find((a) => !recent.includes(a.id));
      if (alt) chosenAbility = alt;
    }
    const hasSummonEffect = !!(chosenAbility.effects && chosenAbility.effects.some((ef) => ef.type === "summon"));
    const isHealingAbility = !!(chosenAbility.heal || chosenAbility.effects && chosenAbility.effects.some((ef) => ef.type === "heal"));
    const isUtilityOnly = !!(chosenAbility.effects && chosenAbility.effects.some((ef) => ["buff", "debuff", "slow", "stun", "drain", "dot"].includes(ef.type)) && !(chosenAbility.damage && chosenAbility.damage > 0));
    if (hasSummonEffect) {
      const summonEffects = (chosenAbility.effects || []).filter((ef) => ef.type === "summon");
      let narrativeLocal = `${actor2.name} casts ${chosenAbility.name}`;
      for (const ef of summonEffects) {
        const summonName = ef.name || "Summoned Ally";
        const summonId = `summon_${summonName.replace(/\s+/g, "_").toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
        const level = Math.max(1, actor2.level || 1);
        const maxHealth = 30 + level * 8;
        const companion = {
          id: summonId,
          name: summonName,
          type: looksLikeAnimal(summonName) ? "beast" : "humanoid",
          armor: 5,
          damage: 8 + level,
          maxHealth,
          currentHealth: maxHealth,
          level,
          abilities: [{ id: `${summonId}_attack`, name: `${summonName} Attack`, type: "melee", damage: Math.max(4, Math.floor(level * 2)), cost: 0, description: "Summoned minion attack" }],
          behavior: actor2.isCompanion ? "support" : "aggressive",
          xpReward: 0,
          loot: [],
          isCompanion: actor2.isCompanion ? true : false,
          description: `A summoned ally: ${summonName}`
        };
        if (actor2.isCompanion) {
          newState.allies = [...newState.allies || [], companion];
        } else {
          newState.enemies = [...newState.enemies || [], companion];
        }
        const actorIndex = newState.turnOrder.indexOf(actor2.id);
        if (actorIndex >= 0) {
          const before = newState.turnOrder.slice(0, actorIndex + 1);
          const after = newState.turnOrder.slice(actorIndex + 1);
          newState.turnOrder = [...before, companion.id, ...after];
        } else {
          newState.turnOrder = [...newState.turnOrder, companion.id];
        }
        const turns = Math.max(1, ef.duration || 3);
        newState.pendingSummons = [...newState.pendingSummons || [], { companionId: companion.id, turnsRemaining: turns }];
        narrativeLocal += ` ${summonName} joins the fight for ${turns} turns!`;
      }
      pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: chosenAbility.name, target: actor2.name, damage: 0, narrative: narrativeLocal, timestamp: Date.now() });
      return { newState, newPlayerStats, narrative: narrativeLocal };
    }
    if (isHealingAbility) {
      let healAmount = chosenAbility.heal || 0;
      if (chosenAbility.effects) {
        for (const ef of chosenAbility.effects) {
          if (ef.type === "heal") healAmount += ef.value || 0;
        }
      }
      if (actor2.currentHealth < actor2.maxHealth) {
        const actualHeal = Math.min(healAmount, actor2.maxHealth - actor2.currentHealth);
        actor2.currentHealth = Math.min(actor2.maxHealth, (actor2.currentHealth || 0) + actualHeal);
        pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: chosenAbility.name, target: actor2.name, damage: -actualHeal, narrative: `${actor2.name} heals for ${actualHeal} health.`, timestamp: Date.now() });
        return { newState, newPlayerStats, narrative: `${actor2.name} heals for ${actualHeal} health.`, aoeSummary };
      } else {
        const allies = (actor2.isCompanion ? newState.allies || [] : newState.enemies || []).filter((a) => a.id !== actor2.id && (a.currentHealth || 0) < (a.maxHealth || 1));
        if (allies.length > 0) {
          const targetAlly = allies.sort((a, b) => (a.currentHealth || 0) - (b.currentHealth || 0))[0];
          const allyIndex = (actor2.isCompanion ? newState.allies || [] : newState.enemies || []).findIndex((a) => a.id === targetAlly.id);
          if (allyIndex >= 0) {
            if (actor2.isCompanion) {
              newState.allies = [...newState.allies || []];
              newState.allies[allyIndex] = { ...targetAlly, currentHealth: Math.min(targetAlly.maxHealth, (targetAlly.currentHealth || 0) + healAmount) };
            } else {
              newState.enemies = [...newState.enemies || []];
              newState.enemies[allyIndex] = { ...targetAlly, currentHealth: Math.min(targetAlly.maxHealth, (targetAlly.currentHealth || 0) + healAmount) };
            }
            pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: chosenAbility.name, target: targetAlly.name, damage: -healAmount, narrative: `${actor2.name} heals ${targetAlly.name} for ${healAmount} health.`, timestamp: Date.now() });
            return { newState, newPlayerStats, narrative: `${actor2.name} heals ${targetAlly.name} for ${healAmount} health.`, aoeSummary };
          }
        }
      }
    }
    if (isUtilityOnly) {
      let narrativeLocal = `${actor2.name} uses ${chosenAbility.name}`;
      if (chosenAbility.effects) {
        chosenAbility.effects.forEach((ef) => {
          if (ef.type === "buff") {
            actor2.activeEffects = [...actor2.activeEffects || [], { effect: ef, turnsRemaining: ef.duration || 1 }];
            narrativeLocal += ` and gains ${ef.type}`;
          } else if (["debuff", "dot", "slow", "stun", "drain"].includes(ef.type)) {
            newState.playerActiveEffects = [...newState.playerActiveEffects || [], { effect: ef, turnsRemaining: ef.duration || 1 }];
            narrativeLocal += ` and affects the player with ${ef.type}`;
          }
        });
      }
      pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: chosenAbility.name, target: actor2.name, damage: 0, narrative: narrativeLocal, timestamp: Date.now() });
      return { newState, newPlayerStats, narrative: narrativeLocal };
    }
    const attackBonus = Math.max(0, Math.floor(actor2.damage / 8));
    const resolved = resolveAttack({ attackerLevel: actor2.level, attackBonus, targetArmor: playerStats.armor, targetDodge: playerStats.dodgeChance, critChance: 10, natRoll });
    let appliedDamage = 0;
    let hitLocation = "torso";
    if (!resolved.hit) {
      appliedDamage = 0;
    } else {
      let staminaMultiplier = 1;
      const effectiveCost = adjustAbilityCost(void 0, chosenAbility);
      if (chosenAbility.type === "melee") {
        const avail = actor2.currentStamina || 0;
        if (avail <= 0) staminaMultiplier = 0.25;
        else if (avail < (effectiveCost || 0)) staminaMultiplier = Math.max(0.25, avail / (effectiveCost || 1));
        actor2.currentStamina = Math.max(0, (actor2.currentStamina || 0) - Math.min(effectiveCost || 0, avail));
      } else if (chosenAbility.type === "magic") {
        if (actor2.currentMagicka && actor2.currentMagicka >= (effectiveCost || 0)) {
          actor2.currentMagicka = Math.max(0, actor2.currentMagicka - (effectiveCost || 0));
        }
      }
      const base = (chosenAbility.damage || actor2.damage || 0) * staminaMultiplier;
      const scaledBase = Math.max(1, Math.floor(base));
      const rollRes = computeDamageFromNat(scaledBase, actor2.level, resolved.natRoll, resolved.rollTier, resolved.isCrit);
      hitLocation = rollRes.hitLocation;
      const safePlayerArmor = Number.isFinite(playerStats.armor) ? playerStats.armor : 0;
      const armorReduction = safePlayerArmor / (safePlayerArmor + 100);
      let d = Math.floor(rollRes.damage * (1 - armorReduction));
      if (resolved.isCrit) d = Math.floor(d * 1.25);
      const damageReductionPerk = getCombatPerkBonus(character, "damageReduction");
      if (damageReductionPerk > 0) {
        d = Math.floor(d * (1 - damageReductionPerk / 100));
      }
      appliedDamage = Math.max(0, d);
    }
    if (appliedDamage > 0 && Math.random() * 100 < playerStats.dodgeChance) {
      appliedDamage = 0;
    }
    const guard = (newState.playerActiveEffects || []).find((pe) => pe.effect && (pe.effect.type === "buff" && pe.effect.stat === "guard" || pe.effect.type === "guard") && pe.turnsRemaining > 0);
    if (guard && appliedDamage > 0) {
      const dr = typeof guard.effect.value === "number" ? guard.effect.value : 40;
      appliedDamage = Math.floor(appliedDamage * (1 - dr / 100));
    } else if (newState.playerDefending && appliedDamage > 0) {
      appliedDamage = Math.floor(appliedDamage * 0.5);
    }
    if (isAlly) {
      const target = (newState.enemies || []).find((e) => e.currentHealth > 0);
      if (!target) {
        const noTargetNarrative = `${actor2.name} has no valid targets.`;
        pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: "wait", narrative: noTargetNarrative, timestamp: Date.now() });
        return { newState, newPlayerStats, narrative: noTargetNarrative, aoeSummary };
      }
      let narrativeLocal = `${actor2.name} uses ${chosenAbility.name}`;
      if (!resolved.hit) {
        narrativeLocal += ` and rolls ${resolved.natRoll} (${resolved.rollTier}), missing ${target.name}.`;
      } else {
        let dmg = appliedDamage;
        target.currentHealth = Math.max(0, (target.currentHealth || 0) - dmg);
        narrativeLocal += ` and deals ${dmg} damage to ${target.name}!`;
        if (target.currentHealth <= 0) narrativeLocal += ` ${target.name} is defeated!`;
      }
      pushCombatLogUnique(newState, { turn: newState.turn, actor: actor2.name, action: chosenAbility.name, target: target.name, damage: resolved.hit ? appliedDamage : 0, narrative: narrativeLocal, isCrit: resolved.isCrit, nat: resolved.natRoll, rollTier: resolved.rollTier, timestamp: Date.now() });
      if (chosenAbility.effects && chosenAbility.effects.length > 0) {
        for (const ef of chosenAbility.effects) {
          if (ef.type === "aoe_damage") {
            const aoeVal = ef.value || 0;
            const aoeDamages = [];
            if (ef.aoeTarget === "all_enemies") {
              const playerArmor = Number.isFinite(newPlayerStats.armor) ? newPlayerStats.armor : 0;
              const playerRed = playerArmor / (playerArmor + 100);
              const pd = Math.max(1, Math.floor(aoeVal * (1 - playerRed)));
              newPlayerStats.currentHealth = Math.max(0, (newPlayerStats.currentHealth || 0) - pd);
              aoeDamages.push({ id: "player", name: character && character.name || "You", amount: pd });
              if (newState.allies && newState.allies.length > 0) {
                newState.allies = newState.allies.map((ally) => {
                  if (ally.currentHealth > 0) {
                    const aArmor = Number.isFinite(ally.armor) ? ally.armor : 0;
                    const aRed = aArmor / (aArmor + 100);
                    const ad = Math.max(1, Math.floor(aoeVal * (1 - aRed)));
                    aoeDamages.push({ id: ally.id, name: ally.name, amount: ad });
                    return { ...ally, currentHealth: Math.max(0, (ally.currentHealth || 0) - ad) };
                  }
                  return ally;
                });
              }
            } else if (ef.aoeTarget === "all_allies") {
              if (newState.enemies && newState.enemies.length > 0) {
                newState.enemies = newState.enemies.map((e) => {
                  if (e.currentHealth > 0 && e.currentHealth < e.maxHealth) {
                    const heal = Math.min(ef.value || 0, e.maxHealth - e.currentHealth);
                    aoeDamages.push({ id: e.id, name: e.name, amount: heal });
                    return { ...e, currentHealth: Math.min(e.maxHealth, e.currentHealth + (ef.value || 0)) };
                  }
                  return e;
                });
              }
            }
            aoeSummary.damaged = aoeSummary.damaged || [];
            aoeSummary.damaged.push(...aoeDamages);
          } else if (ef.type === "aoe_heal") {
            const aoeHeals = [];
            if (ef.aoeTarget === "all_allies") {
              if (newState.enemies && newState.enemies.length > 0) {
                newState.enemies = newState.enemies.map((e) => {
                  if (e.currentHealth > 0 && e.currentHealth < e.maxHealth) {
                    const heal = Math.min(ef.value || 0, e.maxHealth - e.currentHealth);
                    aoeHeals.push({ id: e.id, name: e.name, amount: heal });
                    return { ...e, currentHealth: Math.min(e.maxHealth, e.currentHealth + (ef.value || 0)) };
                  }
                  return e;
                });
              }
            } else if (ef.aoeTarget === "all_enemies") {
              const ph = Math.min(ef.value || 0, newPlayerStats.maxHealth - (newPlayerStats.currentHealth || 0));
              if (ph > 0) {
                newPlayerStats.currentHealth = Math.min(newPlayerStats.maxHealth, (newPlayerStats.currentHealth || 0) + (ef.value || 0));
                aoeHeals.push({ id: "player", name: character && character.name || "You", amount: ph });
              }
              if (newState.allies && newState.allies.length > 0) {
                newState.allies = newState.allies.map((ally) => {
                  if (ally.currentHealth > 0 && ally.currentHealth < ally.maxHealth) {
                    const ah = Math.min(ef.value || 0, ally.maxHealth - ally.currentHealth);
                    aoeHeals.push({ id: ally.id, name: ally.name, amount: ah });
                    return { ...ally, currentHealth: Math.min(ally.maxHealth, ally.currentHealth + (ef.value || 0)) };
                  }
                  return ally;
                });
              }
            }
            aoeSummary.healed = aoeSummary.healed || [];
            aoeSummary.healed.push(...aoeHeals);
          }
        }
      }
      const anyAlive = (newState.enemies || []).some((e) => e.currentHealth > 0);
      if (!anyAlive) {
        newState.result = "victory";
        newState.active = false;
      }
      return { newState, newPlayerStats, narrative: narrativeLocal, aoeSummary };
    }
    const aliveAllies = (newState.allies || []).filter((a) => a.currentHealth > 0);
    narrative = "";
    let targetedAlly = null;
    if (aliveAllies.length > 0) {
      const criticallyLow = aliveAllies.filter((a) => (a.currentHealth || 0) / Math.max(1, a.maxHealth || 1) < 0.3);
      const injuredComparedToPlayer = aliveAllies.filter((a) => (a.currentHealth || 0) < playerStats.currentHealth);
      const behaviorChanceMap = {
        berserker: 0.7,
        aggressive: 0.6,
        tactical: 0.45,
        defensive: 0.25,
        default: 0.35
      };
      const baseChance = behaviorChanceMap[actor2.behavior || "default"] ?? behaviorChanceMap.default;
      if (criticallyLow.length > 0) {
        const critChance = Math.min(0.95, baseChance + 0.35);
        if (Math.random() < critChance) targetedAlly = criticallyLow[Math.floor(Math.random() * criticallyLow.length)];
      }
      if (!targetedAlly && injuredComparedToPlayer.length > 0) {
        if (Math.random() < baseChance) targetedAlly = injuredComparedToPlayer[Math.floor(Math.random() * injuredComparedToPlayer.length)];
      }
    }
    const healthScale = Math.max(1, Math.floor((playerStats.maxHealth || 100) / 200));
    const levelScale = 1 + (actor2.level || 1) * 0.02;
    appliedDamage = Math.max(0, Math.floor(appliedDamage * healthScale * levelScale));
    if (targetedAlly) {
      const allyIndex = (newState.allies || []).findIndex((a) => a.id === targetedAlly.id);
      if (allyIndex >= 0) {
        newState.allies = [...newState.allies || []];
        newState.allies[allyIndex] = { ...targetedAlly, currentHealth: Math.max(0, (targetedAlly.currentHealth || 0) - appliedDamage) };
        if (resolved.isCrit && Math.random() < 0.5) {
          const stunEffect = { effect: { type: "stun", value: 1, duration: 1 }, turnsRemaining: 1 };
          newState.allies[allyIndex].activeEffects = [...newState.allies[allyIndex].activeEffects || [], stunEffect];
        }
      }
      if (!resolved.hit) {
        narrative = `${actor2.name} uses ${chosenAbility.name} and rolls ${resolved.natRoll} (${resolved.rollTier}), missing ${targetedAlly.name}.`;
      } else if (appliedDamage === 0) {
        narrative = `${actor2.name} attacks ${targetedAlly.name} but deals no damage.`;
      } else {
        narrative = `${actor2.name} uses ${chosenAbility.name} and deals ${appliedDamage} damage to ${targetedAlly.name}!`;
        if (resolved.isCrit) {
          narrative = `${actor2.name} lands a CRITICAL HIT on ${targetedAlly.name} with ${chosenAbility.name} for ${appliedDamage} damage!`;
          if ((newState.allies || [])[allyIndex]?.activeEffects?.some((e) => e.effect.type === "stun" && e.turnsRemaining > 0)) {
            narrative += ` ${targetedAlly.name} is STUNNED!`;
          }
        }
      }
      pushCombatLogUnique(newState, {
        turn: newState.turn,
        actor: actor2.name,
        action: chosenAbility.name,
        target: targetedAlly.name,
        damage: appliedDamage,
        isCrit: !!resolved.isCrit,
        nat: resolved.natRoll,
        rollTier: resolved.rollTier,
        narrative,
        timestamp: Date.now()
      });
      return { newState, newPlayerStats, narrative, aoeSummary };
    }
    newPlayerStats.currentHealth = Math.max(0, newPlayerStats.currentHealth - appliedDamage);
    let playerStunned = false;
    if (resolved.isCrit && appliedDamage > 0 && Math.random() < 0.5) {
      const stunEffect = { effect: { type: "stun", value: 1, duration: 1 }, turnsRemaining: 1 };
      newState.playerActiveEffects = [...newState.playerActiveEffects || [], stunEffect];
      playerStunned = true;
    }
    const avoidDeathHeal = getCombatPerkBonus(character, "avoidDeath");
    const avoidDeathUsed = newState.avoidDeathUsed || false;
    const healthPercentAfterDamage = newPlayerStats.currentHealth / newPlayerStats.maxHealth;
    if (avoidDeathHeal > 0 && !avoidDeathUsed && healthPercentAfterDamage < 0.1 && newPlayerStats.currentHealth > 0) {
      newPlayerStats.currentHealth = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + avoidDeathHeal);
      newState.avoidDeathUsed = true;
      narrative += ` Your Restoration mastery triggers, automatically healing you for ${avoidDeathHeal} health!`;
    }
    narrative = `${actor2.name} uses ${chosenAbility.name}`;
    if (!resolved.hit) {
      narrative += ` and rolls ${resolved.natRoll} (${resolved.rollTier}), missing you.`;
    } else if (appliedDamage === 0) {
      narrative += ` but you avoid the attack!`;
    } else {
      narrative += ` and deals ${appliedDamage} damage to your ${hitLocation}!`;
      if (resolved.isCrit) {
        narrative = `${actor2.name} lands a CRITICAL HIT with ${chosenAbility.name} for ${appliedDamage} damage!`;
        if (playerStunned) narrative += ` You are STUNNED!`;
      }
    }
    if (newPlayerStats.currentHealth <= 0) {
      narrative += ` You have been defeated...`;
      newState.result = "defeat";
      newState.active = false;
    }
    pushCombatLogUnique(newState, {
      turn: newState.turn,
      actor: actor2.name,
      action: chosenAbility.name,
      target: "player",
      damage: appliedDamage,
      isCrit: !!resolved.isCrit,
      nat: resolved.natRoll,
      rollTier: resolved.rollTier,
      narrative,
      timestamp: Date.now()
    });
    newState.lastActorActions[actor2.id] = [chosenAbility.id, ...newState.lastActorActions[actor2.id] || []].slice(0, 4);
    return { newState, newPlayerStats, narrative, aoeSummary };
  };
  var skipActorTurn = (state, actorId) => {
    const newState = { ...state };
    const isPlayer = actorId === "player";
    let actorLabel = actorId;
    if (!isPlayer) {
      const ally = (newState.allies || []).find((a) => a.id === actorId);
      if (ally) actorLabel = ally.name;
      else {
        const enemy = (newState.enemies || []).find((e) => e.id === actorId);
        if (enemy) actorLabel = enemy.name;
      }
    }
    const narrative = isPlayer ? "You skip your turn." : `${actorLabel} skips their turn.`;
    pushCombatLogUnique(newState, { turn: newState.turn, actor: isPlayer ? "player" : actorLabel, action: "skip", target: "", damage: 0, narrative, timestamp: Date.now() });
    return newState;
  };
  var executeCompanionAction = (state, allyId, abilityId, targetId, natRoll, isAuto) => {
    let newState = { ...state };
    const ally = (newState.allies || []).find((a) => a.id === allyId);
    if (!ally) return { newState, narrative: "Companion not found", success: false };
    const compStunned = (ally.activeEffects || []).some((e) => e.effect && e.effect.type === "stun" && e.turnsRemaining > 0);
    if (compStunned) {
      ally.activeEffects = (ally.activeEffects || []).map((ae) => ({ ...ae, turnsRemaining: (ae.turnsRemaining || 0) - 1 })).filter((ae) => ae.turnsRemaining > 0);
      const sn = `${ally.name} is stunned and skips their turn.`;
      pushCombatLogUnique(newState, { turn: newState.turn, actor: ally.name, action: "stunned", narrative: sn, timestamp: Date.now() });
      return { newState, narrative: sn, success: false };
    }
    const ability = ally.abilities.find((a) => a.id === abilityId) || ally.abilities[0];
    if (!ability) return { newState, narrative: `${ally.name} has no usable abilities.`, success: false };
    const isOffensive = !!(ability.damage && ability.damage > 0) || (ability.effects || []).some((ef) => ["aoe_damage", "dot", "damage"].includes(ef.type));
    if (targetId) {
      if (targetId === "player") {
        if (isOffensive) return { newState, narrative: "This ability cannot target allies or the player.", success: false };
      }
      const allyTarget = (newState.allies || []).find((a) => a.id === targetId);
      if (allyTarget && isOffensive) {
        return { newState, narrative: "This ability cannot target allies.", success: false };
      }
    }
    const target = targetId ? newState.enemies.find((e) => e.id === targetId) : newState.enemies.find((e) => e.currentHealth > 0);
    if (!target) return { newState, narrative: "No valid enemy target", success: false };
    const attackBonus = Math.max(0, Math.floor((ally.damage || 4) / 8));
    const resolved = resolveAttack({ attackerLevel: ally.level, attackBonus, targetArmor: target.armor, critChance: 5, natRoll });
    if (!resolved.hit) {
      const narrative2 = `${ally.name} misses ${target.name} with ${ability.name}.`;
      pushCombatLogUnique(newState, { turn: newState.turn, actor: ally.name, action: ability.name, target: target.name, damage: 0, narrative: narrative2, timestamp: Date.now(), auto: !!isAuto });
      return { newState, narrative: narrative2, success: true };
    }
    const { damage } = computeDamageFromNat(ability.damage || ally.damage || 4, ally.level, resolved.natRoll, resolved.rollTier, resolved.isCrit);
    const armorReduction = target.armor / (target.armor + 100);
    const applied = Math.max(1, Math.floor(damage * (1 - armorReduction)));
    const enemyIndex = newState.enemies.findIndex((e) => e.id === target.id);
    if (enemyIndex >= 0) {
      newState.enemies = [...newState.enemies];
      newState.enemies[enemyIndex] = { ...target, currentHealth: Math.max(0, target.currentHealth - applied) };
    }
    let narrative = `${ally.name} uses ${ability.name} and deals ${applied} damage to ${target.name}.`;
    pushCombatLogUnique(newState, { turn: newState.turn, actor: ally.name, action: ability.name, target: target.name, damage: applied, narrative, isCrit: resolved.isCrit, nat: resolved.natRoll, rollTier: resolved.rollTier, timestamp: Date.now(), auto: !!isAuto });
    const anyAlive = (newState.enemies || []).some((e) => e.currentHealth > 0);
    if (!anyAlive) {
      newState.result = "victory";
      newState.active = false;
    }
    return { newState, narrative, success: true };
  };
  var advanceTurn = (state) => {
    let newState = { ...state };
    newState = normalizeSummonedCompanions(newState);
    const currentIndex = newState.turnOrder.indexOf(newState.currentTurnActor);
    let nextIndex = (currentIndex + 1) % newState.turnOrder.length;
    while (nextIndex !== currentIndex) {
      const nextActor = newState.turnOrder[nextIndex];
      if (nextActor === "player") break;
      const nextEnemy = (newState.enemies || []).find((e) => e.id === nextActor);
      const nextAlly = (newState.allies || []).find((a) => a.id === nextActor);
      const isAliveActor = nextEnemy && nextEnemy.currentHealth > 0 || nextAlly && nextAlly.currentHealth > 0;
      if (isAliveActor) break;
      nextIndex = (nextIndex + 1) % newState.turnOrder.length;
    }
    newState.currentTurnActor = newState.turnOrder[nextIndex];
    if (nextIndex <= currentIndex || nextIndex === 0) {
      newState.turn++;
      Object.keys(newState.abilityCooldowns).forEach((key) => {
        if (newState.abilityCooldowns[key] > 0) {
          newState.abilityCooldowns[key]--;
        }
      });
      if (newState.pendingSummons && newState.pendingSummons.length) {
        const updated = newState.pendingSummons.map((s) => ({ ...s, playerTurnsRemaining: s.playerTurnsRemaining ? s.playerTurnsRemaining - 1 : (s.turnsRemaining || 0) - 1 }));
        try {
          console.debug("[combat] pendingSummons updated", updated.map((u) => ({ companionId: u.companionId, remaining: u.playerTurnsRemaining })));
        } catch (e) {
        }
        const newlyExpired = updated.filter((s) => s.playerTurnsRemaining <= 0).map((s) => s.companionId);
        try {
          console.debug("[combat] newlyExpired", newlyExpired);
        } catch (e) {
        }
        for (const id of newlyExpired) {
          const ally = (newState.allies || []).find((a) => a.id === id);
          if (ally && ally.companionMeta?.isSummon) {
            ally.companionMeta = { ...ally.companionMeta || {}, decayActive: true };
            ally.activeEffects = [...ally.activeEffects || [], { effect: { type: "debuff", name: "Decaying", description: "This summoned ally is decaying and will lose 50% health each player turn.", duration: -1 }, turnsRemaining: -1 }];
          }
        }
        newState.pendingSummons = updated.filter((s) => s.playerTurnsRemaining > 0).map((s) => ({ companionId: s.companionId, turnsRemaining: s.turnsRemaining, playerTurnsRemaining: s.playerTurnsRemaining }));
        if (newlyExpired.length) {
          pushCombatLogUnique(newState, { turn: newState.turn, actor: "system", action: "summon_degrade", narrative: `Some summoned allies begin to decay and will lose 50% health each player turn.`, timestamp: Date.now() });
        }
      }
    }
    return newState;
  };
  var checkCombatEnd = (state, playerStats) => {
    const newState = { ...state };
    newState.enemies = (newState.enemies || []).map((e) => {
      const isDead = (e.currentHealth || 0) <= 0;
      const combat_state = e.combat_state || (isDead ? "dead" : "still_hostile");
      const health_state = e.health_state || (isDead ? "dead" : (e.currentHealth || 0) < (e.maxHealth || 1) * 0.5 ? "wounded" : "healthy");
      const morale_state = e.morale_state || "steady";
      const finalCombatState = isDead ? "dead" : combat_state;
      const finalHealthState = isDead ? "dead" : health_state;
      return { ...e, combat_state: finalCombatState, health_state: finalHealthState, morale_state };
    });
    const anyStillHostile = (newState.enemies || []).some((e) => {
      const cs = e.combat_state || ((e.currentHealth || 0) <= 0 ? "dead" : "still_hostile");
      return cs === "still_hostile";
    });
    if (!anyStillHostile) {
      newState.active = false;
      newState.lootPending = true;
      newState.result = "victory";
      const xp = newState.enemies.reduce((sum, e) => sum + (e.xpReward || 0), 0);
      const gold = newState.enemies.reduce((sum, e) => sum + (e.goldReward || 0), 0);
      const pendingLoot = [];
      const items = [];
      newState.enemies.forEach((enemy) => {
        const enemyLoot = { enemyId: enemy.id, enemyName: enemy.name, loot: [] };
        enemy.loot?.forEach((lootItem) => {
          if (Math.random() * 100 < (lootItem.dropChance || 0)) {
            const found = { name: lootItem.name, type: lootItem.type, description: lootItem.description, quantity: lootItem.quantity, rarity: lootItem.rarity };
            enemyLoot.loot.push(found);
            items.push({ name: lootItem.name, type: lootItem.type, description: lootItem.description, quantity: lootItem.quantity });
          }
        });
        if (enemyLoot.loot.length > 0) pendingLoot.push(enemyLoot);
      });
      newState.pendingRewards = { xp, gold, items };
      newState.pendingLoot = pendingLoot;
      try {
        const autoLooters = (newState.enemies || []).filter((e) => e.isCompanion && e.companionMeta?.autoLoot);
        if (autoLooters.length > 0 && newState.pendingLoot && newState.pendingLoot.length > 0) {
          newState.pendingLoot.forEach((pl) => {
            pl.loot.forEach((item) => {
              const looter = autoLooters[Math.floor(Math.random() * autoLooters.length)];
              if (!looter) return;
              newState.pendingRewards = newState.pendingRewards || { xp: 0, gold: 0, items: [] };
              newState.pendingRewards.items = newState.pendingRewards.items || [];
              newState.pendingRewards.items.push({ name: item.name, type: item.type, description: item.description, quantity: item.quantity });
              pushCombatLogUnique(newState, { turn: newState.turn, actor: "system", action: "auto_loot", narrative: `${looter.name} auto-looted ${item.name} from ${pl.enemyName}.`, timestamp: Date.now() });
            });
          });
        }
      } catch (e) {
        console.warn("Auto-loot processing failed:", e);
      }
      const start = newState.combatStartTime || Date.now();
      const elapsedSec = Math.max(0, Math.floor((Date.now() - start) / 1e3));
      newState.combatElapsedSec = elapsedSec;
      const hungerPerMinute = 1 / 180;
      const thirstPerMinute = 1 / 120;
      const fatiguePerMinute = 1 / 90;
      const minutes = elapsedSec / 60;
      const hungerInc = Math.round(minutes * hungerPerMinute * 10) / 10;
      const thirstInc = Math.round(minutes * thirstPerMinute * 10) / 10;
      const fatigueInc = Math.round(minutes * fatiguePerMinute * 10) / 10;
      newState.survivalDelta = {
        hunger: hungerInc,
        thirst: thirstInc,
        fatigue: fatigueInc
      };
      pushCombatLogUnique(newState, {
        turn: newState.turn,
        actor: "system",
        action: "loot_phase",
        narrative: `All enemies defeated \u2014 enter loot phase.`,
        timestamp: Date.now()
      });
    }
    if (playerStats.currentHealth <= 0) {
      newState.result = "defeat";
      newState.active = false;
      pushCombatLogUnique(newState, {
        turn: newState.turn,
        actor: "system",
        action: "defeat",
        narrative: "You have been defeated...",
        timestamp: Date.now()
      });
      const start = newState.combatStartTime || Date.now();
      const elapsedSec = Math.max(0, Math.floor((Date.now() - start) / 1e3));
      newState.combatElapsedSec = elapsedSec;
      const hungerPerMinute = 1 / 180;
      const thirstPerMinute = 1 / 120;
      const fatiguePerMinute = 1 / 90;
      const minutes = elapsedSec / 60;
      newState.survivalDelta = {
        hunger: Math.round(minutes * hungerPerMinute * 10) / 10,
        thirst: Math.round(minutes * thirstPerMinute * 10) / 10,
        fatigue: Math.round(minutes * fatiguePerMinute * 10) / 10
      };
    }
    try {
      if (newState.pendingSummons && newState.pendingSummons.length) {
        const alivePending = newState.pendingSummons.filter((s) => {
          const ally = (newState.allies || []).find((a) => a.id === s.companionId);
          const playerTurns = s.playerTurnsRemaining !== void 0 ? s.playerTurnsRemaining : s.turnsRemaining;
          if (!playerTurns || playerTurns <= 0) return false;
          if (!ally) return true;
          return (ally.currentHealth || 0) > 0;
        });
        if (alivePending.length !== newState.pendingSummons.length) {
          newState.pendingSummons = alivePending.map((s) => ({ companionId: s.companionId, turnsRemaining: s.turnsRemaining, playerTurnsRemaining: s.playerTurnsRemaining }));
        }
      }
      if (newState.allies && newState.allies.length) {
        newState.allies = newState.allies.map((a) => {
          if (a.companionMeta?.isSummon && (a.currentHealth || 0) <= 0) {
            const meta = { ...a.companionMeta };
            delete meta.decayActive;
            meta.isSummon = false;
            const filteredEffects = (a.activeEffects || []).filter((ae) => !(ae.effect && ae.effect.name && ae.effect.name.toLowerCase().includes("decay")));
            pushCombatLogUnique(newState, { turn: newState.turn, actor: "system", action: "summon_removed", narrative: `${a.name} has been defeated and is no longer active. You may summon again.`, timestamp: Date.now() });
            return { ...a, companionMeta: meta, activeEffects: filteredEffects };
          }
          return a;
        });
      }
    } catch (e) {
      console.warn("[combat] cleanup dead summons failed", e);
    }
    return newState;
  };
  var applyTurnRegen = (state, playerStats, secondsPerTurn = 4) => {
    let newPlayerStats = { ...playerStats };
    const multiplier = secondsPerTurn;
    const beforeHealth = newPlayerStats.currentHealth || 0;
    const beforeMagicka = newPlayerStats.currentMagicka || 0;
    const beforeStamina = newPlayerStats.currentStamina || 0;
    const nh = Math.min(newPlayerStats.maxHealth, newPlayerStats.currentHealth + Math.round((newPlayerStats.regenHealthPerSec || 0) * multiplier));
    const nm = Math.min(newPlayerStats.maxMagicka, newPlayerStats.currentMagicka + Math.round((newPlayerStats.regenMagickaPerSec || 0) * multiplier));
    const ns = Math.min(newPlayerStats.maxStamina, newPlayerStats.currentStamina + Math.round((newPlayerStats.regenStaminaPerSec || 0) * multiplier));
    newPlayerStats.currentHealth = nh;
    newPlayerStats.currentMagicka = nm;
    newPlayerStats.currentStamina = ns;
    const newState = { ...state };
    try {
      const deltaH = Math.max(0, (newPlayerStats.currentHealth || 0) - beforeHealth);
      const deltaM = Math.max(0, (newPlayerStats.currentMagicka || 0) - beforeMagicka);
      const deltaS = Math.max(0, (newPlayerStats.currentStamina || 0) - beforeStamina);
      const parts = [];
      if (deltaH > 0) parts.push(`${deltaH} health`);
      if (deltaM > 0) parts.push(`${deltaM} magicka`);
      if (deltaS > 0) parts.push(`${deltaS} stamina`);
      if (parts.length > 0) {
        const narrative = `You recover ${parts.join(", ")}.`;
        const entry = {
          turn: newState.turn,
          actor: "system",
          action: "regen",
          narrative,
          timestamp: Date.now()
        };
        pushCombatLogUnique(newState, entry);
      }
    } catch (e) {
      console.warn("[combat] regen log failed", e);
    }
    return { newState, newPlayerStats };
  };
  var BASE_ENEMY_TEMPLATES = {
    bandit: {
      baseName: "Bandit",
      type: "humanoid",
      baseLevel: 5,
      baseHealth: 50,
      baseArmor: 15,
      baseDamage: 12,
      behaviors: ["aggressive", "tactical", "defensive"],
      possibleAbilities: [
        { id: "slash", name: "Slash", type: "melee", damage: 12, cost: 10, description: "A quick slash" },
        { id: "stab", name: "Stab", type: "melee", damage: 14, cost: 12, description: "A precise thrust" },
        { id: "bash", name: "Shield Bash", type: "melee", damage: 8, cost: 5, description: "Shield bash", effects: [{ type: "stun", value: 1, duration: 1, chance: 20 }] },
        { id: "throw_dagger", name: "Throw Dagger", type: "ranged", damage: 10, cost: 8, description: "Throw a concealed dagger" },
        { id: "dirty_trick", name: "Dirty Trick", type: "melee", damage: 6, cost: 5, description: "Throw sand in eyes", effects: [{ type: "debuff", stat: "damage", value: -5, duration: 2, chance: 40 }] },
        { id: "desperate_strike", name: "Desperate Strike", type: "melee", damage: 18, cost: 20, description: "A reckless powerful attack" }
      ],
      baseXP: 25,
      baseGold: 15,
      possibleLoot: [
        { name: "Iron Sword", type: "weapon", description: "A common iron sword", quantity: 1, dropChance: 20, damage: 8, slot: "weapon" },
        { name: "Iron Dagger", type: "weapon", description: "A simple iron dagger", quantity: 1, dropChance: 25, damage: 5, slot: "weapon" },
        { name: "Leather Armor", type: "apparel", description: "Basic leather armor", quantity: 1, dropChance: 15, armor: 12, slot: "chest" },
        { name: "Fur Boots", type: "apparel", description: "Worn fur boots", quantity: 1, dropChance: 20, armor: 3, slot: "feet" },
        { name: "Lockpick", type: "misc", description: "A lockpick", quantity: 2, dropChance: 35 },
        { name: "Ale", type: "drink", description: "Cheap ale", quantity: 1, dropChance: 40 },
        { name: "Bread", type: "food", description: "Stale bread", quantity: 1, dropChance: 30 }
      ]
    },
    wolf: {
      baseName: "Wolf",
      type: "beast",
      baseLevel: 3,
      baseHealth: 30,
      baseArmor: 5,
      baseDamage: 10,
      behaviors: ["aggressive", "berserker"],
      possibleAbilities: [
        { id: "bite", name: "Bite", type: "melee", damage: 10, cost: 5, description: "A vicious bite" },
        { id: "pounce", name: "Pounce", type: "melee", damage: 15, cost: 15, description: "Leap and attack", effects: [{ type: "stun", value: 1, duration: 1, chance: 15 }] },
        { id: "savage_bite", name: "Savage Bite", type: "melee", damage: 14, cost: 12, description: "A tearing bite", effects: [{ type: "dot", stat: "health", value: 2, duration: 2, chance: 30 }] },
        { id: "howl", name: "Howl", type: "melee", damage: 0, cost: 10, description: "A terrifying howl", effects: [{ type: "debuff", stat: "damage", value: -3, duration: 2, chance: 25 }] }
      ],
      baseXP: 15,
      possibleLoot: [
        { name: "Wolf Pelt", type: "misc", description: "A wolf pelt", quantity: 1, dropChance: 80 },
        { name: "Raw Meat", type: "food", description: "Raw wolf meat", quantity: 1, dropChance: 60 },
        { name: "Wolf Fang", type: "ingredient", description: "A sharp wolf fang", quantity: 1, dropChance: 40 }
      ]
    },
    skeleton: {
      baseName: "Skeleton",
      type: "undead",
      baseLevel: 6,
      baseHealth: 40,
      baseArmor: 20,
      baseDamage: 14,
      behaviors: ["defensive", "tactical"],
      weaknesses: ["fire", "blunt"],
      resistances: ["frost", "poison"],
      possibleAbilities: [
        { id: "bone_strike", name: "Bone Strike", type: "melee", damage: 14, cost: 10, description: "Strike with bony limbs" },
        { id: "bone_claw", name: "Bone Claw", type: "melee", damage: 12, cost: 8, description: "Slash with sharp bone claws" },
        { id: "rattle", name: "Bone Rattle", type: "melee", damage: 0, cost: 5, description: "An unsettling rattle", effects: [{ type: "debuff", stat: "damage", value: -4, duration: 1, chance: 35 }] },
        { id: "bone_throw", name: "Bone Throw", type: "ranged", damage: 8, cost: 6, description: "Throw a bone shard" }
      ],
      baseXP: 30,
      possibleLoot: [
        { name: "Bone Meal", type: "ingredient", description: "Ground bones", quantity: 1, dropChance: 70 },
        { name: "Ancient Coin", type: "misc", description: "An old coin from a past era", quantity: 1, dropChance: 25 },
        { name: "Tattered Cloth", type: "misc", description: "Rotting burial cloth", quantity: 1, dropChance: 40 }
      ]
    },
    draugr: {
      baseName: "Draugr",
      type: "undead",
      baseLevel: 8,
      baseHealth: 70,
      baseArmor: 30,
      baseDamage: 18,
      behaviors: ["tactical", "defensive", "aggressive"],
      weaknesses: ["fire"],
      resistances: ["frost"],
      possibleAbilities: [
        { id: "ancient_blade", name: "Ancient Blade", type: "melee", damage: 18, cost: 15, description: "Strike with an ancient Nord weapon" },
        { id: "frost_breath", name: "Frost Breath", type: "magic", damage: 20, cost: 20, description: "Breathe frost", effects: [{ type: "debuff", stat: "stamina", value: -15, duration: 2 }] },
        { id: "disarm_shout", name: "Disarm Shout", type: "magic", damage: 5, cost: 25, description: "A thu'um that weakens", effects: [{ type: "debuff", stat: "damage", value: -8, duration: 2, chance: 50 }] },
        { id: "shield_wall", name: "Shield Wall", type: "melee", damage: 0, cost: 15, description: "Raise ancient shield", effects: [{ type: "buff", stat: "armor", value: 15, duration: 2 }] },
        { id: "cleave", name: "Cleave", type: "melee", damage: 22, cost: 18, description: "A sweeping axe strike" },
        // SKY-52: Additional spell abilities for variety
        { id: "ice_spike", name: "Ice Spike", type: "magic", damage: 16, cost: 18, description: "A shard of ice pierces through" },
        { id: "frostcloak", name: "Frost Cloak", type: "magic", damage: 8, cost: 25, description: "Surrounds self with frost, damaging nearby foes", effects: [{ type: "aoe_damage", value: 8, duration: 2, aoeTarget: "all_enemies" }] },
        { id: "unrelenting_force", name: "Unrelenting Force", type: "magic", damage: 12, cost: 30, description: "A powerful shout that staggers", effects: [{ type: "stun", value: 1, duration: 1, chance: 40 }] }
      ],
      baseXP: 50,
      baseGold: 25,
      possibleLoot: [
        { name: "Ancient Nord Sword", type: "weapon", description: "An ancient Nord blade", quantity: 1, dropChance: 25, damage: 12, slot: "weapon" },
        { name: "Ancient Nord War Axe", type: "weapon", description: "A weathered Nord axe", quantity: 1, dropChance: 20, damage: 14, slot: "weapon" },
        { name: "Linen Wrap", type: "misc", description: "Burial wrappings", quantity: 2, dropChance: 60 },
        { name: "Draugr Bones", type: "ingredient", description: "Ancient bones", quantity: 1, dropChance: 45 },
        { name: "Ancient Nord Helmet", type: "apparel", description: "A dented Nord helmet", quantity: 1, dropChance: 15, armor: 15, slot: "head" }
      ]
    },
    frost_spider: {
      baseName: "Frostbite Spider",
      type: "beast",
      baseLevel: 7,
      baseHealth: 55,
      baseArmor: 10,
      baseDamage: 16,
      behaviors: ["aggressive", "tactical"],
      resistances: ["frost"],
      weaknesses: ["fire"],
      possibleAbilities: [
        { id: "bite", name: "Venomous Bite", type: "melee", damage: 16, cost: 10, description: "A poisonous bite", effects: [{ type: "dot", stat: "health", value: 4, duration: 3, chance: 50 }] },
        { id: "web", name: "Web Spray", type: "ranged", damage: 5, cost: 15, description: "Spray sticky web", effects: [{ type: "debuff", stat: "stamina", value: -20, duration: 2 }] },
        { id: "lunge", name: "Lunge", type: "melee", damage: 18, cost: 14, description: "A sudden lunge attack" },
        { id: "spit_venom", name: "Spit Venom", type: "ranged", damage: 10, cost: 12, description: "Spit corrosive venom", effects: [{ type: "dot", stat: "health", value: 3, duration: 2, chance: 60 }] }
      ],
      baseXP: 35,
      possibleLoot: [
        { name: "Frostbite Venom", type: "ingredient", description: "Potent spider venom", quantity: 1, dropChance: 60 },
        { name: "Spider Egg", type: "ingredient", description: "A spider egg", quantity: 2, dropChance: 40 },
        { name: "Webbing", type: "misc", description: "Strong spider silk", quantity: 1, dropChance: 50 }
      ]
    },
    troll: {
      baseName: "Troll",
      type: "beast",
      baseLevel: 14,
      baseHealth: 150,
      baseArmor: 25,
      baseDamage: 30,
      behaviors: ["aggressive", "berserker"],
      weaknesses: ["fire"],
      possibleAbilities: [
        { id: "slam", name: "Slam", type: "melee", damage: 30, cost: 15, description: "A powerful slam attack" },
        { id: "rend", name: "Rend", type: "melee", damage: 25, cost: 12, description: "Tear with claws", effects: [{ type: "dot", stat: "health", value: 5, duration: 3, chance: 40 }] },
        { id: "regenerate", name: "Regenerate", type: "melee", damage: 0, cost: 20, description: "Troll regeneration", effects: [{ type: "heal", stat: "health", value: 20 }] },
        { id: "frenzy", name: "Frenzy", type: "melee", damage: 35, cost: 25, description: "A frenzied assault", cooldown: 2 }
      ],
      baseXP: 100,
      possibleLoot: [
        { name: "Troll Fat", type: "ingredient", description: "Greasy troll fat", quantity: 1, dropChance: 80 },
        { name: "Troll Skull", type: "misc", description: "A massive troll skull", quantity: 1, dropChance: 30 }
      ]
    },
    bear: {
      baseName: "Bear",
      type: "beast",
      baseLevel: 10,
      baseHealth: 100,
      baseArmor: 20,
      baseDamage: 25,
      behaviors: ["aggressive", "berserker", "defensive"],
      possibleAbilities: [
        { id: "swipe", name: "Swipe", type: "melee", damage: 25, cost: 12, description: "A powerful claw swipe" },
        { id: "maul", name: "Maul", type: "melee", damage: 35, cost: 20, description: "A devastating maul attack", effects: [{ type: "dot", stat: "health", value: 4, duration: 2, chance: 35 }] },
        { id: "roar", name: "Roar", type: "melee", damage: 0, cost: 10, description: "A terrifying roar", effects: [{ type: "debuff", stat: "stamina", value: -15, duration: 2, chance: 50 }] },
        { id: "charge", name: "Charge", type: "melee", damage: 30, cost: 18, description: "A charging attack", effects: [{ type: "stun", value: 1, duration: 1, chance: 30 }] }
      ],
      baseXP: 70,
      possibleLoot: [
        { name: "Bear Pelt", type: "misc", description: "A thick bear pelt", quantity: 1, dropChance: 85 },
        { name: "Bear Claws", type: "ingredient", description: "Sharp bear claws", quantity: 2, dropChance: 60 },
        { name: "Raw Meat", type: "food", description: "Raw bear meat", quantity: 2, dropChance: 70 }
      ]
    },
    sabre_cat: {
      baseName: "Sabre Cat",
      type: "beast",
      baseLevel: 12,
      baseHealth: 80,
      baseArmor: 15,
      baseDamage: 28,
      behaviors: ["aggressive", "tactical"],
      possibleAbilities: [
        { id: "bite", name: "Sabre Bite", type: "melee", damage: 28, cost: 10, description: "A vicious bite with massive fangs" },
        { id: "pounce", name: "Pounce", type: "melee", damage: 35, cost: 18, description: "A leaping pounce attack", effects: [{ type: "stun", value: 1, duration: 1, chance: 25 }] },
        { id: "claw_swipe", name: "Claw Swipe", type: "melee", damage: 24, cost: 12, description: "Quick claw attack", effects: [{ type: "dot", stat: "health", value: 3, duration: 2, chance: 30 }] },
        { id: "rake", name: "Rake", type: "melee", damage: 20, cost: 8, description: "A raking attack with hind claws" }
      ],
      baseXP: 80,
      possibleLoot: [
        { name: "Sabre Cat Pelt", type: "misc", description: "A prized sabre cat pelt", quantity: 1, dropChance: 85 },
        { name: "Sabre Cat Tooth", type: "ingredient", description: "A massive fang", quantity: 2, dropChance: 70 },
        { name: "Eye of Sabre Cat", type: "ingredient", description: "A cat eye", quantity: 1, dropChance: 40 }
      ]
    },
    vampire: {
      baseName: "Vampire",
      type: "undead",
      baseLevel: 15,
      baseHealth: 90,
      baseArmor: 35,
      baseDamage: 25,
      behaviors: ["tactical", "defensive", "aggressive"],
      weaknesses: ["fire", "sunlight"],
      resistances: ["frost", "poison"],
      possibleAbilities: [
        { id: "drain_life", name: "Drain Life", type: "magic", damage: 25, cost: 20, description: "Drain the life force", effects: [{ type: "heal", stat: "health", value: 15 }] },
        { id: "vampiric_claw", name: "Vampiric Claw", type: "melee", damage: 22, cost: 12, description: "A clawed strike" },
        { id: "ice_spike", name: "Ice Spike", type: "magic", damage: 28, cost: 25, description: "A spike of ice", effects: [{ type: "debuff", stat: "stamina", value: -10, duration: 2 }] },
        { id: "invisibility", name: "Cloak of Shadows", type: "magic", damage: 0, cost: 30, description: "Become harder to hit", effects: [{ type: "buff", stat: "armor", value: 25, duration: 2 }] },
        { id: "raise_zombie", name: "Raise Zombie", type: "magic", damage: 0, cost: 35, description: "Summon undead aid", effects: [{ type: "summon", name: "Thrall", value: 1, duration: 3 }] },
        // SKY-52: Additional spell abilities for variety
        { id: "vampiric_grip", name: "Vampiric Grip", type: "magic", damage: 20, cost: 28, description: "Telekinetically grasp and drain the target", effects: [{ type: "stun", value: 1, duration: 1, chance: 30 }] },
        { id: "life_drain_aoe", name: "Mass Drain", type: "magic", damage: 15, cost: 40, description: "Drains life from all nearby foes", effects: [{ type: "aoe_damage", value: 15, aoeTarget: "all_enemies" }, { type: "heal", stat: "health", value: 20 }] },
        // New AeO hybrid: damages enemies and heals allies (unlockable via spells)
        // AeO family — hybrid AoE damage + ally heal (high-cost, magical)
        { id: "aeonic_pulse", name: "Aeonic Pulse", type: "aeo", damage: 10, cost: 38, description: "A focused pulse of aeonic energy (lesser).", effects: [{ type: "aoe_damage", value: 10, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 8, aoeTarget: "all_allies" }] },
        { id: "aeonic_surge", name: "Aeonic Surge", type: "aeo", damage: 18, cost: 45, description: "A burst of aeonic energy that wounds enemies while restoring allies.", effects: [{ type: "aoe_damage", value: 18, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 14, aoeTarget: "all_allies" }] },
        { id: "aeonic_wave", name: "Aeonic Wave", type: "aeo", damage: 26, cost: 60, cooldown: 3, description: "A sweeping aeonic wave \u2014 high power, long cooldown.", effects: [{ type: "aoe_damage", value: 26, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 22, aoeTarget: "all_allies" }] },
        // Enemy-only corrupted variant (higher damage, no ally heal)
        { id: "necrotic_aeon", name: "Necrotic Aeon", type: "aeo", damage: 30, cost: 55, description: "A corrupted aeonic eruption that favors damage over restoration.", effects: [{ type: "aoe_damage", value: 30, aoeTarget: "all_enemies" }] },
        { id: "frost_cloak", name: "Frost Cloak", type: "magic", damage: 10, cost: 22, description: "A swirling cloak of frost", effects: [{ type: "dot", stat: "health", value: 5, duration: 2, chance: 100 }] }
      ],
      baseXP: 120,
      baseGold: 50,
      possibleLoot: [
        { name: "Vampire Dust", type: "ingredient", description: "Ashes of the undead", quantity: 1, dropChance: 90 },
        { name: "Soul Gem (Petty)", type: "misc", description: "A small soul gem", quantity: 1, dropChance: 35 },
        { name: "Vampire Robes", type: "apparel", description: "Dark enchanted robes", quantity: 1, dropChance: 25, armor: 20, slot: "chest" },
        { name: "Health Potion", type: "potion", description: "Restores health", quantity: 1, dropChance: 40 }
      ]
    },
    mage: {
      baseName: "Hostile Mage",
      type: "humanoid",
      baseLevel: 10,
      baseHealth: 60,
      baseArmor: 10,
      baseDamage: 20,
      behaviors: ["tactical", "defensive"],
      resistances: ["magic"],
      possibleAbilities: [
        { id: "firebolt", name: "Firebolt", type: "magic", damage: 25, cost: 20, description: "A bolt of fire" },
        { id: "ice_spike", name: "Ice Spike", type: "magic", damage: 22, cost: 18, description: "A spike of ice" },
        { id: "lightning", name: "Lightning Bolt", type: "magic", damage: 28, cost: 25, description: "A bolt of lightning", effects: [{ type: "drain", stat: "magicka", value: 10 }] },
        { id: "ward", name: "Lesser Ward", type: "magic", damage: 0, cost: 15, description: "A protective ward", effects: [{ type: "buff", stat: "armor", value: 20, duration: 2 }] },
        { id: "flames", name: "Flames", type: "magic", damage: 15, cost: 10, description: "A stream of fire", effects: [{ type: "dot", stat: "health", value: 3, duration: 2, chance: 40 }] },
        // SKY-52: Additional AoE and spell abilities
        { id: "fireball", name: "Fireball", type: "magic", damage: 30, cost: 35, description: "An explosive ball of fire that damages all foes", effects: [{ type: "aoe_damage", value: 20, aoeTarget: "all_enemies" }] },
        { id: "aeonic_pulse", name: "Aeonic Pulse", type: "aeo", damage: 10, cost: 38, description: "A focused pulse of aeonic energy (lesser).", effects: [{ type: "aoe_damage", value: 10, aoeTarget: "all_enemies" }, { type: "aoe_heal", value: 8, aoeTarget: "all_allies" }] },
        { id: "chain_lightning", name: "Chain Lightning", type: "magic", damage: 25, cost: 30, description: "Lightning that arcs to nearby foes", effects: [{ type: "aoe_damage", value: 12, aoeTarget: "all_enemies" }, { type: "drain", stat: "magicka", value: 8 }] },
        { id: "heal_other", name: "Heal Other", type: "magic", damage: 0, cost: 25, description: "Heals an ally", heal: 25 },
        { id: "paralyze", name: "Paralyze", type: "magic", damage: 5, cost: 40, description: "Paralyzes the target", effects: [{ type: "stun", value: 1, duration: 2, chance: 60 }] }
      ],
      baseXP: 60,
      baseGold: 30,
      possibleLoot: [
        { name: "Filled Petty Soul Gem", type: "misc", description: "A filled soul gem", quantity: 1, dropChance: 45 },
        { name: "Magicka Potion", type: "potion", description: "Restores magicka", quantity: 1, dropChance: 50 },
        { name: "Mage Robes", type: "apparel", description: "Simple mage robes", quantity: 1, dropChance: 30, armor: 8, slot: "chest" },
        { name: "Spell Tome", type: "misc", description: "A tome of magic", quantity: 1, dropChance: 20 }
      ]
    },
    bandit_chief: {
      baseName: "Bandit Chief",
      type: "humanoid",
      baseLevel: 12,
      baseHealth: 120,
      baseArmor: 50,
      baseDamage: 25,
      behaviors: ["tactical", "aggressive"],
      isBoss: true,
      possibleAbilities: [
        { id: "heavy_strike", name: "Heavy Strike", type: "melee", damage: 25, cost: 15, description: "A powerful two-handed strike" },
        { id: "rally", name: "Rally Cry", type: "melee", damage: 0, cost: 20, description: "Boost attack power", effects: [{ type: "buff", stat: "damage", value: 10, duration: 3 }] },
        { id: "execute", name: "Execution", type: "melee", damage: 40, cost: 30, description: "A devastating finishing blow", cooldown: 3 },
        { id: "intimidate", name: "Intimidate", type: "melee", damage: 0, cost: 15, description: "A terrifying shout", effects: [{ type: "debuff", stat: "damage", value: -8, duration: 2, chance: 60 }] },
        { id: "cleave", name: "Cleave", type: "melee", damage: 30, cost: 20, description: "A sweeping attack" }
      ],
      baseXP: 150,
      baseGold: 100,
      possibleLoot: [
        { name: "Steel Greatsword", type: "weapon", description: "A well-made steel greatsword", quantity: 1, dropChance: 50, damage: 18, slot: "weapon" },
        { name: "Steel Armor", type: "apparel", description: "Heavy steel armor", quantity: 1, dropChance: 40, armor: 35, slot: "chest" },
        { name: "Bandit Chief's Key", type: "key", description: "Opens the chief's treasure chest", quantity: 1, dropChance: 100 },
        { name: "Potion of Ultimate Healing", type: "potion", description: "Restores a lot of health", quantity: 1, dropChance: 60 }
      ]
    }
  };
  var ENEMY_TEMPLATES = Object.fromEntries(
    Object.entries(BASE_ENEMY_TEMPLATES).map(([key, template]) => [
      key,
      {
        name: template.baseName,
        type: template.type,
        level: template.baseLevel,
        maxHealth: template.baseHealth,
        currentHealth: template.baseHealth,
        armor: template.baseArmor,
        damage: template.baseDamage,
        behavior: template.behaviors[0],
        weaknesses: template.weaknesses,
        resistances: template.resistances,
        isBoss: template.isBoss,
        abilities: template.possibleAbilities.slice(0, 3),
        xpReward: template.baseXP,
        goldReward: template.baseGold,
        loot: template.possibleLoot.slice(0, 3)
      }
    ])
  );
  var createEnemyFromTemplate = (templateId, options = {}) => {
    const template = BASE_ENEMY_TEMPLATES[templateId];
    if (!template) {
      throw new Error(`Unknown enemy template: ${templateId}`);
    }
    const { nameOverride, levelModifier = 0, isElite = false, forceUnique = true } = options;
    let name = template.baseName;
    if (forceUnique || Math.random() < 0.7) {
      const prefixes = ENEMY_NAME_PREFIXES[templateId] || ENEMY_NAME_PREFIXES.default;
      const prefix = randomChoice(prefixes);
      name = `${prefix} ${template.baseName}`;
    }
    if (nameOverride) name = nameOverride;
    const baseLevel = template.baseLevel + levelModifier;
    let level;
    if (typeof options.targetLevel === "number") {
      const t = Math.max(1, Math.floor(options.targetLevel));
      level = Math.max(1, randomRange(t - 2, t + 2));
    } else {
      level = Math.max(1, randomRange(baseLevel - 1, baseLevel + 2));
    }
    const levelScale = 1 + (level - template.baseLevel) * 0.1;
    const variance = 0.15;
    const maxHealth = Math.max(10, randomVariation(Math.floor(template.baseHealth * levelScale), variance));
    const armor = Math.max(0, randomVariation(Math.floor(template.baseArmor * levelScale), variance));
    const damage = Math.max(5, randomVariation(Math.floor(template.baseDamage * levelScale), variance));
    const eliteMultiplier = isElite ? 1.5 : 1;
    const finalHealth = Math.floor(maxHealth * eliteMultiplier);
    const finalArmor = Math.floor(armor * eliteMultiplier);
    const finalDamage = Math.floor(damage * eliteMultiplier);
    const behavior = randomChoice(template.behaviors);
    const numAbilities = randomRange(2, Math.min(4, template.possibleAbilities.length));
    const shuffledAbilities = shuffleArray(template.possibleAbilities);
    const selectedAbilities = shuffledAbilities.slice(0, numAbilities).map((ability) => ({
      ...ability,
      // Scale ability damage with level
      damage: Math.max(1, Math.floor(ability.damage * levelScale * (isElite ? 1.2 : 1))),
      // Unique ID for this instance
      id: `${ability.id}_${Math.random().toString(36).substring(2, 7)}`
    }));
    const xpReward = Math.floor(randomVariation(template.baseXP * levelScale, 0.2) * (isElite ? 2 : 1));
    const goldReward = template.baseGold ? Math.floor(randomVariation(template.baseGold * levelScale, 0.3) * (isElite ? 2.5 : 1)) : void 0;
    const loot = template.possibleLoot.map((item) => ({
      ...item,
      dropChance: Math.min(100, item.dropChance + randomRange(-10, 15))
    }));
    const personality = randomChoice(ENEMY_PERSONALITY_TRAITS);
    return {
      id: `${templateId}_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: isElite ? `${name} (Elite)` : name,
      type: template.type,
      level,
      maxHealth: finalHealth,
      currentHealth: finalHealth,
      maxMagicka: template.type === "undead" || templateId === "mage" || templateId === "vampire" ? 50 + level * 5 : void 0,
      currentMagicka: template.type === "undead" || templateId === "mage" || templateId === "vampire" ? 50 + level * 5 : void 0,
      maxStamina: 50 + level * 3,
      currentStamina: 50 + level * 3,
      armor: finalArmor,
      damage: finalDamage,
      behavior,
      weaknesses: template.weaknesses,
      resistances: template.resistances,
      abilities: selectedAbilities,
      isBoss: template.isBoss || isElite,
      xpReward,
      goldReward,
      loot,
      activeEffects: [],
      // Store personality for narrative use
      description: `A ${personality} ${template.baseName.toLowerCase()}`
    };
  };
  var generateEnemyGroup = (templateId, count, options = {}) => {
    const { includeElite = false, levelVariance = 2, uniqueNames = true } = options;
    const usedNames = /* @__PURE__ */ new Set();
    const enemies = [];
    for (let i = 0; i < count; i++) {
      const isThisElite = includeElite && i === 0;
      const levelMod = randomRange(-levelVariance, levelVariance);
      let enemy;
      let attempts = 0;
      do {
        enemy = createEnemyFromTemplate(templateId, {
          levelModifier: levelMod,
          isElite: isThisElite,
          forceUnique: uniqueNames
        });
        attempts++;
      } while (uniqueNames && usedNames.has(enemy.name) && attempts < 10);
      usedNames.add(enemy.name);
      enemies.push(enemy);
    }
    return enemies;
  };
  var generateMixedEncounter = (mainType, mainCount, leaderType) => {
    const enemies = generateEnemyGroup(mainType, mainCount, { uniqueNames: true });
    if (leaderType) {
      const leader = createEnemyFromTemplate(leaderType, { isElite: true });
      enemies.push(leader);
    }
    return enemies;
  };
})();
