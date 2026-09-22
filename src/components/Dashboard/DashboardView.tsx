import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Wallet,
  ArrowUpRight,
  Package,
  Calendar,
  Layers,
  Sparkles,
  Printer,
  ChevronRight,
  AlertCircle,
  Clock,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { Carne, Customer, FiscalConfig, PaymentMethod, Product, Sale, SegmentType } from '../../types';

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  carnes: Carne[];
  customers?: Customer[];
  fiscalConfig: FiscalConfig;
  activeSegment: SegmentType;
  onNavigateTab?: (tab: 'pdv' | 'inventory' | 'carne' | 'sales' | 'fiscal' | 'customers') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sales,
  products,
  carnes,
  fiscalConfig,
  activeSegment: initialSegment,
  onNavigateTab,
}) => {
  // Local filter segment (allows user to filter dashboard independently or sync)
  const [segmentFilter, setSegmentFilter] = useState<SegmentType>(initialSegment || 'geral');
  const [dailyRange, setDailyRange] = useState<'14dias' | 'mes' | '30dias'>('mes');
  const [topProductsMetric, setTopProductsMetric] = useState<'revenue' | 'quantity'>('revenue');

  // Helper format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatShortCurrency = (val: number) => {
    if (val >= 1000) {
      return `R$ ${(val / 1000).toFixed(1)}k`;
    }
    return `R$ ${val.toFixed(0)}`;
  };

  // Product map for fast lookups
  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Filter sales based on segment
  const filteredSales = useMemo(() => {
    if (segmentFilter === 'geral') return sales;

    return sales.filter((s) => {
      // Check if any items belong to the selected segment
      return s.items.some((item) => {
        const prod = productMap.get(item.productId);
        if (prod) return prod.segment === segmentFilter;
        // Fallback by SKU prefix or tags if product was removed
        if (segmentFilter === 'infantil') {
          return item.productName.toLowerCase().includes('infantil') ||
            item.productName.toLowerCase().includes('bebê') ||
            item.productName.toLowerCase().includes('vestido') ||
            item.productName.toLowerCase().includes('body') ||
            item.productName.toLowerCase().includes('conjunto');
        } else {
          return item.productName.toLowerCase().includes('eau') ||
            item.productName.toLowerCase().includes('perfume') ||
            item.productName.toLowerCase().includes('splash') ||
            item.productName.toLowerCase().includes('colônia');
        }
      });
    });
  }, [sales, segmentFilter, productMap]);

  // Current Month calculations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Key Performance Indicators (KPIs)
  const metrics = useMemo(() => {
    // Current month sales
    const monthSales = filteredSales.filter((s) => {
      const d = new Date(s.date);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const totalRevenueMonth = monthSales.reduce((acc, s) => acc + s.total, 0);
    const totalSalesCount = monthSales.length;
    const ticketMedio = totalSalesCount > 0 ? totalRevenueMonth / totalSalesCount : 0;

    // Items sold in month
    const totalItemsSold = monthSales.reduce((acc, s) => {
      return acc + s.items.reduce((sum, it) => sum + it.quantity, 0);
    }, 0);

    // Immediate Cash Flow vs Crediario/Carne in current month
    let cashImmediate = 0; // Dinheiro, PIX, Cartões
    let carneCreditIssued = 0; // Vendas a prazo via carnê

    monthSales.forEach((s) => {
      if (s.paymentMethod === 'carne') {
        carneCreditIssued += s.total;
      } else {
        cashImmediate += s.total;
      }
    });

    // Installment payments received in current month
    let carnePaymentsReceivedMonth = 0;
    carnes.forEach((c) => {
      c.installments.forEach((inst) => {
        if (inst.status === 'paga' && inst.paidDate) {
          const pd = new Date(inst.paidDate);
          if (pd.getFullYear() === currentYear && pd.getMonth() === currentMonth) {
            carnePaymentsReceivedMonth += inst.paidAmount || inst.amount;
          }
        }
      });
    });

    // Total actual cash intake = immediate sales + paid installments
    const totalCashIntake = cashImmediate + carnePaymentsReceivedMonth;

    // Carnês overview (pending & overdue)
    let totalCarnePending = 0;
    let totalCarneOverdue = 0;
    carnes.forEach((c) => {
      if (c.status !== 'cancelado') {
        c.installments.forEach((inst) => {
          if (inst.status === 'vencida') {
            totalCarneOverdue += inst.amount;
          } else if (inst.status === 'pendente') {
            totalCarnePending += inst.amount;
          }
        });
      }
    });

    // Revenue breakdown by segment
    let revInfantil = 0;
    let revPerfumaria = 0;

    monthSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = productMap.get(item.productId);
        const seg = prod?.segment || (item.productName.toLowerCase().includes('perfume') || item.productName.toLowerCase().includes('eau') ? 'perfumaria' : 'infantil');
        if (seg === 'infantil') revInfantil += item.total;
        else revPerfumaria += item.total;
      });
    });

    return {
      totalRevenueMonth,
      totalSalesCount,
      ticketMedio,
      totalItemsSold,
      cashImmediate,
      carneCreditIssued,
      carnePaymentsReceivedMonth,
      totalCashIntake,
      totalCarnePending,
      totalCarneOverdue,
      revInfantil,
      revPerfumaria,
    };
  }, [filteredSales, carnes, currentYear, currentMonth, productMap]);

  // 1. FATURAMENTO DIÁRIO (Daily Billing Chart)
  const dailyBillingData = useMemo(() => {
    // Generate dates based on range selection
    const daysCount = dailyRange === '14dias' ? 14 : dailyRange === '30dias' ? 30 : now.getDate();
    const dataList: {
      dateKey: string;
      label: string;
      displayDate: string;
      faturamento: number;
      vendas: number;
      ticketMedio: number;
      infantil: number;
      perfumaria: number;
    }[] = [];

    const dateMap = new Map<string, { faturamento: number; vendas: number; infantil: number; perfumaria: number }>();

    // Prepare range
    if (dailyRange === 'mes') {
      // From day 1 of current month to today (or end of month)
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        const d = new Date(currentYear, currentMonth, day);
        const key = d.toISOString().split('T')[0];
        dateMap.set(key, { faturamento: 0, vendas: 0, infantil: 0, perfumaria: 0 });
      }
    } else {
      // Last N days
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000);
        const key = d.toISOString().split('T')[0];
        dateMap.set(key, { faturamento: 0, vendas: 0, infantil: 0, perfumaria: 0 });
      }
    }

    // Populate with filtered sales
    filteredSales.forEach((s) => {
      const saleDateKey = s.date.split('T')[0];
      if (dateMap.has(saleDateKey)) {
        const item = dateMap.get(saleDateKey)!;
        item.faturamento = Math.round((item.faturamento + s.total) * 100) / 100;
        item.vendas += 1;

        // Breakdown items
        s.items.forEach((it) => {
          const prod = productMap.get(it.productId);
          const seg = prod?.segment || (it.productName.toLowerCase().includes('perfume') || it.productName.toLowerCase().includes('eau') ? 'perfumaria' : 'infantil');
          if (seg === 'infantil') {
            item.infantil = Math.round((item.infantil + it.total) * 100) / 100;
          } else {
            item.perfumaria = Math.round((item.perfumaria + it.total) * 100) / 100;
          }
        });
      }
    });

    dateMap.forEach((val, key) => {
      const parts = key.split('-');
      const dayStr = parts[2];
      const monthStr = parts[1];
      dataList.push({
        dateKey: key,
        label: `${dayStr}/${monthStr}`,
        displayDate: `${dayStr}/${monthStr}/${parts[0]}`,
        faturamento: val.faturamento,
        vendas: val.vendas,
        ticketMedio: val.vendas > 0 ? Math.round((val.faturamento / val.vendas) * 100) / 100 : 0,
        infantil: val.infantil,
        perfumaria: val.perfumaria,
      });
    });

    return dataList;
  }, [filteredSales, dailyRange, now, currentYear, currentMonth, productMap]);

  // Average daily revenue for reference line
  const averageDailyRevenue = useMemo(() => {
    const activeDays = dailyBillingData.filter((d) => d.faturamento > 0);
    if (activeDays.length === 0) return 0;
    const total = activeDays.reduce((acc, d) => acc + d.faturamento, 0);
    return Math.round((total / activeDays.length) * 100) / 100;
  }, [dailyBillingData]);

  // Best day in the period
  const bestDay = useMemo(() => {
    return dailyBillingData.reduce((prev, curr) => (curr.faturamento > prev.faturamento ? curr : prev), {
      faturamento: 0,
      label: '-',
      vendas: 0,
    });
  }, [dailyBillingData]);

  // 2. PRODUTOS MAIS VENDIDOS (Top Selling Products)
  const topProducts = useMemo(() => {
    const aggMap = new Map<
      string,
      {
        id: string;
        name: string;
        barcode: string;
        segment: SegmentType;
        unitPrice: number;
        quantity: number;
        revenue: number;
      }
    >();

    filteredSales.forEach((s) => {
      s.items.forEach((it) => {
        const prod = productMap.get(it.productId);
        const segment = prod?.segment || (it.productName.toLowerCase().includes('perfume') || it.productName.toLowerCase().includes('eau') ? 'perfumaria' : 'infantil');

        if (segmentFilter !== 'geral' && segment !== segmentFilter) {
          return;
        }

        const existing = aggMap.get(it.productId) || {
          id: it.productId,
          name: it.productName,
          barcode: it.barcode,
          segment,
          unitPrice: it.unitPrice,
          quantity: 0,
          revenue: 0,
        };

        existing.quantity += it.quantity;
        existing.revenue = Math.round((existing.revenue + it.total) * 100) / 100;
        aggMap.set(it.productId, existing);
      });
    });

    const list = Array.from(aggMap.values());

    // Sort by requested metric
    if (topProductsMetric === 'revenue') {
      list.sort((a, b) => b.revenue - a.revenue);
    } else {
      list.sort((a, b) => b.quantity - a.quantity);
    }

    const totalPeriodRevenue = list.reduce((acc, it) => acc + it.revenue, 0);

    return list.slice(0, 8).map((item, index) => ({
      ...item,
      rank: index + 1,
      share: totalPeriodRevenue > 0 ? ((item.revenue / totalPeriodRevenue) * 100).toFixed(1) : '0',
      shortName: item.name.length > 22 ? `${item.name.slice(0, 20)}...` : item.name,
    }));
  }, [filteredSales, segmentFilter, topProductsMetric, productMap]);

  // 3. FLUXO DE CAIXA ACUMULADO DO MÊS (Cumulative Cash Flow Chart)
  const cumulativeCashFlowData = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dataList: {
      day: number;
      label: string;
      dateKey: string;
      faturamentoAcumulado: number;
      caixaRealizadoAcumulado: number;
      faturamentoDiario: number;
      caixaDiario: number;
      metaProjetada: number;
    }[] = [];

    // Monthly Target (e.g. R$ 12.000 or 1.3x month revenue)
    const monthlyTarget = Math.max(12000, Math.ceil(metrics.totalRevenueMonth * 1.25 / 1000) * 1000);

    let runningRevenue = 0;
    let runningCash = 0;

    // Pre-aggregate daily revenue and daily cash in current month
    const dailySalesMap = new Map<number, { revenue: number; immediateCash: number }>();
    const dailyCarnePayMap = new Map<number, number>();

    for (let d = 1; d <= daysInMonth; d++) {
      dailySalesMap.set(d, { revenue: 0, immediateCash: 0 });
      dailyCarnePayMap.set(d, 0);
    }

    filteredSales.forEach((s) => {
      const sd = new Date(s.date);
      if (sd.getFullYear() === currentYear && sd.getMonth() === currentMonth) {
        const dayNum = sd.getDate();
        if (dailySalesMap.has(dayNum)) {
          const dItem = dailySalesMap.get(dayNum)!;
          dItem.revenue += s.total;
          if (s.paymentMethod !== 'carne') {
            dItem.immediateCash += s.total;
          }
        }
      }
    });

    // Add installment payments received in current month
    carnes.forEach((c) => {
      c.installments.forEach((inst) => {
        if (inst.status === 'paga' && inst.paidDate) {
          const pd = new Date(inst.paidDate);
          if (pd.getFullYear() === currentYear && pd.getMonth() === currentMonth) {
            const dayNum = pd.getDate();
            if (dailyCarnePayMap.has(dayNum)) {
              dailyCarnePayMap.set(dayNum, (dailyCarnePayMap.get(dayNum) || 0) + (inst.paidAmount || inst.amount));
            }
          }
        }
      });
    });

    // Compute cumulative curve
    const currentDayOfMonth = now.getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const salesDay = dailySalesMap.get(d) || { revenue: 0, immediateCash: 0 };
      const carneDay = dailyCarnePayMap.get(d) || 0;
      const dayTotalCash = salesDay.immediateCash + carneDay;

      // Accumulate
      runningRevenue += salesDay.revenue;
      runningCash += dayTotalCash;

      // Meta proporcional ao dia
      const metaProjetada = Math.round((monthlyTarget / daysInMonth) * d);

      // Only plot real accumulated data up to current day (or end of month)
      if (d <= currentDayOfMonth) {
        dataList.push({
          day: d,
          label: `Dia ${String(d).padStart(2, '0')}`,
          dateKey: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          faturamentoAcumulado: Math.round(runningRevenue * 100) / 100,
          caixaRealizadoAcumulado: Math.round(runningCash * 100) / 100,
          faturamentoDiario: Math.round(salesDay.revenue * 100) / 100,
          caixaDiario: Math.round(dayTotalCash * 100) / 100,
          metaProjetada,
        });
      } else {
        // Future projection reference
        dataList.push({
          day: d,
          label: `Dia ${String(d).padStart(2, '0')}`,
          dateKey: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
          faturamentoAcumulado: Math.round(runningRevenue * 100) / 100,
          caixaRealizadoAcumulado: Math.round(runningCash * 100) / 100,
          faturamentoDiario: 0,
          caixaDiario: 0,
          metaProjetada,
        });
      }
    }

    return {
      data: dataList,
      monthlyTarget,
      totalAccumulatedRevenue: runningRevenue,
      totalAccumulatedCash: runningCash,
    };
  }, [filteredSales, carnes, currentYear, currentMonth, now, metrics.totalRevenueMonth]);

  // Payment Methods Breakdown (Donut chart)
  const paymentMethodsBreakdown = useMemo(() => {
    const counts: Record<PaymentMethod, { count: number; total: number; label: string; color: string }> = {
      pix: { count: 0, total: 0, label: 'PIX Instantâneo', color: '#10b981' },
      cartao_credito: { count: 0, total: 0, label: 'Cartão de Crédito', color: '#6366f1' },
      cartao_debito: { count: 0, total: 0, label: 'Cartão de Débito', color: '#06b6d4' },
      dinheiro: { count: 0, total: 0, label: 'Dinheiro em Espécie', color: '#f59e0b' },
      carne: { count: 0, total: 0, label: 'Carnê / Crediário', color: '#a855f7' },
    };

    filteredSales.forEach((s) => {
      const pm = s.paymentMethod;
      if (counts[pm]) {
        counts[pm].count += 1;
        counts[pm].total += s.total;
      }
    });

    const totalAll = Object.values(counts).reduce((acc, c) => acc + c.total, 0);

    return Object.entries(counts)
      .map(([key, item]) => ({
        method: key as PaymentMethod,
        name: item.label,
        value: Math.round(item.total * 100) / 100,
        count: item.count,
        color: item.color,
        percentage: totalAll > 0 ? ((item.total / totalAll) * 100).toFixed(1) : '0',
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filteredSales]);

  // Print summary report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-slate-800 p-4 md:p-6 space-y-6">
      {/* Top Header with Segment Selector & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
                <span>Dashboard &amp; Métricas Financeiras</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  {fiscalConfig.tradeName || 'Baby Liz & Metamorfose Cosméticos'}
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                Acompanhamento em tempo real de faturamento diário, produtos mais vendidos e fluxo de caixa do mês.
              </p>
            </div>
          </div>
        </div>

        {/* Controls: Segment filter & Print Report */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segment Filter */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs">
            <button
              type="button"
              onClick={() => setSegmentFilter('geral')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                segmentFilter === 'geral'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Todos os Segmentos
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('infantil')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                segmentFilter === 'infantil'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🧸</span>
              <span>Baby Liz (Infantil)</span>
            </button>
            <button
              type="button"
              onClick={() => setSegmentFilter('perfumaria')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center space-x-1 ${
                segmentFilter === 'perfumaria'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🌸</span>
              <span>Metamorfose Cosméticos</span>
            </button>
          </div>

          {/* Quick Tab Jump or Print */}
          <button
            type="button"
            onClick={handlePrintReport}
            className="no-print px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center space-x-1.5 shadow-xs transition"
            title="Imprimir relatório gerencial"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Imprimir Resumo</span>
          </button>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('pdv')}
              className="no-print px-3.5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Abrir PDV</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faturamento do Mês */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Faturamento do Mês
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatCurrency(metrics.totalRevenueMonth)}
            </div>
            <div className="mt-1 flex items-center space-x-1.5 text-xs text-slate-500">
              <span className="font-bold text-emerald-600 flex items-center">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                {metrics.totalSalesCount} vendas
              </span>
              <span>•</span>
              <span>{metrics.totalItemsSold} itens vendidos</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ticket Médio:</span>
            <span className="font-bold text-slate-800">{formatCurrency(metrics.ticketMedio)}</span>
          </div>
        </div>

        {/* Card 2: Caixa Realizado (Entradas Imediatas) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Caixa Líquido do Mês
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatCurrency(metrics.totalCashIntake)}
            </div>
            <div className="mt-1 text-xs text-slate-500 flex items-center space-x-1">
              <span>À vista / cartões:</span>
              <span className="font-bold text-slate-700">{formatCurrency(metrics.cashImmediate)}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Baixas de Carnês:</span>
            <span className="font-bold text-emerald-600">+{formatCurrency(metrics.carnePaymentsReceivedMonth)}</span>
          </div>
        </div>

        {/* Card 3: Crediário / Carnês Gerados */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Crediário da Loja (Carnês)
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CreditCard className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-700 tracking-tight">
              {formatCurrency(metrics.carneCreditIssued)}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Vendas a prazo emitidas no mês
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Atraso Total:</span>
            <span className={`font-bold ${metrics.totalCarneOverdue > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
              {formatCurrency(metrics.totalCarneOverdue)}
            </span>
          </div>
        </div>

        {/* Card 4: Faturamento por Segmento */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Mix de Categorias
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center space-x-1">
                  <span>🧸</span>
                  <span>Moda Infantil:</span>
                </span>
                <span className="font-bold text-amber-700">{formatCurrency(metrics.revInfantil)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalRevenueMonth > 0
                        ? Math.min(100, Math.round((metrics.revInfantil / metrics.totalRevenueMonth) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center space-x-1">
                  <span>🌸</span>
                  <span>Perfumaria:</span>
                </span>
                <span className="font-bold text-pink-700">{formatCurrency(metrics.revPerfumaria)}</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-pink-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      metrics.totalRevenueMonth > 0
                        ? Math.min(100, Math.round((metrics.revPerfumaria / metrics.totalRevenueMonth) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Segmento ativo:</span>
            <span className="font-bold text-indigo-600 capitalize">{segmentFilter}</span>
          </div>
        </div>
      </div>

      {/* CHART SECTION 1: Faturamento Diário */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <span>Faturamento Diário de Vendas</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evolução das vendas dia a dia no período selecionado com média diária de{' '}
              <strong className="text-slate-800">{formatCurrency(averageDailyRevenue)}</strong>.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDailyRange('14dias')}
              className={`px-3 py-1 rounded-lg transition ${
                dailyRange === '14dias' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Últimos 14 Dias
            </button>
            <button
              type="button"
              onClick={() => setDailyRange('mes')}
              className={`px-3 py-1 rounded-lg transition ${
                dailyRange === 'mes' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setDailyRange('30dias')}
              className={`px-3 py-1 rounded-lg transition ${
                dailyRange === '30dias' ? 'bg-white text-indigo-600 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              Últimos 30 Dias
            </button>
          </div>
        </div>

        {/* Daily Bar Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyBillingData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `R$ ${val}`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-48">
                        <div className="font-black text-slate-200 border-b border-slate-700 pb-1 flex justify-between">
                          <span>{data.displayDate}</span>
                          <span className="text-indigo-400 font-bold">{data.vendas} vendas</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-black text-emerald-400 pt-1">
                          <span>Faturamento Total:</span>
                          <span>{formatCurrency(data.faturamento)}</span>
                        </div>
                        {data.vendas > 0 && (
                          <div className="flex justify-between text-slate-300 text-[11px]">
                            <span>Ticket Médio do dia:</span>
                            <span className="font-bold text-slate-100">{formatCurrency(data.ticketMedio)}</span>
                          </div>
                        )}
                        <div className="pt-1.5 border-t border-slate-800 space-y-1 text-[11px]">
                          <div className="flex justify-between text-amber-300">
                            <span className="flex items-center space-x-1">
                              <span>🧸</span>
                              <span>Roupa Infantil:</span>
                            </span>
                            <span className="font-bold">{formatCurrency(data.infantil)}</span>
                          </div>
                          <div className="flex justify-between text-pink-300">
                            <span className="flex items-center space-x-1">
                              <span>🌸</span>
                              <span>Perfumaria:</span>
                            </span>
                            <span className="font-bold">{formatCurrency(data.perfumaria)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
              />
              <Bar
                name="Roupa Infantil (R$)"
                dataKey="infantil"
                stackId="a"
                fill="#f59e0b"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                name="Perfumaria (R$)"
                dataKey="perfumaria"
                stackId="a"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Stats Footer */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Total no Período</span>
            <span className="font-black text-slate-900 text-sm">
              {formatCurrency(dailyBillingData.reduce((acc, d) => acc + d.faturamento, 0))}
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Média Diária</span>
            <span className="font-black text-indigo-700 text-sm">{formatCurrency(averageDailyRevenue)}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Melhor Dia de Vendas</span>
            <span className="font-black text-emerald-700 text-sm">
              {bestDay.label} ({formatCurrency(bestDay.faturamento)})
            </span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 block text-[11px]">Total de Pedidos</span>
            <span className="font-black text-slate-900 text-sm">
              {dailyBillingData.reduce((acc, d) => acc + d.vendas, 0)} vendas realizadas
            </span>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: Produtos Mais Vendidos & Fluxo de Caixa Acumulado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART SECTION 2: Produtos Mais Vendidos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <Package className="h-5 w-5 text-amber-600" />
                  <span>Produtos Mais Vendidos</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Ranking dos itens com maior saída e receita na loja.
                </p>
              </div>

              {/* Metric Toggle: Receita vs Qtd */}
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setTopProductsMetric('revenue')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    topProductsMetric === 'revenue'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Por Receita (R$)
                </button>
                <button
                  type="button"
                  onClick={() => setTopProductsMetric('quantity')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    topProductsMetric === 'quantity'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Por Unidades
                </button>
              </div>
            </div>

            {/* Horizontal Bar Chart for Top Products */}
            <div className="h-72 w-full">
              {topProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                  <Package className="h-8 w-8 mb-2 opacity-50" />
                  <span>Nenhum produto vendido no período com o filtro selecionado.</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={topProducts}
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis
                      type="number"
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) =>
                        topProductsMetric === 'revenue' ? `R$ ${val}` : `${val} un`
                      }
                    />
                    <YAxis
                      dataKey="shortName"
                      type="category"
                      width={120}
                      tickLine={false}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-44">
                              <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
                                #{data.rank} - {data.name}
                              </div>
                              <div className="flex justify-between items-center text-emerald-400 font-bold">
                                <span>Receita Total:</span>
                                <span>{formatCurrency(data.revenue)}</span>
                              </div>
                              <div className="flex justify-between text-slate-300">
                                <span>Qtd. Vendida:</span>
                                <span className="font-bold">{data.quantity} unidades</span>
                              </div>
                              <div className="flex justify-between text-slate-400 text-[11px]">
                                <span>Preço Unitário:</span>
                                <span>{formatCurrency(data.unitPrice)}</span>
                              </div>
                              <div className="flex justify-between text-indigo-300 text-[11px] pt-1 border-t border-slate-800">
                                <span>Participação:</span>
                                <span className="font-bold">{data.share}% do faturamento</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey={topProductsMetric === 'revenue' ? 'revenue' : 'quantity'}
                      name={topProductsMetric === 'revenue' ? 'Receita (R$)' : 'Qtd Vendida'}
                      radius={[0, 6, 6, 0]}
                    >
                      {topProducts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.segment === 'infantil' ? '#f59e0b' : '#ec4899'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Ranking Table Preview */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {topProducts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                        item.rank === 1
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : item.rank === 2
                          ? 'bg-slate-200 text-slate-700'
                          : item.rank === 3
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {item.rank}º
                    </span>
                    <span className="truncate font-semibold text-slate-800">{item.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                        item.segment === 'infantil'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-pink-100 text-pink-800'
                      }`}
                    >
                      {item.segment === 'infantil' ? 'Infantil' : 'Perfumaria'}
                    </span>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <div className="font-bold text-slate-900">{formatCurrency(item.revenue)}</div>
                    <div className="text-[10px] text-slate-500">{item.quantity} un vendidas</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART SECTION 3: Fluxo de Caixa Acumulado do Mês */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                  <span>Fluxo de Caixa Acumulado do Mês</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Curva diária cumulativa de faturamento e entradas líquidas em caixa até hoje.
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Total Acumulado
                </span>
                <span className="text-sm font-black text-emerald-700">
                  {formatCurrency(cumulativeCashFlowData.totalAccumulatedRevenue)}
                </span>
              </div>
            </div>

            {/* Area Chart: Cumulative Revenue vs Cash */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulativeCashFlowData.data}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorFaturamento" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorCaixa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => `D${val}`}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(val) => formatShortCurrency(val)}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 min-w-48">
                            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 flex justify-between">
                              <span>Dia {data.day} do mês</span>
                              <span className="text-slate-400">{data.dateKey}</span>
                            </div>
                            <div className="flex justify-between items-center text-indigo-300 font-bold">
                              <span>Faturamento Acumulado:</span>
                              <span>{formatCurrency(data.faturamentoAcumulado)}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>Caixa Líquido Realizado:</span>
                              <span>{formatCurrency(data.caixaRealizadoAcumulado)}</span>
                            </div>
                            <div className="pt-1.5 border-t border-slate-800 flex justify-between text-slate-400 text-[11px]">
                              <span>Venda do dia:</span>
                              <span className="text-slate-200 font-bold">{formatCurrency(data.faturamentoDiario)}</span>
                            </div>
                            <div className="flex justify-between text-slate-400 text-[11px]">
                              <span>Meta projetada:</span>
                              <span className="text-slate-300">{formatCurrency(data.metaProjetada)}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 10, fontSize: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="faturamentoAcumulado"
                    name="Faturamento Acumulado (R$)"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorFaturamento)"
                  />
                  <Area
                    type="monotone"
                    dataKey="caixaRealizadoAcumulado"
                    name="Caixa Líquido (R$)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCaixa)"
                  />
                  <Line
                    type="monotone"
                    dataKey="metaProjetada"
                    name="Linha de Meta"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow Highlights */}
          <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block text-[11px] font-semibold">Caixa Imediato</span>
              <span className="font-black text-emerald-800 text-sm">
                {formatCurrency(metrics.totalCashIntake)}
              </span>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Dinheiro, PIX e Cartões</span>
            </div>
            <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
              <span className="text-purple-700 block text-[11px] font-semibold">A Prazo / Crediário</span>
              <span className="font-black text-purple-800 text-sm">
                {formatCurrency(metrics.carneCreditIssued)}
              </span>
              <span className="text-[10px] text-purple-600 block mt-0.5">Em parcelas de carnê</span>
            </div>
            <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 col-span-2 sm:col-span-1">
              <span className="text-indigo-700 block text-[11px] font-semibold">Previsão a Receber</span>
              <span className="font-black text-indigo-800 text-sm">
                {formatCurrency(metrics.totalCarnePending)}
              </span>
              <span className="text-[10px] text-indigo-600 block mt-0.5">Parcelas futuras de carnê</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Resumo dos Meios de Pagamento & Ações Rápidas */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <h2 className="text-base font-black text-slate-900 tracking-tight mb-4 flex items-center space-x-2">
          <PieChartIcon className="h-5 w-5 text-indigo-600" />
          <span>Distribuição por Formas de Pagamento no Período</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {paymentMethodsBreakdown.map((item) => (
            <div
              key={item.method}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 truncate">{item.name}</span>
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900 tracking-tight">
                  {formatCurrency(item.value)}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.count} vendas</span>
                  <span className="font-bold text-slate-700">{item.percentage}%</span>
                </div>
              </div>
              <div className="mt-2.5 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
