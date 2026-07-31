import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace absolute modals with fixed modals
code = code.replace(/absolute inset-0 bg-black\/80 backdrop-blur-sm z-50 flex items-center justify-center p-6/g, "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6");

fs.writeFileSync('src/App.tsx', code);
