import React from 'react';
import { LayoutDashboard, Package2, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentView: 'dashboard' | 'inventory';
  setCurrentView: (view: 'dashboard' | 'inventory') => void;
}

export function Sidebar({ currentView, setCurrentView }: SidebarProps) {
  return (
    <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] h-screen flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-[var(--color-kingstar-cyan)]/20 p-2 rounded-lg">
          <ShieldCheck className="w-6 h-6 text-[var(--color-kingstar-cyan)]" />
        </div>
        <h1 className="font-bold text-lg text-white">KINGSTAR QA</h1>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'dashboard'
              ? 'bg-[var(--color-kingstar-cyan)]/10 text-[var(--color-kingstar-cyan)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </button>

        <button
          onClick={() => setCurrentView('inventory')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
            currentView === 'inventory'
              ? 'bg-[var(--color-kingstar-cyan)]/10 text-[var(--color-kingstar-cyan)]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-white'
          }`}
        >
          <Package2 className="w-5 h-5" />
          Estoque (CRUD)
        </button>
      </nav>

      <div className="p-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] text-center">
        Gestão de Qualidade © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
