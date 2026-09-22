import React, { useState, useEffect, useCallback } from 'react';
import {
  Carne,
  Customer,
  FiscalConfig,
  FiscalInvoice,
  PaymentMethod,
  Product,
  Sale,
  SegmentType,
  StockMovement,
} from './types';
import { StorageService } from './services/storage';
import { FiscalService } from './services/fiscal';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PDVView } from './components/PDV/PDVView';
import { InventoryView } from './components/Inventory/InventoryView';
import { CarneView } from './components/Carne/CarneView';
import { CarnePrintModal } from './components/Carne/CarnePrintModal';
import { SalesHistoryView } from './components/Sales/SalesHistoryView';
import { FiscalView } from './components/Fiscal/FiscalView';
import { CustomersView } from './components/Customers/CustomersView';
import { DatabaseBackupModal } from './components/Backup/DatabaseBackupModal';

export function App() {
  const [currentTab, setCurrentTab] = useState<ActiveTab>('dashboard');
  const [activeSegment, setActiveSegment] = useState<SegmentType>('geral');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Core application entities loaded from persistence
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [carnes, setCarnes] = useState<Carne[]>([]);
  const [invoices, setInvoices] = useState<FiscalInvoice[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [fiscalConfig, setFiscalConfig] = useState<FiscalConfig>(
    StorageService.getFiscalConfig()
  );

  // Carnê modal for direct printing
  const [carneToPrint, setCarneToPrint] = useState<Carne | null>(null);

  // Sync state from StorageService
  const refreshData = useCallback(() => {
    setProducts(StorageService.getProducts());
    setCustomers(StorageService.getCustomers());
    setSales(StorageService.getSales());
    setCarnes(StorageService.getCarnes());
    setInvoices(StorageService.getInvoices());
    setMovements(StorageService.getStockMovements());
    setFiscalConfig(StorageService.getFiscalConfig());
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Handler: Stock adjustment (manual entry / exit)
  const handleAdjustStock = (
    productId: string,
    delta: number,
    type: any,
    reason: string,
    referenceDoc?: string
  ) => {
    StorageService.adjustStock(productId, delta, type, reason, referenceDoc);
    refreshData();
  };

  // Handler: Add new product
  const handleAddProduct = (productData: any) => {
    StorageService.addProduct(productData);
    refreshData();
  };

  // Handler: Update product
  const handleUpdateProduct = (id: string, updates: any) => {
    StorageService.updateProduct(id, updates);
    refreshData();
  };

  // Handler: Delete product
  const handleDeleteProduct = (id: string) => {
    StorageService.deleteProduct(id);
    refreshData();
  };

  // Handler: Pay Carne Installment
  const handlePayInstallment = (
    carneId: string,
    installmentId: string,
    paidAmount: number,
    notes?: string
  ) => {
    StorageService.payCarneInstallment(carneId, installmentId, paidAmount, notes);
    refreshData();
  };

  // Handler: Create manual standalone Carne
  const handleCreateCarneManual = (
    customerId: string,
    totalAmount: number,
    installmentsCount: number,
    firstDueDate: string,
    notes?: string
  ) => {
    const newCarne = StorageService.createCarneDirect(
      customerId,
      totalAmount,
      installmentsCount,
      firstDueDate,
      notes
    );
    refreshData();
    setCarneToPrint(newCarne);
  };

  // Handler: Add Customer
  const handleAddCustomer = (customerData: any) => {
    StorageService.addCustomer(customerData);
    refreshData();
  };

  // Handler: Update Customer
  const handleUpdateCustomer = (id: string, updates: any) => {
    StorageService.updateCustomer(id, updates);
    refreshData();
  };

  // Handler: Save Fiscal Config
  const handleSaveFiscalConfig = (newConfig: FiscalConfig) => {
    StorageService.saveFiscalConfig(newConfig);
    refreshData();
  };

  // Handler: Cancel / Refund Sale
  const handleCancelSale = (saleId: string) => {
    StorageService.cancelSale(saleId);
    refreshData();
  };

  // Handler: Reset to Demo Data
  const handleResetData = () => {
    StorageService.resetToDemoData();
    refreshData();
  };

  // Low stock counter for badge
  const lowStockCount = products.filter((p) => p.currentStock <= p.minStock).length;

  // Overdue installments counter for badge
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueInstallmentsCount = carnes
    .flatMap((c) => c.installments)
    .filter((i) => i.status !== 'paga' && i.dueDate < todayStr).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeSegment={activeSegment}
        onChangeSegment={setActiveSegment}
        lowStockCount={lowStockCount}
        overdueInstallmentsCount={overdueInstallmentsCount}
        onResetData={handleResetData}
        onOpenBackup={() => setIsBackupModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {currentTab === 'dashboard' && (
          <DashboardView
            sales={sales}
            products={products}
            carnes={carnes}
            customers={customers}
            fiscalConfig={fiscalConfig}
            activeSegment={activeSegment}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === 'pdv' && (
          <PDVView
            products={products}
            customers={customers}
            fiscalConfig={fiscalConfig}
            activeSegment={activeSegment}
            onRefreshData={refreshData}
            onOpenCarnePrint={(carne) => setCarneToPrint(carne)}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            products={products}
            movements={movements}
            activeSegment={activeSegment}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
          />
        )}

        {currentTab === 'carne' && (
          <CarneView
            carnes={carnes}
            customers={customers}
            fiscalConfig={fiscalConfig}
            onPayInstallment={handlePayInstallment}
            onCreateCarneManual={handleCreateCarneManual}
            onOpenCarnePrintModal={(carne) => setCarneToPrint(carne)}
          />
        )}

        {currentTab === 'sales' && (
          <SalesHistoryView
            sales={sales}
            invoices={invoices}
            fiscalConfig={fiscalConfig}
            onOpenCarnePrint={(carne) => setCarneToPrint(carne)}
            onCancelSale={handleCancelSale}
          />
        )}

        {currentTab === 'fiscal' && (
          <FiscalView
            invoices={invoices}
            sales={sales}
            config={fiscalConfig}
            onSaveConfig={handleSaveFiscalConfig}
            onRefreshData={refreshData}
            onOpenCarnePrint={(carne) => setCarneToPrint(carne)}
          />
        )}

        {currentTab === 'customers' && (
          <CustomersView
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}
      </main>

      {/* Global Printable Carnê Modal */}
      {carneToPrint && (
        <CarnePrintModal
          isOpen={!!carneToPrint}
          onClose={() => setCarneToPrint(null)}
          carne={carneToPrint}
          fiscalConfig={fiscalConfig}
        />
      )}

      {/* Database Backup & Restore Modal */}
      <DatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        onRefreshData={refreshData}
      />
    </div>
  );
}

export default App;
