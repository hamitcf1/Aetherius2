#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const CHANGELOG_FILE = path.join(ROOT, 'components', 'Changelog.tsx');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const UPDATES_DIR = path.join(ROOT, 'docs', 'updates');
const AGENT_ACTIVITY_DIR = path.join(ROOT, 'docs', 'agent-activity');

function readChangelog() {
  const src = fs.readFileSync(CHANGELOG_FILE, 'utf8');
  // naive regex to find first entry with version and date
  const m = src.match(/\{[\s\S]*?version\s*:\s*['\"](\d+\.\d+\.\d+)['\"][\s\S]*?date\s*:\s*['\"](\d{4}-\d{2}-\d{2})['\"]/);
  if (!m) throw new Error('Failed to parse components/Changelog.tsx — cannot find first entry');
  return { latestVersion: m[1], latestDate: m[2] };
}

function bumpPatch(version) {
  const parts = version.split('.').map(Number);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function listModifiedFilesSince(dateStr) {
  const cutoff = new Date(dateStr + 'T00:00:00Z');
  const results = [];
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist' || e.name === 'docs' && dir.endsWith('docs')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        walk(full);
      } else {
        try {
          const stat = fs.statSync(full);
          if (stat.mtime >= cutoff) {
            results.push(full.replace(ROOT + path.sep, ''));
          }
        } catch (err) { /* ignore */ }
      }
    }
  }
  walk(ROOT);
  return results;
}

function classifyFile(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes('combat') || lower.includes('combatservice')) return 'combat';
  if (lower.includes('feat') || lower.includes('feature')) return 'feature';
  if (lower.includes('fix') || lower.includes('bug')) return 'fix';
  if (lower.match(/\.md$|docs/)) return 'docs';
  return 'improvement';
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function writeAgentActivityLog(dateStr, entries, action, logs, dryRun) {
  ensureDir(AGENT_ACTIVITY_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `${dateStr}-${ts}-${action}.md`;
  const outPath = path.join(AGENT_ACTIVITY_DIR, name);
  const lines = [];
  lines.push(`# Agent activity — ${dateStr} ${ts}`);
  lines.push('');
  lines.push(`**Action:** ${action}`);
  lines.push('');
  lines.push('**Modified files:**');
  for (const e of entries) {
    lines.push(`- **${e.type}**: ${e.path}`);
  }
  lines.push('');
  if (logs && logs.testLog) lines.push(`Test log: \`docs/updates/${path.basename(logs.testLog)}\``);
  if (logs && logs.buildLog) lines.push(`Build log: \`docs/updates/${path.basename(logs.buildLog)}\``);
  if (!dryRun) fs.writeFileSync(outPath, lines.join('\n'));
  return outPath;
}

function updatePackageVersion(newVersion, dryRun) {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf8'));
  const old = pkg.version;
  pkg.version = newVersion;
  if (!dryRun) fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + '\n');
  return { old, new: newVersion };
}

function writeDraft(dateStr, newVersion, entries, dryRun, activityLogPath, isAppend) {
  ensureDir(UPDATES_DIR);
  const outPath = path.join(UPDATES_DIR, `${dateStr}-changelog-draft.md`);
  const lines = [];
  lines.push(`# Changelog draft — ${newVersion} (${dateStr})`);
  lines.push('');
  lines.push('Auto-generated draft. Maintainers must review before committing/publishing.');
  lines.push('');
  if (isAppend) {
    lines.push('**NOTE:** This draft contains additional bullets to be *appended* to the existing changelog entry for today.');
    lines.push('');
  }
  if (activityLogPath) {
    lines.push(`Agent activity log: \`${activityLogPath.replace(/\\/g, '/')}\``);
    lines.push('');
  }
  lines.push('## Summary of changes (by file)');
  lines.push('');
  for (const e of entries) {
    lines.push(`- **${e.type}**: ${e.path}`);
  }
  lines.push('');
  lines.push('---');
  lines.push('\nSuggested commit message: `chore(changelog): publish v' + newVersion + ' — automated draft`');

  if (!dryRun) fs.writeFileSync(outPath, lines.join('\n'));
  return outPath;
}

function runChecks(dryRun, dateStr) {
  if (dryRun) return { ok: true, logs: null };
  ensureDir(UPDATES_DIR);
  const testLog = path.join(UPDATES_DIR, `${dateStr}-test.log`);
  const buildLog = path.join(UPDATES_DIR, `${dateStr}-build.log`);
  let ok = true;
  try {
    execSync('npm test --silent', { stdio: ['ignore', fs.openSync(testLog, 'w'), fs.openSync(testLog, 'w')] });
  } catch (err) { ok = false; }
  try {
    execSync('npm run build --silent', { stdio: ['ignore', fs.openSync(buildLog, 'w'), fs.openSync(buildLog, 'w')] });
  } catch (err) { ok = false; }
  return { ok, logs: { testLog, buildLog } };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || (!args.includes('--apply'));
  const runChecksFlag = args.includes('--run-checks');
  if (process.env.DISABLE_AUTO_CHANGELOG) {
    console.log('DISABLE_AUTO_CHANGELOG is set — aborting automatic draft creation.');
    return;
  }
  const { latestVersion, latestDate } = readChangelog();
  const newVersion = bumpPatch(latestVersion);
  const today = new Date().toISOString().split('T')[0];

  console.log(`Found latest version ${latestVersion} (${latestDate}), proposing ${newVersion} for ${today}`);

  const modified = listModifiedFilesSince(latestDate);
  const entries = modified.map(p => ({ path: p, type: classifyFile(p) }));

  if (entries.length === 0) {
    console.log('No meaningful file changes found since', latestDate, '- nothing to publish.');
    return;
  }

  if (dryRun) {
    console.log('[dry-run] Would update package.json version to', newVersion);
    console.log('[dry-run] Would write draft to', path.join('docs', 'updates', `${today}-changelog-draft.md`));
    console.log('[dry-run] Changed files:');
    entries.forEach(e => console.log(' -', e.type, e.path));
  }

  if (!dryRun) {
    const upd = updatePackageVersion(newVersion, dryRun);
    console.log('Updated package.json version:', upd.old, '->', upd.new);
  }

  // Run checks if requested (do not abort on failure; include logs)
  let checkResults = null;
  if (runChecksFlag) {
    const res = runChecks(dryRun, today);
    checkResults = res;
    if (!res.ok) {
      console.warn('One or more checks failed. Logs saved under docs/updates/. Draft will still be produced for review.');
    } else {
      console.log('Checks passed. Draft ready for maintainer review.');
    }
  } else {
    console.log('Skipped running tests/build. Use --run-checks to enable them.');
  }

  const action = latestDate === today ? 'append' : 'new-entry';
  const activityPath = writeAgentActivityLog(today, entries, action, checkResults ? checkResults.logs : null, dryRun);
  const outPath = writeDraft(today, newVersion, entries, dryRun, activityPath, latestDate === today);
  console.log((dryRun ? '[dry-run] Draft path: ' : 'Draft written: ') + outPath);

}

try {
  main();
} catch (err) {
  console.error('Error:', err && err.message ? err.message : err);
  process.exitCode = 1;
}
