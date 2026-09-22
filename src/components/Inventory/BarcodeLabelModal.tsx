import React, { useState } from 'react';
import { X, Printer, Barcode as BarcodeIcon } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { BarcodeRenderer } from '../BarcodeRenderer';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  allProducts: Product[];
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
  allProducts,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(
    product?.id || allProducts[0]?.id || ''
  );
  const [labelCopies, setLabelCopies] = useState<number>(8);

  if (!isOpen) return null;

  const currentProduct = allProducts.find((p) => p.id === selectedProductId) || product;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header - Not printed */}
        <div className="no-print flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <BarcodeIcon className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold">Impressão de Etiquetas de Código de Barras</h3>
              <p className="text-xs text-slate-400">
                Gere etiquetas adesivas prontas para colar nas roupas ou perfumes
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

        {/* Controls - Not printed */}
        <div className="no-print p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-slate-700">Produto:</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800"
            >
              {allProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.barcode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <label className="text-xs font-semibold text-slate-700">Cópias:</label>
              <input
                type="number"
                min="1"
                max="60"
                value={labelCopies}
                onChange={(e) => setLabelCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 text-xs font-bold text-center bg-white border border-slate-300 rounded-lg py-1 text-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir Folha</span>
            </button>
          </div>
        </div>

        {/* Labels Sheet Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-200 flex justify-center">
          <div className="printable-area bg-white p-6 rounded-xl shadow-md border border-slate-300 w-full max-w-xl min-h-[400px]">
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {currentProduct &&
                Array.from({ length: labelCopies }).map((_, index) => (
                  <div
                    key={index}
                    className="p-3 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-between text-center bg-white select-none"
                    style={{ minHeight: '140px' }}
                  >
                    <div className="w-full">
                      <div className="text-[11px] font-bold text-slate-900 leading-tight line-clamp-1">
                        {currentProduct.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        {currentProduct.size ? `Tam: ${currentProduct.size}` : ''}
                        {currentProduct.color ? ` • ${currentProduct.color}` : ''}
                        {currentProduct.volumeMl ? `${currentProduct.volumeMl}ml` : ''}
                      </div>
                    </div>

                    <div className="my-1">
                      <BarcodeRenderer
                        value={currentProduct.barcode}
                        height={36}
                        barWidth={1.5}
                      />
                    </div>

                    <div className="w-full flex items-center justify-between border-t border-slate-200 pt-1 text-[10px]">
                      <span className="font-semibold text-slate-500">{currentProduct.sku}</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatCurrency(currentProduct.priceSale)}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
