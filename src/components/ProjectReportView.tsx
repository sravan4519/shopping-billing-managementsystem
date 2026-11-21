import React, { useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import { DEFAULT_REPORT_PROFILE, formatINR } from '../data/initialData';
import {
  ALGORITHM_STEPS,
  PYTHON_SOURCE_CODE,
  SAMPLE_IO_TRANSCRIPTS,
} from '../data/pythonProjectContent';
import { Invoice, Product, StudentReportProfile } from '../types/billing';
import { FlowchartSvg } from './FlowchartAlgorithmView';

interface ProjectReportViewProps {
  profile: StudentReportProfile;
  products: Product[];
  invoices: Invoice[];
  onUpdateProfile: (profile: StudentReportProfile) => void;
  onNotify: (message: string) => void;
}

export const ProjectReportView: React.FC<ProjectReportViewProps> = ({
  profile,
  products,
  invoices,
  onUpdateProfile,
  onNotify,
}) => {
  const [includeFullSourceInPrint, setIncludeFullSourceInPrint] = useState(true);

  const handleField = (key: keyof StudentReportProfile, value: string) => {
    onUpdateProfile({ ...profile, [key]: value });
  };

  const handleReset = () => {
    onUpdateProfile(DEFAULT_REPORT_PROFILE);
    onNotify('Reset student cover page fields to default values.');
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalGst = invoices.reduce((sum, inv) => sum + inv.totalGst, 0);

  return (
    <div className="space-y-6">
      {/* Editable Student Cover Page Controls (Hidden in Print / PDF) */}
      <section className="no-print bg-white border border-slate-200 rounded-lg p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-3.5">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Marwadi University Project Report (Editable &amp; Print-Ready PDF)
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Customize your student details below — changes bind live to the A4 submission sheets formatted for Programming with Python (01AI0302)
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Fields
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md whitespace-nowrap cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Student Name</label>
            <input
              type="text"
              value={profile.studentName}
              onChange={(e) => handleField('studentName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Enrollment Number
            </label>
            <input
              type="text"
              value={profile.enrollmentNo}
              onChange={(e) => handleField('enrollmentNo', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Division &amp; Batch
            </label>
            <input
              type="text"
              value={profile.division}
              onChange={(e) => handleField('division', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subject Faculty Guide
            </label>
            <input
              type="text"
              value={profile.facultyName}
              onChange={(e) => handleField('facultyName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year</label>
            <input
              type="text"
              value={profile.academicYear}
              onChange={(e) => handleField('academicYear', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Submission Date
            </label>
            <input
              type="date"
              value={profile.submissionDate}
              onChange={(e) => handleField('submissionDate', e.target.value)}
              className="w-full px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Retail Store Name
            </label>
            <input
              type="text"
              value={profile.storeName}
              onChange={(e) => handleField('storeName', e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:border-[#0E7490]"
            />
          </div>
          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 py-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeFullSourceInPrint}
                onChange={(e) => setIncludeFullSourceInPrint(e.target.checked)}
                className="rounded border-slate-300 text-[#0E7490] focus:ring-[#0E7490]"
              />
              Include complete Python source in report
            </label>
          </div>
        </div>
      </section>

      {/* Printable A4 Academic Report Container */}
      <article className="report-sheet max-w-[840px] mx-auto bg-white border border-slate-200 rounded-lg shadow-xs px-8 py-10 sm:px-14 sm:py-12 space-y-10 text-slate-900">
        {/* ================= PAGE 1: COVER PAGE ================= */}
        <section className="min-h-[820px] flex flex-col justify-between border border-slate-300 p-8 sm:p-10 print:min-h-[252mm]">
          <div className="text-center space-y-2 border-b-2 border-slate-900 pb-6">
            <div className="text-xs font-semibold tracking-widest text-[#0E7490] uppercase">
              Marwadi University · NAAC A+ Accredited
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              FACULTY OF ENGINEERING AND TECHNOLOGY
            </h2>
            <p className="text-sm sm:text-base font-semibold text-slate-700">
              Department of CSE AI, ML and DS
            </p>
          </div>

          <div className="text-center space-y-5 py-8">
            <p className="text-sm font-medium text-slate-600">
              A Project Report Submitted for Semester 3 Engineering Coursework
            </p>
            <div className="space-y-1">
              <div className="text-xs font-mono text-slate-500">
                Subject: Programming with Python (01AI0302) · Project Work (CSE): 10 Marks
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 pt-2">
                Shopping Billing System
              </h1>
              <p className="text-sm text-slate-600 max-w-lg mx-auto pt-1">
                Menu-Driven Retail &amp; Supermarket Billing Application with JSON Inventory
                Management, Item-Wise GST Calculation, Tiered Discounts, and CSV Sales Logging
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-b border-slate-300 py-6 text-sm">
              <div className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Submitted By
                </div>
                <div className="font-bold text-base text-slate-900">
                  {profile.studentName || '____________________'}
                </div>
                <div className="text-slate-700 font-mono text-xs">
                  Enrollment No.: {profile.enrollmentNo || '________________'}
                </div>
                <div className="text-slate-700 text-xs">
                  Division / Batch: {profile.division || '________________'}
                </div>
                <div className="text-slate-700 text-xs">
                  Semester: {profile.semester} (B.Tech CSE — AI, ML &amp; DS)
                </div>
              </div>

              <div className="space-y-1.5 sm:text-right">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Submitted To
                </div>
                <div className="font-bold text-base text-slate-900">
                  {profile.facultyName || '____________________'}
                </div>
                <div className="text-slate-700 text-xs">
                  Subject Coordinator · Programming with Python (01AI0302)
                </div>
                <div className="text-slate-700 text-xs">
                  Department of CSE AI, ML and DS
                </div>
                <div className="text-slate-700 font-mono text-xs">
                  Date: {profile.submissionDate}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-2">
              <span>Marwadi University, Rajkot, Gujarat</span>
              <span className="font-mono">Academic Year {profile.academicYear}</span>
            </div>
          </div>
        </section>

        {/* ================= PAGE 2: PROBLEM STATEMENT & ARCHITECTURE ================= */}
        <section className="print-page-break space-y-6">
          <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              1. Project Title, Problem Statement &amp; Objectives
            </h2>
            <span className="text-xs font-mono text-slate-500">01AI0302 · CSE Project</span>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h3 className="text-sm font-bold text-slate-900">1.1 Project Title</h3>
            <p>
              <strong>Shopping Billing System (Retail / Supermarket)</strong> — selected from
              Category B (Finance and Billing Projects, Sr. No. 6) of the Semester 3 Python
              Project Guidelines.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h3 className="text-sm font-bold text-slate-900">1.2 Problem Statement</h3>
            <p>
              Small retail counters and campus supermarkets frequently calculate customer bills
              using manual calculators or paper registers. Manual billing leads to arithmetic
              errors in multi-slab GST computation (0%, 5%, 12%, 18%), inconsistent discount
              application, unmonitored stock depletion, and difficulty auditing daily revenue or
              re-printing past receipts. There is a clear need for a lightweight, zero-dependency
              Python billing application that automates invoice generation, enforces real-time
              stock validation, calculates item-wise CGST/SGST accurately, and persists both
              product stock and sales history in structured machine-readable files.
            </p>
          </div>

          <div className="space-y-2 text-sm leading-relaxed text-slate-700">
            <h3 className="text-sm font-bold text-slate-900">1.3 Key Objectives</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Implement a menu-driven Python 3 console system covering catalog browsing,
                customer checkout, restocking/SKU registration, CSV sales reporting, and invoice
                lookup.
              </li>
              <li>
                Eliminate manual tax errors through automatic tiered discounts (5% on subtotals
                ≥ ₹1,000 and 10% on subtotals ≥ ₹2,500) and item-wise CGST/SGST computation.
              </li>
              <li>
                Persist live product inventory in <code className="font-mono text-xs">inventory.json</code>{' '}
                and append every finalized transaction to{' '}
                <code className="font-mono text-xs">sales_history.csv</code> along with formatted
                54-column text receipts under <code className="font-mono text-xs">receipts/</code>.
              </li>
              <li>
                Enforce defensive input validation against invalid SKUs, non-numeric quantities,
                stock over-allocation, and insufficient cash tender.
              </li>
            </ul>
          </div>

          <div className="space-y-2 text-sm">
            <h3 className="text-sm font-bold text-slate-900">
              1.4 Software Requirements &amp; Data Schema
            </h3>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border border-slate-300 font-semibold">Component</th>
                  <th className="p-2 border border-slate-300 font-semibold">Specification</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Language &amp; Runtime</td>
                  <td className="p-2 border border-slate-300">Python 3.8 or higher (Standard Library only; no third-party pip installs)</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Python Modules Used</td>
                  <td className="p-2 border border-slate-300 font-mono">json, csv, os, datetime</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Catalog Storage</td>
                  <td className="p-2 border border-slate-300">
                    <span className="font-mono">inventory.json</span> — array of product dicts (id, name, category, unit, price, gst_rate, stock)
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Sales Ledger</td>
                  <td className="p-2 border border-slate-300">
                    <span className="font-mono">sales_history.csv</span> — 11-column CSV log (invoice_no, timestamp, customer_name, customer_phone, item_count, subtotal, discount_percent, discount_amount, total_gst, grand_total, payment_method)
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-medium">Receipt Archive</td>
                  <td className="p-2 border border-slate-300">
                    <span className="font-mono">receipts/INV-xxxx.txt</span> — 54-column printable thermal invoice text file
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= PAGE 3: ALGORITHM & FLOWCHART ================= */}
        <section className="print-page-break space-y-6">
          <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              2. Algorithm &amp; Program Flowchart
            </h2>
            <span className="text-xs font-mono text-slate-500">Requirement 2</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">2.1 Step-by-Step Algorithm</h3>
            <ol className="space-y-2 text-xs leading-relaxed text-slate-700">
              {ALGORITHM_STEPS.map((step) => (
                <li key={step.stepNumber} className="flex gap-2">
                  <span className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                    Step {String(step.stepNumber).padStart(2, '0')}:
                  </span>
                  <span>
                    <strong className="text-slate-900">{step.title}</strong> — {step.details}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="print-avoid-break space-y-2 pt-2">
            <h3 className="text-sm font-bold text-slate-900">2.2 Program Control Flowchart</h3>
            <div className="border border-slate-200 rounded-md p-3 bg-white">
              <FlowchartSvg compactForPrint />
            </div>
          </div>
        </section>

        {/* ================= PAGE 4: PYTHON SOURCE CODE ================= */}
        <section className="print-page-break space-y-5">
          <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              3. Python Source Code Architecture
            </h2>
            <span className="text-xs font-mono text-slate-500">Requirement 3</span>
          </div>

          <div className="text-xs text-slate-700 space-y-2">
            <p>
              The application is modularized into 12 cohesive functions inside{' '}
              <code className="font-mono">shopping_billing_system.py</code> to ensure readability,
              reusability, and clear separation between file I/O, tax calculation, receipt
              formatting, and console interaction:
            </p>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border border-slate-300 font-semibold">Function Name</th>
                  <th className="p-2 border border-slate-300 font-semibold">Responsibility</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">load_inventory / save_inventory</td>
                  <td className="p-2 border border-slate-300">Loads product catalog from JSON with corruption fallback and writes updated stock.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">ensure_sales_csv / generate_next_invoice_no</td>
                  <td className="p-2 border border-slate-300">Initializes CSV schema and computes next sequential invoice number (INV-1001+).</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">create_new_bill / get_auto_discount_percent</td>
                  <td className="p-2 border border-slate-300">Manages cart input validation, stock caps, tiered discount, CGST/SGST math, and payment tender.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">format_receipt / save_receipt_file</td>
                  <td className="p-2 border border-slate-300">Builds a 54-character thermal receipt layout and saves it under receipts/.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">add_or_restock_product</td>
                  <td className="p-2 border border-slate-300">Restocks an existing SKU or registers a new validated product into inventory.json.</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-300 font-mono">view_sales_history / search_bill_by_invoice</td>
                  <td className="p-2 border border-slate-300">Reads sales_history.csv to print cumulative revenue or fetch a specific invoice record.</td>
                </tr>
              </tbody>
            </table>
          </div>

          {includeFullSourceInPrint && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-900">
                3.1 Complete Python Listing (shopping_billing_system.py)
              </h3>
              <pre className="p-3.5 bg-slate-50 border border-slate-300 rounded font-mono text-[9.5px] leading-[1.45] text-slate-900 overflow-x-auto whitespace-pre-wrap break-words">
                {PYTHON_SOURCE_CODE}
              </pre>
            </div>
          )}
        </section>

        {/* ================= PAGE 5: SAMPLE I/O, LIVE SUMMARY & CONCLUSION ================= */}
        <section className="print-page-break space-y-6">
          <div className="border-b border-slate-300 pb-2 flex items-baseline justify-between">
            <h2 className="text-xl font-bold text-slate-900">
              4. Sample Input, Output &amp; Live Demonstration Summary
            </h2>
            <span className="text-xs font-mono text-slate-500">Requirements 4 &amp; 6</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              4.1 Console Billing Session &amp; Tax Receipt Output
            </h3>
            <pre className="p-3.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px] leading-relaxed text-slate-900 overflow-x-auto whitespace-pre">
              {SAMPLE_IO_TRANSCRIPTS[0].transcript}
            </pre>
          </div>

          <div className="print-avoid-break space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              4.2 Defensive Validation Output (Invalid SKU &amp; Stock Cap Test)
            </h3>
            <pre className="p-3.5 bg-slate-50 border border-slate-300 rounded font-mono text-[10px] leading-relaxed text-slate-900 overflow-x-auto whitespace-pre">
              {SAMPLE_IO_TRANSCRIPTS[1].transcript}
            </pre>
          </div>

          <div className="print-avoid-break space-y-2">
            <h3 className="text-sm font-bold text-slate-900">
              4.3 Live Recorded Sales Ledger ({profile.storeName})
            </h3>
            <p className="text-xs text-slate-600">
              Snapshot of live transactions currently recorded in{' '}
              <code className="font-mono">sales_history.csv</code> across {products.length} active
              retail SKUs:
            </p>
            <table className="w-full text-left border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border border-slate-300 font-mono">Invoice No.</th>
                  <th className="p-2 border border-slate-300">Date &amp; Time</th>
                  <th className="p-2 border border-slate-300">Customer</th>
                  <th className="p-2 border border-slate-300">Mode</th>
                  <th className="p-2 border border-slate-300 text-right">GST</th>
                  <th className="p-2 border border-slate-300 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.invoiceNo}>
                    <td className="p-2 border border-slate-300 font-mono tabular-nums">
                      {inv.invoiceNo}
                    </td>
                    <td className="p-2 border border-slate-300 font-mono tabular-nums">
                      {inv.timestamp}
                    </td>
                    <td className="p-2 border border-slate-300">{inv.customerName}</td>
                    <td className="p-2 border border-slate-300">{inv.paymentMethod}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono tabular-nums">
                      {formatINR(inv.totalGst)}
                    </td>
                    <td className="p-2 border border-slate-300 text-right font-mono font-semibold tabular-nums">
                      {formatINR(inv.grandTotal)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td colSpan={4} className="p-2 border border-slate-300">
                    Cumulative Total ({invoices.length} Invoices)
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono tabular-nums">
                    {formatINR(totalGst)}
                  </td>
                  <td className="p-2 border border-slate-300 text-right font-mono tabular-nums">
                    {formatINR(totalRevenue)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="print-avoid-break space-y-2 pt-2 border-t border-slate-300">
            <h2 className="text-lg font-bold text-slate-900">
              5. Conclusion &amp; Future Enhancements
            </h2>
            <p className="text-sm leading-relaxed text-slate-700">
              The <strong>Shopping Billing System</strong> successfully fulfills every requirement
              of the Semester 3 Programming with Python (01AI0302) CSE project work. Using core
              Python data structures, modular functions, exception handling, and persistent JSON/CSV
              storage, the program automates supermarket checkout with zero calculation errors and
              transparent audit logs. Future extensions can incorporate USB barcode scanner input,
              SQLite multi-branch synchronization, automated low-stock purchase orders, and WhatsApp
              or email PDF invoice delivery.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-10 text-xs text-slate-700">
              <div className="border-t border-slate-400 pt-2">
                <div className="font-semibold text-slate-900">Student Signature</div>
                <div>{profile.studentName} ({profile.enrollmentNo})</div>
              </div>
              <div className="border-t border-slate-400 pt-2 text-right">
                <div className="font-semibold text-slate-900">Faculty Evaluation Signature</div>
                <div>{profile.facultyName} · Dept. of CSE AI, ML and DS</div>
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
};
