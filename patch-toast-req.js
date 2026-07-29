import fs from 'fs';

let code = fs.readFileSync('src/components/PurchaseRequestsView.tsx', 'utf8');
code = code.replace(
  "setIsFormOpen(false);",
  "setIsFormOpen(false);\n      import('react-hot-toast').then(m => m.default.success('Solicitação criada com sucesso!'));"
);

code = code.replace(
  "setReceiveModalOpen(false);",
  "setReceiveModalOpen(false);\n    import('react-hot-toast').then(m => m.default.success('Material recebido no estoque com sucesso!'));"
);

code = code.replace(
  "fetchData();\n      onRefreshParent();\n    } catch (e) {",
  "fetchData();\n      onRefreshParent();\n      import('react-hot-toast').then(m => m.default.success('Status atualizado!'));\n    } catch (e) {"
);

fs.writeFileSync('src/components/PurchaseRequestsView.tsx', code);
console.log("Patched toasts in Requests");
