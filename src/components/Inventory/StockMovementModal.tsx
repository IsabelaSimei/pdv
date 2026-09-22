import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertTriangle } from 'lucide-react';
import { MovementType, Product } from '../../types';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onConfirmMovement: (
    productId: string,
    delta: number,
    type: MovementType,
    reason: string,
    referenceDoc?: string
  ) => void;
  preselectedProduct?: Product;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  products,
  onConfirmMovement,
  preselectedProduct,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(
    preselectedProduct?.id || products[0]?.id || ''
  );
  const [movementDirection, setMovementDirection] = useState<'entrada' | 'saida'>('entrada');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('Entrada de Mercadoria / Compra de Fornecedor');
  const [referenceDoc, setReferenceDoc] = useState('');

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const qtyNum = parseInt(quantity, 10) || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) {
      alert('Selecione um produto.');
      return;
    }
    if (qtyNum <= 0) {
      alert('A quantidade deve ser maior que zero.');
      return;
    }

    const type: MovementType =
      movementDirection === 'entrada' ? 'entrada_compra' : 'saida_ajuste';

    const delta = movementDirection === 'entrada' ? qtyNum : -qtyNum;

    if (movementDirection === 'saida' && currentProduct.currentStock < qtyNum) {
      if (
        !window.confirm(
          `Atenção: A quantidade informada (${qtyNum}) é maior que o estoque atual (${currentProduct.currentStock}). O saldo ficará zerado. Continuar?`
        )
      ) {
        return;
      }
    }

    onConfirmMovement(
      currentProduct.id,
      delta,
      type,
      reason.trim() || (movementDirection === 'entrada' ? 'Entrada Manual' : 'Saída Manual'),
      referenceDoc.trim() || undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            {movementDirection === 'entrada' ? (
              <ArrowDownRight className="h-5 w-5 text-emerald-400" />
            ) : (
              <ArrowUpRight className="h-5 w-5 text-rose-400" />
            )}
            <div>
              <h3 className="text-base font-bold">
                {movementDirection === 'entrada' ? 'Registrar Entrada de Estoque' : 'Registrar Saída Avulsa'}
              </h3>
              <p className="text-xs text-slate-400">
                Atualize o saldo de mercadorias com registro de histórico
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
          {/* Direction toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setMovementDirection('entrada');
                  setReason('Entrada de Mercadoria / Compra de Fornecedor');
                }}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  movementDirection === 'entrada'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-500/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="h-4 w-4 text-emerald-600" />
                <span className="text-xs">Entrada (Reposição)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMovementDirection('saida');
                  setReason('Saída por Avaria / Perda / Ajuste de Balanço');
                }}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  movementDirection === 'saida'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-2 ring-rose-500/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 text-rose-600" />
                <span className="text-xs">Saída (Avaria / Perda)</span>
              </button>
            </div>
          </div>

          {/* Product selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Produto *
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} • EAN: {p.barcode} (Saldo atual: {p.currentStock} un.)
                </option>
              ))}
            </select>
          </div>

          {currentProduct && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
              <div>
                <span className="text-slate-500">Saldo Atual:</span>{' '}
                <strong className="text-slate-900">{currentProduct.currentStock} un.</strong>
              </div>
              <div>
                <span className="text-slate-500">Novo Saldo Previsto:</span>{' '}
                <strong
                  className={
                    movementDirection === 'entrada' ? 'text-emerald-700' : 'text-rose-700'
                  }
                >
                  {movementDirection === 'entrada'
                    ? currentProduct.currentStock + qtyNum
                    : Math.max(0, currentProduct.currentStock - qtyNum)}{' '}
                  un.
                </strong>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Quantidade de Peças / Frascos *
            </label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full text-lg font-black px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Motivo / Observação
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Document Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nº do Documento de Origem (Opcional - Ex: NF de Compra 4520)
            </label>
            <input
              type="text"
              value={referenceDoc}
              onChange={(e) => setReferenceDoc(e.target.value)}
              placeholder="Ex: NF-e Fornecedor nº 8412"
              className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className={`px-6 py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 ${
                movementDirection === 'entrada'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              <Check className="h-4 w-4" />
              <span>Confirmar {movementDirection === 'entrada' ? 'Entrada' : 'Saída'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
