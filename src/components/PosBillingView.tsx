import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  calculateBillTotals,
  formatCurrentTimestamp,
  formatINR,
  generateThermalReceiptText,
  getNextInvoiceNo,
  PRODUCT_CATEGORIES,
} from '../data/initialData';
import {
  CartItem,
  Invoice,
  PaymentMethod,
  Product,
  ProductCategory,
  StudentReportProfile,
} from '../types/billing';

interface PosBillingViewProps {
  products: Product[];
  invoices: Invoice[];
  reportProfile: StudentReportProfile;
  onCompleteInvoice: (invoice: Invoice) => void;
  onNotify: (message: string) => void;
}

export const PosBillingView: React.FC<PosBillingViewProps> = ({
  products,
  invoices,
  reportProfile,
  onCompleteInvoice,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [cart, setCart] = useState<CartItem[]>([
    { productId: 'P101', quantity: 2 },
    { productId: 'P106', quantity: 1 },
  ]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [discountMode, setDiscountMode] = useState<'auto' | 'manual'>('auto');
  const [manualDiscount, setManualDiscount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<Invoice | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const billSummary = useMemo(
    () =>
      calculateBillTotals(
        cart,
        products,
        discountMode === 'manual' ? manualDiscount : null
      ),
    [cart, products, discountMode, manualDiscount]
  );

  const cartMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of cart) map.set(item.productId, item.quantity);
    return map;
  }, [cart]);

  const parsedTender = Number(cashTendered);
  const liveChangeDue =
    paymentMethod === 'Cash' && !Number.isNaN(parsedTender) && parsedTender >= billSummary.grandTotal
      ? Number((parsedTender - billSummary.grandTotal).toFixed(2))
      : 0;

  const handleAddToCart = (product: Product) => {
    setFormError(null);
    const currentQty = cartMap.get(product.id) ?? 0;
    if (product.stock <= 0) {
      setFormError(`${product.name} is currently out of stock.`);
      return;
    }
    if (currentQty >= product.stock) {
      setFormError(`Only ${product.stock} units of ${product.name} available in stock.`);
      return;
    }
    setCart((prev) => {
      const exists = prev.find((i) => i.productId === product.id);
      if (exists) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product.id, quantity: 1 }];
    });
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setFormError(null);
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((i) => i.productId !== productId);
      }
      if (nextQty > product.stock) {
        setFormError(`Stock cap reached for ${product.name} (${product.stock} available).`);
        return prev;
      }
      return prev.map((i) =>
        i.productId === productId ? { ...i, quantity: nextQty } : i
      );
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
    setFormError(null);
    setCashTendered('');
  };

  const handleGenerateBill = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (billSummary.lineItems.length === 0) {
      setFormError('Add at least one item to the cart before generating a bill.');
      return;
    }

    for (const line of billSummary.lineItems) {
      const product = products.find((p) => p.id === line.productId);
      if (!product || line.quantity > product.stock) {
        setFormError(`Insufficient stock for ${line.name}. Please adjust quantity.`);
        return;
      }
    }

    let tendered = billSummary.grandTotal;
    if (paymentMethod === 'Cash') {
      if (cashTendered.trim() !== '') {
        const numericCash = Number(cashTendered);
        if (Number.isNaN(numericCash) || numericCash < billSummary.grandTotal) {
          setFormError(
            `Cash received must be at least ${formatINR(billSummary.grandTotal)}.`
          );
          return;
        }
        tendered = Number(numericCash.toFixed(2));
      }
    }

    const invoiceNo = getNextInvoiceNo(invoices);
    const newInvoice: Invoice = {
      invoiceNo,
      timestamp: formatCurrentTimestamp(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || 'N/A',
      items: billSummary.lineItems,
      subtotal: billSummary.subtotal,
      discountPercent: billSummary.discountPercent,
      discountAmount: billSummary.discountAmount,
      taxableAmount: billSummary.taxableAmount,
      totalGst: billSummary.totalGst,
      grandTotal: billSummary.grandTotal,
      paymentMethod,
      amountTendered: tendered,
      changeDue: Number(Math.max(0, tendered - billSummary.grandTotal).toFixed(2)),
      source: 'POS',
    };

    onCompleteInvoice(newInvoice);
    setActiveReceipt(newInvoice);
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCashTendered('');
    onNotify(`Invoice ${invoiceNo} generated and saved to sales ledger.`);
  };

  const receiptText = activeReceipt
    ? generateThermalReceiptText(
        activeReceipt,
        reportProfile.storeName,
        reportProfile.storeAddress
      )
    : '';

  const handleCopyReceipt = async () => {
    if (!receiptText) return;
    try {
      await navigator.clipboard.writeText(receiptText);
      setCopiedReceipt(true);
      onNotify(`Receipt ${activeReceipt?.invoiceNo} copied to clipboard.`);
      setTimeout(() => setCopiedReceipt(false), 1800);
    } catch {
      onNotify('Clipboard copy blocked in this browser context.');
    }
  };

  const handleDownloadReceipt = () => {
    if (!activeReceipt || !receiptText) return;
    const blob = new Blob([receiptText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeReceipt.invoiceNo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${activeReceipt.invoiceNo}.txt`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Retail POS Billing Counter
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live demonstration of {reportProfile.storeName} checkout · Auto-tiered discount (5% over ₹1,000, 10% over ₹2,500) · Item-wise CGST/SGST
          </p>
        </div>
        <div className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap shrink-0">
          Next Invoice: {getNextInvoiceNo(invoices)} · Active SKUs: {products.length}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Catalog Pane */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by SKU (e.g. P101), product name, or category..."
                aria-label="Search retail catalog"
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/15 transition-colors"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {(['All', ...PRODUCT_CATEGORIES] as const).map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-medium text-slate-900">No matching products found</p>
              <p className="mt-1 text-xs text-slate-500">
                Try clearing your search filter or switching back to all categories.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-500">
                    <th className="py-2.5 pl-4 pr-2 font-mono">SKU</th>
                    <th className="py-2.5 px-2">Item &amp; Category</th>
                    <th className="py-2.5 px-2 text-right">Rate</th>
                    <th className="py-2.5 px-2 text-right">GST</th>
                    <th className="py-2.5 px-2 text-right">Stock</th>
                    <th className="py-2.5 pl-2 pr-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map((product) => {
                    const qtyInCart = cartMap.get(product.id) ?? 0;
                    const isOut = product.stock === 0;
                    const isLow = product.stock > 0 && product.stock <= 10;

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                          {product.id}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="font-medium text-slate-900 leading-snug">
                            {product.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            {product.category} · {product.unit}
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-xs font-medium text-slate-900 tabular-nums whitespace-nowrap">
                          {formatINR(product.unitPrice)}
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                          {product.gstRate}%
                        </td>
                        <td className="py-2.5 px-2 text-right text-xs tabular-nums whitespace-nowrap">
                          <span
                            className={`font-medium ${
                              isOut
                                ? 'text-red-700'
                                : isLow
                                ? 'text-amber-700'
                                : 'text-emerald-700'
                            }`}
                          >
                            {isOut
                              ? '0 · Out'
                              : isLow
                              ? `${product.stock} · Low`
                              : `${product.stock} · OK`}
                          </span>
                        </td>
                        <td className="py-2.5 pl-2 pr-4 text-right whitespace-nowrap">
                          {qtyInCart > 0 ? (
                            <div className="inline-flex items-center border border-slate-300 rounded-md overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(product.id, -1)}
                                aria-label={`Decrease quantity of ${product.name}`}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-2 text-xs font-mono font-semibold text-slate-900 tabular-nums">
                                {qtyInCart}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(product.id, 1)}
                                aria-label={`Increase quantity of ${product.name}`}
                                disabled={qtyInCart >= product.stock}
                                className="px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddToCart(product)}
                              disabled={isOut}
                              className="px-3 py-1.5 text-xs font-medium text-[#0E7490] hover:text-white bg-cyan-50/70 hover:bg-[#0E7490] border border-cyan-200/80 hover:border-[#0E7490] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer"
                            >
                              Add
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Right Checkout Cart Panel */}
        <section className="xl:col-span-5 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Active Customer Bill</h2>
              <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                {billSummary.lineItems.reduce((sum, i) => sum + i.quantity, 0)} units across{' '}
                {billSummary.lineItems.length} line items
              </p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear Cart
              </button>
            )}
          </div>

          <form onSubmit={handleGenerateBill} className="space-y-4">
            {/* Customer Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Walk-in Customer"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Optional 10-digit no."
                  className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
                />
              </div>
            </div>

            {/* Cart Items List */}
            <div className="border-y border-slate-200 py-3">
              {billSummary.lineItems.length === 0 ? (
                <div className="py-8 text-center">
                  <ShoppingBag className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">Billing cart is empty</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Click Add beside any catalog product to start billing.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {billSummary.lineItems.map((line) => (
                    <div
                      key={line.productId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 truncate">
                          {line.name}
                        </div>
                        <div className="text-xs text-slate-500 font-mono tabular-nums">
                          {line.quantity} × {formatINR(line.unitPrice)} · GST {line.gstRate}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                          {formatINR(line.lineTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(line.productId)}
                          aria-label={`Remove ${line.name}`}
                          className="p-1 text-slate-400 hover:text-red-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Discount & Payment Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700">Discount Policy</label>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setDiscountMode('auto')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        discountMode === 'auto'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => setDiscountMode('manual')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer ${
                        discountMode === 'manual'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
                {discountMode === 'auto' ? (
                  <div className="px-3 py-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md tabular-nums">
                    Auto-tier active: <strong className="text-slate-900">{billSummary.discountPercent}%</strong>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={25}
                      step={1}
                      value={manualDiscount}
                      onChange={(e) => setManualDiscount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
                    />
                    <span className="text-xs text-slate-500 font-mono">%</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-md">
                  {(['Cash', 'UPI', 'Card'] as PaymentMethod[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-1 text-xs font-medium rounded whitespace-nowrap transition-colors cursor-pointer ${
                        paymentMethod === mode
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {paymentMethod === 'Cash' && (
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cash Tendered (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    placeholder={billSummary.grandTotal.toFixed(2)}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
                  />
                </div>
                <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="text-[11px] text-slate-500">Change Due</div>
                  <div className="text-sm font-mono font-semibold text-slate-900 tabular-nums">
                    {formatINR(liveChangeDue)}
                  </div>
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="space-y-1.5 pt-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatINR(billSummary.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount ({billSummary.discountPercent}%)</span>
                <span className="font-mono tabular-nums text-emerald-700">
                  − {formatINR(billSummary.discountAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST + SGST (Item-wise)</span>
                <span className="font-mono tabular-nums">{formatINR(billSummary.totalGst)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200 text-slate-900">
                <span className="font-semibold">Grand Total Payable</span>
                <span className="text-xl font-bold font-mono tabular-nums">
                  {formatINR(billSummary.grandTotal)}
                </span>
              </div>
            </div>

            {formError && (
              <div
                role="alert"
                className="px-3 py-2 text-xs font-medium text-red-800 bg-red-50 border border-red-200 rounded-md"
              >
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={billSummary.lineItems.length === 0}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap cursor-pointer"
            >
              Generate Tax Invoice &amp; Deduct Stock
            </button>
          </form>
        </section>
      </div>

      {/* Generated Thermal Receipt Modal */}
      {activeReceipt && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Generated Retail Receipt"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-xl w-full overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Tax Invoice Generated · {activeReceipt.invoiceNo}
                </h3>
                <p className="text-xs text-slate-500">
                  Stock updated in inventory.json · Logged in sales_history.csv
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                aria-label="Close receipt modal"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 max-h-[65vh] overflow-y-auto">
              <pre className="p-4 bg-white border border-slate-200 rounded-md font-mono text-[12px] leading-relaxed text-slate-900 overflow-x-auto whitespace-pre">
                {receiptText}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-slate-200 bg-white">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap cursor-pointer"
                >
                  {copiedReceipt ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedReceipt ? 'Copied' : 'Copy Text'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .txt
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print
                </button>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md whitespace-nowrap cursor-pointer"
              >
                Start Next Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
