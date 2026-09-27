import React, { useState, useMemo } from 'react';
import { GoalParams, FinancialGoalType } from '../types';
import { calculateGoalReverseSIP } from '../utils/financialCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  Target,
  GraduationCap,
  Home,
  Palmtree,
  HeartHandshake,
  Coins,
  Download,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Percent,
} from 'lucide-react';

interface GoalBasedCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

interface GoalPreset {
  id: FinancialGoalType;
  name: string;
  icon: React.ReactNode;
  targetCorpus: number;
  targetYears: number;
  expectedAnnualReturn: number;
  annualStepUpPercent: number;
  existingSavings: number;
}

export const GoalBasedCalculator: React.FC<GoalBasedCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const PRESETS: GoalPreset[] = [
    {
      id: 'education',
      name: "Child's Education",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      targetCorpus: 10000000, // 1 Crore
      targetYears: 12,
      expectedAnnualReturn: 12.0,
      annualStepUpPercent: 10,
      existingSavings: 500000,
    },
    {
      id: 'home_purchase',
      name: 'Home Down Payment',
      icon: <Home className="w-3.5 h-3.5" />,
      targetCorpus: 3000000, // 30 Lakhs
      targetYears: 5,
      expectedAnnualReturn: 10.5,
      annualStepUpPercent: 5,
      existingSavings: 200000,
    },
    {
      id: 'retirement',
      name: 'Retirement Nest Egg',
      icon: <Target className="w-3.5 h-3.5" />,
      targetCorpus: 50000000, // 5 Crores
      targetYears: 25,
      expectedAnnualReturn: 13.0,
      annualStepUpPercent: 10,
      existingSavings: 1000000,
    },
    {
      id: 'wedding',
      name: 'Dream Wedding',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      targetCorpus: 2500000,
      targetYears: 4,
      expectedAnnualReturn: 11.0,
      annualStepUpPercent: 0,
      existingSavings: 100000,
    },
    {
      id: 'vacation',
      name: 'World Tour Sabbatical',
      icon: <Palmtree className="w-3.5 h-3.5" />,
      targetCorpus: 1200000,
      targetYears: 3,
      expectedAnnualReturn: 9.5,
      annualStepUpPercent: 0,
      existingSavings: 50000,
    },
  ];

  const [params, setParams] = useState<GoalParams>({
    goalName: "Child's Ivy League Education",
    goalType: 'education',
    targetCorpus: 10000000,
    targetYears: 12,
    expectedAnnualReturn: 12.0,
    annualStepUpPercent: 10,
    existingSavings: 500000,
  });

  const result = useMemo(() => calculateGoalReverseSIP(params), [params]);

  const handleApplyPreset = (preset: GoalPreset) => {
    setParams({
      goalName: preset.name,
      goalType: preset.id,
      targetCorpus: preset.targetCorpus,
      targetYears: preset.targetYears,
      expectedAnnualReturn: preset.expectedAnnualReturn,
      annualStepUpPercent: preset.annualStepUpPercent,
      existingSavings: preset.existingSavings,
    });
    onToast(`Applied ${preset.name} goal profile`);
  };

  const handleReset = () => {
    handleApplyPreset(PRESETS[0]);
  };

  const handleDownloadCSV = () => {
    const headers = [
      'Year',
      `Monthly Deposit (${currencySymbol})`,
      `Annual Deposit (${currencySymbol})`,
      `Cumulative Deposited (${currencySymbol})`,
      `Growth Earned (${currencySymbol})`,
      `End Portfolio Valuation (${currencySymbol})`,
      'Progress toward Target (%)',
    ];
    const rows = result.yearlyProgress.map((item) => [
      item.year,
      item.monthlyContribution.toFixed(2),
      item.annualDeposit.toFixed(2),
      item.cumulativeDeposited.toFixed(2),
      item.growthEarned.toFixed(2),
      item.portfolioValue.toFixed(2),
      `${item.targetProgressPercent.toFixed(1)}%`,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `goal_plan_${params.goalType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported Goal SIP plan to CSV');
  };

  return (
    <div className="space-y-5">
      {/* Header ribbon with Goal Presets */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Goal-Based Reverse Wealth Planner
              </h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                Reverse Engineering
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify your financial target milestone and automatically calculate the exact monthly SIP required
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

        {/* Goal Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-slate-500 text-[11px] font-medium uppercase font-mono mr-1 shrink-0">
            Goal Presets:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleApplyPreset(p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                params.goalType === p.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {p.icon}
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Required Starting Monthly SIP */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/40 to-slate-900/90 border border-emerald-500/30 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Required Starting Monthly SIP</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(result.requiredMonthlySIP, currencySymbol)}
            <span className="text-xs text-slate-400 font-normal"> / mo</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {params.annualStepUpPercent > 0
              ? `with +${params.annualStepUpPercent}% annual step-up`
              : 'fixed monthly throughout'}
          </span>
        </div>

        {/* Total Target Corpus */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Target Goal Valuation</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-cyan-400">
            {formatCurrency(params.targetCorpus, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            in {params.targetYears} Years ({params.targetYears * 12} months)
          </span>
        </div>

        {/* Total Own Capital Invested */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Capital You Deposit</span>
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-white">
            {formatCurrency(result.totalDeposited, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {((result.totalDeposited / params.targetCorpus) * 100).toFixed(1)}% of final corpus
          </span>
        </div>

        {/* Wealth Generated from Compounding */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Wealth Created (Interest/Gains)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {formatCurrency(result.totalGrowthEarned, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Pure compound interest wealth multiplier
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Controls Column (4 columns) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Target Goal Parameters</span>
          </h3>

          {/* Target Amount */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Target Goal Corpus ({currencySymbol})
            </label>
            <input
              type="number"
              min={100000}
              step={100000}
              value={params.targetCorpus}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, targetCorpus: Math.max(1000, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Target Horizon (Years) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Time Horizon</span>
              <span className="text-emerald-400 font-mono font-bold">{params.targetYears} Years</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={params.targetYears}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, targetYears: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Expected Annual CAGR Return */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Expected Return (CAGR)</span>
              <span className="text-emerald-400 font-mono font-bold">{params.expectedAnnualReturn.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={4}
              max={25}
              step={0.5}
              value={params.expectedAnnualReturn}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, expectedAnnualReturn: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Annual Step-Up % */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Annual SIP Step-Up</span>
              <span className="text-emerald-400 font-mono font-bold">+{params.annualStepUpPercent}% / yr</span>
            </div>
            <input
              type="range"
              min={0}
              max={25}
              step={1}
              value={params.annualStepUpPercent}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, annualStepUpPercent: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Stepping up your monthly SIP reduces your starting requirement drastically.
            </p>
          </div>

          {/* Existing Seed Capital */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Existing Capital / Seed Savings ({currencySymbol})
            </label>
            <input
              type="number"
              min={0}
              step={25000}
              value={params.existingSavings}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, existingSavings: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Milestone Progression Table & Insights (8 columns) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Year-by-Year Target Progression Ledger</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                Target: {formatCurrency(params.targetCorpus, currencySymbol)}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3 text-right">Monthly SIP</th>
                    <th className="py-2.5 px-3 text-right">Annual Deposit</th>
                    <th className="py-2.5 px-3 text-right">Cumulative Principal</th>
                    <th className="py-2.5 px-3 text-right">Portfolio Balance</th>
                    <th className="py-2.5 px-3 text-right">Target Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {result.yearlyProgress.map((item) => (
                    <tr key={item.year} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-sans text-white font-medium">
                        Year {item.year}
                      </td>
                      <td className="py-2 px-3 text-right text-emerald-400">
                        {formatCurrency(item.monthlyContribution, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {formatCurrency(item.annualDeposit, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {formatCurrency(item.cumulativeDeposited, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-white">
                        {formatCurrency(item.portfolioValue, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(100, item.targetProgressPercent)}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-emerald-400 font-semibold w-9 text-right">
                            {item.targetProgressPercent.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
