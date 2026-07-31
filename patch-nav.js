import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace('<nav className="flex-1 p-4 space-y-2">', '<nav className="flex-1 overflow-y-auto p-4 space-y-2">');
fs.writeFileSync('src/App.tsx', code);
