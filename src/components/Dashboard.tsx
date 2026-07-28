import React, { useEffect, useState } from 'react';
import { fetchStats } from '../api';
import { InventoryStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const [stats, setStats] = useState<InventoryStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await fetchStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  const totalItems = stats.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-end pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Acompanhamento de Materiais Solicitados</p>
        </div>
      </header>

      {error && (
        <div className="bg-[var(--color-kingstar-red)]/10 text-[var(--color-kingstar-red)] border border-[var(--color-kingstar-red)]/20 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="bg-[var(--color-kingstar-cyan)]/10 p-4 rounded-lg">
            <BarChart3 className="w-6 h-6 text-[var(--color-kingstar-cyan)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Total de Itens Solicitados</p>
            <h3 className="text-3xl font-bold mt-1 text-white">{totalItems}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="bg-[var(--color-kingstar-green)]/10 p-4 rounded-lg">
            <TrendingUp className="w-6 h-6 text-[var(--color-kingstar-green)]" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Materiais Ativos</p>
            <h3 className="text-3xl font-bold mt-1 text-white">{stats.length}</h3>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl h-[450px] flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-6">Top Materiais (Quantidade)</h3>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[var(--color-kingstar-cyan)] border-t-transparent rounded-full animate-[spin_1s_linear_infinite]" />
          </div>
        ) : stats.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
            Nenhum dado disponível. Adicione materiais no Estoque.
          </div>
        ) : (
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--border)', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: 'var(--color-kingstar-cyan)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="var(--color-kingstar-cyan)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
