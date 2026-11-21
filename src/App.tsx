/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Code2,
  Database,
  FileText,
  GitBranch,
  Menu,
  Printer,
  ShoppingCart,
  Terminal,
  X,
} from 'lucide-react';
import { CatalogLedgerView } from './components/CatalogLedgerView';
import { FlowchartAlgorithmView } from './components/FlowchartAlgorithmView';
import { PosBillingView } from './components/PosBillingView';
import { ProjectReportView } from './components/ProjectReportView';
import { PythonTerminalView } from './components/PythonTerminalView';
import { SourceCodeView } from './components/SourceCodeView';
import {
  DEFAULT_REPORT_PROFILE,
  INITIAL_INVOICES,
  INITIAL_PRODUCTS,
} from './data/initialData';
import {
  Invoice,
  Product,
  StudentReportProfile,
  WorkspaceView,
} from './types/billing';

const STORAGE_KEYS = {
  products: 'sbs_01ai0302_products_v1',
  invoices: 'sbs_01ai0302_invoices_v1',
  profile: 'sbs_01ai0302_report_profile_v1',
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface NavItem {
  id: WorkspaceView;
  label: string;
  breadcrumb: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'pos', label: 'POS Billing Counter', breadcrumb: 'POS Billing Counter', icon: ShoppingCart },
  { id: 'terminal', label: 'Python CLI Simulator', breadcrumb: 'Python CLI Simulator', icon: Terminal },
  { id: 'ledger', label: 'Inventory & Sales CSV', breadcrumb: 'Inventory & Sales Ledger', icon: Database },
  { id: 'flowchart', label: 'Algorithm & Flowchart', breadcrumb: 'Algorithm & Flowchart', icon: GitBranch },
  { id: 'code', label: 'Python Code & I/O', breadcrumb: 'Python Source & Sample I/O', icon: Code2 },
  { id: 'report', label: 'Project Report (PDF)', breadcrumb: 'Marwadi Univ. Project Report', icon: FileText },
];

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('pos');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage(STORAGE_KEYS.products, INITIAL_PRODUCTS)
  );
  const [invoices, setInvoices] = useState<Invoice[]>(() =>
    loadFromStorage(STORAGE_KEYS.invoices, INITIAL_INVOICES)
  );
  const [reportProfile, setReportProfile] = useState<StudentReportProfile>(() =>
    loadFromStorage(STORAGE_KEYS.profile, DEFAULT_REPORT_PROFILE)
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
    } catch {
      // ignore storage quota failures
    }
  }, [products]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices));
    } catch {
      // ignore storage quota failures
    }
  }, [invoices]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(reportProfile));
    } catch {
      // ignore storage quota failures
    }
  }, [reportProfile]);

  const showToast = (message: string) => {
    setToast(message);
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleCompleteInvoice = (invoice: Invoice) => {
    setProducts((prev) =>
      prev.map((prod) => {
        const sold = invoice.items.find((i) => i.productId === prod.id);
        if (!sold) return prod;
        return { ...prod, stock: Math.max(0, prod.stock - sold.quantity) };
      })
    );
    setInvoices((prev) => [invoice, ...prev]);
  };

  const handleRestockProduct = (sku: string, addQty: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === sku ? { ...p, stock: p.stock + addQty } : p))
    );
  };

  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const handleResetDemoData = () => {
    setProducts(INITIAL_PRODUCTS);
    setInvoices(INITIAL_INVOICES);
    showToast('Restored initial 16 retail SKUs and 3 sample invoices.');
  };

  const handleTopBarPrintAction = () => {
    if (activeView === 'report') {
      window.print();
    } else {
      setActiveView('report');
      showToast('Opened Marwadi University Project Report. Click Print / Save as PDF when ready.');
    }
  };

  const currentNav = NAV_ITEMS.find((item) => item.id === activeView) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="no-print fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
        />
      )}

      {/* Left Workspace Sidebar */}
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-[60px] px-5 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setActiveView('pos');
              setMobileMenuOpen(false);
            }}
            className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Billing Project Suite
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 text-xs text-slate-500 space-y-0.5">
          <div className="font-semibold text-slate-800">Marwadi University · Sem 3</div>
          <div>Programming with Python (01AI0302)</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Workspace sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveView(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-cyan-50 text-[#0E7490] font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#0E7490]' : 'text-slate-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2 text-xs">
          <button
            type="button"
            onClick={() => setPdfModalOpen(true)}
            className="w-full px-3 py-2 text-left font-medium text-slate-700 hover:text-[#0E7490] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors cursor-pointer"
          >
            View Syllabus PDF Guideline
          </button>
          <div className="text-[11px] text-slate-500 px-1">
            CSE Project Work · 10 Marks Rubric
          </div>
        </div>
      </aside>

      {/* Main Content Shell */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Strict Single-Row Workspace Top Bar */}
        <header className="no-print sticky top-0 z-20 h-[60px] bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm min-w-0"
            >
              <span className="text-slate-500 whitespace-nowrap hidden sm:inline">
                Shopping Billing System
              </span>
              <span className="text-slate-300 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-slate-900 truncate">
                {currentNav.breadcrumb}
              </span>
            </nav>
          </div>

          <button
            type="button"
            onClick={handleTopBarPrintAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            {activeView === 'report' ? 'Print / Save PDF' : 'Open Report PDF'}
          </button>
        </header>

        {/* Active Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1280px] w-full mx-auto">
          {activeView === 'pos' && (
            <PosBillingView
              products={products}
              invoices={invoices}
              reportProfile={reportProfile}
              onCompleteInvoice={handleCompleteInvoice}
              onNotify={showToast}
            />
          )}

          {activeView === 'terminal' && (
            <PythonTerminalView
              products={products}
              invoices={invoices}
              reportProfile={reportProfile}
              onCompleteInvoice={handleCompleteInvoice}
              onRestockProduct={handleRestockProduct}
              onAddProduct={handleAddProduct}
              onNotify={showToast}
            />
          )}

          {activeView === 'ledger' && (
            <CatalogLedgerView
              products={products}
              invoices={invoices}
              reportProfile={reportProfile}
              onRestockProduct={handleRestockProduct}
              onAddProduct={handleAddProduct}
              onResetDemoData={handleResetDemoData}
              onNotify={showToast}
            />
          )}

          {activeView === 'flowchart' && <FlowchartAlgorithmView />}

          {activeView === 'code' && (
            <SourceCodeView
              products={products}
              invoices={invoices}
              onNotify={showToast}
            />
          )}

          {activeView === 'report' && (
            <ProjectReportView
              profile={reportProfile}
              products={products}
              invoices={invoices}
              onUpdateProfile={setReportProfile}
              onNotify={showToast}
            />
          )}
        </main>
      </div>

      {/* Original Attached Marwadi University PDF Viewer Modal */}
      {pdfModalOpen && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/55 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Marwadi University Python Project Ideas PDF"
        >
          <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Marwadi University — Python Project Ideas (01AI0302)
                </h2>
                <p className="text-xs text-slate-500">
                  Reference document · Category B, Sr. No. 6: Shopping Billing System
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPdfModalOpen(false)}
                aria-label="Close PDF preview"
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <iframe
              src="/assets/aistudio/python_project_ideas_232f8ec4.pdf"
              title="Marwadi University Python Project Ideas PDF"
              className="flex-1 w-full bg-slate-100"
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="no-print fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-lg shadow-lg border border-slate-700"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
