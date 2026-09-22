export type SegmentType = 'infantil' | 'perfumaria' | 'geral';

export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito' | 'carne';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  sku: string;
  segment: SegmentType;
  category: string;
  priceCost: number;
  priceSale: number;
  currentStock: number;
  minStock: number;
  unit: string;
  
  // Specific for Kids Clothing
  size?: string; // RN, P, M, G, 1, 2, 4, 6, 8, 10, 12, 14, 16
  color?: string;
  gender?: 'menina' | 'menino' | 'unissex' | 'bebe';
  fabric?: string;
  
  // Specific for Perfumery & Cosmetics
  volumeMl?: number; // 30, 50, 75, 100, 200 ml
  fragranceFamily?: string; // Floral, Amadeirado, Cítrico, Oriental, Doce, Frutado
  concentration?: string; // Eau de Parfum, Eau de Toilette, Deo Colônia, Body Splash
  batchNumber?: string; // Lote
  expirationDate?: string; // Validade
  
  // Fiscal Data
  ncm: string;
  cfop: string;
  csosn: string; // Ex: 102, 500 (Simples Nacional)
  origin: string; // 0 = Nacional, 1 = Importado
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'entrada_compra' | 'entrada_devolucao' | 'saida_venda' | 'saida_perda' | 'saida_ajuste';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  reason: string;
  unitPrice?: number;
  referenceDoc?: string; // NF de entrada, cupom de venda, etc.
}

export interface SaleItem {
  productId: string;
  productName: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  total: number;
  ncm: string;
  cfop: string;
  size?: string;
  color?: string;
  volumeMl?: number;
}

export interface Customer {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email?: string;
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  creditLimit: number;
  notes?: string;
  createdAt: string;
}

export interface CarneInstallment {
  id: string;
  carneId: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  fineRate: number; // Multa em %
  interestRateDaily: number; // Juros diários em %
  paidAmount?: number;
  paidDate?: string;
  status: 'pendente' | 'vencida' | 'paga';
  receiptNumber?: string;
  notes?: string;
}

export interface Carne {
  id: string;
  carneCode: string; // Ex: CRN-2026-001
  saleId: string;
  saleCode: string;
  customerId: string;
  customerName: string;
  customerCpf: string;
  customerPhone: string;
  totalAmount: number;
  installmentsCount: number;
  firstDueDate: string;
  status: 'ativo' | 'quitado' | 'atrasado' | 'cancelado';
  createdAt: string;
  installments: CarneInstallment[];
}

export interface Sale {
  id: string;
  code: string; // Ex: V-1024
  date: string;
  customerId?: string;
  customerName?: string;
  customerCpf?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentDetails: {
    amountReceived?: number;
    change?: number;
    cardBrand?: string;
    cardInstallments?: number;
    pixTransactionId?: string;
    carneId?: string;
    carneInstallmentsCount?: number;
  };
  fiscalStatus: 'nao_emitida' | 'emitida' | 'cancelada' | 'erro';
  fiscalInvoiceId?: string;
  nfeKey?: string;
  sellerName?: string;
}

export interface FiscalConfig {
  companyName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration: string; // IE
  crt: '1' | '3'; // 1 = Simples Nacional, 3 = Regime Normal
  address: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  environment: 'homologacao' | 'producao';
  cscId: string;
  cscToken: string;
  apiProvider: 'sefaz_simulada' | 'focus_nfe' | 'plugnotas' | 'webmaniabr';
  apiKey?: string;
  autoEmitNfce: boolean;
  defaultNcmInfantil: string;
  defaultNcmPerfumaria: string;
  defaultCfop: string;
}

export interface FiscalInvoice {
  id: string;
  saleId: string;
  saleCode: string;
  type: 'NFC-e' | 'NF-e';
  number: number;
  series: number;
  issuedAt: string;
  accessKey: string; // 44 digitos
  protocol: string;
  status: 'autorizada' | 'cancelada' | 'contingencia';
  qrCodeUrl: string;
  customerCpf?: string;
  customerName?: string;
  totalAmount: number;
  tributosAproximados: number; // IBPT
  xmlContent?: string;
}

export interface BackupData {
  system?: string;
  version: string;
  exportedAt: string;
  stats?: {
    productsCount?: number;
    customersCount?: number;
    salesCount?: number;
    carnesCount?: number;
    invoicesCount?: number;
    movementsCount?: number;
  };
  products?: Product[];
  movements?: StockMovement[];
  sales?: Sale[];
  carnes?: Carne[];
  customers?: Customer[];
  fiscalConfig?: FiscalConfig;
  fiscalInvoices?: FiscalInvoice[];
  counters?: {
    invoiceCounter?: string;
    saleCounter?: string;
    carneCounter?: string;
  };
}

export interface ImportResult {
  success: boolean;
  error?: string;
  stats?: {
    products: number;
    customers: number;
    sales: number;
    carnes: number;
    invoices: number;
    movements: number;
  };
}
