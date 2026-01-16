# Sample Patch — Add Enemy → Add SFX → Add Loot → Add Test 🛠️

This guide is a concrete, small example showing the end-to-end process for contributing a new enemy with custom SFX and a deterministic loot drop, plus a unit test.

Goal: Add "Frost Hound" enemy which has an ice-bite attack, custom bite SFX (2 variants), a deterministic bone/skin loot drop, and a test that verifies loot generation and that the SFX mapping exists.

1) Add the enemy template

- File: `services/combatService.ts`
- Add to `BASE_ENEMY_TEMPLATES` (example snippet):

```ts
frost_hound: {
  baseName: 'Frost Hound',
  type: 'beast',
  baseLevel: 3,
  baseHealth: 28,
  baseArmor: 4,
  baseDamage: 8,
  behaviors: ['aggressive', 'pack'],
  possibleAbilities: [
    { id: 'bite_ice', name: 'Frost Bite', type: 'melee', damage: 10, element: 'ice', cooldown: 0 },
  ],
  possibleLoot: [
    { name: 'Hound Bone', type: 'material', quantity: 1, dropChance: 1.0 },
    { name: 'Hound Pelt', type: 'material', quantity: 1, dropChance: 0.6 }
  ],
  baseXP: 10
}
```

2) Add SFX files

- Add files under `public/audio/sfx/`:
  - `attack_bite.mp3` (existing common; you may reuse)
  - `attack_bite_2.mp3` (variant)
  - Or add a specific `frost_bite.mp3` + `frost_bite_2.mp3` and map it below.

- Map the SFX (already supported by variantPaths). In `services/audioService.ts` the `attack_bite` effect uses `variantPaths('attack_bite', 2)` by default — add your files and they'll be picked up automatically.

3) Make the loot deterministic (optional)

- If you want the enemy to always drop its `possibleLoot` exactly as written, enable deterministic mode in `featureFlags.ts` (create `deterministicLoot = true`) and update `generateEnemyLoot()` to respect the flag by returning `template.possibleLoot` directly.

4) Add a unit test

- File: `tests/sample_patch.spec.ts`
- Example test (Vitest):

```ts
import { describe, it, expect } from 'vitest';
import { generateEnemyLoot } from '../services/lootService';
import { BASE_ENEMY_TEMPLATES } from '../services/combatService';
import { audioService } from '../services/audioService';

describe('Sample Patch: Frost Hound', () => {
  it('generates the expected deterministic loot and SFX mapping', () => {
    const template = BASE_ENEMY_TEMPLATES['frost_hound'];
    // assume deterministic mode for test
    const loot = generateEnemyLoot(template, { deterministic: true });
    expect(loot.find(i => i.name === 'Hound Bone')).toBeTruthy();

    // Confirm SFX mapping exists (at least one path)
    const paths = audioService.getRegisteredSoundEffectPaths('attack_bite');
    expect(paths.length).toBeGreaterThan(0);
  });
});
```

5) Notes & Best Practices

- Add canonical item stats in `services/itemStats.ts` if you introduce new item names (value, weight, etc.).
- Run tests: `npm test` and verify your new test passes.
- If you added new audio files, test them in a real browser using `demo.sfxTest()` or play via `audioService.playSoundEffectPath('/audio/sfx/attack_bite_2.mp3')` from the console.

---

If you'd like, I can also open a PR with the minimal code changes for the Frost Hound example so you can review and iterate.