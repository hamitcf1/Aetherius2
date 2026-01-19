/**
 * Weather Effects Service
 * Dynamic weather system that affects gameplay, survival, and combat
 */

// ============================================================================
// WEATHER TYPES
// ============================================================================

export type WeatherType = 
  | 'clear' | 'cloudy' | 'overcast' | 'foggy' | 'misty'
  | 'rain' | 'light_rain' | 'heavy_rain' | 'thunderstorm'
  | 'snow' | 'light_snow' | 'heavy_snow' | 'blizzard'
  | 'ash_storm' | 'volcanic'; // Solstheim/Morrowind-specific

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'evening' | 'night' | 'midnight';

export interface WeatherCondition {
  type: WeatherType;
  intensity: number; // 0-100
  temperature: number; // Celsius, -40 to +40
  windSpeed: number; // 0-100 km/h
  visibility: number; // 0-100%
  precipitation: number; // 0-100%
}

export interface WeatherEffects {
  // Combat effects
  rangedAccuracyMod: number; // -50 to +10 (% modifier)
  magicCostMod: number; // -20 to +30 (% modifier)
  stealthMod: number; // -30 to +50 (% modifier)
  movementSpeedMod: number; // -40 to +0 (% modifier)
  
  // Survival effects
  warmthDrain: number; // 0-10 per hour
  staminaDrain: number; // 0-5 per hour
  hungerMod: number; // 0.5-2.0 multiplier
  fatigueRate: number; // 0.5-2.0 multiplier
  
  // Ambient
  ambientLight: number; // 0-100%
  soundMod: number; // How much sounds are muffled 0-100%
}

// ============================================================================
// WEATHER DEFINITIONS
// ============================================================================

