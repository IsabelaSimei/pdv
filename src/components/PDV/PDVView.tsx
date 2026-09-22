import React, { useEffect, useRef, useState } from 'react';
import {
  Barcode,
  Camera,
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  ShoppingBag,
  Sparkles,
  CreditCard,
  AlertCircle,
  Tag,
  X,
  Package,
} from 'lucide-react';
import { Customer, FiscalConfig, FiscalInvoice, PaymentMethod, Product, Sale, SaleItem } from '../../types';
import { formatCurrency, playBeep } from '../../utils/helpers';
import { StorageService } from '../../services/storage';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

interface PDVViewProps {
  products: Product[];
  customers: Customer[];
  fiscalConfig: FiscalConfig;
  activeSegment: 'infantil' | 'perfumaria' | 'geral';
  onRefreshData: () => void;
  onOpenCarnePrint: (carne: any) => void;
}

export const PDVView: React.FC<PDVViewProps> = ({
  products,
  customers,
  fiscalConfig,
  activeSegment,
  onRefreshData,
  onOpenCarnePrint,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | undefined>();
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [lastInvoice, setLastInvoice] = useState<FiscalInvoice | undefined>();
  const [lastCarne, setLastCarne] = useState<any | undefined>();
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Auto focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const showFeedback = (text: string, type: 'success' | 'error') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleAddProductToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.currentStock <= 0) {
      playBeep('error');
      showFeedback(`"${product.name}" está sem estoque no momento!`, 'error');
      return;
    }

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);
      if (existingIndex > -1) {
        const currentQty = prevCart[existingIndex].quantity;
        const newQty = currentQty + quantityToAdd;

        if (newQty > product.currentStock) {
          playBeep('error');
          showFeedback(`Estoque insuficiente! Disponível: ${product.currentStock} unidades.`, 'error');
          return prevCart;
        }

        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newQty,
          total: Math.round(newQty * updated[existingIndex].unitPrice * 100) / 100,
        };
        playBeep('success');
        showFeedback(`+1 "${product.name}" adicionado`, 'success');
        return updated;
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unitPrice: product.priceSale,
          costPrice: product.priceCost,
          quantity: quantityToAdd,
          discount: 0,
          total: Math.round(product.priceSale * quantityToAdd * 100) / 100,
          ncm: product.ncm,
          cfop: product.cfop,
          size: product.size,
          color: product.color,
          volumeMl: product.volumeMl,
        };
        playBeep('success');
        showFeedback(`"${product.name}" adicionado ao carrinho`, 'success');
        return [newItem, ...prevCart];
      }
    });
  };

  // Barcode input submit (works with both hand scanner guns and manual typing)
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = barcodeInput.trim();
    if (!clean) return;

    const found = StorageService.getProductByBarcode(clean);
    if (found) {
      handleAddProductToCart(found);
      setBarcodeInput('');
    } else {
      playBeep('error');
      showFeedback(`Código "${clean}" não encontrado no cadastro de estoque!`, 'error');
    }
    barcodeInputRef.current?.focus();
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.productId === productId) {
            const product = products.find((p) => p.id === productId);
            const maxStock = product?.currentStock || 999;
            const newQty = item.quantity + delta;

            if (newQty <= 0) return null;
            if (newQty > maxStock) {
              playBeep('error');
              showFeedback(`Limite de estoque atingido (${maxStock} un.)`, 'error');
              return item;
            }

            return {
              ...item,
              quantity: newQty,
              total: Math.round(newQty * item.unitPrice * 100) / 100,
            };
          }
          return item;
        })
        .filter(Boolean) as SaleItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (window.confirm('Tem certeza que deseja cancelar e esvaziar este carrinho?')) {
      setCart([]);
      setSelectedCustomer(undefined);
      setDiscountPercent(0);
      barcodeInputRef.current?.focus();
    }
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const discountVal = Math.round((subtotal * (discountPercent / 100)) * 100) / 100;
  const total = Math.max(0, subtotal - discountVal);

  // Filter products for quick selection
  const filteredProducts = products.filter((p) => {
    if (!p.active) return false;
    if (activeSegment !== 'geral' && p.segment !== activeSegment) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.barcode.includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.category && p.category.toLowerCase().includes(term))
    );
  });

  // Finish sale handler
  const handleConfirmSale = async (data: {
    paymentMethod: PaymentMethod;
    paymentDetails: any;
    emitNfce: boolean;
  }) => {
    try {
      const result = await StorageService.completeSale({
        items: cart,
        subtotal,
        discount: discountVal,
        total,
        paymentMethod: data.paymentMethod,
        paymentDetails: data.paymentDetails,
        customer: selectedCustomer,
      });

      playBeep('cash');
      setLastCompletedSale(result.sale);
      setLastInvoice(result.invoice);
      setLastCarne(result.carne);
      setIsPaymentOpen(false);
      setCart([]);
      setSelectedCustomer(undefined);
      setDiscountPercent(0);
      onRefreshData();
    } catch (err: any) {
      alert(`Erro ao processar venda: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-100">
      {/* LEFT SECTION: Barcode scanning & Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-slate-200 bg-white">
        {/* Top Scanner Gun Header */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <form onSubmit={handleBarcodeSubmit} className="flex-1 relative flex items-center">
            <div className="absolute left-3.5 text-indigo-400">
              <Barcode className="h-5 w-5" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Passe o leitor de código de barras ou digite o EAN..."
              className="w-full pl-11 pr-24 py-2.5 bg-slate-800 text-white placeholder-slate-400 text-sm font-mono font-medium rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition"
            >
              Adicionar
            </button>
          </form>

          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <Camera className="h-4 w-4" />
            <span>Leitor por Câmera</span>
          </button>
        </div>

        {/* Feedback alert toast */}
        {feedbackMessage && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between transition-all ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span>{feedbackMessage.text}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)}>
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome, fragrância, tamanho ou categoria..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium whitespace-nowrap">
            {filteredProducts.length} produto(s)
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isLowStock = product.currentStock <= product.minStock;
              const isOut = product.currentStock === 0;

              return (
                <div
                  key={product.id}
                  onClick={() => handleAddProductToCart(product)}
                  className={`group relative p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between select-none ${
                    isOut
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          product.segment === 'infantil'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}
                      >
                        {product.segment === 'infantil' ? '🧸 Infantil' : '🌸 Perfumaria'}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isOut
                            ? 'bg-red-100 text-red-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700 animate-pulse'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {isOut
                          ? 'Esgotado'
                          : `${product.currentStock} un ${isLowStock ? '(Baixo!)' : ''}`}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-2 leading-tight">
                      {product.name}
                    </h4>

                    {/* Meta info depending on segment */}
                    <div className="mt-1 text-[11px] text-slate-500 space-y-0.5">
                      {product.size && (
                        <div>
                          Tamanho: <span className="font-semibold text-slate-700">{product.size}</span>
                        </div>
                      )}
                      {product.volumeMl && (
                        <div>
                          Volume: <span className="font-semibold text-slate-700">{product.volumeMl}ml</span>
                          {product.concentration ? ` • ${product.concentration}` : ''}
                        </div>
                      )}
                      <div className="font-mono text-[10px] text-slate-400">
                        EAN: {product.barcode}
                      </div>
                    </div>
                  </div>

                  {/* Price & Add */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(product.priceSale)}
                    </span>
                    <button
                      type="button"
                      disabled={isOut}
                      className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: Cart / Caixa Lateral */}
      <div className="w-full lg:w-96 xl:w-[420px] flex flex-col h-full bg-white shadow-xl flex-shrink-0">
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">Frente de Caixa (PDV)</h3>
              <p className="text-[11px] text-slate-400">{cart.length} item(ns) no carrinho</p>
            </div>
          </div>
          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              title="Cancelar Venda"
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* Customer Selector Ribbon */}
        <div className="p-3 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <User className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-indigo-900 font-bold uppercase tracking-wider">
                Cliente na Venda
              </div>
              <div className="text-xs font-semibold text-slate-800 truncate">
                {selectedCustomer ? selectedCustomer.name : 'Consumidor Final (Balcão)'}
              </div>
            </div>
          </div>

          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const found = customers.find((c) => c.id === e.target.value);
              setSelectedCustomer(found);
            }}
            className="text-[11px] bg-white border border-indigo-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[130px]"
          >
            <option value="">Consumidor...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.split(' ')[0]} ({c.cpf.slice(0, 7)}...)
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="h-12 w-12 mb-2 stroke-1 text-slate-300" />
              <div className="text-sm font-bold text-slate-600">Carrinho Vazio</div>
              <p className="text-xs text-slate-400 mt-1">
                Passe o leitor de código de barras ou clique nos produtos ao lado para iniciar a venda.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.productId}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex-1 min-w-0 pr-1">
                  <div className="font-bold text-slate-800 truncate">{item.productName}</div>
                  <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                    <span>{formatCurrency(item.unitPrice)} un.</span>
                    {item.size && <span className="bg-slate-200 px-1 rounded text-[10px]">Tam: {item.size}</span>}
                    {item.volumeMl && <span className="bg-slate-200 px-1 rounded text-[10px]">{item.volumeMl}ml</span>}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.productId, -1)}
                    className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-slate-800">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.productId, 1)}
                    className="p-1 rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 transition"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Subtotal & Delete */}
                <div className="text-right pl-2">
                  <div className="font-bold text-slate-900">{formatCurrency(item.total)}</div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.productId)}
                    className="text-slate-400 hover:text-red-500 transition text-[10px]"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout Panel */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>

            {/* Discount selector */}
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center space-x-1">
                <Tag className="h-3.5 w-3.5 text-slate-400" />
                <span>Desconto (%):</span>
              </span>
              <div className="flex items-center space-x-1">
                {[0, 5, 10].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setDiscountPercent(pct)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition ${
                      discountPercent === pct
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Desconto aplicado:</span>
                <span>- {formatCurrency(discountVal)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-800">TOTAL:</span>
              <span className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <CreditCard className="h-5 w-5" />
            <span>Pagar / Fechar Venda (F4)</span>
          </button>
        </div>
      </div>

      {/* MODALS */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(code) => {
          setBarcodeInput(code);
          const found = StorageService.getProductByBarcode(code);
          if (found) {
            handleAddProductToCart(found);
            setBarcodeInput('');
          } else {
            playBeep('error');
            showFeedback(`Código lido "${code}" não encontrado no cadastro!`, 'error');
          }
        }}
        availableProducts={products}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        subtotal={subtotal}
        discount={discountVal}
        total={total}
        items={cart}
        customer={selectedCustomer}
        onSelectCustomer={(cust) => setSelectedCustomer(cust)}
        customersList={customers}
        onConfirmPayment={handleConfirmSale}
      />

      {lastCompletedSale && (
        <ReceiptModal
          isOpen={!!lastCompletedSale}
          onClose={() => setLastCompletedSale(null)}
          sale={lastCompletedSale}
          invoice={lastInvoice}
          carne={lastCarne}
          fiscalConfig={fiscalConfig}
          onOpenCarnePrint={onOpenCarnePrint}
        />
      )}
    </div>
  );
};
