import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ALGORITHM_STEPS } from '../data/pythonProjectContent';

interface FlowchartSvgProps {
  activeNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  compactForPrint?: boolean;
}

export const FlowchartSvg: React.FC<FlowchartSvgProps> = ({
  activeNodeId = null,
  onSelectNode,
  compactForPrint = false,
}) => {
  const interactive = Boolean(onSelectNode);

  const boxStyle = (id: string) => {
    const isSelected = activeNodeId === id;
    return {
      fill: isSelected ? '#ECFEFF' : '#FFFFFF',
      stroke: isSelected ? '#0E7490' : '#334155',
      strokeWidth: isSelected ? 2.2 : 1.3,
      cursor: interactive ? 'pointer' : 'default',
    };
  };

  const textFill = (id: string) => (activeNodeId === id ? '#0E7490' : '#0F172A');

  return (
    <svg
      viewBox="0 0 760 660"
      role="img"
      aria-label="Program Flowchart for Shopping Billing System"
      className={`w-full h-auto ${compactForPrint ? 'max-w-[680px] mx-auto' : ''}`}
    >
      <defs>
        <marker
          id="fc-arrow"
          viewBox="0 0 10 10"
          refX="8.5"
          refY="5"
          markerWidth="6.5"
          markerHeight="6.5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#475569" />
        </marker>
      </defs>

      {/* Connector lines */}
      <g stroke="#475569" strokeWidth="1.35" fill="none">
        {/* Start -> Menu */}
        <line x1="380" y1="54" x2="380" y2="88" markerEnd="url(#fc-arrow)" />
        {/* Menu -> Option 1 (Left) */}
        <path d="M 270 124 L 105 124 L 105 186" markerEnd="url(#fc-arrow)" />
        {/* Menu -> Option 2 (Center) */}
        <line x1="380" y1="158" x2="380" y2="188" markerEnd="url(#fc-arrow)" />
        {/* Menu -> Option 3 (Right-Mid) */}
        <path d="M 490 124 L 645 124 L 645 186" markerEnd="url(#fc-arrow)" />

        {/* Option 2 vertical chain */}
        <line x1="380" y1="242" x2="380" y2="274" markerEnd="url(#fc-arrow)" />
        <line x1="380" y1="330" x2="380" y2="362" markerEnd="url(#fc-arrow)" />
        <line x1="380" y1="418" x2="380" y2="450" markerEnd="url(#fc-arrow)" />
        <line x1="380" y1="506" x2="380" y2="544" markerEnd="url(#fc-arrow)" />

        {/* Cart loop-back arrow (Add more items?) */}
        <path d="M 278 215 L 222 215 L 222 258 L 275 258" strokeDasharray="4 3" />

        {/* Option 1 -> Option 4/5 -> Loop back */}
        <line x1="105" y1="242" x2="105" y2="338" markerEnd="url(#fc-arrow)" />
        {/* Option 3 -> Loop back */}
        <path d="M 645 242 L 645 572 L 502 572" markerEnd="url(#fc-arrow)" />
        {/* History -> Loop back */}
        <path d="M 105 398 L 105 572 L 258 572" markerEnd="url(#fc-arrow)" />

        {/* Exit diamond -> Stop */}
        <line x1="380" y1="600" x2="380" y2="616" markerEnd="url(#fc-arrow)" />

        {/* Loop back to menu */}
        <path
          d="M 502 572 L 728 572 L 728 106 L 498 106"
          strokeDasharray="5 3"
          markerEnd="url(#fc-arrow)"
        />
      </g>

      {/* Edge labels */}
      <g fontSize="10.5" fill="#475569" fontFamily="DM Sans, sans-serif">
        <text x="148" y="118">Option 1 / 4 / 5</text>
        <text x="388" y="177">Option 2 (Bill)</text>
        <text x="530" y="118">Option 3 (Stock)</text>
        <text x="200" y="206">Loop SKU</text>
        <text x="650" y="100">Continue (No)</text>
        <text x="388" y="611">Option 6 (Yes)</text>
      </g>

      {/* Node 1: Start & Load Files */}
      <g onClick={() => onSelectNode?.('start')}>
        <rect x="240" y="10" width="280" height="44" rx="22" {...boxStyle('start')} />
        <text
          x="380"
          y="29"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill={textFill('start')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          1. START &amp; LOAD DATA FILES
        </text>
        <text
          x="380"
          y="44"
          textAnchor="middle"
          fontSize="10.5"
          fill="#475569"
          fontFamily="JetBrains Mono, monospace"
        >
          inventory.json · sales_history.csv
        </text>
      </g>

      {/* Node 2: Main Menu */}
      <g onClick={() => onSelectNode?.('menu')}>
        <polygon
          points="276,90 498,90 484,158 262,158"
          {...boxStyle('menu')}
        />
        <text
          x="380"
          y="118"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill={textFill('menu')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          2. DISPLAY MAIN MENU (1–6)
        </text>
        <text
          x="380"
          y="136"
          textAnchor="middle"
          fontSize="10.5"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Read operator choice in while loop
        </text>
      </g>

      {/* Node 3: Catalog (Left) */}
      <g onClick={() => onSelectNode?.('catalog')}>
        <rect x="20" y="188" width="170" height="54" rx="5" {...boxStyle('catalog')} />
        <text
          x="105"
          y="211"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('catalog')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          3. VIEW CATALOG
        </text>
        <text
          x="105"
          y="228"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Tabulate SKU, GST &amp; Stock
        </text>
      </g>

      {/* Node 9: History & Search (Left Bottom) */}
      <g onClick={() => onSelectNode?.('history')}>
        <rect x="20" y="340" width="170" height="58" rx="5" {...boxStyle('history')} />
        <text
          x="105"
          y="364"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('history')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          9. SALES CSV &amp; SEARCH
        </text>
        <text
          x="105"
          y="381"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Read CSV · Lookup Invoice ID
        </text>
      </g>

      {/* Node 4: Cart Loop */}
      <g onClick={() => onSelectNode?.('cart_loop')}>
        <rect x="278" y="188" width="204" height="54" rx="5" {...boxStyle('cart_loop')} />
        <text
          x="380"
          y="211"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('cart_loop')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          4. ADD ITEMS TO CART
        </text>
        <text
          x="380"
          y="228"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Validate SKU &amp; stock until DONE
        </text>
      </g>

      {/* Node 5: Discount & GST */}
      <g onClick={() => onSelectNode?.('tax_calc')}>
        <rect x="278" y="276" width="204" height="54" rx="5" {...boxStyle('tax_calc')} />
        <text
          x="380"
          y="299"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('tax_calc')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          5. DISCOUNT &amp; GST MATH
        </text>
        <text
          x="380"
          y="316"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          5%/10% Tier · CGST + SGST
        </text>
      </g>

      {/* Node 6: Payment */}
      <g onClick={() => onSelectNode?.('payment')}>
        <rect x="278" y="364" width="204" height="54" rx="5" {...boxStyle('payment')} />
        <text
          x="380"
          y="387"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('payment')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          6. PROCESS PAYMENT
        </text>
        <text
          x="380"
          y="404"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Cash / UPI / Card · Verify Tender
        </text>
      </g>

      {/* Node 7: Persist & Receipt */}
      <g onClick={() => onSelectNode?.('persist')}>
        <rect x="278" y="452" width="204" height="54" rx="5" {...boxStyle('persist')} />
        <text
          x="380"
          y="475"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('persist')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          7. SAVE &amp; PRINT RECEIPT
        </text>
        <text
          x="380"
          y="492"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Update JSON · Append CSV · .txt
        </text>
      </g>

      {/* Node 8: Restock / Add Product (Right) */}
      <g onClick={() => onSelectNode?.('restock')}>
        <rect x="560" y="188" width="170" height="54" rx="5" {...boxStyle('restock')} />
        <text
          x="645"
          y="211"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('restock')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          8. RESTOCK / NEW SKU
        </text>
        <text
          x="645"
          y="228"
          textAnchor="middle"
          fontSize="10"
          fill="#475569"
          fontFamily="DM Sans, sans-serif"
        >
          Validate &amp; write inventory.json
        </text>
      </g>

      {/* Node 10: Exit Decision Diamond */}
      <g onClick={() => onSelectNode?.('exit')}>
        <polygon
          points="380,545 502,572 380,600 258,572"
          {...boxStyle('exit')}
        />
        <text
          x="380"
          y="576"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill={textFill('exit')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          10. EXIT SELECTED?
        </text>
      </g>

      {/* STOP Terminal */}
      <g onClick={() => onSelectNode?.('exit')}>
        <rect x="315" y="618" width="130" height="34" rx="17" {...boxStyle('exit')} />
        <text
          x="380"
          y="639"
          textAnchor="middle"
          fontSize="11.5"
          fontWeight="700"
          fill={textFill('exit')}
          fontFamily="Plus Jakarta Sans, sans-serif"
        >
          END PROGRAM
        </text>
      </g>
    </svg>
  );
};

export const FlowchartAlgorithmView: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const currentStep = ALGORITHM_STEPS[selectedIndex];

  const handleSelectNode = (nodeId: string) => {
    const idx = ALGORITHM_STEPS.findIndex((s) => s.nodeId === nodeId);
    if (idx !== -1) setSelectedIndex(idx);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Algorithm &amp; Interactive Flowchart
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Rubric Requirement 2 · Click any block in the flowchart or step through the 10-stage algorithm below
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSelectedIndex((i) => Math.max(0, i - 1))}
            disabled={selectedIndex === 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 rounded-md whitespace-nowrap cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Previous Step
          </button>
          <span className="text-xs font-mono text-slate-600 tabular-nums px-1">
            {selectedIndex + 1} / {ALGORITHM_STEPS.length}
          </span>
          <button
            type="button"
            onClick={() =>
              setSelectedIndex((i) => Math.min(ALGORITHM_STEPS.length - 1, i + 1))
            }
            disabled={selectedIndex === ALGORITHM_STEPS.length - 1}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0E7490] hover:bg-[#155E75] disabled:opacity-40 rounded-md whitespace-nowrap cursor-pointer"
          >
            Next Step
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two-zone Educational Sandbox Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Stage: Interactive Vector Flowchart */}
        <section className="xl:col-span-7 bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-semibold text-slate-900">
              System Control Flowchart (ISO Standard Symbols)
            </h2>
            <span className="text-xs text-slate-500">Click any block to inspect logic</span>
          </div>
          <FlowchartSvg
            activeNodeId={currentStep.nodeId}
            onSelectNode={handleSelectNode}
          />
        </section>

        {/* Right Concept Deck: Selected Node Detail + Numbered Algorithm List */}
        <section className="xl:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <div className="text-xs font-mono text-[#0E7490] font-medium">
              Step {currentStep.stepNumber} of {ALGORITHM_STEPS.length} · Mapped Function:{' '}
              {currentStep.pythonFunction}
            </div>
            <h2 className="text-lg font-bold text-slate-900">{currentStep.title}</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{currentStep.details}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
              <h3 className="text-xs font-semibold text-slate-700">
                Complete Step-by-Step Algorithm
              </h3>
            </div>
            <ol className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {ALGORITHM_STEPS.map((step, idx) => {
                const active = idx === selectedIndex;
                return (
                  <li key={step.stepNumber}>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex(idx)}
                      className={`w-full text-left px-4 py-3 transition-colors cursor-pointer ${
                        active ? 'bg-cyan-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-baseline gap-2.5">
                        <span
                          className={`font-mono text-xs font-semibold tabular-nums shrink-0 ${
                            active ? 'text-[#0E7490]' : 'text-slate-400'
                          }`}
                        >
                          {String(step.stepNumber).padStart(2, '0')}.
                        </span>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              active ? 'text-[#0E7490]' : 'text-slate-900'
                            }`}
                          >
                            {step.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 leading-snug">
                            {step.summary}
                          </div>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
};
