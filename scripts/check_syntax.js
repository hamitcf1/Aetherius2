const fs = require('fs');
const path = process.argv[2];
if (!path) { console.error('Usage: node check_syntax.js <file>'); process.exit(2); }
const text = fs.readFileSync(path, 'utf8');
let braces = 0, parens = 0, brackets = 0, angles = 0;
const lines = text.split(/\r?\n/);
for (let i=0;i<lines.length;i++){
  const line = lines[i];
  for (let j=0;j<line.length;j++){
    const ch = line[j];
    if (ch==='{') braces++;
    else if (ch==='}') braces--;
    else if (ch==='(') parens++;
    else if (ch===')') parens--;
    else if (ch==='[') brackets++;
    else if (ch===']') brackets--;
  }
  if (braces<0 || parens<0 || brackets<0) {
    console.log('Mismatch at line', i+1, 'after processing:', line);
    console.log('counts:', {braces, parens, brackets});
    process.exit(0);
  }
}
console.log('Final counts:', {braces, parens, brackets});
process.exit(0);
