import { INITIAL_CUSTOMERS, INITIAL_FISCAL_CONFIG, INITIAL_PRODUCTS } from '../data/initialData';
import {
  BackupData,
  Carne,
  CarneInstallment,
  Customer,
  FiscalConfig,
  FiscalInvoice,
  ImportResult,
  Product,
  Sale,
  StockMovement,
} from '../types';
import { emitNfce } from './fiscal';

const STORAGE_KEYS = {
  PRODUCTS: 'varejo_products_v1',
  MOVEMENTS: 'varejo_movements_v1',
  SALES: 'varejo_sales_v1',
  CARNES: 'varejo_carnes_v1',
  CUSTOMERS: 'varejo_customers_v1',
  FISCAL_CONFIG: 'varejo_fiscal_config_v1',
  FISCAL_INVOICES: 'varejo_fiscal_invoices_v1',
  INVOICE_COUNTER: 'varejo_invoice_counter_v1',
  SALE_COUNTER: 'varejo_sale_counter_v1',
  CARNE_COUNTER: 'varejo_carne_counter_v1',
};

// Seed initial carnê to demonstrate crediário functionality out of the box
function createInitialCarnes(customers: Customer[]): Carne[] {
  const customer1 = customers[0];
  const now = new Date();
  
  const dueDate1 = new Date(now);
  dueDate1.setDate(now.getDate() - 5); // 5 dias vencida
  
  const dueDate2 = new Date(now);
  dueDate2.setDate(now.getDate() + 25); // a vencer

  const dueDate3 = new Date(now);
  dueDate3.setDate(now.getDate() + 55); // a vencer

  const installments: CarneInstallment[] = [
    {
      id: 'inst-1',
      carneId: 'crn-demo-1',
      installmentNumber: 1,
      totalInstallments: 3,
      dueDate: dueDate1.toISOString().split('T')[0],
      amount: 110.00,
      fineRate: 2.0,
      interestRateDaily: 0.033,
      status: 'vencida',
    },
    {
      id: 'inst-2',
      carneId: 'crn-demo-1',
      installmentNumber: 2,
      totalInstallments: 3,
      dueDate: dueDate2.toISOString().split('T')[0],
      amount: 110.00,
      fineRate: 2.0,
      interestRateDaily: 0.033,
      status: 'pendente',
    },
    {
      id: 'inst-3',
      carneId: 'crn-demo-1',
      installmentNumber: 3,
      totalInstallments: 3,
      dueDate: dueDate3.toISOString().split('T')[0],
      amount: 110.00,
      fineRate: 2.0,
      interestRateDaily: 0.033,
      status: 'pendente',
    },
  ];

  return [
    {
      id: 'crn-demo-1',
      carneCode: 'CRN-2026-001',
      saleId: 'sale-demo-1',
      saleCode: 'V-1001',
      customerId: customer1.id,
      customerName: customer1.name,
      customerCpf: customer1.cpf,
      customerPhone: customer1.phone,
      totalAmount: 330.00,
      installmentsCount: 3,
      firstDueDate: dueDate1.toISOString().split('T')[0],
      status: 'atrasado',
      createdAt: new Date(now.getTime() - 35 * 86400000).toISOString(),
      installments,
    },
  ];
}

