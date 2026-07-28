import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'inventory';
  setCurrentView: (view: 'dashboard' | 'inventory') => void;
}

export function Layout({ children, currentView, setCurrentView }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)]">
      <Sidebar currentView={currentView} setCurrentView={setCurrentView} />
      <main className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-7xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
