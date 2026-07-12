const fs = require('fs');
let content = fs.readFileSync('src/routes/auth.tsx', 'utf8');
content = content.replace('!/^\\\\S+@\\\\S+\\\\.\\\\S+$/.test', '!/^\\S+@\\S+\\.\\S+$/.test');
fs.writeFileSync('src/routes/auth.tsx', content);
