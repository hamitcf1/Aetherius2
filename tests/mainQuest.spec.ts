import { describe, it, expect } from 'vitest';
import { instantiateQuestChain, UNIVERSAL_MAIN } from '../services/mainQuestLines';

describe('Main quest chain instantiation', () => {
  it('creates a per-character chain with first quest active and subsequent locked', () => {
    const charId = 'char_test_1';
    const quests = instantiateQuestChain(UNIVERSAL_MAIN, charId);

    expect(quests.length).toBe(UNIVERSAL_MAIN.quests.length);
    expect(quests[0].status).toBe('active');
    expect(quests[1].status).toBe('locked');

    // IDs should be namespaced to character
    expect(quests[0].id.startsWith(charId)).toBeTruthy();
    // Template linking
    expect(quests[1].prerequisiteId).toBe(UNIVERSAL_MAIN.quests[1].prerequisiteQuestId);
    expect(quests[1].templateId).toBe(UNIVERSAL_MAIN.quests[1].id);
  });
});