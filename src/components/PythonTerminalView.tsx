import React, { useEffect, useRef, useState } from 'react';
import { CornerDownLeft, RotateCcw, Terminal as TerminalIcon } from 'lucide-react';
import {
  calculateBillTotals,
  formatCurrentTimestamp,
  generateThermalReceiptText,
  getNextInvoiceNo,
} from '../data/initialData';
import {
  CartItem,
  Invoice,
  PaymentMethod,
  Product,
  ProductCategory,
  StudentReportProfile,
} from '../types/billing';

interface PythonTerminalViewProps {
  products: Product[];
  invoices: Invoice[];
  reportProfile: StudentReportProfile;
  onCompleteInvoice: (invoice: Invoice) => void;
  onRestockProduct: (sku: string, addQty: number) => void;
  onAddProduct: (product: Product) => void;
  onNotify: (message: string) => void;
}

type CliStep =
  | 'MENU'
  | 'BILL_NAME'
  | 'BILL_PHONE'
  | 'BILL_SKU'
  | 'BILL_QTY'
  | 'BILL_MODE'
  | 'BILL_CASH'
  | 'RESTOCK_SKU'
  | 'RESTOCK_QTY'
  | 'NEW_NAME'
  | 'NEW_CATEGORY'
  | 'NEW_UNIT'
  | 'NEW_PRICE'
  | 'NEW_GST'
  | 'NEW_STOCK'
  | 'SEARCH_INV'
  | 'EXITED';

interface TerminalLine {
  id: number;
  kind: 'output' | 'input' | 'error' | 'success';
  text: string;
}

const MENU_BANNER = `================================================
      SHOPPING BILLING SYSTEM (01AI0302)       
================================================
  1. View Product Catalog & Stock
  2. Create New Customer Bill
  3. Add New Product / Restock Inventory
  4. View Sales History (sales_history.csv)
  5. Search Bill by Invoice Number
  6. Exit Application
================================================`;

function formatCatalogAscii(products: Product[]): string {
  const lines = [
    '==============================================================================',
    `${'SKU'.padEnd(7)} ${'PRODUCT NAME'.padEnd(30)} ${'CATEGORY'.padEnd(14)} ${'PRICE'.padStart(8)} ${'GST'.padStart(5)} ${'STOCK'.padStart(8)}`,
    '------------------------------------------------------------------------------',
  ];
  for (const p of products) {
    const flag = p.stock === 0 ? 'OUT' : p.stock <= 10 ? 'LOW' : '';
    const stockCol = `${p.stock} ${flag}`.trim();
    lines.push(
      `${p.id.padEnd(7)} ${p.name.slice(0, 29).padEnd(30)} ${p.category.padEnd(14)} ${p.unitPrice
        .toFixed(2)
        .padStart(8)} ${(p.gstRate + '%').padStart(5)} ${stockCol.padStart(8)}`
    );
  }
  lines.push('==============================================================================');
  return lines.join('\n');
}

function formatSalesHistoryAscii(invoices: Invoice[]): string {
  if (invoices.length === 0) {
    return '[Notice] No sales recorded in sales_history.csv yet.';
  }
  const lines = [
    '==================================================================================',
    `${'INVOICE'.padEnd(10)} ${'DATE & TIME'.padEnd(20)} ${'CUSTOMER'.padEnd(18)} ${'ITEMS'.padStart(5)} ${'MODE'.padEnd(6)} ${'TOTAL (Rs)'.padStart(12)}`,
    '----------------------------------------------------------------------------------',
  ];
  let totalRev = 0;
  for (const inv of invoices) {
    const qty = inv.items.reduce((s, i) => s + i.quantity, 0);
    totalRev += inv.grandTotal;
    lines.push(
      `${inv.invoiceNo.padEnd(10)} ${inv.timestamp.padEnd(20)} ${inv.customerName
        .slice(0, 17)
        .padEnd(18)} ${String(qty).padStart(5)} ${inv.paymentMethod.padEnd(6)} ${inv.grandTotal
        .toFixed(2)
        .padStart(12)}`
    );
  }
  lines.push('----------------------------------------------------------------------------------');
  lines.push(
    `Total Invoices: ${invoices.length} | Cumulative Gross Revenue: Rs. ${totalRev.toFixed(2)}`
  );
  lines.push('==================================================================================');
  return lines.join('\n');
}

