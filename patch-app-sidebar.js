import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace("Activity, Box, Search, RefreshCw, Plus, Edit2, Trash2, Check, X", "Activity, Box, Search, RefreshCw, Plus, Edit2, Trash2, Check, X, Menu");

code = code.replace("const [activeTab, setActiveTab] = useState('Dashboard');", "const [activeTab, setActiveTab] = useState('Dashboard');\n  const [isSidebarOpen, setIsSidebarOpen] = useState(false);");

code = code.replace("setTimeout(() => setIsNavigating(false), 800);", "setTimeout(() => setIsNavigating(false), 800);\n    setIsSidebarOpen(false);");

// modify the aside tag
const oldAside = `<aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col shrink-0">`;
const newAside = `<div className={cn("fixed inset-0 bg-black/50 z-40 lg:hidden", isSidebarOpen ? "block" : "hidden")} onClick={() => setIsSidebarOpen(false)}></div>
      <aside className={cn("fixed lg:static inset-y-0 left-0 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col shrink-0 z-50 transform transition-transform duration-300 lg:transform-none", isSidebarOpen ? "translate-x-0" : "-translate-x-full")}>
`;
code = code.replace(oldAside, newAside);

// modify the header
const oldHeader = `<header className="h-16 shrink-0 border-b border-[var(--border)] flex items-center justify-between px-8 bg-[#121212]">
          <div className="flex items-center gap-2 text-sm text-[#8b9dc3]">`;
const newHeader = `<header className="h-16 shrink-0 border-b border-[var(--border)] flex items-center justify-between px-4 lg:px-8 bg-[#121212]">
          <div className="flex items-center gap-2 lg:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-[#8b9dc3] hover:text-white">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2 text-sm text-[#8b9dc3]">`;
code = code.replace(oldHeader, newHeader);

// make sure content area is somewhat better on mobile
const oldMainContent = `<div className="flex-1 overflow-auto p-8 relative">`;
const newMainContent = `<div className="flex-1 overflow-auto p-4 lg:p-8 relative">`;
code = code.replace(oldMainContent, newMainContent);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx sidebar");
