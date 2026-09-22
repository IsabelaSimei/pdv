import React from 'react';
import {
  ShoppingCart,
  Package,
  FileSpreadsheet,
  ShoppingBag,
  ShieldCheck,
  Users,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Barcode,
  BarChart3,
  Database,
} from 'lucide-react';
import { SegmentType } from '../types';

export type ActiveTab = 'dashboard' | 'pdv' | 'inventory' | 'carne' | 'sales' | 'fiscal' | 'customers';

interface NavbarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeSegment: SegmentType;
  onChangeSegment: (segment: SegmentType) => void;
  lowStockCount: number;
  overdueInstallmentsCount: number;
  onResetData: () => void;
  onOpenBackup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeSegment,
  onChangeSegment,
  lowStockCount,
  overdueInstallmentsCount,
  onResetData,
  onOpenBackup,
}) => {
  return (
    <header className="no-print bg-slate-900 border-b border-slate-800 text-white select-none">
      {/* Top Banner with Brand & Store Segment Filter */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-500 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-black tracking-wider uppercase text-white">
                Baby Liz &amp; Metamorfose Cosméticos
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PDV Fiscal + Crediário
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center space-x-2">
              <span>Jerônimo Vieira de Andrade, 477 • São José da Bela Vista - SP</span>
              <span>•</span>
              <span className="font-mono text-slate-300">CNPJ: 50.209.247/0001-90</span>
            </div>
          </div>
        </div>

        {/* Segment Filter (Infantil / Perfumaria / Geral) */}
        <div className="flex items-center space-x-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80 text-xs">
          <span className="text-[11px] font-bold text-slate-400 px-2">Segmento:</span>

          <button
            type="button"
            onClick={() => onChangeSegment('geral')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              activeSegment === 'geral'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Todos
          </button>

          <button
            type="button"
            onClick={() => onChangeSegment('infantil')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
              activeSegment === 'infantil'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🧸</span>
            <span>Baby Liz (Infantil)</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeSegment('perfumaria')}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
              activeSegment === 'perfumaria'
                ? 'bg-pink-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>🌸</span>
            <span>Metamorfose Cosméticos</span>
          </button>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2.5">
          {onOpenBackup && (
            <button
              type="button"
              onClick={onOpenBackup}
              className="text-[11px] text-indigo-300 hover:text-white flex items-center space-x-1.5 transition px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 shadow-2xs cursor-pointer"
              title="Importar ou exportar backup do banco de dados local"
            >
              <Database className="h-3.5 w-3.5 text-indigo-400" />
              <span className="font-semibold">Backup do Banco de Dados</span>
            </button>
          )}

          {/* Reset Demo Data button */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Deseja restaurar os dados de demonstração iniciais com roupas infantis, perfumes, carnês e clientes de exemplo?'
                )
              ) {
                onResetData();
              }
            }}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 hover:underline transition cursor-pointer"
            title="Restaurar dados iniciais de exemplo"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restaurar Demonstração</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-4 flex items-center space-x-1 overflow-x-auto py-1">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
            currentTab === 'dashboard'
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4 text-indigo-400" />
          <span>Dashboard &amp; Métricas</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('pdv')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
            currentTab === 'pdv'
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShoppingCart className="h-4 w-4 text-indigo-400" />
          <span>Frente de Caixa (PDV)</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('inventory')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 relative ${
            currentTab === 'inventory'
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Package className="h-4 w-4 text-emerald-400" />
          <span>Controle de Estoque</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-900">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('carne')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 relative ${
            currentTab === 'carne'
              ? 'border-purple-500 bg-purple-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-purple-400" />
          <span>Carnês &amp; Crediário</span>
          {overdueInstallmentsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
              {overdueInstallmentsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('sales')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
            currentTab === 'sales'
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-blue-400" />
          <span>Histórico de Vendas</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('fiscal')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
            currentTab === 'fiscal'
              ? 'border-emerald-500 bg-emerald-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Configurações &amp; Fiscal (NFC-e)</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('customers')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-2 border-b-2 ${
            currentTab === 'customers'
              ? 'border-indigo-500 bg-indigo-600/20 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4 text-indigo-300" />
          <span>Clientes &amp; Limites</span>
        </button>
      </div>
    </header>
  );
};
