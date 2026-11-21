import React, { useMemo, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  PackagePlus,
  RotateCcw,
  Search,
  X,
} from 'lucide-react';
import {
  formatINR,
  generateInventoryJson,
  generateSalesCsv,
  generateThermalReceiptText,
  PRODUCT_CATEGORIES,
} from '../data/initialData';
import {
  Invoice,
  PaymentMethod,
  Product,
  ProductCategory,
  StudentReportProfile,
} from '../types/billing';

interface CatalogLedgerViewProps {
  products: Product[];
  invoices: Invoice[];
  reportProfile: StudentReportProfile;
  onRestockProduct: (sku: string, addQty: number) => void;
  onAddProduct: (product: Product) => void;
  onResetDemoData: () => void;
  onNotify: (message: string) => void;
}

export const CatalogLedgerView: React.FC<CatalogLedgerViewProps> = ({
  products,
  invoices,
  reportProfile,
  onRestockProduct,
  onAddProduct,
  onResetDemoData,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'sales'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'All' | PaymentMethod>('All');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Add Product Form State
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('Groceries');
  const [newUnit, setNewUnit] = useState('1 kg');
  const [newPrice, setNewPrice] = useState('');
  const [newGst, setNewGst] = useState<0 | 5 | 12 | 18>(5);
  const [newStock, setNewStock] = useState('20');
  const [addError, setAddError] = useState<string | null>(null);

  const metrics = useMemo(() => {
    const lowStockCount = products.filter((p) => p.stock <= 10).length;
    const grossRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalGstCollected = invoices.reduce((sum, inv) => sum + inv.totalGst, 0);
    return {
      totalSkus: products.length,
      lowStockCount,
      totalBills: invoices.length,
      grossRevenue,
      totalGstCollected,
    };
  }, [products, invoices]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesLow = !onlyLowStock || p.stock <= 10;
      const matchesQuery =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesLow && matchesQuery;
    });
  }, [products, searchQuery, onlyLowStock]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesMode = paymentFilter === 'All' || inv.paymentMethod === paymentFilter;
      const matchesQuery =
        !q ||
        inv.invoiceNo.toLowerCase().includes(q) ||
        inv.customerName.toLowerCase().includes(q) ||
        inv.customerPhone.toLowerCase().includes(q);
      return matchesMode && matchesQuery;
    });
  }, [invoices, searchQuery, paymentFilter]);

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${filename}`);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    const normalizedSku = newSku.trim().toUpperCase();
    if (!normalizedSku || !newName.trim()) {
      setAddError('SKU code and product name are required.');
      return;
    }
    if (products.some((p) => p.id.toUpperCase() === normalizedSku)) {
      setAddError(`SKU ${normalizedSku} already exists in inventory.json.`);
      return;
    }
    const price = Number(newPrice);
    const stock = parseInt(newStock, 10);
    if (Number.isNaN(price) || price <= 0) {
      setAddError('Unit price must be greater than ₹0.');
      return;
    }
    if (Number.isNaN(stock) || stock < 0) {
      setAddError('Opening stock must be a whole number (0 or higher).');
      return;
    }

    onAddProduct({
      id: normalizedSku,
      name: newName.trim(),
      category: newCategory,
      unit: newUnit.trim() || '1 pcs',
      unitPrice: Number(price.toFixed(2)),
      gstRate: newGst,
      stock,
    });
    setNewSku('');
    setNewName('');
    setNewPrice('');
    setNewStock('20');
    setShowAddForm(false);
    onNotify(`Added ${normalizedSku} (${newName.trim()}) to inventory.json.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Inventory &amp; Sales Ledger
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live data backing inventory.json and sales_history.csv across both POS and Python CLI
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              triggerDownload(
                'inventory.json',
                generateInventoryJson(products),
                'application/json'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export inventory.json
          </button>
          <button
            type="button"
            onClick={() =>
              triggerDownload(
                'sales_history.csv',
                generateSalesCsv(invoices),
                'text/csv;charset=utf-8'
              )
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export sales_history.csv
          </button>
          <button
            type="button"
            onClick={onResetDemoData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 bg-white border border-slate-300 hover:border-red-200 rounded-md whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Single-elevation 4-column summary strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-lg divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-4">
          <div className="text-xs text-slate-500">Catalog SKUs</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {metrics.totalSkus}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Stored in inventory.json</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Low / Out Stock</div>
          <div
            className={`mt-1 text-2xl font-bold font-mono tabular-nums ${
              metrics.lowStockCount > 0 ? 'text-amber-700' : 'text-emerald-700'
            }`}
          >
            {metrics.lowStockCount}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Threshold: 10 units or less</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Completed Invoices</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {metrics.totalBills}
          </div>
          <div className="mt-0.5 text-xs text-slate-500">Logged in sales_history.csv</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Gross Revenue (incl. GST)</div>
          <div className="mt-1 text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {formatINR(metrics.grossRevenue)}
          </div>
          <div className="mt-0.5 text-xs text-slate-500 font-mono tabular-nums">
            GST collected: {formatINR(metrics.totalGstCollected)}
          </div>
        </div>
      </div>

      {/* Workspace Segmented Controls + Search */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start">
            <button
              type="button"
              onClick={() => {
                setActiveTab('inventory');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Product Inventory ({products.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('sales');
                setSearchQuery('');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded whitespace-nowrap cursor-pointer transition-colors ${
                activeTab === 'sales'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales History CSV ({invoices.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'inventory'
                    ? 'Filter SKU or item name...'
                    : 'Search INV-1001 or customer...'
                }
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490] w-56"
              />
            </div>

            {activeTab === 'inventory' ? (
              <>
                <button
                  type="button"
                  onClick={() => setOnlyLowStock((prev) => !prev)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border whitespace-nowrap cursor-pointer transition-colors ${
                    onlyLowStock
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {onlyLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md whitespace-nowrap cursor-pointer"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  Add Product
                </button>
              </>
            ) : (
              <div className="inline-flex items-center gap-1 p-0.5 bg-slate-100 rounded-md">
                {(['All', 'Cash', 'UPI', 'Card'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentFilter(mode)}
                    className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                      paymentFilter === mode
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Inline Add New Product Drawer */}
        {activeTab === 'inventory' && showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            className="p-4 bg-slate-50 border-b border-slate-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                Register New Product SKU
              </h3>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              <input
                type="text"
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder="SKU (e.g. P117)"
                className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Product Name"
                className="lg:col-span-2 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newUnit}
                onChange={(e) => setNewUnit(e.target.value)}
                placeholder="Unit (500 g)"
                className="px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
              />
              <input
                type="number"
                min="1"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Price (₹)"
                className="px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
              />
              <div className="flex gap-2">
                <select
                  value={newGst}
                  onChange={(e) => setNewGst(Number(e.target.value) as 0 | 5 | 12 | 18)}
                  aria-label="GST Slab"
                  className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                >
                  <option value={0}>0% GST</option>
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                </select>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  placeholder="Stock"
                  aria-label="Opening stock"
                  className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                />
              </div>
            </div>
            {addError && <p className="text-xs font-medium text-red-700">{addError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md cursor-pointer"
              >
                Save SKU to inventory.json
              </button>
            </div>
          </form>
        )}

        {/* Data Tables */}
        {activeTab === 'inventory' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                  <th className="py-2.5 pl-4 pr-2 font-mono">SKU</th>
                  <th className="py-2.5 px-2">Product Name</th>
                  <th className="py-2.5 px-2">Category · Unit</th>
                  <th className="py-2.5 px-2 text-right">Unit Price</th>
                  <th className="py-2.5 px-2 text-right">GST</th>
                  <th className="py-2.5 px-2 text-right">Live Stock</th>
                  <th className="py-2.5 pl-2 pr-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((product) => {
                  const statusColor =
                    product.stock === 0
                      ? 'text-red-700'
                      : product.stock <= 10
                      ? 'text-amber-700'
                      : 'text-emerald-700';
                  const statusLabel =
                    product.stock === 0
                      ? 'Out of stock'
                      : product.stock <= 10
                      ? 'Low stock'
                      : 'In stock';
                  return (
                    <tr key={product.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-xs text-slate-500 tabular-nums">
                        {product.id}
                      </td>
                      <td className="py-2.5 px-2 font-medium text-slate-900">{product.name}</td>
                      <td className="py-2.5 px-2 text-xs text-slate-500">
                        {product.category} · {product.unit}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-900 tabular-nums">
                        {formatINR(product.unitPrice)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-600 tabular-nums">
                        {product.gstRate}%
                      </td>
                      <td className="py-2.5 px-2 text-right text-xs font-mono tabular-nums whitespace-nowrap">
                        <span className={`font-medium ${statusColor}`}>
                          {product.stock} · {statusLabel}
                        </span>
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            onRestockProduct(product.id, 10);
                            onNotify(`Restocked ${product.name} (+10 units).`);
                          }}
                          className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded whitespace-nowrap cursor-pointer"
                        >
                          +10 Units
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500">
                No matching invoices found in sales_history.csv.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 pl-4 pr-2 font-mono">Invoice No.</th>
                    <th className="py-2.5 px-2">Date &amp; Time</th>
                    <th className="py-2.5 px-2">Customer</th>
                    <th className="py-2.5 px-2">Channel · Mode</th>
                    <th className="py-2.5 px-2 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-right">GST</th>
                    <th className="py-2.5 px-2 text-right">Grand Total</th>
                    <th className="py-2.5 pl-2 pr-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.invoiceNo} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pl-4 pr-2 font-mono text-xs font-semibold text-[#0E7490] tabular-nums whitespace-nowrap">
                        {inv.invoiceNo}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                        {inv.timestamp}
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="font-medium text-slate-900">{inv.customerName}</div>
                        <div className="text-xs text-slate-500 font-mono">{inv.customerPhone}</div>
                      </td>
                      <td className="py-2.5 px-2 text-xs text-slate-600 whitespace-nowrap">
                        {inv.source} · {inv.paymentMethod}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatINR(inv.subtotal)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {formatINR(inv.totalGst)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-xs font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(inv)}
                          className="text-xs font-medium text-[#0E7490] hover:underline cursor-pointer"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Historical Invoice Viewer Modal */}
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Invoice Detail"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Archived Receipt · {selectedInvoice.invoiceNo}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedInvoice.customerName} · {selectedInvoice.timestamp} ·{' '}
                  {selectedInvoice.paymentMethod}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                aria-label="Close modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 bg-slate-50 max-h-[65vh] overflow-y-auto">
              <pre className="p-4 bg-white border border-slate-200 rounded-md font-mono text-[12px] leading-relaxed text-slate-900 overflow-x-auto whitespace-pre">
                {generateThermalReceiptText(
                  selectedInvoice,
                  reportProfile.storeName,
                  reportProfile.storeAddress
                )}
              </pre>
            </div>
            <div className="flex justify-end px-5 py-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
