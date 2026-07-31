import fs from 'fs';

let code = fs.readFileSync('src/components/MovementsView.tsx', 'utf8');
code = code.replace(
  '<RefreshCw size={16} className="rotate-45" />',
  '<X size={20} />'
);

if (!code.includes('import {') || !code.includes('X')) {
  // we might need to make sure X is imported
  code = code.replace(/import {([^}]+)} from 'lucide-react';/, (match, p1) => {
    if (!p1.includes('X')) {
      return `import { ${p1}, X } from 'lucide-react';`;
    }
    return match;
  });
}

fs.writeFileSync('src/components/MovementsView.tsx', code);
