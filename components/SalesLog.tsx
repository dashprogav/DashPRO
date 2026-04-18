import React, { useMemo, useState, useEffect } from 'react';
import { Sale, ProductCategory, AuditLog, Room, CancelType } from '../types';
import { 
  Search, 
  Trash2, 
  RotateCcw, 
  Ban, 
  Edit3, 
  X, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  List, 
  Trash, 
  Check, 
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';

// Helper function to format phone numbers
const maskPhone = (value: string | undefined) => {
  if (!value) return '';
  let x = value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
  if (!x) return '';
  return !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
};

const maskCPF = (value: string | undefined) => {
    if (!value) return '---';
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .slice(0, 14);
};

const columnConfig = {
    cpf: { label: 'CPF' },
    telefone: { label: 'Telefone' },
    cidadeUf: { label: 'Cidade/UF' },
    sala: { label: 'Sala' },
    funcao: { label: 'Função' },
    unidade: { label: 'UND' },
    comissoes: { label: 'Comissões (Meses)' },
    realizavel: { label: 'Total Realizável' },
    cadastro: { label: 'Status Cadastro' }
};

interface SalesLogProps {
  sales: Sale[];
  onMoveToTrash: (id: string) => void;
  onBulkMoveToTrash?: (ids: string[]) => void;
  onEmptyTrash?: () => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onCancel: (id: string, cancellationData: { month: number, year: number, label: string, type: CancelType }) => void;
  onBulkCancel?: (ids: string[], cancellationData: { month: number, year: number, label: string, type: CancelType }) => void;
  onReactivate: (id: string) => void;
  onBulkReactivate?: (ids: string[]) => void;
  onEditInitiate?: (sale: Sale) => void;
}

const SalesLog: React.FC<SalesLogProps> = ({ 
  sales, onMoveToTrash, onBulkMoveToTrash, onEmptyTrash, onRestore, onPermanentDelete, onCancel, onBulkCancel, onReactivate, onBulkReactivate, onEditInitiate
}) => {
  const [viewMode, setViewMode] = useState<'active' | 'trash'>('active');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  const [cpfCopied, setCpfCopied] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [modalState, setModalState] = useState<{
    type: 'trash' | 'restore' | 'delete' | 'emptyTrash' | 'bulkTrash' | 'cancel' | 'bulkCancel' | 'reactivate' | 'bulkReactivate';
    target?: Sale | string[];
  } | null>(null);
  
  const [cancelType, setCancelType] = useState<CancelType | null>(null);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<string>("");

  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const saved = localStorage.getItem('dashpro_column_visibility_v2');
    const defaultVisibility = {
        cpf: false,
        telefone: false,
        cidadeUf: false,
        sala: true,
        funcao: true,
        unidade: true,
        comissoes: false,
        realizavel: false,
        cadastro: true
    };
    return saved ? { ...defaultVisibility, ...JSON.parse(saved) } : defaultVisibility;
  });

  useEffect(() => {
    localStorage.setItem('dashpro_column_visibility_v2', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const formatCurrency = (val: number) => {
    if (val <= 0) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDateFull = (ts: number | undefined) => {
    if (!ts || isNaN(ts)) return 'Data Inválida';
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      'captacao': 'Captação', 'liner': 'Liner', 'closer': 'Closer', 'ftb': 'FTB'
    };
    return labels[cat] || cat;
  };

  const getSaleValueForMonth = (sale: Sale, targetMonth: number, targetYear: number) => {
    if (sale.status === 'Cancelada' && sale.cancelledAt) {
      const type = sale.cancelledAt.type;
      const targetSortKey = targetYear * 12 + targetMonth;

      if (type === 'DENTRO_7') return 0;

      if (type === 'FORA_7') {
        let firstMonthKey: number | null = null;
        const check = (ms: number, val: number) => {
          if (!ms || isNaN(ms) || val <= 0) return;
          const d = new Date(ms);
          const key = d.getFullYear() * 12 + d.getMonth();
          if (firstMonthKey === null || key < firstMonthKey) firstMonthKey = key;
        };
        check(sale.date1, sale.immComm1);
        if (sale.date2 > 0) check(sale.date2, sale.immComm2);
        if (sale.installmentCount > 0) {
          const bd = new Date(sale.date1);
          for (let i = 1; i <= sale.installmentCount; i++) {
            const id = new Date(bd); id.setMonth(id.getMonth() + i);
            check(id.getTime(), sale.installmentCommission);
          }
        }
        if (targetSortKey !== firstMonthKey) return 0;
      }

      if (type === 'CORTE') {
        const cutSortKey = sale.cancelledAt.year * 12 + sale.cancelledAt.month;
        if (targetSortKey > cutSortKey) return 0;
      }
    }

    let sum = 0;
    
    // Comissão da Entrada - Parte 1
    const sinal1Installments = sale.sinal1InstallmentCount || 1;
    if (sale.immComm1 > 0) {
        if (sinal1Installments > 1) {
            const totalComm = sale.immComm1;
            const regularInstallment = Math.floor((totalComm / sinal1Installments) * 100) / 100;
            const lastInstallment = parseFloat((totalComm - (regularInstallment * (sinal1Installments - 1))).toFixed(2));
            
            const baseDate = new Date(sale.date1);
            for (let i = 0; i < sinal1Installments; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(baseDate.getMonth() + i);
                if (installmentDate.getMonth() === targetMonth && installmentDate.getFullYear() === targetYear) {
                    sum += (i === sinal1Installments - 1) ? lastInstallment : regularInstallment;
                }
            }
        } else {
            const d1 = new Date(sale.date1);
            if (d1.getMonth() === targetMonth && d1.getFullYear() === targetYear) {
                sum += (sale.immComm1 || 0);
            }
        }
    }
    
    // Comissão da Entrada - Parte 2
    const sinal2Installments = sale.sinal2InstallmentCount || 1;
    if (sale.date2 > 0 && sale.immComm2 > 0) {
        if (sinal2Installments > 1) {
            const totalComm = sale.immComm2;
            const regularInstallment = Math.floor((totalComm / sinal2Installments) * 100) / 100;
            const lastInstallment = parseFloat((totalComm - (regularInstallment * (sinal2Installments - 1))).toFixed(2));
            
            const baseDate = new Date(sale.date2);
            for (let i = 0; i < sinal2Installments; i++) {
                const installmentDate = new Date(baseDate);
                installmentDate.setMonth(baseDate.getMonth() + i);
                if (installmentDate.getMonth() === targetMonth && installmentDate.getFullYear() === targetYear) {
                    sum += (i === sinal2Installments - 1) ? lastInstallment : regularInstallment;
                }
            }
        } else {
            const d2 = new Date(sale.date2);
            if (d2.getMonth() === targetMonth && d2.getFullYear() === targetYear) {
                sum += (sale.immComm2 || 0);
            }
        }
    }

    // Comissão do Saldo Restante
    if (sale.installmentCount > 0) {
      const bd = new Date(sale.date1);
      for (let i = 1; i <= sale.installmentCount; i++) {
        const id = new Date(bd); id.setMonth(id.getMonth() + i);
        if (id.getMonth() === targetMonth && id.getFullYear() === targetYear) sum += (sale.installmentCommission || 0);
      }
    }
    return sum;
  };

  const calculateSaleRealizable = (sale: Sale) => {
    const totalBruto = (sale.immComm1 || 0) + (sale.immComm2 || 0) + ((sale.installmentCommission || 0) * (sale.installmentCount || 0));
    if (sale.status !== 'Cancelada' || !sale.cancelledAt) return totalBruto;

    const type = sale.cancelledAt.type;
    if (type === 'DENTRO_7') return 0;
    
    if (type === 'FORA_7') {
      let firstMonthKey: number | null = null;
      let firstMonthSum = 0;
      const check = (ms: number, val: number) => {
        if (!ms || isNaN(ms) || val <= 0) return;
        const d = new Date(ms);
        const key = d.getFullYear() * 12 + d.getMonth();
        if (firstMonthKey === null || key < firstMonthKey) {
          firstMonthKey = key;
          firstMonthSum = val;
        } else if (key === firstMonthKey) {
          firstMonthSum += val;
        }
      };
      check(sale.date1, sale.immComm1);
      if (sale.date2 > 0) check(sale.date2, sale.immComm2);
      if (sale.installmentCount > 0) {
        const bd = new Date(sale.date1);
        for (let i = 1; i <= sale.installmentCount; i++) {
          const id = new Date(bd); id.setMonth(id.getMonth() + i);
          check(id.getTime(), sale.installmentCommission);
        }
      }
      return firstMonthSum;
    }

    if (type === 'CORTE') {
        const cutSortKey = (sale.cancelledAt.year * 12) + sale.cancelledAt.month;
        let sum = 0;
        const check = (ms: number, val: number) => {
            if (!ms || isNaN(ms) || val <= 0) return;
            const d = new Date(ms);
            if ((d.getFullYear() * 12 + d.getMonth()) <= cutSortKey) sum += val;
        };
        check(sale.date1, sale.immComm1);
        if (sale.date2 > 0) check(sale.date2, sale.immComm2);
        if (sale.installmentCount > 0) {
            const bd = new Date(sale.date1);
            for (let i = 1; i <= sale.installmentCount; i++) {
                const id = new Date(bd); id.setMonth(id.getMonth() + i);
                check(id.getTime(), sale.installmentCommission);
            }
        }
        return sum;
    }
    return 0;
  };

  const filteredSales = useMemo(() => {
    let base = sales.filter(s => viewMode === 'trash' ? s.inTrash : !s.inTrash);
    if (!searchTerm) return base;
    const term = searchTerm.toLowerCase();
    return base.filter(s => 
      s.titular.toLowerCase().includes(term) || (s.cpf && s.cpf.includes(term))
    );
  }, [sales, viewMode, searchTerm]);

  const activeMonthHeaders = useMemo(() => {
    if (filteredSales.length === 0) return [];
    const now = new Date();
    const currentMonthSort = now.getFullYear() * 12 + now.getMonth();
    const monthMap = new Map<string, { month: number, year: number, label: string, sortKey: number }>();
    
    filteredSales.forEach(sale => {
      const addMonthIfValid = (dateMs: number) => {
        if (isNaN(dateMs) || dateMs <= 0) return;
        const d = new Date(dateMs);
        const m = d.getMonth(); const y = d.getFullYear();
        const sortKey = y * 12 + m;
        
        if (sortKey < currentMonthSort) return;
        if (getSaleValueForMonth(sale, m, y) <= 0) return;

        const key = `${y}-${m}`;
        if (!monthMap.has(key)) {
          const mLabel = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
          const yLabel = y.toString().slice(-2);
          monthMap.set(key, { 
            month: m, year: y, 
            label: `${mLabel.charAt(0).toUpperCase() + mLabel.slice(1)}/${yLabel}`,
            sortKey: sortKey
          });
        }
      };

      // Signal 1 installments
      const sinal1Installments = sale.sinal1InstallmentCount || 1;
      if (sale.immComm1 > 0 && sale.date1 > 0) {
          const baseDate = new Date(sale.date1);
          for (let i = 0; i < sinal1Installments; i++) {
              const installmentDate = new Date(baseDate);
              installmentDate.setMonth(baseDate.getMonth() + i);
              addMonthIfValid(installmentDate.getTime());
          }
      }

      // Signal 2 installments
      const sinal2Installments = sale.sinal2InstallmentCount || 1;
      if (sale.immComm2 > 0 && sale.date2 > 0) {
          const baseDate = new Date(sale.date2);
          for (let i = 0; i < sinal2Installments; i++) {
              const installmentDate = new Date(baseDate);
              installmentDate.setMonth(baseDate.getMonth() + i);
              addMonthIfValid(installmentDate.getTime());
          }
      }

      // Remaining balance installments
      if (sale.installmentCount > 0 && sale.installmentCommission > 0) {
        const bd = new Date(sale.date1);
        for (let i = 1; i <= sale.installmentCount; i++) {
          const id = new Date(bd); id.setMonth(id.getMonth() + i);
          addMonthIfValid(id.getTime());
        }
      }
    });
    return Array.from(monthMap.values()).sort((a, b) => a.sortKey - b.sortKey);
  }, [filteredSales]);

  const footerTotals = useMemo(() => {
    const monthSums = activeMonthHeaders.map(h => {
      return filteredSales.reduce((acc, sale) => acc + getSaleValueForMonth(sale, h.month, h.year), 0);
    });
    const grandTotal = filteredSales.reduce((acc, sale) => acc + calculateSaleRealizable(sale), 0);
    return { monthSums, grandTotal };
  }, [filteredSales, activeMonthHeaders]);

  const sortedSales = useMemo(() => [...filteredSales].sort((a, b) => (b.saleDate || 0) - (a.saleDate || 0)), [filteredSales]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSales.length && filteredSales.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSales.map(s => s.id)));
  };

  const toggleSelectRow = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };
  
  const handleCopyCpf = (cpf: string) => {
    navigator.clipboard.writeText(cpf.replace(/\D/g, '')).then(() => {
      setCpfCopied(true); setTimeout(() => setCpfCopied(false), 2000);
    });
  };

  const handleOpenWhatsApp = (tel: string) => {
    const cleanTel = tel.replace(/\D/g, '');
    if (cleanTel.length >= 10) window.open(`https://wa.me/55${cleanTel}`, '_blank');
  };

  const availableCancellationMonths = useMemo(() => {
    let referenceSale: Sale | undefined;
    if (modalState?.type === 'cancel' && modalState.target) {
      referenceSale = modalState.target as Sale;
    } else if (modalState?.type === 'bulkCancel') {
      const firstId = Array.from(selectedIds)[0];
      if(firstId) referenceSale = sales.find(s => s.id === firstId);
    }
    
    if (!referenceSale) return [];

    const monthsMap = new Map<string, { value: string, label: string, sortKey: number }>();
    const addDate = (dateMs: number, val: number) => {
      if (isNaN(dateMs) || dateMs <= 0 || val <= 0) return;
      const d = new Date(dateMs);
      const m = d.getMonth(); const y = d.getFullYear(); const key = `${m}-${y}`;
      if (!monthsMap.has(key)) monthsMap.set(key, { value: key, label: d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase(), sortKey: y * 12 + m });
    };
    addDate(referenceSale.date1, referenceSale.immComm1);
    if (referenceSale.date2 > 0) addDate(referenceSale.date2, referenceSale.immComm2);
    if (referenceSale.installmentCount > 0) {
      const bd = new Date(referenceSale.date1);
      for (let i = 1; i <= referenceSale.installmentCount; i++) {
        const id = new Date(bd); id.setMonth(id.getMonth() + i); addDate(id.getTime(), referenceSale.installmentCommission);
      }
    }
    return Array.from(monthsMap.values()).sort((a, b) => a.sortKey - b.sortKey).slice(1);
  }, [modalState, selectedIds, sales]);

  const handleConfirmAction = () => {
    if (!modalState) return;

    switch (modalState.type) {
      case 'trash': onMoveToTrash((modalState.target as Sale).id); break;
      case 'restore': onRestore((modalState.target as Sale).id); break;
      case 'delete': onPermanentDelete((modalState.target as Sale).id); break;
      case 'emptyTrash': if(onEmptyTrash) onEmptyTrash(); break;
      case 'bulkTrash': if(onBulkMoveToTrash) onBulkMoveToTrash(modalState.target as string[]); setSelectedIds(new Set()); break;
      case 'cancel': case 'bulkCancel':
        if (!cancelType) return;
        let month = 0, year = 0, label = "IMEDIATO";
        if (cancelType === 'CORTE') {
            if (!selectedMonthIdx) return;
            const [m, y] = selectedMonthIdx.split('-').map(Number);
            month = m; year = y;
            label = new Date(year, month).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
        } else {
            const now = new Date(); month = now.getMonth(); year = now.getFullYear();
        }

        const cancellationData = { month, year, label, type: cancelType };
        
        if(modalState.type === 'cancel') {
          onCancel((modalState.target as Sale).id, cancellationData);
          if (selectedSale?.id === (modalState.target as Sale).id) setSelectedSale(null);
        } else {
          if (onBulkCancel) onBulkCancel(modalState.target as string[], cancellationData);
          setSelectedIds(new Set());
        }
        break;
    }
    setModalState(null);
    setCancelType(null);
    setSelectedMonthIdx('');
  };

  const colsBeforeCommissionsCount = useMemo(() => {
    let count = 5; // Checkbox, #, Cliente, Produto, Status
    if (columnVisibility.cpf) count++;
    if (columnVisibility.telefone) count++;
    if (columnVisibility.cidadeUf) count++;
    if (columnVisibility.sala) count++;
    if (columnVisibility.funcao) count++;
    if (columnVisibility.unidade) count++;
    if (viewMode === 'trash') count++;
    return count;
  }, [columnVisibility, viewMode]);

  const totalColumnCount = useMemo(() => {
    let count = colsBeforeCommissionsCount;
    if(viewMode === 'active' && columnVisibility.comissoes) count += activeMonthHeaders.length;
    if(viewMode === 'active' && columnVisibility.realizavel) count++;
    if(columnVisibility.cadastro) count++;
    count++; // Ações
    return count;
  }, [colsBeforeCommissionsCount, columnVisibility, activeMonthHeaders.length, viewMode]);

  const renderModal = () => {
    if (!modalState) return null;
    let title = '', message: React.ReactNode = '', confirmText = '', isDanger = false, icon = '❓';
    switch (modalState.type) {
      case 'trash': title = 'Mover para a lixeira?'; message = <>Deseja mover o registro de "<strong>{(modalState.target as Sale).titular}</strong>" para a lixeira? Você poderá recuperar depois.</>; confirmText = 'Mover para Lixeira'; icon = '🗑️'; break;
      case 'bulkTrash': title = 'Mover para a lixeira?'; message = <>Deseja mover <strong>{(modalState.target as string[]).length}</strong> registros para a lixeira? Você poderá recuperá-los depois.</>; confirmText = 'Mover para Lixeira'; icon = '🗑️'; break;
      case 'restore': title = 'Recuperar registro?'; message = <>Deseja recuperar o registro de "<strong>{(modalState.target as Sale).titular}</strong>"? Ele voltará para a lista de ativas.</>; confirmText = 'Recuperar'; icon = '♻️'; break;
      case 'delete': title = 'Apagar permanentemente?'; message = <>Essa ação é irreversível. Deseja apagar "<strong>{(modalState.target as Sale).titular}</strong>" permanentemente?</>; confirmText = 'Apagar Permanente'; isDanger = true; icon = '❌'; break;
      case 'emptyTrash': title = 'Esvaziar lixeira?'; message = 'Isso apagará permanentemente TODOS os registros na lixeira. Essa ação não pode ser desfeita.'; confirmText = 'Esvaziar Lixeira'; isDanger = true; icon = '💥'; break;
      case 'cancel': case 'bulkCancel':
        return (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={() => setModalState(null)}></div>
            <div className="relative bg-brand-card w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in duration-300">
              <div className="p-8">
                <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center text-2xl mb-6 mx-auto">🚫</div>
                <h3 className="text-lg font-black text-white uppercase tracking-tighter text-center mb-2">Cancelar Cota</h3>
                <p className="text-slate-500 text-[10px] text-center font-bold uppercase tracking-widest mb-6">Selecione o motivo:</p>
                <div className="grid grid-cols-1 gap-3">
                  <button onClick={() => setCancelType('DENTRO_7')} className={`p-4 rounded-2xl border-2 transition-all text-left ${cancelType === 'DENTRO_7' ? 'border-red-500 bg-red-500/10' : 'border-brand-border bg-brand-bg'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Dentro de 7 Dias</p>
                    <p className="text-[9px] font-bold text-slate-500">Zerar todas as comissões.</p>
                  </button>
                  <button onClick={() => setCancelType('FORA_7')} className={`p-4 rounded-2xl border-2 transition-all text-left ${cancelType === 'FORA_7' ? 'border-amber-500 bg-amber-500/10' : 'border-brand-border bg-brand-bg'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Fora de 7 Dias</p>
                    <p className="text-[9px] font-bold text-slate-500">Mantém apenas a 1ª comissão.</p>
                  </button>
                  <button onClick={() => setCancelType('CORTE')} disabled={availableCancellationMonths.length === 0} className={`p-4 rounded-2xl border-2 transition-all text-left ${availableCancellationMonths.length === 0 ? 'opacity-50 cursor-not-allowed grayscale' : ''} ${cancelType === 'CORTE' ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border bg-brand-bg'}`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">Com Corte em Mês Específico</p>
                    <p className="text-[9px] font-bold text-slate-500">{availableCancellationMonths.length === 0 ? 'Sem meses futuros para corte.' : 'Mantém parcelas até o mês selecionado.'}</p>
                  </button>
                </div>
                {cancelType === 'CORTE' && availableCancellationMonths.length > 0 && (
                  <div className="mt-6 space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Selecionar Mês de Corte:</p>
                    <div className="relative">
                      <select value={selectedMonthIdx} onChange={(e) => setSelectedMonthIdx(e.target.value)} className="w-full h-12 rounded-xl px-4 bg-brand-bg border-none outline-none font-black text-xs uppercase text-white appearance-none cursor-pointer">
                        <option value="" disabled>Escolher mês...</option>
                        {availableCancellationMonths.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 bg-brand-bg-alt flex gap-2">
                <button onClick={() => setModalState(null)} className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">Sair</button>
                <button onClick={handleConfirmAction} disabled={!cancelType || (cancelType === 'CORTE' && !selectedMonthIdx)} className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${cancelType ? 'bg-red-600 text-white shadow-red-600/20' : 'bg-brand-bg-alt text-slate-500 cursor-not-allowed'}`}>Confirmar</button>
              </div>
            </div>
          </div>
        );
      default: return null;
    }
    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm" onClick={() => setModalState(null)}></div>
        <div className="relative bg-brand-card w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-brand-border animate-in zoom-in duration-300">
          <div className="p-8 text-center">
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl mb-6 mx-auto ${isDanger ? 'bg-red-500/10 text-red-400' : 'bg-brand-accent/10 text-brand-accent'}`}>{icon}</div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
            <p className="text-slate-500 text-sm font-medium mb-8">{message}</p>
          </div>
          <div className="p-4 bg-brand-bg-alt flex gap-3">
            <button onClick={() => setModalState(null)} className="flex-1 h-12 bg-brand-card text-slate-500 font-black uppercase text-[11px] rounded-2xl active:scale-95 transition-all">Cancelar</button>
            <button onClick={handleConfirmAction} className={`flex-1 h-12 text-white font-black uppercase text-[11px] rounded-2xl shadow-lg active:scale-95 transition-all ${isDanger ? 'bg-red-600 shadow-red-600/20' : 'bg-brand-accent shadow-brand-accent/20'}`}>{confirmText}</button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderColumnSelector = () => {
    if (!isColumnSelectorOpen) return null;

    const handleToggle = (col: keyof typeof columnConfig) => setColumnVisibility(p => ({ ...p, [col]: !p[col] }));
    const handleSelectAll = () => setColumnVisibility(p => Object.keys(p).reduce((acc, key) => ({...acc, [key]: true}), {} as typeof p));
    const handleClearAll = () => setColumnVisibility(p => Object.keys(p).reduce((acc, key) => ({...acc, [key]: false}), {} as typeof p));

    return (
      <div className="fixed inset-0 z-[300] flex items-start justify-end pt-24 pr-4">
        <div className="absolute inset-0 bg-brand-bg/60 backdrop-blur-sm" onClick={() => setIsColumnSelectorOpen(false)}></div>
        <div className="relative bg-brand-card w-full max-w-xs rounded-3xl shadow-2xl overflow-hidden border border-brand-border animate-in slide-in-from-right-4 duration-300">
          <div className="p-4 border-b border-brand-border">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-center">Modo Lista</h3>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
            <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest px-2 pb-2">Obrigatório</p>
            <label className="flex items-center space-x-3 p-3 bg-brand-bg rounded-lg cursor-not-allowed opacity-70">
              <input type="checkbox" checked disabled className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent"/>
              <span className="text-xs font-bold text-slate-300">Cliente, Produto, Status</span>
            </label>
            <div className="pt-2">
              <p className="text-[9px] font-bold uppercase text-slate-500 tracking-widest px-2 pb-2">Opcional</p>
              {Object.entries(columnConfig).map(([key, { label }]) => (
                <label key={key} className="flex items-center space-x-3 p-3 hover:bg-brand-bg rounded-lg cursor-pointer">
                  <input type="checkbox" checked={columnVisibility[key as keyof typeof columnConfig]} onChange={() => handleToggle(key as keyof typeof columnConfig)} className="w-5 h-5 rounded border-brand-border text-brand-accent focus:ring-brand-accent"/>
                  <span className="text-xs font-bold text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="p-3 bg-brand-bg-alt border-t border-brand-border space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={handleSelectAll} className="py-2.5 text-[9px] font-black uppercase tracking-widest bg-brand-card rounded-lg hover:bg-brand-bg transition-all">Selecionar Tudo</button>
              <button onClick={handleClearAll} className="py-2.5 text-[9px] font-black uppercase tracking-widest bg-brand-card rounded-lg hover:bg-brand-bg transition-all">Limpar Seleção</button>
            </div>
            <button onClick={() => setIsColumnSelectorOpen(false)} className="w-full py-3 bg-brand-accent text-white font-black uppercase text-[10px] tracking-widest rounded-xl shadow-lg active:scale-95 transition-all">Aplicar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-brand-bg transition-colors overflow-hidden relative">
      {renderModal()}
      {renderColumnSelector()}
      
      {selectedIds.size > 0 && viewMode === 'active' && (<div className="fixed top-24 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-4 bg-brand-card text-white px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300 border border-white/10"><div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest opacity-70">Ações em Lote</span><span className="text-sm font-black tracking-tight">{selectedIds.size} selecionados</span></div><div className="h-8 w-[1px] bg-white/20 mx-2"></div><div className="flex items-center gap-2"><button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 rounded-xl transition-all">Limpar</button><button onClick={() => setModalState({ type: 'bulkCancel', target: Array.from(selectedIds) })} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">Cancelar</button>{onBulkReactivate && <button onClick={() => onBulkReactivate(Array.from(selectedIds))} className="px-4 py-2 bg-brand-accent hover:bg-brand-accent-hover text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">Ativar</button>}<button onClick={() => setModalState({ type: 'bulkTrash', target: Array.from(selectedIds) })} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2">Excluir</button></div></div>)}

      <div className="p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-brand-border bg-brand-bg z-20 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div><h2 className="text-base md:text-lg font-black text-brand-text tracking-tighter uppercase leading-none">Base de Dados</h2><p className="text-[8px] text-brand-text-muted font-bold uppercase tracking-widest mt-0.5">Gestão de Recebíveis</p></div>
          {viewMode === 'trash' && onEmptyTrash && (<button onClick={() => setModalState({ type: 'emptyTrash' })} className="h-8 px-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95">Esvaziar Lixeira</button>)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setIsColumnSelectorOpen(true)} className="h-8 px-3 bg-brand-accent/10 text-brand-accent border border-brand-accent/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all active:scale-95 flex items-center gap-1.5"><List size={12} /> <span className="hidden sm:inline">Modo Lista</span></button>
          <div className="relative group flex-1 md:flex-initial"><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-8 pl-8 pr-3 rounded-lg bg-brand-bg-alt border border-brand-border outline-none focus:ring-2 focus:ring-brand-accent text-[9px] font-bold text-brand-text w-full md:w-32" /><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-brand-text-muted" /></div>
          <div className="flex bg-brand-bg-alt p-0.5 rounded-lg border border-brand-border"><button onClick={() => setViewMode('active')} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${viewMode === 'active' ? 'bg-brand-accent text-white shadow-sm' : 'text-brand-text-muted'}`}>Ativas</button><button onClick={() => setViewMode('trash')} className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${viewMode === 'trash' ? 'bg-red-500 text-white shadow-sm' : 'text-brand-text-muted'}`}>Lixeira</button></div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-[10px] border-collapse">
          <thead className="bg-brand-bg-alt sticky top-0 z-10 border-b border-brand-border">
            <tr className="text-brand-text-muted font-black uppercase tracking-widest text-[8px]">
              <th className="px-2 py-2 text-center w-8">
                <input type="checkbox" checked={filteredSales.length > 0 && selectedIds.size === filteredSales.length} onChange={toggleSelectAll} className="w-3.5 h-3.5 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"/>
              </th>
              <th className="px-2 py-2 text-left w-8">#</th>
              <th className="px-2 py-2 text-left w-[200px]">Cliente</th>
              {columnVisibility.cpf && <th className="px-2 py-2 text-left w-[120px]">CPF</th>}
              {columnVisibility.telefone && <th className="px-2 py-2 text-left w-[120px]">Telefone</th>}
              {columnVisibility.cidadeUf && <th className="px-2 py-2 text-left w-[150px]">Cidade/UF</th>}
              {viewMode === 'trash' && <th className="px-2 py-2 text-left">Excluído em</th>}
              {columnVisibility.sala && <th className="px-2 py-2 text-left">Sala</th>}
              <th className="px-2 py-2 text-left w-[150px]">Produto</th>
              {columnVisibility.funcao && <th className="px-2 py-2 text-left">Função</th>}
              {columnVisibility.unidade && <th className="px-2 py-2 text-left">UND</th>}
              <th className="px-2 py-2 text-center">Status</th>
              {viewMode === 'active' && columnVisibility.comissoes && activeMonthHeaders.map((h, i) => (<th key={i} className="px-1 py-2 text-right whitespace-nowrap">{h.label}</th>))}
              {viewMode === 'active' && columnVisibility.realizavel && <th className="px-2 py-2 text-right bg-brand-bg-alt/50">Realizável</th>}
              {columnVisibility.cadastro && <th className="px-2 py-2 text-center">Cadastro</th>}
              <th className="px-2 py-2 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {sortedSales.length === 0 ? (
              <tr><td className="px-2 py-16 text-center text-brand-text-muted font-black uppercase text-[9px] tracking-widest" colSpan={totalColumnCount}>Nenhum registro encontrado</td></tr>
            ) : (
              sortedSales.map((sale, idx) => {
                const isSelected = selectedIds.has(sale.id);
                const realizavel = calculateSaleRealizable(sale);
                return (
                  <tr key={sale.id} onClick={() => setSelectedSale(sale)} className={`group transition-all cursor-pointer h-10 ${isSelected ? 'bg-brand-accent/10 border-l-4 border-brand-accent' : 'hover:bg-white/5'} ${sale.status === 'Cancelada' ? 'opacity-60' : ''}`}>
                    <td className="px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={(e) => toggleSelectRow(e as any, sale.id)} className="w-3.5 h-3.5 rounded border-brand-border bg-brand-bg text-brand-accent focus:ring-brand-accent"/></td>
                    <td className="px-2 py-1.5 font-mono text-brand-text-muted">{idx + 1}</td>
                    <td className="px-2 py-1.5 font-black text-brand-accent uppercase tracking-tighter group-hover:underline truncate max-w-[200px]">{sale.titular}</td>
                    {columnVisibility.cpf && <td className="px-2 py-1.5 font-mono text-brand-text-muted">{maskCPF(sale.cpf)}</td>}
                    {columnVisibility.telefone && <td className="px-2 py-1.5 font-mono text-brand-text-muted">{sale.telefoneCliente ? maskPhone(sale.telefoneCliente) : '---'}</td>}
                    {columnVisibility.cidadeUf && <td className="px-2 py-1.5 text-brand-text-muted uppercase font-bold text-[9px] truncate max-w-[150px]">{sale.cidade ? `${sale.cidade} - ${sale.uf}` : '---'}</td>}
                    {viewMode === 'trash' && <td className="px-2 py-1.5 text-brand-text-muted">{formatDateFull(sale.trashedAt)}</td>}
                    {columnVisibility.sala && <td className="px-2 py-1.5 font-bold text-brand-text-muted uppercase">{sale.roomName}</td>}
                    <td className="px-2 py-1.5 font-bold text-brand-text-muted uppercase truncate max-w-[150px]">{sale.productName}</td>
                    {columnVisibility.funcao && <td className="px-2 py-1.5 font-bold text-[8px] text-brand-text-muted uppercase">{getCategoryLabel(sale.category)}</td>}
                    {columnVisibility.unidade && <td className="px-2 py-1.5 font-medium text-brand-text-muted uppercase">{sale.unidade || '---'}</td>}
                    <td className="px-2 py-1.5 text-center"><span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${sale.status === 'Ativa' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-red-500/10 text-red-400'}`}>{sale.status}</span></td>
                    {viewMode === 'active' && columnVisibility.comissoes && activeMonthHeaders.map((h, i) => { const val = getSaleValueForMonth(sale, h.month, h.year); return <td key={i} className={`px-1 py-1.5 text-right font-mono ${val > 0 ? 'text-brand-text font-black' : 'text-brand-text-muted/20'}`}>{formatCurrency(val)}</td>; })}
                    {viewMode === 'active' && columnVisibility.realizavel && <td className="px-2 py-1.5 text-right font-black font-mono text-brand-accent bg-brand-bg-alt/50">{formatCurrency(realizavel)}</td>}
                    {columnVisibility.cadastro && <td className="px-2 py-1.5 text-center"><span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${sale.statusCadastro === 'COMPLETO' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-amber-500/10 text-amber-400'}`}>{sale.statusCadastro || 'INCOMPLETO'}</span></td>}
                    <td className="px-2 py-1.5 text-center" onClick={(e) => e.stopPropagation()}><div className="flex items-center justify-center gap-1.5">{viewMode === 'active' && (<><button onClick={() => setModalState({ type: 'cancel', target: sale })} title="Cancelar/Estornar" className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-bg-alt text-brand-text-muted hover:text-red-400 hover:bg-red-500/10 transition-all active:scale-90"><Ban size={14} strokeWidth={2.5} /></button><button onClick={() => onEditInitiate && onEditInitiate(sale)} title="Editar Cadastro" className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-bg-alt text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90"><Edit3 size={14} strokeWidth={2.5} /></button></>)}{viewMode === 'trash' && (<button onClick={() => setModalState({ type: 'restore', target: sale })} title="Recuperar" className="w-7 h-7 flex items-center justify-center rounded-lg bg-brand-bg-alt text-brand-text-muted hover:text-brand-accent hover:bg-brand-accent/10 transition-all active:scale-90"><RotateCcw size={14} strokeWidth={2.5} /></button>)}<button onClick={() => setModalState({ type: viewMode === 'trash' ? 'delete' : 'trash', target: sale })} title={viewMode === 'trash' ? "Excluir Definitivo" : "Mover para Lixeira"} className={`w-7 h-7 flex items-center justify-center rounded-lg bg-brand-bg-alt transition-all active:scale-90 ${viewMode === 'trash' ? 'text-red-400 hover:bg-red-500/10' : 'text-brand-text-muted hover:text-red-400 hover:bg-red-500/10'}`}><Trash2 size={14} strokeWidth={2.5} /></button></div></td>
                  </tr>
                );
              })
            )}
          </tbody>
          {viewMode === 'active' && footerTotals && (
            <tfoot className="bg-brand-bg-alt sticky bottom-0 z-10 border-t border-brand-border shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
               <tr className="text-[9px] font-black uppercase tracking-widest text-brand-text">
                  <td colSpan={colsBeforeCommissionsCount} className="px-4 py-3 text-left">TOTAL REALIZÁVEL NO PERÍODO</td>
                  {columnVisibility.comissoes && footerTotals.monthSums.map((sum, i) => (<td key={i} className="px-1 py-3 text-right font-mono text-brand-accent">{formatCurrency(sum)}</td>))}
                  {columnVisibility.realizavel && (<td className="px-2 py-3 text-right font-mono text-white bg-brand-accent shadow-inner">{formatCurrency(footerTotals.grandTotal)}</td>)}
                  {columnVisibility.cadastro && <td className="px-2 py-3 text-center">--</td>}
                  <td className="px-2 py-3 text-center">--</td>
               </tr>
            </tfoot>
          )}
        </table>
      </div>

      {selectedSale && (<div className="fixed inset-0 z-[200] flex justify-end"><div className="absolute inset-0 bg-brand-bg/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedSale(null)}></div><div className="relative w-full md:max-w-xl bg-brand-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden border-l border-brand-border"><div className="p-6 border-b border-brand-border bg-brand-card flex items-center justify-between sticky top-0 z-30"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-brand-bg-alt border border-brand-border overflow-hidden flex items-center justify-center text-xl shrink-0">{selectedSale.profileImage ? <img src={selectedSale.profileImage} className="w-full h-full object-cover" /> : <User size={24} className="text-brand-text-muted" />}</div><div className="min-w-0"><h3 className="text-base font-black text-brand-text uppercase tracking-tighter truncate">{selectedSale.titular}</h3><div className="flex items-center gap-2"><span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest ${selectedSale.status === 'Ativa' ? 'bg-brand-accent text-white' : 'bg-red-500 text-white'}`}>{selectedSale.status}</span></div></div></div><button onClick={() => setSelectedSale(null)} className="p-2.5 bg-brand-bg-alt rounded-xl text-brand-text-muted hover:text-red-400 transition-all active:scale-95"><X size={20} strokeWidth={2.5} /></button></div><div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-brand-bg/50 pb-32"><div className={`p-4 rounded-2xl flex items-center justify-between gap-4 border transition-all ${selectedSale.statusCadastro === 'INCOMPLETO' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-brand-accent/10 border-brand-accent/30'}`}><div className="flex items-center gap-3"><span>{selectedSale.statusCadastro === 'INCOMPLETO' ? <AlertTriangle size={20} className="text-amber-500" /> : <CheckCircle2 size={20} className="text-brand-accent" />}</span><div><p className={`text-[10px] font-black uppercase tracking-widest ${selectedSale.statusCadastro === 'INCOMPLETO' ? 'text-amber-400' : 'text-brand-accent'}`}>{selectedSale.statusCadastro === 'INCOMPLETO' ? 'Cadastro Incompleto' : 'Cadastro Finalizado'}</p></div></div><button onClick={() => { if (onEditInitiate) onEditInitiate(selectedSale); setSelectedSale(null); }} className={`px-4 py-2 text-white text-[9px] font-black uppercase rounded-xl shadow-lg active:scale-95 transition-all ${selectedSale.statusCadastro === 'INCOMPLETO' ? 'bg-amber-500 shadow-amber-500/20' : 'bg-brand-accent shadow-brand-accent/20'}`}>Editar</button></div><div className="space-y-3"><h4 className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em] px-1">Dados do Cliente</h4><div className="grid grid-cols-2 gap-2"><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex flex-col justify-between relative group"><div><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">CPF</p><p className="font-mono text-[11px] font-bold text-brand-text">{selectedSale.cpf || '---'}</p></div>{selectedSale.cpf && (<button onClick={() => handleCopyCpf(selectedSale.cpf!)} className="absolute top-4 right-4 p-1.5 text-brand-text-muted hover:text-brand-accent transition-all active:scale-90" title="Copiar CPF">{cpfCopied && (<span className="text-[7px] font-black text-brand-accent absolute -top-4 right-0 whitespace-nowrap">Copiado!</span>)}<Copy size={14} strokeWidth={2.5} /></button>)}</div><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm"><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">UND</p><p className="font-black text-[11px] text-brand-accent uppercase">{selectedSale.unidade || '---'}</p></div></div><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm flex justify-between items-center group"><div><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">Whatsapp</p><p className="font-mono text-xs font-bold text-brand-text">{maskPhone(selectedSale.telefoneCliente)}</p></div>{selectedSale.telefoneCliente && (<button onClick={() => handleOpenWhatsApp(selectedSale.telefoneCliente!)} className="p-2 bg-brand-accent/10 text-brand-accent rounded-xl hover:bg-brand-accent hover:text-white transition-all active:scale-90 flex items-center gap-1.5"><ExternalLink size={12} strokeWidth={3} /><span className="text-[9px] font-black uppercase tracking-widest">WhatsApp</span></button>)}</div></div><div className="space-y-3"><h4 className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em] px-1">Informações da Venda</h4><div className="grid grid-cols-2 gap-2"><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm"><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">Sala</p><p className="font-black text-[10px] text-brand-text uppercase truncate">{selectedSale.roomName}</p></div><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm"><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">Produto</p><p className="font-black text-[10px] text-brand-text uppercase truncate">{selectedSale.productName}</p></div><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm"><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">Data da Venda</p><p className="font-black text-[10px] text-brand-text">{formatDateFull(selectedSale.saleDate)}</p></div><div className="p-4 bg-brand-card rounded-2xl border border-brand-border shadow-sm"><p className="text-[7px] font-black text-brand-text-muted uppercase mb-1">Quantidade</p><p className="font-black text-[10px] text-brand-accent uppercase">{selectedSale.quotaQuantity} Cota(s)</p></div></div></div></div><div className="absolute bottom-0 left-0 right-0 p-4 bg-brand-card/90 backdrop-blur-md border-t border-brand-border flex gap-2 z-40">{selectedSale.status === 'Ativa' ? (<button onClick={() => setModalState({ type: 'cancel', target: selectedSale })} className="flex-1 h-12 rounded-xl bg-red-500/10 text-red-400 font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Cancelar</button>) : (<button onClick={() => onReactivate(selectedSale.id)} className="flex-1 h-12 rounded-xl bg-brand-accent/10 text-brand-accent font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Reativar</button>)}</div></div></div>)}
    </div>
  );
};

export default SalesLog;