import {
  CartItem,
  Invoice,
  InvoiceLineItem,
  PaymentMethod,
  Product,
  ProductCategory,
  StudentReportProfile,
} from '../types/billing';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Groceries',
  'Dairy',
  'Beverages',
  'Snacks',
  'Personal Care',
  'Household',
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'P101', name: 'Basmati Rice Premium', category: 'Groceries', unitPrice: 145, gstRate: 5, stock: 42, unit: '1 kg' },
  { id: 'P102', name: 'Whole Wheat Atta', category: 'Groceries', unitPrice: 260, gstRate: 0, stock: 30, unit: '5 kg' },
  { id: 'P103', name: 'Cold-Pressed Sunflower Oil', category: 'Groceries', unitPrice: 175, gstRate: 5, stock: 26, unit: '1 L' },
  { id: 'P104', name: 'Toor Dal Unpolished', category: 'Groceries', unitPrice: 168, gstRate: 0, stock: 18, unit: '1 kg' },
  { id: 'P105', name: 'Amul Taaza Toned Milk', category: 'Dairy', unitPrice: 54, gstRate: 0, stock: 50, unit: '1 L' },
  { id: 'P106', name: 'Salted Table Butter', category: 'Dairy', unitPrice: 285, gstRate: 12, stock: 14, unit: '500 g' },
  { id: 'P107', name: 'Fresh Malai Paneer', category: 'Dairy', unitPrice: 95, gstRate: 5, stock: 8, unit: '200 g' },
  { id: 'P108', name: 'Assam CTC Leaf Tea', category: 'Beverages', unitPrice: 240, gstRate: 5, stock: 24, unit: '500 g' },
  { id: 'P109', name: 'Arabica Instant Coffee', category: 'Beverages', unitPrice: 320, gstRate: 18, stock: 16, unit: '200 g' },
  { id: 'P110', name: 'Mixed Fruit Juice', category: 'Beverages', unitPrice: 110, gstRate: 12, stock: 34, unit: '1 L' },
  { id: 'P111', name: 'Multigrain Digestive Biscuits', category: 'Snacks', unitPrice: 65, gstRate: 18, stock: 40, unit: '400 g' },
  { id: 'P112', name: 'Roasted Salted Almonds', category: 'Snacks', unitPrice: 290, gstRate: 12, stock: 9, unit: '250 g' },
  { id: 'P113', name: 'Herbal Bath Soap (Pack of 4)', category: 'Personal Care', unitPrice: 160, gstRate: 18, stock: 28, unit: '4 pcs' },
  { id: 'P114', name: 'Mint Gel Toothpaste', category: 'Personal Care', unitPrice: 115, gstRate: 18, stock: 22, unit: '150 g' },
  { id: 'P115', name: 'Liquid Laundry Detergent', category: 'Household', unitPrice: 235, gstRate: 18, stock: 19, unit: '1 L' },
  { id: 'P116', name: 'Lemon Dishwash Gel', category: 'Household', unitPrice: 125, gstRate: 18, stock: 6, unit: '500 ml' },
];

export const DEFAULT_REPORT_PROFILE: StudentReportProfile = {
  studentName: 'Aarav Patel',
  enrollmentNo: '24010101042',
  division: '3CE-AI-A (Batch A2)',
  semester: 'Semester 3',
  academicYear: '2026–2027',
  facultyName: 'Prof. N. K. Mehta',
  storeName: 'Campus Fresh Mart',
  storeAddress: 'Rajkot–Morbi Highway, Marwadi Campus Road, Rajkot, Gujarat',
  submissionDate: '2026-11-19',
};

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPlainNumber(amount: number): string {
  return amount.toFixed(2);
}

export function computeAutoDiscountPercent(subtotal: number): number {
  if (subtotal >= 2500) return 10;
  if (subtotal >= 1000) return 5;
  return 0;
}

