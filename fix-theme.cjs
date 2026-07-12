const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replaceRules = [
  { search: /\bbg-white\b/g, replace: 'bg-card' },
  { search: /\btext-slate-900\b/g, replace: 'text-foreground' },
  { search: /\btext-slate-500\b/g, replace: 'text-muted-foreground' },
  { search: /\btext-slate-600\b/g, replace: 'text-muted-foreground' },
  { search: /\btext-slate-700\b/g, replace: 'text-foreground' },
  { search: /\bborder-slate-200\b/g, replace: 'border-border' },
  { search: /\bborder-slate-100\b/g, replace: 'border-border' },
  { search: /\bdivide-slate-100\b/g, replace: 'divide-border' },
  { search: /\bdivide-slate-200\b/g, replace: 'divide-border' },
  { search: /\bbg-slate-50\b/g, replace: 'bg-muted' },
  { search: /\bbg-slate-100\b/g, replace: 'bg-muted' },
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
console.log('Done!');
