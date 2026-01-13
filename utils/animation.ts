// Test-friendly wait helper — resolves immediately in test env to make UI tests deterministic.
export const waitMs = (ms: number) => {
  // Node/Vitest sets NODE_ENV='test'
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'test') {
    return Promise.resolve();
  }
  // Also respect Vite's import.meta.env
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mode = (import.meta as any)?.env?.MODE;
    if (mode === 'test') return Promise.resolve();
  } catch (e) {}

  return new Promise(resolve => setTimeout(resolve, ms));
};
