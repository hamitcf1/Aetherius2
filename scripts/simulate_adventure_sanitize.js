// Simple simulation of Adventure validation + sanitization to demonstrate behavior
// This is a standalone Node script that mimics the sanitize/validation rules applied for Adventure responses.

const MECHANICAL_PATTERNS = [
  /\+\s*\d+\s*(gold|gp|g)\b/gi,
  /gained\s+\d+\s+(gold|gp|g)\b/gi,
  /gained\s+\d+\s+experience\b/gi,
  /\+\s*\d+\s*(xp|experience)\b/gi,
  /you\s+(?:drink|consume|used?)\s+[^\.\,\n]*/gi,
  /regain(?:ed)?\s+\d+\s+(health|hp|stamina|magicka)\b/gi,
  /lost\s+\d+\s+(health|hp|stamina|magicka)\b/gi,
  /\b\d+\s+gold\b/gi
];

function sanitizeNarrative(text) {
  if (!text) return text;
  let s = text;
  let found = [];
  for (const rx of MECHANICAL_PATTERNS) {
    if (rx.test(s)) {
      found.push(rx.toString());
      s = s.replace(rx, function (m) {
        // Replace some with neutral phrasing
        if (/gold|gp|g/i.test(m)) return 'some coin';
        if (/experience|xp/i.test(m)) return 'some experience';
        if (/drink|consume|used?/i.test(m)) return 'you use an item';
        if (/regain|lost/i.test(m)) return 'you feel changed';
        return '';
      });
    }
  }
  // Final cleanup of leftover numeric tokens
  s = s.replace(/\+\d+\b/g, '');
  s = s.replace(/\b\d+\b/g, (m) => (isNaN(Number(m)) ? m : ''));
  return { sanitized: s.trim(), found };
}

function validateGameStateUpdate(resp) {
  const errors = [];
  const sanitized = {};

  // For demo: forbid mechanical fields
  const forbidden = ['goldChange','xpChange','newItems','removedItems','statUpdates','vitalsChange','transactionId'];
  for (const f of forbidden) {
    if (resp[f] !== undefined) {
      errors.push(`${f} is forbidden in Adventure mode`);
    }
  }

  if (resp.narrative) {
    const n = typeof resp.narrative === 'string' ? { title: 'Adventure', content: resp.narrative } : resp.narrative;
    const { sanitized: s, found } = sanitizeNarrative(n.content);
    sanitized.narrative = { title: n.title || 'Adventure', content: s };
    if (found.length) errors.push('Narrative contained mechanical text and was sanitized');
  }

  return { isValid: errors.length === 0, errors, sanitized };
}

// Simulated AI response (malicious/incorrect)
const aiResponse = {
  narrative: {
    title: 'Treasure! ',
    content: 'You find a hidden chest. +50 gold spills into your pockets and you gained 100 experience. You drink a potion and regain 25 health.'
  },
  goldChange: 50,
  xpChange: 100,
  newItems: [{ name: 'Health Potion', quantity: 1 }]
};

console.log('--- Simulated AI Response (raw) ---');
console.log(JSON.stringify(aiResponse, null, 2));

const result = validateGameStateUpdate(aiResponse);

console.log('\n--- Validation Result ---');
console.log('isValid:', result.isValid);
console.log('errors:', JSON.stringify(result.errors, null, 2));
console.log('\n--- Sanitized Output (what the Adventure layer will receive) ---');
console.log(JSON.stringify(result.sanitized, null, 2));

if (result.errors.length > 0) {
  console.log('\nSimulation Note: Mechanical fields were forbidden and narrative numeric deltas were sanitized.');
} else {
  console.log('\nSimulation Note: No mechanical content detected.');
}
