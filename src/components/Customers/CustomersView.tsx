import React, { useState } from 'react';
import { User, Plus, Search, Phone, Mail, MapPin, CreditCard, X, Check, Pencil } from 'lucide-react';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';

interface CustomersViewProps {
  customers: Customer[];
  onAddCustomer: (customerData: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdateCustomer: (id: string, updates: Partial<Customer>) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('Centro');
  const [city, setCity] = useState('São José da Bela Vista');
  const [state, setState] = useState('SP');
  const [zipCode, setZipCode] = useState('14440-000');
  const [creditLimit, setCreditLimit] = useState('1000.00');
  const [notes, setNotes] = useState('');

  const filtered = customers.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.cpf.includes(term) ||
      c.phone.includes(term)
    );
  });

  const handleOpenCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setCpf('');
    setPhone('');
    setEmail('');
    setStreet('');
    setNumber('');
    setNeighborhood('Centro');
    setCity('São José da Bela Vista');
    setState('SP');
    setZipCode('14440-000');
    setCreditLimit('1000.00');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setCpf(customer.cpf);
    setPhone(customer.phone);
    setEmail(customer.email || '');
    setStreet(customer.address?.street || '');
    setNumber(customer.address?.number || '');
    setNeighborhood(customer.address?.neighborhood || 'Centro');
    setCity(customer.address?.city || 'São José da Bela Vista');
    setState(customer.address?.state || 'SP');
    setZipCode(customer.address?.zipCode || '14440-000');
    setCreditLimit(customer.creditLimit ? customer.creditLimit.toString() : '1000.00');
    setNotes(customer.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cpf.trim() || !phone.trim()) {
      alert('Preencha os campos obrigatórios (Nome, CPF e Telefone).');
      return;
    }

    const customerPayload = {
      name: name.trim(),
      cpf: cpf.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: {
        street: street.trim() || 'Jerônimo Vieira de Andrade',
        number: number.trim() || 'S/N',
        neighborhood: neighborhood.trim() || 'Centro',
        city: city.trim() || 'São José da Bela Vista',
        state: state.trim() || 'SP',
        zipCode: zipCode.trim() || '14440-000',
      },
      creditLimit: parseFloat(creditLimit) || 1000.0,
      notes: notes.trim() || undefined,
    };

    if (editingCustomer) {
      onUpdateCustomer(editingCustomer.id, customerPayload);
    } else {
      onAddCustomer(customerPayload);
    }

    setIsModalOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100 p-4 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
            <User className="h-6 w-6 text-indigo-600" />
            <span>Cadastro de Clientes & Limite de Crediário</span>
          </h2>
          <p className="text-xs text-slate-500">
            Cadastre e edite clientes para emissão de carnês, crediário próprio e notas fiscais
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center space-x-1.5 cursor-pointer self-start"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="text-xs text-slate-500 font-semibold">{customers.length} cliente(s) cadastrado(s)</div>
      </div>

      {/* Grid of Customer Cards */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((customer) => (
            <div
              key={customer.id}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="p-2.5 rounded-full bg-indigo-50 text-indigo-600 font-bold text-sm flex-shrink-0">
                      {customer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">{customer.name}</h4>
                      <span className="text-[11px] font-mono text-slate-500 block">CPF: {customer.cpf}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-slate-500 block">Limite Crediário:</span>
                    <div className="text-xs font-black text-purple-900">
                      {formatCurrency(customer.creditLimit)}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <span className="font-medium text-slate-800">{customer.phone}</span>
                  </div>
                  {customer.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2 text-slate-700">
                      {customer.address.street}, {customer.address.number}
                      {customer.address.neighborhood ? ` - ${customer.address.neighborhood}` : ''}
                      {` - ${customer.address.city}/${customer.address.state}`}
                    </span>
                  </div>
                </div>

                {customer.notes && (
                  <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-200">
                    {customer.notes}
                  </div>
                )}
              </div>

              {/* Card Footer with Edit Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {customer.createdAt ? `Desde ${formatDate(customer.createdAt)}` : 'Cadastrado'}
                </span>
                <button
                  type="button"
                  onClick={() => handleOpenEditModal(customer)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                  title="Editar ou corrigir informações deste cliente"
                >
                  <Pencil className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Editar Cadastro</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cadastrar / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-2">
                {editingCustomer ? (
                  <Pencil className="h-5 w-5 text-indigo-400" />
                ) : (
                  <User className="h-5 w-5 text-indigo-400" />
                )}
                <div>
                  <h3 className="text-base font-bold">
                    {editingCustomer ? 'Editar Cadastro de Cliente' : 'Cadastrar Novo Cliente'}
                  </h3>
                  {editingCustomer && (
                    <p className="text-[11px] text-slate-400">
                      Corrija os dados cadastrais de {editingCustomer.name}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCustomer(null);
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Maria Eduarda Lima"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full text-xs font-mono p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(16) 99876-5432"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Limite do Crediário (R$)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={creditLimit}
                    onChange={(e) => setCreditLimit(e.target.value)}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-lg text-purple-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-800">Endereço Residencial</label>
                
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Rua / Logradouro"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="col-span-2 text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Nº"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Bairro"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder="UF"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-300 rounded-lg uppercase"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="CEP (ex: 14440-000)"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="text-xs p-2 bg-white border border-slate-300 rounded-lg font-mono w-full sm:w-1/2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observações do Cliente</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Mãe de 2 filhos, prefere vencimento no dia 10"
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
