import React, { useMemo, useState, lazy, Suspense } from 'react';
import { Sale } from '../types';
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  BarChart3, 
  PieChart, 
  CircleDollarSign,
  Package
} from 'lucide-react';

interface DashboardProps {
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ sales }) => {
  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: now.getMonth(),
    year: now.getFullYear()
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(selectedPeriod.year, selectedPeriod.month + direction, 1);
    setSelectedPeriod({
      month: newDate.getMonth(),
      year: newDate.getFullYear()
    });
  };

  const currentMonthLabel = useMemo(() => {
    const d = new Date(selectedPeriod.year, selectedPeriod.month, 1);
    return d.toLocaleString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
  }, [selectedPeriod]);

  const monthLongName = useMemo(() => {
    const d = new Date(selectedPeriod.year, selectedPeriod.month, 1);
    const name = d.toLocaleString('pt-BR', { month: 'long' });
    return name.charAt(0).toUpperCase() + name.slice(1);
  }, [selectedPeriod]);

  const baseSales = useMemo(() => {
    return sales.filter(s => !s.inTrash);
  }, [sales]);

  const monthStart = useMemo(() => new Date(selectedPeriod.year, selectedPeriod.month, 1).getTime(), [selectedPeriod]);
  const monthEnd = useMemo(() => new Date(selectedPeriod.year, selectedPeriod.month + 1, 0, 23, 59, 59).getTime(), [selectedPeriod]);

  const salesInSelectedMonth = useMemo(() => {
    return baseSales.filter(s => s.saleDate >= monthStart && s.saleDate <= monthEnd);
  }, [baseSales, monthStart, monthEnd]);

  // --- LÓGICA CENTRALIZADA DE VALOR POR MÊS ---
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

  // --- LÓGICA DE CÁLCULO DE PRODUTIVIDADE (REALIZÁVEL E BRUTO) ---
  const calculateSaleValues = (sale: Sale) => {
    const bruto = (sale.immComm1 || 0) + (sale.immComm2 || 0) + ((sale.installmentCommission || 0) * (sale.installmentCount || 0));
    
    if (sale.status !== 'Cancelada' || !sale.cancelledAt) return { bruto, realizavel: bruto };

    const type = sale.cancelledAt.type;
    if (type === 'DENTRO_7') return { bruto, realizavel: 0 };
    
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
      return { bruto, realizavel: firstMonthSum };
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
        return { bruto, realizavel: sum };
    }
    return { bruto, realizavel: 0 };
  };

  const salesQuantity = useMemo(() => {
    return salesInSelectedMonth
      .filter(s => s.status === 'Ativa')
      .reduce((acc, s) => acc + (Number(s.quotaQuantity || 1)), 0);
  }, [salesInSelectedMonth]);

  const productivityData = useMemo(() => {
    let sumRealizavel = 0;
    let sumBruto = 0;
    salesInSelectedMonth.forEach(sale => {
      const { bruto, realizavel } = calculateSaleValues(sale);
      sumBruto += bruto;
      sumRealizavel += realizavel;
    });
    return { realizavel: sumRealizavel, bruto: sumBruto };
  }, [salesInSelectedMonth]);

  // FIX: Carteira baseada na soma da coluna do mês seguinte para TODA a base consolidada
  const portfolioValue = useMemo(() => {
    const nextDate = new Date(selectedPeriod.year, selectedPeriod.month + 1, 1);
    const targetM = nextDate.getMonth();
    const targetY = nextDate.getFullYear();
    
    return baseSales.reduce((acc, sale) => {
      return acc + getSaleValueForMonth(sale, targetM, targetY);
    }, 0);
  }, [baseSales, selectedPeriod]);

  const cancellationsCount = useMemo(() => {
    return salesInSelectedMonth
      .filter(s => s.status === 'Cancelada')
      .reduce((acc, s) => acc + (Number(s.quotaQuantity || 1)), 0);
  }, [salesInSelectedMonth]);

  const donutData = useMemo(() => {
    let active = 0;
    let canceled = 0;
    salesInSelectedMonth.forEach(s => {
      const q = Number(s.quotaQuantity) || 1;
      if (s.status === 'Ativa') active += q;
      else if (s.status === 'Cancelada') canceled += q;
    });
    return { active, canceled, total: active + canceled };
  }, [salesInSelectedMonth]);

  const monthlyProjection = useMemo(() => {
    const monthMap = new Map<string, { month: number, year: number, label: string, sortKey: number, total: number }>();
    
    baseSales.forEach(sale => {
      const addMonthIfValid = (dateMs: number) => {
        if (isNaN(dateMs) || dateMs <= 0) return;

        const d = new Date(dateMs);
        const m = d.getMonth();
        const y = d.getFullYear();

        if (getSaleValueForMonth(sale, m, y) <= 0) return;
        
        const key = `${y}-${m}`;
        if (!monthMap.has(key)) {
          const mLabel = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
          const yLabel = y.toString().slice(-2);
          monthMap.set(key, { 
            month: m, year: y, 
            label: `${mLabel.charAt(0).toUpperCase() + mLabel.slice(1)}/${yLabel}`, 
            sortKey: y * 12 + m, 
            total: 0 
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

    const headers = Array.from(monthMap.values()).sort((a, b) => a.sortKey - b.sortKey);
    
    return headers.map(h => {
      const sum = baseSales.reduce((acc, sale) => {
        return acc + getSaleValueForMonth(sale, h.month, h.year);
      }, 0);
      return { ...h, total: sum };
    });
  }, [baseSales]);

  const maxProjectionValue = useMemo(() => Math.max(...monthlyProjection.map(d => d.total), 1), [monthlyProjection]);

  const renderDonut = () => {
    const { active, canceled, total } = donutData;
    if (total === 0) return <div className="flex flex-col items-center justify-center h-[200px] text-brand-text-muted"><PieChart size={48} strokeWidth={1} className="mb-2" /><p className="text-[10px] font-black uppercase tracking-widest">Sem vendas no mês</p></div>;
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const activePct = active / total;
    const canceledPct = canceled / total;
    const activeStroke = activePct * circumference;
    const canceledStroke = canceledPct * circumference;
    return (
      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 100 100" className="transform -rotate-90">
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="12" className="text-brand-bg-alt" />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#ef4444" strokeWidth="12" strokeDasharray={`${canceledStroke} ${circumference}`} strokeDashoffset={0} />
          <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#4F8CFF" strokeWidth="12" strokeDasharray={`${activeStroke} ${circumference}`} strokeDashoffset={-canceledStroke} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-widest leading-none">Vendidas</p>
          <p className="text-2xl font-black text-brand-text tracking-tighter">{donutData.total}</p>
          <p className="text-[8px] font-bold text-brand-text-muted uppercase tracking-tighter">Cotas</p>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-brand-bg-alt/40 p-5 rounded-[32px] border border-brand-border">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-accent/20 text-brand-accent rounded-2xl">
            <LayoutDashboard size={24} strokeWidth={2.5} />
          </div>
          <div><h3 className="text-lg font-black text-brand-text uppercase tracking-tighter leading-none">Dashboard Estratégico</h3><p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-1.5">Consolidado Mensal</p></div>
        </div>
        <div className="flex items-center bg-brand-card p-1 rounded-2xl shadow-sm border border-brand-border">
          <button onClick={() => navigateMonth(-1)} className="w-10 h-10 flex items-center justify-center text-brand-accent hover:bg-brand-bg-alt rounded-xl transition-all active:scale-90"><ChevronLeft size={20} strokeWidth={3} /></button>
          <div className="px-6 font-black text-[11px] text-brand-accent tracking-widest min-w-[120px] text-center flex items-center justify-center gap-2"><Calendar size={14} /> {currentMonthLabel}</div>
          <button onClick={() => navigateMonth(1)} className="w-10 h-10 flex items-center justify-center text-brand-accent hover:bg-brand-bg-alt rounded-xl transition-all active:scale-90"><ChevronRight size={20} strokeWidth={3} /></button>
        </div>
      </div>

      {/* Grid Superior: Dinâmico baseado em orientação */}
      <div className="dashboard-cards">
        <div className="bg-brand-card p-3 md:p-6 rounded-[32px] shadow-sm border border-brand-border flex flex-col min-h-[120px] md:min-h-[160px] group hover:border-brand-accent/30 transition-all min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.15em]">Produtividade</p>
            <TrendingUp size={16} className="text-brand-accent" />
          </div>
          <div className="flex-1 flex items-center">
            <div className="space-y-0.5">
              <h4 className="text-sm md:text-[26px] font-black text-brand-accent tracking-tighter font-mono leading-tight truncate">
                {formatCurrency(productivityData.realizavel)}
              </h4>
              <p className="text-[8px] md:text-[12px] font-bold text-brand-text-muted font-mono truncate">
                {formatCurrency(productivityData.bruto)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-brand-card p-3 md:p-6 rounded-[32px] shadow-sm border border-brand-border flex flex-col min-h-[120px] md:min-h-[160px] group hover:border-brand-accent/30 transition-all min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.15em]">Carteira</p>
            <Wallet size={16} className="text-brand-accent" />
          </div>
          <div className="flex-1 flex items-center">
            <h4 className="text-sm md:text-[26px] font-black text-brand-accent tracking-tighter font-mono truncate">{formatCurrency(portfolioValue)}</h4>
          </div>
        </div>

        <div className="bg-brand-card p-3 md:p-6 rounded-[32px] shadow-sm border border-brand-border flex flex-col min-h-[120px] md:min-h-[160px] group hover:border-brand-accent/30 transition-all min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.15em]">Cancelamentos</p>
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <div className="flex-1 flex items-center">
            <h4 className="text-xl md:text-3xl font-black text-red-400 tracking-tighter">{cancellationsCount} <span className="text-[10px] md:text-sm font-bold text-brand-text-muted ml-1">Cotas</span></h4>
          </div>
        </div>

        <div className="bg-brand-card p-3 md:p-6 rounded-[32px] shadow-sm border border-brand-border flex flex-col min-h-[120px] md:min-h-[160px] group hover:border-brand-accent/30 transition-all min-w-0">
          <div className="flex justify-between items-start">
            <p className="text-[9px] font-black text-brand-text-muted uppercase tracking-[0.15em]">Vendas Totais</p>
            <Package size={16} className="text-brand-accent" />
          </div>
          <div className="flex-1 flex items-center">
            <h4 className="text-xl md:text-3xl font-black text-brand-text tracking-tighter">{donutData.total} <span className="text-[10px] md:text-sm font-bold text-brand-text-muted ml-1">Cotas</span></h4>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-brand-card p-6 md:p-10 rounded-[40px] border border-brand-border shadow-sm space-y-8 overflow-hidden">
          <div>
            <h3 className="text-lg font-black text-brand-text uppercase tracking-tighter leading-none">Projeção da Carteira por Mês</h3>
            <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-1.5">Recebíveis consolidados (Respeitando regras de cancelamento)</p>
          </div>
          <div className="relative w-full">
            <div className="flex flex-col gap-4 w-full min-h-[300px] p-4 bg-brand-bg-alt/20 rounded-3xl border border-brand-border">
              {monthlyProjection.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-brand-text-muted h-full min-h-[250px]">
                  <BarChart3 size={48} strokeWidth={1} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sem dados projetados</p>
                </div>
              ) : (
                monthlyProjection.map((data, idx) => {
                  const barWidthPct = (data.total / maxProjectionValue) * 100;
                  return (
                    <div key={idx} className="grid grid-cols-[auto,1fr] items-center gap-3 group w-full animate-in fade-in slide-in-from-left-4 duration-500" style={{ animationDelay: `${idx * 50}ms`}}>
                      <div className="w-16 text-right text-[7px] md:text-[9px] font-black text-brand-text-muted uppercase tracking-tighter md:tracking-widest group-hover:text-brand-accent transition-colors truncate">
                        {data.label}
                      </div>
                      <div className="flex-1 h-8 bg-brand-bg-alt/70 rounded-lg overflow-hidden relative group">
                        <div
                          style={{ width: `${barWidthPct}%` }}
                          className="h-full bg-brand-accent rounded-lg transition-all duration-1000 ease-out group-hover:bg-brand-accent-alt shadow-lg"
                        ></div>
                         <div className="absolute inset-0 px-3 flex items-center justify-end text-[8px] md:text-[10px] font-black text-white font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          {formatCurrency(data.total)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-brand-card p-6 md:p-10 rounded-[40px] border border-brand-border shadow-sm flex flex-col space-y-8">
          <div>
            <h3 className="text-lg font-black text-brand-text uppercase tracking-tighter leading-none">Cotas do Mês</h3>
            <p className="text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-1.5">Vendidas / Ativas / Canceladas</p>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center">
            {renderDonut()}
            <div className="mt-8 grid grid-cols-2 gap-4 w-full">
              <div className="bg-brand-accent/10 p-4 rounded-2xl border border-brand-accent/20 flex flex-col items-center">
                <p className="text-[9px] font-black text-brand-accent uppercase tracking-widest mb-1">Ativas</p>
                <p className="text-xl font-black text-brand-accent-alt">{donutData.active}</p>
              </div>
              <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20 flex flex-col items-center">
                <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Canceladas</p>
                <p className="text-xl font-black text-red-400">{donutData.canceled}</p>
              </div>
            </div>
          </div>
          <p className="text-[9px] font-bold text-brand-text-muted text-center uppercase tracking-tighter">Distribuição de cotas vendidas em {monthLongName}</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;