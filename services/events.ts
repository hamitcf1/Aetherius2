type Callback<T> = (payload: T) => void;

export interface CombatResolvedPayload {
  result: 'victory' | 'defeat' | 'fled' | 'surrendered' | string;
  rewards?: any;
  finalVitals?: any;
  timeAdvanceMinutes?: number | null;
  combatResult?: any;
}

const combatSubscribers = new Set<Callback<CombatResolvedPayload>>();

export const subscribeToCombatResolved = (cb: Callback<CombatResolvedPayload>) => {
  combatSubscribers.add(cb);
  return () => combatSubscribers.delete(cb);
};

export const emitCombatResolved = (payload: CombatResolvedPayload) => {
  for (const cb of Array.from(combatSubscribers)) {
    try {
      cb(payload);
    } catch (e) {
      console.warn('[events] subscriber failed:', e);
    }
  }
};

export default {
  subscribeToCombatResolved,
  emitCombatResolved
};