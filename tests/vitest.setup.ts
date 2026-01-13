// Vitest setup: provide lightweight browser globals to make tests deterministic
// This file is loaded before tests run.

// Polyfill a minimal localStorage when not present
if (typeof (globalThis as any).localStorage === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k) || null : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); }
  };
}

// Minimal Audio mock to prevent console errors when components call new Audio()
if (typeof (globalThis as any).Audio === 'undefined') {
  (globalThis as any).Audio = class {
    constructor(_src?: string) { }
    play() { return Promise.resolve(); }
    pause() { }
    addEventListener() { }
    removeEventListener() { }
  } as any;
}

// Optionally mock fetch if needed in tests
if (typeof (globalThis as any).fetch === 'undefined') {
  (globalThis as any).fetch = async () => ({ ok: true, text: async () => '' }) as any;
}

// Useful test helpers available globally
(globalThis as any).__TEST_UTILS = {
  resetLocalStorage: () => { (globalThis as any).localStorage.clear(); }
};
