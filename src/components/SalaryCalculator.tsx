import React, { useState, useMemo } from 'react';
import { SalaryParams } from '../types';
import { calculateSalary, generateSalaryCSV } from '../utils/taxAndSalaryCalculations';
import { formatCurrency } from '../utils/loanCalculations';
import { 
  Briefcase, 
  Wallet, 
  ArrowDownRight, 
  Percent, 
  Download, 
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Building
} from 'lucide-react';

interface SalaryCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const SalaryCalculator: React.FC<SalaryCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<SalaryParams>({
    annualCTC: 1200000,
    bonusAnnual: 100000,
    employerPFMonthly: 1800,
    employeePFMonthly: 1800,
    professionalTaxMonthly: 200,
    annualTaxDeducted: 85000,
    insuranceDeductionMonthly: 1000,
    otherDeductionsMonthly: 0,
    customBasicPercent: 45,
    customHRAPercent: 40,
  });

  const result = useMemo(() => calculateSalary(params), [params]);

  const handleReset = () => {
    setParams({
      annualCTC: 1200000,
      bonusAnnual: 100000,
      employerPFMonthly: 1800,
      employeePFMonthly: 1800,
      professionalTaxMonthly: 200,
      annualTaxDeducted: 85000,
      insuranceDeductionMonthly: 1000,
      otherDeductionsMonthly: 0,
      customBasicPercent: 45,
      customHRAPercent: 40,
    });
    onToast('Reset salary calculator to standard ₹12 LPA / $100k CTC baseline');
  };

  const handleDownloadCSV = () => {
    const csv = generateSalaryCSV(result, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `salary_ctc_breakdown_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Salary breakdown exported to CSV');
  };

  return (
    <div className="space-y-6">
      {/* 4 Compact Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Monthly Take-Home</span>
            <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <Wallet className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.takeHomeMonthly, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            {formatCurrency(result.takeHomeAnnual, currencySymbol)}/yr net
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Monthly Deductions</span>
            <div className="w-4 h-4 rounded bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 ml-1">
              <ArrowDownRight className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.totalDeductionsMonthly, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            PF, TDS & Insurance
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Gross Monthly</span>
            <div className="w-4 h-4 rounded bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 ml-1">
              <Briefcase className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.grossSalaryMonthly, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            CTC minus employer PF
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Take-Home Ratio</span>
            <div className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 ml-1">
              <Percent className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {result.takeHomePercentage}%
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Of annual CTC package
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form (4 cols), Right Views (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">CTC Package Parameters</h2>
              <p className="text-xs text-slate-400">Payroll structure & standard deductions</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Annual CTC Input */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Annual CTC ({currencySymbol})</span>
              <div className="flex gap-1 font-mono text-[11px]">
                {[500000, 1000000, 1500000, 2500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setParams((p) => ({ ...p, annualCTC: amt }))}
                    className={`px-1.5 py-0.5 rounded ${params.annualCTC === amt ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                  >
                    {currencySymbol}{(amt / 100000).toFixed(0)}L
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="50000"
                step="25000"
                value={params.annualCTC}
                onChange={(e) => setParams((p) => ({ ...p, annualCTC: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
            <input
              type="range"
              min="200000"
              max="5000000"
              step="50000"
              value={Math.min(params.annualCTC, 5000000)}
              onChange={(e) => setParams((p) => ({ ...p, annualCTC: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
          </div>

          {/* Performance Bonus Annual */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Annual Performance Bonus (Part of CTC) ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="10000"
                value={params.bonusAnnual}
                onChange={(e) => setParams((p) => ({ ...p, bonusAnnual: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Basic & HRA Percentages */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Basic (% of CTC)
              </label>
              <input
                type="number"
                min="30"
                max="60"
                step="1"
                value={params.customBasicPercent}
                onChange={(e) => setParams((p) => ({ ...p, customBasicPercent: Number(e.target.value) || 45 }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                HRA (% of Basic)
              </label>
              <input
                type="number"
                min="30"
                max="50"
                step="1"
                value={params.customHRAPercent}
                onChange={(e) => setParams((p) => ({ ...p, customHRAPercent: Number(e.target.value) || 40 }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Standard Deductions Breakdown */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Standard Deductions
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Employee PF /mo ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={params.employeePFMonthly}
                  onChange={(e) => setParams((p) => ({ ...p, employeePFMonthly: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Professional Tax /mo ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={params.professionalTaxMonthly}
                  onChange={(e) => setParams((p) => ({ ...p, professionalTaxMonthly: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Estimated Annual Income Tax (TDS) ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={params.annualTaxDeducted}
                onChange={(e) => setParams((p) => ({ ...p, annualTaxDeducted: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Medical Insurance Premium /mo ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="250"
                value={params.insuranceDeductionMonthly}
                onChange={(e) => setParams((p) => ({ ...p, insuranceDeductionMonthly: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Visual Progress & Detailed Payroll Breakdown */}
        <div className="lg:col-span-8 space-y-5">
          {/* Visual Distribution Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">CTC Distribution Architecture</h3>
                <p className="text-xs text-slate-400">How your total compensation is split between take-home pay, taxes, and retirement</p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Split Progress Bar */}
            <div className="space-y-2">
              <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${result.takeHomePercentage}%` }}
                  className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-300"
                  title={`Net In-Hand: ${result.takeHomePercentage}%`}
                />
                <div
                  style={{ width: `${result.deductionPercentage}%` }}
                  className="bg-rose-500 hover:bg-rose-400 transition-all duration-300"
                  title={`Deductions: ${result.deductionPercentage}%`}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                  Net Take-Home: {formatCurrency(result.takeHomeAnnual, currencySymbol)} ({result.takeHomePercentage}%)
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded bg-rose-500" />
                  Total Deductions: {formatCurrency(result.totalDeductionsAnnual, currencySymbol)} ({result.deductionPercentage}%)
                </span>
              </div>
            </div>

            {/* Detailed Salary Itemized Ledger Table */}
            <div className="pt-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Itemized Compensation Breakdown
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Salary Component</th>
                      <th className="py-2.5 px-3 text-center">Category</th>
                      <th className="py-2.5 px-3 text-right">Monthly</th>
                      <th className="py-2.5 px-3 text-right">Annual</th>
                      <th className="py-2.5 px-3 text-right">% of CTC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {result.breakdown.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-200 font-sans font-medium">
                          {item.component}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                              item.category === 'earning'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : item.category === 'deduction'
                                ? 'bg-rose-500/10 text-rose-400'
                                : 'bg-sky-500/10 text-sky-400'
                            }`}
                          >
                            {item.category === 'earning' ? 'Earnings' : item.category === 'deduction' ? 'Deduction' : 'Benefit'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(item.monthly, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-200">
                          {formatCurrency(item.annual, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-400">
                          {item.percentOfCTC}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-mono text-xs border-t border-slate-800 font-bold">
                    <tr className="text-emerald-400 border-t border-slate-800">
                      <td colSpan={2} className="py-2.5 px-3 font-sans">
                        Net Take-Home Pay (In-Hand):
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(result.takeHomeMonthly, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {formatCurrency(result.takeHomeAnnual, currencySymbol)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {result.takeHomePercentage}%
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
