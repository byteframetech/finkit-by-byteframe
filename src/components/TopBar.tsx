import React from 'react';
import { CalculatorType, CurrencyCode } from '../types';
import { CURRENCIES } from '../data/presets';
import { Menu, Printer, Download, FileText, Save, RefreshCw } from 'lucide-react';

interface TopBarProps {
  activeCalculator: CalculatorType;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  onOpenSidebar: () => void;
  onPrint: () => void;
  onDownloadCSV?: () => void;
  hasCSV?: boolean;
  onDownloadDocx?: () => void;
  syncComponent?: React.ReactNode;
  onSave?: () => void;
  isSaving?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeCalculator,
  currency,
  onCurrencyChange,
  onOpenSidebar,
  onPrint,
  onDownloadCSV,
  hasCSV = false,
  onDownloadDocx,
  syncComponent,
  onSave,
  isSaving = false,
}) => {
  const getToolTitle = () => {
    switch (activeCalculator) {
      case 'loan':
        return { title: 'Loan Amortization', desc: 'Precision payment schedules, rate shock & bi-weekly payoff' };
      case 'debt_consolidation':
        return { title: 'Debt Consolidation', desc: 'Consolidate multiple cards & debts into a lower-rate facility' };
      case 'sip':
        return { title: 'SIP Calculator', desc: 'Systematic compounding wealth plan' };
      case 'goal_sip':
        return { title: 'Goal-Based Planner', desc: 'Reverse-engineer required monthly SIP to achieve target milestones' };
      case 'swp':
        return { title: 'SWP & Monte Carlo', desc: 'Retirement drawdown & 500-run Monte Carlo sequence-of-returns test' };
      case 'fv':
        return { title: 'Future Value (FV)', desc: 'Compound interest & periodic additions' };
      case 'pv':
        return { title: 'Present Value & Basket', desc: 'Discounting & custom weighted personal inflation basket' };
      case 'income_tax':
        return { title: 'Income Tax & Horizon', desc: 'New vs Old Regime comparison & 5-year salary growth projection' };
      case 'salary':
        return { title: 'Salary Calculator (CTC)', desc: 'Take-home in-hand pay & itemized deductions' };
      case 'freelancer_tax':
        return { title: 'Freelancer / 44ADA & GST', desc: 'Presumptive 50% profit scheme, quarterly advance tax & GST' };
      case 'capital_gains':
        return { title: 'Capital Gains Tax Calculator', desc: 'STCG & LTCG estimates on stocks, property & crypto' };
      case 'esop_rsu':
        return { title: 'RSU & ESOP Vesting Tax', desc: 'Stage 1 perquisite salary tax & Stage 2 capital gains realization' };
      default:
        return { title: 'Financial Calculator', desc: 'Financial calculations & modeling' };
    }
  };

  const tool = getToolTitle();

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Tool Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onOpenSidebar}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 lg:hidden mr-1">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-[10px] shadow-xs">
              FK
            </div>
            <span className="text-xs font-bold text-white">FinKit</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-none">
                {tool.title}
              </h1>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                Active
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 mt-0.5">
              {tool.desc}
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Explicit Save Changes Button */}
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              title="Save scenarios and parameter changes to Google Drive"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-xl shadow-xs transition-all whitespace-nowrap cursor-pointer disabled:opacity-60"
            >
              {isSaving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-950" />
              ) : (
                <Save className="w-3.5 h-3.5 text-emerald-950" />
              )}
              <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Changes'}</span>
              <span className="sm:hidden">{isSaving ? '...' : 'Save'}</span>
            </button>
          )}

          {/* Google Sign-In & Drive Cloud Sync */}
          {syncComponent}

          {/* Currency Selector */}
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Select currency"
              className="bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer hover:bg-slate-800 transition-colors"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Quick CSV Export */}
          {hasCSV && onDownloadCSV && (
            <button
              onClick={onDownloadCSV}
              title="Download Schedule CSV"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV</span>
            </button>
          )}

          {/* Download Word Feature Documentation (.docx) */}
          {onDownloadDocx && (
            <button
              onClick={onDownloadDocx}
              title="Download Feature Documentation (Word .docx)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 hover:bg-emerald-900/60 hover:border-emerald-500/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Feature Docs (.docx)</span>
              <span className="md:hidden">Docs</span>
            </button>
          )}

          {/* Print Summary */}
          <button
            onClick={onPrint}
            title="Print Report"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-900" />
            <span className="hidden sm:inline">Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
