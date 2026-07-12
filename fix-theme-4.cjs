const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replaceRules = [
  { search: /\bdark:text-background\b/g, replace: '' },
  { search: /\btext-background\b/g, replace: 'text-foreground' },
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
console.log('Done 4!');