export const PythonTerminalView: React.FC<PythonTerminalViewProps> = ({
  products,
  invoices,
  reportProfile,
  onCompleteInvoice,
  onRestockProduct,
  onAddProduct,
  onNotify,
}) => {
  const lineIdRef = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const nextId = () => {
    lineIdRef.current += 1;
    return lineIdRef.current;
  };

  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 1, kind: 'output', text: '$ python3 shopping_billing_system.py' },
    { id: 2, kind: 'output', text: 'Loaded inventory.json & verified sales_history.csv.' },
    { id: 3, kind: 'output', text: MENU_BANNER },
  ]);
  const [step, setStep] = useState<CliStep>('MENU');
  const [inputValue, setInputValue] = useState('');

  // Temporary interactive session buffers
  const [billCustomer, setBillCustomer] = useState('Walk-in Customer');
  const [billPhone, setBillPhone] = useState('N/A');
  const [billCart, setBillCart] = useState<CartItem[]>([]);
  const [pendingSku, setPendingSku] = useState('');
  const [pendingGrandTotal, setPendingGrandTotal] = useState(0);
  const [newProdDraft, setNewProdDraft] = useState<{
    id: string;
    name: string;
    category: ProductCategory;
    unit: string;
    unitPrice: number;
    gstRate: 0 | 5 | 12 | 18;
  }>({
    id: '',
    name: '',
    category: 'Groceries',
    unit: '1 pcs',
    unitPrice: 0,
    gstRate: 5,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const appendLines = (entries: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [...prev, ...entries.map((e) => ({ ...e, id: nextId() }))]);
  };

  const getPromptLabel = (): string => {
    switch (step) {
      case 'MENU':
        return 'Select an option (1-6): ';
      case 'BILL_NAME':
        return 'Enter Customer Name (or Walk-in): ';
      case 'BILL_PHONE':
        return 'Enter Mobile Number (optional)  : ';
      case 'BILL_SKU':
        return "Enter Product SKU to add (or 'DONE' to checkout): ";
      case 'BILL_QTY': {
        const prod = products.find((p) => p.id === pendingSku);
        const already = billCart.find((c) => c.productId === pendingSku)?.quantity ?? 0;
        const avail = prod ? prod.stock - already : 0;
        return `Enter quantity for ${prod?.name ?? pendingSku} (Avail: ${avail}): `;
      }
      case 'BILL_MODE':
        return 'Select Payment Mode [1: Cash, 2: UPI, 3: Card]: ';
      case 'BILL_CASH':
        return `Enter Cash Received (>= ${pendingGrandTotal.toFixed(2)}): `;
      case 'RESTOCK_SKU':
        return 'Enter SKU to restock or add new (e.g., P107 or P117): ';
      case 'RESTOCK_QTY': {
        const prod = products.find((p) => p.id === pendingSku);
        return `Current stock for ${prod?.name ?? pendingSku} is ${prod?.stock ?? 0}. Add qty: `;
      }
      case 'NEW_NAME':
        return 'Product Name                 : ';
      case 'NEW_CATEGORY':
        return 'Category (Groceries/Dairy/Beverages/Snacks/Personal Care/Household): ';
      case 'NEW_UNIT':
        return 'Unit (e.g., 1 kg, 500 ml)    : ';
      case 'NEW_PRICE':
        return 'Unit Price (INR)             : ';
      case 'NEW_GST':
        return 'GST Slab (0, 5, 12, or 18)   : ';
      case 'NEW_STOCK':
        return 'Opening Stock Quantity       : ';
      case 'SEARCH_INV':
        return 'Enter Invoice Number to search (e.g., INV-1001): ';
      case 'EXITED':
        return 'Process exited. Press Restart to launch again.';
    }
  };

  const finalizeCliInvoice = (mode: PaymentMethod, tendered: number) => {
    const totals = calculateBillTotals(billCart, products, null);
    const invoiceNo = getNextInvoiceNo(invoices);
    const inv: Invoice = {
      invoiceNo,
      timestamp: formatCurrentTimestamp(),
      customerName: billCustomer,
      customerPhone: billPhone,
      items: totals.lineItems,
      subtotal: totals.subtotal,
      discountPercent: totals.discountPercent,
      discountAmount: totals.discountAmount,
      taxableAmount: totals.taxableAmount,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      paymentMethod: mode,
      amountTendered: mode === 'Cash' ? tendered : totals.grandTotal,
      changeDue:
        mode === 'Cash' ? Number(Math.max(0, tendered - totals.grandTotal).toFixed(2)) : 0,
      source: 'CLI',
    };

    onCompleteInvoice(inv);
    const receipt = generateThermalReceiptText(
      inv,
      reportProfile.storeName,
      reportProfile.storeAddress
    );
    appendLines([
      { kind: 'output', text: receipt },
      {
        kind: 'success',
        text: `[Saved] Logged ${invoiceNo} in sales_history.csv and updated inventory.json.`,
      },
      { kind: 'output', text: MENU_BANNER },
    ]);
    setBillCart([]);
    setStep('MENU');
    onNotify(`CLI generated invoice ${invoiceNo} and synced live inventory.`);
  };

  const processInput = (raw: string) => {
    if (step === 'EXITED') return;
    const trimmed = raw.trim();
    const promptPrefix = getPromptLabel();
    appendLines([{ kind: 'input', text: `${promptPrefix}${trimmed}` }]);

    if (step === 'MENU') {
      if (trimmed === '1') {
        appendLines([
          { kind: 'output', text: formatCatalogAscii(products) },
          { kind: 'output', text: MENU_BANNER },
        ]);
      } else if (trimmed === '2') {
        setBillCart([]);
        setBillCustomer('Walk-in Customer');
        setBillPhone('N/A');
        appendLines([{ kind: 'output', text: formatCatalogAscii(products) }]);
        setStep('BILL_NAME');
      } else if (trimmed === '3') {
        setStep('RESTOCK_SKU');
      } else if (trimmed === '4') {
        appendLines([
          { kind: 'output', text: formatSalesHistoryAscii(invoices) },
          { kind: 'output', text: MENU_BANNER },
        ]);
      } else if (trimmed === '5') {
        setStep('SEARCH_INV');
      } else if (trimmed === '6') {
        appendLines([
          {
            kind: 'success',
            text: 'Exiting Shopping Billing System. All JSON & CSV files saved safely.',
          },
        ]);
        setStep('EXITED');
      } else {
        appendLines([
          {
            kind: 'error',
            text: '[Error] Invalid selection. Please enter a number from 1 to 6.',
          },
        ]);
      }
      return;
    }

    if (step === 'BILL_NAME') {
      setBillCustomer(trimmed || 'Walk-in Customer');
      setStep('BILL_PHONE');
      return;
    }

    if (step === 'BILL_PHONE') {
      setBillPhone(trimmed || 'N/A');
      setStep('BILL_SKU');
      return;
    }

    if (step === 'BILL_SKU') {
      const upper = trimmed.toUpperCase();
      if (upper === 'DONE') {
        if (billCart.length === 0) {
          appendLines([
            { kind: 'output', text: '[Notice] Cart is empty. Returning to main menu.' },
            { kind: 'output', text: MENU_BANNER },
          ]);
          setStep('MENU');
          return;
        }
        const totals = calculateBillTotals(billCart, products, null);
        setPendingGrandTotal(totals.grandTotal);
        appendLines([
          {
            kind: 'output',
            text: `Subtotal: Rs.${totals.subtotal.toFixed(2)} | Discount (${
              totals.discountPercent
            }%): -Rs.${totals.discountAmount.toFixed(2)}\nTotal GST: Rs.${totals.totalGst.toFixed(
              2
            )} | Grand Total Payable: Rs.${totals.grandTotal.toFixed(2)}`,
          },
        ]);
        setStep('BILL_MODE');
        return;
      }

      const prod = products.find((p) => p.id.toUpperCase() === upper);
      if (!prod) {
        appendLines([
          {
            kind: 'error',
            text: `[Error] SKU '${upper}' not found. Try P101, P105, P108, or type DONE.`,
          },
        ]);
        return;
      }
      if (prod.stock <= 0) {
        appendLines([
          { kind: 'error', text: `[Error] '${prod.name}' is currently out of stock.` },
        ]);
        return;
      }
      setPendingSku(prod.id);
      setStep('BILL_QTY');
      return;
    }

    if (step === 'BILL_QTY') {
      const qty = parseInt(trimmed, 10);
      const prod = products.find((p) => p.id === pendingSku);
      if (!prod) {
        setStep('BILL_SKU');
        return;
      }
      if (!/^\d+$/.test(trimmed) || Number.isNaN(qty) || qty <= 0) {
        appendLines([{ kind: 'error', text: '[Error] Quantity must be a positive whole number.' }]);
        return;
      }
      const already = billCart.find((c) => c.productId === prod.id)?.quantity ?? 0;
      if (qty + already > prod.stock) {
        appendLines([
          {
            kind: 'error',
            text: `[Error] Invalid quantity. Maximum available: ${prod.stock - already}`,
          },
        ]);
        return;
      }
      setBillCart((prev) => {
        const exists = prev.find((c) => c.productId === prod.id);
        if (exists) {
          return prev.map((c) =>
            c.productId === prod.id ? { ...c, quantity: c.quantity + qty } : c
          );
        }
        return [...prev, { productId: prod.id, quantity: qty }];
      });
      appendLines([{ kind: 'success', text: `[Added] ${prod.name} x ${qty} added to cart.` }]);
      setStep('BILL_SKU');
      return;
    }

    if (step === 'BILL_MODE') {
      const modeMap: Record<string, PaymentMethod> = { '1': 'Cash', '2': 'UPI', '3': 'Card' };
      const chosen = modeMap[trimmed] ?? 'Cash';
      if (chosen === 'Cash') {
        setStep('BILL_CASH');
      } else {
        finalizeCliInvoice(chosen, pendingGrandTotal);
      }
      return;
    }

    if (step === 'BILL_CASH') {
      const cash = Number(trimmed);
      if (Number.isNaN(cash) || cash < pendingGrandTotal) {
        appendLines([
          {
            kind: 'error',
            text: `[Error] Cash received must be >= ${pendingGrandTotal.toFixed(2)}.`,
          },
        ]);
        return;
      }
      finalizeCliInvoice('Cash', cash);
      return;
    }

    if (step === 'RESTOCK_SKU') {
      const upper = trimmed.toUpperCase();
      if (!upper) {
        appendLines([{ kind: 'error', text: '[Error] SKU cannot be empty.' }]);
        return;
      }
      const existing = products.find((p) => p.id.toUpperCase() === upper);
      if (existing) {
        setPendingSku(existing.id);
        setStep('RESTOCK_QTY');
      } else {
        setNewProdDraft({
          id: upper,
          name: '',
          category: 'Groceries',
          unit: '1 pcs',
          unitPrice: 0,
          gstRate: 5,
        });
        setStep('NEW_NAME');
      }
      return;
    }

    if (step === 'RESTOCK_QTY') {
      const addQty = parseInt(trimmed, 10);
      const prod = products.find((p) => p.id === pendingSku);
      if (!prod || !/^\d+$/.test(trimmed) || addQty <= 0) {
        appendLines([{ kind: 'error', text: '[Error] Enter a valid positive integer quantity.' }]);
        return;
      }
      onRestockProduct(prod.id, addQty);
      appendLines([
        {
          kind: 'success',
          text: `[Updated] ${prod.name} (${prod.id}) stock is now ${prod.stock + addQty}. Saved to inventory.json.`,
        },
        { kind: 'output', text: MENU_BANNER },
      ]);
      onNotify(`Restocked ${prod.name} (+${addQty}) via Python CLI.`);
      setStep('MENU');
      return;
    }

    if (step === 'NEW_NAME') {
      if (!trimmed) {
        appendLines([{ kind: 'error', text: '[Error] Product name is required.' }]);
        return;
      }
      setNewProdDraft((d) => ({ ...d, name: trimmed }));
      setStep('NEW_CATEGORY');
      return;
    }

    if (step === 'NEW_CATEGORY') {
      const validCats: ProductCategory[] = [
        'Groceries',
        'Dairy',
        'Beverages',
        'Snacks',
        'Personal Care',
        'Household',
      ];
      const matched =
        validCats.find((c) => c.toLowerCase() === trimmed.toLowerCase()) ?? 'Groceries';
      setNewProdDraft((d) => ({ ...d, category: matched }));
      setStep('NEW_UNIT');
      return;
    }

    if (step === 'NEW_UNIT') {
      setNewProdDraft((d) => ({ ...d, unit: trimmed || '1 pcs' }));
      setStep('NEW_PRICE');
      return;
    }

    if (step === 'NEW_PRICE') {
      const price = Number(trimmed);
      if (Number.isNaN(price) || price <= 0) {
        appendLines([{ kind: 'error', text: '[Error] Unit price must be a positive number.' }]);
        return;
      }
      setNewProdDraft((d) => ({ ...d, unitPrice: price }));
      setStep('NEW_GST');
      return;
    }

    if (step === 'NEW_GST') {
      const gst = parseInt(trimmed, 10);
      if (![0, 5, 12, 18].includes(gst)) {
        appendLines([{ kind: 'error', text: '[Error] GST slab must be 0, 5, 12, or 18.' }]);
        return;
      }
      setNewProdDraft((d) => ({ ...d, gstRate: gst as 0 | 5 | 12 | 18 }));
      setStep('NEW_STOCK');
      return;
    }

    if (step === 'NEW_STOCK') {
      const stock = parseInt(trimmed, 10);
      if (!/^\d+$/.test(trimmed) || stock < 0) {
        appendLines([{ kind: 'error', text: '[Error] Opening stock must be a whole number >= 0.' }]);
        return;
      }
      const created: Product = { ...newProdDraft, stock };
      onAddProduct(created);
      appendLines([
        {
          kind: 'success',
          text: `[Created] New product ${created.id} (${created.name}) saved to inventory.json.`,
        },
        { kind: 'output', text: MENU_BANNER },
      ]);
      onNotify(`Added SKU ${created.id} (${created.name}) via Python CLI.`);
      setStep('MENU');
      return;
    }

    if (step === 'SEARCH_INV') {
      const upper = trimmed.toUpperCase();
      const found = invoices.find((inv) => inv.invoiceNo.toUpperCase() === upper);
      if (!found) {
        appendLines([
          {
            kind: 'error',
            text: `[Notice] Invoice '${upper}' was not found in sales_history.csv.`,
          },
          { kind: 'output', text: MENU_BANNER },
        ]);
      } else {
        const receipt = generateThermalReceiptText(
          found,
          reportProfile.storeName,
          reportProfile.storeAddress
        );
        appendLines([
          { kind: 'success', text: `--- Matching Record Found in sales_history.csv (${found.invoiceNo}) ---` },
          { kind: 'output', text: receipt },
          { kind: 'output', text: MENU_BANNER },
        ]);
      }
      setStep('MENU');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processInput(inputValue);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleRestart = () => {
    setStep('MENU');
    setBillCart([]);
    setInputValue('');
    setLines([
      { id: nextId(), kind: 'output', text: '$ python3 shopping_billing_system.py' },
      { id: nextId(), kind: 'output', text: 'Reloaded inventory.json & sales_history.csv.' },
      { id: nextId(), kind: 'output', text: MENU_BANNER },
    ]);
    inputRef.current?.focus();
  };

  const quickActions: { label: string; value: string }[] =
    step === 'MENU'
      ? [
          { label: '1 · View Catalog', value: '1' },
          { label: '2 · New Bill', value: '2' },
          { label: '3 · Restock / Add', value: '3' },
          { label: '4 · Sales CSV', value: '4' },
          { label: '5 · Search Invoice', value: '5' },
        ]
      : step === 'BILL_SKU'
      ? [
          { label: 'SKU: P101 (Rice)', value: 'P101' },
          { label: 'SKU: P106 (Butter)', value: 'P106' },
          { label: 'SKU: P109 (Coffee)', value: 'P109' },
          { label: 'DONE (Checkout)', value: 'DONE' },
        ]
      : step === 'BILL_QTY'
      ? [
          { label: 'Qty: 1', value: '1' },
          { label: 'Qty: 2', value: '2' },
          { label: 'Qty: 3', value: '3' },
        ]
      : step === 'BILL_MODE'
      ? [
          { label: '1 · Cash', value: '1' },
          { label: '2 · UPI', value: '2' },
          { label: '3 · Card', value: '3' },
        ]
      : step === 'SEARCH_INV'
      ? invoices.slice(0, 3).map((inv) => ({ label: inv.invoiceNo, value: inv.invoiceNo }))
      : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Interactive Python Terminal Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Live console execution of shopping_billing_system.py · Directly synced with your POS inventory and CSV sales ledger
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestart}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restart Session
        </button>
      </div>

      <div className="bg-[#0F172A] border border-slate-800 rounded-lg overflow-hidden shadow-sm">
        {/* Console Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>python3 shopping_billing_system.py</span>
          </div>
          <span className="text-slate-400 tabular-nums">
            inventory.json ({products.length} SKUs) · sales_history.csv ({invoices.length} rows)
          </span>
        </div>

        {/* Scrollable Console Buffer */}
        <div
          onClick={() => inputRef.current?.focus()}
          className="p-4 h-[460px] overflow-y-auto font-mono text-[12.5px] leading-relaxed tracking-[0.01em] space-y-2"
        >
          {lines.map((entry) => (
            <pre
              key={entry.id}
              className={`whitespace-pre-wrap break-words ${
                entry.kind === 'input'
                  ? 'text-cyan-300 font-medium'
                  : entry.kind === 'error'
                  ? 'text-red-400'
                  : entry.kind === 'success'
                  ? 'text-emerald-400'
                  : 'text-slate-200'
              }`}
            >
              {entry.text}
            </pre>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick-Fill Viva Shortcuts */}
        {quickActions.length > 0 && (
          <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap shrink-0">
              Quick input:
            </span>
            {quickActions.map((act) => (
              <button
                key={act.label}
                type="button"
                onClick={() => {
                  processInput(act.value);
                  inputRef.current?.focus();
                }}
                className="px-2.5 py-1 text-xs font-mono text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded whitespace-nowrap shrink-0 transition-colors cursor-pointer"
              >
                {act.label}
              </button>
            ))}
          </div>
        )}

        {/* Interactive Stdin Prompt */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 px-4 py-3 bg-slate-950 border-t border-slate-800"
        >
          <span className="font-mono text-xs text-cyan-400 whitespace-nowrap shrink-0">
            {getPromptLabel()}
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={step === 'EXITED'}
            placeholder={step === 'EXITED' ? 'Session ended' : 'Type input and press Enter...'}
            aria-label="Python terminal input"
            className="flex-1 min-w-0 bg-transparent text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={step === 'EXITED'}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0E7490] hover:bg-[#155E75] disabled:opacity-40 rounded whitespace-nowrap shrink-0 cursor-pointer"
          >
            Enter
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