export function calculateBillTotals(
  cartItems: CartItem[],
  products: Product[],
  manualDiscountPercent: number | null
): {
  lineItems: InvoiceLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  totalGst: number;
  grandTotal: number;
} {
  const lineItems: InvoiceLineItem[] = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity <= 0) continue;
    const lineSubtotal = Number((product.unitPrice * item.quantity).toFixed(2));
    subtotal = Number((subtotal + lineSubtotal).toFixed(2));
    lineItems.push({
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: item.quantity,
      unitPrice: product.unitPrice,
      gstRate: product.gstRate,
      lineSubtotal,
      lineGst: 0,
      lineTotal: lineSubtotal,
    });
  }

  const discountPercent =
    manualDiscountPercent !== null
      ? Math.max(0, Math.min(25, manualDiscountPercent))
      : computeAutoDiscountPercent(subtotal);

  const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
  const discountFactor = subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;

  let totalGst = 0;
  for (const line of lineItems) {
    const discountedBase = line.lineSubtotal * discountFactor;
    const lineGst = Number(((discountedBase * line.gstRate) / 100).toFixed(2));
    line.lineGst = lineGst;
    line.lineTotal = Number((discountedBase + lineGst).toFixed(2));
    totalGst = Number((totalGst + lineGst).toFixed(2));
  }

  const taxableAmount = Number((subtotal - discountAmount).toFixed(2));
  const grandTotal = Number((taxableAmount + totalGst).toFixed(2));

  return {
    lineItems,
    subtotal,
    discountPercent,
    discountAmount,
    taxableAmount,
    totalGst,
    grandTotal,
  };
}

function buildSeedInvoice(
  invoiceNo: string,
  timestamp: string,
  customerName: string,
  customerPhone: string,
  cart: CartItem[],
  paymentMethod: PaymentMethod,
  amountTendered: number,
  source: 'POS' | 'CLI'
): Invoice {
  const totals = calculateBillTotals(cart, INITIAL_PRODUCTS, null);
  const tendered = paymentMethod === 'Cash' ? amountTendered : totals.grandTotal;
  const changeDue = Number(Math.max(0, tendered - totals.grandTotal).toFixed(2));

  return {
    invoiceNo,
    timestamp,
    customerName,
    customerPhone,
    items: totals.lineItems,
    subtotal: totals.subtotal,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    taxableAmount: totals.taxableAmount,
    totalGst: totals.totalGst,
    grandTotal: totals.grandTotal,
    paymentMethod,
    amountTendered: tendered,
    changeDue,
    source,
  };
}

export const INITIAL_INVOICES: Invoice[] = [
  buildSeedInvoice(
    'INV-1001',
    '2026-11-18 10:15:22',
    'Rohan Sharma',
    '9876543210',
    [
      { productId: 'P101', quantity: 2 },
      { productId: 'P103', quantity: 2 },
      { productId: 'P106', quantity: 1 },
      { productId: 'P108', quantity: 1 },
    ],
    'UPI',
    0,
    'POS'
  ),
  buildSeedInvoice(
    'INV-1002',
    '2026-11-18 14:42:08',
    'Priya Joshi',
    '9825011223',
    [
      { productId: 'P102', quantity: 2 },
      { productId: 'P109', quantity: 2 },
      { productId: 'P112', quantity: 2 },
      { productId: 'P115', quantity: 2 },
      { productId: 'P101', quantity: 3 },
    ],
    'Cash',
    3000,
    'CLI'
  ),
  buildSeedInvoice(
    'INV-1003',
    '2026-11-19 09:20:45',
    'Karan Jadeja',
    '9909876543',
    [
      { productId: 'P105', quantity: 4 },
      { productId: 'P107', quantity: 2 },
      { productId: 'P111', quantity: 3 },
    ],
    'Card',
    0,
    'POS'
  ),
];

