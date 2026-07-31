import React, { useEffect, useState } from 'react';
import { Activity, Box, Search, RefreshCw, Plus, Edit2, Trash2, Check, X, Menu, LayoutDashboard, Boxes, ArrowLeftRight, ShoppingCart, ShieldCheck, BarChart3, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

import { ReportsView } from './components/ReportsView';
import { MovementsView } from './components/MovementsView';
import { PurchaseRequestsView } from './components/PurchaseRequestsView';
import { QAView } from './components/QAView';
import { Toaster, toast } from 'react-hot-toast';

// Types
export type InventoryItem = {
  id: number;
  fornecedor: string;
  material: string;
  medida: string;
  quantidade: number;
  quantidade_minima: number;
  quantidade_maxima: number;
  status: string;
  created_at: string;
};

export type Movement = {
  id: number;
  inventory_id: number;
  tipo: 'ENTRADA' | 'SAIDA';
  quantidade: number;
  status: string;
  solicitacao: string;
  material_name: string;
  material_fornecedor: string;
  created_at: string;
};

type Stats = {
  totalItems: number;
  aguardandoQA: number;
  solicitacoesHoje: number;
  barChartData: { name: string; count: number }[];
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isNavigating, setIsNavigating] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, movementsRes, itemsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/movements'),
        fetch('/api/inventory')
      ]);
      const statsData = await statsRes.json();
      const movementsData = await movementsRes.json();
      const itemsData = await itemsRes.json();
      
      setStats(statsData.error ? null : statsData);
      setMovements(Array.isArray(movementsData) ? movementsData : []);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setLastSync(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (tab: string) => {
    if (tab === activeTab) return;
    setIsNavigating(true);
    setActiveTab(tab);
    setTimeout(() => setIsNavigating(false), 800);
  };

  return (
    <div className="flex h-screen w-full bg-[var(--bg-app)] text-[#e5e5e5] font-sans overflow-hidden">
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { background: '#1e1e1e', color: '#fff', border: '1px solid var(--border)', borderRadius: '4px', fontSize: '14px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#1e1e1e' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#1e1e1e' } }
        }} 
      />
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3 border-b border-[var(--border)]">
          <div className="w-12 h-12 bg-[var(--color-kingstar-cyan)] rounded flex items-center justify-center">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRR0PiHdkfbRFE803EY7Ku91d53ElHeMyAysv4RtOMOtTxD6pYVKieaBWE&s=10" className="w-full h-full object-cover rounded" alt="Logo" />
          </div>
          <span className="font-bold tracking-tight text-lg">KINGSTAR <span className="text-[var(--color-kingstar-cyan)]">QA</span></span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {['Dashboard', 'Estoque Geral', 'Movimentações', 'Solicitações de Compra', 'Qualidade (QA)', 'Relatórios'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={cn(
                "w-full text-left px-4 py-2 rounded text-sm font-medium transition-colors",
                activeTab === tab 
                  ? "bg-[var(--bg-card)] border border-[var(--color-kingstar-cyan)] text-[var(--color-kingstar-cyan)]"
                  : "hover:bg-[var(--bg-card)] text-[#8b9dc3]"
              )}
            >
              {tab}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-[var(--border)]"></div>
            <div className="text-xs">
              <p className="font-medium text-white">Admin User</p>
              <p className="text-[#5a6a7a]">Supervisor QA</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#0f0f0f] min-w-0">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-[var(--border)] flex items-center justify-between px-8 bg-[#121212]">
          <div className="flex items-center gap-2 text-sm text-[#8b9dc3]">
            <span>Gestão</span>
            <span className="text-[#5a6a7a]">/</span>
            <span className="text-white font-medium">{activeTab}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1 bg-[var(--color-kingstar-green)]/10 border border-[var(--color-kingstar-green)]/30 text-[var(--color-kingstar-green)] text-[10px] uppercase font-bold rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-kingstar-green)] animate-pulse"></span>
              Sistema Online
            </div>
            <button onClick={fetchData} className="p-2 text-[#5a6a7a] hover:text-white transition-colors" title="Refresh Data">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
          {isNavigating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-app)] z-10 animate-fade-in">
              <div className="relative w-20 h-20 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-t-2 border-r-2 border-transparent border-l-[var(--color-kingstar-cyan)] border-b-[var(--color-kingstar-cyan)] rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-t-2 border-l-2 border-transparent border-r-[var(--color-kingstar-green)] border-b-[var(--color-kingstar-green)] rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                <Box size={24} className="text-[var(--color-kingstar-cyan)] animate-pulse" />
              </div>
              <div className="text-[var(--color-kingstar-cyan)] font-mono text-sm tracking-widest animate-pulse font-bold">
                CARREGANDO MÓDULO...
              </div>
              <div className="text-[#5a6a7a] text-[10px] font-mono mt-2 uppercase">
                {activeTab}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col animate-fade-in">
              {activeTab === 'Dashboard' && <Dashboard stats={stats} movements={movements} lastSync={lastSync} onRefresh={fetchData} />}
              {activeTab === 'Estoque Geral' && <InventoryView onRefresh={fetchData} />}
              {activeTab === 'Movimentações' && <MovementsView movements={movements} items={items} onRefresh={fetchData} />}
              {activeTab === 'Solicitações de Compra' && <PurchaseRequestsView onRefreshParent={fetchData} />}
              {activeTab === 'Qualidade (QA)' && <QAView items={items} onRefresh={fetchData} />}
              {activeTab === 'Relatórios' && <ReportsView items={items} movements={movements} />}
              {activeTab !== 'Dashboard' && activeTab !== 'Estoque Geral' && activeTab !== 'Solicitações de Compra' && activeTab !== 'Qualidade (QA)' && activeTab !== 'Relatórios' && activeTab !== 'Movimentações' && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] glass-panel rounded-lg border border-[var(--border)] border-dashed p-8 text-center bg-[#1a1a1a]/50">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-kingstar-cyan)]/10 flex items-center justify-center mb-4">
                    <Box size={32} className="text-[var(--color-kingstar-cyan)] opacity-70" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">{activeTab}</h2>
                  <p className="text-[#8b9dc3] max-w-md">
                    Este módulo está em desenvolvimento. A funcionalidade para {activeTab.toLowerCase()} estará disponível em breve.
                  </p>
                  <div className="mt-6 px-4 py-1.5 bg-[#121212] border border-[var(--border)] rounded-full text-[10px] uppercase font-mono text-[#5a6a7a]">
                    STATUS: EM CONSTRUÇÃO
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Status Bar */}
        <footer className="h-8 shrink-0 border-t border-[var(--border)] bg-[var(--bg-sidebar)] flex items-center px-6 justify-between text-[10px] text-[#5a6a7a] font-mono">
          <div className="flex items-center gap-4">
            <span>ENV: PRODUCTION</span>
            <span>NODE: v20.10.0 (FASTIFY/EXPRESS)</span>
            <span className="text-[var(--color-kingstar-cyan)]">DB: SQLITE_ACTIVE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-kingstar-green)] animate-pulse"></span>
            REAL-TIME UPDATES ENABLED
          </div>
        </footer>
      </main>
    </div>
  );
}

