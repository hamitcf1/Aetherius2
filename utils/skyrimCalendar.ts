// Skyrim calendar utilities

export const SKYRIM_MONTHS = [
  { name: 'Morning Star', days: 31 },
  { name: 'Sun\'s Dawn', days: 28 },
  { name: 'First Seed', days: 31 },
  { name: 'Rain\'s Hand', days: 30 },
  { name: 'Second Seed', days: 31 },
  { name: 'Mid Year', days: 30 },
  { name: 'Sun\'s Height', days: 31 },
  { name: 'Last Seed', days: 31 },
  { name: 'Hearthfire', days: 30 },
  { name: 'Frostfall', days: 31 },
  { name: 'Sun\'s Dusk', days: 30 },
  { name: 'Evening Star', days: 31 }
];

// Calculate Skyrim date from day number (starting from Day 1 = 17th Last Seed, 4E 201)
export const getSkyrimCalendarDate = (dayNumber: number): { era: string; year: number; month: string; day: number; monthIndex: number } => {
  // Day 1 = 17th of Last Seed (month index 7), 4E 201
  const startingDay = 17;
  const startingMonthIndex = 7; // Last Seed
  const startingYear = 201;
  const era = "4E";
  
  // Total days since beginning of year (Last Seed 1st would be day 213 of year)
  // Days before Last Seed: 31+28+31+30+31+30+31 = 212
  const daysBeforeLastSeed = SKYRIM_MONTHS.slice(0, startingMonthIndex).reduce((sum, m) => sum + m.days, 0);
  const startingDayOfYear = daysBeforeLastSeed + startingDay; // ~229
  
  // Calculate total days elapsed since start of year 201
  let totalDays = startingDayOfYear + (dayNumber - 1);
  let year = startingYear;
  
  // Handle year overflow
  const daysPerYear = SKYRIM_MONTHS.reduce((sum, m) => sum + m.days, 0); // 365
  while (totalDays > daysPerYear) {
    totalDays -= daysPerYear;
    year++;
  }
  
  // Find month and day
  let remaining = totalDays;
  let monthIndex = 0;
  for (let i = 0; i < SKYRIM_MONTHS.length; i++) {
    if (remaining <= SKYRIM_MONTHS[i].days) {
      monthIndex = i;
      break;
    }
    remaining -= SKYRIM_MONTHS[i].days;
  }
  
  const day = Math.max(1, remaining);
  
  return {
    era,
    year,
    month: SKYRIM_MONTHS[monthIndex].name,
    day,
    monthIndex
  };
};

// Format with ordinal suffix
export const getOrdinalSuffix = (n: number): string => {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
};

// Format full Skyrim date string
export const formatSkyrimDate = (dayNumber: number): string => {
  const date = getSkyrimCalendarDate(dayNumber);
  return `${date.day}${getOrdinalSuffix(date.day)} of ${date.month}, ${date.era} ${date.year}`;
};

// Short format for display
export const formatSkyrimDateShort = (dayNumber: number): string => {
  const date = getSkyrimCalendarDate(dayNumber);
  return `${date.month} ${date.day}, ${date.era} ${date.year}`;
};
