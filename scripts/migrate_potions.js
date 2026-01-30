#!/usr/bin/env node
/**
 * scripts/migrate_potions.js
 *
 * One-off migration helper for offline exports of player/character data.
 * Usage:
 *   node scripts/migrate_potions.js --file data/players.json --out data/players.migrated.json [--dry-run]
 *
 * The script will:
 *  - Scan each object's `inventory` array for potion items and remove unsupported potion types
 *    (cure disease, cure poison, invisibility, resist_*).
 *  - Normalize potion subtypes when possible (health/magicka/stamina) by inferring from the name/description.
 *  - Replace any learned spell id `summon_dremora` with `summon_dremora_lord` in `learnedSpells` arrays.
 *
 * It is intentionally conservative: it does not modify fields other than inventory and learnedSpells
 * and will print a summary of changes. Use --dry-run to preview changes without writing output.
 */

const fs = require('fs');
const path = require('path');

// Minimal argument parser (avoids extra deps)
function parseArgs() {
  const o = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (!a) continue;
    if (a.startsWith('--')) {
      const kv = a.slice(2).split('=');
      o[kv[0]] = kv[1] === undefined ? true : kv[1];
    } else if (a.startsWith('-')) {
      const key = a.slice(1);
      const next = process.argv[i + 1];
      if (next && !next.startsWith('-')) { o[key] = next; i++; } else { o[key] = true; }
    }
  }
  return o;
}
const argv = parseArgs();
const inputFile = argv.file || argv.f;
const outFile = argv.out || argv.o || (inputFile ? inputFile.replace(/(\.json)?$/, '.migrated.json') : null);
const dryRun = !!argv['dry-run'] || !!argv.dry;

if (!inputFile) {
  console.error('Usage: node scripts/migrate_potions.js --file input.json [--out output.json] [--dry-run]');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error('Input file not found:', inputFile);
  process.exit(1);
}

const raw = fs.readFileSync(inputFile, 'utf8');
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON from', inputFile, e.message);
  process.exit(1);
}

if (!Array.isArray(data) && typeof data !== 'object') {
  console.error('Input JSON must be an array or an object (object will be treated as single entry).');
  process.exit(1);
}

const itemsToRemovePredicates = [
  (name, desc) => /cure\s*disease/i.test(name) || /cure\s*disease/i.test(desc),
  (name, desc) => /cure\s*poison/i.test(name) || /cure\s*poison/i.test(desc),
  (name, desc) => /invis|invisibility/i.test(name) || /invis|invisibility/i.test(desc),
  (name, desc) => /resist\s*(fire|frost|shock)/i.test(name) || /resist\s*(fire|frost|shock)/i.test(desc),
];

const inferSubtype = (name = '', desc = '') => {
  const n = (name || '').toLowerCase();
  const d = (desc || '').toLowerCase();
  if (n.includes('magicka') || d.includes('magicka') || n.includes('mana') || d.includes('mana')) return 'magicka';
  if (n.includes('stamina') || d.includes('stamina') || n.includes('endurance') || d.includes('endurance')) return 'stamina';
  if (n.includes('health') || d.includes('health') || n.includes('heal') || d.includes('heal') || n.includes('vitality')) return 'health';
  return null;
};

const isPotion = (it) => it && it.type === 'potion';

const migrateEntry = (entry) => {
  const report = { removedItems: [], normalizedItems: [], spellReplacements: [] };

  // Inventory normalization
  if (Array.isArray(entry.inventory)) {
    const newInv = [];
    for (const it of entry.inventory) {
      if (!it || typeof it !== 'object') { newInv.push(it); continue; }
      if (isPotion(it)) {
        const name = it.name || '';
        const desc = it.description || '';
        const shouldRemove = itemsToRemovePredicates.some(fn => fn(name, desc));
        if (shouldRemove) {
          report.removedItems.push({ name: it.name, reason: 'deprecated_potion' });
          continue; // drop
        }
        // Ensure subtype when possible
        if (!it.subtype) {
          const subtype = inferSubtype(name, desc);
          if (subtype) {
            const copy = Object.assign({}, it, { subtype });
            // If name indicates plentiful/major/grand/ultimate, and no explicit amount, set description accordingly
            const n = (name || '').toLowerCase();
            if ((n.includes('plentiful') || n.includes('major') || n.includes('grand') || n.includes('ultimate'))) {
              // ensure it contains 100 in desc for plentiful
              copy.description = copy.description || '';
              if (!/\b\d+\b/.test(copy.description)) {
                if (subtype === 'health' || subtype === 'magicka' || subtype === 'stamina') {
                  copy.description = `Restores 100 ${subtype}.`;
                }
              }
            }
            report.normalizedItems.push({ old: it, new: copy });
            newInv.push(copy);
            continue;
          }
        }
        // otherwise keep as-is
        newInv.push(it);
      } else {
        newInv.push(it);
      }
    }
    entry.inventory = newInv;
  }

  // Learned spells migration
  if (Array.isArray(entry.learnedSpells)) {
    const newSpells = entry.learnedSpells.map(s => s === 'summon_dremora' ? 'summon_dremora_lord' : s);
    const replaced = entry.learnedSpells.filter(s => s === 'summon_dremora').length;
    if (replaced > 0) {
      report.spellReplacements.push({ replaced });
      entry.learnedSpells = Array.from(new Set(newSpells)); // uniq
    }
  }

  return report;
};

const entries = Array.isArray(data) ? data : [data];
let totalRemoved = 0;
let totalNormalized = 0;
let totalSpellReplacements = 0;
const reports = [];

console.log('Starting migration scan for', entries.length, 'entries');

for (const ent of entries) {
  const r = migrateEntry(ent);
  reports.push(r);
  totalRemoved += r.removedItems.length;
  totalNormalized += r.normalizedItems.length;
  r.spellReplacements.forEach(pr => { totalSpellReplacements += pr.replaced || 0; });
}

console.log('Migration summary:');
console.log('  potion items removed:', totalRemoved);
console.log('  potion items normalized:', totalNormalized);
console.log('  spell ids replaced (summon_dremora → summon_dremora_lord):', totalSpellReplacements);

if (dryRun) {
  console.log('[dry-run] Not writing output.');
  process.exit(0);
}

if (!outFile) {
  console.error('No --out specified and output file could not be inferred. Use --out to supply path.');
  process.exit(1);
}

fs.writeFileSync(outFile, JSON.stringify(Array.isArray(data) ? data : entries[0], null, 2), 'utf8');
console.log('Wrote migrated output to', outFile);
process.exit(0);
