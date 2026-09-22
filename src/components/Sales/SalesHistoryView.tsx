import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Printer,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  CreditCard,
  Ban,
  FileText,
} from 'lucide-react';
import { FiscalConfig, FiscalInvoice, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { ReceiptModal } from '../PDV/ReceiptModal';

interface SalesHistoryViewProps {
  sales: Sale[];
  invoices: FiscalInvoice[];
  fiscalConfig: FiscalConfig;
  onOpenCarnePrint?: (carne: any) => void;
  onCancelSale: (saleId: string) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  invoices,
  fiscalConfig,
  onOpenCarnePrint,
  onCancelSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const filteredSales = sales.filter((s) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.code.toLowerCase().includes(term) ||
      (s.customerName && s.customerName.toLowerCase().includes(term)) ||
      (s.customerCpf && s.customerCpf.includes(term)) ||
      s.items.some((i) => i.productName.toLowerCase().includes(term) || i.barcode.includes(term))
    );
  });

  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalItemsSold = sales.reduce(
    (acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0),
    0
  );

  const handleCancel = (sale: Sale) => {
    if (
      window.confirm(
        `Deseja estornar/cancelar a venda #${sale.code}? Os itens serão devolvidos ao estoque automaticamente.`
      )
    ) {
      onCancelSale(sale.id);
    }
  };

  const getInvoiceForSale = (saleId: string) => {
    return invoices.find((inv) => inv.saleId === saleId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-indigo-600" />
            <span>Histórico de Vendas & Faturamento</span>
          </h2>
          <p className="text-xs text-slate-500">
            Consulte todas as operações de saída, comprovantes e estornos
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Faturamento Total Acumulado
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalRevenue)}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Vendas Realizadas
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{sales.length} vendas</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Peças Vendidas
          </div>
          <div className="text-xl font-black text-indigo-600 mt-1">{totalItemsSold} unidades</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código da venda, cliente, item..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">{filteredSales.length} registro(s)</div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 font-bold">Venda / Data</th>
              <th className="py-3 px-4 font-bold">Cliente</th>
              <th className="py-3 px-4 font-bold">Itens Vendidos</th>
              <th className="py-3 px-4 font-bold">Forma de Pagamento</th>
              <th className="py-3 px-4 font-bold text-center">NFC-e Fiscal</th>
              <th className="py-3 px-4 font-bold text-right">Total</th>
              <th className="py-3 px-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSales.map((sale) => {
              const inv = getInvoiceForSale(sale.id);

              return (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 font-mono">#{sale.code}</div>
                    <div className="text-[10px] text-slate-400">{formatDateTime(sale.date)}</div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800">
                      {sale.customerName || 'Consumidor Final'}
                    </div>
                    {sale.customerCpf && (
                      <div className="text-[10px] text-slate-400 font-mono">CPF: {sale.customerCpf}</div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-[11px] text-slate-700 font-medium">
                      {sale.items.length} produto(s) (
                      {sale.items.reduce((s, i) => s + i.quantity, 0)} un)
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-xs">
                      {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        sale.paymentMethod === 'carne'
                          ? 'bg-purple-100 text-purple-900'
                          : sale.paymentMethod === 'pix'
                          ? 'bg-teal-100 text-teal-900'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {sale.paymentMethod === 'carne'
                        ? `Carnê ${sale.paymentDetails.carneInstallmentsCount}x`
                        : sale.paymentMethod === 'pix'
                        ? 'PIX Instantâneo'
                        : sale.paymentMethod === 'cartao_credito'
                        ? 'Cartão de Crédito'
                        : sale.paymentMethod === 'cartao_debito'
                        ? 'Cartão de Débito'
                        : 'Dinheiro à Vista'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    {inv ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>NFC-e #{inv.number}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Não emitida</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="font-black text-sm text-slate-900">
                      {formatCurrency(sale.total)}
                    </div>
                    {sale.discount > 0 && (
                      <div className="text-[10px] text-emerald-600">
                        Desc: -{formatCurrency(sale.discount)}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        title="Reimprimir Comprovante / DANFE"
                        className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancel(sale)}
                        title="Estornar / Cancelar Venda"
                        className="p-1.5 rounded-lg bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
                      >
                        <Ban className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          isOpen={!!selectedSaleForReceipt}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
          invoice={getInvoiceForSale(selectedSaleForReceipt.id)}
          fiscalConfig={fiscalConfig}
          onOpenCarnePrint={onOpenCarnePrint}
        />
      )}
    </div>
  );
};
