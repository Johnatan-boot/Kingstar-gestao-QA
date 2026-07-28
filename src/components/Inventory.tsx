import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../types';
import { fetchInventory, createItem, updateItem, deleteItem } from '../api';
import { Plus, Pencil, Trash2, X, Check, Search } from 'lucide-react';

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    supplier: '',
    material: '',
    measurement: '',
    quantity: 0,
    request_status: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchInventory();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        supplier: item.supplier,
        material: item.material,
        measurement: item.measurement || '',
        quantity: item.quantity,
        request_status: item.request_status || ''
      });
    } else {
      setEditingItem(null);
      setFormData({ supplier: '', material: '', measurement: '', quantity: 0, request_status: '' });
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
      } else {
        await createItem(formData);
      }
      handleCloseForm();
      loadItems();
    } catch (err) {
      console.error("Failed to save item", err);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja remover este material?')) {
      try {
        await deleteItem(id);
        loadItems();
      } catch (err) {
        console.error("Failed to delete item", err);
      }
    }
  };

  const filteredItems = items.filter(item => 
    item.material.toLowerCase().includes(search.toLowerCase()) || 
    item.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Estoque e Solicitações</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Gerenciamento de entrada e saída de materiais</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input 
              type="text" 
              placeholder="Buscar material..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-lg text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors w-64"
            />
          </div>
          <button 
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--color-kingstar-cyan)] hover:bg-[#2ba3db] text-[var(--bg-app)] font-semibold rounded-lg text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        </div>
      </header>

      {/* Form Overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-[var(--border)] bg-[var(--bg-sidebar)]">
              <h3 className="font-semibold text-white">
                {editingItem ? 'Editar Material' : 'Adicionar Novo Material'}
              </h3>
              <button onClick={handleCloseForm} className="text-[var(--text-muted)] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Fornecedor</label>
                <input 
                  type="text" required
                  value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Ex: V-JOY"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Material</label>
                <input 
                  type="text" required
                  value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Ex: Chap. União p/ Tampo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Medida</label>
                  <input 
                    type="text" 
                    value={formData.measurement} onChange={e => setFormData({...formData, measurement: e.target.value})}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
                    placeholder="Ex: 158"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Quantidade</label>
                  <input 
                    type="number" required min="0"
                    value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                    className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Solicitação (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.request_status} onChange={e => setFormData({...formData, request_status: e.target.value})}
                  className="w-full bg-[var(--bg-app)] border border-[var(--border)] rounded-lg px-3 py-2 text-white text-sm"
                  placeholder="Status da solicitação"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={handleCloseForm} className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-[var(--color-kingstar-cyan)] hover:bg-[#2ba3db] text-[var(--bg-app)] font-semibold rounded-lg text-sm transition-colors">
                  <Check className="w-4 h-4" />
                  {editingItem ? 'Salvar Alterações' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-sidebar)] border-b border-[var(--border)] text-[var(--text-secondary)] text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Fornecedor</th>
                <th className="px-6 py-4">Material</th>
                <th className="px-6 py-4">Medida</th>
                <th className="px-6 py-4">Quantid.</th>
                <th className="px-6 py-4">Solicitação</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Carregando estoque...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Nenhum material encontrado.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-[var(--bg-sidebar)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{item.supplier}</td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{item.material}</td>
                    <td className="px-6 py-4 font-mono text-[var(--text-muted)]">{item.measurement || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.quantity > 50 ? 'bg-[var(--color-kingstar-green)]/10 text-[var(--color-kingstar-green)]' 
                        : item.quantity > 10 ? 'bg-[var(--color-kingstar-yellow)]/10 text-[var(--color-kingstar-yellow)]'
                        : 'bg-[var(--color-kingstar-red)]/10 text-[var(--color-kingstar-red)]'
                      }`}>
                        {item.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-muted)]">{item.request_status || '-'}</td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button 
                        onClick={() => handleOpenForm(item)}
                        className="text-[var(--text-secondary)] hover:text-[var(--color-kingstar-cyan)] transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4 inline" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-[var(--text-secondary)] hover:text-[var(--color-kingstar-red)] transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
