const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node find_zero_braces.cjs <file>'); process.exit(2); }
const text = fs.readFileSync(path, 'utf8');
let braces = 0;
const lines = text.split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let j=0;j<line.length;j++){
    const ch = line[j];
    if (ch==='{') braces++;
    else if (ch==='}') braces--;
  }
  if (braces===0) console.log('Zero at', i+1);
}
console.log('FINAL BRACES:', braces);
