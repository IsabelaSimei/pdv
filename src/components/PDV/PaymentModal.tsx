import React, { useState } from 'react';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldCheck,
  Receipt,
  Copy,
  Check,
} from 'lucide-react';
import { Customer, PaymentMethod, SaleItem } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  total: number;
  items: SaleItem[];
  customer?: Customer;
  onSelectCustomer: (cust: Customer) => void;
  customersList: Customer[];
  onConfirmPayment: (data: {
    paymentMethod: PaymentMethod;
    paymentDetails: {
      amountReceived?: number;
      change?: number;
      cardBrand?: string;
      cardInstallments?: number;
      pixTransactionId?: string;
      carneInstallmentsCount?: number;
    };
    emitNfce: boolean;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
  customer,
  onSelectCustomer,
  customersList,
  onConfirmPayment,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('dinheiro');
  const [amountReceived, setAmountReceived] = useState<string>(total.toFixed(2));
  const [cardBrand, setCardBrand] = useState('Visa');
  const [cardInstallments, setCardInstallments] = useState(1);
  const [carneInstallmentsCount, setCarneInstallmentsCount] = useState(3);
  const [emitNfce, setEmitNfce] = useState(true);
  const [copiedPix, setCopiedPix] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const numReceived = parseFloat(amountReceived) || 0;
  const change = Math.max(0, numReceived - total);
  const isCashInsufficient = selectedMethod === 'dinheiro' && numReceived < total;

  const carneInstallmentValue = Math.round((total / carneInstallmentsCount) * 100) / 100;

  const simulatedPixCode = `00020126580014br.gov.bcb.pix011450209247000190520400005303986540${total.toFixed(2)}5802BR5925BABY LIZ METAMORFOSE6015SAO JOSE DA BEL62070503***6304ABCD`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(simulatedPixCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleSubmit = async () => {
    if (selectedMethod === 'carne' && !customer) {
      alert('Para gerar carnê ou vender no crediário, é obrigatório selecionar um cliente cadastrado!');
      return;
    }

    if (isCashInsufficient) {
      alert('O valor em dinheiro recebido é inferior ao total da venda!');
      return;
    }

    setIsProcessing(true);
    try {
      await onConfirmPayment({
        paymentMethod: selectedMethod,
        paymentDetails: {
          amountReceived: selectedMethod === 'dinheiro' ? numReceived : undefined,
          change: selectedMethod === 'dinheiro' ? change : undefined,
          cardBrand: selectedMethod.startsWith('cartao') ? cardBrand : undefined,
          cardInstallments: selectedMethod === 'cartao_credito' ? cardInstallments : 1,
          pixTransactionId: selectedMethod === 'pix' ? `PIX-${Date.now()}` : undefined,
          carneInstallmentsCount: selectedMethod === 'carne' ? carneInstallmentsCount : undefined,
        },
        emitNfce,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Receipt className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 className="text-lg font-bold">Fechamento de Venda</h2>
              <p className="text-xs text-slate-400">Selecione a forma de pagamento e emissão fiscal</p>
            </div>
          </div>
          <div className="text-right mr-3">
            <span className="text-xs text-slate-400">Total a Pagar:</span>
            <div className="text-2xl font-black text-emerald-400">{formatCurrency(total)}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Cliente Info / Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-lg border border-slate-200 text-indigo-600 shadow-sm">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Cliente Identificado:</div>
                <div className="text-sm font-bold text-slate-800">
                  {customer ? customer.name : 'Consumidor Final (Não identificado)'}
                </div>
                {customer && (
                  <div className="text-xs text-slate-500">
                    CPF: {customer.cpf} • Limite: {formatCurrency(customer.creditLimit)}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={customer?.id || ''}
                onChange={(e) => {
                  const found = customersList.find((c) => c.id === e.target.value);
                  if (found) onSelectCustomer(found);
                }}
                className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Trocar / Selecionar Cliente...</option>
                {customersList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.cpf})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMethod('dinheiro')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  selectedMethod === 'dinheiro'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 font-bold shadow-sm ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <Banknote className="h-5 w-5 text-emerald-600" />
                <span className="text-xs">Dinheiro</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('pix')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  selectedMethod === 'pix'
                    ? 'border-teal-500 bg-teal-50/80 text-teal-900 font-bold shadow-sm ring-2 ring-teal-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <QrCode className="h-5 w-5 text-teal-600" />
                <span className="text-xs">PIX Instantâneo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cartao_credito')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  selectedMethod === 'cartao_credito'
                    ? 'border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold shadow-sm ring-2 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <CreditCard className="h-5 w-5 text-indigo-600" />
                <span className="text-xs">Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('cartao_debito')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  selectedMethod === 'cartao_debito'
                    ? 'border-sky-500 bg-sky-50/80 text-sky-900 font-bold shadow-sm ring-2 ring-sky-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <CreditCard className="h-5 w-5 text-sky-600" />
                <span className="text-xs">Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('carne')}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                  selectedMethod === 'carne'
                    ? 'border-purple-600 bg-purple-50/80 text-purple-900 font-bold shadow-sm ring-2 ring-purple-600/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <FileSpreadsheet className="h-5 w-5 text-purple-600" />
                <span className="text-xs">Carnê / Crediário</span>
              </button>
            </div>
          </div>

          {/* Conditional Method Details */}
          {selectedMethod === 'dinheiro' && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Recebido em Dinheiro (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full text-lg font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="w-full sm:w-1/2 bg-white p-3 rounded-lg border border-emerald-200 text-right">
                  <span className="text-xs font-medium text-slate-500">Troco a Devolver:</span>
                  <div
                    className={`text-2xl font-black ${
                      isCashInsufficient ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {isCashInsufficient ? 'Valor insuficiente' : formatCurrency(change)}
                  </div>
                </div>
              </div>

              {/* Quick money shortcuts */}
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-slate-500">Atalhos rápidos:</span>
                {[total, Math.ceil(total / 10) * 10, 50, 100, 200].map((val, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAmountReceived(val.toFixed(2))}
                    className="text-xs font-bold bg-white hover:bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded border border-emerald-300 transition"
                  >
                    {formatCurrency(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedMethod === 'pix' && (
            <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl flex flex-col sm:flex-row items-center gap-4">
              <div className="p-3 bg-white border border-teal-200 rounded-xl shadow-sm flex flex-col items-center">
                {/* Visual dynamic simulated QR Code */}
                <div className="w-32 h-32 bg-slate-900 p-2 rounded-lg flex items-center justify-center">
                  <div className="w-full h-full border-4 border-white grid grid-cols-4 gap-1 p-1 bg-white">
                    <div className="bg-slate-900 col-span-2 row-span-2 rounded-sm" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900 col-span-2 row-span-2 rounded-sm" />
                    <div className="bg-slate-900" />
                    <div className="bg-slate-900" />
                  </div>
                </div>
                <span className="text-[10px] text-teal-800 font-semibold mt-1">PIX Banco Central</span>
              </div>

              <div className="flex-1 space-y-2">
                <div className="text-xs font-bold text-teal-900">
                  QR Code Dinâmico com Valor de {formatCurrency(total)}
                </div>
                <p className="text-xs text-slate-600">
                  Peça ao cliente para abrir o app do banco e escanear o QR Code acima, ou copie o código Copia e Cola.
                </p>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={simulatedPixCode}
                    className="flex-1 text-[11px] font-mono bg-white border border-teal-300 rounded-lg px-2.5 py-1.5 text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="flex items-center space-x-1 text-xs font-bold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition"
                  >
                    {copiedPix ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {(selectedMethod === 'cartao_credito' || selectedMethod === 'cartao_debito') && (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bandeira do Cartão
                  </label>
                  <select
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Elo">Elo</option>
                    <option value="Hipercard">Hipercard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>

                {selectedMethod === 'cartao_credito' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Parcelas na Maquininha
                    </label>
                    <select
                      value={cardInstallments}
                      onChange={(e) => setCardInstallments(Number(e.target.value))}
                      className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6, 10, 12].map((num) => (
                        <option key={num} value={num}>
                          {num}x de {formatCurrency(total / num)} {num === 1 ? '(À vista)' : '(Sem juros)'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedMethod === 'carne' && (
            <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-xl space-y-3">
              {!customer ? (
                <div className="flex items-center space-x-2 text-xs text-purple-900 bg-purple-100/70 p-3 rounded-lg border border-purple-300">
                  <AlertTriangle className="h-4 w-4 text-purple-700 flex-shrink-0" />
                  <span>
                    <strong>Atenção:</strong> É necessário selecionar um cliente cadastrado no topo para emitir o Carnê / Crediário da Loja.
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-purple-950 mb-1">
                        Número de Parcelas do Carnê
                      </label>
                      <select
                        value={carneInstallmentsCount}
                        onChange={(e) => setCarneInstallmentsCount(Number(e.target.value))}
                        className="w-full text-xs font-bold px-3 py-2 bg-white border border-purple-300 rounded-lg text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                          <option key={n} value={n}>
                            {n}x parcelas mensais
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-purple-200 flex flex-col justify-center">
                      <span className="text-[11px] font-medium text-slate-500">Valor de cada Parcela:</span>
                      <div className="text-xl font-black text-purple-900">
                        {carneInstallmentsCount}x de {formatCurrency(carneInstallmentValue)}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-purple-800 bg-white/80 p-2.5 rounded-lg border border-purple-200">
                    O carnê será gerado automaticamente com canhoto da loja, via do cliente e código para conferência. A primeira parcela vencerá em 30 dias.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Fiscal Invoice Toggle (NFC-e) */}
          <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold flex items-center space-x-1.5">
                  <span>Transmitir NFC-e (Cupom Fiscal) para SEFAZ</span>
                  <span className="text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded">
                    Homologação Ativa
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Gera Chave de Acesso de 44 dígitos, DANFE NFC-e e QR Code oficial
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={emitNfce}
                onChange={(e) => setEmitNfce(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Voltar ao Carrinho
          </button>

          <button
            type="button"
            disabled={isProcessing || isCashInsufficient || (selectedMethod === 'carne' && !customer)}
            onClick={handleSubmit}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
          >
            {isProcessing ? (
              <span>Processando e Emitindo...</span>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5" />
                <span>Confirmar e Finalizar Venda</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
