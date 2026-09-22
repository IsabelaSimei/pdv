import React, { useState } from 'react';
import {
  X,
  Printer,
  CheckCircle2,
  FileText,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Share2,
} from 'lucide-react';
import { Carne, FiscalConfig, FiscalInvoice, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { BarcodeRenderer } from '../BarcodeRenderer';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
  invoice?: FiscalInvoice;
  carne?: Carne;
  fiscalConfig: FiscalConfig;
  onOpenCarnePrint?: (carne: Carne) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  invoice,
  carne,
  fiscalConfig,
  onOpenCarnePrint,
}) => {
  const [activeTab, setActiveTab] = useState<'danfe' | 'simplificado'>('danfe');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadXml = () => {
    if (!invoice?.xmlContent) return;
    const blob = new Blob([invoice.xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NFCe_${invoice.accessKey}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Not printed */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold">Venda Finalizada com Sucesso!</h2>
              <p className="text-xs text-slate-400">Cupom nº {sale.code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher - Not printed */}
        <div className="no-print px-6 pt-3 pb-1 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('danfe')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'danfe'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>DANFE NFC-e Fiscal</span>
            </button>
            <button
              onClick={() => setActiveTab('simplificado')}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'simplificado'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileText className="h-4 w-4 text-slate-400" />
              <span>Comprovante Caixa</span>
            </button>
          </div>

          {carne && (
            <button
              onClick={() => onOpenCarnePrint && onOpenCarnePrint(carne)}
              className="text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition flex items-center space-x-1"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Imprimir Carnê ({carne.installmentsCount}x)</span>
            </button>
          )}
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          <div className="printable-area w-full max-w-sm bg-white p-5 rounded-xl shadow-md border border-slate-300 font-mono text-xs text-slate-800 space-y-3">
            {/* Store Header */}
            <div className="text-center border-b border-dashed border-slate-300 pb-3">
              <div className="font-bold text-sm tracking-tight">{fiscalConfig.companyName}</div>
              <div className="text-[11px] text-slate-600">{fiscalConfig.tradeName}</div>
              <div className="text-[10px] text-slate-500">
                CNPJ: {fiscalConfig.cnpj} • IE: {fiscalConfig.stateRegistration}
              </div>
              <div className="text-[10px] text-slate-500">
                {fiscalConfig.address.street}, {fiscalConfig.address.number} - {fiscalConfig.address.neighborhood},{' '}
                {fiscalConfig.address.city}/{fiscalConfig.address.state}
              </div>
            </div>

            {/* Document Type Badge */}
            <div className="text-center font-bold text-xs py-1 border-b border-dashed border-slate-300">
              {activeTab === 'danfe' && invoice ? (
                <>
                  <div className="text-slate-900">DANFE NFC-e - Documento Auxiliar da Nota Fiscal de Consumidor Eletrônica</div>
                  <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                    Não permite aproveitamento de crédito de ICMS
                  </div>
                </>
              ) : (
                <div className="text-slate-700">DOCUMENTO NÃO-FISCAL • CONTROLE DE VENDA</div>
              )}
            </div>

            {/* Sale metadata */}
            <div className="text-[11px] space-y-0.5 border-b border-dashed border-slate-300 pb-2">
              <div className="flex justify-between">
                <span>Venda: #{sale.code}</span>
                <span>{formatDateTime(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Operador: {sale.sellerName || 'Caixa'}</span>
                <span>PDV: 01</span>
              </div>
              {sale.customerName && (
                <div className="text-[10px] text-slate-600 pt-0.5">
                  Cliente: {sale.customerName} {sale.customerCpf ? `(CPF: ${sale.customerCpf})` : ''}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="border-b border-dashed border-slate-300 pb-2">
              <div className="text-[10px] font-bold text-slate-500 flex justify-between pb-1 border-b border-slate-200">
                <span>ITEM / CÓD / DESCRIÇÃO</span>
                <span>TOTAL</span>
              </div>
              <div className="divide-y divide-slate-100 pt-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="py-1 text-[11px]">
                    <div className="font-semibold text-slate-900 truncate">
                      {String(idx + 1).padStart(2, '0')} {item.productName}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                        {item.size ? ` (Tam: ${item.size})` : ''}
                        {item.volumeMl ? ` (${item.volumeMl}ml)` : ''}
                      </span>
                      <span className="font-bold text-slate-800">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-b border-dashed border-slate-300 pb-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal Itens:</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(sale.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                <span>VALOR TOTAL:</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-b border-dashed border-slate-300 pb-2 text-[11px] space-y-0.5">
              <div className="flex justify-between font-bold">
                <span className="uppercase">FORMA: {sale.paymentMethod.replace('_', ' ')}</span>
                <span>{formatCurrency(sale.total)}</span>
              </div>
              {sale.paymentMethod === 'dinheiro' && sale.paymentDetails.change !== undefined && (
                <div className="flex justify-between text-slate-600 text-[10px]">
                  <span>Troco entregue:</span>
                  <span>{formatCurrency(sale.paymentDetails.change)}</span>
                </div>
              )}
              {sale.paymentMethod === 'carne' && carne && (
                <div className="text-[10px] text-purple-700 font-semibold pt-0.5">
                  Carnê gerado: {carne.installmentsCount} parcelas mensais de{' '}
                  {formatCurrency(carne.installments[0]?.amount || 0)}
                </div>
              )}
            </div>

            {/* Fiscal Footer (if NFC-e) */}
            {activeTab === 'danfe' && invoice ? (
              <div className="text-center space-y-2 pt-1 text-[10px]">
                <div className="text-slate-600 font-bold">EMISSÃO EM HOMOLOGAÇÃO / SEFAZ-SP</div>
                <div>
                  <div className="text-slate-500 font-medium">CHAVE DE ACESSO DE 44 DÍGITOS:</div>
                  <div className="font-mono text-[9px] font-bold tracking-tight text-slate-900 break-all select-all bg-slate-50 p-1 rounded border border-slate-200">
                    {invoice.accessKey}
                  </div>
                </div>

                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Protocolo: {invoice.protocol}</span>
                  <span>Série: {invoice.series} / Nº {invoice.number}</span>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-lg">
                  <div className="w-24 h-24 bg-slate-900 p-1.5 rounded flex items-center justify-center">
                    <div className="w-full h-full bg-white grid grid-cols-5 gap-0.5 p-1">
                      <div className="bg-slate-900 col-span-2 row-span-2" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900 col-span-2 row-span-2" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900" />
                      <div className="bg-slate-900 col-span-2 row-span-2" />
                      <div className="bg-slate-900" />
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1">Consulte via leitor de QR Code</span>
                </div>

                <div className="text-[9px] text-slate-500 border-t border-slate-200 pt-1">
                  Tributos Totais Incidentes (Lei Federal 12.741/2012):{' '}
                  {formatCurrency(invoice.tributosAproximados)}
                </div>
              </div>
            ) : (
              <div className="text-center pt-2">
                <BarcodeRenderer value={sale.code.replace(/\D/g, '').padStart(13, '789')} height={32} />
                <div className="text-[9px] text-slate-400 mt-1">Obrigado pela preferência e volte sempre!</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions - Not printed */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {invoice && (
              <button
                type="button"
                onClick={handleDownloadXml}
                className="text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center space-x-1.5 transition"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Baixar XML</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center space-x-1.5 transition shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Cupom</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white transition"
            >
              Nova Venda (Caixa Livre)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
