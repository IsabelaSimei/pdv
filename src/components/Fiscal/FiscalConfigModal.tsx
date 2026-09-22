import React, { useState, useRef } from 'react';
import {
  X,
  ShieldCheck,
  Check,
  Server,
  Building,
  Key,
  Database,
  Download,
  Upload,
  HardDrive,
  Package,
  Users,
  ShoppingBag,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';
import { BackupData, FiscalConfig, ImportResult } from '../../types';
import { StorageService } from '../../services/storage';
import { formatDateTime } from '../../utils/helpers';

interface FiscalConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: FiscalConfig;
  onSaveConfig: (config: FiscalConfig) => void;
  onRefreshData?: () => void;
  initialTab?: 'fiscal' | 'backup';
}

export const FiscalConfigModal: React.FC<FiscalConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRefreshData,
  initialTab = 'fiscal',
}) => {
  const [activeTab, setActiveTab] = useState<'fiscal' | 'backup'>(initialTab);
  const [formData, setFormData] = useState<FiscalConfig>({ ...config });

  // Backup state
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentBackup = StorageService.exportBackupData();
  const currentStats = currentBackup.stats || {
    productsCount: currentBackup.products?.length || 0,
    customersCount: currentBackup.customers?.length || 0,
    salesCount: currentBackup.sales?.length || 0,
    carnesCount: currentBackup.carnes?.length || 0,
    invoicesCount: currentBackup.fiscalInvoices?.length || 0,
    movementsCount: currentBackup.movements?.length || 0,
  };

  const handleDownload = () => {
    try {
      const result = StorageService.downloadBackupFile();
      setDownloadSuccess(`Backup baixado: ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (e: any) {
      alert(`Falha ao gerar download: ${e.message}`);
    }
  };

  const handleFileProcess = (file: File) => {
    setValidationError(null);
    setImportResult(null);

    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setValidationError('Por favor, selecione um arquivo de backup no formato .JSON válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setSelectedFileContent(content);

      const validation = StorageService.validateBackup(content);
      if (validation.valid && validation.data) {
        setPreviewData(validation.data);
      } else {
        setPreviewData(null);
        setValidationError(validation.error || 'Arquivo de backup inválido.');
      }
    };
    reader.onerror = () => {
      setValidationError('Erro ao ler o arquivo selecionado.');
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyRestore = () => {
    if (!selectedFileContent) return;

    if (
      !window.confirm(
        'ATENÇÃO: A importação substituirá os dados atuais do sistema pelos dados do arquivo selecionado. Deseja prosseguir com a restauração?'
      )
    ) {
      return;
    }

    setImporting(true);
    setTimeout(() => {
      const result = StorageService.importBackup(selectedFileContent);
      setImporting(false);
      setImportResult(result);

      if (result.success && onRefreshData) {
        onRefreshData();
      }
    }, 400);
  };

  const handleClearSelected = () => {
    setSelectedFileContent(null);
    setPreviewData(null);
    setValidationError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Configurações &amp; Banco de Dados</h3>
              <p className="text-xs text-slate-400">
                Parâmetros fiscais SEFAZ e backup completo de dados locais
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('fiscal')}
            className={`px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'fiscal'
                ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Emissor Fiscal (SEFAZ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 text-xs font-bold transition flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'backup'
                ? 'border-indigo-600 text-indigo-700 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="h-4 w-4 text-indigo-600" />
            <span>Importar / Exportar Banco de Dados</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
              JSON
            </span>
          </button>
        </div>

        {/* Tab 1: Fiscal Form */}
        {activeTab === 'fiscal' ? (
          <>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Environment & Auto-Emission */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Ambiente de Transmissão SEFAZ
                  </label>
                  <div className="text-[11px] text-slate-500">
                    Homologação para testes ou Produção com validade jurídica
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData({ ...formData, environment: e.target.value as any })
                    }
                    className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800"
                  >
                    <option value="homologacao">Homologação (Testes)</option>
                    <option value="producao">Produção (Oficial)</option>
                  </select>
                </div>
              </div>

              {/* Company Details */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Building className="h-4 w-4 text-indigo-600" />
                  <span>Dados do Contribuinte (Emitente)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Razão Social
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={formData.tradeName}
                      onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      CNPJ
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Inscrição Estadual (IE)
                    </label>
                    <input
                      type="text"
                      value={formData.stateRegistration}
                      onChange={(e) =>
                        setFormData({ ...formData, stateRegistration: e.target.value })
                      }
                      className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Regime Tributário (CRT)
                    </label>
                    <select
                      value={formData.crt}
                      onChange={(e) =>
                        setFormData({ ...formData, crt: e.target.value as '1' | '3' })
                      }
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    >
                      <option value="1">1 - Simples Nacional (MEI/ME)</option>
                      <option value="3">3 - Regime Normal</option>
                    </select>
                  </div>
                </div>

                {/* Address info */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-slate-500">Logradouro e Número</label>
                    <div className="text-xs font-semibold text-slate-800">
                      {formData.address.street}, {formData.address.number}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Município/UF</label>
                    <div className="text-xs font-semibold text-slate-800">
                      {formData.address.city}/{formData.address.state}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">CEP</label>
                    <div className="text-xs font-mono text-slate-800">
                      {formData.address.zipCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security CSC */}
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
                  <Key className="h-4 w-4" />
                  <span>Código de Segurança do Contribuinte (CSC / Token QR-Code)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-300 mb-1">ID do CSC</label>
                    <input
                      type="text"
                      value={formData.cscId}
                      onChange={(e) => setFormData({ ...formData, cscId: e.target.value })}
                      placeholder="000001"
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-300 mb-1">Código CSC Alfanumérico</label>
                    <input
                      type="text"
                      value={formData.cscToken}
                      onChange={(e) => setFormData({ ...formData, cscToken: e.target.value })}
                      placeholder="A8B9C0D1E2F3..."
                      className="w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* API Provider Integration */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provedor / Conexão Fiscal
                </label>
                <select
                  value={formData.apiProvider}
                  onChange={(e) =>
                    setFormData({ ...formData, apiProvider: e.target.value as any })
                  }
                  className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-800 font-medium"
                >
                  <option value="sefaz_simulada">Emissão Direta SEFAZ (Conexão Homologação)</option>
                  <option value="focus_nfe">Focus NFe API Rest</option>
                  <option value="plugnotas">PlugNotas / TecnoSpeed</option>
                  <option value="webmaniabr">WebmaniaBR NFe</option>
                </select>
              </div>

              {/* Auto Emission Checkbox */}
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="autoEmit"
                  checked={formData.autoEmitNfce}
                  onChange={(e) => setFormData({ ...formData, autoEmitNfce: e.target.checked })}
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="autoEmit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Emitir NFC-e automaticamente ao concluir cada venda no PDV
                </label>
              </div>
            </form>

            {/* Footer Fiscal */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="h-4 w-4" />
                <span>Salvar Configurações Fiscais</span>
              </button>
            </div>
          </>
        ) : (
          /* Tab 2: Backup / Import & Export */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Database Stats */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                  <HardDrive className="h-4 w-4 text-indigo-600" />
                  <span>Resumo do Banco de Dados Local</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  Loja: <strong className="text-slate-700">{currentBackup.fiscalConfig?.tradeName || 'Baby Liz & Metamorfose'}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-center space-x-1 text-slate-500 mb-0.5">
                    <Package className="h-3 w-3 text-amber-600" />
                    <span className="text-[10px]">Produtos</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{currentStats.productsCount}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-center space-x-1 text-slate-500 mb-0.5">
                    <Users className="h-3 w-3 text-indigo-600" />
                    <span className="text-[10px]">Clientes</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{currentStats.customersCount}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-center space-x-1 text-slate-500 mb-0.5">
                    <ShoppingBag className="h-3 w-3 text-blue-600" />
                    <span className="text-[10px]">Vendas</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{currentStats.salesCount}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center justify-center space-x-1 text-slate-500 mb-0.5">
                    <FileSpreadsheet className="h-3 w-3 text-purple-600" />
                    <span className="text-[10px]">Carnês</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{currentStats.carnesCount}</div>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
                  <div className="flex items-center justify-center space-x-1 text-slate-500 mb-0.5">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px]">NFC-e</span>
                  </div>
                  <div className="text-sm font-black text-slate-900">{currentStats.invoicesCount}</div>
                </div>
              </div>
            </div>

            {/* Option 1: Export Backup */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 flex items-center space-x-1.5">
                    <ArrowDownToLine className="h-4 w-4 text-indigo-600" />
                    <span>Exportar Backup Completo (Download)</span>
                  </h4>
                  <p className="text-[11px] text-indigo-900/70 mt-0.5">
                    Gera e faz o download de um arquivo .json seguro com todos os produtos, clientes, estoque, carnês e notas fiscais.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer flex-shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar Backup (.json)</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>{downloadSuccess}</span>
                </div>
              )}
            </div>

            {/* Option 2: Import Backup */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <ArrowUpFromLine className="h-4 w-4 text-emerald-600" />
                  <span>Importar / Restaurar Banco de Dados</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Carregue um arquivo de backup (.json) para restaurar os dados do sistema.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />

              {!selectedFileContent ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 text-slate-600'
                  }`}
                >
                  <Upload className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Arraste o arquivo .json aqui ou clique para selecionar
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Arquivos de backup gerados pelo sistema
                  </span>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileJson className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-bold text-slate-900">Arquivo Carregado</span>
                      {previewData && (
                        <span className="text-[10px] text-slate-500">
                          ({previewData.exportedAt ? formatDateTime(previewData.exportedAt) : 'Sem data'})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleClearSelected}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Trocar
                    </button>
                  </div>

                  {previewData && (
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="p-1.5 bg-white rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-500 block">Produtos</span>
                        <strong className="text-slate-900">{previewData.products?.length || 0}</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-500 block">Clientes</span>
                        <strong className="text-slate-900">{previewData.customers?.length || 0}</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-500 block">Vendas</span>
                        <strong className="text-slate-900">{previewData.sales?.length || 0}</strong>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-slate-200 text-center">
                        <span className="text-[9px] text-slate-500 block">Carnês</span>
                        <strong className="text-slate-900">{previewData.carnes?.length || 0}</strong>
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] text-amber-700 flex items-center space-x-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                      <span>Substituirá dados locais atuais.</span>
                    </span>

                    <button
                      type="button"
                      onClick={handleApplyRestore}
                      disabled={importing || !!validationError}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`h-3.5 w-3.5 ${importing ? 'animate-spin' : ''}`} />
                      <span>{importing ? 'Restaurando...' : 'Confirmar Restauração'}</span>
                    </button>
                  </div>
                </div>
              )}

              {validationError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}

              {importResult && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    importResult.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {importResult.success ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>Banco de dados restaurado com sucesso! Sincronização concluída.</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0" />
                      <span>Erro: {importResult.error}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer for Backup Tab */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
