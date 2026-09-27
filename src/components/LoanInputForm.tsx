import React, { useState } from 'react';
import { LoanParams } from '../types';
import { MONTH_NAMES } from '../utils/loanCalculations';
import { 
  DollarSign, 
  Percent, 
  Calendar, 
  RotateCcw, 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  Plus,
  Minus,
  Save,
  RefreshCw,
} from 'lucide-react';

interface LoanInputFormProps {
  params: LoanParams;
  onChange: (updated: Partial<LoanParams>) => void;
  onReset: () => void;
  onCalculate: () => void;
  currencySymbol: string;
  onSave?: () => void;
  isSaving?: boolean;
}

export const LoanInputForm: React.FC<LoanInputFormProps> = ({
  params,
  onChange,
  onReset,
  onCalculate,
  currencySymbol,
  onSave,
  isSaving = false,
}) => {
  const [showExtraPayments, setShowExtraPayments] = useState(false);
  const [calcPing, setCalcPing] = useState(false);

  const handleCalculateClick = () => {
    setCalcPing(true);
    onCalculate();
    setTimeout(() => setCalcPing(false), 400);
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 15 }, (_, i) => currentYear + i - 2);

  // Quick amount adjustments
  const adjustPrincipal = (delta: number) => {
    const next = Math.max(0, Math.round((params.principal + delta) / 1000) * 1000);
    onChange({ principal: next });
  };

  const adjustRate = (delta: number) => {
    const next = Math.max(0, Math.round((params.annualInterestRate + delta) * 100) / 100);
    onChange({ annualInterestRate: next });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Loan Parameters</h2>
          <p className="text-xs text-slate-400 mt-0.5">Customize financing terms & optional extra payments</p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-md transition-colors"
          title={`Reset to default ${currencySymbol}5,00,000 @ 10.5% 5Y`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="space-y-5">
        {/* Loan Principal Amount */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="principal-input" className="font-medium text-slate-300 flex items-center gap-1.5">
              <span>Loan Amount ({currencySymbol})</span>
            </label>
            <div className="flex items-center gap-1 font-mono">
              <button
                type="button"
                onClick={() => adjustPrincipal(-10000)}
                className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                -10k
              </button>
              <button
                type="button"
                onClick={() => adjustPrincipal(50000)}
                className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                +50k
              </button>
              <button
                type="button"
                onClick={() => adjustPrincipal(100000)}
                className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                {currencySymbol === '₹' ? '+1 Lakh' : '+100k'}
              </button>
            </div>
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              {currencySymbol}
            </span>
            <input
              id="principal-input"
              type="number"
              min="0"
              max="10000000"
              step="1000"
              value={params.principal === 0 ? '' : params.principal}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange({ principal: isNaN(val) ? 0 : Math.max(0, val) });
              }}
              className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-base rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 tabular-nums transition-all"
              placeholder="0.00"
            />
          </div>
          {/* Quick Slider */}
          <div className="mt-2 px-1">
            <input
              type="range"
              min="1000"
              max="500000"
              step="1000"
              value={Math.min(params.principal, 500000)}
              onChange={(e) => onChange({ principal: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>{currencySymbol}1k</span>
              <span>{currencySymbol}100k</span>
              <span>{currencySymbol}250k</span>
              <span>{currencySymbol}500k+</span>
            </div>
          </div>
        </div>

        {/* Annual Interest Rate (%) */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <label htmlFor="rate-input" className="font-medium text-slate-300">
              Annual Interest Rate (%)
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustRate(-0.25)}
                className="px-1.5 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                -0.25%
              </button>
              <button
                type="button"
                onClick={() => adjustRate(0.25)}
                className="px-1.5 py-0.5 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
              >
                +0.25%
              </button>
            </div>
          </div>
          <div className="relative">
            <input
              id="rate-input"
              type="number"
              min="0"
              max="35"
              step="0.05"
              value={params.annualInterestRate === 0 ? '' : params.annualInterestRate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onChange({ annualInterestRate: isNaN(val) ? 0 : Math.max(0, val) });
              }}
              className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-base rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 tabular-nums transition-all"
              placeholder="0.00"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
              %
            </span>
          </div>
          {/* Quick Slider */}
          <div className="mt-2 px-1">
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={Math.min(params.annualInterestRate, 20)}
              onChange={(e) => onChange({ annualInterestRate: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0%</span>
              <span>5%</span>
              <span>10%</span>
              <span>15%</span>
              <span>20%</span>
            </div>
          </div>
        </div>

        {/* Loan Term (Years & Additional Months) */}
        <div>
          <span className="block text-xs font-medium text-slate-300 mb-1.5">
            Loan Term Duration
          </span>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="years-input" className="block text-[11px] text-slate-400 mb-1">
                Years
              </label>
              <div className="relative">
                <input
                  id="years-input"
                  type="number"
                  min="0"
                  max="40"
                  step="1"
                  value={params.years}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onChange({ years: isNaN(val) ? 0 : Math.max(0, val) });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
            <div>
              <label htmlFor="months-input" className="block text-[11px] text-slate-400 mb-1">
                Additional Months (0–11)
              </label>
              <div className="relative">
                <input
                  id="months-input"
                  type="number"
                  min="0"
                  max="11"
                  step="1"
                  value={params.months}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const bounded = isNaN(val) ? 0 : Math.min(11, Math.max(0, val));
                    onChange({ months: bounded });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>
          </div>
          {/* Quick Year Term Presets */}
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 3, 5, 10, 15, 20, 30].map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onChange({ years: y, months: 0 })}
                className={`flex-1 py-1 text-[11px] rounded font-medium transition-colors ${
                  params.years === y && params.months === 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {y}Y
              </button>
            ))}
          </div>
        </div>

        {/* Start Date */}
        <div className="pt-2 border-t border-slate-800/60">
          <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>First Payment Date</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={params.startMonth}
              onChange={(e) => onChange({ startMonth: parseInt(e.target.value, 10) })}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={params.startYear}
              onChange={(e) => onChange({ startYear: parseInt(e.target.value, 10) })}
              className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
            >
              {yearOptions.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Extra Principal Payment Modeling (Collapsible) */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            type="button"
            onClick={() => setShowExtraPayments(!showExtraPayments)}
            className="w-full flex items-center justify-between text-xs font-medium text-slate-300 hover:text-emerald-400 transition-colors py-1"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Extra Principal Payments</span>
              {(params.extraMonthlyPayment > 0 || params.lumpSumPayment > 0) && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                  Active
                </span>
              )}
            </div>
            {showExtraPayments ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {showExtraPayments && (
            <div className="mt-3 space-y-3.5 p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl animate-fadeIn">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Extra Monthly Payment ({currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                    {currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={params.extraMonthlyPayment || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      onChange({ extraMonthlyPayment: isNaN(val) ? 0 : Math.max(0, val) });
                    }}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded-lg pl-7 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    One-time Lump Sum ({currencySymbol})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={params.lumpSumPayment || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        onChange({ lumpSumPayment: isNaN(val) ? 0 : Math.max(0, val) });
                      }}
                      placeholder="0"
                      className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded-lg pl-6 pr-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    Apply at Month #
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    step="1"
                    value={params.lumpSumMonth || 12}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      onChange({ lumpSumMonth: isNaN(val) ? 1 : Math.max(1, val) });
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCalculateClick}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.99] cursor-pointer ${
              calcPing ? 'scale-[0.98] ring-2 ring-emerald-300' : ''
            }`}
          >
            <Calculator className="w-4 h-4 text-slate-950" />
            <span>Recalculate</span>
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center justify-center gap-1.5 py-3 px-3.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Save current parameter settings to Google Drive"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Save className="w-4 h-4 text-emerald-400" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