// Initial sales to demonstrate metrics and dashboard out of the box
function createInitialSales(products: Product[], customers: Customer[]): Sale[] {
  const now = new Date();
  const sales: Sale[] = [];

  const prodInf1 = products.find((p) => p.sku === 'INF-BDY-01') || products[0];
  const prodInf2 = products.find((p) => p.sku === 'INF-VES-02') || products[1];
  const prodInf3 = products.find((p) => p.sku === 'INF-POL-03') || products[2];
  const prodPerf1 = products.find((p) => p.sku === 'PERF-EDP-01') || products[6];
  const prodPerf2 = products.find((p) => p.sku === 'PERF-EDT-02') || products[7];
  const prodPerf3 = products.find((p) => p.sku === 'PERF-SPL-03') || products[8];

  // Demo sale 1 (linked to carne)
  sales.push({
    id: 'sale-demo-1',
    code: 'V-1001',
    date: new Date(now.getTime() - 35 * 86400000).toISOString(),
    customerId: customers[0]?.id,
    customerName: customers[0]?.name,
    customerCpf: customers[0]?.cpf,
    items: [
      {
        productId: prodInf2.id,
        productName: prodInf2.name,
        barcode: prodInf2.barcode,
        unitPrice: prodInf2.priceSale,
        costPrice: prodInf2.priceCost,
        quantity: 1,
        discount: 0,
        total: prodInf2.priceSale,
        ncm: prodInf2.ncm,
        cfop: prodInf2.cfop,
        size: prodInf2.size,
      },
      {
        productId: prodPerf1.id,
        productName: prodPerf1.name,
        barcode: prodPerf1.barcode,
        unitPrice: prodPerf1.priceSale,
        costPrice: prodPerf1.priceCost,
        quantity: 1,
        discount: 9.90,
        total: prodPerf1.priceSale - 9.90,
        ncm: prodPerf1.ncm,
        cfop: prodPerf1.cfop,
        volumeMl: prodPerf1.volumeMl,
      },
    ],
    subtotal: 339.90,
    discount: 9.90,
    total: 330.00,
    paymentMethod: 'carne',
    paymentDetails: {
      carneId: 'crn-demo-1',
      carneInstallmentsCount: 3,
    },
    fiscalStatus: 'emitida',
    nfeKey: '35260834892124000195650010000010011837492817',
    sellerName: 'Balcão Principal',
  });

  // Series of recent sales across the last 14 days
  const patterns: {
    daysAgo: number;
    hour: number;
    items: { prod: Product; qty: number; disc?: number }[];
    method: 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'carne';
    cust?: Customer;
  }[] = [
    { daysAgo: 13, hour: 11, items: [{ prod: prodInf1, qty: 2 }], method: 'pix' },
    { daysAgo: 12, hour: 15, items: [{ prod: prodPerf1, qty: 1 }], method: 'cartao_credito', cust: customers[1] },
    { daysAgo: 11, hour: 10, items: [{ prod: prodInf3, qty: 1 }, { prod: prodInf1, qty: 1 }], method: 'dinheiro' },
    { daysAgo: 10, hour: 16, items: [{ prod: prodPerf2, qty: 1 }], method: 'cartao_debito' },
    { daysAgo: 9, hour: 14, items: [{ prod: prodInf2, qty: 2 }], method: 'pix', cust: customers[0] },
    { daysAgo: 8, hour: 17, items: [{ prod: prodPerf1, qty: 1 }, { prod: prodPerf3, qty: 2 }], method: 'cartao_credito' },
    { daysAgo: 7, hour: 12, items: [{ prod: prodInf1, qty: 3 }], method: 'pix' },
    { daysAgo: 6, hour: 11, items: [{ prod: prodPerf2, qty: 2 }], method: 'cartao_credito', cust: customers[2] },
    { daysAgo: 5, hour: 15, items: [{ prod: prodInf3, qty: 2 }, { prod: prodInf2, qty: 1 }], method: 'dinheiro' },
    { daysAgo: 4, hour: 16, items: [{ prod: prodPerf1, qty: 1 }, { prod: prodInf1, qty: 1 }], method: 'pix' },
    { daysAgo: 3, hour: 10, items: [{ prod: prodPerf3, qty: 3 }], method: 'cartao_debito' },
    { daysAgo: 2, hour: 14, items: [{ prod: prodInf2, qty: 1 }, { prod: prodPerf2, qty: 1 }], method: 'cartao_credito', cust: customers[1] },
    { daysAgo: 1, hour: 16, items: [{ prod: prodInf1, qty: 2 }, { prod: prodInf3, qty: 1 }], method: 'pix' },
    { daysAgo: 0, hour: 10, items: [{ prod: prodPerf1, qty: 1 }], method: 'pix' },
    { daysAgo: 0, hour: 11, items: [{ prod: prodInf2, qty: 1 }, { prod: prodPerf3, qty: 1 }], method: 'dinheiro' },
  ];

  patterns.forEach((pat, idx) => {
    const saleDate = new Date(now.getTime() - pat.daysAgo * 86400000);
    saleDate.setHours(pat.hour, Math.floor(Math.random() * 50), 0, 0);

    const saleItems = pat.items.map(({ prod, qty, disc = 0 }) => {
      const lineTotal = Math.round((prod.priceSale * qty - disc) * 100) / 100;
      return {
        productId: prod.id,
        productName: prod.name,
        barcode: prod.barcode,
        unitPrice: prod.priceSale,
        costPrice: prod.priceCost,
        quantity: qty,
        discount: disc,
        total: lineTotal,
        ncm: prod.ncm,
        cfop: prod.cfop,
        size: prod.size,
        volumeMl: prod.volumeMl,
      };
    });

    const subtotal = saleItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const discount = saleItems.reduce((acc, it) => acc + it.discount, 0);
    const total = Math.round((subtotal - discount) * 100) / 100;
    const saleNum = 1002 + idx;

    sales.push({
      id: `sale-init-${idx + 2}`,
      code: `V-${saleNum}`,
      date: saleDate.toISOString(),
      customerId: pat.cust?.id,
      customerName: pat.cust?.name,
      customerCpf: pat.cust?.cpf,
      items: saleItems,
      subtotal,
      discount,
      total,
      paymentMethod: pat.method,
      paymentDetails: {
        amountReceived: pat.method === 'dinheiro' ? Math.ceil(total / 10) * 10 : undefined,
        change: pat.method === 'dinheiro' ? Math.ceil(total / 10) * 10 - total : undefined,
        cardBrand: pat.method.startsWith('cartao') ? 'Mastercard' : undefined,
        pixTransactionId: pat.method === 'pix' ? `PIX-${Date.now()}-${idx}` : undefined,
      },
      fiscalStatus: 'emitida',
      nfeKey: `352608348921240001956500100000${saleNum}1837492817`,
      sellerName: 'Balcão Principal',
    });
  });

  return sales;
}

