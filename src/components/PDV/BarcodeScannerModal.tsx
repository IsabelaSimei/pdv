import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, Volume2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { playBeep } from '../../utils/helpers';
import { Product } from '../../types';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (barcode: string) => void;
  availableProducts: Product[];
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  availableProducts,
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-reader-container';

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setCameraError(null);

    const startCamera = async () => {
      try {
        // Wait for DOM element
        await new Promise((r) => setTimeout(r, 150));
        if (!document.getElementById(scannerContainerId)) return;

        const scanner = new Html5Qrcode(scannerContainerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        html5QrCodeRef.current = scanner;

        await scanner.start(
          { facingMode: facingMode },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (isMounted) {
              playBeep('success');
              onScanSuccess(decodedText.trim());
              handleClose();
            }
          },
          (errorMessage) => {
            // Frame scan failure is expected when barcode is not in frame
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: unknown) {
        console.warn('Erro ao inicializar câmera do scanner:', err);
        if (isMounted) {
          setCameraError(
            'Câmera não disponível no momento ou permissão negada. Você também pode simular a leitura abaixo ou digitar/usar um leitor USB.'
          );
          setIsScanning(false);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isOpen, facingMode]);

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.error('Erro ao parar scanner:', e);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  const toggleFacingMode = async () => {
    await stopScanner();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleSimulateScan = (barcode: string) => {
    playBeep('success');
    onScanSuccess(barcode);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-base font-bold">Leitor de Código de Barras</h3>
              <p className="text-xs text-slate-400">Aponte para o código da roupa ou perfume</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Camera Viewfinder Area */}
        <div className="relative bg-black flex flex-col items-center justify-center min-h-[260px] overflow-hidden">
          <div id={scannerContainerId} className="w-full max-h-[300px]" />

          {/* Viewfinder Overlay Guide */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative w-64 h-36 border-2 border-dashed border-indigo-400/80 rounded-xl flex items-center justify-center">
              <div className="w-full h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
              <div className="absolute bottom-2 text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded font-mono">
                Alinhe o código de barras
              </div>
            </div>
          </div>

          {/* Camera controls */}
          <div className="absolute top-3 right-3 flex items-center space-x-2 z-10">
            <button
              onClick={toggleFacingMode}
              className="flex items-center space-x-1 bg-black/60 hover:bg-black/80 text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/20 transition"
              title="Trocar câmera"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Trocar</span>
            </button>
          </div>
        </div>

        {cameraError && (
          <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-xs text-amber-800">
            <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>{cameraError}</div>
          </div>
        )}

        {/* Quick Simulator - Great for testing without camera */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>Simulação Rápida (1-clique para bipar):</span>
            </span>
            <span className="text-[11px] text-slate-500">Produtos do estoque</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
            {availableProducts.slice(0, 6).map((product) => (
              <button
                key={product.id}
                onClick={() => handleSimulateScan(product.barcode)}
                className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition group"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {product.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {product.barcode} {product.size ? `• Tam: ${product.size}` : ''} {product.volumeMl ? `• ${product.volumeMl}ml` : ''}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white px-2 py-1 rounded transition flex-shrink-0">
                  Bipar
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 px-6">
          <div className="flex items-center space-x-1.5">
            <Volume2 className="h-4 w-4 text-emerald-600" />
            <span>Sons de bipe ativados</span>
          </div>
          <button
            onClick={handleClose}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
