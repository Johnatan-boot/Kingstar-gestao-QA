import { importShared } from './__federation_fn_import-sDFL-KS4.js';
import { j as jsxDevRuntimeExports, c as cn } from './lib-PUNrCftn.js';

const {useState,useEffect} = await importShared('react');
const {ClipboardCheck,AlertTriangle,ShieldCheck,Plus,X,FileWarning,CheckCircle2,XCircle,Printer,Lock,Award,Wrench,CheckSquare,HelpCircle,BarChart3,Unlock} = await importShared('lucide-react');

const toast = await importShared('react-hot-toast');

function QAView({ items, onRefresh }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [inspections, setInspections] = useState([]);
  const [rncs, setRncs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
  const [isRNCFormOpen, setIsRNCFormOpen] = useState(false);
  const [rncActionModalOpen, setRncActionModalOpen] = useState(false);
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [isCapaFormOpen, setIsCapaFormOpen] = useState(false);
  const [selectedInspectionForLabel, setSelectedInspectionForLabel] = useState(null);
  const [currentRnc, setCurrentRnc] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inspectionData, setInspectionData] = useState({
    inventory_id: 0,
    tipo: "Recebimento",
    quantidade_inspecionada: 0,
    quantidade_aprovada: 0,
    quantidade_rejeitada: 0,
    status: "Aprovado",
    observacoes: "",
    inspector: "",
    chk_embalagem: true,
    chk_dimensional: true,
    chk_certificado: true,
    chk_validade: true
  });
  const [rncData, setRncData] = useState({
    inventory_id: 0,
    description: "",
    severity: "Média",
    why1: "",
    why2: "",
    why3: "",
    why4: "",
    why5: "",
    disposition: "Retrabalho"
  });
  const [actionData, setActionData] = useState({
    status: "Resolvida",
    action_taken: "",
    why1: "",
    why2: "",
    why3: "",
    disposition: "Retrabalho"
  });
  const [capaActions, setCapaActions] = useState(() => {
    const saved = localStorage.getItem("kingstar_qa_capa");
    return saved ? JSON.parse(saved) : [];
  });
  const [quarantineItems, setQuarantineItems] = useState(() => {
    const saved = localStorage.getItem("kingstar_qa_quarantine");
    return saved ? JSON.parse(saved) : [];
  });
  const [instruments, setInstruments] = useState(() => {
    const saved = localStorage.getItem("kingstar_qa_instruments");
    return saved ? JSON.parse(saved) : [];
  });
  useEffect(() => {
    localStorage.setItem("kingstar_qa_capa", JSON.stringify(capaActions));
  }, [capaActions]);
  useEffect(() => {
    localStorage.setItem("kingstar_qa_quarantine", JSON.stringify(quarantineItems));
  }, [quarantineItems]);
  useEffect(() => {
    localStorage.setItem("kingstar_qa_instruments", JSON.stringify(instruments));
  }, [instruments]);
  const fetchData = async () => {
    setLoading(true);
    try {
      const [inspRes, rncRes] = await Promise.all([
        fetch("/api/qa/inspections"),
        fetch("/api/qa/rncs")
      ]);
      const inspData = await inspRes.json();
      const rncData2 = await rncRes.json();
      setInspections(Array.isArray(inspData) ? inspData : []);
      setRncs(Array.isArray(rncData2) ? rncData2 : []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao buscar dados de Qualidade");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    if (inspectionData.quantidade_rejeitada > 0 && inspectionData.quantidade_aprovada === 0) {
      setInspectionData((prev) => ({ ...prev, status: "Reprovado" }));
    } else if (inspectionData.quantidade_rejeitada > 0 && inspectionData.quantidade_aprovada > 0) {
      setInspectionData((prev) => ({ ...prev, status: "Aprovado com Restrição" }));
    } else if (inspectionData.quantidade_inspecionada > 0 && inspectionData.quantidade_rejeitada === 0) {
      setInspectionData((prev) => ({ ...prev, status: "Aprovado" }));
    }
  }, [inspectionData.quantidade_aprovada, inspectionData.quantidade_rejeitada, inspectionData.quantidade_inspecionada]);
  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (inspectionData.quantidade_aprovada + inspectionData.quantidade_rejeitada !== inspectionData.quantidade_inspecionada) {
      toast.error("A soma de aprovados e rejeitados deve ser igual à quantidade inspecionada!");
      return;
    }
    setIsSubmitting(true);
    try {
      const checklistText = `
[CHECKLIST TÉCNICO] Embalagem: ${inspectionData.chk_embalagem ? "OK" : "FALHA"} | Dimensional: ${inspectionData.chk_dimensional ? "OK" : "FALHA"} | Certificado COA: ${inspectionData.chk_certificado ? "OK" : "PENDENTE"} | Validade/Lote: ${inspectionData.chk_validade ? "OK" : "FALHA"}`;
      const payload = {
        ...inspectionData,
        observacoes: (inspectionData.observacoes || "") + checklistText
      };
      const res = await fetch("/api/qa/inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Falha na resposta");
      setIsInspectionFormOpen(false);
      toast.success("Inspeção com Checklist Técnico registrada!");
      if (inspectionData.quantidade_rejeitada > 0) {
        toast.error("Uma RNC e item em Quarentena gerados pelo sistema.", { duration: 5e3 });
        const mat = items.find((i) => i.id === inspectionData.inventory_id);
        const newQuarantine = {
          id: `QRT-${Date.now().toString().slice(-4)}`,
          material_name: mat?.material || "Material Inspecionado",
          lote: `LOTE-${(/* @__PURE__ */ new Date()).getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
          quantidade: inspectionData.quantidade_rejeitada,
          motivo: `Reprovado em Inspeção de Qualidade (${inspectionData.tipo})`,
          data_retencao: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
          responsavel: inspectionData.inspector || "Inspetor QA",
          status: "Em Análise"
        };
        setQuarantineItems((prev) => [newQuarantine, ...prev]);
      }
      setInspectionData({
        inventory_id: 0,
        tipo: "Recebimento",
        quantidade_inspecionada: 0,
        quantidade_aprovada: 0,
        quantidade_rejeitada: 0,
        status: "Aprovado",
        observacoes: "",
        inspector: "",
        chk_embalagem: true,
        chk_dimensional: true,
        chk_certificado: true,
        chk_validade: true
      });
      fetchData();
      onRefresh();
    } catch (e2) {
      console.error(e2);
      toast.error("Erro ao registrar inspeção");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleRNCSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const whyText = rncData.why1 ? `

[ANÁLISE 5 PORQUÊS]
1. Por quê? ${rncData.why1}
2. Por quê? ${rncData.why2 || "-"}
3. Por quê? ${rncData.why3 || "-"}
4. Por quê? ${rncData.why4 || "-"}
5. Por quê (Causa Raiz)? ${rncData.why5 || "-"}
Disposição: ${rncData.disposition}` : "";
      await fetch("/api/qa/rncs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rncData,
          description: rncData.description + whyText
        })
      });
      setIsRNCFormOpen(false);
      toast.success("RNC com Análise de Causa Raiz aberta com sucesso!");
      setRncData({ inventory_id: 0, description: "", severity: "Média", why1: "", why2: "", why3: "", why4: "", why5: "", disposition: "Retrabalho" });
      fetchData();
    } catch (e2) {
      console.error(e2);
      toast.error("Erro ao abrir RNC");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!currentRnc || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/qa/rncs/" + currentRnc.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actionData)
      });
      setRncActionModalOpen(false);
      toast.success("RNC tratada com Disposição Final!");
      setCurrentRnc(null);
      fetchData();
    } catch (e2) {
      console.error(e2);
      toast.error("Erro ao atualizar RNC");
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleReleaseQuarantine = (id, decision) => {
    setQuarantineItems((prev) => prev.map((item) => item.id === id ? { ...item, status: decision } : item));
    toast.success(`Lote ${decision === "Liberado" ? "liberado para produção" : "descartado/sucata"} com laudo de QA!`);
  };
  const totalInspectedQty = inspections.reduce((sum, item) => sum + (item.quantidade_inspecionada || 0), 0);
  const totalApprovedQty = inspections.reduce((sum, item) => sum + (item.quantidade_aprovada || 0), 0);
  const iqfRate = totalInspectedQty > 0 ? (totalApprovedQty / totalInspectedQty * 100).toFixed(1) : "100.0";
  const openRncsCount = rncs.filter((r) => r.status === "Aberta" || r.status === "Em Análise").length;
  const quarantineActiveCount = quarantineItems.filter((q) => q.status === "Em Análise").length;
  return /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-col h-full glass-panel rounded-lg border-[var(--border)] overflow-hidden relative", children: [
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-[var(--border)] bg-[#1e1e1e] flex flex-wrap items-center justify-between gap-4 shrink-0", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-2 rounded bg-[var(--color-kingstar-cyan)]/10 border border-[var(--color-kingstar-cyan)]/30 text-[var(--color-kingstar-cyan)]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ShieldCheck, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 361,
          columnNumber: 13
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 360,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h2", { className: "text-sm font-bold tracking-wide text-white uppercase", children: "GESTÃO DE QUALIDADE & INSPEÇÃO (IQF)" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 364,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[10px] text-[#8b9dc3]", children: "Ciclo Completo do Assistente QA • Manufatura & Estoque" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 367,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 363,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 359,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap bg-[#121212] rounded-md border border-[var(--border)] overflow-hidden text-xs", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("dashboard"),
            className: cn("px-3 py-1.5 font-semibold transition-colors flex items-center gap-1.5", activeTab === "dashboard" ? "bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)]" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(BarChart3, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 377,
                columnNumber: 13
              }, this),
              " Visão Geral & Ciclo"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 373,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("inspections"),
            className: cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === "inspections" ? "bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)]" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ClipboardCheck, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 383,
                columnNumber: 13
              }, this),
              " 1. Inspeção (IQF)"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 379,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("rncs"),
            className: cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === "rncs" ? "bg-[var(--color-kingstar-red)]/20 text-[var(--color-kingstar-red)]" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(FileWarning, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 389,
                columnNumber: 13
              }, this),
              " 2. RNC & 5 Porquês"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 385,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("capa"),
            className: cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === "capa" ? "bg-[var(--color-kingstar-green)]/20 text-[var(--color-kingstar-green)]" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CheckSquare, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 395,
                columnNumber: 13
              }, this),
              " 3. Plano CAPA"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 391,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("quarantine"),
            className: cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === "quarantine" ? "bg-[var(--color-kingstar-yellow)]/20 text-[var(--color-kingstar-yellow)]" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Lock, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 401,
                columnNumber: 13
              }, this),
              " 4. Quarentena"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 397,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setActiveTab("metrology"),
            className: cn("px-3 py-1.5 font-semibold transition-colors border-l border-[var(--border)] flex items-center gap-1.5", activeTab === "metrology" ? "bg-purple-500/20 text-purple-400" : "text-[#8b9dc3] hover:bg-white/5"),
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Wrench, { size: 13 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 407,
                columnNumber: 13
              }, this),
              " 5. Instrumentos"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 403,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 372,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex flex-wrap gap-2 w-full sm:w-auto justify-end", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setIsInspectionFormOpen(true),
            className: "bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-3 py-1.5 rounded-sm hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.2)] flex-1 sm:flex-none",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Plus, { size: 15 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 417,
                columnNumber: 13
              }, this),
              " NOVA INSPEÇÃO"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 413,
            columnNumber: 11
          },
          this
        ),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            onClick: () => setIsRNCFormOpen(true),
            className: "bg-[var(--color-kingstar-red)] text-white text-xs font-bold px-3 py-1.5 rounded-sm hover:bg-[var(--color-kingstar-red)]/90 transition-colors flex items-center justify-center gap-1.5 flex-1 sm:flex-none",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AlertTriangle, { size: 15 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 423,
                columnNumber: 13
              }, this),
              " ABRIR RNC"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 419,
            columnNumber: 11
          },
          this
        )
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 412,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 358,
      columnNumber: 7
    }, this),
    labelModalOpen && selectedInspectionForLabel && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-md shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-[var(--border)] flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white uppercase tracking-wide text-xs flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Printer, { size: 16, className: "text-[var(--color-kingstar-cyan)]" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 434,
            columnNumber: 17
          }, this),
          " ETIQUETA DE LAUDO QA (IQF)"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 433,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { onClick: () => setLabelModalOpen(false), className: "text-[#5a6a7a] hover:text-white", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(X, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 436,
          columnNumber: 108
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 436,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 432,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: cn(
          "p-5 rounded-lg border-2 flex flex-col gap-3 text-black",
          selectedInspectionForLabel.status === "Aprovado" ? "bg-emerald-400 border-emerald-600" : selectedInspectionForLabel.status === "Reprovado" ? "bg-red-500 text-white border-red-700" : "bg-amber-400 border-amber-600"
        ), children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between border-b border-black/20 pb-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "font-black tracking-widest uppercase text-sm", children: "KINGSTAR QUALIDADE" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 448,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs font-mono font-bold", children: [
              "IQF #",
              selectedInspectionForLabel.id.toString().padStart(4, "0")
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 449,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 447,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-center py-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-2xl font-black uppercase tracking-wider block", children: selectedInspectionForLabel.status === "Aprovado" ? "A P R O V A D O" : selectedInspectionForLabel.status === "Reprovado" ? "R E J E I T A D O" : "A P R O V.   R E S S A L V A" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 453,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-[10px] opacity-80 uppercase block mt-0.5", children: "Laudo Oficial de Inspeção no Recebimento" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 458,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 452,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-1 text-xs font-medium border-t border-black/20 pt-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "MATERIAL:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 462,
                columnNumber: 22
              }, this),
              " ",
              selectedInspectionForLabel.material_name
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 462,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "INSPECIONADO:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 463,
                columnNumber: 22
              }, this),
              " ",
              selectedInspectionForLabel.quantidade_inspecionada,
              " | ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "APROVADO:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 463,
                columnNumber: 108
              }, this),
              " ",
              selectedInspectionForLabel.quantidade_aprovada,
              " | ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "REJ:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 463,
                columnNumber: 186
              }, this),
              " ",
              selectedInspectionForLabel.quantidade_rejeitada
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 463,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "TIPO:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 464,
                columnNumber: 22
              }, this),
              " ",
              selectedInspectionForLabel.tipo,
              " • ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "DATA:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 464,
                columnNumber: 81
              }, this),
              " ",
              new Date(selectedInspectionForLabel.created_at).toLocaleDateString("pt-BR")
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 464,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "INSPETOR:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 465,
                columnNumber: 22
              }, this),
              " ",
              selectedInspectionForLabel.inspector || "QA Técnico"
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 465,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 461,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-2 pt-2 border-t border-black/20 flex items-center justify-between text-[10px] uppercase font-bold", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "SISTEMA DE GESTÃO DA QUALIDADE" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 469,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "ISO 9001:2015" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 470,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 468,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 441,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 flex justify-end gap-2", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
          "button",
          {
            type: "button",
            onClick: () => {
              toast.success("Etiqueta enviada para a impressora de código de barras / térmica!");
              setLabelModalOpen(false);
            },
            className: "w-full bg-[var(--color-kingstar-cyan)] text-black font-bold py-2.5 rounded text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity",
            children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Printer, { size: 16 }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 483,
                columnNumber: 19
              }, this),
              " IMPRIMIR ETIQUETA TÉRMICA (QR CODE)"
            ]
          },
          void 0,
          true,
          {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 475,
            columnNumber: 17
          },
          this
        ) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 474,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 440,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 431,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 430,
      columnNumber: 9
    }, this),
    isInspectionFormOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#1e1e1e] border border-[var(--color-kingstar-cyan)]/30 rounded-lg w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-[var(--border)] flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wide text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ClipboardCheck, { size: 16 }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 497,
            columnNumber: 17
          }, this),
          "Registrar Inspeção de Qualidade (com Checklist Técnico)"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 496,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { onClick: () => setIsInspectionFormOpen(false), className: "text-[#5a6a7a] hover:text-white", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(X, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 500,
          columnNumber: 114
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 500,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 495,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleInspectionSubmit, className: "p-6 flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Material do Estoque / Recebimento" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 505,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { required: true, value: inspectionData.inventory_id, onChange: (e) => setInspectionData({ ...inspectionData, inventory_id: Number(e.target.value) }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: 0, disabled: true, children: "Selecione um material" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 507,
                columnNumber: 21
              }, this),
              items.map((item) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: item.id, children: [
                item.material,
                " (",
                item.fornecedor || "Geral",
                " • Estoque: ",
                item.quantidade,
                ")"
              ] }, item.id, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 509,
                columnNumber: 23
              }, this))
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 506,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 504,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Ponto de Inspeção" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 514,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { required: true, value: inspectionData.tipo, onChange: (e) => setInspectionData({ ...inspectionData, tipo: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Recebimento", children: "1. Inspeção no Recebimento (Entrada IQF)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 516,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Produção", children: "2. Inspeção em Processo / Linha" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 517,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Expedição", children: "3. Inspeção Final / Expedição" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 518,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 515,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 513,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 503,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-[#121212] border border-[var(--border)] rounded-md space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-[11px] font-bold text-[var(--color-kingstar-cyan)] uppercase tracking-wider block", children: "Checklist Padrão de Qualidade (Inspeção Física & Documental)" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 525,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "flex items-center gap-2 text-[#e5e5e5] cursor-pointer", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: inspectionData.chk_embalagem,
                  onChange: (e) => setInspectionData({ ...inspectionData, chk_embalagem: e.target.checked }),
                  className: "rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 530,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "1. Embalagem íntegra e identificada" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 536,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 529,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "flex items-center gap-2 text-[#e5e5e5] cursor-pointer", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: inspectionData.chk_dimensional,
                  onChange: (e) => setInspectionData({ ...inspectionData, chk_dimensional: e.target.checked }),
                  className: "rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 539,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "2. Conformidade dimensional / medida (Paquímetro)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 545,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 538,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "flex items-center gap-2 text-[#e5e5e5] cursor-pointer", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: inspectionData.chk_certificado,
                  onChange: (e) => setInspectionData({ ...inspectionData, chk_certificado: e.target.checked }),
                  className: "rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 548,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "3. Certificado de Análise (COA / Laudo) confere" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 554,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 547,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "flex items-center gap-2 text-[#e5e5e5] cursor-pointer", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "input",
                {
                  type: "checkbox",
                  checked: inspectionData.chk_validade,
                  onChange: (e) => setInspectionData({ ...inspectionData, chk_validade: e.target.checked }),
                  className: "rounded border-[var(--border)] bg-[#1a1a1a] text-[var(--color-kingstar-cyan)]"
                },
                void 0,
                false,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 557,
                  columnNumber: 21
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: "4. Lote e rastreabilidade visualizados" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 563,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 556,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 528,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 524,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-3 gap-4 p-4 bg-[#121212] border border-[var(--border)] rounded-md mt-1", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#5a6a7a] font-semibold mb-1", children: "Qtd. Inspecionada (Amostra/Total)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 570,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "number", required: true, min: "1", value: inspectionData.quantidade_inspecionada, onChange: (e) => setInspectionData({ ...inspectionData, quantidade_inspecionada: Number(e.target.value) }), className: "w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-white transition-colors font-mono" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 571,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 569,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[var(--color-kingstar-green)] font-semibold mb-1", children: "Qtd. Aprovada" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 574,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "number", required: true, min: "0", value: inspectionData.quantidade_aprovada, onChange: (e) => setInspectionData({ ...inspectionData, quantidade_aprovada: Number(e.target.value) }), className: "w-full bg-[var(--color-kingstar-green)]/10 border border-[var(--color-kingstar-green)]/30 rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-green)] transition-colors font-mono" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 575,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 573,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[var(--color-kingstar-red)] font-semibold mb-1", children: "Qtd. Rejeitada" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 578,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "number", required: true, min: "0", value: inspectionData.quantidade_rejeitada, onChange: (e) => setInspectionData({ ...inspectionData, quantidade_rejeitada: Number(e.target.value) }), className: "w-full bg-[var(--color-kingstar-red)]/10 border border-[var(--color-kingstar-red)]/30 rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors font-mono" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 579,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 577,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 568,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Parecer / Status Final" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 585,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: cn(
              "w-full border rounded px-3 py-2 text-sm font-semibold flex items-center gap-2",
              inspectionData.status === "Aprovado" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : inspectionData.status === "Reprovado" ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            ), children: inspectionData.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 586,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 584,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Inspetor QA (Responsável)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 596,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "text", required: true, value: inspectionData.inspector, onChange: (e) => setInspectionData({ ...inspectionData, inspector: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors", placeholder: "Ex: João Silva (CQ)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 597,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 595,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 583,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Laudo e Observações do Teste" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 602,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("textarea", { rows: 3, value: inspectionData.observacoes, onChange: (e) => setInspectionData({ ...inspectionData, observacoes: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-cyan)] transition-colors", placeholder: "Descreva as tolerâncias verificadas, número de nota fiscal ou desvios observados..." }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 603,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 601,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "button", onClick: () => setIsInspectionFormOpen(false), className: "px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors", disabled: isSubmitting, children: "CANCELAR" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 607,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "submit", disabled: isSubmitting || inspectionData.inventory_id === 0, className: "px-4 py-2 bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50", children: isSubmitting ? "SALVANDO..." : "REGISTRAR INSPEÇÃO & LAUDO" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 608,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 606,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 502,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 494,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 493,
      columnNumber: 9
    }, this),
    isRNCFormOpen && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#1e1e1e] border border-[var(--color-kingstar-red)]/30 rounded-lg w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-[var(--border)] flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-[var(--color-kingstar-red)] uppercase tracking-wide text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(FileWarning, { size: 16 }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 623,
            columnNumber: 17
          }, this),
          "Abertura de Não Conformidade (RNC & 5 Porquês)"
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 622,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { onClick: () => setIsRNCFormOpen(false), className: "text-[#5a6a7a] hover:text-white", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(X, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 626,
          columnNumber: 107
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 626,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 621,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleRNCSubmit, className: "p-6 flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Material / Lote Afetado" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 631,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { required: true, value: rncData.inventory_id, onChange: (e) => setRncData({ ...rncData, inventory_id: Number(e.target.value) }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: 0, disabled: true, children: "Selecione um material" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 633,
                columnNumber: 21
              }, this),
              items.map((item) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: item.id, children: item.material }, item.id, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 635,
                columnNumber: 23
              }, this))
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 632,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 630,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Severidade da Ocorrência" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 640,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { required: true, value: rncData.severity, onChange: (e) => setRncData({ ...rncData, severity: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Baixa", children: "Baixa (Defeito estético leve)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 642,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Média", children: "Média (Requer retrabalho)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 643,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Alta", children: "Alta (Inutiliza o item/lote)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 644,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Crítica", children: "Crítica (Risco de cliente / Segurança)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 645,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 641,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 639,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 629,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "1. Descrição Detalhada da Não Conformidade" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 651,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("textarea", { required: true, rows: 2, value: rncData.description, onChange: (e) => setRncData({ ...rncData, description: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-red)] transition-colors", placeholder: "Ex: Peça chegou com diâmetro 0,5mm acima da tolerância superior..." }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 652,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 650,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-[#121212] border border-[var(--border)] rounded-md space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(HelpCircle, { size: 14 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 658,
              columnNumber: 19
            }, this),
            " Análise de Causa Raiz (Metodologia 5 Porquês)"
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 657,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-2 text-xs", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] text-[#8b9dc3] mb-0.5", children: "1º Por quê (o defeito ocorreu?)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 662,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "text", value: rncData.why1, onChange: (e) => setRncData({ ...rncData, why1: e.target.value }), placeholder: "Ex: O torno descalibrou durante a usinagem", className: "w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 663,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 661,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] text-[#8b9dc3] mb-0.5", children: "2º Por quê?" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 666,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "text", value: rncData.why2, onChange: (e) => setRncData({ ...rncData, why2: e.target.value }), placeholder: "Ex: O operador não fez aferição no início do turno", className: "w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 667,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 665,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] text-amber-400/90 font-bold mb-0.5", children: "3º Por quê (Causa Raiz)?" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 670,
                columnNumber: 21
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("input", { type: "text", value: rncData.why3, onChange: (e) => setRncData({ ...rncData, why3: e.target.value }), placeholder: "Ex: Procedimento de check diário não estava no posto de trabalho", className: "w-full bg-[#1a1a1a] border border-[var(--border)] rounded px-2.5 py-1.5 text-white" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 671,
                columnNumber: 21
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 669,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 660,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 656,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Disposição Imediata do Lote" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 677,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { value: rncData.disposition, onChange: (e) => setRncData({ ...rncData, disposition: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Retrabalho", children: "Retrabalho Interno (Correção da peça)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 679,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Devolução", children: "Devolução total ao Fornecedor" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 680,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Sucata", children: "Descarte / Sucatamento" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 681,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Concessão", children: "Aprovação Concessional (Desvio autorizado pela engenharia)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 682,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 678,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 676,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "button", onClick: () => setIsRNCFormOpen(false), className: "px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors", disabled: isSubmitting, children: "CANCELAR" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 687,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "submit", disabled: isSubmitting || rncData.inventory_id === 0, className: "px-4 py-2 bg-[var(--color-kingstar-red)] text-white text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50", children: isSubmitting ? "SALVANDO..." : "REGISTRAR RNC COM CAUSA RAIZ" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 688,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 686,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 628,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 620,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 619,
      columnNumber: 9
    }, this),
    rncActionModalOpen && currentRnc && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#1e1e1e] border border-[var(--color-kingstar-yellow)]/30 rounded-lg w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto", children: [
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 border-b border-[var(--border)] flex items-center justify-between", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-[var(--color-kingstar-yellow)] uppercase tracking-wide text-sm flex items-center gap-2", children: [
          "Tratar RNC #",
          currentRnc.id
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 702,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { onClick: () => setRncActionModalOpen(false), className: "text-[#5a6a7a] hover:text-white", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(X, { size: 20 }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 705,
          columnNumber: 112
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 705,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 701,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "p-4 bg-[#121212] border-b border-[var(--border)]", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3] mb-1", children: [
          "Material: ",
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white font-semibold", children: currentRnc.material_name }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 709,
            columnNumber: 68
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 709,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3] mb-2", children: [
          "Problema: ",
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: currentRnc.description }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 710,
            columnNumber: 68
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 710,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 708,
        columnNumber: 13
      }, this),
      /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("form", { onSubmit: handleActionSubmit, className: "p-6 flex flex-col gap-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Plano de Ação Corretiva (Resolução)" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 715,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("textarea", { required: true, rows: 4, value: actionData.action_taken, onChange: (e) => setActionData({ ...actionData, action_taken: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] transition-colors", placeholder: "Descreva a ação corretiva e prevenção implementada..." }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 716,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 714,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("label", { className: "block text-[10px] uppercase text-[#8b9dc3] font-semibold mb-1", children: "Novo Status da RNC" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 720,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("select", { required: true, value: actionData.status, onChange: (e) => setActionData({ ...actionData, status: e.target.value }), className: "w-full bg-[#121212] border border-[var(--border)] rounded px-3 py-2 text-sm text-white focus:border-[var(--color-kingstar-yellow)] transition-colors", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Em Análise", children: "Em Análise / Investigação" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 722,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Resolvida", children: "Resolvida / Concluída com eficácia" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 723,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("option", { value: "Aberta", children: "Mantida Aberta" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 724,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 721,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 719,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "mt-4 flex gap-3 justify-end border-t border-[var(--border)] pt-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "button", onClick: () => setRncActionModalOpen(false), className: "px-4 py-2 text-xs font-semibold text-[#8b9dc3] hover:text-white transition-colors", disabled: isSubmitting, children: "CANCELAR" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 729,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("button", { type: "submit", disabled: isSubmitting, className: "px-4 py-2 bg-[var(--color-kingstar-yellow)] text-black text-xs font-bold rounded-sm hover:opacity-90 transition-opacity disabled:opacity-50", children: isSubmitting ? "SALVANDO..." : "ATUALIZAR RNC" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 730,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 728,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 713,
        columnNumber: 13
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 700,
      columnNumber: 11
    }, this) }, void 0, false, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 699,
      columnNumber: 9
    }, this),
    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex-1 overflow-auto p-6 bg-[#0f0f0f]", children: [
      activeTab === "dashboard" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[10px] uppercase font-bold text-[#8b9dc3]", children: "Índice Aprovação (IQF)" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 750,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-2xl font-black text-[var(--color-kingstar-green)] mt-1", children: [
                iqfRate,
                "%"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 751,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#5a6a7a]", children: [
                "De ",
                totalInspectedQty,
                " itens inspecionados"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 752,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 749,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Award, { size: 20 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 755,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 754,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 748,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[10px] uppercase font-bold text-[#8b9dc3]", children: "Inspeções Realizadas" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 761,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-2xl font-black text-white mt-1", children: inspections.length }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 762,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#5a6a7a]", children: "Recebimento e Processo" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 763,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 760,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ClipboardCheck, { size: 20 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 766,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 765,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 759,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[10px] uppercase font-bold text-[#8b9dc3]", children: "RNCs em Aberto" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 772,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-2xl font-black text-[var(--color-kingstar-red)] mt-1", children: openRncsCount }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 773,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#5a6a7a]", children: "Aguardando disposição" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 774,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 771,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AlertTriangle, { size: 20 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 777,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 776,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 770,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] p-4 rounded-lg flex items-center justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[10px] uppercase font-bold text-[#8b9dc3]", children: "Lotes em Quarentena" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 783,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-2xl font-black text-[var(--color-kingstar-yellow)] mt-1", children: quarantineActiveCount }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 784,
                columnNumber: 19
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#5a6a7a]", children: "Retidos pelo laboratório" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 785,
                columnNumber: 19
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 782,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-10 h-10 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Lock, { size: 20 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 788,
              columnNumber: 19
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 787,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 781,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 747,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#161616] border border-[var(--color-kingstar-cyan)]/30 rounded-lg p-6", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center gap-2 mb-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(ShieldCheck, { className: "text-[var(--color-kingstar-cyan)]", size: 20 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 796,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-base", children: "O Ciclo Completo do Assistente de Qualidade (QA) no Sistema" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 797,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 795,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3] mb-6", children: "O assistente de qualidade é o guardião dos processos do estoque e da produção. Abaixo está a rotina técnica executada passo a passo dentro desta central de qualidade:" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 801,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                onClick: () => setActiveTab("inspections"),
                className: "p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-[var(--color-kingstar-cyan)] rounded-lg transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3 font-bold", children: "1" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 810,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-white text-xs mb-1 group-hover:text-[var(--color-kingstar-cyan)]", children: "Inspeção IQF" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 811,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#8b9dc3]", children: "Inspeciona cada nota fiscal de entrada: embalagem, dimensional, COA do fornecedor e amostragem." }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 812,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 806,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                onClick: () => setActiveTab("quarantine"),
                className: "p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-amber-400 rounded-lg transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 font-bold", children: "2" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 821,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-white text-xs mb-1 group-hover:text-amber-400", children: "Segregação & Quarentena" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 822,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#8b9dc3]", children: "Lotes suspeitos ou reprovados são bloqueados com etiqueta amarela para evitar consumo no estoque." }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 823,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 817,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                onClick: () => setActiveTab("rncs"),
                className: "p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-red-400 rounded-lg transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded bg-red-500/20 text-red-400 flex items-center justify-center mb-3 font-bold", children: "3" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 832,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-white text-xs mb-1 group-hover:text-red-400", children: "RNC & 5 Porquês" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 833,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#8b9dc3]", children: "Abertura de Relatório de Não Conformidade e aplicação dos 5 Porquês para achar a causa raiz." }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 834,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 828,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                onClick: () => setActiveTab("capa"),
                className: "p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-emerald-400 rounded-lg transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3 font-bold", children: "4" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 843,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-white text-xs mb-1 group-hover:text-emerald-400", children: "Plano CAPA (5W2H)" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 844,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#8b9dc3]", children: "Criação de ação corretiva para eliminar a causa da falha em conjunto com compras e fornecedor." }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 845,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 839,
                columnNumber: 17
              },
              this
            ),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "div",
              {
                onClick: () => setActiveTab("metrology"),
                className: "p-4 bg-[#1a1a1a] border border-[var(--border)] hover:border-purple-400 rounded-lg transition-colors cursor-pointer group",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "w-8 h-8 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3 font-bold", children: "5" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 854,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "font-bold text-white text-xs mb-1 group-hover:text-purple-400", children: "Metrologia & Instrumentos" }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 855,
                    columnNumber: 19
                  }, this),
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-[11px] text-[#8b9dc3]", children: "Controle de calibração RBC dos paquímetros, balanças e medidores usados nas inspeções." }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 856,
                    columnNumber: 19
                  }, this)
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 850,
                columnNumber: 17
              },
              this
            )
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 805,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 794,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 745,
        columnNumber: 11
      }, this),
      activeTab === "inspections" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-sm", children: "Inspeções Realizadas (IQF)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 872,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3]", children: "Controle de lotes inspecionados com opção de impressão de etiqueta oficial" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 873,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 871,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setIsInspectionFormOpen(true),
              className: "bg-[var(--color-kingstar-cyan)] text-black text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--color-kingstar-cyan)]/90 transition-colors flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Plus, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 879,
                  columnNumber: 17
                }, this),
                " NOVA INSPEÇÃO"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 875,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 870,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("table", { className: "w-full text-left text-sm whitespace-nowrap", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("thead", { className: "bg-[#1a1a1a]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 w-16", children: "ID" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 887,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Material / Inspetor" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 888,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Etapa" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 889,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 text-center", children: "Inspec. / Aprov. / Rej." }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 890,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Parecer" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 891,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Data" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 892,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 text-right", children: "Etiqueta" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 893,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 886,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 885,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tbody", { className: "divide-y divide-[var(--border)]", children: inspections.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { colSpan: 7, className: "p-8 text-center text-[#5a6a7a] font-mono text-sm", children: "Nenhuma inspeção registrada" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 898,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 898,
            columnNumber: 21
          }, this) : inspections.map((insp) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "hover:bg-white/5 transition-colors group", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 font-mono text-xs text-[#5a6a7a]", children: [
              "#",
              insp.id.toString().padStart(4, "0")
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 902,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-medium text-white", children: insp.material_name }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 904,
                columnNumber: 27
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-[10px] text-[#8b9dc3] mt-0.5", children: [
                "Inspetor: ",
                insp.inspector || "Analista QA"
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 905,
                columnNumber: 27
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 903,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-[#8b9dc3]", children: insp.tipo }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 907,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-center font-mono text-xs", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white", children: insp.quantidade_inspecionada }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 909,
                columnNumber: 27
              }, this),
              " / ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-emerald-400 font-bold", children: insp.quantidade_aprovada }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 909,
                columnNumber: 96
              }, this),
              " / ",
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-red-400 font-bold", children: insp.quantidade_rejeitada }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 909,
                columnNumber: 177
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 908,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border font-bold",
              insp.status === "Aprovado" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : insp.status === "Reprovado" ? "text-red-400 border-red-500/30 bg-red-500/10" : "text-amber-400 border-amber-500/30 bg-amber-500/10"
            ), children: insp.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 912,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 911,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-[#8b9dc3] font-mono text-xs", children: new Date(insp.created_at).toLocaleDateString("pt-BR") }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 921,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-right", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => {
                  setSelectedInspectionForLabel(insp);
                  setLabelModalOpen(true);
                },
                className: "text-[var(--color-kingstar-cyan)] hover:text-white px-2.5 py-1 text-xs border border-[var(--color-kingstar-cyan)]/30 rounded hover:bg-[var(--color-kingstar-cyan)]/20 transition-colors inline-flex items-center gap-1",
                children: [
                  /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Printer, { size: 13 }, void 0, false, {
                    fileName: "/app/applet/src/components/QAView.tsx",
                    lineNumber: 932,
                    columnNumber: 29
                  }, this),
                  " Laudo / Etiqueta"
                ]
              },
              void 0,
              true,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 925,
                columnNumber: 27
              },
              this
            ) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 924,
              columnNumber: 25
            }, this)
          ] }, insp.id, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 901,
            columnNumber: 23
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 896,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 884,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 883,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 869,
        columnNumber: 11
      }, this),
      activeTab === "rncs" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-sm", children: "Não Conformidades & Análise de Causa Raiz" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 951,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3]", children: "Investigação técnica utilizando a metodologia 5 Porquês para definir disposição e evitar reincidência" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 952,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 950,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => setIsRNCFormOpen(true),
              className: "bg-[var(--color-kingstar-red)] text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-[var(--color-kingstar-red)]/90 transition-colors flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(AlertTriangle, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 958,
                  columnNumber: 17
                }, this),
                " ABRIR RNC"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 954,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 949,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("table", { className: "w-full text-left text-sm whitespace-nowrap", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("thead", { className: "bg-[#1a1a1a]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 w-16", children: "Nº RNC" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 966,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Material / Ocorrência" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 967,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Gravidade" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 968,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Status" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 969,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Abertura" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 970,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 text-right", children: "Disposição / Tratar" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 971,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 965,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 964,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tbody", { className: "divide-y divide-[var(--border)]", children: rncs.length === 0 ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { colSpan: 6, className: "p-8 text-center text-[#5a6a7a] font-mono text-sm", children: "Nenhuma RNC em aberto" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 976,
            columnNumber: 25
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 976,
            columnNumber: 21
          }, this) : rncs.map((rnc) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "hover:bg-white/5 transition-colors group", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 font-mono text-xs text-[#5a6a7a]", children: [
              "RNC-",
              rnc.id.toString().padStart(4, "0")
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 980,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 font-medium text-white max-w-[280px] truncate", title: rnc.description, children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-white font-semibold", children: rnc.material_name }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 982,
                columnNumber: 27
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-[#8b9dc3] truncate", children: rnc.description }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 983,
                columnNumber: 27
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 981,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border font-bold",
              rnc.severity === "Baixa" ? "text-blue-400 border-blue-400/30 bg-blue-400/10" : rnc.severity === "Média" ? "text-amber-400 border-amber-400/30 bg-amber-400/10" : rnc.severity === "Alta" ? "text-orange-400 border-orange-400/30 bg-orange-400/10" : "text-red-400 border-red-500/30 bg-red-500/10"
            ), children: rnc.severity }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 986,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 985,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase tracking-wide border",
              rnc.status === "Resolvida" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : rnc.status === "Em Análise" ? "text-[var(--color-kingstar-cyan)] border-[var(--color-kingstar-cyan)]/30 bg-[var(--color-kingstar-cyan)]/10" : "text-red-400 border-red-500/30 bg-red-500/10"
            ), children: rnc.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 997,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 996,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-[#8b9dc3] font-mono text-xs", children: new Date(rnc.created_at).toLocaleDateString("pt-BR") }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1006,
              columnNumber: 25
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-right", children: rnc.status !== "Resolvida" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
              "button",
              {
                onClick: () => {
                  setCurrentRnc(rnc);
                  setActionData({ status: "Resolvida", action_taken: rnc.action_taken || "", why1: "", why2: "", why3: "", disposition: "Retrabalho" });
                  setRncActionModalOpen(true);
                },
                className: "text-[var(--color-kingstar-yellow)] hover:text-white px-3 py-1 text-xs border border-[var(--color-kingstar-yellow)]/30 rounded hover:bg-[var(--color-kingstar-yellow)]/20 transition-colors font-bold inline-flex items-center gap-1",
                children: "Tratar & Dispor"
              },
              void 0,
              false,
              {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1011,
                columnNumber: 29
              },
              this
            ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-emerald-400 font-semibold", children: "Concluída" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1022,
              columnNumber: 29
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1009,
              columnNumber: 25
            }, this)
          ] }, rnc.id, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 979,
            columnNumber: 23
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 974,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 963,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 962,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 948,
        columnNumber: 11
      }, this),
      activeTab === "capa" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-sm", children: "Plano de Ação Corretiva & Preventiva (CAPA / 5W2H)" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1041,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3]", children: "Ações direcionadas aos fornecedores e equipe interna para evitar reincidência de RNCs" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1042,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1040,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => {
                const newTitle = prompt("Digite o título ou problema do Plano de Ação CAPA:");
                if (newTitle) {
                  const newCapa = {
                    id: `CAPA-${Math.floor(Math.random() * 899 + 100)}`,
                    title: newTitle,
                    what: "Implementar checklist em 100% dos lotes recebidos",
                    who: "Assistente QA / Compras",
                    when: new Date(Date.now() + 6048e5).toLocaleDateString("pt-BR"),
                    why: "Eliminar refugo reincidente na linha de montagem",
                    status: "Em Andamento",
                    priority: "Alta"
                  };
                  setCapaActions((prev) => [newCapa, ...prev]);
                  toast.success("Novo plano CAPA adicionado!");
                }
              },
              className: "bg-emerald-500 text-black text-xs font-bold px-3 py-1.5 rounded hover:opacity-90 transition-colors flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Plus, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1064,
                  columnNumber: 17
                }, this),
                " NOVO PLANO CAPA"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1044,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1039,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: capaActions.map((action) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] rounded-lg p-5 space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-[10px] font-mono text-[var(--color-kingstar-cyan)] uppercase font-bold", children: action.id }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1073,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-sm font-bold text-white", children: action.title }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1074,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1072,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
              action.status === "Concluída" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : action.status === "Em Andamento" ? "bg-[var(--color-kingstar-cyan)]/20 text-[var(--color-kingstar-cyan)] border border-[var(--color-kingstar-cyan)]/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            ), children: action.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1076,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1071,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-1 text-xs text-[#8b9dc3] border-t border-[var(--border)] pt-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "O Quê (What):" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1087,
                columnNumber: 24
              }, this),
              " ",
              action.what
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1087,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "Por Quê (Why):" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1088,
                columnNumber: 24
              }, this),
              " ",
              action.why
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1088,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between pt-1 text-[11px]", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "Quem:" }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1090,
                  columnNumber: 29
                }, this),
                " ",
                action.who
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1090,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "Prazo:" }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1091,
                  columnNumber: 29
                }, this),
                " ",
                action.when
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1091,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1089,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1086,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-end pt-2 border-t border-[var(--border)]", children: action.status !== "Concluída" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => {
                setCapaActions((prev) => prev.map((a) => a.id === action.id ? { ...a, status: "Concluída" } : a));
                toast.success("Plano CAPA marcado como concluído e eficaz!");
              },
              className: "text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 rounded font-bold transition-colors",
              children: "Concluir e Validar Eficácia"
            },
            void 0,
            false,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1097,
              columnNumber: 23
            },
            this
          ) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-emerald-400 font-bold flex items-center gap-1", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(CheckCircle2, { size: 14 }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1108,
              columnNumber: 25
            }, this),
            " Eficácia Verificada"
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1107,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1095,
            columnNumber: 19
          }, this)
        ] }, action.id, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1070,
          columnNumber: 17
        }, this)) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1068,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 1038,
        columnNumber: 11
      }, this),
      activeTab === "quarantine" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-sm", children: "Controle de Quarentena (Lotes Retidos)" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1125,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3]", children: "Itens bloqueados pela Qualidade aguardando laudo laboratorial ou decisão do fornecedor" }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1126,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1124,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1123,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "border border-[var(--border)] rounded-lg overflow-hidden bg-[#141414]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("table", { className: "w-full text-left text-sm whitespace-nowrap", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("thead", { className: "bg-[#1a1a1a]", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "text-[#5a6a7a] border-b border-[var(--border)] text-[10px] uppercase tracking-widest font-semibold", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Nº Retenção / Lote" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1134,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Material" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1135,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 text-right", children: "Qtd" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1136,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Motivo do Bloqueio" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1137,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4", children: "Status" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1138,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("th", { className: "p-4 text-right", children: "Ação / Disposição" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1139,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1133,
            columnNumber: 19
          }, this) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1132,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tbody", { className: "divide-y divide-[var(--border)]", children: quarantineItems.map((item) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("tr", { className: "hover:bg-white/5 transition-colors", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "font-mono text-xs font-bold text-[var(--color-kingstar-yellow)]", children: item.id }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1146,
                columnNumber: 25
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-[11px] text-[#8b9dc3]", children: item.lote }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1147,
                columnNumber: 25
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1145,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 font-medium text-white", children: item.material_name }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1149,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-right font-mono font-bold text-white", children: item.quantidade }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1150,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-xs text-[#8b9dc3] max-w-[260px] truncate", children: item.motivo }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1151,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
              item.status === "Liberado" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : item.status === "Descartado" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
            ), children: item.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1153,
              columnNumber: 25
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1152,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("td", { className: "p-4 text-right", children: item.status === "Em Análise" ? /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-end gap-2", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: () => handleReleaseQuarantine(item.id, "Liberado"),
                  className: "text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-2.5 py-1 rounded font-bold transition-colors inline-flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Unlock, { size: 13 }, void 0, false, {
                      fileName: "/app/applet/src/components/QAView.tsx",
                      lineNumber: 1169,
                      columnNumber: 31
                    }, this),
                    " Liberar Lote"
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1165,
                  columnNumber: 29
                },
                this
              ),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
                "button",
                {
                  onClick: () => handleReleaseQuarantine(item.id, "Descartado"),
                  className: "text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 rounded font-bold transition-colors inline-flex items-center gap-1",
                  children: [
                    /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(XCircle, { size: 13 }, void 0, false, {
                      fileName: "/app/applet/src/components/QAView.tsx",
                      lineNumber: 1175,
                      columnNumber: 31
                    }, this),
                    " Condenar"
                  ]
                },
                void 0,
                true,
                {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1171,
                  columnNumber: 29
                },
                this
              )
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1164,
              columnNumber: 27
            }, this) : /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-xs text-[#5a6a7a]", children: "Laudo Final Emitido" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1179,
              columnNumber: 27
            }, this) }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1162,
              columnNumber: 23
            }, this)
          ] }, item.id, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1144,
            columnNumber: 21
          }, this)) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1142,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1131,
          columnNumber: 15
        }, this) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1130,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 1122,
        columnNumber: 11
      }, this),
      activeTab === "metrology" && /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h3", { className: "font-bold text-white text-sm", children: "Controle de Calibração de Instrumentos de Medição" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1197,
              columnNumber: 17
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { className: "text-xs text-[#8b9dc3]", children: "Equipamentos utilizados pelo assistente de qualidade no recebimento e inspeções dimensionais" }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1198,
              columnNumber: 17
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1196,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => {
                const nome = prompt("Nome do Instrumento (ex: Paquímetro Digital 200mm):");
                if (nome) {
                  const nextYear = new Date(Date.now() + 31536e6).toLocaleDateString("pt-BR");
                  setInstruments((prev) => [
                    {
                      id: `INST-0${prev.length + 1}`,
                      codigo: `CAL-${Math.floor(Math.random() * 90 + 10)}`,
                      nome,
                      faixa_medicao: "0 a 200 mm",
                      ultima_calibracao: (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR"),
                      proxima_calibracao: nextYear,
                      status: "Calibrado",
                      certificado: `CERT-RBC-${Math.floor(Math.random() * 9e3 + 1e3)}`
                    },
                    ...prev
                  ]);
                  toast.success("Novo instrumento de medição cadastrado!");
                }
              },
              className: "bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded hover:opacity-90 transition-colors flex items-center gap-1.5",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Plus, { size: 14 }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1223,
                  columnNumber: 17
                }, this),
                " REGISTRAR INSTRUMENTO"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1200,
              columnNumber: 15
            },
            this
          )
        ] }, void 0, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1195,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: instruments.map((inst) => /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "bg-[#181818] border border-[var(--border)] rounded-lg p-5 space-y-3", children: [
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-[10px] font-mono text-purple-400 uppercase font-bold", children: inst.codigo }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1232,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("h4", { className: "text-sm font-bold text-white", children: inst.nome }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1233,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1231,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: cn(
              "text-[10px] px-2 py-0.5 rounded uppercase font-bold",
              inst.status === "Calibrado" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : inst.status === "Vencendo" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
            ), children: inst.status }, void 0, false, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1235,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1230,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "text-xs text-[#8b9dc3] space-y-1 border-t border-[var(--border)] pt-2", children: [
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "Faixa:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1246,
                columnNumber: 24
              }, this),
              " ",
              inst.faixa_medicao
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1246,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("p", { children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { className: "text-white", children: "Certificado:" }, void 0, false, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1247,
                columnNumber: 24
              }, this),
              " ",
              inst.certificado
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1247,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "flex justify-between pt-1 text-[11px]", children: [
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "Última:" }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1249,
                  columnNumber: 29
                }, this),
                " ",
                inst.ultima_calibracao
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1249,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("span", { className: "text-white font-semibold", children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("strong", { children: "Validade:" }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1250,
                  columnNumber: 66
                }, this),
                " ",
                inst.proxima_calibracao
              ] }, void 0, true, {
                fileName: "/app/applet/src/components/QAView.tsx",
                lineNumber: 1250,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1248,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1245,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV("div", { className: "pt-2 border-t border-[var(--border)] flex justify-end", children: /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(
            "button",
            {
              onClick: () => {
                toast.success(`Certificado ${inst.certificado} visualizado / renovado com sucesso!`);
              },
              className: "text-xs text-purple-400 hover:text-white transition-colors font-bold inline-flex items-center gap-1",
              children: [
                /* @__PURE__ */ jsxDevRuntimeExports.jsxDEV(Wrench, { size: 12 }, void 0, false, {
                  fileName: "/app/applet/src/components/QAView.tsx",
                  lineNumber: 1261,
                  columnNumber: 23
                }, this),
                " Aferir / Calibrar Agora"
              ]
            },
            void 0,
            true,
            {
              fileName: "/app/applet/src/components/QAView.tsx",
              lineNumber: 1255,
              columnNumber: 21
            },
            this
          ) }, void 0, false, {
            fileName: "/app/applet/src/components/QAView.tsx",
            lineNumber: 1254,
            columnNumber: 19
          }, this)
        ] }, inst.id, true, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1229,
          columnNumber: 17
        }, this)) }, void 0, false, {
          fileName: "/app/applet/src/components/QAView.tsx",
          lineNumber: 1227,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "/app/applet/src/components/QAView.tsx",
        lineNumber: 1194,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "/app/applet/src/components/QAView.tsx",
      lineNumber: 740,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "/app/applet/src/components/QAView.tsx",
    lineNumber: 356,
    columnNumber: 5
  }, this);
}

export { QAView as default };