// Initial stock movements log
function createInitialMovements(products: Product[]): StockMovement[] {
  return products.map((prod, index) => ({
    id: `mov-init-${index}`,
    productId: prod.id,
    productName: prod.name,
    barcode: prod.barcode,
    type: 'entrada_compra',
    quantity: prod.currentStock + 5,
    previousStock: 0,
    newStock: prod.currentStock + 5,
    date: new Date(Date.now() - (index + 2) * 86400000).toISOString(),
    reason: 'Estoque inicial / Nota Fiscal de Entrada',
    unitPrice: prod.priceCost,
    referenceDoc: `NF-E ${1040 + index}`,
  }));
}

export class StorageService {
  // Products
  static getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (!data) {
      this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProducts(products: Product[]): void {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }

  static getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  static getProductByBarcode(barcode: string): Product | undefined {
    const clean = barcode.trim();
    return this.getProducts().find((p) => p.barcode === clean || p.sku.toLowerCase() === clean.toLowerCase());
  }

  static addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product {
    const products = this.getProducts();
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    products.unshift(newProduct);
    this.saveProducts(products);

    // Record initial stock entry movement if > 0
    if (newProduct.currentStock > 0) {
      this.addMovement({
        productId: newProduct.id,
        productName: newProduct.name,
        barcode: newProduct.barcode,
        type: 'entrada_compra',
        quantity: newProduct.currentStock,
        previousStock: 0,
        newStock: newProduct.currentStock,
        date: now,
        reason: 'Cadastro Inicial do Produto',
        unitPrice: newProduct.priceCost,
        referenceDoc: 'CADASTRO',
      });
    }

    return newProduct;
  }

  static updateProduct(id: string, updates: Partial<Product>): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Produto não encontrado');

    const updated: Product = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    products[index] = updated;
    this.saveProducts(products);
    return updated;
  }

