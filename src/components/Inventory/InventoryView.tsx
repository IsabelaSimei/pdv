import React, { useState } from 'react';
import {
  Package,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  AlertTriangle,
  Barcode as BarcodeIcon,
  Edit2,
  Trash2,
  Printer,
  History,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { Product, SegmentType, StockMovement } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { ProductModal } from './ProductModal';
import { StockMovementModal } from './StockMovementModal';
import { BarcodeLabelModal } from './BarcodeLabelModal';
import { BarcodeRenderer } from '../BarcodeRenderer';

interface InventoryViewProps {
  products: Product[];
  movements: StockMovement[];
  activeSegment: SegmentType;
  onAddProduct: (productData: any) => void;
  onUpdateProduct: (id: string, updates: any) => void;
  onDeleteProduct: (id: string) => void;
  onAdjustStock: (
    productId: string,
    delta: number,
    type: any,
    reason: string,
    referenceDoc?: string
  ) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  movements,
  activeSegment,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAdjustStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOnlyLowStock, setFilterOnlyLowStock] = useState(false);
  const [viewTab, setViewTab] = useState<'products' | 'movements'>('products');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedProductForLabel, setSelectedProductForLabel] = useState<Product | undefined>();

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (activeSegment !== 'geral' && p.segment !== activeSegment) return false;
    if (filterOnlyLowStock && p.currentStock > p.minStock) return false;
    if (!searchTerm.trim()) return true;

    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.barcode.includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term)) ||
      (p.size && p.size.toLowerCase().includes(term)) ||
      (p.fragranceFamily && p.fragranceFamily.toLowerCase().includes(term))
    );
  });

  // Calculate metrics
  const totalStockItems = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalCostValue = products.reduce((acc, p) => acc + p.currentStock * p.priceCost, 0);
  const totalSaleValue = products.reduce((acc, p) => acc + p.currentStock * p.priceSale, 0);
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setIsProductModalOpen(true);
  };

  const handleOpenLabels = (p: Product) => {
    setSelectedProductForLabel(p);
    setIsLabelModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja remover o produto "${name}" do cadastro de estoque?`)) {
      onDeleteProduct(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-4 sm:p-6 space-y-4">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <Package className="h-6 w-6 text-indigo-600" />
            <span>Controle Geral de Estoque</span>
          </h2>
          <p className="text-xs text-slate-500">
            Gerencie entradas, saídas, etiquetas de código de barras e saldo de produtos
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingProduct(undefined);
              setIsProductModalOpen(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Produto</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMovementModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
            <span>Entrada / Saída Avulsa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProductForLabel(undefined);
              setIsLabelModalOpen(true);
            }}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-600" />
            <span>Etiquetas com Código</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total de Peças em Estoque
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{totalStockItems} unidades</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Custo Total Imobilizado
          </div>
          <div className="text-xl font-black text-slate-700 mt-1">{formatCurrency(totalCostValue)}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Potencial de Venda
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalSaleValue)}</div>
        </div>

        <div
          onClick={() => setFilterOnlyLowStock((prev) => !prev)}
          className={`p-3.5 rounded-xl border shadow-sm transition cursor-pointer select-none ${
            lowStockCount > 0
              ? filterOnlyLowStock
                ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-400'
                : 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Estoque Baixo / Repor</span>
          </div>
          <div className="text-xl font-black mt-1">
            {lowStockCount} item(ns) {filterOnlyLowStock ? '(Filtrando)' : ''}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setViewTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewTab === 'products'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Package className="h-3.5 w-3.5" />
            <span>Produtos Cadastrados ({filteredProducts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('movements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
              viewTab === 'movements'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Histórico de Entradas & Saídas ({movements.length})</span>
          </button>
        </div>

        {viewTab === 'products' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar nome, código de barras..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-60"
              />
            </div>

            {filterOnlyLowStock && (
              <button
                type="button"
                onClick={() => setFilterOnlyLowStock(false)}
                className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-lg hover:bg-amber-200"
              >
                Limpar Filtro Alerta
              </button>
            )}
          </div>
        )}
      </div>

      {/* MAIN CONTENT AREA */}
      {viewTab === 'products' ? (
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-bold">Produto / Segmento</th>
                <th className="py-3 px-4 font-bold">Código de Barras</th>
                <th className="py-3 px-4 font-bold">Grade / Detalhes</th>
                <th className="py-3 px-4 font-bold text-right">Preço Venda</th>
                <th className="py-3 px-4 font-bold text-center">Saldo Atual</th>
                <th className="py-3 px-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((product) => {
                const isLow = product.currentStock <= product.minStock;
                const isZero = product.currentStock === 0;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            product.segment === 'infantil'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}
                        >
                          {product.segment === 'infantil' ? '🧸' : '🌸'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{product.name}</div>
                          <div className="text-[10px] text-slate-400">
                            {product.category} • SKU: {product.sku} • NCM: {product.ncm}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-700 font-bold">{product.barcode}</div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <BarcodeRenderer value={product.barcode} height={20} barWidth={1} showText={false} />
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-600">
                      {product.size && (
                        <div>
                          Tamanho: <strong className="text-slate-800">{product.size}</strong>
                          {product.color ? ` (${product.color})` : ''}
                        </div>
                      )}
                      {product.volumeMl && (
                        <div>
                          Volume: <strong className="text-slate-800">{product.volumeMl}ml</strong>
                          {product.concentration ? ` - ${product.concentration}` : ''}
                        </div>
                      )}
                      {product.batchNumber && (
                        <div className="text-[10px] text-slate-400">Lote: {product.batchNumber}</div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="font-bold text-slate-900">
                        {formatCurrency(product.priceSale)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Custo: {formatCurrency(product.priceCost)}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          isZero
                            ? 'bg-red-100 text-red-700 border border-red-300'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {product.currentStock} un
                      </span>
                      {isLow && (
                        <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                          Mín: {product.minStock} un
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenLabels(product)}
                          title="Imprimir Etiquetas deste produto"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Printer className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(product)}
                          title="Editar cadastro"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(product.id, product.name)}
                          title="Excluir"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Movements Audit Table */
        <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4 font-bold">Data / Hora</th>
                <th className="py-3 px-4 font-bold">Tipo de Movimentação</th>
                <th className="py-3 px-4 font-bold">Produto / Código</th>
                <th className="py-3 px-4 font-bold text-center">Quantidade</th>
                <th className="py-3 px-4 font-bold text-center">Saldo Anterior &gt; Novo</th>
                <th className="py-3 px-4 font-bold">Motivo / Documento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((mov) => {
                const isEntry = mov.type.startsWith('entrada');

                return (
                  <tr key={mov.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {formatDateTime(mov.date)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isEntry
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {isEntry ? (
                          <ArrowDownRight className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                        <span>
                          {mov.type === 'entrada_compra'
                            ? 'Entrada (Compra)'
                            : mov.type === 'saida_venda'
                            ? 'Saída (Venda PDV)'
                            : mov.type === 'saida_perda'
                            ? 'Saída (Perda / Avaria)'
                            : 'Ajuste de Estoque'}
                        </span>
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{mov.productName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{mov.barcode}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`font-black text-sm ${
                          isEntry ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isEntry ? `+${mov.quantity}` : `-${mov.quantity}`} un
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center text-[11px] text-slate-600 font-mono">
                      {mov.previousStock} un &rarr; <strong>{mov.newStock} un</strong>
                    </td>

                    <td className="py-3 px-4 text-slate-700">
                      <div>{mov.reason}</div>
                      {mov.referenceDoc && (
                        <div className="text-[10px] text-slate-400">Ref: {mov.referenceDoc}</div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(undefined);
        }}
        onSave={(data) => {
          if (editingProduct) {
            onUpdateProduct(editingProduct.id, data);
          } else {
            onAddProduct(data);
          }
        }}
        productToEdit={editingProduct}
        defaultSegment={activeSegment}
      />

      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        products={products}
        onConfirmMovement={onAdjustStock}
      />

      <BarcodeLabelModal
        isOpen={isLabelModalOpen}
        onClose={() => setIsLabelModalOpen(false)}
        product={selectedProductForLabel}
        allProducts={products}
      />
    </div>
  );
};