export const WEATHER_DATA: Record<WeatherType, { 
  name: string; 
  description: string; 
  baseEffects: Partial<WeatherEffects>;
  ambientSounds?: string[];
}> = {
  clear: {
    name: 'Clear Skies',
    description: 'The sky is bright and clear.',
    baseEffects: {
      rangedAccuracyMod: 0,
      stealthMod: -10, // Easier to be seen
      ambientLight: 100,
    },
    ambientSounds: ['birds', 'wind_light'],
  },
  cloudy: {
    name: 'Cloudy',
    description: 'Clouds drift lazily across the sky.',
    baseEffects: {
      rangedAccuracyMod: 0,
      stealthMod: 0,
      ambientLight: 70,
    },
    ambientSounds: ['wind_light'],
  },
  overcast: {
    name: 'Overcast',
    description: 'Heavy clouds block out the sun.',
    baseEffects: {
      rangedAccuracyMod: -5,
      stealthMod: 10,
      ambientLight: 50,
    },
    ambientSounds: ['wind_medium'],
  },
  foggy: {
    name: 'Foggy',
    description: 'A thick fog blankets the land, obscuring vision.',
    baseEffects: {
      rangedAccuracyMod: -25,
      stealthMod: 30,
      ambientLight: 40,
      movementSpeedMod: -5,
    },
    ambientSounds: ['fog_ambient'],
  },
  misty: {
    name: 'Misty',
    description: 'A light mist hangs in the air.',
    baseEffects: {
      rangedAccuracyMod: -10,
      stealthMod: 15,
      ambientLight: 60,
    },
    ambientSounds: ['wind_light'],
  },
  light_rain: {
    name: 'Light Rain',
    description: 'A gentle rain falls from the sky.',
    baseEffects: {
      rangedAccuracyMod: -10,
      stealthMod: 20,
      warmthDrain: 2,
      ambientLight: 60,
      soundMod: 20,
    },
    ambientSounds: ['rain_light'],
  },
  rain: {
    name: 'Rain',
    description: 'Steady rain pours down, soaking everything.',
    baseEffects: {
      rangedAccuracyMod: -20,
      stealthMod: 25,
      warmthDrain: 4,
      movementSpeedMod: -10,
      ambientLight: 45,
      soundMod: 40,
    },
    ambientSounds: ['rain_medium'],
  },
  heavy_rain: {
    name: 'Heavy Rain',
    description: 'A downpour hammers the land relentlessly.',
    baseEffects: {
      rangedAccuracyMod: -35,
      magicCostMod: 10,
      stealthMod: 35,
      warmthDrain: 6,
      movementSpeedMod: -20,
      ambientLight: 30,
      soundMod: 60,
    },
    ambientSounds: ['rain_heavy'],
  },
  thunderstorm: {
    name: 'Thunderstorm',
    description: 'Lightning splits the sky as thunder roars.',
    baseEffects: {
      rangedAccuracyMod: -40,
      magicCostMod: -15, // Storm magic enhanced
      stealthMod: 40,
      warmthDrain: 7,
      movementSpeedMod: -25,
      ambientLight: 25,
      soundMod: 70,
    },
    ambientSounds: ['thunderstorm'],
  },
  light_snow: {
    name: 'Light Snow',
    description: 'Gentle snowflakes drift down from above.',
    baseEffects: {
      rangedAccuracyMod: -10,
      stealthMod: 10,
      warmthDrain: 3,
      ambientLight: 70,
    },
    ambientSounds: ['wind_light', 'snow_crunch'],
  },
  snow: {
    name: 'Snow',
    description: 'Snow falls steadily, blanketing the ground.',
    baseEffects: {
      rangedAccuracyMod: -20,
      stealthMod: 15,
      warmthDrain: 5,
      movementSpeedMod: -15,
      ambientLight: 55,
      soundMod: 30,
    },
    ambientSounds: ['wind_medium', 'snow_crunch'],
  },
  heavy_snow: {
    name: 'Heavy Snow',
    description: 'Thick snow obscures the world around you.',
    baseEffects: {
      rangedAccuracyMod: -30,
      stealthMod: 25,
      warmthDrain: 8,
      movementSpeedMod: -30,
      ambientLight: 40,
      soundMod: 50,
    },
    ambientSounds: ['wind_strong', 'snow_crunch'],
  },
  blizzard: {
    name: 'Blizzard',
    description: 'A howling blizzard rages, making travel treacherous.',
    baseEffects: {
      rangedAccuracyMod: -50,
      magicCostMod: 20, // Cold drains magic
      stealthMod: 50,
      warmthDrain: 10,
      staminaDrain: 3,
      movementSpeedMod: -40,
      fatigueRate: 1.5,
      ambientLight: 20,
      soundMod: 80,
    },
    ambientSounds: ['blizzard'],
  },
  ash_storm: {
    name: 'Ash Storm',
    description: 'Volcanic ash fills the air, choking and blinding.',
    baseEffects: {
      rangedAccuracyMod: -40,
      magicCostMod: 15,
      stealthMod: 35,
      staminaDrain: 2,
      movementSpeedMod: -20,
      fatigueRate: 1.3,
      ambientLight: 30,
      soundMod: 40,
    },
    ambientSounds: ['ash_storm'],
  },
  volcanic: {
    name: 'Volcanic Activity',
    description: 'The ground trembles as nearby volcanoes rumble.',
    baseEffects: {
      rangedAccuracyMod: -20,
      magicCostMod: -10, // Fire magic enhanced
      stealthMod: 20,
      warmthDrain: -3, // Actually warmer
      staminaDrain: 1,
      ambientLight: 50,
      soundMod: 30,
    },
    ambientSounds: ['volcanic_rumble'],
  },
};

// ============================================================================
// REGIONAL WEATHER PATTERNS
// ============================================================================

export type Region = 
  | 'whiterun' | 'falkreath' | 'riften' | 'markarth' | 'solitude'
  | 'windhelm' | 'winterhold' | 'morthal' | 'dawnstar'
  | 'solstheim' | 'blackreach' | 'sovngarde';

