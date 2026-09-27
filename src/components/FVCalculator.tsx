import React, { useState, useMemo } from 'react';
import { FVParams, CompoundingFrequency } from '../types';
import { calculateFV, generateFVCSV } from '../utils/financialCalculations';
import { formatCurrency } from '../utils/loanCalculations';
import { 
  Sparkles, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Download, 
  RotateCcw,
  Clock
} from 'lucide-react';

interface FVCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const FVCalculator: React.FC<FVCalculatorProps> = ({ currencySymbol, onToast }) => {
  const [params, setParams] = useState<FVParams>({
    presentValue: 100000,
    periodicPayment: 5000,
    paymentTiming: 'end',
    paymentFrequency: 'monthly',
    annualInterestRate: 8.5,
    years: 10,
    compoundingFrequency: 'monthly',
  });

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const result = useMemo(() => calculateFV(params), [params]);

  const handleReset = () => {
    setParams({
      presentValue: 100000,
      periodicPayment: 5000,
      paymentTiming: 'end',
      paymentFrequency: 'monthly',
      annualInterestRate: 8.5,
      years: 10,
      compoundingFrequency: 'monthly',
    });
    onToast(`Reset Future Value calculator to ${currencySymbol}1,00,000 PV + ${currencySymbol}5,000/mo at 8.5%`);
  };

