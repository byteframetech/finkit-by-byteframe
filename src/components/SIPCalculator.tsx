import React, { useState, useMemo } from 'react';
import { SIPParams } from '../types';
import { calculateSIP, generateSIPCSV } from '../utils/financialCalculations';
import { formatCurrency } from '../utils/loanCalculations';
import { 
  TrendingUp, 
  PiggyBank, 
  Coins, 
  Sparkles, 
  Download, 
  RotateCcw,
  Zap,
  ArrowUpRight
} from 'lucide-react';

interface SIPCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const SIPCalculator: React.FC<SIPCalculatorProps> = ({ currencySymbol, onToast }) => {
  const [params, setParams] = useState<SIPParams>({
    monthlyInvestment: 5000,
    annualExpectedReturn: 12.0,
    timePeriodYears: 15,
    annualStepUpPercent: 0,
  });

  const [showStepUp, setShowStepUp] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const result = useMemo(() => calculateSIP(params), [params]);

  const handleReset = () => {
    setParams({
      monthlyInvestment: 5000,
      annualExpectedReturn: 12.0,
      timePeriodYears: 15,
      annualStepUpPercent: 0,
    });
    setShowStepUp(false);
    onToast(`Reset SIP calculator to standard ${currencySymbol}5,000/mo at 12% for 15 years`);
  };

  const handleDownloadCSV = () => {
    const csv = generateSIPCSV(result.yearlySchedule, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sip_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('SIP growth schedule exported to CSV');
  };

  // SVG Chart Dimensions
  const svgWidth = 680;
  const svgHeight = 240;
  const padL = 65;
  const padR = 25;
  const padT = 20;
  const padB = 35;
  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const maxVal = Math.max(result.totalMaturityValue, 100);

  const getX = (idx: number) => {
    if (result.yearlySchedule.length <= 1) return padL;
    return padL + (idx / (result.yearlySchedule.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padT + chartH - (Math.max(0, val) / maxVal) * chartH;
  };

  // Paths
  const balancePath = result.yearlySchedule
    .map((item, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(item.endBalance).toFixed(1)}`)
    .join(' ');

  const balanceArea = `${balancePath} L ${getX(result.yearlySchedule.length - 1).toFixed(1)} ${padT + chartH} L ${getX(0).toFixed(1)} ${padT + chartH} Z`;

  const investedPath = result.yearlySchedule
    .map((item, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(item.totalInvested).toFixed(1)}`)
    .join(' ');

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: getY(maxVal * pct),
  }));

  const activePoint = hoverIndex !== null && result.yearlySchedule[hoverIndex] ? result.yearlySchedule[hoverIndex] : null;

