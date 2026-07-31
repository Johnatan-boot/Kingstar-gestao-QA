import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "import { PurchaseRequestsView } from './components/PurchaseRequestsView';",
  "import { PurchaseRequestsView } from './components/PurchaseRequestsView';\nimport { QAView } from './components/QAView';"
);

code = code.replace(
  "{activeTab === 'Solicitações de Compra' && <PurchaseRequestsView onRefreshParent={fetchData} />}",
  "{activeTab === 'Solicitações de Compra' && <PurchaseRequestsView onRefreshParent={fetchData} />}\n              {activeTab === 'Qualidade (QA)' && <QAView items={items} onRefresh={fetchData} />}"
);

code = code.replace(
  "&& activeTab !== 'Solicitações de Compra' && activeTab !== 'Relatórios' && activeTab !== 'Movimentações'",
  "&& activeTab !== 'Solicitações de Compra' && activeTab !== 'Qualidade (QA)' && activeTab !== 'Relatórios' && activeTab !== 'Movimentações'"
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with QAView");
