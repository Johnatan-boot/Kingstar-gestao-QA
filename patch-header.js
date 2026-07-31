import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '<span className="text-white font-medium">{activeTab}</span>\n          </div>\n          <div className="flex items-center gap-4">',
  '<span className="text-white font-medium">{activeTab}</span>\n          </div>\n          </div>\n          <div className="flex items-center gap-4">'
);
fs.writeFileSync('src/App.tsx', code);
