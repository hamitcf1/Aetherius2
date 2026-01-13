// Lightweight logger wrapper to allow suppressing logs in test environments
const shouldLog = () => {
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') return false;
  // Allow explicit override for debug logs
  if (typeof process !== 'undefined' && process.env && process.env.AETHERIUS_DEBUG === '1') return true;
  return true;
};

export const log = {
  debug: (...args: any[]) => { if (shouldLog()) console.debug(...args); },
  info: (...args: any[]) => { if (shouldLog()) console.info(...args); },
  warn: (...args: any[]) => { if (shouldLog()) console.warn(...args); },
  error: (...args: any[]) => { if (shouldLog()) console.error(...args); }
};
