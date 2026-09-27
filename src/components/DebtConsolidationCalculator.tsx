import React, { useState, useMemo } from 'react';
import { DebtItem, DebtConsolidationParams } from '../types';
import { calculateDebtConsolidation } from '../utils/loanCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  CreditCard,
  Plus,
  Trash2,
  TrendingDown,
  ShieldCheck,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Percent,
} from 'lucide-react';

interface DebtConsolidationCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

const DEFAULT_DEBTS: DebtItem[] = [
  {
    id: 'debt_1',
    name: 'Platinum Credit Card',
    category: 'credit_card',
    currentBalance: 180000,
    annualInterestRate: 38.0,
    monthlyPayment: 9000,
  },
  {
    id: 'debt_2',
    name: 'Instant Personal Loan',
    category: 'personal_loan',
    currentBalance: 350000,
    annualInterestRate: 15.5,
    monthlyPayment: 10200,
  },
  {
    id: 'debt_3',
    name: 'Auto Loan Balance',
    category: 'auto_loan',
    currentBalance: 220000,
    annualInterestRate: 11.0,
    monthlyPayment: 5800,
  },
];

export const DebtConsolidationCalculator: React.FC<DebtConsolidationCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [debts, setDebts] = useState<DebtItem[]>(DEFAULT_DEBTS);
  const [consolidationRate, setConsolidationRate] = useState<number>(10.5);
  const [consolidationYears, setConsolidationYears] = useState<number>(5);
  const [processingFeePercent, setProcessingFeePercent] = useState<number>(1.0);

  const params: DebtConsolidationParams = useMemo(
    () => ({
      debts,
      consolidationRate,
      consolidationYears,
      processingFeePercent,
    }),
    [debts, consolidationRate, consolidationYears, processingFeePercent]
  );

  const result = useMemo(() => calculateDebtConsolidation(params), [params]);

  const handleAddDebt = () => {
    const newDebt: DebtItem = {
      id: `debt_${Date.now()}`,
      name: `Debt #${debts.length + 1}`,
      category: 'credit_card',
      currentBalance: 50000,
      annualInterestRate: 24.0,
      monthlyPayment: 2500,
    };
    setDebts((prev) => [...prev, newDebt]);
    onToast('Added new debt item');
  };

  const handleRemoveDebt = (id: string) => {
    if (debts.length <= 1) {
      onToast('You must have at least one debt item to calculate.');
      return;
    }
    setDebts((prev) => prev.filter((d) => d.id !== id));
    onToast('Removed debt item');
  };

  const handleUpdateDebt = (id: string, field: keyof DebtItem, value: any) => {
    setDebts((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    );
  };

  const handleReset = () => {
    setDebts(DEFAULT_DEBTS);
    setConsolidationRate(10.5);
    setConsolidationYears(5);
    setProcessingFeePercent(1.0);
    onToast('Reset Debt Consolidation simulator to default debts');
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Debt Name',
      'Category',
      `Current Balance (${currencySymbol})`,
      'Current Interest Rate (%)',
      `Current Monthly Payment (${currencySymbol})`,
      'Estimated Payoff Months',
      `Total Current Interest (${currencySymbol})`,
    ];
    const rows = result.debts.map((d) => [
      `"${d.name}"`,
      d.category,
      d.currentBalance.toFixed(2),
      d.annualInterestRate.toFixed(2),
      d.monthlyPayment.toFixed(2),
      d.currentPayoffMonths,
      d.currentTotalInterest.toFixed(2),
    ]);

    rows.push([]);
    rows.push(['CONSOLIDATED STRATEGY SUMMARY', '', '', '', '', '', '']);
    rows.push(['Total Consolidated Principal', '', result.newLoanPrincipal.toFixed(2)]);
    rows.push(['New Consolidated Interest Rate', '', `${consolidationRate}%`]);
    rows.push(['New Monthly Payment', '', result.newMonthlyPayment.toFixed(2)]);
    rows.push(['Monthly Cash Flow Savings', '', result.monthlySavings.toFixed(2)]);
    rows.push(['Lifetime Interest Reduction', '', result.lifetimeInterestSavings.toFixed(2)]);
    rows.push(['Net Financial Benefit', '', result.netFinancialBenefit.toFixed(2)]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `debt_consolidation_strategy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported Debt Consolidation strategy to CSV');
  };

  return (
    <div className="space-y-5">
      {/* Header ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Debt Consolidation Simulator
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              Debt Strategy
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Combine multiple high-interest credit cards and loans into a single lower-rate facility
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Top Impact KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Monthly Savings */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Monthly Cash Flow Relief</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {result.monthlySavings >= 0 ? '+' : ''}
            {formatCurrency(result.monthlySavings, currencySymbol)}
            <span className="text-xs text-slate-400 font-normal"> / mo</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Old EMI: {formatCurrency(result.totalCurrentMonthlyPayment, currencySymbol)} → New: {formatCurrency(result.newMonthlyPayment, currencySymbol)}
          </span>
        </div>

        {/* Lifetime Interest Saved */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Lifetime Interest Reduction</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {formatCurrency(result.lifetimeInterestSavings, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Total interest cut across all debts
          </span>
        </div>

        {/* Rate Compression */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Weighted Rate Reduction</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {formatPercent(result.weightedAverageCurrentRate)}
            <span className="text-slate-500 text-sm font-normal"> → </span>
            <span className="text-emerald-400">{formatPercent(consolidationRate)}</span>
          </div>
          <span className="text-[11px] text-emerald-400 block mt-1 font-medium">
            -{(result.weightedAverageCurrentRate - consolidationRate).toFixed(2)}% APR reduction
          </span>
        </div>

        {/* Net Financial Benefit */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Net Benefit (after fees)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {formatCurrency(result.netFinancialBenefit, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Breakeven in {result.breakEvenMonths} months
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout: Left Debt Items & Right Consolidated Loan Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: List of Current Debts (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Current Outstanding Debts ({debts.length})</span>
            </h3>
            <button
              onClick={handleAddDebt}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Debt</span>
            </button>
          </div>

          <div className="space-y-3">
            {debts.map((debt, index) => (
              <div
                key={debt.id}
                className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono font-bold">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={debt.name}
                      onChange={(e) => handleUpdateDebt(debt.id, 'name', e.target.value)}
                      placeholder="Debt Name"
                      className="bg-slate-950 border border-slate-800 text-xs font-semibold text-white px-2.5 py-1 rounded-md focus:border-emerald-500 focus:outline-none w-full max-w-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={debt.category}
                      onChange={(e) => handleUpdateDebt(debt.id, 'category', e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded-md px-2 py-1 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="credit_card">Credit Card</option>
                      <option value="personal_loan">Personal Loan</option>
                      <option value="auto_loan">Auto Loan</option>
                      <option value="student_loan">Student Loan</option>
                      <option value="medical">Medical Debt</option>
                      <option value="other">Other Debt</option>
                    </select>

                    <button
                      onClick={() => handleRemoveDebt(debt.id)}
                      title="Remove Debt"
                      className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Balance */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Balance ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={debt.currentBalance}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, 'currentBalance', Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Interest Rate */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Interest Rate (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={debt.annualInterestRate}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, 'annualInterestRate', Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  {/* Monthly Payment */}
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Current Monthly Payment
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={debt.monthlyPayment}
                      onChange={(e) =>
                        handleUpdateDebt(debt.id, 'monthlyPayment', Math.max(0, Number(e.target.value)))
                      }
                      className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: New Consolidated Facility Controls & Strategy (5 columns) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Consolidation Strategy Parameters</h3>
            </div>

            {/* Interest Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">New Consolidated APR</span>
                <span className="text-emerald-400 font-bold font-mono">{consolidationRate.toFixed(2)}%</span>
              </div>
              <input
                type="range"
                min={5}
                max={25}
                step={0.25}
                value={consolidationRate}
                onChange={(e) => setConsolidationRate(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5.0% (Prime)</span>
                <span>10.5% (Typical)</span>
                <span>25.0%</span>
              </div>
            </div>

            {/* Tenure Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">New Loan Tenure</span>
                <span className="text-emerald-400 font-bold font-mono">{consolidationYears} Years</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={consolidationYears}
                onChange={(e) => setConsolidationYears(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>1 Year</span>
                <span>5 Years</span>
                <span>10 Years</span>
              </div>
            </div>

            {/* Processing Fee */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Lender Processing Fee</span>
                <span className="text-slate-200 font-mono">{processingFeePercent.toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={0.25}
                value={processingFeePercent}
                onChange={(e) => setProcessingFeePercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Strategy Breakdown Card */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Debt to Consolidate:</span>
                <strong className="font-mono text-white">
                  {formatCurrency(result.totalCurrentBalance, currencySymbol)}
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Estimated Processing Fee:</span>
                <strong className="font-mono text-slate-400">
                  {formatCurrency((result.totalCurrentBalance * processingFeePercent) / 100, currencySymbol)}
                </strong>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>New Consolidated Principal:</span>
                <strong className="font-mono text-emerald-400">
                  {formatCurrency(result.newLoanPrincipal, currencySymbol)}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between font-semibold">
                <span className="text-slate-200">New Single Monthly Payment:</span>
                <span className="font-mono text-emerald-400 text-sm">
                  {formatCurrency(result.newMonthlyPayment, currencySymbol)}
                </span>
              </div>
            </div>

            {/* Callout insight */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Consolidation Verdict</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                By refinancing from an average {formatPercent(result.weightedAverageCurrentRate)} down to{' '}
                {formatPercent(consolidationRate)}, you lower your monthly debt load by{' '}
                <strong className="text-emerald-300">{formatCurrency(result.monthlySavings, currencySymbol)}/mo</strong> and save{' '}
                <strong className="text-emerald-300">{formatCurrency(result.lifetimeInterestSavings, currencySymbol)}</strong> in total interest.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