export function getNextInvoiceNo(invoices: Invoice[]): string {
  let maxNum = 1000;
  for (const inv of invoices) {
    const match = inv.invoiceNo.match(/INV-(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }
  return `INV-${maxNum + 1}`;
}

export function formatCurrentTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours()
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function generateSalesCsv(invoices: Invoice[]): string {
  const header =
    'invoice_no,timestamp,customer_name,customer_phone,item_count,subtotal,discount_percent,discount_amount,total_gst,grand_total,payment_method';
  const rows = invoices.map((inv) => {
    const safeName = `"${inv.customerName.replace(/"/g, '""')}"`;
    const itemCount = inv.items.reduce((sum, item) => sum + item.quantity, 0);
    return [
      inv.invoiceNo,
      inv.timestamp,
      safeName,
      inv.customerPhone,
      itemCount,
      inv.subtotal.toFixed(2),
      inv.discountPercent,
      inv.discountAmount.toFixed(2),
      inv.totalGst.toFixed(2),
      inv.grandTotal.toFixed(2),
      inv.paymentMethod,
    ].join(',');
  });
  return [header, ...rows].join('\n');
}

export function generateInventoryJson(products: Product[]): string {
  const mapped = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    unit: p.unit,
    price: p.unitPrice,
    gst_rate: p.gstRate,
    stock: p.stock,
  }));
  return JSON.stringify(mapped, null, 2);
}

export function generateThermalReceiptText(
  invoice: Invoice,
  storeName: string,
  storeAddress: string
): string {
  const width = 54;
  const line = '='.repeat(width);
  const dash = '-'.repeat(width);
  const center = (txt: string) => {
    const clipped = txt.slice(0, width);
    const pad = Math.max(0, Math.floor((width - clipped.length) / 2));
    return ' '.repeat(pad) + clipped;
  };
  const row = (left: string, right: string) => {
    const gap = Math.max(1, width - left.length - right.length);
    return `${left}${' '.repeat(gap)}${right}`;
  };

  const out: string[] = [
    line,
    center(storeName.toUpperCase()),
    center(storeAddress.slice(0, 52)),
    center('TAX INVOICE / RETAIL BILL'),
    line,
    row(`Invoice No : ${invoice.invoiceNo}`, `Mode: ${invoice.paymentMethod}`),
    row(`Date/Time  : ${invoice.timestamp}`, ''),
    row(`Customer   : ${invoice.customerName}`, invoice.customerPhone || 'Walk-in'),
    dash,
    'ITEM                      QTY    RATE   GST     AMOUNT',
    dash,
  ];

  for (const item of invoice.items) {
    const nameStr = item.name.slice(0, 24).padEnd(24, ' ');
    const qtyStr = String(item.quantity).padStart(4, ' ');
    const rateStr = item.unitPrice.toFixed(0).padStart(7, ' ');
    const gstStr = `${item.gstRate}%`.padStart(5, ' ');
    const amtStr = item.lineTotal.toFixed(2).padStart(10, ' ');
    out.push(`${nameStr} ${qtyStr} ${rateStr} ${gstStr} ${amtStr}`);
  }

  const halfGst = (invoice.totalGst / 2).toFixed(2);
  out.push(dash);
  out.push(row('Subtotal', `Rs. ${invoice.subtotal.toFixed(2)}`));
  out.push(
    row(
      `Discount (${invoice.discountPercent}%)`,
      `- Rs. ${invoice.discountAmount.toFixed(2)}`
    )
  );
  out.push(row('Taxable Value', `Rs. ${invoice.taxableAmount.toFixed(2)}`));
  out.push(row('CGST (50% of GST)', `Rs. ${halfGst}`));
  out.push(row('SGST (50% of GST)', `Rs. ${halfGst}`));
  out.push(dash);
  out.push(row('GRAND TOTAL (INR)', `Rs. ${invoice.grandTotal.toFixed(2)}`));
  if (invoice.paymentMethod === 'Cash') {
    out.push(row('Cash Tendered', `Rs. ${invoice.amountTendered.toFixed(2)}`));
    out.push(row('Change Returned', `Rs. ${invoice.changeDue.toFixed(2)}`));
  }
  out.push(line);
  out.push(center('Thank you for shopping with us!'));
  out.push(center('Generated by Shopping Billing System (01AI0302)'));
  out.push(line);

  return out.join('\n');
}
