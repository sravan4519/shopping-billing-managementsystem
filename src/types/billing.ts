export type ProductCategory =
  | 'Groceries'
  | 'Dairy'
  | 'Beverages'
  | 'Snacks'
  | 'Personal Care'
  | 'Household';

export type PaymentMethod = 'Cash' | 'UPI' | 'Card';

export type WorkspaceView =
  | 'pos'
  | 'terminal'
  | 'ledger'
  | 'flowchart'
  | 'code'
  | 'report';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unitPrice: number;
  gstRate: 0 | 5 | 12 | 18;
  stock: number;
  unit: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface InvoiceLineItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineSubtotal: number;
  lineGst: number;
  lineTotal: number;
}

export interface Invoice {
  invoiceNo: string;
  timestamp: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceLineItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  totalGst: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountTendered: number;
  changeDue: number;
  source: 'POS' | 'CLI';
}

export interface StudentReportProfile {
  studentName: string;
  enrollmentNo: string;
  division: string;
  semester: string;
  academicYear: string;
  facultyName: string;
  storeName: string;
  storeAddress: string;
  submissionDate: string;
}

export interface AlgorithmStep {
  stepNumber: number;
  nodeId: string;
  title: string;
  summary: string;
  pythonFunction: string;
  details: string;
}
