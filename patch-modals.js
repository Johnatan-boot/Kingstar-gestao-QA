import fs from 'fs';

const files = [
  'src/components/MovementsView.tsx',
  'src/components/PurchaseRequestsView.tsx',
  'src/components/QAView.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/absolute inset-0 bg-black\/80 backdrop-blur-sm z-50 flex items-center justify-center p-6/g, "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6");
  
  // also add max-h-[90vh] and overflow-y-auto to the modal box itself
  // we look for "rounded-lg w-full max-w-" and add max-h-[90vh] overflow-y-auto to it.
  code = code.replace(/rounded-lg w-full max-w-([a-z0-9]+) shadow-2xl flex flex-col/g, "rounded-lg w-full max-w-$1 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto");
  
  fs.writeFileSync(file, code);
}
