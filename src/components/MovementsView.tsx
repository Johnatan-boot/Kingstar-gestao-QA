import React, { useState } from 'react';
import { InventoryItem, Movement } from '../App';
import { RefreshCw, Search, Plus, ArrowUpRight, ArrowDownRight, Package, X } from 'lucide-react';
import { cn } from '../App';

export function MovementsView({ movements, items, onRefresh }: { movements: Movement[], items: InventoryItem[], onRefresh: () => void }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventory_id: 0,
    tipo: 'ENTRADA',
    quantidade: 0,
    status: 'Concluído'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      setIsFormOpen(false);
      import('react-hot-toast').then(m => m.default.success('Movimentação registrada com sucesso!'));
      setFormData({ inventory_id: 0, tipo: 'ENTRADA', quantidade: 0, status: 'Concluído' });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-lg border-[var(--border)] overflow-hidden relative">
      <div className="p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold tracking-wide text-white">MOVIMENTAÇÕES DE ESTOQUE</h2>
        </div>
        <button 
          onClick={() => { setFormData({ inventory_id: items[0]?.id || 0, tipo: 'ENTRADA', quantidade: 0, status: 'Concluído' }); setIsFormOpen(true); }}
          className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center justify-center gap-2 shrink-0"
        >
          <Plus size={16} /> NOVA MOVIMENTAÇÃO
        </button>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm">Nova Movimentação</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Material</label>
                <select required value={formData.inventory_id} onChange={e => setFormData({...formData, inventory_id: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors">
                  <option value={0} disabled>Selecione um material</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.material} (Atual: {item.quantidade})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Tipo</label>
                  <select required value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors">
                    <option value="ENTRADA">ENTRADA (+)</option>
                    <option value="SAIDA">SAÍDA (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Quantidade</label>
                  <input type="number" required min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Status/Observação</label>
                <input type="text" required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" placeholder="Ex: Produção, Recebimento..." />
              </div>
              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting || formData.inventory_id === 0} className="px-4 py-2 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'SALVANDO...' : 'REGISTRAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="sticky top-0 bg-[var(--bg-card)] z-10 shadow-sm">
            <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold">
              <th className="p-4 w-16">ID</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Material</th>
              <th className="p-4">Fornecedor</th>
              <th className="p-4 text-right">Qtd</th>
              <th className="p-4">Status/Obs</th>
              <th className="p-4 text-right">Data e Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Nenhuma movimentação registrada</td>
              </tr>
            ) : (
              movements.map(mov => (
                <tr key={mov.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{mov.id.toString().padStart(4, '0')}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wide border flex items-center w-max gap-1",
                      mov.tipo === 'ENTRADA' ? "text-[var(--color-kingstar-green)] border-[var(--color-kingstar-green)]/20 bg-[var(--color-kingstar-green)]/5" : "text-[var(--color-kingstar-yellow)] border-[var(--color-kingstar-yellow)]/20 bg-[var(--color-kingstar-yellow)]/5"
                    )}>
                      {mov.tipo === 'ENTRADA' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-white">{mov.material_name}</td>
                  <td className="p-4 text-[#8b9dc3]">{mov.material_fornecedor || '-'}</td>
                  <td className="p-4 font-mono text-right font-bold text-white">
                    <span className={mov.tipo === 'ENTRADA' ? 'text-[var(--color-kingstar-green)]' : 'text-[var(--color-kingstar-yellow)]'}>
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}
                    </span>
                  </td>
                  <td className="p-4 text-[#8b9dc3] text-xs max-w-[200px] truncate">{mov.status || '-'}</td>
                  <td className="p-4 font-mono text-xs text-[#5a6a7a] text-right">
                    {new Date(mov.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
