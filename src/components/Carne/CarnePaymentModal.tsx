import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calculator, AlertCircle } from 'lucide-react';
import { Carne, CarneInstallment } from '../../types';
import { calculateInterest, formatCurrency, formatDate } from '../../utils/helpers';

interface CarnePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  carne: Carne;
  installment: CarneInstallment;
  onConfirmPayment: (
    carneId: string,
    installmentId: string,
    paidAmount: number,
    receiptNotes?: string
  ) => void;
}

export const CarnePaymentModal: React.FC<CarnePaymentModalProps> = ({
  isOpen,
  onClose,
  carne,
  installment,
  onConfirmPayment,
}) => {
  const interestCalc = calculateInterest(
    installment.amount,
    installment.dueDate,
    installment.fineRate,
    installment.interestRateDaily
  );

  const [includeInterest, setIncludeInterest] = useState(interestCalc.daysOverdue > 0);
  const [paidAmount, setPaidAmount] = useState<string>(
    (interestCalc.daysOverdue > 0 ? interestCalc.totalDue : installment.amount).toFixed(2)
  );
  const [notes, setNotes] = useState('Recebido no caixa em dinheiro / PIX');

  if (!isOpen) return null;

  const numPaid = parseFloat(paidAmount) || 0;

  const handleToggleInterest = (include: boolean) => {
    setIncludeInterest(include);
    if (include) {
      setPaidAmount(interestCalc.totalDue.toFixed(2));
    } else {
      setPaidAmount(installment.amount.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numPaid <= 0) {
      alert('Informe um valor de pagamento válido.');
      return;
    }

    onConfirmPayment(carne.id, installment.id, numPaid, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Baixa de Parcela do Carnê</h3>
              <p className="text-xs text-slate-400">
                Carnê {carne.carneCode} • Parcela {installment.installmentNumber} / {installment.totalInstallments}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Cliente:</span>
              <strong className="text-slate-800">{carne.customerName}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vencimento Original:</span>
              <strong className="text-slate-800">{formatDate(installment.dueDate)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Valor Original da Parcela:</span>
              <strong className="text-slate-900 font-bold">{formatCurrency(installment.amount)}</strong>
            </div>
          </div>

          {/* Overdue alert and fine calculations */}
          {interestCalc.daysOverdue > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center space-x-1.5 text-amber-800 font-bold">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <span>Parcela em atraso há {interestCalc.daysOverdue} dia(s)</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-amber-900 border-t border-amber-200/60 pt-2">
                <div>Multa (2%): {formatCurrency(interestCalc.fineAmount)}</div>
                <div>Juros diários: {formatCurrency(interestCalc.interestAmount)}</div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
                <span className="text-[11px] font-semibold text-amber-900">Cobrar com juros?</span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => handleToggleInterest(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      includeInterest
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-amber-300 text-amber-800'
                    }`}
                  >
                    Sim ({formatCurrency(interestCalc.totalDue)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleInterest(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      !includeInterest
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-amber-300 text-amber-800'
                    }`}
                  >
                    Dispensar Juros ({formatCurrency(installment.amount)})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Amount Paid input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Valor Efetivamente Recebido (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className="w-full text-xl font-black px-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observação / Comprovante
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirmar Baixa e Quitar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
