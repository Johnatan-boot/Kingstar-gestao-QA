import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/rounded-lg w-full max-w-([a-z0-9]+) shadow-2xl flex flex-col/g, "rounded-lg w-full max-w-$1 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto");
fs.writeFileSync('src/App.tsx', code);
