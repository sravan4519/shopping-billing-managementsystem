import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { generateInventoryJson, generateSalesCsv } from '../data/initialData';
import { PYTHON_SOURCE_CODE, SAMPLE_IO_TRANSCRIPTS } from '../data/pythonProjectContent';
import { Invoice, Product } from '../types/billing';

interface SourceCodeViewProps {
  products: Product[];
  invoices: Invoice[];
  onNotify: (message: string) => void;
}

type FileTab = 'python' | 'inventory' | 'sales' | 'sample_io';

const PY_KEYWORDS = new Set([
  'def',
  'return',
  'if',
  'elif',
  'else',
  'for',
  'in',
  'while',
  'try',
  'except',
  'with',
  'as',
  'import',
  'from',
  'not',
  'and',
  'or',
  'break',
  'continue',
  'True',
  'False',
  'None',
]);

function renderPythonLine(line: string): React.ReactNode {
  const trimmed = line.trim();
  if (trimmed.startsWith('#')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }
  if (trimmed.startsWith('"""') || trimmed.startsWith("'''")) {
    return <span className="text-emerald-300/90">{line}</span>;
  }

  const tokens = line.split(/(\s+|[()[\]{}:,.=+-]+)/);
  return tokens.map((tok, idx) => {
    if (PY_KEYWORDS.has(tok)) {
      return (
        <span key={idx} className="text-cyan-400 font-medium">
          {tok}
        </span>
      );
    }
    if (/^["'].*["']$/.test(tok)) {
      return (
        <span key={idx} className="text-amber-300">
          {tok}
        </span>
      );
    }
    if (/^\d+(\.\d+)?$/.test(tok)) {
      return (
        <span key={idx} className="text-emerald-300">
          {tok}
        </span>
      );
    }
    return <React.Fragment key={idx}>{tok}</React.Fragment>;
  });
}

export const SourceCodeView: React.FC<SourceCodeViewProps> = ({
  products,
  invoices,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<FileTab>('python');
  const [activeSampleId, setActiveSampleId] = useState<string>(SAMPLE_IO_TRANSCRIPTS[0].id);
  const [copied, setCopied] = useState(false);

  const liveJson = useMemo(() => generateInventoryJson(products), [products]);
  const liveCsv = useMemo(() => generateSalesCsv(invoices), [invoices]);

  const currentFileMeta = useMemo(() => {
    if (activeTab === 'python') {
      return {
        filename: 'shopping_billing_system.py',
        content: PYTHON_SOURCE_CODE,
        mime: 'text/x-python;charset=utf-8',
        subtitle: 'Standard Library Only (csv, json, os, datetime) · Ready for Python 3.8+',
      };
    }
    if (activeTab === 'inventory') {
      return {
        filename: 'inventory.json',
        content: liveJson,
        mime: 'application/json;charset=utf-8',
        subtitle: `Live JSON snapshot synced with ${products.length} products`,
      };
    }
    if (activeTab === 'sales') {
      return {
        filename: 'sales_history.csv',
        content: liveCsv,
        mime: 'text/csv;charset=utf-8',
        subtitle: `Live CSV ledger synced with ${invoices.length} invoices`,
      };
    }
    const sample =
      SAMPLE_IO_TRANSCRIPTS.find((s) => s.id === activeSampleId) ?? SAMPLE_IO_TRANSCRIPTS[0];
    return {
      filename: `${sample.id}_transcript.txt`,
      content: sample.transcript,
      mime: 'text/plain;charset=utf-8',
      subtitle: sample.scenario,
    };
  }, [activeTab, activeSampleId, liveJson, liveCsv, products.length, invoices.length]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentFileMeta.content);
      setCopied(true);
      onNotify(`Copied ${currentFileMeta.filename} to clipboard.`);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('Clipboard copy blocked in this browser context.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([currentFileMeta.content], { type: currentFileMeta.mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentFileMeta.filename;
    a.click();
    URL.revokeObjectURL(url);
    onNotify(`Downloaded ${currentFileMeta.filename}`);
  };

  const codeLines = currentFileMeta.content.split('\n');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Python Source Code &amp; Sample Input / Output
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Rubric Requirements 3 &amp; 4 · Complete runnable Python 3 script, live JSON/CSV files, and verified console transcripts
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md whitespace-nowrap cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy Content'}
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0E7490] hover:bg-[#155E75] rounded-md whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download {currentFileMeta.filename}
          </button>
        </div>
      </div>

      {/* File Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg overflow-x-auto max-w-full">
          {(
            [
              { id: 'python', label: 'shopping_billing_system.py' },
              { id: 'inventory', label: 'inventory.json (Live)' },
              { id: 'sales', label: 'sales_history.csv (Live)' },
              { id: 'sample_io', label: 'Sample Input & Output (4)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-500 font-mono tabular-nums">
          {codeLines.length} lines · {currentFileMeta.filename}
        </span>
      </div>

      {/* Sub-selector for Sample Input / Output Cases */}
      {activeTab === 'sample_io' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_IO_TRANSCRIPTS.map((sample) => {
            const active = sample.id === activeSampleId;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => setActiveSampleId(sample.id)}
                className={`text-left p-3.5 rounded-lg border transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-50/70 border-[#0E7490] text-slate-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="text-xs font-semibold leading-snug">{sample.title}</div>
                <div className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                  {sample.scenario}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Dark Code & Transcript Viewer */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-lg overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <span className="font-mono text-slate-200 font-medium">{currentFileMeta.filename}</span>
          <span className="text-slate-400">{currentFileMeta.subtitle}</span>
        </div>

        <div className="overflow-auto max-h-[580px] p-4 font-mono text-[12.5px] leading-6 tracking-[0.01em] text-slate-100">
          {activeTab === 'sample_io' ? (
            <pre className="whitespace-pre text-slate-200">{currentFileMeta.content}</pre>
          ) : (
            <table className="w-full border-collapse">
              <tbody>
                {codeLines.map((line, index) => (
                  <tr key={index} className="hover:bg-slate-800/40">
                    <td className="select-none pr-4 text-right text-slate-500 tabular-nums align-top w-10">
                      {index + 1}
                    </td>
                    <td className="whitespace-pre text-slate-100">
                      {activeTab === 'python' ? renderPythonLine(line) : line}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Run Instructions Box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          How to Run Locally in Your College Python Lab
        </h2>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div>
            <div className="font-semibold text-slate-900 mb-1">1. Download the Script</div>
            Save <span className="font-mono text-slate-800">shopping_billing_system.py</span> into
            a dedicated project folder (optional: also save your exported{' '}
            <span className="font-mono text-slate-800">inventory.json</span>).
          </div>
          <div>
            <div className="font-semibold text-slate-900 mb-1">2. Launch via Terminal or IDLE</div>
            Run <span className="font-mono text-slate-800">python shopping_billing_system.py</span>{' '}
            (Windows) or <span className="font-mono text-slate-800">python3 shopping_billing_system.py</span>{' '}
            (Linux/macOS). Zero external pip libraries required.
          </div>
          <div>
            <div className="font-semibold text-slate-900 mb-1">3. Inspect Generated Files</div>
            Every completed invoice updates <span className="font-mono text-slate-800">inventory.json</span>,
            appends to <span className="font-mono text-slate-800">sales_history.csv</span>, and saves
            a printable receipt in <span className="font-mono text-slate-800">receipts/INV-xxxx.txt</span>.
          </div>
        </div>
      </div>
    </div>
  );
};