  static deleteProduct(id: string): void {
    const products = this.getProducts().filter((p) => p.id !== id);
    this.saveProducts(products);
  }

  // Stock Movements
  static getMovements(): StockMovement[] {
    const data = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (!data) {
      const initial = createInitialMovements(this.getProducts());
      this.saveMovements(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveMovements(movements: StockMovement[]): void {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }

  static addMovement(movementData: Omit<StockMovement, 'id'>): StockMovement {
    const movements = this.getMovements();
    const movement: StockMovement = {
      ...movementData,
      id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    movements.unshift(movement);
    this.saveMovements(movements);
    return movement;
  }

  static adjustStock(
    productId: string,
    quantityDelta: number, // positive for entry, negative for exit
    type: StockMovement['type'],
    reason: string,
    referenceDoc?: string,
  ): Product {
    const product = this.getProductById(productId);
    if (!product) throw new Error('Produto não encontrado');

    const previousStock = product.currentStock;
    const newStock = Math.max(0, previousStock + quantityDelta);

    const updated = this.updateProduct(productId, { currentStock: newStock });

    this.addMovement({
      productId: product.id,
      productName: product.name,
      barcode: product.barcode,
      type,
      quantity: Math.abs(quantityDelta),
      previousStock,
      newStock,
      date: new Date().toISOString(),
      reason,
      unitPrice: product.priceCost,
      referenceDoc,
    });

    return updated;
  }

  // Customers
  static getCustomers(): Customer[] {
    const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (!data) {
      this.saveCustomers(INITIAL_CUSTOMERS);
      return INITIAL_CUSTOMERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_CUSTOMERS;
    }
  }

  static saveCustomers(customers: Customer[]): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customers = this.getCustomers();
    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    customers.push(newCustomer);
    this.saveCustomers(customers);
    return newCustomer;
  }

  static updateCustomer(id: string, updates: Partial<Customer>): Customer {
    const customers = this.getCustomers();
    const index = customers.findIndex((c) => c.id === id);
    if (index === -1) throw new Error('Cliente não encontrado');
    customers[index] = { ...customers[index], ...updates };
    this.saveCustomers(customers);

    // If customer personal data was corrected, update existing carnês for consistency
    if (updates.name || updates.cpf || updates.phone) {
      try {
        const carnes = this.getCarnes();
        let changed = false;
        carnes.forEach((carne) => {
          if (carne.customerId === id) {
            if (updates.name) carne.customerName = updates.name;
            if (updates.cpf) carne.customerCpf = updates.cpf;
            if (updates.phone) carne.customerPhone = updates.phone;
            changed = true;
          }
        });
        if (changed) {
          this.saveCarnes(carnes);
        }
      } catch (err) {
        console.error('Erro ao sincronizar carnês com cliente atualizado:', err);
      }
    }

    return customers[index];
  }

  // Sales
  static getSales(): Sale[] {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    if (!data) {
      const initial = createInitialSales(this.getProducts(), this.getCustomers());
      this.saveSales(initial);
      return initial;
    }
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length === 0) {
        const initial = createInitialSales(this.getProducts(), this.getCustomers());
        this.saveSales(initial);
        return initial;
      }
      return parsed;
    } catch {
      return [];
    }
  }

  static saveSales(sales: Sale[]): void {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }

  static getNextSaleNumber(): number {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.SALE_COUNTER) || '1020', 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.SALE_COUNTER, next.toString());
    return next;
  }

  static getNextInvoiceNumber(): number {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER) || '101', 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, next.toString());
    return next;
  }

  static getNextCarneNumber(): number {
    const current = parseInt(localStorage.getItem(STORAGE_KEYS.CARNE_COUNTER) || '1', 10);
    const next = current + 1;
    localStorage.setItem(STORAGE_KEYS.CARNE_COUNTER, next.toString());
    return next;
  }

  // Carnes
  static getCarnes(): Carne[] {
    const data = localStorage.getItem(STORAGE_KEYS.CARNES);
    if (!data) {
      const initial = createInitialCarnes(this.getCustomers());
      this.saveCarnes(initial);
      return initial;
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveCarnes(carnes: Carne[]): void {
    localStorage.setItem(STORAGE_KEYS.CARNES, JSON.stringify(carnes));
  }

  static getCarneById(id: string): Carne | undefined {
    return this.getCarnes().find((c) => c.id === id);
  }

  static createCarne(
    saleId: string,
    saleCode: string,
    customer: Customer,
    totalAmount: number,
    installmentsCount: number,
    firstDueDate: string,
  ): Carne {
    const carnes = this.getCarnes();
    const carneSeq = this.getNextCarneNumber();
    const year = new Date().getFullYear();
    const carneCode = `CRN-${year}-${String(carneSeq).padStart(3, '0')}`;
    const carneId = `crn-${Date.now()}`;

    const installmentValue = Math.round((totalAmount / installmentsCount) * 100) / 100;
    // Adjust remainder on first installment
    const totalCalculated = installmentValue * installmentsCount;
    const diff = Math.round((totalAmount - totalCalculated) * 100) / 100;

    const installments: CarneInstallment[] = [];
    const baseDate = new Date(firstDueDate);

    for (let i = 1; i <= installmentsCount; i++) {
      const dueDate = new Date(baseDate);
      dueDate.setMonth(baseDate.getMonth() + (i - 1));
      const amount = i === 1 ? installmentValue + diff : installmentValue;

      installments.push({
        id: `inst-${carneId}-${i}`,
        carneId,
        installmentNumber: i,
        totalInstallments: installmentsCount,
        dueDate: dueDate.toISOString().split('T')[0],
        amount,
        fineRate: 2.0, // 2% multa padrão
        interestRateDaily: 0.033, // ~1% ao mês
        status: 'pendente',
      });
    }

    const newCarne: Carne = {
      id: carneId,
      carneCode,
      saleId,
      saleCode,
      customerId: customer.id,
      customerName: customer.name,
      customerCpf: customer.cpf,
      customerPhone: customer.phone,
      totalAmount,
      installmentsCount,
      firstDueDate,
      status: 'ativo',
      createdAt: new Date().toISOString(),
      installments,
    };

    carnes.unshift(newCarne);
    this.saveCarnes(carnes);
    return newCarne;
  }

  static payInstallment(
    carneId: string,
    installmentId: string,
    paidAmount: number,
    receiptNotes?: string,
  ): { carne: Carne; installment: CarneInstallment } {
    const carnes = this.getCarnes();
    const carneIndex = carnes.findIndex((c) => c.id === carneId);
    if (carneIndex === -1) throw new Error('Carnê não encontrado');

    const carne = carnes[carneIndex];
    const instIndex = carne.installments.findIndex((i) => i.id === installmentId);
    if (instIndex === -1) throw new Error('Parcela não encontrada');

    const inst = carne.installments[instIndex];
    const now = new Date();

    inst.status = 'paga';
    inst.paidAmount = paidAmount;
    inst.paidDate = now.toISOString();
    inst.receiptNumber = `REC-${now.getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`;
    if (receiptNotes) inst.notes = receiptNotes;

    // Check if all installments are paid
    const allPaid = carne.installments.every((i) => i.status === 'paga');
    if (allPaid) {
      carne.status = 'quitado';
    } else {
      // Check if any other is overdue
      const todayStr = now.toISOString().split('T')[0];
      const hasOverdue = carne.installments.some((i) => i.status !== 'paga' && i.dueDate < todayStr);
      carne.status = hasOverdue ? 'atrasado' : 'ativo';
    }

    carnes[carneIndex] = carne;
    this.saveCarnes(carnes);

    return { carne, installment: inst };
  }

  static payCarneInstallment(
    carneId: string,
    installmentId: string,
    paidAmount: number,
    receiptNotes?: string,
  ): { carne: Carne; installment: CarneInstallment } {
    return this.payInstallment(carneId, installmentId, paidAmount, receiptNotes);
  }

  static createCarneDirect(
    customerId: string,
    totalAmount: number,
    installmentsCount: number = 3,
    firstDueDate: string,
    notes?: string,
  ): Carne {
    const customer = this.getCustomers().find((c) => c.id === customerId);
    if (!customer) throw new Error('Cliente não encontrado');

    const carneCode = `CRN-${new Date().getFullYear()}-${this.getNextCarneNumber()}`;
    const carne = this.createCarne(
      `direct-${Date.now()}`,
      'AVULSO',
      customer,
      totalAmount,
      installmentsCount,
      firstDueDate
    );
    if (notes) {
      // notes can be stored or added if needed
    }
    return carne;
  }

  // Process Entire Sale Flow (Decrements Stock, Creates Carne if requested, Emits Fiscal Invoice)
  static async completeSale(saleData: {
    items: Sale['items'];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: Sale['paymentMethod'];
    paymentDetails: Sale['paymentDetails'];
    customer?: Customer;
    sellerName?: string;
  }): Promise<{ sale: Sale; invoice?: FiscalInvoice; carne?: Carne }> {
    const saleNumber = this.getNextSaleNumber();
    const saleCode = `V-${saleNumber}`;
    const saleId = `sale-${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Decrement Stock for all items and log movements
    for (const item of saleData.items) {
      this.adjustStock(
        item.productId,
        -item.quantity,
        'saida_venda',
        `Venda PDV nº ${saleCode}`,
        saleCode,
      );
    }

    // 2. If Payment is Carnê, create the Carnê record with installments
    let createdCarne: Carne | undefined;
    if (saleData.paymentMethod === 'carne' && saleData.customer) {
      const installmentsCount = saleData.paymentDetails.carneInstallmentsCount || 3;
      const firstDue = new Date();
      firstDue.setDate(firstDue.getDate() + 30);
      const firstDueStr = firstDue.toISOString().split('T')[0];

      createdCarne = this.createCarne(
        saleId,
        saleCode,
        saleData.customer,
        saleData.total,
        installmentsCount,
        firstDueStr,
      );
      saleData.paymentDetails.carneId = createdCarne.id;
    }

    // 3. Create Sale record
    const sale: Sale = {
      id: saleId,
      code: saleCode,
      date: now,
      customerId: saleData.customer?.id,
      customerName: saleData.customer?.name,
      customerCpf: saleData.customer?.cpf,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      paymentMethod: saleData.paymentMethod,
      paymentDetails: saleData.paymentDetails,
      fiscalStatus: 'nao_emitida',
      sellerName: saleData.sellerName || 'Balcão / Caixa 01',
    };

    // 4. Check Fiscal Auto Emission
    const fiscalConfig = this.getFiscalConfig();
    let invoice: FiscalInvoice | undefined;

    if (fiscalConfig.autoEmitNfce) {
      try {
        const nextInvNumber = this.getNextInvoiceNumber();
        invoice = await emitNfce(sale, fiscalConfig, nextInvNumber);
        this.saveFiscalInvoice(invoice);
        sale.fiscalStatus = 'emitida';
        sale.fiscalInvoiceId = invoice.id;
        sale.nfeKey = invoice.accessKey;
      } catch (err) {
        console.error('Falha ao emitir NFC-e automática:', err);
        sale.fiscalStatus = 'erro';
      }
    }

    const sales = this.getSales();
    sales.unshift(sale);
    this.saveSales(sales);

    return { sale, invoice, carne: createdCarne };
  }

  // Fiscal Configuration & Invoices
  static getFiscalConfig(): FiscalConfig {
    const data = localStorage.getItem(STORAGE_KEYS.FISCAL_CONFIG);
    if (!data) {
      this.saveFiscalConfig(INITIAL_FISCAL_CONFIG);
      return INITIAL_FISCAL_CONFIG;
    }
    try {
      const parsed = JSON.parse(data);
      // Automatically upgrade if localStorage has stale initial placeholder credentials
      if (
        parsed.companyName?.includes('LARA KIDS') ||
        parsed.tradeName?.includes('Lara Kids') ||
        parsed.cnpj === '34.892.124/0001-95'
      ) {
        const upgraded: FiscalConfig = {
          ...parsed,
          companyName: INITIAL_FISCAL_CONFIG.companyName,
          tradeName: INITIAL_FISCAL_CONFIG.tradeName,
          cnpj: INITIAL_FISCAL_CONFIG.cnpj,
          address: INITIAL_FISCAL_CONFIG.address,
        };
        this.saveFiscalConfig(upgraded);
        return upgraded;
      }
      return parsed;
    } catch {
      return INITIAL_FISCAL_CONFIG;
    }
  }

  static saveFiscalConfig(config: FiscalConfig): void {
    localStorage.setItem(STORAGE_KEYS.FISCAL_CONFIG, JSON.stringify(config));
  }

  static getFiscalInvoices(): FiscalInvoice[] {
    const data = localStorage.getItem(STORAGE_KEYS.FISCAL_INVOICES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static saveFiscalInvoice(invoice: FiscalInvoice): void {
    const invoices = this.getFiscalInvoices();
    invoices.unshift(invoice);
    localStorage.setItem(STORAGE_KEYS.FISCAL_INVOICES, JSON.stringify(invoices));
  }

  static getInvoiceBySaleId(saleId: string): FiscalInvoice | undefined {
    return this.getFiscalInvoices().find((inv) => inv.saleId === saleId);
  }

  static getInvoices(): FiscalInvoice[] {
    return this.getFiscalInvoices();
  }

  static getStockMovements(): StockMovement[] {
    return this.getMovements();
  }

  static saveInvoice(invoice: FiscalInvoice): void {
    this.saveFiscalInvoice(invoice);
  }

  static cancelSale(saleId: string): void {
    const sales = this.getSales();
    const saleIndex = sales.findIndex((s) => s.id === saleId);
    if (saleIndex === -1) return;

    const sale = sales[saleIndex];

    // Return items to stock
    for (const item of sale.items) {
      this.adjustStock(
        item.productId,
        item.quantity,
        'entrada_compra',
        `Cancelamento/Estorno da Venda #${sale.code}`,
        sale.code
      );
    }

    // Cancel related Carnê if exists
    if (sale.paymentDetails.carneId) {
      const carnes = this.getCarnes();
      const carne = carnes.find((c) => c.id === sale.paymentDetails.carneId);
      if (carne) {
        carne.status = 'cancelado';
        this.saveCarnes(carnes);
      }
    }

    sales.splice(saleIndex, 1);
    this.saveSales(sales);
  }

  static resetToDemoData(): void {
    this.resetToDefault();
  }

  // Backup & Restore
  static exportBackupData(): BackupData {
    const products = this.getProducts();
    const movements = this.getMovements();
    const sales = this.getSales();
    const carnes = this.getCarnes();
    const customers = this.getCustomers();
    const fiscalConfig = this.getFiscalConfig();
    const fiscalInvoices = this.getFiscalInvoices();

    return {
      system: 'Baby Liz & Metamorfose Cosméticos - PDV & Gestão Integrada',
      version: '1.2',
      exportedAt: new Date().toISOString(),
      stats: {
        productsCount: products.length,
        customersCount: customers.length,
        salesCount: sales.length,
        carnesCount: carnes.length,
        invoicesCount: fiscalInvoices.length,
        movementsCount: movements.length,
      },
      products,
      movements,
      sales,
      carnes,
      customers,
      fiscalConfig,
      fiscalInvoices,
      counters: {
        invoiceCounter: localStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER) || '1',
        saleCounter: localStorage.getItem(STORAGE_KEYS.SALE_COUNTER) || '1',
        carneCounter: localStorage.getItem(STORAGE_KEYS.CARNE_COUNTER) || '1',
      },
    };
  }

  static exportBackup(): string {
    return JSON.stringify(this.exportBackupData(), null, 2);
  }

  static downloadBackupFile(): { filename: string; sizeBytes: number } {
    const jsonString = this.exportBackup();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const filename = `backup_babyliz_metamorfose_${dateStr}_${timeStr}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      filename,
      sizeBytes: new Blob([jsonString]).size,
    };
  }

  static validateBackup(jsonString: string): {
    valid: boolean;
    error?: string;
    data?: BackupData;
  } {
    try {
      if (!jsonString || typeof jsonString !== 'string') {
        return { valid: false, error: 'O arquivo de backup está vazio ou é inválido.' };
      }
      const data = JSON.parse(jsonString) as BackupData;
      if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Formato JSON inválido.' };
      }
      // Must contain at least products or customers or sales
      if (!data.products && !data.customers && !data.sales && !data.carnes) {
        return {
          valid: false,
          error: 'O arquivo não contém entidades de banco de dados reconhecíveis (produtos, clientes, vendas ou carnês).',
        };
      }
      return { valid: true, data };
    } catch (e: any) {
      return { valid: false, error: `Erro ao processar JSON: ${e.message || 'Arquivo corrompido'}` };
    }
  }

  static importBackup(jsonString: string): ImportResult {
    const validation = this.validateBackup(jsonString);
    if (!validation.valid || !validation.data) {
      return {
        success: false,
        error: validation.error || 'Arquivo de backup inválido.',
      };
    }

    try {
      const data = validation.data;
      if (Array.isArray(data.products)) this.saveProducts(data.products);
      if (Array.isArray(data.movements)) this.saveMovements(data.movements);
      if (Array.isArray(data.sales)) this.saveSales(data.sales);
      if (Array.isArray(data.carnes)) this.saveCarnes(data.carnes);
      if (Array.isArray(data.customers)) this.saveCustomers(data.customers);
      if (data.fiscalConfig && typeof data.fiscalConfig === 'object') {
        this.saveFiscalConfig(data.fiscalConfig);
      }
      if (Array.isArray(data.fiscalInvoices)) {
        localStorage.setItem(STORAGE_KEYS.FISCAL_INVOICES, JSON.stringify(data.fiscalInvoices));
      }
      if (data.counters) {
        if (data.counters.invoiceCounter) {
          localStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, data.counters.invoiceCounter);
        }
        if (data.counters.saleCounter) {
          localStorage.setItem(STORAGE_KEYS.SALE_COUNTER, data.counters.saleCounter);
        }
        if (data.counters.carneCounter) {
          localStorage.setItem(STORAGE_KEYS.CARNE_COUNTER, data.counters.carneCounter);
        }
      }

      return {
        success: true,
        stats: {
          products: Array.isArray(data.products) ? data.products.length : 0,
          customers: Array.isArray(data.customers) ? data.customers.length : 0,
          sales: Array.isArray(data.sales) ? data.sales.length : 0,
          carnes: Array.isArray(data.carnes) ? data.carnes.length : 0,
          invoices: Array.isArray(data.fiscalInvoices) ? data.fiscalInvoices.length : 0,
          movements: Array.isArray(data.movements) ? data.movements.length : 0,
        },
      };
    } catch (e: any) {
      console.error('Falha ao restaurar backup:', e);
      return {
        success: false,
        error: `Erro ao gravar dados no armazenamento local: ${e.message}`,
      };
    }
  }

  static resetToDefault(): void {
    localStorage.clear();
    this.saveProducts(INITIAL_PRODUCTS);
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveFiscalConfig(INITIAL_FISCAL_CONFIG);
    const initialCarnes = createInitialCarnes(INITIAL_CUSTOMERS);
    this.saveCarnes(initialCarnes);
    const initialSales = createInitialSales(INITIAL_PRODUCTS, INITIAL_CUSTOMERS);
    this.saveSales(initialSales);
    const initialMovements = createInitialMovements(INITIAL_PRODUCTS);
    this.saveMovements(initialMovements);
  }
}
