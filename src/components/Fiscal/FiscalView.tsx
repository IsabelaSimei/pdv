import React, { useState } from 'react';
import {
  ShieldCheck,
  Printer,
  Download,
  Settings,
  Search,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Database,
} from 'lucide-react';
import { FiscalConfig, FiscalInvoice, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { FiscalConfigModal } from './FiscalConfigModal';
import { ReceiptModal } from '../PDV/ReceiptModal';

interface FiscalViewProps {
  invoices: FiscalInvoice[];
  sales: Sale[];
  config: FiscalConfig;
  onSaveConfig: (config: FiscalConfig) => void;
  onRefreshData?: () => void;
  onOpenCarnePrint?: (carne: any) => void;
}

export const FiscalView: React.FC<FiscalViewProps> = ({
  invoices,
  sales,
  config,
  onSaveConfig,
  onRefreshData,
  onOpenCarnePrint,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configModalTab, setConfigModalTab] = useState<'fiscal' | 'backup'>('fiscal');
  const [selectedInvoiceForDanfe, setSelectedInvoiceForDanfe] = useState<FiscalInvoice | null>(null);

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      inv.accessKey.includes(term) ||
      inv.protocol.includes(term) ||
      inv.saleCode.toLowerCase().includes(term) ||
      (inv.customerName && inv.customerName.toLowerCase().includes(term)) ||
      (inv.customerCpf && inv.customerCpf.includes(term))
    );
  });

  const totalEmittedAmount = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalTributos = invoices.reduce((acc, inv) => acc + inv.tributosAproximados, 0);

  const handleDownloadXml = (inv: FiscalInvoice) => {
    if (!inv.xmlContent) return;
    const blob = new Blob([inv.xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NFCe_${inv.accessKey}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedSale = selectedInvoiceForDanfe
    ? sales.find((s) => s.id === selectedInvoiceForDanfe.saleId) || {
        id: selectedInvoiceForDanfe.saleId,
        code: selectedInvoiceForDanfe.saleCode,
        date: selectedInvoiceForDanfe.issuedAt,
        items: [],
        subtotal: selectedInvoiceForDanfe.totalAmount,
        discount: 0,
        total: selectedInvoiceForDanfe.totalAmount,
        paymentMethod: 'dinheiro' as any,
        paymentDetails: {},
        fiscalStatus: 'emitida' as any,
      }
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <span>Painel de Notas Fiscais Eletrônicas &amp; Configurações</span>
          </h2>
          <p className="text-xs text-slate-500">
            Acompanhe cupons fiscais NFC-e emitidos, chaves SEFAZ e faça backup dos dados
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => {
              setConfigModalTab('backup');
              setIsConfigOpen(true);
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
            title="Exportar ou importar backup completo dos dados da loja"
          >
            <Database className="h-4 w-4 text-indigo-600" />
            <span>Importar / Exportar Banco de Dados</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setConfigModalTab('fiscal');
              setIsConfigOpen(true);
            }}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Settings className="h-4 w-4 text-slate-600" />
            <span>Emissor SEFAZ</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Faturado em Notas Fiscais
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalEmittedAmount)}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Cupons Autorizados na SEFAZ
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {invoices.length} documento(s)
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Tributos Totais Aproximados (IBPT)
          </div>
          <div className="text-xl font-black text-slate-700 mt-1">{formatCurrency(totalTributos)}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por chave de acesso (44 dígitos), protocolo, venda..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Ambiente:{' '}
          <strong className="text-emerald-700 uppercase">
            {config.environment === 'homologacao' ? 'Homologação SEFAZ' : 'Produção'}
          </strong>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
            <ShieldCheck className="h-12 w-12 text-slate-300 stroke-1 mb-2" />
            <div className="text-sm font-bold text-slate-600">Nenhuma Nota Fiscal Emitida</div>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Ao concluir uma venda no PDV com a opção fiscal ativada, a NFC-e será automaticamente transmitida e arquivada aqui.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-bold">NFC-e / Venda</th>
                <th className="py-3 px-4 font-bold">Chave de Acesso (44 dígitos)</th>
                <th className="py-3 px-4 font-bold">Data Emissão</th>
                <th className="py-3 px-4 font-bold">Status SEFAZ</th>
                <th className="py-3 px-4 font-bold text-right">Valor Total</th>
                <th className="py-3 px-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">
                      NFC-e nº {inv.number} (Série {inv.series})
                    </div>
                    <div className="text-[10px] text-slate-500">Venda: #{inv.saleCode}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-mono text-[10px] font-bold text-slate-700 max-w-[280px] truncate select-all">
                      {inv.accessKey}
                    </div>
                    <div className="text-[10px] text-slate-400">Prot: {inv.protocol}</div>
                  </td>

                  <td className="py-3 px-4 text-slate-600">{formatDateTime(inv.issuedAt)}</td>

                  <td className="py-3 px-4">
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>100 - Autorizada</span>
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-black text-slate-900">
                    {formatCurrency(inv.totalAmount)}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceForDanfe(inv)}
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                        title="Visualizar e Imprimir DANFE NFC-e"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadXml(inv)}
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
                        title="Baixar Arquivo XML"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Config Modal */}
      <FiscalConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSaveConfig={onSaveConfig}
        onRefreshData={onRefreshData}
        initialTab={configModalTab}
      />

      {/* DANFE Viewer / Print Modal */}
      {selectedInvoiceForDanfe && selectedSale && (
        <ReceiptModal
          isOpen={!!selectedInvoiceForDanfe}
          onClose={() => setSelectedInvoiceForDanfe(null)}
          sale={selectedSale as any}
          invoice={selectedInvoiceForDanfe}
          fiscalConfig={config}
          onOpenCarnePrint={onOpenCarnePrint}
        />
      )}
    </div>
  );
};