export interface RegionalWeather {
  region: Region;
  name: string;
  baseTemperature: number; // Average temp
  weatherProbabilities: Partial<Record<WeatherType, number>>; // Sum to 100
  specialConditions?: string[];
}

export const REGIONAL_WEATHER: Record<Region, RegionalWeather> = {
  whiterun: {
    region: 'whiterun',
    name: 'Whiterun Plains',
    baseTemperature: 12,
    weatherProbabilities: {
      clear: 40,
      cloudy: 25,
      overcast: 15,
      rain: 10,
      light_rain: 10,
    },
  },
  falkreath: {
    region: 'falkreath',
    name: 'Falkreath Forest',
    baseTemperature: 10,
    weatherProbabilities: {
      clear: 20,
      cloudy: 20,
      overcast: 15,
      misty: 15,
      light_rain: 15,
      rain: 10,
      foggy: 5,
    },
    specialConditions: ['perpetual_mist'],
  },
  riften: {
    region: 'riften',
    name: 'The Rift',
    baseTemperature: 8,
    weatherProbabilities: {
      clear: 30,
      cloudy: 25,
      light_rain: 20,
      misty: 15,
      rain: 10,
    },
    specialConditions: ['autumn_leaves'],
  },
  markarth: {
    region: 'markarth',
    name: 'The Reach',
    baseTemperature: 6,
    weatherProbabilities: {
      clear: 25,
      cloudy: 25,
      overcast: 20,
      foggy: 15,
      rain: 10,
      snow: 5,
    },
    specialConditions: ['mountain_winds'],
  },
  solitude: {
    region: 'solitude',
    name: 'Haafingar',
    baseTemperature: 5,
    weatherProbabilities: {
      clear: 20,
      cloudy: 25,
      overcast: 20,
      rain: 15,
      foggy: 10,
      snow: 10,
    },
  },
  windhelm: {
    region: 'windhelm',
    name: 'Eastmarch',
    baseTemperature: -5,
    weatherProbabilities: {
      clear: 15,
      cloudy: 20,
      snow: 25,
      light_snow: 20,
      heavy_snow: 10,
      blizzard: 10,
    },
    specialConditions: ['always_cold'],
  },
  winterhold: {
    region: 'winterhold',
    name: 'Winterhold',
    baseTemperature: -15,
    weatherProbabilities: {
      clear: 10,
      cloudy: 15,
      snow: 25,
      heavy_snow: 25,
      blizzard: 20,
      light_snow: 5,
    },
    specialConditions: ['magical_aurora', 'always_cold'],
  },
  morthal: {
    region: 'morthal',
    name: 'Hjaalmarch',
    baseTemperature: 2,
    weatherProbabilities: {
      foggy: 35,
      misty: 25,
      overcast: 15,
      cloudy: 10,
      rain: 10,
      clear: 5,
    },
    specialConditions: ['swamp_mist', 'will_o_wisp'],
  },
  dawnstar: {
    region: 'dawnstar',
    name: 'The Pale',
    baseTemperature: -10,
    weatherProbabilities: {
      clear: 15,
      cloudy: 20,
      snow: 25,
      heavy_snow: 20,
      blizzard: 15,
      light_snow: 5,
    },
    specialConditions: ['coastal_winds'],
  },
  solstheim: {
    region: 'solstheim',
    name: 'Solstheim',
    baseTemperature: -8,
    weatherProbabilities: {
      ash_storm: 30,
      snow: 20,
      cloudy: 15,
      heavy_snow: 15,
      volcanic: 10,
      clear: 10,
    },
    specialConditions: ['ash_fall', 'volcanic_activity'],
  },
  blackreach: {
    region: 'blackreach',
    name: 'Blackreach',
    baseTemperature: 15, // Underground is consistent
    weatherProbabilities: {
      clear: 100, // No weather underground
    },
    specialConditions: ['underground', 'bioluminescence'],
  },
  sovngarde: {
    region: 'sovngarde',
    name: 'Sovngarde',
    baseTemperature: 20,
    weatherProbabilities: {
      clear: 70,
      misty: 30,
    },
    specialConditions: ['ethereal', 'divine_light'],
  },
};

