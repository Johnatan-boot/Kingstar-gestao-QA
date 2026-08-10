import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../lib';
import { cn } from '../lib';
import { 
  ClipboardCheck, 
  AlertTriangle, 
  ShieldCheck, 
  Plus, 
  Search, 
  RefreshCw, 
  X, 
  FileWarning, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Printer, 
  Lock, 
  Award, 
  Wrench, 
  FileText, 
  ArrowRight, 
  CheckSquare, 
  HelpCircle,
  BarChart3,
  Unlock,
  Calendar,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Inspection {
  id: number;
  inventory_id: number;
  material_name: string;
  tipo: string;
  quantidade_inspecionada: number;
  quantidade_aprovada: number;
  quantidade_rejeitada: number;
  status: string;
  observacoes: string;
  inspector: string;
  created_at: string;
}

interface RNC {
  id: number;
  inspection_id?: number;
  inventory_id: number;
  material_name: string;
  description: string;
  severity: string;
  status: string;
  action_taken: string;
  created_at: string;
}

interface CapaAction {
  id: string;
  title: string;
  what: string;
  who: string;
  when: string;
  why: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída';
  priority: 'Alta' | 'Média' | 'Baixa';
}

interface QuarantineItem {
  id: string;
  material_name: string;
  lote: string;
  quantidade: number;
  motivo: string;
  data_retencao: string;
  responsavel: string;
  status: 'Em Análise' | 'Liberado' | 'Descartado';
}

interface MetrologyInstrument {
  id: string;
  codigo: string;
  nome: string;
  faixa_medicao: string;
  ultima_calibracao: string;
  proxima_calibracao: string;
  status: 'Calibrado' | 'Vencendo' | 'Vencido';
  certificado: string;
}

export default function QAView({ items, onRefresh }: { items: InventoryItem[], onRefresh: () => void }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inspections' | 'rncs' | 'capa' | 'quarantine' | 'metrology'>('dashboard');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [rncs, setRncs] = useState<RNC[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modais de Cadastro / Ação
  const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
  const [isRNCFormOpen, setIsRNCFormOpen] = useState(false);
  const [rncActionModalOpen, setRncActionModalOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [isCapaFormOpen, setIsCapaFormOpen] = useState(false);
  const [selectedInspectionForLabel, setSelectedInspectionForLabel] = useState<Inspection | null>(null);
  const [currentRnc, setCurrentRnc] = useState<RNC | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados dos formulários
  const [inspectionData, setInspectionData] = useState({
    inventory_id: 0,
    tipo: 'Recebimento',
    quantidade_inspecionada: 0,
    quantidade_aprovada: 0,
    quantidade_rejeitada: 0,
    status: 'Aprovado',
    observacoes: '',
    inspector: '',
    chk_embalagem: true,
    chk_dimensional: true,
    chk_certificado: true,
    chk_validade: true,
  });

  const [rncData, setRncData] = useState({
    inventory_id: 0,
    description: '',
    severity: 'Média',
    why1: '',
    why2: '',
    why3: '',
    why4: '',
    why5: '',
    disposition: 'Retrabalho'
  });

  const [actionData, setActionData] = useState({
    status: 'Resolvida',
    action_taken: '',
    why1: '',
    why2: '',
    why3: '',
    disposition: 'Retrabalho'
  });

  // Dados Locais em Memória (com persistência no localStorage) para CAPA, Quarentena e Metrologia
  const [capaActions, setCapaActions] = useState<CapaAction[]>(() => {
    const saved = localStorage.getItem('kingstar_qa_capa');
    return saved ? JSON.parse(saved) : [];
  });

  const [quarantineItems, setQuarantineItems] = useState<QuarantineItem[]>(() => {
    const saved = localStorage.getItem('kingstar_qa_quarantine');
    return saved ? JSON.parse(saved) : [];
  });

  const [instruments, setInstruments] = useState<MetrologyInstrument[]>(() => {
    const saved = localStorage.getItem('kingstar_qa_instruments');
    return saved ? JSON.parse(saved) : [];
  });

  const handleResetLocalData = () => {
    if (confirm('Deseja zerar todos os dados em 3-Plano CAPA, 4-Quarentena e 5-Instrumentos?')) {
      localStorage.removeItem('kingstar_qa_capa');
      localStorage.removeItem('kingstar_qa_quarantine');
      localStorage.removeItem('kingstar_qa_instruments');
      setCapaActions([]);
      setQuarantineItems([]);
      setInstruments([]);
      toast.success('3-Plano CAPA, 4-Quarentena e 5-Instrumentos foram zerados com sucesso!');
    }
  };

  useEffect(() => {
    localStorage.setItem('kingstar_qa_capa', JSON.stringify(capaActions));
  }, [capaActions]);

  useEffect(() => {
    localStorage.setItem('kingstar_qa_quarantine', JSON.stringify(quarantineItems));
  }, [quarantineItems]);

  useEffect(() => {
    localStorage.setItem('kingstar_qa_instruments', JSON.stringify(instruments));
  }, [instruments]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, rncRes] = await Promise.all([
        fetch('/api/qa/inspections'),
        fetch('/api/qa/rncs')
      ]);
      const inspData = await inspRes.json();
      const rncData = await rncRes.json();
      
      setInspections(Array.isArray(inspData) ? inspData : []);
      setRncs(Array.isArray(rncData) ? rncData : []);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao buscar dados de Qualidade');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Atualiza status da inspeção automaticamente conforme aprovado/rejeitado
  useEffect(() => {
    if (inspectionData.quantidade_rejeitada > 0 && inspectionData.quantidade_aprovada === 0) {
      setInspectionData(prev => ({ ...prev, status: 'Reprovado' }));
    } else if (inspectionData.quantidade_rejeitada > 0 && inspectionData.quantidade_aprovada > 0) {
      setInspectionData(prev => ({ ...prev, status: 'Aprovado com Restrição' }));
    } else if (inspectionData.quantidade_inspecionada > 0 && inspectionData.quantidade_rejeitada === 0) {
      setInspectionData(prev => ({ ...prev, status: 'Aprovado' }));
    }
  }, [inspectionData.quantidade_aprovada, inspectionData.quantidade_rejeitada, inspectionData.quantidade_inspecionada]);

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (inspectionData.quantidade_aprovada + inspectionData.quantidade_rejeitada !== inspectionData.quantidade_inspecionada) {
      toast.error('A soma de aprovados e rejeitados deve ser igual à quantidade inspecionada!');
      return;
    }

    setIsSubmitting(true);
    try {
      const checklistText = `\n[CHECKLIST TÉCNICO] Embalagem: ${inspectionData.chk_embalagem ? 'OK' : 'FALHA'} | Dimensional: ${inspectionData.chk_dimensional ? 'OK' : 'FALHA'} | Certificado COA: ${inspectionData.chk_certificado ? 'OK' : 'PENDENTE'} | Validade/Lote: ${inspectionData.chk_validade ? 'OK' : 'FALHA'}`;
      
      const payload = {
        ...inspectionData,
        observacoes: (inspectionData.observacoes || '') + checklistText
      };

      const res = await fetch('/api/qa/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Falha na resposta');

      setIsInspectionFormOpen(false);
      toast.success('Inspeção com Checklist Técnico registrada!');
      
      if (inspectionData.quantidade_rejeitada > 0) {
        toast.error('Uma RNC e item em Quarentena gerados pelo sistema.', { duration: 5000 });
        // Adiciona automaticamente no quadro de Quarentena
        const mat = items.find(i => i.id === inspectionData.inventory_id);
        const newQuarantine: QuarantineItem = {
          id: `QRT-${Date.now().toString().slice(-4)}`,
          material_name: mat?.material || 'Material Inspecionado',
          lote: `LOTE-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
          quantidade: inspectionData.quantidade_rejeitada,
          motivo: `Reprovado em Inspeção de Qualidade (${inspectionData.tipo})`,
          data_retencao: new Date().toLocaleDateString('pt-BR'),
          responsavel: inspectionData.inspector || 'Inspetor QA',
          status: 'Em Análise'
        };
        setQuarantineItems(prev => [newQuarantine, ...prev]);
      }

      setInspectionData({
        inventory_id: 0,
        tipo: 'Recebimento',
        quantidade_inspecionada: 0,
        quantidade_aprovada: 0,
        quantidade_rejeitada: 0,
        status: 'Aprovado',
        observacoes: '',
        inspector: '',
        chk_embalagem: true,
        chk_dimensional: true,
        chk_certificado: true,
        chk_validade: true,
      });
      fetchData();
      onRefresh();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao registrar inspeção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRNCSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const whyText = rncData.why1 ? `\n\n[ANÁLISE 5 PORQUÊS]\n1. Por quê? ${rncData.why1}\n2. Por quê? ${rncData.why2 || '-'}\n3. Por quê? ${rncData.why3 || '-'}\n4. Por quê? ${rncData.why4 || '-'}\n5. Por quê (Causa Raiz)? ${rncData.why5 || '-'}\nDisposição: ${rncData.disposition}` : '';
      
      await fetch('/api/qa/rncs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rncData,
          description: rncData.description + whyText
        })
      });
      setIsRNCFormOpen(false);
      toast.success('RNC com Análise de Causa Raiz aberta com sucesso!');
      setRncData({ inventory_id: 0, description: '', severity: 'Média', why1: '', why2: '', why3: '', why4: '', why5: '', disposition: 'Retrabalho' });
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao abrir RNC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRnc || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch('/api/qa/rncs/' + currentRnc.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionData)
      });
      setRncActionModalOpen(false);
      toast.success('RNC tratada com Disposição Final!');
      setCurrentRnc(null);
      fetchData();
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar RNC');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCapa = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Plano de Ação (5W2H) gerado com sucesso!');
    setIsCapaFormOpen(false);
  };

  const handleReleaseQuarantine = (id: string, decision: 'Liberado' | 'Descartado') => {
    setQuarantineItems(prev => prev.map(item => item.id === id ? { ...item, status: decision } : item));
    toast.success(`Lote ${decision === 'Liberado' ? 'liberado para produção' : 'descartado/sucata'} com laudo de QA!`);
  };

  // Cálculos para o Dashboard
  const totalInspectedQty = inspections.reduce((sum, item) => sum + (item.quantidade_inspecionada || 0), 0);
  const totalApprovedQty = inspections.reduce((sum, item) => sum + (item.quantidade_aprovada || 0), 0);
  const iqfRate = totalInspectedQty > 0 ? ((totalApprovedQty / totalInspectedQty) * 100).toFixed(1) : '100.0';
  const openRncsCount = rncs.filter(r => r.status === 'Aberta' || r.status === 'Em Análise').length;
  const quarantineActiveCount = quarantineItems.filter(q => q.status === 'Em Análise').length;

  return (
    <div className="flex flex-col h-full glass-panel rounded-lg border-[var(--border)] overflow-hidden relative">
      {/* TOOLBAR E TABS DE NAVEGAÇÃO SUPERIOR DO SISTEMA DE QUALIDADE */}
      <div className="p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-[var(--color-kingstar-cyan)]/10 border border-[var(--color-kingstar-cyan)]/30 text-[var(--color-kingstar-cyan)]">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-wide text-white uppercase">
              GESTÃO DE QUALIDADE & INSPEÇÃO (IQF)
            </h2>
            <p className="text-[10px] text-[#8b9dc3]">Ciclo Completo do Assistente QA • Manufatura & Estoque</p>
          </div>
        </div>
        
        {/* ABAS DO CICLO DO ASSISTENTE DE QUALIDADE */}
        <div className="flex flex-wrap bg-[#121212] rounded-md border border-[var(--border)] overflow-hidden text-xs">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={cn("px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5", activeTab === 'dashboard' ? 'bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)]' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <BarChart3 size={13} /> Visão Geral & Ciclo
          </button>
          <button 
            onClick={() => setActiveTab('inspections')}
            className={cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === 'inspections' ? 'bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)]' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <ClipboardCheck size={13} /> 1. Inspeção (IQF)
          </button>
          <button 
            onClick={() => setActiveTab('rncs')}
            className={cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === 'rncs' ? 'bg-[var(--color-kingstar-red)]/20 text-[var(--color-kingstar-red)]' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <FileWarning size={13} /> 2. RNC & 5 Porquês
          </button>
          <button 
            onClick={() => setActiveTab('capa')}
            className={cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === 'capa' ? 'bg-[var(--color-kingstar-green)]/20 text-[var(--color-kingstar-green)]' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <CheckSquare size={13} /> 3. Plano CAPA
          </button>
          <button 
            onClick={() => setActiveTab('quarantine')}
            className={cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === 'quarantine' ? 'bg-[var(--color-kingstar-yellow)]/20 text-[var(--color-kingstar-yellow)]' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <Lock size={13} /> 4. Quarentena
          </button>
          <button 
            onClick={() => setActiveTab('metrology')}
            className={cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === 'metrology' ? 'bg-purple-500/20 text-purple-400' : 'text-[#8b9dc3] hover:bg-white/5')}
          >
            <Wrench size={13} /> 5. Instrumentos
          </button>
        </div>
        
        {/* BOTÕES DE AÇÃO RÁPIDA */}
        <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
          <button 
            onClick={() => setIsInspectionFormOpen(true)}
            className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-3 py-1.5 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.2)] flex-1 sm:flex-none"
          >
            <Plus size={15} /> NOVA INSPEÇÃO
          </button>
          <button 
            onClick={() => setIsRNCFormOpen(true)}
            className="bg-[var(--color-kingstar-red)] text-white text-xs font-bold px-3 py-1.5 rounded-sm hover:bg-[var(--color-kingstar-red)]/90 transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
          >
            <AlertTriangle size={15} /> ABRIR RNC
          </button>
        </div>
      </div>

      {/* MODAL DE ETIQUETA DE INSPEÇÃO IMPRIMÍVEL */}
      {labelModalOpen && selectedInspectionForLabel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-white uppercase tracking-wide text-xs flex items-center gap-2">
                <Printer size={16} className="text-[var(--color-kingstar-cyan)]" /> ETIQUETA DE LAUDO QA (IQF)
              </h3>
              <button onClick={() => setLabelModalOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>

            {/* CARD DE ETIQUETA COM COR CONFORME APROVAÇÃO */}
            <div className="p-6">
              <div className={cn(
                "p-5 rounded-lg border-2 flex flex-col gap-3 text-black",
                selectedInspectionForLabel.status === 'Aprovado' ? "bg-emerald-400 border-emerald-600" :
                selectedInspectionForLabel.status === 'Reprovado' ? "bg-red-500 text-white border-red-700" :
                "bg-amber-400 border-amber-600"
              )}>
                <div className="flex items-center justify-between border-b border-black/20 pb-2">
                  <span className="font-black tracking-widest uppercase text-sm">KINGSTAR QUALIDADE</span>
                  <span className="text-xs font-mono font-bold">IQF #{selectedInspectionForLabel.id.toString().padStart(4, '0')}</span>
                </div>

                <div className="text-center py-2">
                  <span className="text-2xl font-black uppercase tracking-wider block">
                    {selectedInspectionForLabel.status === 'Aprovado' ? 'A P R O V A D O' :
                     selectedInspectionForLabel.status === 'Reprovado' ? 'R E J E I T A D O' :
                     'A P R O V.   R E S S A L V A'}
                  </span>
                  <span className="text-[10px] opacity-80 uppercase block mt-0.5">Laudo Oficial de Inspeção no Recebimento</span>
                </div>

                <div className="space-y-1 text-xs font-medium border-t border-black/20 pt-2">
                  <p><strong>MATERIAL:</strong> {selectedInspectionForLabel.material_name}</p>
                  <p><strong>INSPECIONADO:</strong> {selectedInspectionForLabel.quantidade_inspecionada} | <strong>APROVADO:</strong> {selectedInspectionForLabel.quantidade_aprovada} | <strong>REJ:</strong> {selectedInspectionForLabel.quantidade_rejeitada}</p>
                  <p><strong>TIPO:</strong> {selectedInspectionForLabel.tipo} • <strong>DATA:</strong> {new Date(selectedInspectionForLabel.created_at).toLocaleDateString('pt-BR')}</p>
                  <p><strong>INSPETOR:</strong> {selectedInspectionForLabel.inspector || 'QA Técnico'}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-black/20 flex items-center justify-between text-[10px] uppercase font-bold">
                  <span>SISTEMA DE GESTÃO DA QUALIDADE</span>
                  <span>ISO 9001:2015</span>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    toast.success('Etiqueta enviada para a impressora de código de barras / térmica!');
                    setLabelModalOpen(false);
                  }}
                  className="w-full bg-[var(--color-kingstar-cyan)] text-black font-bold py-2.5 rounded text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <Printer size={16} /> IMPRIMIR ETIQUETA TÉRMICA (QR CODE)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION FORM MODAL COM CHECKLIST TÉCNICO COMPLETO */}
      {isInspectionFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm flex items-center gap-2">
                <ClipboardCheck size={16} />
                Registrar Inspeção de Qualidade (com Checklist Técnico)
              </h3>
              <button onClick={() => setIsInspectionFormOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleInspectionSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Material do Estoque / Recebimento</label>
                  <select required value={inspectionData.inventory_id} onChange={e => setInspectionData({...inspectionData, inventory_id: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors">
                    <option value={0} disabled>Selecione um material</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.material} ({item.fornecedor || 'Geral'} • Estoque: {item.quantidade})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Ponto de Inspeção</label>
                  <select required value={inspectionData.tipo} onChange={e => setInspectionData({...inspectionData, tipo: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors">
                    <option value="Recebimento">1. Inspeção no Recebimento (Entrada IQF)</option>
                    <option value="Produção">2. Inspeção em Processo / Linha</option>
                    <option value="Expedição">3. Inspeção Final / Expedição</option>
                  </select>
                </div>
              </div>

              {/* CHECKLIST DO ASSISTENTE DE QUALIDADE */}
              <div className="p-4 bg-[#121212] border border-[var(--border)] rounded-md space-y-3">
                <span className="text-[11px] font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wider block">
                  Checklist Padrão de Qualidade (Inspeção Física & Documental)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label className="flex items-center gap-2 text-[#e5e5e5] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inspectionData.chk_embalagem} 
                      onChange={e => setInspectionData({...inspectionData, chk_embalagem: e.target.checked})} 
                      className="rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                    />
                    <span>1. Embalagem íntegra e identificada</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#e5e5e5] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inspectionData.chk_dimensional} 
                      onChange={e => setInspectionData({...inspectionData, chk_dimensional: e.target.checked})} 
                      className="rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                    />
                    <span>2. Conformidade dimensional / medida (Paquímetro)</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#e5e5e5] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inspectionData.chk_certificado} 
                      onChange={e => setInspectionData({...inspectionData, chk_certificado: e.target.checked})} 
                      className="rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                    />
                    <span>3. Certificado de Análise (COA / Laudo) confere</span>
                  </label>
                  <label className="flex items-center gap-2 text-[#e5e5e5] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={inspectionData.chk_validade} 
                      onChange={e => setInspectionData({...inspectionData, chk_validade: e.target.checked})} 
                      className="rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                    />
                    <span>4. Lote e rastreabilidade visualizados</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-[#121212] border border-[var(--border)] rounded-md mt-1">
                <div>
                  <label className="block text-[10px] uppercase text-[#5a6a7a] font-semibold mb-1">Qtd. Inspecionada (Amostra/Total)</label>
                  <input type="number" required min="1" value={inspectionData.quantidade_inspecionada} onChange={e => setInspectionData({...inspectionData, quantidade_inspecionada: Number(e.target.value)})} className="w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-white transition-colors font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[var(--color-kingstar-green)] font-semibold mb-1">Qtd. Aprovada</label>
                  <input type="number" required min="0" value={inspectionData.quantidade_aprovada} onChange={e => setInspectionData({...inspectionData, quantidade_aprovada: Number(e.target.value)})} className="w-full bg-[var(--color-kingstar-green)]/10 border border-[var(--color-kingstar-green)]/30 rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-green)] transition-colors font-mono" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[var(--color-kingstar-red)] font-semibold mb-1">Qtd. Rejeitada</label>
                  <input type="number" required min="0" value={inspectionData.quantidade_rejeitada} onChange={e => setInspectionData({...inspectionData, quantidade_rejeitada: Number(e.target.value)})} className="w-full bg-[var(--color-kingstar-red)]/10 border border-[var(--color-kingstar-red)]/30 rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Parecer / Status Final</label>
                  <div className={cn(
                    "w-full border rounded px-3 py-2 text-sm font-semibold flex items-center gap-2",
                    inspectionData.status === 'Aprovado' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                    inspectionData.status === 'Reprovado' ? "bg-red-500/10 border-red-500/30 text-red-400" :
                    "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    {inspectionData.status}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Inspetor QA (Responsável)</label>
                  <input type="text" required value={inspectionData.inspector} onChange={e => setInspectionData({...inspectionData, inspector: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" placeholder="Ex: João Silva (CQ)" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Laudo e Observações do Teste</label>
                <textarea rows={3} value={inspectionData.observacoes} onChange={e => setInspectionData({...inspectionData, observacoes: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors" placeholder="Descreva as tolerâncias verificadas, número de nota fiscal ou desvios observados..." />
              </div>

              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setIsInspectionFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting || inspectionData.inventory_id === 0} className="px-4 py-2 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'SALVANDO...' : 'REGISTRAR INSPEÇÃO & LAUDO'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RNC FORM MODAL COM ANÁLISE DOS 5 PORQUÊS */}
      {isRNCFormOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-red)]/30 rounded-lg w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-red)] uppercase tracking-wide text-sm flex items-center gap-2">
                <FileWarning size={16} />
                Abertura de Não Conformidade (RNC & 5 Porquês)
              </h3>
              <button onClick={() => setIsRNCFormOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={handleRNCSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Material / Lote Afetado</label>
                  <select required value={rncData.inventory_id} onChange={e => setRncData({...rncData, inventory_id: Number(e.target.value)})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors">
                    <option value={0} disabled>Selecione um material</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.material}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Severidade da Ocorrência</label>
                  <select required value={rncData.severity} onChange={e => setRncData({...rncData, severity: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors">
                    <option value="Baixa">Baixa (Defeito estético leve)</option>
                    <option value="Média">Média (Requer retrabalho)</option>
                    <option value="Alta">Alta (Inutiliza o item/lote)</option>
                    <option value="Crítica">Crítica (Risco de cliente / Segurança)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">1. Descrição Detalhada da Não Conformidade</label>
                <textarea required rows={2} value={rncData.description} onChange={e => setRncData({...rncData, description: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors" placeholder="Ex: Peça chegou com diâmetro 0,5mm acima da tolerância superior..." />
              </div>

              {/* ANÁLISE DOS 5 PORQUÊS */}
              <div className="p-4 bg-[#121212] border border-[var(--border)] rounded-md space-y-3">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle size={14} /> Análise de Causa Raiz (Metodologia 5 Porquês)
                </span>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[#8b9dc3] mb-0.5">1º Por quê (o defeito ocorreu?)</label>
                    <input type="text" value={rncData.why1} onChange={e => setRncData({...rncData, why1: e.target.value})} placeholder="Ex: O torno descalibrou durante a usinagem" className="w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8b9dc3] mb-0.5">2º Por quê?</label>
                    <input type="text" value={rncData.why2} onChange={e => setRncData({...rncData, why2: e.target.value})} placeholder="Ex: O operador não fez aferição no início do turno" className="w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" />
                  </div>
                  <div>
                    <label className="block text-[10px] text-amber-400/90 font-bold mb-0.5">3º Por quê (Causa Raiz)?</label>
                    <input type="text" value={rncData.why3} onChange={e => setRncData({...rncData, why3: e.target.value})} placeholder="Ex: Procedimento de check diário não estava no posto de trabalho" className="w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Disposição Imediata do Lote</label>
                <select value={rncData.disposition} onChange={e => setRncData({...rncData, disposition: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white">
                  <option value="Retrabalho">Retrabalho Interno (Correção da peça)</option>
                  <option value="Devolução">Devolução total ao Fornecedor</option>
                  <option value="Sucata">Descarte / Sucatamento</option>
                  <option value="Concessão">Aprovação Concessional (Desvio autorizado pela engenharia)</option>
                </select>
              </div>

              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setIsRNCFormOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting || rncData.inventory_id === 0} className="px-4 py-2 bg-[var(--color-kingstar-red)] text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'SALVANDO...' : 'REGISTRAR RNC COM CAUSA RAIZ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RNC ACTION MODAL (TRATAR RNC) */}
      {rncActionModalOpen && currentRnc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#1e1e1e] border border-[var(--color-kingstar-yellow)]/30 rounded-lg w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-bold text-[var(--color-kingstar-yellow)] uppercase tracking-wide text-sm flex items-center gap-2">
                Tratar RNC #{currentRnc.id}
              </h3>
              <button onClick={() => setRncActionModalOpen(false)} className="text-[#5a6a7a] hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="p-4 bg-[#121212] border-b border-[var(--border)]">
              <p className="text-xs text-[#8b9dc3] mb-1">Material: <span className="text-white font-semibold">{currentRnc.material_name}</span></p>
              <p className="text-xs text-[#8b9dc3] mb-2">Problema: <span className="text-white">{currentRnc.description}</span></p>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Plano de Ação Corretiva (Resolução)</label>
                <textarea required rows={4} value={actionData.action_taken} onChange={e => setActionData({...actionData, action_taken: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] transition-colors" placeholder="Descreva a ação corretiva e prevenção implementada..." />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1">Novo Status da RNC</label>
                <select required value={actionData.status} onChange={e => setActionData({...actionData, status: e.target.value})} className="w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] transition-colors">
                  <option value="Em Análise">Em Análise / Investigação</option>
                  <option value="Resolvida">Resolvida / Concluída com eficácia</option>
                  <option value="Aberta">Mantida Aberta</option>
                </select>
              </div>

              <div className="mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4">
                <button type="button" onClick={() => setRncActionModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors" disabled={isSubmitting}>CANCELAR</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[var(--color-kingstar-yellow)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSubmitting ? 'SALVANDO...' : 'ATUALIZAR RNC'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL DE CONTEÚDO BASEADO NA ABA ATIVA */}
      <div className="flex-1 overflow-auto p-6 bg-[#0f0f0f]">
        {/* ==============================================================================
           1. DASHBOARD & GUIA DO CICLO COMPLETO DO ASSISTENTE DE QUALIDADE
           ============================================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* KPIS RÁPIDOS DA QUALIDADE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8b9dc3]">Índice Aprovação (IQF)</p>
                  <p className="text-2xl font-black text-[var(--color-kingstar-green)] mt-1">{iqfRate}%</p>
                  <p className="text-[11px] text-[#5a6a7a]">De {totalInspectedQty} itens inspecionados</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Award size={20} />
                </div>
              </div>

              <div className="bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8b9dc3]">Inspeções Realizadas</p>
                  <p className="text-2xl font-black text-white mt-1">{inspections.length}</p>
                  <p className="text-[11px] text-[#5a6a7a]">Recebimento e Processo</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
              </div>

              <div className="bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8b9dc3]">RNCs em Aberto</p>
                  <p className="text-2xl font-black text-[var(--color-kingstar-red)] mt-1">{openRncsCount}</p>
                  <p className="text-[11px] text-[#5a6a7a]">Aguardando disposição</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
                  <AlertTriangle size={20} />
                </div>
              </div>

              <div className="bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#8b9dc3]">Lotes em Quarentena</p>
                  <p className="text-2xl font-black text-[var(--color-kingstar-yellow)] mt-1">{quarantineActiveCount}</p>
                  <p className="text-[11px] text-[#5a6a7a]">Retidos pelo laboratório</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Lock size={20} />
                </div>
              </div>
            </div>

            {/* GUIA DO CICLO COMPLETO DO ASSISTENTE DE QUALIDADE */}
            <div className="bg-[#161616] border border-[var(--color-kingstar-cyan)]/30 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="text-[var(--color-kingstar-cyan)]" size={20} />
                <h3 className="font-bold text-white text-base">
                  O Ciclo Completo do Assistente de Qualidade (QA) no Sistema
                </h3>
              </div>
              <p className="text-xs text-[#8b9dc3] mb-6">
                O assistente de qualidade é o guardião dos processos do estoque e da produção. Abaixo está a rotina técnica executada passo a passo dentro desta central de qualidade:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div 
                  onClick={() => setActiveTab('inspections')}
                  className="p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-[var(--color-kingstar-cyan)] rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 font-bold">1</div>
                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-[var(--color-kingstar-cyan)]">Inspeção IQF</h4>
                  <p className="text-[11px] text-[#8b9dc3]">
                    Inspeciona cada nota fiscal de entrada: embalagem, dimensional, COA do fornecedor e amostragem.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('quarantine')}
                  className="p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-amber-400 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 font-bold">2</div>
                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-amber-400">Segregação & Quarentena</h4>
                  <p className="text-[11px] text-[#8b9dc3]">
                    Lotes suspeitos ou reprovados são bloqueados com etiqueta amarela para evitar consumo no estoque.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('rncs')}
                  className="p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-red-400 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center mb-3 font-bold">3</div>
                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-red-400">RNC & 5 Porquês</h4>
                  <p className="text-[11px] text-[#8b9dc3]">
                    Abertura de Relatório de Não Conformidade e aplicação dos 5 Porquês para achar a causa raiz.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('capa')}
                  className="p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-emerald-400 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 font-bold">4</div>
                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-emerald-400">Plano CAPA (5W2H)</h4>
                  <p className="text-[11px] text-[#8b9dc3]">
                    Criação de ação corretiva para eliminar a causa da falha em conjunto com compras e fornecedor.
                  </p>
                </div>

                <div 
                  onClick={() => setActiveTab('metrology')}
                  className="p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-purple-400 rounded-lg transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 font-bold">5</div>
                  <h4 className="font-bold text-white text-xs mb-1 group-hover:text-purple-400">Metrologia & Instrumentos</h4>
                  <p className="text-[11px] text-[#8b9dc3]">
                    Controle de calibração RBC dos paquímetros, balanças e medidores usados nas inspeções.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==============================================================================
           2. ABA: INSPEÇÕES DE QUALIDADE NO RECEBIMENTO / PROCESSO (IQF)
           ============================================================================== */}
        {activeTab === 'inspections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Inspeções Realizadas (IQF)</h3>
                <p className="text-xs text-[#8b9dc3]">Controle de lotes inspecionados com opção de impressão de etiqueta oficial</p>
              </div>
              <button 
                onClick={() => setIsInspectionFormOpen(true)}
                className="bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> NOVA INSPEÇÃO
              </button>
            </div>

            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1a1a1a]">
                  <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold">
                    <th className="p-4 w-16">ID</th>
                    <th className="p-4">Material / Inspetor</th>
                    <th className="p-4">Etapa</th>
                    <th className="p-4 text-center">Inspec. / Aprov. / Rej.</th>
                    <th className="p-4">Parecer</th>
                    <th className="p-4">Data</th>
                    <th className="p-4 text-right">Etiqueta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {inspections.length === 0 ? (
                    <tr><td colSpan={7} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Nenhuma inspeção registrada</td></tr>
                  ) : (
                    inspections.map(insp => (
                      <tr key={insp.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono text-xs text-[#5a6a7a]">#{insp.id.toString().padStart(4, '0')}</td>
                        <td className="p-4">
                          <div className="font-medium text-white">{insp.material_name}</div>
                          <div className="text-[10px] text-[#8b9dc3] mt-0.5">Inspetor: {insp.inspector || 'Analista QA'}</div>
                        </td>
                        <td className="p-4 text-[#8b9dc3]">{insp.tipo}</td>
                        <td className="p-4 text-center font-mono text-xs">
                          <span className="text-white">{insp.quantidade_inspecionada}</span> / <span className="text-emerald-400 font-bold">{insp.quantidade_aprovada}</span> / <span className="text-red-400 font-bold">{insp.quantidade_rejeitada}</span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border font-bold",
                            insp.status === 'Aprovado' ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                            insp.status === 'Reprovado' ? "text-red-400 border-red-500/30 bg-red-500/10" :
                            "text-amber-400 border-amber-500/30 bg-amber-500/10"
                          )}>
                            {insp.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#8b9dc3] font-mono text-xs">
                          {new Date(insp.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedInspectionForLabel(insp);
                              setLabelModalOpen(true);
                            }}
                            className="text-[var(--color-kingstar-cyan)] hover:text-white px-2.5 py-1 text-xs border border-[var(--color-kingstar-cyan)]/30 rounded hover:bg-[var(--color-kingstar-cyan)]/20 transition-colors inline-flex items-center gap-1"
                          >
                            <Printer size={13} /> Laudo / Etiqueta
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================================
           3. ABA: RELATÓRIOS DE NÃO CONFORMIDADE (RNC & 5 PORQUÊS)
           ============================================================================== */}
        {activeTab === 'rncs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Não Conformidades & Análise de Causa Raiz</h3>
                <p className="text-xs text-[#8b9dc3]">Investigação técnica utilizando a metodologia 5 Porquês para definir disposição e evitar reincidência</p>
              </div>
              <button 
                onClick={() => setIsRNCFormOpen(true)}
                className="bg-[var(--color-kingstar-red)] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--color-kingstar-red)]/90 transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle size={14} /> ABRIR RNC
              </button>
            </div>

            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1a1a1a]">
                  <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold">
                    <th className="p-4 w-16">Nº RNC</th>
                    <th className="p-4">Material / Ocorrência</th>
                    <th className="p-4">Gravidade</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Abertura</th>
                    <th className="p-4 text-right">Disposição / Tratar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {rncs.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-[#5a6a7a] font-mono text-sm">Nenhuma RNC em aberto</td></tr>
                  ) : (
                    rncs.map(rnc => (
                      <tr key={rnc.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4 font-mono text-xs text-[#5a6a7a]">RNC-{rnc.id.toString().padStart(4, '0')}</td>
                        <td className="p-4 font-medium text-white max-w-[280px] truncate" title={rnc.description}>
                          <div className="text-white font-semibold">{rnc.material_name}</div>
                          <div className="text-xs text-[#8b9dc3] truncate">{rnc.description}</div>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border font-bold",
                            rnc.severity === 'Baixa' ? "text-blue-400 border-blue-400/30 bg-blue-400/10" :
                            rnc.severity === 'Média' ? "text-amber-400 border-amber-400/30 bg-amber-400/10" :
                            rnc.severity === 'Alta' ? "text-orange-400 border-orange-400/30 bg-orange-400/10" :
                            "text-red-400 border-red-500/30 bg-red-500/10"
                          )}>
                            {rnc.severity}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border",
                            rnc.status === 'Resolvida' ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" :
                            rnc.status === 'Em Análise' ? "text-[var(--color-kingstar-cyan)] border-[var(--color-kingstar-cyan)]/30 bg-[var(--color-kingstar-cyan)]/10" :
                            "text-red-400 border-red-500/30 bg-red-500/10"
                          )}>
                            {rnc.status}
                          </span>
                        </td>
                        <td className="p-4 text-[#8b9dc3] font-mono text-xs">
                          {new Date(rnc.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-right">
                          {rnc.status !== 'Resolvida' ? (
                            <button 
                              onClick={() => {
                                setCurrentRnc(rnc);
                                setActionData({ status: 'Resolvida', action_taken: rnc.action_taken || '', why1: '', why2: '', why3: '', disposition: 'Retrabalho' });
                                setRncActionModalOpen(true);
                              }}
                              className="text-[var(--color-kingstar-yellow)] hover:text-white px-3 py-1 text-xs border border-[var(--color-kingstar-yellow)]/30 rounded hover:bg-[var(--color-kingstar-yellow)]/20 transition-colors font-bold inline-flex items-center gap-1"
                            >
                              Tratar & Dispor
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-semibold">Concluída</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================================
           4. ABA: PLANO DE AÇÃO CORRETIVA E PREVENTIVA (CAPA / 5W2H)
           ============================================================================== */}
        {activeTab === 'capa' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Plano de Ação Corretiva & Preventiva (CAPA / 5W2H)</h3>
                <p className="text-xs text-[#8b9dc3]">Ações direcionadas aos fornecedores e equipe interna para evitar reincidência de RNCs</p>
              </div>
              <button 
                onClick={() => {
                  const newTitle = prompt('Digite o título ou problema do Plano de Ação CAPA:');
                  if (newTitle) {
                    const newCapa: CapaAction = {
                      id: `CAPA-${Math.floor(Math.random() * 899 + 100)}`,
                      title: newTitle,
                      what: 'Implementar checklist em 100% dos lotes recebidos',
                      who: 'Assistente QA / Compras',
                      when: new Date(Date.now() + 604800000).toLocaleDateString('pt-BR'),
                      why: 'Eliminar refugo reincidente na linha de montagem',
                      status: 'Em Andamento',
                      priority: 'Alta'
                    };
                    setCapaActions(prev => [newCapa, ...prev]);
                    toast.success('Novo plano CAPA adicionado!');
                  }
                }}
                className="bg-emerald-500 text-black text-xs font-bold px-3 py-1.5 rounded hover:opacity-90 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> NOVO PLANO CAPA
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {capaActions.map(action => (
                <div key={action.id} className="bg-[#181818] border border-[var(--border)] rounded-lg p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono text-[var(--color-kingstar-cyan)] uppercase font-bold">{action.id}</span>
                      <h4 className="text-sm font-bold text-white">{action.title}</h4>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
                      action.status === 'Concluída' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      action.status === 'Em Andamento' ? "bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)] border border-[var(--color-kingstar-cyan)]/30" :
                      "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    )}>
                      {action.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-[#8b9dc3] border-t border-[var(--border)] pt-2">
                    <p><strong className="text-white">O Quê (What):</strong> {action.what}</p>
                    <p><strong className="text-white">Por Quê (Why):</strong> {action.why}</p>
                    <div className="flex justify-between pt-1 text-[11px]">
                      <span><strong className="text-white">Quem:</strong> {action.who}</span>
                      <span><strong className="text-white">Prazo:</strong> {action.when}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[var(--border)]">
                    {action.status !== 'Concluída' ? (
                      <button 
                        onClick={() => {
                          setCapaActions(prev => prev.map(a => a.id === action.id ? { ...a, status: 'Concluída' } : a));
                          toast.success('Plano CAPA marcado como concluído e eficaz!');
                        }}
                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 rounded font-bold transition-colors"
                      >
                        Concluir e Validar Eficácia
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 size={14} /> Eficácia Verificada
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==============================================================================
           5. ABA: CONTROLE DE QUARENTENA & BLOQUEIO DE ESTOQUE
           ============================================================================== */}
        {activeTab === 'quarantine' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Controle de Quarentena (Lotes Retidos)</h3>
                <p className="text-xs text-[#8b9dc3]">Itens bloqueados pela Qualidade aguardando laudo laboratorial ou decisão do fornecedor</p>
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#1a1a1a]">
                  <tr className="text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold">
                    <th className="p-4">Nº Retenção / Lote</th>
                    <th className="p-4">Material</th>
                    <th className="p-4 text-right">Qtd</th>
                    <th className="p-4">Motivo do Bloqueio</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Ação / Disposição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {quarantineItems.map(item => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-xs font-bold text-[var(--color-kingstar-yellow)]">{item.id}</div>
                        <div className="text-[11px] text-[#8b9dc3]">{item.lote}</div>
                      </td>
                      <td className="p-4 font-medium text-white">{item.material_name}</td>
                      <td className="p-4 text-right font-mono font-bold text-white">{item.quantidade}</td>
                      <td className="p-4 text-xs text-[#8b9dc3] max-w-[260px] truncate">{item.motivo}</td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
                          item.status === 'Liberado' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                          item.status === 'Descartado' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                        )}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {item.status === 'Em Análise' ? (
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleReleaseQuarantine(item.id, 'Liberado')}
                              className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1 rounded font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <Unlock size={13} /> Liberar Lote
                            </button>
                            <button 
                              onClick={() => handleReleaseQuarantine(item.id, 'Descartado')}
                              className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 rounded font-bold transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle size={13} /> Condenar
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#5a6a7a]">Laudo Final Emitido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==============================================================================
           6. ABA: METROLOGIA & CALIBRAÇÃO DE INSTRUMENTOS (RBC)
           ============================================================================== */}
        {activeTab === 'metrology' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Controle de Calibração de Instrumentos de Medição</h3>
                <p className="text-xs text-[#8b9dc3]">Equipamentos utilizados pelo assistente de qualidade no recebimento e inspeções dimensionais</p>
              </div>
              <button 
                onClick={() => {
                  const nome = prompt('Nome do Instrumento (ex: Paquímetro Digital 200mm):');
                  if (nome) {
                    const nextYear = new Date(Date.now() + 31536000000).toLocaleDateString('pt-BR');
                    setInstruments(prev => [
                      {
                        id: `INST-0${prev.length + 1}`,
                        codigo: `CAL-${Math.floor(Math.random() * 90 + 10)}`,
                        nome,
                        faixa_medicao: '0 a 200 mm',
                        ultima_calibracao: new Date().toLocaleDateString('pt-BR'),
                        proxima_calibracao: nextYear,
                        status: 'Calibrado',
                        certificado: `CERT-RBC-${Math.floor(Math.random() * 9000 + 1000)}`
                      },
                      ...prev
                    ]);
                    toast.success('Novo instrumento de medição cadastrado!');
                  }
                }}
                className="bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:opacity-90 transition-colors flex items-center gap-1.5"
              >
                <Plus size={14} /> REGISTRAR INSTRUMENTO
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {instruments.map(inst => (
                <div key={inst.id} className="bg-[#181818] border border-[var(--border)] rounded-lg p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">{inst.codigo}</span>
                      <h4 className="text-sm font-bold text-white">{inst.nome}</h4>
                    </div>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
                      inst.status === 'Calibrado' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                      inst.status === 'Vencendo' ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      "bg-red-500/20 text-red-400 border border-red-500/30"
                    )}>
                      {inst.status}
                    </span>
                  </div>

                  <div className="text-xs text-[#8b9dc3] space-y-1 border-t border-[var(--border)] pt-2">
                    <p><strong className="text-white">Faixa:</strong> {inst.faixa_medicao}</p>
                    <p><strong className="text-white">Certificado:</strong> {inst.certificado}</p>
                    <div className="flex justify-between pt-1 text-[11px]">
                      <span><strong>Última:</strong> {inst.ultima_calibracao}</span>
                      <span className="text-white font-semibold"><strong>Validade:</strong> {inst.proxima_calibracao}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex justify-end">
                    <button 
                      onClick={() => {
                        toast.success(`Certificado ${inst.certificado} visualizado / renovado com sucesso!`);
                      }}
                      className="text-xs text-purple-400 hover:text-white transition-colors font-bold inline-flex items-center gap-1"
                    >
                      <Wrench size={12} /> Aferir / Calibrar Agora
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
