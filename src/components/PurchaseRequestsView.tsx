import React, { useState, useEffect } from 'react';
import { Check, X, Search, Plus, Package } from 'lucide-react';
import { InventoryItem } from '../App';
import { cn } from '../App';

interface PurchaseRequest {
  id: number;
  inventory_id: number;
  material_name: string;
  quantidade: number;
  status: string;
  created_at: string;
}

export function PurchaseRequestsView({ onRefreshParent }: { onRefreshParent: () => void }) {
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventory_id: 0,
    quantidade: 0,
  });

  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [receiveData, setReceiveData] = useState({
    id: 0,
    received_quantity: 0,
    nf: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, invRes] = await Promise.all([
        fetch('/api/purchase-requests'),
        fetch('/api/inventory')
      ]);
      const reqData = await reqRes.json();
      const invData = await invRes.json();
      setRequests(Array.isArray(reqData) ? reqData : []);
      setInventoryItems(Array.isArray(invData) ? invData : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const selectedItem = inventoryItems.find(i => i.id === formData.inventory_id);
      if (!selectedItem) throw new Error('Material not found');

      await fetch('/api/purchase-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventory_id: selectedItem.id,
          material_name: selectedItem.material,
          quantidade: formData.quantidade,
          status: 'Pendente'
        })
      });
      setIsFormOpen(false);
      setFormData({ inventory_id: 0, quantidade: 0 });
      fetchData();
      onRefreshParent();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: string, additionalData?: any) => {
    try {
      await fetch('/api/purchase-requests/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...additionalData })
      });
      fetchData();
      onRefreshParent();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    await updateStatus(receiveData.id, 'Recebido', {
      received_quantity: receiveData.received_quantity,
      nf: receiveData.nf
    });
    setReceiveModalOpen(false);
    setIsSubmitting(false);
  };

  const openReceiveModal = (req: PurchaseRequest) => {
    setReceiveData({
      id: req.id,
      received_quantity: req.quantidade,
      nf: ''
    });
    setReceiveModalOpen(true);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-lg border-[var(--border)] overflow-hidden relative">
      <div className="p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-bold tracking-wide text-white">SOLICITAÇÕES DE COMPRA</h2>
        </div>
        <button 
          onClick={() => { setFormData({ inventory_id: inventoryItems[0]?.id || 0, quantidade: 0 }); setIsFormOpen(true); }}
          className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-4 py-2 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> NOVA SOLICITAÇÃO
        </button>
      </div>

      {isFormOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm">Nova Solicitação</h3>
              <button onClick={() => setIsFormOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Material</label>
                <select required value={formData.inventory_id} onChange={e => setFormData({...formData, inventory_id: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors">
                  <option value={0} disabled>Selecione um material</option>
                  {inventoryItems.map(item => (
                    <option key={item.id} value={item.id}>{item.material} (Atual: {item.quantidade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Quantidade Solicitada</label>
                <input type="number" required min="1" value={formData.quantidade} onChange={e => setFormData({...formData, quantidade: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
              </div>
              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting || formData.inventory_id === 0} className="px-4 py-2 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'ENVIANDO...' : 'SOLICITAR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {receiveModalOpen && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-green)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-green)] uppercase tracking-wide text-sm">Receber Material</h3>
              <button onClick={() => setReceiveModalOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleReceiveSubmit} className="p-6 flex flex-col gap-4">
              <div className="bg-[var(--color-kingstar-green)]/5 border border-[var(--color-kingstar-green)]/20 p-3 rounded mb-2">
                <p className="text-xs text-[#8b9dc3]">Confira as quantidades recebidas com a Nota Fiscal antes de prosseguir. Esta ação registrará uma entrada no estoque.</p>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Quantidade Recebida</label>
                <input type="number" required min="1" value={receiveData.received_quantity} onChange={e => setReceiveData({...receiveData, received_quantity: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors font-mono" />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Nota Fiscal (Opcional)</label>
                <input type="text" value={receiveData.nf} onChange={e => setReceiveData({...receiveData, nf: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" placeholder="Número da NF" />
              </div>
              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setReceiveModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[var(--color-kingstar-green)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'REGISTRANDO...' : 'CONFIRMAR RECEBIMENTO'}
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
              <th className="p-4">Material</th>
              <th className="p-4 text-right">Qtd</th>
              <th className="p-4">Status</th>
              <th className="p-4">Data</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Carregando dados...</td></tr>
            ) : requests.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Nenhuma solicitação</td></tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{req.id.toString().padStart(4, '0')}</td>
                  <td className="p-4 font-medium text-white">{req.material_name}</td>
                  <td className="p-4 font-mono text-right text-[var(--color-kingstar-cyan)]">{req.quantidade}</td>
                  <td className="p-4">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wide border",
                      req.status === 'Pendente' ? "text-[var(--color-kingstar-yellow)] border-[var(--color-kingstar-yellow)]/20 bg-[var(--color-kingstar-yellow)]/5" :
                      req.status === 'Aprovado' ? "text-[var(--color-kingstar-cyan)] border-[var(--color-kingstar-cyan)]/20 bg-[var(--color-kingstar-cyan)]/5" :
                      req.status === 'Recebido' ? "text-[var(--color-kingstar-green)] border-[var(--color-kingstar-green)]/20 bg-[var(--color-kingstar-green)]/5" :
                      "text-[#8b9dc3] border-[#8b9dc3]/20 bg-[#8b9dc3]/5"
                    )}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-[#8b9dc3] font-mono text-xs">
                    {new Date(req.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-right">
                    {req.status === 'Pendente' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => updateStatus(req.id, 'Aprovado')} className="text-[var(--color-kingstar-cyan)] hover:text-white px-2 py-1 text-xs border border-[var(--color-kingstar-cyan)]/30 rounded hover:bg-[var(--color-kingstar-cyan)] transition-colors">Aprovar</button>
                        <button onClick={() => updateStatus(req.id, 'Rejeitado')} className="text-[#8b9dc3] hover:text-[var(--color-kingstar-red)] px-2 py-1 text-xs border border-[var(--border)] rounded hover:border-[var(--color-kingstar-red)]/50 transition-colors">Rejeitar</button>
                      </div>
                    )}
                    {req.status === 'Aprovado' && (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openReceiveModal(req)} className="text-[var(--color-kingstar-green)] hover:text-white px-2 py-1 text-xs border border-[var(--color-kingstar-green)]/30 rounded hover:bg-[var(--color-kingstar-green)] transition-colors flex items-center gap-1"><Package size={14} /> Receber</button>
                      </div>
                    )}
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
