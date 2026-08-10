import React, { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { InventoryItem, Movement } from '../lib';

export function ReportsView({ items, movements }: { items: InventoryItem[], movements: Movement[] }) {
  const ruptureItems = items.filter(i => i.quantidade <= (i.quantidade_minima || 10));
  const excessItems = items.filter(i => i.quantidade > (i.quantidade_maxima || 100));
  const healthyItems = items.filter(i => i.quantidade > (i.quantidade_minima || 10) && i.quantidade <= (i.quantidade_maxima || 100));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--color-kingstar-red)]/30 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-red)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-red)]/10 transition-colors"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold">Em Ruptura (Crítico)</span>
            <AlertTriangle size={16} className="text-[var(--color-kingstar-red)]" />
          </div>
          <div className="mt-2 z-10">
            <span className="text-3xl font-bold font-mono tracking-tighter text-[var(--color-kingstar-red)]">{ruptureItems.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--color-kingstar-green)]/30 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-green)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-green)]/10 transition-colors"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold">Estoque Saudável</span>
            <CheckCircle size={16} className="text-[var(--color-kingstar-green)]" />
          </div>
          <div className="mt-2 z-10">
            <span className="text-3xl font-bold font-mono tracking-tighter text-[var(--color-kingstar-green)]">{healthyItems.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--color-kingstar-yellow)]/30 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-yellow)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-yellow)]/10 transition-colors"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold">Excesso de Estoque</span>
            <Package size={16} className="text-[var(--color-kingstar-yellow)]" />
          </div>
          <div className="mt-2 z-10">
            <span className="text-3xl font-bold font-mono tracking-tighter text-[var(--color-kingstar-yellow)]">{excessItems.length}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-lg flex flex-col justify-between h-28 border-[var(--border)] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-[var(--color-kingstar-cyan)]/5 rounded-full blur-xl group-hover:bg-[var(--color-kingstar-cyan)]/10 transition-colors"></div>
          <div className="flex justify-between items-start z-10">
            <span className="text-xs text-[#8b9dc3] uppercase tracking-wider font-semibold">Giro do Estoque (Mês)</span>
            <TrendingUp size={16} className="text-[var(--color-kingstar-cyan)]" />
          </div>
          <div className="mt-2 z-10">
            <span className="text-3xl font-bold font-mono tracking-tighter text-white">{movements.length}</span>
            <span className="text-[#5a6a7a] text-[10px] ml-2">movimentações</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[400px]">
        <div className="glass-panel rounded-lg p-6 border-[var(--border)] flex flex-col">
          <h3 className="text-sm font-bold text-[var(--color-kingstar-red)] tracking-wide mb-4 flex items-center gap-2">
            <AlertTriangle size={16} /> GARGALOS E AÇÃO REQUERIDA
          </h3>
          <div className="flex-1 overflow-auto pr-2 space-y-3">
            {ruptureItems.length === 0 ? (
               <div className="text-center p-8 text-[#5a6a7a] text-sm">Nenhum item em ruptura. Estoque controlado.</div>
            ) : (
              ruptureItems.map(item => (
                <div key={item.id} className="bg-[var(--color-kingstar-red)]/5 border border-[var(--color-kingstar-red)]/20 p-3 rounded flex justify-between items-center">
                  <div>
                    <div className="text-white font-semibold text-sm">{item.material}</div>
                    <div className="text-[10px] text-[#8b9dc3] font-mono mt-1">FORNECEDOR: {item.fornecedor || 'N/A'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--color-kingstar-red)] font-mono font-bold text-lg">{item.quantidade} / {item.quantidade_minima}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--color-kingstar-red)]/70">Comprar Imediatamente</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel rounded-lg p-6 border-[var(--border)] flex flex-col">
          <h3 className="text-sm font-bold text-white tracking-wide mb-4">ÚLTIMAS MOVIMENTAÇÕES E IMPACTO</h3>
          <div className="flex-1 overflow-auto pr-2">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1e1e1e]">
                <tr className="text-[#5a6a7a] text-[10px] uppercase tracking-widest font-semibold border-b border-[var(--border)]">
                  <th className="py-2 px-3">Data</th>
                  <th className="py-2 px-3">Material</th>
                  <th className="py-2 px-3 text-right">Qtd</th>
                  <th className="py-2 px-3">Tipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {movements.slice(0, 10).map(mov => (
                  <tr key={mov.id} className="hover:bg-white/5">
                    <td className="py-3 px-3 text-[#5a6a7a] font-mono text-[10px]">
                      {new Date(mov.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-white text-xs truncate max-w-[150px]">{mov.material_name}</td>
                    <td className="py-3 px-3 font-mono text-right text-xs text-[var(--color-kingstar-cyan)]">{mov.quantidade}</td>
                    <td className="py-3 px-3">
                       <span className={`text-[9px] px-2 py-0.5 rounded-sm uppercase tracking-wide border ${
                        mov.tipo === 'ENTRADA' ? "text-[var(--color-kingstar-green)] border-[var(--color-kingstar-green)]/20 bg-[var(--color-kingstar-green)]/5" : "text-[var(--color-kingstar-yellow)] border-[var(--color-kingstar-yellow)]/20 bg-[var(--color-kingstar-yellow)]/5"
                       }`}>
                         {mov.tipo}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
