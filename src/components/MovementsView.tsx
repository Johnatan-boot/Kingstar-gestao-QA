import React, { useState, useEffect } from 'react';
import { InventoryItem, Movement } from '../App';
import { RefreshCw, Search, Plus, ArrowUpRight, ArrowDownRight, Package } from 'lucide-react';
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
      <div className="p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold tracking-wide text-white">MOVIMENTAÇÕES DE ESTOQUE</h2>
        </div>
        <button 
          onClick={() => { setFormData({ inventory_id: items[0]?.id || 0, tipo: 'ENTRADA', quantidade: 0, status: 'Concluído' }); setIsFormOpen(true); }}
          className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> NOVA MOVIMENTAÇÃO
        </button>
      </div>

      {isFormOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm">Nova Movimentação</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#5a6a7a] hover:text-white"><RefreshCw size={16} className="rotate-45" /></button>
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

      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {movements.length === 0 ? (
            <div className="text-center p-8 text-[#5a6a7a] font-mono text-sm">Nenhuma movimentação registrada</div>
          ) : (
            movements.map(mov => (
              <div key={mov.id} className="bg-[#1a1a1a] border border-[var(--border)] rounded flex items-center p-3 hover:border-[#8b9dc3]/30 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-[#121212] flex items-center justify-center border border-[var(--border)]">
                  {mov.tipo === 'ENTRADA' ? (
                    <ArrowUpRight size={18} className="text-[var(--color-kingstar-green)]" />
                  ) : (
                    <ArrowDownRight size={18} className="text-[var(--color-kingstar-yellow)]" />
                  )}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-white">{mov.material_name}</span>
                    <span className={`font-mono font-bold text-sm ${mov.tipo === 'ENTRADA' ? 'text-[var(--color-kingstar-green)]' : 'text-[var(--color-kingstar-yellow)]'}`}>
                      {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8b9dc3] font-mono uppercase">
                    <span className="flex items-center gap-1.5"><Package size={12} /> {mov.material_fornecedor || 'Desconhecido'}</span>
                    <span>{new Date(mov.created_at).toLocaleString()} • {mov.status}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
