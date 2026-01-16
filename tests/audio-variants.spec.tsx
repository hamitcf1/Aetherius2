import { audioService, playSoundEffect } from '../services/audioService';
import '@testing-library/jest-dom';

describe('AudioService variant selection', () => {
  beforeEach(() => {
    audioService.setDebugSfx(true);
    audioService.clearRecentSfxEvents();
  });
  afterEach(() => {
    audioService.setDebugSfx(false);
    audioService.clearRecentSfxEvents();
  });

  test('plays a path from array variant mapping', async () => {
    // Ensure the shield_bash mapping includes at least one path (it does by default)
    // Add a second variant (same path is fine) to simulate multiple variants
    audioService.addSoundEffectVariant('shield_bash', '/audio/sfx/shield_bash.mp3');

    // Play twice to exercise random selection
    playSoundEffect('shield_bash');
    playSoundEffect('shield_bash');

    const events = audioService.getRecentSfxEvents();
    expect(events.length).toBeGreaterThanOrEqual(1);
    const playEvent = events.find(e => e.kind === 'play' || e.kind === 'error' || e.kind === 'skip');
    expect(playEvent).toBeTruthy();
    // path should match one of the registered shield_bash paths (we use _2 variant placeholders)
    const possible = [`/audio/sfx/shield_bash.mp3`, `/audio/sfx/shield_bash_2.mp3`];
    expect(possible.includes((playEvent as any).path || '')).toBe(true);
  });

  test('attack_magic and spell_impact and enemy_death choose among variants', async () => {
    audioService.clearRecentSfxEvents();
    audioService.clearSoundAvailabilityCache();

    playSoundEffect('attack_magic');
    playSoundEffect('spell_impact');
    playSoundEffect('enemy_death');

    const events = audioService.getRecentSfxEvents();
    const playedPaths = events.map(e => (e as any).path).filter(Boolean);

    // Allow any of the variant paths we registered earlier
    const attackMagicOpts = ['/audio/sfx/attack_magic.mp3', '/audio/sfx/attack_magic_2.mp3'];
    const spellImpactOpts = ['/audio/sfx/spell_impact.mp3', '/audio/sfx/spell_impact_2.mp3'];
    const enemyDeathOpts = ['/audio/sfx/enemy_death.mp3', '/audio/sfx/enemy_death_2.mp3'];

    // At least one of the played paths should be in each option set
    expect(playedPaths.some(p => attackMagicOpts.includes(p))).toBe(true);
    expect(playedPaths.some(p => spellImpactOpts.includes(p))).toBe(true);
    expect(playedPaths.some(p => enemyDeathOpts.includes(p))).toBe(true);
  });
});