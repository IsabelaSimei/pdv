import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageCircle,
  DollarSign,
  Search,
  Filter,
  User,
  Calendar,
} from 'lucide-react';
import { Carne, CarneInstallment, Customer, FiscalConfig } from '../../types';
import { calculateInterest, formatCurrency, formatDate } from '../../utils/helpers';
import { CarnePrintModal } from './CarnePrintModal';
import { CarnePaymentModal } from './CarnePaymentModal';
import { CarneGeneratorModal } from './CarneGeneratorModal';

interface CarneViewProps {
  carnes: Carne[];
  customers: Customer[];
  fiscalConfig: FiscalConfig;
  onPayInstallment: (
    carneId: string,
    installmentId: string,
    paidAmount: number,
    notes?: string
  ) => void;
  onCreateCarneManual: (
    customerId: string,
    totalAmount: number,
    installmentsCount: number,
    firstDueDate: string,
    notes?: string
  ) => void;
  onOpenCarnePrintModal: (carne: Carne) => void;
}

export const CarneView: React.FC<CarneViewProps> = ({
  carnes,
  customers,
  fiscalConfig,
  onPayInstallment,
  onCreateCarneManual,
  onOpenCarnePrintModal,
}) => {
  const [activeTab, setActiveTab] = useState<'todas' | 'vencidas' | 'a_vencer' | 'pagas'>('todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [payingItem, setPayingItem] = useState<{
    carne: Carne;
    installment: CarneInstallment;
  } | null>(null);

  // Flatten all installments with their parent carne
  const allInstallments = carnes.flatMap((c) =>
    c.installments.map((inst) => ({
      carne: c,
      installment: inst,
    }))
  );

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter installments
  const filteredInstallments = allInstallments.filter(({ carne, installment }) => {
    // Tab filter
    if (activeTab === 'vencidas') {
      if (installment.status === 'paga' || installment.dueDate >= todayStr) return false;
    } else if (activeTab === 'a_vencer') {
      if (installment.status === 'paga' || installment.dueDate < todayStr) return false;
    } else if (activeTab === 'pagas') {
      if (installment.status !== 'paga') return false;
    }

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      carne.customerName.toLowerCase().includes(term) ||
      carne.customerCpf.includes(term) ||
      carne.carneCode.toLowerCase().includes(term)
    );
  });

  // Financial Metrics
  const totalReceivable = allInstallments
    .filter((i) => i.installment.status !== 'paga')
    .reduce((acc, i) => acc + i.installment.amount, 0);

  const totalOverdue = allInstallments
    .filter((i) => i.installment.status !== 'paga' && i.installment.dueDate < todayStr)
    .reduce((acc, i) => acc + i.installment.amount, 0);

  const totalPaid = allInstallments
    .filter((i) => i.installment.status === 'paga')
    .reduce((acc, i) => acc + (i.installment.paidAmount || i.installment.amount), 0);

  const countOverdue = allInstallments.filter(
    (i) => i.installment.status !== 'paga' && i.installment.dueDate < todayStr
  ).length;

  const handleSendWhatsAppReminder = (carne: Carne, inst: CarneInstallment) => {
    const cleanPhone = carne.customerPhone.replace(/\D/g, '');
    const interest = calculateInterest(inst.amount, inst.dueDate, inst.fineRate, inst.interestRateDaily);
    const dueDateFormatted = formatDate(inst.dueDate);

    let message = `Olá, ${carne.customerName.split(' ')[0]}! Tudo bem?\n\nLembramos que a parcela ${inst.installmentNumber}/${inst.totalInstallments} do seu carnê nº ${carne.carneCode} na loja ${fiscalConfig.tradeName} no valor de ${formatCurrency(inst.amount)} `;

    if (interest.daysOverdue > 0) {
      message += `venceu em ${dueDateFormatted} (há ${interest.daysOverdue} dias).\nCom juros e encargos, o valor atualizado é de ${formatCurrency(interest.totalDue)}.\n\n`;
    } else {
      message += `vencerá em ${dueDateFormatted}.\n\n`;
    }

    message += `Você pode pagar na loja ou via PIX utilizando a chave CNPJ: ${fiscalConfig.cnpj}\n\nQualquer dúvida, estamos à disposição!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/55${cleanPhone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <FileSpreadsheet className="h-6 w-6 text-purple-600" />
            <span>Gestão de Carnês & Crediário da Loja</span>
          </h2>
          <p className="text-xs text-slate-500">
            Controle de parcelas, cobrança, emissão de carnês e recebimento de mensalidades
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsGeneratorOpen(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Emitir Novo Carnê Avulso</span>
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total a Receber (A Vencer)
          </div>
          <div className="text-xl font-black text-purple-900 mt-1">{formatCurrency(totalReceivable)}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center space-x-1">
            <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
            <span>Parcelas em Atraso</span>
          </div>
          <div className="text-xl font-black text-rose-600 mt-1">
            {formatCurrency(totalOverdue)} <span className="text-xs font-normal">({countOverdue} parc.)</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
            Total Já Quitado / Recebido
          </div>
          <div className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(totalPaid)}</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Carnês Emitidos
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{carnes.length} contratos</div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'todas'
                ? 'bg-purple-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Todas as Parcelas ({allInstallments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('vencidas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
              activeTab === 'vencidas'
                ? 'bg-rose-600 text-white'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Em Atraso ({countOverdue})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('a_vencer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'a_vencer'
                ? 'bg-purple-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            A Vencer
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'pagas'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Pagas / Baixadas
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, CPF, carnê..."
            className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 w-60"
          />
        </div>
      </div>

      {/* Installments Table */}
      <div className="flex-1 overflow-y-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0 z-10">
            <tr>
              <th className="py-3 px-4 font-bold">Carnê / Parcela</th>
              <th className="py-3 px-4 font-bold">Cliente</th>
              <th className="py-3 px-4 font-bold">Vencimento</th>
              <th className="py-3 px-4 font-bold">Status</th>
              <th className="py-3 px-4 font-bold text-right">Valor Parcela</th>
              <th className="py-3 px-4 font-bold text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInstallments.map(({ carne, installment }) => {
              const isPaid = installment.status === 'paga';
              const isOverdue = !isPaid && installment.dueDate < todayStr;
              const interest = calculateInterest(
                installment.amount,
                installment.dueDate,
                installment.fineRate,
                installment.interestRateDaily
              );

              return (
                <tr key={installment.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4">
                    <div className="font-bold text-purple-950 font-mono">{carne.carneCode}</div>
                    <div className="text-[11px] text-slate-500">
                      Parcela {installment.installmentNumber} de {installment.totalInstallments}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{carne.customerName}</div>
                    <div className="text-[10px] text-slate-500">
                      CPF: {carne.customerCpf} • Tel: {carne.customerPhone}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{formatDate(installment.dueDate)}</div>
                    {isOverdue && (
                      <div className="text-[10px] font-bold text-rose-600">
                        Atrasada há {interest.daysOverdue} dias
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {isPaid ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Paga em {formatDate(installment.paidDate || '')}</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                        <AlertCircle className="h-3 w-3" />
                        <span>Vencida</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                        <Clock className="h-3 w-3" />
                        <span>A Vencer</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="font-black text-sm text-slate-900">
                      {formatCurrency(installment.amount)}
                    </div>
                    {isOverdue && (
                      <div className="text-[10px] font-bold text-rose-600">
                        Com juros: {formatCurrency(interest.totalDue)}
                      </div>
                    )}
                    {isPaid && installment.paidAmount && (
                      <div className="text-[10px] text-emerald-700">
                        Pago: {formatCurrency(installment.paidAmount)}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => setPayingItem({ carne, installment })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1 cursor-pointer"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Dar Baixa</span>
                        </button>
                      )}

                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppReminder(carne, installment)}
                          title="Lembrar cobrança via WhatsApp"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenCarnePrintModal(carne)}
                        title="Imprimir Carnê Completo"
                        className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Generator Modal */}
      <CarneGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        customers={customers}
        onCreateCarne={onCreateCarneManual}
      />

      {/* Payment Discharge Modal */}
      {payingItem && (
        <CarnePaymentModal
          isOpen={!!payingItem}
          onClose={() => setPayingItem(null)}
          carne={payingItem.carne}
          installment={payingItem.installment}
          onConfirmPayment={onPayInstallment}
        />
      )}
    </div>
  );
};
