const fs = require('fs');
let c = fs.readFileSync('src/routes/_authenticated.settings.tsx', 'utf8');

// Replace standard theme colors
c = c.replace(/bg-white/g, 'bg-card');
c = c.replace(/border-slate-[12]00/g, 'border-border');
c = c.replace(/text-slate-900/g, 'text-foreground');
c = c.replace(/text-slate-[78]00/g, 'text-foreground');
c = c.replace(/text-slate-[456]00/g, 'text-muted-foreground');
c = c.replace(/text-slate-300/g, 'text-muted-foreground');
c = c.replace(/bg-slate-50\/60/g, 'bg-muted/60');
c = c.replace(/bg-slate-50\/30/g, 'bg-muted/30');
c = c.replace(/bg-slate-50\/80/g, 'bg-muted/80');
c = c.replace(/bg-slate-50/g, 'bg-muted');
c = c.replace(/bg-slate-900/g, 'bg-primary');
c = c.replace(/hover:bg-slate-700/g, 'hover:bg-primary/90');
c = c.replace(/hover:bg-slate-800/g, 'hover:bg-primary/90');
c = c.replace(/ring-slate-900\/20/g, 'ring-ring');

// Fix `useStore` hook
c = c.replace(
  '  const { settings, updateSettings } = useStore();',
  '  const { settings, updateSettings, session } = useStore();'
);

// Include `RefreshCcw` icon from lucide-react if missing
if (!c.includes('RefreshCcw')) {
  c = c.replace('DollarSign, Ruler }', 'DollarSign, Ruler, RefreshCcw }');
}

fs.writeFileSync('src/routes/_authenticated.settings.tsx', c);
console.log('Restored settings theme without cron button');