// ============================================================================
// WEATHER CALCULATION FUNCTIONS
// ============================================================================

/**
 * Generate weather for a region
 */
export const generateWeather = (
  region: Region,
  currentHour: number,
  seed?: number
): WeatherCondition => {
  const regional = REGIONAL_WEATHER[region];
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  
  // Select weather type based on probabilities
  const weatherType = selectWeatherType(regional.weatherProbabilities, random());
  
  // Calculate intensity based on time and randomness
  const intensity = Math.floor(40 + random() * 60);
  
  // Temperature varies by time of day
  const timeModifier = getTemperatureTimeModifier(currentHour);
  const temperature = regional.baseTemperature + timeModifier + (random() * 10 - 5);
  
  // Wind speed varies by weather type
  const windSpeed = calculateWindSpeed(weatherType, intensity, random());
  
  // Visibility based on weather
  const visibility = calculateVisibility(weatherType, intensity);
  
  // Precipitation amount
  const precipitation = calculatePrecipitation(weatherType, intensity);
  
  return {
    type: weatherType,
    intensity,
    temperature: Math.round(temperature),
    windSpeed: Math.round(windSpeed),
    visibility,
    precipitation,
  };
};

/**
 * Get gameplay effects for current weather
 */
export const getWeatherEffects = (weather: WeatherCondition): WeatherEffects => {
  const baseData = WEATHER_DATA[weather.type];
  const base = baseData.baseEffects;
  const intensityMod = weather.intensity / 100;
  
  return {
    rangedAccuracyMod: Math.round((base.rangedAccuracyMod || 0) * intensityMod),
    magicCostMod: Math.round((base.magicCostMod || 0) * intensityMod),
    stealthMod: Math.round((base.stealthMod || 0) * intensityMod),
    movementSpeedMod: Math.round((base.movementSpeedMod || 0) * intensityMod),
    warmthDrain: (base.warmthDrain || 0) * intensityMod,
    staminaDrain: (base.staminaDrain || 0) * intensityMod,
    hungerMod: base.hungerMod || 1,
    fatigueRate: base.fatigueRate || 1,
    ambientLight: base.ambientLight || 100,
    soundMod: base.soundMod || 0,
  };
};

/**
 * Get time of day from hour (0-23)
 */
export const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 14) return 'midday';
  if (hour >= 14 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 20) return 'dusk';
  if (hour >= 20 && hour < 22) return 'evening';
  if (hour >= 22 || hour < 2) return 'night';
  return 'midnight';
};

/**
 * Get ambient light level for time of day
 */
export const getTimeLightLevel = (hour: number): number => {
  const timeOfDay = getTimeOfDay(hour);
  const lightLevels: Record<TimeOfDay, number> = {
    dawn: 40,
    morning: 70,
    midday: 100,
    afternoon: 90,
    dusk: 50,
    evening: 30,
    night: 15,
    midnight: 10,
  };
  return lightLevels[timeOfDay];
};

/**
 * Format weather description for display
 */
export const formatWeatherDescription = (weather: WeatherCondition, hour: number): string => {
  const weatherData = WEATHER_DATA[weather.type];
  const timeOfDay = getTimeOfDay(hour);
  const tempDesc = getTemperatureDescription(weather.temperature);
  
  const timePhrases: Record<TimeOfDay, string> = {
    dawn: 'As dawn breaks',
    morning: 'In the morning light',
    midday: 'Under the midday sun',
    afternoon: 'In the afternoon',
    dusk: 'As dusk falls',
    evening: 'In the evening',
    night: 'Under the night sky',
    midnight: 'In the dead of night',
  };
  
  return `${timePhrases[timeOfDay]}, ${weatherData.description.toLowerCase()} ${tempDesc}`;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = Math.sin(s) * 10000;
    return s - Math.floor(s);
  };
};

