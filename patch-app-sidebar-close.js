import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  '<span className="font-bold tracking-tight text-lg">KINGSTAR <span className="text-[var(--color-kingstar-cyan)]">QA</span></span>\n        </div>',
  '<span className="font-bold tracking-tight text-lg">KINGSTAR <span className="text-[var(--color-kingstar-cyan)]">QA</span></span>\n          <button className="lg:hidden ml-auto text-[#5a6a7a] hover:text-white" onClick={() => setIsSidebarOpen(false)}>\n            <X size={20} />\n          </button>\n        </div>'
);
fs.writeFileSync('src/App.tsx', code);
