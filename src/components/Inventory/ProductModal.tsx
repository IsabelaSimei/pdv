import React, { useState } from 'react';
import { X, Barcode, Sparkles, Check, Package, FileText, Tag } from 'lucide-react';
import { Product, SegmentType } from '../../types';
import { generateRandomEan13 } from '../../utils/helpers';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  productToEdit?: Product;
  defaultSegment?: SegmentType;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSave,
  productToEdit,
  defaultSegment = 'infantil',
}) => {
  const [segment, setSegment] = useState<SegmentType>(
    productToEdit?.segment || (defaultSegment === 'geral' ? 'infantil' : defaultSegment)
  );
  const [name, setName] = useState(productToEdit?.name || '');
  const [barcode, setBarcode] = useState(productToEdit?.barcode || generateRandomEan13());
  const [sku, setSku] = useState(productToEdit?.sku || '');
  const [category, setCategory] = useState(productToEdit?.category || '');
  const [priceCost, setPriceCost] = useState(productToEdit?.priceCost?.toString() || '0');
  const [priceSale, setPriceSale] = useState(productToEdit?.priceSale?.toString() || '0');
  const [currentStock, setCurrentStock] = useState(productToEdit?.currentStock?.toString() || '10');
  const [minStock, setMinStock] = useState(productToEdit?.minStock?.toString() || '3');

  // Kids Clothing specifics
  const [size, setSize] = useState(productToEdit?.size || '4 Anos');
  const [color, setColor] = useState(productToEdit?.color || '');
  const [gender, setGender] = useState<'menina' | 'menino' | 'unissex' | 'bebe'>(
    productToEdit?.gender || 'unissex'
  );
  const [fabric, setFabric] = useState(productToEdit?.fabric || '');

  // Perfumery specifics
  const [volumeMl, setVolumeMl] = useState(productToEdit?.volumeMl?.toString() || '100');
  const [fragranceFamily, setFragranceFamily] = useState(productToEdit?.fragranceFamily || '');
  const [concentration, setConcentration] = useState(
    productToEdit?.concentration || 'Eau de Parfum (EDP)'
  );
  const [batchNumber, setBatchNumber] = useState(productToEdit?.batchNumber || '');
  const [expirationDate, setExpirationDate] = useState(productToEdit?.expirationDate || '');

  // Fiscal
  const [ncm, setNcm] = useState(
    productToEdit?.ncm || (segment === 'infantil' ? '6111.20.00' : '3303.00.10')
  );
  const [cfop, setCfop] = useState(productToEdit?.cfop || '5.102');
  const [csosn, setCsosn] = useState(productToEdit?.csosn || (segment === 'perfumaria' ? '500' : '102'));
  const [origin, setOrigin] = useState(productToEdit?.origin || '0');

  if (!isOpen) return null;

  const cost = parseFloat(priceCost) || 0;
  const sale = parseFloat(priceSale) || 0;
  const markupPercent = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;

  const handleGenerateBarcode = () => {
    setBarcode(generateRandomEan13());
  };

  const handleSegmentChange = (newSegment: SegmentType) => {
    setSegment(newSegment);
    if (!productToEdit) {
      if (newSegment === 'infantil') {
        setNcm('6111.20.00');
        setCsosn('102');
        if (!category) setCategory('Bebê / Primeiros Passos');
      } else {
        setNcm('3303.00.10');
        setCsosn('500');
        if (!category) setCategory('Perfumes Femininos');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor, informe o nome do produto.');
      return;
    }
    if (!barcode.trim()) {
      alert('Por favor, informe ou gere o código de barras.');
      return;
    }

    onSave({
      name: name.trim(),
      barcode: barcode.trim(),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
      segment,
      category: category.trim() || (segment === 'infantil' ? 'Moda Infantil' : 'Perfumaria'),
      priceCost: cost,
      priceSale: sale,
      currentStock: parseInt(currentStock, 10) || 0,
      minStock: parseInt(minStock, 10) || 1,
      unit: 'UN',
      size: segment === 'infantil' ? size : undefined,
      color: segment === 'infantil' ? color : undefined,
      gender: segment === 'infantil' ? gender : undefined,
      fabric: segment === 'infantil' ? fabric : undefined,
      volumeMl: segment === 'perfumaria' ? parseInt(volumeMl, 10) || undefined : undefined,
      fragranceFamily: segment === 'perfumaria' ? fragranceFamily : undefined,
      concentration: segment === 'perfumaria' ? concentration : undefined,
      batchNumber: segment === 'perfumaria' ? batchNumber : undefined,
      expirationDate: segment === 'perfumaria' ? expirationDate : undefined,
      ncm: ncm.trim() || '6111.20.00',
      cfop: cfop.trim() || '5.102',
      csosn: csosn.trim() || '102',
      origin,
      active: true,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold">
                {productToEdit ? 'Editar Produto' : 'Cadastrar Novo Produto no Estoque'}
              </h3>
              <p className="text-xs text-slate-400">
                Preencha os dados de identificação, grade e tributação
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Segment Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Segmento da Loja
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSegmentChange('infantil')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  segment === 'infantil'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-2 ring-amber-500/30'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">🧸</span>
                <div className="text-left">
                  <div className="text-xs">Moda Infantil</div>
                  <div className="text-[10px] text-slate-500 font-normal">Tamanhos, cores, tecidos</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSegmentChange('perfumaria')}
                className={`p-3 rounded-xl border flex items-center justify-center space-x-2 transition ${
                  segment === 'perfumaria'
                    ? 'border-pink-500 bg-pink-50 text-pink-900 font-bold ring-2 ring-pink-500/30'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">🌸</span>
                <div className="text-left">
                  <div className="text-xs">Perfumaria & Cosméticos</div>
                  <div className="text-[10px] text-slate-500 font-normal">Volume (ml), fragrância, lote</div>
                </div>
              </button>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome do Produto / Descrição *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  segment === 'infantil'
                    ? 'Ex: Conjunto Body Manga Longa Bebê Suedine'
                    : 'Ex: Perfume Eau de Parfum Essence 100ml'
                }
                className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Código de Barras (EAN-13 / Scanner) *
                </label>
                <div className="flex space-x-1.5">
                  <input
                    type="text"
                    required
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="789..."
                    className="flex-1 text-xs font-mono font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-slate-700 flex items-center space-x-1"
                    title="Gerar código aleatório válido"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Gerar</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoria / Grupo
                </label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder={
                    segment === 'infantil'
                      ? 'Ex: Vestidos, Bebê, Conjuntos'
                      : 'Ex: Perfumes Femininos, Hidratantes'
                  }
                  className="w-full text-xs font-medium px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Segment-Specific Fields */}
          {segment === 'infantil' && (
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <Tag className="h-4 w-4 text-amber-700" />
                <span>Grade e Características de Moda Infantil</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tamanho / Faixa Etária
                  </label>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    {['RN', 'P', 'M', 'G', 'GG', '1 Ano', '2 Anos', '3 Anos', '4 Anos', '6 Anos', '8 Anos', '10 Anos', '12 Anos', '14 Anos', '16 Anos'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Gênero
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="unissex">Unissex</option>
                    <option value="menina">Menina</option>
                    <option value="menino">Menino</option>
                    <option value="bebe">Bebê</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cor / Estampa
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ex: Azul Celeste"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tecido / Composição
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="Ex: 100% Algodão"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {segment === 'perfumaria' && (
            <div className="p-4 bg-pink-50/60 border border-pink-200 rounded-xl space-y-3">
              <div className="text-xs font-bold text-pink-900 flex items-center space-x-1.5">
                <Tag className="h-4 w-4 text-pink-700" />
                <span>Especificações de Perfumaria & Cosméticos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Volume em Mililitros (ml)
                  </label>
                  <input
                    type="number"
                    value={volumeMl}
                    onChange={(e) => setVolumeMl(e.target.value)}
                    placeholder="Ex: 100"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Concentração
                  </label>
                  <select
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  >
                    <option value="Eau de Parfum (EDP)">Eau de Parfum (EDP)</option>
                    <option value="Eau de Toilette (EDT)">Eau de Toilette (EDT)</option>
                    <option value="Deo Colônia">Deo Colônia</option>
                    <option value="Body Splash">Body Splash</option>
                    <option value="Loção Hidratante">Loção Hidratante</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Família Olfativa
                  </label>
                  <input
                    type="text"
                    value={fragranceFamily}
                    onChange={(e) => setFragranceFamily(e.target.value)}
                    placeholder="Ex: Floral Amadeirado"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Lote de Fabricação
                  </label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="Ex: LT-2026A"
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing & Stock */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço de Custo (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={priceCost}
                onChange={(e) => setPriceCost(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preço de Venda (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={priceSale}
                onChange={(e) => setPriceSale(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-emerald-700 focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-500">Margem: {markupPercent}%</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Atual (Un.) *
              </label>
              <input
                type="number"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estoque Mínimo (Alerta)
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-lg text-amber-700 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Fiscal Data */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
            <div className="text-xs font-bold flex items-center space-x-1.5 text-indigo-300">
              <FileText className="h-4 w-4" />
              <span>Dados Fiscais para Emissão de Nota Fiscal (NFC-e / NF-e)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] text-slate-300 mb-1">NCM (Classificação Fiscal)</label>
                <input
                  type="text"
                  value={ncm}
                  onChange={(e) => setNcm(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">CFOP Venda</label>
                <input
                  type="text"
                  value={cfop}
                  onChange={(e) => setCfop(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">CSOSN (Simples)</label>
                <input
                  type="text"
                  value={csosn}
                  onChange={(e) => setCsosn(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">Origem da Mercadoria</label>
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full text-xs bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="0">0 - Nacional</option>
                  <option value="1">1 - Estrangeira (Importação)</option>
                  <option value="2">2 - Estrangeira (Merc. Interno)</option>
                </select>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
          >
            <Check className="h-4 w-4" />
            <span>{productToEdit ? 'Atualizar Produto' : 'Salvar no Estoque'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
