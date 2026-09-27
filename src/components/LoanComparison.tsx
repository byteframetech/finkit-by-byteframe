import React, { useState } from 'react';
import { LoanParams, RateShockParams } from '../types';
import {
  calculateLoan,
  calculateRateShock,
  calculateBiWeeklyLoan,
  formatCurrency,
  formatPercent,
} from '../utils/loanCalculations';
import {
  ArrowRight,
  Check,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  Zap,
  Calendar,
  Sparkles,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface LoanComparisonProps {
  currentParams: LoanParams;
  currencySymbol: string;
}

export const LoanComparison: React.FC<LoanComparisonProps> = ({
  currentParams,
  currencySymbol,
}) => {
  const [activeTab, setActiveTab] = useState<'refinance' | 'rate_shock' | 'bi_weekly'>('refinance');

  // Refinance Scenario B state
  const [altRate, setAltRate] = useState<number>(Math.max(0.5, currentParams.annualInterestRate - 1.0));
  const [altYears, setAltYears] = useState<number>(
    Math.max(1, currentParams.years > 5 ? currentParams.years - 5 : currentParams.years)
  );
  const [altMonths, setAltMonths] = useState<number>(0);
  const [altPrincipal, setAltPrincipal] = useState<number>(currentParams.principal);

  // Rate Shock Stress Test State
  const [shockMonth, setShockMonth] = useState<number>(12);
  const [rateHikePercent, setRateHikePercent] = useState<number>(1.5);
  const [shockAdjustmentMode, setShockAdjustmentMode] = useState<'increase_emi' | 'extend_tenure'>('increase_emi');

  // Calculations
  const currentResult = calculateLoan(currentParams);
  const altParams: LoanParams = {
    ...currentParams,
    principal: altPrincipal,
    annualInterestRate: altRate,
    years: altYears,
    months: altMonths,
  };
  const altResult = calculateLoan(altParams);

  const monthlyDiff = altResult.monthlyPayment - currentResult.monthlyPayment;
  const interestDiff = altResult.totalInterest - currentResult.totalInterest;

  // Rate Shock Result
  const rateShockResult = calculateRateShock(currentParams, {
    shockMonth,
    rateHikePercent,
    adjustmentMode: shockAdjustmentMode,
  });

  // Bi-Weekly Result
  const biWeeklyResult = calculateBiWeeklyLoan(currentParams);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Tab Navigation Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Lending Intelligence & Comparative Scenarios
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Refinance modeling, floating rate shock stress testing & bi-weekly acceleration
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('refinance')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'refinance'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Refinance</span>
          </button>

          <button
            onClick={() => setActiveTab('rate_shock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'rate_shock'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rate Shock Test</span>
          </button>

          <button
            onClick={() => setActiveTab('bi_weekly')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'bi_weekly'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Bi-Weekly Payoff</span>
          </button>
        </div>
      </div>

      {/* TAB 1: REFINANCE SIMULATOR */}
      {activeTab === 'refinance' && (
        <div className="space-y-6">
          {/* Alternative Scenario Controls */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Scenario B Parameters (Alternative / Refinance)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Alternative Loan Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={altPrincipal}
                  onChange={(e) => setAltPrincipal(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Alternative Rate: <span className="text-emerald-400 font-mono">{altRate.toFixed(2)}%</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.05"
                  value={altRate}
                  onChange={(e) => setAltRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Alternative Term: <span className="text-emerald-400 font-mono">{altYears}y {altMonths}m</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={altYears}
                    onChange={(e) => setAltYears(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                  <input
                    type="number"
                    min="0"
                    max="11"
                    value={altMonths}
                    onChange={(e) => setAltMonths(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Comparative Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Scenario A (Current Baseline)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Payment:</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {formatCurrency(currentResult.monthlyPayment, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Interest:</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(currentResult.totalInterest, currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Repayment:</span>
                  <span className="text-slate-200 font-mono">{formatCurrency(currentResult.totalRepayment, currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Duration:</span>
                  <span className="text-slate-200 font-mono">{currentResult.totalMonths} months</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/10 space-y-3">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                Scenario B (Alternative Loan)
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Monthly Payment:</span>
                  <span className="text-emerald-400 font-mono font-bold text-sm">
                    {formatCurrency(altResult.monthlyPayment, currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Interest:</span>
                  <span className="text-amber-400 font-mono">{formatCurrency(altResult.totalInterest, currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Repayment:</span>
                  <span className="text-slate-200 font-mono">{formatCurrency(altResult.totalRepayment, currencySymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Duration:</span>
                  <span className="text-slate-200 font-mono">{altResult.totalMonths} months</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Impact Bar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400">Net Lifetime Interest Impact</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {interestDiff < 0 ? (
                  <>
                    <ArrowDownRight className="w-5 h-5 text-emerald-400" />
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      Save {formatCurrency(Math.abs(interestDiff), currencySymbol)}
                    </span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-400" />
                    <span className="text-lg font-bold font-mono text-rose-400">
                      Costs {formatCurrency(interestDiff, currencySymbol)} more
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Monthly Payment Delta</span>
              <div className="flex items-center gap-1.5 justify-end mt-0.5">
                <span className={`text-base font-bold font-mono ${monthlyDiff <= 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                  {monthlyDiff <= 0 ? '-' : '+'}
                  {formatCurrency(Math.abs(monthlyDiff), currencySymbol)}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: "WHAT-IF" INTEREST RATE SHOCK STRESS TEST */}
      {activeTab === 'rate_shock' && (
        <div className="space-y-5">
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
                Floating Interest Rate Hike Stress Test
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              If central bank interest rates rise, how vulnerable is your loan? Simulate an unexpected rate hike mid-tenure to determine whether your monthly EMI increases or your loan duration extends.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Rate Hike Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Rate Hike Size</span>
                  <span className="text-amber-400 font-bold font-mono">+{rateHikePercent.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="5.0"
                  step="0.25"
                  value={rateHikePercent}
                  onChange={(e) => setRateHikePercent(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  {currentParams.annualInterestRate}% → {(currentParams.annualInterestRate + rateHikePercent).toFixed(2)}%
                </span>
              </div>

              {/* Shock Timing */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Hike Month</span>
                  <span className="text-white font-bold font-mono">Month {shockMonth}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={Math.max(2, currentParams.years * 12 - 1)}
                  step="1"
                  value={shockMonth}
                  onChange={(e) => setShockMonth(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 font-mono">
                  Occurs {Math.floor(shockMonth / 12)}y {shockMonth % 12}m into loan
                </span>
              </div>

              {/* Adjustment Mode */}
              <div className="space-y-1">
                <span className="text-xs text-slate-400 block">Bank Policy Reaction</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setShockAdjustmentMode('increase_emi')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      shockAdjustmentMode === 'increase_emi'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Increase EMI
                  </button>
                  <button
                    onClick={() => setShockAdjustmentMode('extend_tenure')}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      shockAdjustmentMode === 'extend_tenure'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    Extend Tenure
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rate Shock Outcome Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">New Adjusted Monthly EMI</span>
              <div className="text-xl font-bold font-mono text-white">
                {formatCurrency(rateShockResult.newEMI, currencySymbol)}
              </div>
              <span className="text-[11px] text-rose-400 block mt-1">
                {rateShockResult.monthlyEMIDifference > 0
                  ? `+${formatCurrency(rateShockResult.monthlyEMIDifference, currencySymbol)}/mo increase`
                  : 'Kept constant (tenure stretched)'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Tenure Impact</span>
              <div className="text-xl font-bold font-mono text-white">
                {rateShockResult.newPayoffMonths} Months
              </div>
              <span className="text-[11px] text-amber-400 block mt-1">
                {rateShockResult.tenureExtensionMonths > 0
                  ? `+${rateShockResult.tenureExtensionMonths} months added to loan`
                  : 'Payoff date unchanged'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Extra Interest Extracted</span>
              <div className="text-xl font-bold font-mono text-rose-400">
                +{formatCurrency(rateShockResult.extraInterestPaid, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Total Interest: {formatCurrency(rateShockResult.newTotalInterest, currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BI-WEEKLY ACCELERATED PAYMENT SIMULATOR */}
      {activeTab === 'bi_weekly' && (
        <div className="space-y-5">
          <div className="p-4 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
                Accelerated Bi-Weekly Payment Strategy (26 Payments/Year)
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              By paying half your monthly EMI every 2 weeks, you make 26 half-payments a year—equivalent to 13 full monthly payments! That single extra payment each year quietly shaves years off your mortgage or loan with zero lifestyle pain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30">
              <span className="text-xs text-slate-400 block mb-1">Bi-Weekly Payment Amount</span>
              <div className="text-2xl font-bold font-mono text-cyan-400">
                {formatCurrency(biWeeklyResult.biWeeklyPayment, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Paid every 2 weeks (vs {formatCurrency(biWeeklyResult.monthlyPayment, currencySymbol)} monthly)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Time Shaved Off Loan</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {biWeeklyResult.monthsSaved} Months
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                Payoff in {(biWeeklyResult.payoffMonthsBiWeekly / 12).toFixed(1)} yrs (vs {currentParams.years} yrs)
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400 block mb-1">Total Lifetime Interest Saved</span>
              <div className="text-2xl font-bold font-mono text-emerald-300">
                {formatCurrency(biWeeklyResult.interestSaved, currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400 block mt-1">
                {((biWeeklyResult.interestSaved / biWeeklyResult.totalInterestMonthly) * 100).toFixed(1)}% total interest cut
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
