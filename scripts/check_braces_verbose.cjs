const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node check_braces_verbose.cjs <file>'); process.exit(2); }
const text = fs.readFileSync(path, 'utf8');
let braces = 0;
const lines = text.split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  let changed = false;
  for (let j=0;j<line.length;j++){
    const ch = line[j];
    if (ch==='{') { braces++; changed = true; }
    else if (ch==='}') { braces--; changed = true; }
  }
  if (changed) console.log('Line', i+1, '->', braces, line.trim().slice(0,200));
}
console.log('FINAL BRACES:', braces);
