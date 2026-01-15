import { describe, it, expect } from 'vitest';
import { SKYRIM_SKILLS } from '../types';

describe('Skill normalization', () => {
  it('SKYRIM_SKILLS includes Unarmed', () => {
    const names = SKYRIM_SKILLS.map(s => s.name);
    expect(names).toContain('Unarmed');
  });
});