  return (
    <div className="space-y-6">
      {/* 4 Compact Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Total Invested</span>
            <div className="w-4 h-4 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <PiggyBank className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.totalInvested, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {result.investedPercentage}% of maturity wealth
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Estimated Returns</span>
            <div className="w-4 h-4 rounded bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0 ml-1">
              <TrendingUp className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-cyan-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.estimatedReturns, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {result.returnsPercentage}% compounded growth
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Total Maturity</span>
            <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <Coins className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.totalMaturityValue, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Expected portfolio corpus
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Multiplier</span>
            <div className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 ml-1">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {result.wealthMultiplier}x
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Growth on invested capital
          </div>
        </div>
      </div>

      {/* Main Grid: Left Controls Form, Right Visualizer & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 4 cols */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">SIP Investment Parameters</h2>
              <p className="text-xs text-slate-400">Systematic compounding wealth plan</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Monthly Investment */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Monthly Investment ({currencySymbol})</span>
              <div className="flex gap-1 font-mono text-[11px]">
                <button
                  onClick={() => setParams((p) => ({ ...p, monthlyInvestment: Math.max(50, p.monthlyInvestment - 100) }))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  -100
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, monthlyInvestment: p.monthlyInvestment + 100 }))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  +100
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, monthlyInvestment: p.monthlyInvestment + 500 }))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  +500
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="10"
                step="50"
                value={params.monthlyInvestment}
                onChange={(e) => setParams((p) => ({ ...p, monthlyInvestment: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
            <input
              type="range"
              min="50"
              max="5000"
              step="50"
              value={Math.min(params.monthlyInvestment, 5000)}
              onChange={(e) => setParams((p) => ({ ...p, monthlyInvestment: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
          </div>

          {/* Expected Return Rate */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Expected Annual Return (%)</span>
              <div className="flex gap-1 font-mono text-[11px]">
                {[8, 10, 12, 15].map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setParams((p) => ({ ...p, annualExpectedReturn: rt }))}
                    className={`px-1.5 py-0.5 rounded ${
                      params.annualExpectedReturn === rt
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {rt}%
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={params.annualExpectedReturn}
                onChange={(e) => setParams((p) => ({ ...p, annualExpectedReturn: Math.max(0.1, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-3.5 pr-8 py-2.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">%</span>
            </div>
            <input
              type="range"
              min="3"
              max="25"
              step="0.5"
              value={params.annualExpectedReturn}
              onChange={(e) => setParams((p) => ({ ...p, annualExpectedReturn: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
          </div>

          {/* Investment Tenure (Years) */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Time Period (Years)</span>
              <span className="font-mono text-emerald-400 font-semibold">{params.timePeriodYears} Years ({params.timePeriodYears * 12} mos)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {[5, 10, 15, 20, 25, 30].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setParams((p) => ({ ...p, timePeriodYears: yr }))}
                  className={`flex-1 py-1 text-[11px] rounded font-medium transition-colors ${
                    params.timePeriodYears === yr
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {yr}Y
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="1"
              value={params.timePeriodYears}
              onChange={(e) => setParams((p) => ({ ...p, timePeriodYears: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Optional Step-Up SIP */}
          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Annual Step-up SIP (%/yr)</span>
              </label>
              <button
                onClick={() => {
                  setShowStepUp(!showStepUp);
                  if (showStepUp) setParams((p) => ({ ...p, annualStepUpPercent: 0 }));
                }}
                className={`text-[11px] px-2 py-0.5 rounded transition-colors ${
                  showStepUp ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showStepUp ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {showStepUp && (
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[11px] text-slate-400 block">
                  Automatically increase SIP deposit each year to match salary raises
                </span>
                <div className="flex items-center gap-2">
                  {[5, 10, 15].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setParams((p) => ({ ...p, annualStepUpPercent: pct }))}
                      className={`flex-1 py-1 text-xs rounded font-mono ${
                        params.annualStepUpPercent === pct
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      +{pct}% /yr
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Visual Chart & Growth Table: 8 cols */}
        <div className="lg:col-span-8 space-y-5">
          {/* Chart Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <h3 className="text-base font-semibold text-white">Wealth Accumulation Trajectory</h3>
                <p className="text-xs text-slate-400">Total invested contributions vs compounded returns over time</p>
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
            <div className="mb-4 space-y-1.5">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <div style={{ width: `${result.investedPercentage}%` }} className="bg-emerald-500" title="Invested Capital" />
                <div style={{ width: `${result.returnsPercentage}%` }} className="bg-cyan-400" title="Wealth Gain" />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-emerald-500" />
                  Invested: {formatCurrency(result.totalInvested, currencySymbol)} ({result.investedPercentage}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded bg-cyan-400" />
                  Gains: {formatCurrency(result.estimatedReturns, currencySymbol)} ({result.returnsPercentage}%)
                </span>
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative w-full overflow-hidden select-none">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto cursor-crosshair"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * svgWidth;
                  const relX = x - padL;
                  const idx = Math.max(0, Math.min(result.yearlySchedule.length - 1, Math.round((relX / chartW) * (result.yearlySchedule.length - 1))));
                  setHoverIndex(idx);
                }}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <defs>
                  <linearGradient id="sipGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y Ticks */}
                {yTicks.map((t, idx) => (
                  <g key={idx}>
                    <line x1={padL} y1={t.y} x2={svgWidth - padR} y2={t.y} stroke="#334155" strokeDasharray="3 3" opacity={0.35} />
                    <text x={padL - 8} y={t.y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-mono">
                      {t.val >= 1000 ? `${currencySymbol}${(t.val / 1000).toFixed(0)}k` : `${currencySymbol}${t.val.toFixed(0)}`}
                    </text>
                  </g>
                ))}

                {/* Area and Curves */}
                <path d={balanceArea} fill="url(#sipGradient)" />
                <path d={investedPath} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" />
                <path d={balancePath} fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />

                {/* X Axis Years */}
                {result.yearlySchedule.map((item, idx) => {
                  const step = Math.max(1, Math.floor(result.yearlySchedule.length / 7));
                  if (idx !== 0 && idx !== result.yearlySchedule.length - 1 && idx % step !== 0) return null;
                  return (
                    <text key={idx} x={getX(idx)} y={padT + chartH + 18} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                      Yr {item.year}
                    </text>
                  );
                })}

                {/* Hover line */}
                {hoverIndex !== null && (
                  <g>
                    <line x1={getX(hoverIndex)} y1={padT} x2={getX(hoverIndex)} y2={padT + chartH} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" />
                    <circle cx={getX(hoverIndex)} cy={getY(result.yearlySchedule[hoverIndex].endBalance)} r="4.5" className="fill-cyan-400 stroke-slate-950 stroke-2" />
                    <circle cx={getX(hoverIndex)} cy={getY(result.yearlySchedule[hoverIndex].totalInvested)} r="3.5" className="fill-emerald-400 stroke-slate-950 stroke-2" />
                  </g>
                )}
              </svg>

              {/* Tooltip */}
              {activePoint && hoverIndex !== null && (
                <div
                  className="absolute top-2 pointer-events-none bg-slate-950/95 border border-slate-700 shadow-xl rounded-xl p-3 text-xs z-20"
                  style={{ left: `${Math.min(Math.max(10, (getX(hoverIndex) / svgWidth) * 100), 70)}%` }}
                >
                  <div className="font-semibold text-white border-b border-slate-800 pb-1 mb-1">
                    Year {activePoint.year} Milestone
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="text-cyan-400 flex justify-between gap-3">
                      <span>Portfolio Value:</span>
                      <strong>{formatCurrency(activePoint.endBalance, currencySymbol)}</strong>
                    </div>
                    <div className="text-emerald-400 flex justify-between gap-3">
                      <span>Total Invested:</span>
                      <span>{formatCurrency(activePoint.totalInvested, currencySymbol)}</span>
                    </div>
                    <div className="text-amber-400 flex justify-between gap-3">
                      <span>Wealth Gain:</span>
                      <span>+{formatCurrency(activePoint.totalWealthGain, currencySymbol)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Year by Year Growth Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-white mb-3">Year-by-Year Growth Ledger</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3 text-right">Annual Deposit</th>
                    <th className="py-2.5 px-3 text-right">Total Invested</th>
                    <th className="py-2.5 px-3 text-right">Interest in Year</th>
                    <th className="py-2.5 px-3 text-right">Total Wealth Gain</th>
                    <th className="py-2.5 px-3 text-right">Ending Corpus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.yearlySchedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-slate-300">Year {row.year}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(row.annualDeposit, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{formatCurrency(row.totalInvested, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-amber-400">+{formatCurrency(row.interestEarnedYear, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-cyan-400">+{formatCurrency(row.totalWealthGain, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-white font-semibold">{formatCurrency(row.endBalance, currencySymbol)}</td>
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
