import React, { useState } from 'react';
import { X, FileSpreadsheet, Plus, Check } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface CarneGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onCreateCarne: (
    customerId: string,
    totalAmount: number,
    installmentsCount: number,
    firstDueDate: string,
    notes?: string
  ) => void;
}

export const CarneGeneratorModal: React.FC<CarneGeneratorModalProps> = ({
  isOpen,
  onClose,
  customers,
  onCreateCarne,
}) => {
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [totalAmount, setTotalAmount] = useState('300.00');
  const [installmentsCount, setInstallmentsCount] = useState(3);
  
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 30);
  const [firstDueDate, setFirstDueDate] = useState(
    defaultDueDate.toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState('Crediário direto / Compra na loja');

  if (!isOpen) return null;

  const total = parseFloat(totalAmount) || 0;
  const installmentValue = installmentsCount > 0 ? total / installmentsCount : 0;
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('Selecione um cliente.');
      return;
    }
    if (total <= 0) {
      alert('Informe um valor total válido.');
      return;
    }

    onCreateCarne(customerId, total, installmentsCount, firstDueDate, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-purple-950 text-white">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-base font-bold">Emitir Novo Carnê / Crediário</h3>
              <p className="text-xs text-purple-300">
                Gere um carnê parcelado para um cliente cadastrado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-purple-300 hover:bg-purple-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Cliente Titular do Carnê *
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} • CPF: {c.cpf} (Limite: {formatCurrency(c.creditLimit)})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Installments */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full text-base font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nº de Parcelas *
              </label>
              <select
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
                className="w-full text-xs font-bold px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-purple-950 focus:ring-2 focus:ring-purple-500"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n}x parcelas mensais
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Calculated parcel summary */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-xs flex justify-between items-center text-purple-900">
            <span>Valor de cada parcela:</span>
            <span className="text-base font-black">
              {installmentsCount}x de {formatCurrency(installmentValue)}
            </span>
          </div>

          {/* First Due Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Data de Vencimento da 1ª Parcela *
            </label>
            <input
              type="date"
              required
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-[10px] text-slate-400">
              As parcelas seguintes vencerão a cada 30 dias após esta data.
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição / Observação
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Check className="h-4 w-4" />
              <span>Gerar e Emitir Carnê</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
