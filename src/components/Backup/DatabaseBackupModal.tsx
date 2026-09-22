import React, { useState, useRef } from 'react';
import {
  X,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  Package,
  Users,
  ShoppingBag,
  FileSpreadsheet,
  ShieldCheck,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  HardDrive,
} from 'lucide-react';
import { StorageService } from '../../services/storage';
import { BackupData, ImportResult } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/helpers';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Current database statistics
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
      setDownloadSuccess(`Backup baixado com sucesso: ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`);
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

      if (result.success) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/30 border border-indigo-400/30 text-indigo-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center space-x-2">
                <span>Backup do Banco de Dados Local</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Offline-First (JSON)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Exporte uma cópia completa ou restaure seus produtos, clientes, vendas e carnês
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Database Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-1.5">
                <HardDrive className="h-4 w-4 text-indigo-600" />
                <span>Dados Atuais em Armazenamento Local</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Empresa: <strong className="text-slate-700">{currentBackup.fiscalConfig?.tradeName || 'Baby Liz & Metamorfose'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Package className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-[10px] font-semibold">Produtos</span>
                </div>
                <div className="text-base font-black text-slate-900">{currentStats.productsCount}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <Users className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="text-[10px] font-semibold">Clientes</span>
                </div>
                <div className="text-base font-black text-slate-900">{currentStats.customersCount}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-[10px] font-semibold">Vendas</span>
                </div>
                <div className="text-base font-black text-slate-900">{currentStats.salesCount}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-[10px] font-semibold">Carnês</span>
                </div>
                <div className="text-base font-black text-slate-900">{currentStats.carnesCount}</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-center space-x-1 text-slate-500 mb-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-[10px] font-semibold">NFC-e</span>
                </div>
                <div className="text-base font-black text-slate-900">{currentStats.invoicesCount}</div>
              </div>
            </div>
          </div>

          {/* Section 1: Exportar Backup (Download) */}
          <div className="bg-indigo-50/50 border border-indigo-200/80 rounded-xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-indigo-950 flex items-center space-x-2">
                  <ArrowDownToLine className="h-4 w-4 text-indigo-600" />
                  <span>1. Exportar Backup Completo (Download)</span>
                </h4>
                <p className="text-xs text-indigo-900/70 mt-0.5 leading-relaxed">
                  Baixe um arquivo seguro com todos os registros (estoque, códigos de barras, clientes, parcelas de crediário, histórico de vendas e configurações da loja).
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 cursor-pointer flex-shrink-0"
              >
                <Download className="h-4 w-4" />
                <span>Fazer Download (.json)</span>
              </button>
            </div>

            {downloadSuccess && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-800 flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <span>{downloadSuccess}</span>
              </div>
            )}
          </div>

          {/* Section 2: Importar / Restaurar Backup */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <ArrowUpFromLine className="h-4 w-4 text-emerald-600" />
                <span>2. Importar / Restaurar Backup</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Selecione ou arraste um arquivo de backup (.json) criado anteriormente para restaurar sua base de dados.
              </p>
            </div>

            {/* Dropzone & File Input */}
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
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2.5 ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/70 text-indigo-700 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60 text-slate-600'
                }`}
              >
                <div className="p-3 rounded-full bg-slate-100 text-indigo-600">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Arraste o arquivo .json aqui ou clique para selecionar
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Aceita arquivos de backup gerados pelo sistema
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileJson className="h-5 w-5 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Arquivo Carregado</span>
                      {previewData && (
                        <span className="text-[11px] text-slate-500">
                          Exportado em: {previewData.exportedAt ? formatDateTime(previewData.exportedAt) : 'Desconhecido'}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearSelected}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                  >
                    Trocar arquivo
                  </button>
                </div>

                {/* Preview of contents */}
                {previewData && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                      Conteúdo do Arquivo a ser Restaurado:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Produtos</span>
                        <strong className="text-slate-900">{previewData.products?.length || 0}</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Clientes</span>
                        <strong className="text-slate-900">{previewData.customers?.length || 0}</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Vendas</span>
                        <strong className="text-slate-900">{previewData.sales?.length || 0}</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-500 block">Carnês</span>
                        <strong className="text-slate-900">{previewData.carnes?.length || 0}</strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Restore Action */}
                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-[11px] text-amber-700 font-medium">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-500" />
                    <span>Esta ação substituirá a base de dados atual.</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyRestore}
                    disabled={importing || !!validationError}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCcw className={`h-4 w-4 ${importing ? 'animate-spin' : ''}`} />
                    <span>{importing ? 'Restaurando...' : 'Confirmar e Restaurar Backup'}</span>
                  </button>
                </div>
              </div>
            )}

            {validationError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {importResult && (
              <div
                className={`p-4 rounded-xl border text-xs font-semibold ${
                  importResult.success
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-rose-50 border-rose-300 text-rose-900'
                }`}
              >
                {importResult.success ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2 text-sm font-bold text-emerald-800">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <span>Banco de dados restaurado com sucesso!</span>
                    </div>
                    <p className="text-emerald-700 text-[11px]">
                      Foram carregados: {importResult.stats?.products} produtos, {importResult.stats?.customers} clientes,{' '}
                      {importResult.stats?.sales} vendas e {importResult.stats?.carnes} carnês. Todas as telas já foram sincronizadas.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
                    <span>Falha na restauração: {importResult.error}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