function Dashboard({ stats, movements, lastSync, onRefresh }: { stats: Stats | null, movements: Movement[], lastSync: string, onRefresh: () => void }) {
  const maxChartVal = stats?.barChartData && stats.barChartData.length 
    ? Math.max(1, ...stats.barChartData.map(d => d.count))
    : 100;

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-4 gap-6 shrink-0">
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--border)] relative overflow-hidden group hover:border-[var(--color-kingstar-cyan)]/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-cyan)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-cyan)]/10 transition-colors"></div>
          <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold z-10">Itens em Estoque</span>
          <div className="mt-2 z-10 flex items-baseline">
            <span className="text-3xl font-bold font-mono tracking-tighter text-white">{stats?.totalItems || 0}</span>
            <span className="text-[var(--color-kingstar-green)] text-xs ml-2 font-mono">+2.4%</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--border)] relative overflow-hidden group hover:border-[var(--color-kingstar-yellow)]/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-yellow)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-yellow)]/10 transition-colors"></div>
          <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold z-10">Aguardando QA</span>
          <div className="mt-2 z-10 flex items-baseline">
            <span className="text-3xl font-bold font-mono tracking-tighter text-[var(--color-kingstar-yellow)]">{stats?.aguardandoQA || 0}</span>
            <span className="text-xs text-[#5a6a7a] ml-2 font-mono">Lotes</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--border)] relative overflow-hidden group hover:border-[var(--color-kingstar-cyan)]/50 transition-colors">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-cyan)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-cyan)]/10 transition-colors"></div>
          <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold z-10">Solicitações Hoje</span>
          <div className="mt-2 z-10 flex items-baseline">
            <span className="text-3xl font-bold font-mono tracking-tighter text-white">{stats?.solicitacoesHoje || 0}</span>
            <span className="text-[var(--color-kingstar-cyan)] text-xs ml-2 font-mono">Ativo</span>
          </div>
        </div>
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--border)]">
          <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold">Status do Sistema</span>
          <div className="mt-2">
            <span className="text-lg font-bold text-[var(--color-kingstar-cyan)] tracking-tight">SINCRONIZADO</span>
            <div className="text-[10px] text-[#5a6a7a] font-mono mt-1">LAST SYNC: {lastSync}</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Main Visuals - Chart */}
        <div className="col-span-7 glass-panel rounded-lg p-6 flex flex-col border-[var(--border)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-white tracking-wide">GESTÃO DE MATERIAIS SOLICITADOS</h3>
            <div className="flex gap-4 text-[10px] text-[#8b9dc3] font-semibold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[var(--color-kingstar-cyan)]"></div>Solicitados</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-[var(--color-kingstar-green)]"></div>Aprovados</div>
            </div>
          </div>
          <div className="flex-1 flex items-end justify-center pb-8 pt-4">
            <div className="flex items-end gap-3 h-48 w-full justify-around px-4 border-b border-[var(--border)]">
              {stats?.barChartData && stats.barChartData.length > 0 ? (
                stats.barChartData.map((data, i) => {
                  const height = Math.max(10, (data.count / maxChartVal) * 100);
                  const opacity = [0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.85, 1][i % 8];
                  return (
                    <div key={i} className="flex flex-col items-center justify-end group relative w-12 h-full">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#121212] border border-[var(--color-kingstar-cyan)] text-[var(--color-kingstar-cyan)] text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 font-mono">
                        {data.count} unid.
                      </div>
                      <div 
                        className="w-8 bg-[var(--color-kingstar-cyan)] rounded-t-sm transition-all duration-700 ease-out relative overflow-hidden" 
                        style={{ height: height + '%', opacity }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                      <span className="absolute -bottom-7 text-[10px] text-[#8b9dc3] whitespace-nowrap max-w-[60px] truncate text-center" title={data.name}>
                        {data.name.substring(0, 8)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-[#5a6a7a] font-mono text-sm self-center pb-12 w-full text-center">SEM DADOS (ADD VIA CRUD)</div>
              )}
            </div>
          </div>
        </div>

        {/* Side Table (Recent Movements) */}
        <div className="col-span-5 glass-panel rounded-lg flex flex-col border-[var(--border)] overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#1e1e1e]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white">Últimas Movimentações</h3>
            <button className="bg-[var(--color-kingstar-cyan)] text-black text-[10px] font-bold px-3 py-1.5 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors shadow-[0_0_10px_rgba(56,189,248,0.2)]">
              NOVA ENTRADA
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-[var(--bg-card)] z-10">
                <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-wider">
                  <th className="p-4 font-semibold">Item</th>
                  <th className="p-4 font-semibold">Qtd</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {movements && movements.length > 0 ? (
                  movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#e5e5e5] truncate max-w-[120px]">{mov.material_name || 'Desconhecido'}</span>
                          <span className="text-[10px] text-[#5a6a7a] font-mono mt-0.5">ID-{mov.id.toString().padStart(4, '0')}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "font-mono font-medium",
                          mov.tipo === 'ENTRADA' ? "text-[var(--color-kingstar-green)]" : "text-[var(--color-kingstar-yellow)]"
                        )}>
                          {mov.tipo === 'ENTRADA' ? '+' : '-'}{(mov.quantidade || 0).toString().padStart(2, '0')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wide border",
                          mov.status === 'QA Pendente' ? "text-[var(--color-kingstar-yellow)] border-[var(--color-kingstar-yellow)]/20 bg-[var(--color-kingstar-yellow)]/5" :
                          mov.status === 'Check-in' ? "text-[var(--color-kingstar-green)] border-[var(--color-kingstar-green)]/20 bg-[var(--color-kingstar-green)]/5" :
                          mov.status === 'Produção' ? "text-[var(--color-kingstar-cyan)] border-[var(--color-kingstar-cyan)]/20 bg-[var(--color-kingstar-cyan)]/5" :
                          "text-[#8b9dc3] border-[#8b9dc3]/20 bg-[#8b9dc3]/5"
                        )}>
                          {mov.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-[var(--color-kingstar-cyan)] hover:text-white transition-colors"><Edit2 size={14} /></button>
                          <button className="text-[var(--color-kingstar-red)] opacity-70 hover:opacity-100 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-[#5a6a7a] font-mono text-xs">
                      Nenhuma movimentação recente
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function InventoryView({ onRefresh }: { onRefresh: () => void }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    fornecedor: '',
    material: '',
    medida: '',
    quantidade: 0,
    quantidade_minima: 10,
    quantidade_maxima: 100,
    status: 'Ativo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error(e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (editingId) {
        await fetch('/api/inventory/' + editingId, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      setIsFormOpen(false);
      import('react-hot-toast').then(m => m.default.success(editingId ? 'Material atualizado com sucesso!' : 'Material cadastrado com sucesso!'));
      setEditingId(null);
      setFormData({ fornecedor: '', material: '', medida: '', quantidade: 0, quantidade_minima: 10, quantidade_maxima: 100, status: 'Ativo' });
      await fetchInventory();
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingId(item.id);
    setFormData({
      fornecedor: item.fornecedor,
      material: item.material,
      medida: item.medida,
      quantidade: item.quantidade,
      quantidade_minima: item.quantidade_minima || 10,
      quantidade_maxima: item.quantidade_maxima || 100,
      status: item.status
    });
    setIsFormOpen(true);
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await fetch('/api/inventory/' + deletingId, { method: 'DELETE' });
      setDeletingId(null);
      import('react-hot-toast').then(m => m.default.success('Material excluído com sucesso.'));
      await fetchInventory();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-lg border-[var(--border)] overflow-hidden relative">
      {/* Toolbar */}
      <div className="p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold tracking-wide text-white">CONTROLE DE ESTOQUE</h2>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a6a7a]" />
            <input 
              type="text" 
              placeholder="Buscar material..." 
              className="bg-[#121212] border border-[var(--border)] rounded text-xs px-3 py-1.5 pl-8 text-white w-64 focus:border-[var(--color-kingstar-cyan)] transition-colors placeholder:text-[#5a6a7a]"
            />
          </div>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({ fornecedor: '', material: '', medida: '', quantidade: 0, quantidade_minima: 10, quantidade_maxima: 100, status: 'Ativo' }); setIsFormOpen(true); }}
          className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center gap-2 shadow-[0_0_10px_rgba(56,189,248,0.2)]"
        >
          <Plus size={16} /> NOVO ITEM
        </button>
      </div>

      {/* Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm">
                {editingId ? 'Editar Item' : 'Novo Material'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#5a6a7a] hover:text-white">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Fornecedor</label>
                  <input required type="text" value={formData.fornecedor} onChange={e => setFormData({...formData, fornecedor: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Material</label>
                  <input required type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Medida</label>
                    <input type="text" value={formData.medida} onChange={e => setFormData({...formData, medida: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Quantidade</label>
                    <input type="number" required min="0" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Qtd Mínima (Ruptura)</label>
                    <input type="number" required min="0" value={formData.quantidade_minima} onChange={e => setFormData({...formData, quantidade_minima: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Qtd Máxima (Saudável)</label>
                    <input type="number" required min="1" value={formData.quantidade_maxima} onChange={e => setFormData({...formData, quantidade_maxima: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? 'SALVANDO...' : (editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR MATERIAL')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Overlay */}
      {deletingId !== null && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-red)]/30 rounded-lg w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-kingstar-red)]/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} className="text-[var(--color-kingstar-red)] opacity-90" />
            </div>
            <h3 className="font-bold text-white uppercase tracking-wide mb-2">Excluir Material?</h3>
            <p className="text-sm text-[#8b9dc3] mb-6">
              Tem certeza que deseja deletar este item? Todas as movimentações vinculadas também serão removidas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeletingId(null)} className="px-6 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors border border-[var(--border)] rounded-sm hover:border-[#8b9dc3]">
                CANCELAR
              </button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-[var(--color-kingstar-red)] text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                EXCLUIR DEFINITIVAMENTE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
            <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold">
              <th className="p-4 w-16">ID</th>
              <th className="p-4">Material</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4 text-right">Estoque</th>
              <th className="p-4 text-right">Mín</th>
              <th className="p-4 text-right">Máx</th>
              <th className="p-4 text-center">Saúde</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={9} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Carregando dados...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Nenhum material cadastrado</td></tr>
            ) : (
              items.map(item => {
                const min = item.quantidade_minima || 0;
                const max = item.quantidade_maxima || 1;
                const pct = Math.min(100, Math.round((item.quantidade / max) * 100));
                let healthColor = 'text-[var(--color-kingstar-green)]';
                let healthBg = 'bg-[var(--color-kingstar-green)]';
                let healthLabel = 'SAUDÁVEL';
                if (item.quantidade <= min) {
                  healthColor = 'text-[var(--color-kingstar-red)]';
                  healthBg = 'bg-[var(--color-kingstar-red)]';
                  healthLabel = 'RUPTURA';
                } else if (item.quantidade > max) {
                  healthColor = 'text-[var(--color-kingstar-yellow)]';
                  healthBg = 'bg-[var(--color-kingstar-yellow)]';
                  healthLabel = 'EXCESSO';
                }

                return (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{(item.id || 0).toString().padStart(4, '0')}</td>
                  <td className="p-4 font-medium text-white">{item.material} <span className="text-[#5a6a7a] text-xs font-normal">({item.medida || '-'})</span></td>
                  <td className="p-4 text-[#8b9dc3]">{item.fornecedor || '-'}</td>
                  <td className="p-4 font-mono text-right font-medium text-[var(--color-kingstar-cyan)]">{item.quantidade}</td>
                  <td className="p-4 font-mono text-right text-[#5a6a7a]">{min}</td>
                  <td className="p-4 font-mono text-right text-[#5a6a7a]">{max}</td>
                  <td className="p-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-full bg-[#121212] rounded-full h-1.5 border border-[var(--border)] overflow-hidden">
                        <div className={`h-full ${healthBg}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className={`text-[9px] font-bold tracking-wider ${healthColor}`}>{pct}% - {healthLabel}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wide border text-[var(--color-kingstar-green)] border-[var(--color-kingstar-green)]/20 bg-[var(--color-kingstar-green)]/5">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(item)} className="text-[#8b9dc3] hover:text-[var(--color-kingstar-cyan)] transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(item.id)} className="text-[#8b9dc3] hover:text-[var(--color-kingstar-red)] transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PurchaseRequest {
  id: number;
  inventory_id: number;
  material_name: string;
  quantidade: number;
  status: string;
  created_at: string;
}