const selectWeatherType = (
  probabilities: Partial<Record<WeatherType, number>>,
  roll: number
): WeatherType => {
  let cumulative = 0;
  const rollPercent = roll * 100;
  
  for (const [type, prob] of Object.entries(probabilities)) {
    cumulative += prob || 0;
    if (rollPercent <= cumulative) {
      return type as WeatherType;
    }
  }
  
  return 'clear';
};

const getTemperatureTimeModifier = (hour: number): number => {
  // Coldest at 4am, warmest at 2pm
  const coldestHour = 4;
  const warmestHour = 14;
  const tempRange = 15; // Degrees between coldest and warmest
  
  const hourDiff = Math.abs(hour - warmestHour);
  const normalized = hourDiff > 12 ? 24 - hourDiff : hourDiff;
  
  return tempRange * (1 - normalized / 10) - tempRange / 2;
};

const calculateWindSpeed = (
  weatherType: WeatherType,
  intensity: number,
  random: number
): number => {
  const baseWindSpeeds: Partial<Record<WeatherType, number>> = {
    clear: 10,
    cloudy: 15,
    overcast: 20,
    foggy: 5,
    misty: 8,
    light_rain: 15,
    rain: 25,
    heavy_rain: 40,
    thunderstorm: 60,
    light_snow: 15,
    snow: 25,
    heavy_snow: 45,
    blizzard: 80,
    ash_storm: 50,
    volcanic: 20,
  };
  
  const base = baseWindSpeeds[weatherType] || 10;
  return base * (intensity / 100) + random * 20;
};

const calculateVisibility = (weatherType: WeatherType, intensity: number): number => {
  const baseVisibility: Partial<Record<WeatherType, number>> = {
    clear: 100,
    cloudy: 95,
    overcast: 85,
    foggy: 30,
    misty: 60,
    light_rain: 80,
    rain: 60,
    heavy_rain: 40,
    thunderstorm: 30,
    light_snow: 75,
    snow: 50,
    heavy_snow: 30,
    blizzard: 15,
    ash_storm: 25,
    volcanic: 60,
  };
  
  const base = baseVisibility[weatherType] || 100;
  const intensityReduction = (100 - intensity) / 100 * 20;
  return Math.max(5, base - intensityReduction);
};

const calculatePrecipitation = (weatherType: WeatherType, intensity: number): number => {
  const basePrecip: Partial<Record<WeatherType, number>> = {
    clear: 0,
    cloudy: 0,
    overcast: 0,
    foggy: 5,
    misty: 10,
    light_rain: 30,
    rain: 60,
    heavy_rain: 90,
    thunderstorm: 80,
    light_snow: 20,
    snow: 50,
    heavy_snow: 80,
    blizzard: 95,
    ash_storm: 70,
    volcanic: 10,
  };
  
  const base = basePrecip[weatherType] || 0;
  return Math.round(base * (intensity / 100));
};

const getTemperatureDescription = (temp: number): string => {
  if (temp <= -20) return 'The cold is deadly and biting.';
  if (temp <= -10) return 'The air is bitterly cold.';
  if (temp <= 0) return 'It is freezing cold.';
  if (temp <= 10) return 'The air is cold.';
  if (temp <= 15) return 'It is cool.';
  if (temp <= 25) return 'The temperature is mild.';
  if (temp <= 30) return 'It is warm.';
  return 'The heat is oppressive.';
};

/**
 * Check if weather would prevent travel
 */
export const canTravelInWeather = (weather: WeatherCondition): { canTravel: boolean; reason?: string } => {
  if (weather.type === 'blizzard' && weather.intensity > 80) {
    return { canTravel: false, reason: 'The blizzard is too severe for travel.' };
  }
  if (weather.visibility < 10) {
    return { canTravel: false, reason: 'Visibility is too poor to travel safely.' };
  }
  if (weather.windSpeed > 90) {
    return { canTravel: false, reason: 'The wind is too dangerous for travel.' };
  }
  return { canTravel: true };
};
