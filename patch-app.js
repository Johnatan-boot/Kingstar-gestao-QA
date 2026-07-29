import fs from 'fs';

const code = fs.readFileSync('src/App.tsx', 'utf8');
const match = code.match(/function PurchaseRequestsView\(\) \{[\s\S]*?^}$/m);

if (match) {
  let newCode = code.replace(match[0], '');
  // add import
  newCode = newCode.replace("import { MovementsView } from './components/MovementsView';", "import { MovementsView } from './components/MovementsView';\nimport { PurchaseRequestsView } from './components/PurchaseRequestsView';");
  // update usage
  newCode = newCode.replace("<PurchaseRequestsView />", "<PurchaseRequestsView onRefreshParent={fetchData} />");
  fs.writeFileSync('src/App.tsx', newCode);
  console.log("Patched successfully");
} else {
  console.log("Could not find function");
}
