const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replaceRules = [
  // Text colors
  { search: /\btext-(?:slate|zinc|gray)-(?:700|800|900)\b/g, replace: 'text-foreground' },
  { search: /\btext-(?:slate|zinc|gray)-(?:300|400|500|600)\b/g, replace: 'text-muted-foreground' },
  
  // Border colors
  { search: /\bborder-(?:slate|zinc|gray)-(?:100|200|300|700|800|900)\b/g, replace: 'border-border' },
  
  // Divide colors
  { search: /\bdivide-(?:slate|zinc|gray)-(?:100|200|700|800|900)\b/g, replace: 'divide-border' },
  
  // Backgrounds
  { search: /\bbg-(?:slate|zinc|gray)-(?:50|100)\b/g, replace: 'bg-muted' },
  { search: /\bbg-(?:slate|zinc|gray)-(?:800|900|950)\b/g, replace: 'bg-card' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      for (const rule of replaceRules) {
        if (rule.search.test(content)) {
          content = content.replace(rule.search, rule.replace);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Done 2!');
