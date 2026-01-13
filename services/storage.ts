// Minimal storage wrapper to provide safe access to localStorage in browser
// and an in-memory fallback for Node/test environments.

const memory = new Map<string, string>();

const hasLocalStorage = (() => {
  try {
    return typeof globalThis !== 'undefined' && typeof (globalThis as any).localStorage === 'object' && typeof (globalThis as any).localStorage.getItem === 'function';
  } catch (e) {
    return false;
  }
})();

export const storage = {
  getItem(key: string): string | null {
    if (hasLocalStorage) return (globalThis as any).localStorage.getItem(key);
    return memory.has(key) ? (memory.get(key) as string) : null;
  },
  setItem(key: string, value: string) {
    if (hasLocalStorage) return (globalThis as any).localStorage.setItem(key, value);
    memory.set(key, value);
  },
  removeItem(key: string) {
    if (hasLocalStorage) return (globalThis as any).localStorage.removeItem(key);
    memory.delete(key);
  },
  _clearForTests() {
    // Helper to clear fallback memory in tests
    memory.clear();
  }
};
