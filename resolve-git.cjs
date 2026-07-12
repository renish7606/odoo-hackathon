const fs = require('fs');

function resolveConflicts(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // A simple regex to keep the "Stashed changes" section and remove the "Updated upstream" section.
  // The format is:
  // <<<<<<< Updated upstream
  // [upstream content]
  // =======
  // [stashed content]
  // >>>>>>> Stashed changes
  
  const conflictRegex = /<<<<<<< Updated upstream[\s\S]*?=======\n([\s\S]*?)>>>>>>> Stashed changes\n?/g;
  
  const resolvedContent = content.replace(conflictRegex, (match, stashedContent) => {
    return stashedContent;
  });
  
  fs.writeFileSync(filePath, resolvedContent);
  console.log('Resolved conflicts for ' + filePath);
}

resolveConflicts('src/components/app-shell.tsx');
resolveConflicts('src/lib/transitops-store.tsx');
