import React from 'react';
import { CurrencyCode, PresetLoan, CalculatorType } from '../types';
import { CURRENCIES, PRESET_LOANS } from '../data/presets';
import { 
  Printer, 
  Download, 
  Calculator, 
  TrendingUp, 
  ArrowDownCircle, 
  Sparkles, 
  History,
  Receipt,
  Briefcase,
  BadgePercent
} from 'lucide-react';

interface HeaderProps {
  activeCalculator: CalculatorType;
  onSelectCalculator: (type: CalculatorType) => void;
  currentPresetId: string | null;
  onSelectPreset: (preset: PresetLoan) => void;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  onPrint: () => void;
  onDownloadCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCalculator,
  onSelectCalculator,
  currentPresetId,
  onSelectPreset,
  currency,
  onCurrencyChange,
  onPrint,
  onDownloadCSV,
}) => {
  const calculatorTabs: { id: CalculatorType; label: string; group?: string; icon: React.ReactNode }[] = [
    { id: 'loan', label: 'Loan Amortization', icon: <Calculator className="w-3.5 h-3.5" /> },
    { id: 'sip', label: 'SIP', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'swp', label: 'SWP', icon: <ArrowDownCircle className="w-3.5 h-3.5" /> },
    { id: 'fv', label: 'Future Value', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'pv', label: 'Present Value', icon: <History className="w-3.5 h-3.5" /> },
    { id: 'income_tax', label: 'Income Tax', icon: <Receipt className="w-3.5 h-3.5" /> },
    { id: 'salary', label: 'Salary (CTC)', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'capital_gains', label: 'Capital Gains', icon: <BadgePercent className="w-3.5 h-3.5" /> },
  ];


  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-950/40 text-white font-bold text-xs tracking-wider">
              FK
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
                FinKit
              </span>
              <span className="hidden sm:inline-block text-[11px] text-slate-400 ml-2 font-medium">
                by Byteframe
              </span>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex items-center gap-1.5 md:hidden">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Select currency"
              className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol}
                </option>
              ))}
            </select>
            <button
              onClick={onPrint}
              title="Print Report"
              className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Zone 2: Calculator Suite Switcher Tabs */}
        <nav aria-label="Financial tools navigation" className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
          {calculatorTabs.map((tab) => {
            const isActive = activeCalculator === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectCalculator(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Actions & Currency */}
        <div className="hidden md:flex items-center gap-2.5">
          <div className="relative">
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Select currency"
              className="bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer hover:bg-slate-800/80 transition-colors"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          {activeCalculator === 'loan' && (
            <button
              onClick={onDownloadCSV}
              title="Download Schedule CSV"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>CSV</span>
            </button>
          )}

          <button
            onClick={onPrint}
            title="Print Summary Report"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 active:scale-98 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-900" />
            <span>Print Report</span>
          </button>
        </div>
      </div>
    </header>
  );
};
