import React, { useState, useMemo } from 'react';
import { IncomeTaxParams, TaxRegime } from '../types';
import {
  calculateIncomeTax,
  calculateMultiYearTax,
  generateTaxCSV,
} from '../utils/taxAndSalaryCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  Receipt,
  Wallet,
  Percent,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Scale,
  Calendar,
  TrendingUp,
} from 'lucide-react';

interface IncomeTaxCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const IncomeTaxCalculator: React.FC<IncomeTaxCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<IncomeTaxParams>({
    regime: 'new',
    financialYear: '2025-26',
    grossAnnualIncome: 1200000,
    otherIncome: 50000,
    standardDeduction: 75000,
    section80C: 150000,
    section80D: 25000,
    hraDeduction: 120000,
    homeLoanInterest: 0,
    npsSection80CCD: 50000,
    otherDeductions: 0,
  });

  const [activeTab, setActiveTab] = useState<'single_year' | 'multi_year'>('single_year');
  const [annualSalaryHike, setAnnualSalaryHike] = useState<number>(10);
  const [showDeductions, setShowDeductions] = useState(false);
  const [viewComparison, setViewComparison] = useState(false);

  const result = useMemo(() => calculateIncomeTax(params), [params]);
  const multiYear = useMemo(
    () => calculateMultiYearTax(params, annualSalaryHike, 5),
    [params, annualSalaryHike]
  );

  const current = result.currentRegime;
  const alternate = result.alternateRegime;

  const handleReset = () => {
    setParams({
      regime: 'new',
      financialYear: '2025-26',
      grossAnnualIncome: 1200000,
      otherIncome: 50000,
      standardDeduction: 75000,
      section80C: 150000,
      section80D: 25000,
      hraDeduction: 120000,
      homeLoanInterest: 0,
      npsSection80CCD: 50000,
      otherDeductions: 0,
    });
    setAnnualSalaryHike(10);
    onToast(`Reset Income Tax calculator to ₹12,00,000 baseline in New Regime`);
  };

  const handleDownloadCSV = () => {
    if (activeTab === 'multi_year') {
      const headers = [
        'Projection Year',
        'Financial Year',
        `Projected Gross Salary (${currencySymbol})`,
        `New Regime Tax (${currencySymbol})`,
        `Old Regime Tax (${currencySymbol})`,
        'Winning Regime',
        `Annual Tax Savings (${currencySymbol})`,
        `Cumulative Savings (${currencySymbol})`,
        `Net In-Hand Take-Home (${currencySymbol})`,
      ];
      const rows = multiYear.years.map((y) => [
        `Year ${y.yearIndex}`,
        y.financialYear,
        y.projectedGrossSalary.toFixed(2),
        y.newRegimeTax.toFixed(2),
        y.oldRegimeTax.toFixed(2),
        y.recommendedRegime.toUpperCase(),
        y.annualSavings.toFixed(2),
        y.cumulativeSavings.toFixed(2),
        y.inHandTakeHome.toFixed(2),
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `multi_year_tax_projection_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onToast('Exported 5-Year Tax Projection to CSV');
    } else {
      const csv = generateTaxCSV(result, currencySymbol);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tax_breakdown_${params.financialYear}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      onToast('Tax schedule exported to CSV');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('single_year')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'single_year'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>FY {params.financialYear} Slabs</span>
          </button>
          <button
            onClick={() => setActiveTab('multi_year')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'multi_year'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>3-5 Year Tax Horizon</span>
          </button>
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

      {/* 4 Compact Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {activeTab === 'single_year' ? (
          <>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-700/80 transition-colors">
              <span className="font-medium text-slate-300 text-[11px] block">Total Tax Payable</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-rose-400 mt-0.5">
                {formatCurrency(current.totalTax, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                {formatCurrency(current.monthlyTax, currencySymbol)}/mo TDS
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-700/80 transition-colors">
              <span className="font-medium text-slate-300 text-[11px] block">Net In-Hand Pay</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatCurrency(current.inHandAnnual, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                {formatCurrency(current.inHandMonthly, currencySymbol)}/mo
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-700/80 transition-colors">
              <span className="font-medium text-slate-300 text-[11px] block">Effective Tax Rate</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                {formatPercent(current.effectiveRate)}
              </div>
              <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                Marginal: {current.marginalRate}%
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5 hover:border-slate-700/80 transition-colors">
              <span className="font-medium text-slate-300 text-[11px] block">Regime Benchmark</span>
              <div className="text-sm sm:text-base font-bold font-mono text-cyan-400 mt-0.5">
                {result.recommendedRegime === params.regime ? 'Optimal Choice' : 'Switch Advised'}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {result.taxSavingsWithRecommendation > 0
                  ? `Save ${formatCurrency(result.taxSavingsWithRecommendation, currencySymbol)}`
                  : 'Regimes equal'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="font-medium text-slate-300 text-[11px] block">5-Year Gross Salary</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-white mt-0.5">
                {formatCurrency(multiYear.total5YearGross, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                With +{annualSalaryHike}% annual hikes
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="font-medium text-slate-300 text-[11px] block">5-Year Cumulative Tax</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-amber-400 mt-0.5">
                {formatCurrency(Math.min(multiYear.total5YearNewTax, multiYear.total5YearOldTax), currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Under winning regimes
              </span>
            </div>

            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl px-3.5 py-2.5">
              <span className="font-medium text-slate-300 text-[11px] block">Cumulative Tax Savings</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {formatCurrency(multiYear.totalCumulativeSavings, currencySymbol)}
              </div>
              <span className="text-[11px] text-emerald-400/80 mt-0.5 block">
                Total savings by picking optimal regime
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2.5">
              <span className="font-medium text-slate-300 text-[11px] block">5-Year Net In-Hand Pay</span>
              <div className="text-lg sm:text-xl font-bold font-mono text-cyan-400 mt-0.5">
                {formatCurrency(multiYear.total5YearGross - Math.min(multiYear.total5YearNewTax, multiYear.total5YearOldTax), currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Total money deposited into bank
              </span>
            </div>
          </>
        )}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              <span>Income & Deductions Setup</span>
            </span>
            <span className="text-xs font-mono text-emerald-400">FY {params.financialYear}</span>
          </h3>

          {/* Regime Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">Active Tax Regime</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setParams((p) => ({ ...p, regime: 'new' }))}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  params.regime === 'new'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                New Regime (Default)
              </button>
              <button
                onClick={() => setParams((p) => ({ ...p, regime: 'old' }))}
                className={`py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  params.regime === 'old'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Old Regime (Itemized)
              </button>
            </div>
          </div>

          {/* Gross Salary */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Gross Annual Salary ({currencySymbol})
            </label>
            <input
              type="number"
              min={100000}
              step={50000}
              value={params.grossAnnualIncome}
              onChange={(e) =>
                setParams((p) => ({ ...p, grossAnnualIncome: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Multi-Year Hike Slider (if multi_year mode) */}
          {activeTab === 'multi_year' && (
            <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Anticipated Annual Salary Increment</span>
                </span>
                <span className="text-cyan-400 font-mono font-bold">+{annualSalaryHike}% / yr</span>
              </div>
              <input
                type="range"
                min={3}
                max={25}
                step={1}
                value={annualSalaryHike}
                onChange={(e) => setAnnualSalaryHike(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Projects your bracket escalation from Year 1 ({formatCurrency(params.grossAnnualIncome, currencySymbol)}) to Year 5 ({formatCurrency(multiYear.years[4]?.projectedGrossSalary || 0, currencySymbol)}).
              </span>
            </div>
          )}

          {/* Other Income */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Other Income (Interest / Dividends) ({currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              step={10000}
              value={params.otherIncome}
              onChange={(e) =>
                setParams((p) => ({ ...p, otherIncome: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Deductions accordion toggle */}
          <button
            onClick={() => setShowDeductions(!showDeductions)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-medium cursor-pointer hover:bg-slate-900"
          >
            <span>Deductions & Exemptions (80C, 80D, 24b)</span>
            {showDeductions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showDeductions && (
            <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">Section 80C (PPF, EPF, ELSS up to 1.5L)</label>
                <input
                  type="number"
                  min={0}
                  max={150000}
                  step={10000}
                  value={params.section80C}
                  onChange={(e) => setParams((p) => ({ ...p, section80C: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">Section 80D (Health Insurance up to 50k)</label>
                <input
                  type="number"
                  min={0}
                  max={50000}
                  step={5000}
                  value={params.section80D}
                  onChange={(e) => setParams((p) => ({ ...p, section80D: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">Section 24(b) Home Loan Interest (up to 2L)</label>
                <input
                  type="number"
                  min={0}
                  max={200000}
                  step={10000}
                  value={params.homeLoanInterest}
                  onChange={(e) => setParams((p) => ({ ...p, homeLoanInterest: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block">HRA Exemption</label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={params.hraDeduction}
                  onChange={(e) => setParams((p) => ({ ...p, hraDeduction: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Analytics / Multi-Year Ledger (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeTab === 'single_year' ? (
            /* Single Year Slabs Table */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Tax Slabs Breakdown ({current.regimeName})
                </h4>
                <span className="text-xs font-mono text-emerald-400">
                  Total Tax: {formatCurrency(current.totalTax, currencySymbol)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Income Slab</th>
                      <th className="py-2.5 px-3 text-center">Tax Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable in Slab</th>
                      <th className="py-2.5 px-3 text-right">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {current.brackets.map((b, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 text-slate-300 font-sans">
                          {b.to === null
                            ? `Above ${formatCurrency(b.from, currencySymbol)}`
                            : `${formatCurrency(b.from, currencySymbol)} – ${formatCurrency(b.to, currencySymbol)}`}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[11px] ${b.rate === 0 ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/10 text-rose-400'}`}>
                            {b.rate}%
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(b.taxableInBracket, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400 font-semibold">
                          {formatCurrency(b.taxAmount, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 font-mono text-xs border-t border-slate-800">
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-400 text-right font-sans">Base Tax Sum:</td>
                      <td className="py-2 px-3 text-right text-slate-200">{formatCurrency(current.baseTax, currencySymbol)}</td>
                    </tr>
                    {current.rebate > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2 px-3 text-emerald-400 text-right font-sans">Less Section 87A Rebate:</td>
                        <td className="py-2 px-3 text-right text-emerald-400">-{formatCurrency(current.rebate, currencySymbol)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="py-2 px-3 text-slate-400 text-right font-sans">Health & Education Cess (4%):</td>
                      <td className="py-2 px-3 text-right text-slate-300">+{formatCurrency(current.cess, currencySymbol)}</td>
                    </tr>
                    <tr className="font-bold border-t border-slate-800 text-rose-400">
                      <td colSpan={3} className="py-2.5 px-3 text-right font-sans">Net Total Tax Payable:</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(current.totalTax, currencySymbol)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            /* Multi-Year 5-Year Horizon Projection View */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <span>5-Year Tax Liability & Salary Horizon</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Compounding salary growth vs progressive tax brackets
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  Total Saved: {formatCurrency(multiYear.totalCumulativeSavings, currencySymbol)}
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3 text-right">Gross Salary</th>
                      <th className="py-2.5 px-3 text-right">New Regime</th>
                      <th className="py-2.5 px-3 text-right">Old Regime</th>
                      <th className="py-2.5 px-3 text-center">Best Choice</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">Annual Savings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {multiYear.years.map((y) => (
                      <tr key={y.yearIndex} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-sans text-white font-medium">
                          Year {y.yearIndex} ({y.financialYear})
                        </td>
                        <td className="py-2.5 px-3 text-right text-white">
                          {formatCurrency(y.projectedGrossSalary, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatCurrency(y.newRegimeTax, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatCurrency(y.oldRegimeTax, currencySymbol)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            y.recommendedRegime === 'new'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          }`}>
                            {y.recommendedRegime.toUpperCase()} REGIME
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                          {formatCurrency(y.annualSavings, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
