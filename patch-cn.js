import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace("function cn(...inputs", "export function cn(...inputs");
fs.writeFileSync('src/App.tsx', code);
console.log("Patched cn function export");