  const handleDownloadCSV = () => {
    const csv = generateFVCSV(result.yearlySchedule, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `future_value_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Future value schedule exported to CSV');
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

  const maxVal = Math.max(result.futureValue, 100);

  const getX = (idx: number) => {
    if (result.yearlySchedule.length <= 1) return padL;
    return padL + (idx / (result.yearlySchedule.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    return padT + chartH - (Math.max(0, val) / maxVal) * chartH;
  };

  const balancePath = result.yearlySchedule
    .map((item, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(item.endingBalance).toFixed(1)}`)
    .join(' ');

  const balanceArea = `${balancePath} L ${getX(result.yearlySchedule.length - 1).toFixed(1)} ${padT + chartH} L ${getX(0).toFixed(1)} ${padT + chartH} Z`;

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
            <span className="font-medium text-slate-300 truncate">Future Value (FV)</span>
            <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <Sparkles className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.futureValue, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Total accumulated worth
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Initial Principal (PV)</span>
            <div className="w-4 h-4 rounded bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 ml-1">
              <Coins className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.initialDeposit, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Starting investment
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Added Deposits</span>
            <div className="w-4 h-4 rounded bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 ml-1">
              <Calendar className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-white tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.totalContributions, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Over {params.years} yrs
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2.5 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Interest Earned</span>
            <div className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 ml-1">
              <TrendingUp className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            +{formatCurrency(result.totalInterestEarned, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {result.interestRatio}% from compounding
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: 4 cols */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Future Value Parameters</h2>
              <p className="text-xs text-slate-400">Compound interest engine</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Initial Present Value */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              Initial Principal / Starting Balance ({currencySymbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="500"
                value={params.presentValue}
                onChange={(e) => setParams((p) => ({ ...p, presentValue: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Periodic Contribution */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Periodic Contribution ({currencySymbol})</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setParams((p) => ({ ...p, paymentFrequency: 'monthly' }))}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${params.paymentFrequency === 'monthly' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setParams((p) => ({ ...p, paymentFrequency: 'annually' }))}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${params.paymentFrequency === 'annually' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
                >
                  Annually
                </button>
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                step="50"
                value={params.periodicPayment}
                onChange={(e) => setParams((p) => ({ ...p, periodicPayment: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-8 pr-4 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Annual Interest Rate */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              Annual Interest Rate (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0.1"
                max="30"
                step="0.1"
                value={params.annualInterestRate}
                onChange={(e) => setParams((p) => ({ ...p, annualInterestRate: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-sm rounded-xl pl-3.5 pr-8 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">%</span>
            </div>
          </div>

          {/* Time Period (Years) */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1.5">
              <span>Time Horizon (Years)</span>
              <span className="font-mono text-white font-semibold">{params.years} Years</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {[3, 5, 10, 15, 20, 30].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setParams((p) => ({ ...p, years: yr }))}
                  className={`flex-1 py-1 text-[11px] rounded font-medium transition-colors ${
                    params.years === yr
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
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
              value={params.years}
              onChange={(e) => setParams((p) => ({ ...p, years: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Compounding Frequency */}
          <div>
            <label className="block text-xs text-slate-300 mb-1.5">
              Compounding Frequency
            </label>
            <select
              value={params.compoundingFrequency}
              onChange={(e) => setParams((p) => ({ ...p, compoundingFrequency: e.target.value as CompoundingFrequency }))}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="daily">Daily (365 times/yr)</option>
              <option value="monthly">Monthly (12 times/yr)</option>
              <option value="quarterly">Quarterly (4 times/yr)</option>
              <option value="semi-annually">Semi-Annually (2 times/yr)</option>
              <option value="annually">Annually (1 time/yr)</option>
            </select>
          </div>
        </div>

        {/* Right Section: Chart & Table: 8 cols */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Compound Capital Growth Trajectory</h3>
                <p className="text-xs text-slate-400">Exponential growth curves driven by periodic contributions and compounding frequency</p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
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
                  <linearGradient id="fvGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
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

                <path d={balanceArea} fill="url(#fvGradient)" />
                <path d={balancePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

                {result.yearlySchedule.map((item, idx) => {
                  const step = Math.max(1, Math.floor(result.yearlySchedule.length / 7));
                  if (idx !== 0 && idx !== result.yearlySchedule.length - 1 && idx % step !== 0) return null;
                  return (
                    <text key={idx} x={getX(idx)} y={padT + chartH + 18} textAnchor="middle" className="text-[10px] fill-slate-400 font-mono">
                      Yr {item.year}
                    </text>
                  );
                })}

                {hoverIndex !== null && (
                  <g>
                    <line x1={getX(hoverIndex)} y1={padT} x2={getX(hoverIndex)} y2={padT + chartH} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 2" />
                    <circle cx={getX(hoverIndex)} cy={getY(result.yearlySchedule[hoverIndex].endingBalance)} r="4.5" className="fill-emerald-400 stroke-slate-950 stroke-2" />
                  </g>
                )}
              </svg>

              {activePoint && hoverIndex !== null && (
                <div
                  className="absolute top-2 pointer-events-none bg-slate-950/95 border border-slate-700 shadow-xl rounded-xl p-3 text-xs z-20"
                  style={{ left: `${Math.min(Math.max(10, (getX(hoverIndex) / svgWidth) * 100), 70)}%` }}
                >
                  <div className="font-semibold text-white border-b border-slate-800 pb-1 mb-1">
                    Year {activePoint.year} Balance
                  </div>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="text-emerald-400 flex justify-between gap-3">
                      <span>Future Value:</span>
                      <strong>{formatCurrency(activePoint.endingBalance, currencySymbol)}</strong>
                    </div>
                    <div className="text-slate-300 flex justify-between gap-3">
                      <span>Added Contributions:</span>
                      <span>{formatCurrency(activePoint.cumulativeContributions, currencySymbol)}</span>
                    </div>
                    <div className="text-amber-400 flex justify-between gap-3">
                      <span>Cumulative Interest:</span>
                      <span>+{formatCurrency(activePoint.cumulativeInterest, currencySymbol)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-white mb-3">Annual Compounding Schedule</h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3 text-right">Start Balance</th>
                    <th className="py-2.5 px-3 text-right">Contributions</th>
                    <th className="py-2.5 px-3 text-right">Interest Earned</th>
                    <th className="py-2.5 px-3 text-right">Ending Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {result.yearlySchedule.map((row) => (
                    <tr key={row.year} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-sans font-medium text-slate-300">Year {row.year}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{formatCurrency(row.startingBalance, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-cyan-400">+{formatCurrency(row.contributions, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-amber-400">+{formatCurrency(row.interestEarned, currencySymbol)}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold">{formatCurrency(row.endingBalance, currencySymbol)}</td>
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
