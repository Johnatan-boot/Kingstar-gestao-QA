import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "setIsFormOpen(false);",
  "setIsFormOpen(false);\n      import('react-hot-toast').then(m => m.default.success(editingId ? 'Material atualizado com sucesso!' : 'Material cadastrado com sucesso!'));"
);

code = code.replace(
  "setDeletingId(null);\n      await fetchInventory();",
  "setDeletingId(null);\n      import('react-hot-toast').then(m => m.default.success('Material excluído com sucesso.'));\n      await fetchInventory();"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched toasts in Inventory");
