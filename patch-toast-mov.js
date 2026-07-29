import fs from 'fs';

let code = fs.readFileSync('src/components/MovementsView.tsx', 'utf8');
code = code.replace(
  "setIsFormOpen(false);",
  "setIsFormOpen(false);\n      import('react-hot-toast').then(m => m.default.success('Movimentação registrada com sucesso!'));"
);

fs.writeFileSync('src/components/MovementsView.tsx', code);
console.log("Patched toasts in Movements");
