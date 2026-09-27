import React, { useState, useMemo } from 'react';
import { ESOPParams } from '../types';
import { calculateESOPTax } from '../utils/taxAndSalaryCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  Award,
  TrendingUp,
  Download,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Percent,
  Layers,
  Scale,
} from 'lucide-react';

interface ESOPCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const ESOPCalculator: React.FC<ESOPCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<ESOPParams>({
    planType: 'RSU',
    companyType: 'listed_foreign',
    totalUnitsGranted: 500,
    exercisePricePerUnit: 0, // 0 for RSUs
    fmvAtVestingExercise: 12000, // e.g. $150 or ₹12,000 per share
    currentSalePrice: 18500,
    unitsToSell: 500,
    holdingMonthsSinceExercise: 18,
    marginalIncomeTaxSlab: 31.2, // standard 30% + 4% cess
  });

  const result = useMemo(() => calculateESOPTax(params), [params]);

  const handleApplyPreset = (preset: 'foreign_rsu' | 'startup_esop' | 'domestic_listed') => {
    if (preset === 'foreign_rsu') {
      setParams({
        planType: 'RSU',
        companyType: 'listed_foreign',
        totalUnitsGranted: 500,
        exercisePricePerUnit: 0,
        fmvAtVestingExercise: 12000,
        currentSalePrice: 18500,
        unitsToSell: 500,
        holdingMonthsSinceExercise: 26, // LTCG
        marginalIncomeTaxSlab: 31.2,
      });
      onToast('Loaded US Tech MNC Foreign RSU profile (Meta/Google/Amazon)');
    } else if (preset === 'startup_esop') {
      setParams({
        planType: 'ESOP',
        companyType: 'unlisted_startup',
        totalUnitsGranted: 2000,
        exercisePricePerUnit: 100,
        fmvAtVestingExercise: 2500,
        currentSalePrice: 6000,
        unitsToSell: 2000,
        holdingMonthsSinceExercise: 30, // LTCG
        marginalIncomeTaxSlab: 31.2,
      });
      onToast('Loaded Pre-IPO Startup ESOP Exercise & Sale profile');
    } else {
      setParams({
        planType: 'RSU',
        companyType: 'listed_domestic',
        totalUnitsGranted: 1000,
        exercisePricePerUnit: 0,
        fmvAtVestingExercise: 1500,
        currentSalePrice: 2400,
        unitsToSell: 1000,
        holdingMonthsSinceExercise: 14, // LTCG (12m threshold)
        marginalIncomeTaxSlab: 31.2,
      });
      onToast('Loaded Domestic Indian Listed Tech Stock profile');
    }
  };

  const handleReset = () => {
    handleApplyPreset('foreign_rsu');
  };

  const handleDownloadCSV = () => {
    const headers = ['Stage & Metric', 'Value'];
    const rows = [
      ['Plan Type', params.planType],
      ['Company Type', params.companyType],
      ['Units Sold', params.unitsToSell.toString()],
      ['Exercise Price per Unit', params.exercisePricePerUnit.toFixed(2)],
      ['FMV at Vesting / Exercise', params.fmvAtVestingExercise.toFixed(2)],
      ['Sale Price per Unit', params.currentSalePrice.toFixed(2)],
      ['STAGE 1: VESTING / PERQUISITE TAX', ''],
      ['Total Perquisite Value', result.totalPerquisiteValue.toFixed(2)],
      ['Perquisite Tax Due at Vesting', result.perquisiteTaxPayable.toFixed(2)],
      ['STAGE 2: SALE / CAPITAL GAINS TAX', ''],
      ['Total Sale Proceeds', result.totalSaleProceeds.toFixed(2)],
      ['Cost Basis (FMV at Exercise)', result.totalCostBasis.toFixed(2)],
      ['Capital Gain Classification', result.capitalGainType],
      ['Capital Gains Tax Payable', result.capitalGainTaxPayable.toFixed(2)],
      ['TOTALS', ''],
      ['Total Combined Tax (Stage 1 + 2)', result.totalCombinedTax.toFixed(2)],
      ['Net Realized Post-Tax Wealth', result.netPostTaxWealth.toFixed(2)],
      ['Effective Combined Tax Rate', `${result.effectiveTotalTaxRate}%`],
    ];

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `esop_rsu_taxation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported ESOP/RSU tax model to CSV');
  };

  return (
    <div className="space-y-5">
      {/* Header ribbon */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                RSU & ESOP Vesting & Sale Taxation Engine
              </h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                Dual-Stage Tax
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurately model Stage 1 (Perquisite Salary Tax at Vesting) and Stage 2 (Capital Gains Tax at Sale)
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

        {/* Preset chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto">
          <span className="text-slate-500 text-[11px] font-medium uppercase font-mono mr-1 shrink-0">
            Presets:
          </span>
          <button
            onClick={() => handleApplyPreset('foreign_rsu')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              params.companyType === 'listed_foreign'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Foreign MNC RSUs (US Tech)
          </button>
          <button
            onClick={() => handleApplyPreset('startup_esop')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              params.companyType === 'unlisted_startup'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Pre-IPO Startup ESOPs
          </button>
          <button
            onClick={() => handleApplyPreset('domestic_listed')}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
              params.companyType === 'listed_domestic'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Domestic Indian Listed Equity
          </button>
        </div>
      </div>

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Net Post-Tax Realization */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Net Realized Cash in Hand</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(result.netPostTaxWealth, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            After both Stage 1 & Stage 2 taxes
          </span>
        </div>

        {/* Stage 1 Perquisite Tax */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Stage 1: Perquisite Tax (Vesting)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(result.perquisiteTaxPayable, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Withheld as TDS via payroll
          </span>
        </div>

        {/* Stage 2 Capital Gains Tax */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Stage 2: Capital Gains Tax</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {formatCurrency(result.capitalGainTaxPayable, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {result.capitalGainType} @ {result.applicableCapitalGainRate}%
          </span>
        </div>

        {/* Total Effective Combined Tax Rate */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Effective Total Tax Drag</span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {result.effectiveTotalTaxRate.toFixed(1)}%
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Total Tax: {formatCurrency(result.totalCombinedTax, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form Controls (5 columns) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Grant & Market Valuation</span>
          </h3>

          {/* Plan Type & Company Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Plan Instrument</label>
              <select
                value={params.planType}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    planType: e.target.value as 'RSU' | 'ESOP',
                    exercisePricePerUnit: e.target.value === 'RSU' ? 0 : prev.exercisePricePerUnit,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
              >
                <option value="RSU">RSU (Zero Exercise)</option>
                <option value="ESOP">ESOP (Stock Options)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Entity Type</label>
              <select
                value={params.companyType}
                onChange={(e) =>
                  setParams((prev) => ({
                    ...prev,
                    companyType: e.target.value as any,
                  }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
              >
                <option value="listed_foreign">Foreign Listed (US RSU)</option>
                <option value="listed_domestic">Domestic Indian Listed</option>
                <option value="unlisted_startup">Unlisted / Startup</option>
              </select>
            </div>
          </div>

          {/* Units */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Units Exercised / Sold
            </label>
            <input
              type="number"
              min={1}
              step={10}
              value={params.unitsToSell}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, unitsToSell: Math.max(1, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Exercise Price (if ESOP) */}
          {params.planType === 'ESOP' && (
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium block">
                Exercise Price per Unit ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                step={10}
                value={params.exercisePricePerUnit}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, exercisePricePerUnit: Math.max(0, Number(e.target.value)) }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          )}

          {/* FMV on Vesting / Exercise Date */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              FMV on Vesting / Exercise Date ({currencySymbol})
            </label>
            <input
              type="number"
              min={1}
              step={100}
              value={params.fmvAtVestingExercise}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, fmvAtVestingExercise: Math.max(1, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">
              This sets your cost basis for Stage 2 capital gains tax.
            </p>
          </div>

          {/* Sale Price per Unit */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Actual / Projected Sale Price ({currencySymbol})
            </label>
            <input
              type="number"
              min={1}
              step={100}
              value={params.currentSalePrice}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, currentSalePrice: Math.max(1, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Holding Months Since Exercise */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Holding Months Since Exercise</span>
              <span className="text-emerald-400 font-mono font-bold">{params.holdingMonthsSinceExercise} Months</span>
            </div>
            <input
              type="range"
              min={1}
              max={60}
              step={1}
              value={params.holdingMonthsSinceExercise}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, holdingMonthsSinceExercise: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>1 Mo</span>
              <span>12 Mo (Domestic threshold)</span>
              <span>24 Mo (Foreign threshold)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Two-Stage Visual Flow & Breakdown (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Stage 1 Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                  1
                </span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Stage 1: Vesting / Exercise (Perquisite Salary Tax)
                </h4>
              </div>
              <span className="text-xs font-mono text-amber-400 font-semibold">
                {formatCurrency(result.perquisiteTaxPayable, currencySymbol)} Tax
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When shares vest or options are exercised, the spread between the Fair Market Value and exercise price is treated as employment perquisite income and taxed at your marginal slab ({params.marginalIncomeTaxSlab}%):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Perquisite / Share:</span>
                <span className="text-white">{formatCurrency(result.perquisiteValuePerUnit, currencySymbol)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Taxable Perquisite:</span>
                <span className="text-amber-300">{formatCurrency(result.totalPerquisiteValue, currencySymbol)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Cost Basis for Sale:</span>
                <span className="text-cyan-300">{formatCurrency(result.netCostBasisPerUnit, currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Stage 2 Card */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs font-bold font-mono">
                  2
                </span>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Stage 2: Sale Event (Capital Gains Tax)
                </h4>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                {formatCurrency(result.capitalGainTaxPayable, currencySymbol)} Tax
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When you sell, gains are calculated from the vesting FMV ({formatCurrency(params.fmvAtVestingExercise, currencySymbol)}) to the sale price ({formatCurrency(params.currentSalePrice, currencySymbol)}):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-950 font-mono text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Holding Classification:</span>
                <span className="text-emerald-400 font-bold">{result.capitalGainType}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Applicable Tax Rate:</span>
                <span className="text-white">{result.applicableCapitalGainRate}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Total Gross Proceeds:</span>
                <span className="text-white">{formatCurrency(result.totalSaleProceeds, currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Combined Wealth Realization Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Full Transaction Reconciliation</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Gross Liquidity Generated:</span>
                <strong className="font-mono text-white">
                  {formatCurrency(result.totalSaleProceeds, currencySymbol)}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Less: Stage 1 Perquisite Tax:</span>
                <strong className="font-mono text-amber-400">
                  - {formatCurrency(result.perquisiteTaxPayable, currencySymbol)}
                </strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Less: Stage 2 Capital Gains Tax:</span>
                <strong className="font-mono text-cyan-400">
                  - {formatCurrency(result.capitalGainTaxPayable, currencySymbol)}
                </strong>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-sm">
                <span className="text-slate-200">Net Money In Your Bank Account:</span>
                <span className="font-mono text-emerald-400 text-base">
                  {formatCurrency(result.netPostTaxWealth, currencySymbol)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
