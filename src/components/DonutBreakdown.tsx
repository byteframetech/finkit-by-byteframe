import React from 'react';
import { CalculationResult, LoanParams } from '../types';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';

interface DonutBreakdownProps {
  results: CalculationResult;
  params: LoanParams;
  currencySymbol: string;
}

export const DonutBreakdown: React.FC<DonutBreakdownProps> = ({
  results,
  params,
  currencySymbol,
}) => {
  const principalRatio = results.principalPercentage;
  const interestRatio = results.interestPercentage;
  const costRatio = params.principal > 0 ? (results.totalInterest / params.principal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Proportion Ratio Visualizer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md flex flex-col justify-between">
        <div>
          <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-0.5">
            Payment Composition Ratio
          </h4>
          <p className="text-[11px] text-slate-400 mb-2.5">
            Distribution between principal and financing interest
          </p>

          {/* Visual Split Bar */}
          <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner mb-3">
            <div
              style={{ width: `${principalRatio}%` }}
              className="bg-emerald-500 hover:bg-emerald-400 transition-all duration-300"
              title={`Principal: ${principalRatio}%`}
            />
            <div
              style={{ width: `${interestRatio}%` }}
              className="bg-amber-500 hover:bg-amber-400 transition-all duration-300"
              title={`Interest: ${interestRatio}%`}
            />
          </div>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500" />
                <span className="text-slate-300">Principal (Borrowed):</span>
              </div>
              <div className="text-right">
                <span className="text-white font-semibold">{formatCurrency(params.principal, currencySymbol)}</span>
                <span className="text-slate-400 ml-1.5">({principalRatio}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-amber-500" />
                <span className="text-slate-300">Interest (Cost):</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 font-semibold">{formatCurrency(results.totalInterest, currencySymbol)}</span>
                <span className="text-slate-400 ml-1.5">({interestRatio}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cost Multiplier note */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
          For every <strong className="text-white font-mono">{currencySymbol}1.00</strong> borrowed, pay back{' '}
          <strong className="text-emerald-400 font-mono">
            {currencySymbol}
            {params.principal > 0 ? (results.totalRepayment / params.principal).toFixed(2) : '1.00'}
          </strong>
        </div>
      </div>

      {/* Financial Metrics Summary Table */}
      <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-md">
        <h4 className="text-xs sm:text-sm font-semibold text-white tracking-tight mb-0.5">
          Financing Cost & Annual Summary
        </h4>
        <p className="text-[11px] text-slate-400 mb-2.5">
          High-level overview of lending economics and annual debt servicing
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">Cost of Borrowing</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">
              {costRatio.toFixed(1)}%
            </span>
          </div>

          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">Annual Payment (Yr 1)</span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
              {formatCurrency(results.monthlyPayment * 12, currencySymbol)}
            </span>
          </div>

          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">Total Installments</span>
            <span className="text-sm font-bold font-mono text-white tabular-nums">
              {results.totalMonths} mos
            </span>
          </div>

          <div className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block mb-0.5">Nominal APR</span>
            <span className="text-sm font-bold font-mono text-sky-400 tabular-nums">
              {formatPercent(params.annualInterestRate)}
            </span>
          </div>
        </div>

        {/* Quick Yearly Rollup Mini-Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] text-left">
            <thead>
              <tr className="text-slate-400 border-b border-slate-800">
                <th className="py-1.5 font-medium">Year</th>
                <th className="py-1.5 text-right font-medium">Start Balance</th>
                <th className="py-1.5 text-right font-medium">Principal Paid</th>
                <th className="py-1.5 text-right font-medium">Interest Paid</th>
                <th className="py-1.5 text-right font-medium">Ending Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {results.yearlySummary.slice(0, 4).map((y) => (
                <tr key={y.yearNumber} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-1 font-sans font-medium text-slate-300">
                    Yr {y.yearNumber} ({y.calendarYear})
                  </td>
                  <td className="py-1 text-right text-slate-300">
                    {formatCurrency(y.startBalance, currencySymbol)}
                  </td>
                  <td className="py-1 text-right text-cyan-400">
                    {formatCurrency(y.principalPaid, currencySymbol)}
                  </td>
                  <td className="py-1 text-right text-amber-400">
                    {formatCurrency(y.interestPaid, currencySymbol)}
                  </td>
                  <td className="py-1 text-right text-emerald-400 font-semibold">
                    {formatCurrency(y.endBalance, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {results.yearlySummary.length > 4 && (
            <div className="text-[10px] text-slate-400 text-center py-1 italic font-sans">
              Showing first 4 years of {results.yearlySummary.length} total years. View Tab 2 for complete schedule.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
