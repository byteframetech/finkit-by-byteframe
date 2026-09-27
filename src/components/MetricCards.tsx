import React from 'react';
import { CalculationResult, LoanParams } from '../types';
import { formatCurrency } from '../utils/loanCalculations';
import { Calendar, TrendingUp, DollarSign, Wallet, Zap } from 'lucide-react';

interface MetricCardsProps {
  results: CalculationResult;
  params: LoanParams;
  currencySymbol: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  results,
  params,
  currencySymbol,
}) => {
  const hasExtra = params.extraMonthlyPayment > 0 || params.lumpSumPayment > 0;
  const savings = results.savingsWithExtra;

  return (
    <div className="space-y-2">
      {/* 4 Ultra-Compact Metric KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {/* Metric 1: Monthly Payment (EMI) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Monthly Payment (EMI)</span>
            <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <DollarSign className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(results.monthlyPayment, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {hasExtra && params.extraMonthlyPayment > 0 ? (
              <span className="text-emerald-400 font-mono">
                +{formatCurrency(params.extraMonthlyPayment, currencySymbol)} extra
              </span>
            ) : (
              <span>Fixed monthly</span>
            )}
          </div>
        </div>

        {/* Metric 2: Total Interest */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Total Interest</span>
            <div className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 ml-1">
              <TrendingUp className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(results.totalInterest, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {results.interestPercentage}% of borrowing
          </div>
        </div>

        {/* Metric 3: Total Repayment */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Total Repayment</span>
            <div className="w-4 h-4 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 ml-1">
              <Wallet className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(results.totalRepayment, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Principal + Interest
          </div>
        </div>

        {/* Metric 4: Payoff Date */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Payoff Date</span>
            <div className="w-4 h-4 rounded bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 ml-1">
              <Calendar className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold text-sky-300 tracking-tight mt-1 truncate leading-tight">
            {results.payoffDate}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            {results.totalMonths} total payments
          </div>
        </div>
      </div>

      {/* Extra Payments Highlight Strip (When active) */}
      {savings && (savings.interestSaved > 0 || savings.monthsSaved > 0) && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl px-3 py-1.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <Zap className="w-3 h-3" />
            </div>
            <p className="text-[11px] text-slate-300">
              Extra principal saves{' '}
              <strong className="text-white font-mono">{formatCurrency(savings.interestSaved, currencySymbol)}</strong>{' '}
              and finishes{' '}
              <strong className="text-white font-mono">{savings.monthsSaved} month{savings.monthsSaved !== 1 ? 's' : ''}</strong> early!
            </p>
          </div>
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
            -{savings.monthsSaved} Mos
          </span>
        </div>
      )}
    </div>
  );
};
