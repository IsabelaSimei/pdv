import React from 'react';
import { X, Printer, FileSpreadsheet, Check } from 'lucide-react';
import { Carne, FiscalConfig } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface CarnePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  carne: Carne;
  fiscalConfig: FiscalConfig;
}

export const CarnePrintModal: React.FC<CarnePrintModalProps> = ({
  isOpen,
  onClose,
  carne,
  fiscalConfig,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Not printed */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-purple-950 text-white">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold">Carnê de Pagamento / Crediário da Loja</h3>
              <p className="text-xs text-purple-300">
                Carnê nº {carne.carneCode} • Cliente: {carne.customerName} ({carne.installmentsCount} parcelas)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Carnê</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-purple-300 hover:bg-purple-900 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Carnê Slips Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-200 flex justify-center">
          <div className="printable-area w-full max-w-3xl bg-white p-6 rounded-xl shadow-lg border border-slate-300 space-y-6 text-slate-800">
            {/* Store Banner */}
            <div className="border-b-2 border-slate-800 pb-3 flex justify-between items-end">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900">
                  {fiscalConfig.companyName}
                </h1>
                <div className="text-xs text-slate-600 font-semibold">{fiscalConfig.tradeName}</div>
                <div className="text-[11px] text-slate-500">
                  CNPJ: {fiscalConfig.cnpj} • IE: {fiscalConfig.stateRegistration}
                </div>
                <div className="text-[11px] text-slate-500">
                  {fiscalConfig.address.street}, {fiscalConfig.address.number} - {fiscalConfig.address.neighborhood} - {fiscalConfig.address.city}/{fiscalConfig.address.state}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded">
                  Crediário Próprio
                </span>
                <div className="text-sm font-black font-mono mt-1 text-slate-900">{carne.carneCode}</div>
                <div className="text-xs text-slate-500">Venda: #{carne.saleCode}</div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 font-medium">Nome do Cliente:</span>
                <div className="font-bold text-slate-900">{carne.customerName}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">CPF:</span>
                <div className="font-bold text-slate-900">{carne.customerCpf}</div>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Telefone / WhatsApp:</span>
                <div className="font-bold text-slate-900">{carne.customerPhone}</div>
              </div>
            </div>

            {/* Installments Slips (Lâminas do Carnê) */}
            <div className="space-y-4">
              {carne.installments.map((inst) => {
                const isPaid = inst.status === 'paga';

                return (
                  <div
                    key={inst.id}
                    className="border-2 border-dashed border-slate-400 rounded-xl overflow-hidden bg-white flex flex-col sm:flex-row relative"
                  >
                    {/* Paid Watermark if already paid */}
                    {isPaid && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div className="rotate-[-12deg] border-4 border-emerald-600 text-emerald-700 font-black text-2xl uppercase px-6 py-2 rounded-xl bg-white/85 shadow-lg flex items-center space-x-2">
                          <Check className="h-6 w-6 stroke-[3]" />
                          <span>PAGO EM {formatDate(inst.paidDate || '')}</span>
                        </div>
                      </div>
                    )}

                    {/* CANHOTO DA LOJA (Caixa) */}
                    <div className="w-full sm:w-1/3 bg-slate-50 p-4 border-b sm:border-b-0 sm:border-r-2 border-dashed border-slate-400 text-xs flex flex-col justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Canhoto da Loja
                        </div>
                        <div className="font-black text-sm text-slate-900">{carne.carneCode}</div>
                        <div className="text-xs text-slate-600 font-semibold mt-0.5">
                          Parcela: {inst.installmentNumber} / {inst.totalInstallments}
                        </div>

                        <div className="mt-3 space-y-1 text-[11px]">
                          <div>
                            <span className="text-slate-500">Vencimento:</span>{' '}
                            <strong className="text-slate-900">{formatDate(inst.dueDate)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Valor:</span>{' '}
                            <strong className="text-slate-900 text-sm">{formatCurrency(inst.amount)}</strong>
                          </div>
                          <div className="text-[10px] text-slate-600 truncate mt-1">
                            {carne.customerName}
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-300 text-center">
                        <div className="border-b border-slate-400 w-3/4 mx-auto mb-1"></div>
                        <span className="text-[9px] text-slate-400">Visto do Operador de Caixa</span>
                      </div>
                    </div>

                    {/* VIA DO CLIENTE */}
                    <div className="w-full sm:w-2/3 p-4 text-xs flex flex-col justify-between space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-black text-sm text-slate-900">{fiscalConfig.tradeName}</div>
                          <div className="text-[10px] text-slate-500">Documento de Cobrança / Crediário</div>
                          <div className="text-[11px] text-slate-700 font-semibold mt-1">
                            Cliente: {carne.customerName} • CPF: {carne.customerCpf}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Parcela {inst.installmentNumber} de {inst.totalInstallments}
                          </span>
                          <div className="mt-1">
                            <span className="text-[10px] text-slate-500">Vencimento:</span>
                            <div className="text-sm font-black text-purple-900">
                              {formatDate(inst.dueDate)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Instructions & Fine Details */}
                      <div className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] text-slate-600 space-y-0.5">
                        <div className="font-semibold text-slate-800">INSTRUÇÕES DE PAGAMENTO:</div>
                        <div>• Pagar preferencialmente na loja ou via chave PIX CNPJ: {fiscalConfig.cnpj}</div>
                        <div>• Após o vencimento, cobrar multa de 2% + juros de mora diários de 0,033%.</div>
                        <div>• O não pagamento poderá acarretar inclusão nos órgãos de proteção ao crédito.</div>
                      </div>

                      {/* Crediário Identification & Total */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-[11px] text-slate-800">
                            Nº Parcela: {carne.carneCode}-{inst.installmentNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Pagamento no balcão da loja ou via PIX (CNPJ)
                          </span>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-[10px] text-slate-500">Valor do Documento:</span>
                          <div className="text-lg font-black text-slate-900">
                            {formatCurrency(inst.amount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Carnê Signature Footer */}
            <div className="border-t border-slate-300 pt-4 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                Reconheço a exatidão da dívida decorrente de compra de mercadorias acima descritas e me
                comprometo a liquidá-la nas datas aprazadas.
              </div>
              <div className="text-center min-w-[200px]">
                <div className="border-b border-slate-400 w-full mb-1"></div>
                <span>Assinatura do Comprador(a)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
