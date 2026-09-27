import React, { useState, useMemo } from 'react';
import { SWPParams } from '../types';
import {
  calculateSWP,
  calculateSWPMonteCarlo,
  generateSWPCSV,
} from '../utils/financialCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  ArrowDownCircle,
  Wallet,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Download,
  RotateCcw,
  ShieldCheck,
  Calendar,
  Zap,
  Activity,
  BarChart2,
  Sparkles,
} from 'lucide-react';

interface SWPCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const SWPCalculator: React.FC<SWPCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<SWPParams>({
    initialCorpus: 5000000,
    monthlyWithdrawal: 35000,
    annualExpectedReturn: 8.5,
    timePeriodYears: 20,
    annualWithdrawalStepUp: 0,
  });

  const [activeTab, setActiveTab] = useState<'standard' | 'monte_carlo'>('standard');
  const [marketVolatility, setMarketVolatility] = useState<number>(14);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const result = useMemo(() => calculateSWP(params), [params]);
  const monteCarlo = useMemo(
    () => calculateSWPMonteCarlo(params, 500, marketVolatility),
    [params, marketVolatility]
  );

  const handleReset = () => {
    setParams({
      initialCorpus: 5000000,
      monthlyWithdrawal: 35000,
      annualExpectedReturn: 8.5,
      timePeriodYears: 20,
      annualWithdrawalStepUp: 0,
    });
    setMarketVolatility(14);
    onToast(`Reset SWP to ${currencySymbol}50,00,000 initial corpus, ${currencySymbol}35,000/mo withdrawal`);
  };

  const handleDownloadCSV = () => {
    const csv = generateSWPCSV(result.yearlySchedule, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `swp_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('SWP withdrawal schedule exported to CSV');
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

  const maxVal = Math.max(
    params.initialCorpus * 1.25,
    ...result.yearlySchedule.map((y) => Math.max(y.endBalance, y.startBalance)),
    1000
  );

  const points = result.yearlySchedule.map((item, idx) => {
    const x = padL + (idx / Math.max(1, result.yearlySchedule.length - 1)) * chartW;
    const y = padT + chartH - (item.endBalance / maxVal) * chartH;
    return { x, y, item, idx };
  });

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  const areaD = points.length
    ? `${pathD} L ${points[points.length - 1].x},${padT + chartH} L ${points[0].x},${padT + chartH} Z`
    : '';

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: padT + chartH - pct * chartH,
  }));

  return (
    <div className="space-y-6">
      {/* Top Controls Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'standard'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Deterministic Model</span>
          </button>
          <button
            onClick={() => setActiveTab('monte_carlo')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'monte_carlo'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Monte Carlo Volatility Stress Test</span>
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
        {activeTab === 'standard' ? (
          <>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Total Withdrawn</span>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {formatCurrency(result.totalWithdrawn, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Total cash stream</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Ending Corpus Balance</span>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {formatCurrency(result.finalCorpus, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                After {params.timePeriodYears} years
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Growth Generated</span>
              <div className="text-lg font-bold font-mono text-teal-400 mt-1">
                {formatCurrency(result.totalGrowthEarned, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Compounded yield</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Longevity Solvency</span>
              <div className={`text-base font-bold font-mono mt-1 ${result.isDepleted ? 'text-rose-400' : 'text-emerald-400'}`}>
                {result.isDepleted ? `Exhausts Yr ${result.depletedYear}` : '100% Solvent'}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {result.isDepleted ? `Month ${result.depletedMonth}` : 'Capital lasts whole horizon'}
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Probability of Success</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                {monteCarlo.successProbability}%
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Across 500 market cycles</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Depletion Risk</span>
              <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                {monteCarlo.depletionRiskPercent}%
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Sequence-of-returns hazard</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Median Ending Corpus (P50)</span>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                {formatCurrency(monteCarlo.medianEndingCorpus, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Expected median path</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
              <span className="text-[11px] text-slate-400 font-medium block">Worst-Case Bear Market (P10)</span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {formatCurrency(monteCarlo.worstCaseEndingCorpus, currencySymbol)}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">10th percentile stress</span>
            </div>
          </>
        )}
      </div>

      {/* Main Grid: Controls Left (4 cols) & Analytics Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>Retirement Parameters</span>
          </h3>

          {/* Initial Corpus */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Initial Corpus Balance ({currencySymbol})
            </label>
            <input
              type="number"
              min={100000}
              step={50000}
              value={params.initialCorpus}
              onChange={(e) =>
                setParams((p) => ({ ...p, initialCorpus: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Monthly Withdrawal */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Monthly Withdrawal</span>
              <span className="text-emerald-400 font-mono font-bold">
                {((params.monthlyWithdrawal * 12 / (params.initialCorpus || 1)) * 100).toFixed(1)}% / yr
              </span>
            </div>
            <input
              type="number"
              min={1000}
              step={1000}
              value={params.monthlyWithdrawal}
              onChange={(e) =>
                setParams((p) => ({ ...p, monthlyWithdrawal: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Expected Mean Return */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Expected Mean Return (CAGR)</span>
              <span className="text-emerald-400 font-mono font-bold">{params.annualExpectedReturn.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={3}
              max={18}
              step={0.25}
              value={params.annualExpectedReturn}
              onChange={(e) =>
                setParams((p) => ({ ...p, annualExpectedReturn: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Tenure (Years) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Withdrawal Horizon</span>
              <span className="text-emerald-400 font-mono font-bold">{params.timePeriodYears} Years</span>
            </div>
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={params.timePeriodYears}
              onChange={(e) =>
                setParams((p) => ({ ...p, timePeriodYears: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Annual Step-Up for Inflation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Annual Withdrawal Step-Up</span>
              <span className="text-white font-mono">{params.annualWithdrawalStepUp}% / yr</span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={params.annualWithdrawalStepUp}
              onChange={(e) =>
                setParams((p) => ({ ...p, annualWithdrawalStepUp: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Monte Carlo Volatility Slider (if Monte Carlo mode) */}
          {activeTab === 'monte_carlo' && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-amber-300 font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Market Volatility (Std Dev)</span>
                </span>
                <span className="text-amber-400 font-mono font-bold">{marketVolatility}%</span>
              </div>
              <input
                type="range"
                min={6}
                max={25}
                step={1}
                value={marketVolatility}
                onChange={(e) => setMarketVolatility(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400 block">
                Standard equity portfolios experience 12% - 16% annualized standard deviation.
              </span>
            </div>
          )}
        </div>

        {/* Right Analytics Column */}
        <div className="lg:col-span-8 space-y-4">
          {activeTab === 'standard' ? (
            /* Standard Deterministic View */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Corpus Longevity Trajectory</h3>
                  <p className="text-xs text-slate-400">Fixed rate compound growth with monthly drawdowns</p>
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
                    const idx = Math.max(
                      0,
                      Math.min(
                        result.yearlySchedule.length - 1,
                        Math.round((relX / chartW) * (result.yearlySchedule.length - 1))
                      )
                    );
                    setHoverIndex(idx);
                  }}
                  onMouseLeave={() => setHoverIndex(null)}
                >
                  <defs>
                    <linearGradient id="swpGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Y Axis Grid Lines */}
                  {yTicks.map((t, idx) => (
                    <g key={idx}>
                      <line
                        x1={padL}
                        y1={t.y}
                        x2={padL + chartW}
                        y2={t.y}
                        stroke="#334155"
                        strokeDasharray="3 3"
                        strokeOpacity="0.4"
                      />
                      <text x={padL - 8} y={t.y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">
                        {formatCurrency(t.val, currencySymbol)}
                      </text>
                    </g>
                  ))}

                  {/* Area fill */}
                  {areaD && <path d={areaD} fill="url(#swpGrad)" />}
                  {/* Line */}
                  {pathD && <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" />}

                  {/* Hover indicator */}
                  {hoverIndex !== null && points[hoverIndex] && (
                    <circle
                      cx={points[hoverIndex].x}
                      cy={points[hoverIndex].y}
                      r="5"
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>

              {/* Schedule Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2 px-3">Year</th>
                      <th className="py-2 px-3 text-right">Start Corpus</th>
                      <th className="py-2 px-3 text-right">Annual Withdrawal</th>
                      <th className="py-2 px-3 text-right">Growth Yield</th>
                      <th className="py-2 px-3 text-right">End Corpus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {result.yearlySchedule.map((y) => (
                      <tr key={y.year} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-sans text-white">Year {y.year}</td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(y.startBalance, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-amber-400">
                          {formatCurrency(y.annualWithdrawal, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-emerald-400">
                          {formatCurrency(y.annualGrowth, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {formatCurrency(y.endBalance, currencySymbol)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Monte Carlo Stochastic Simulation View */
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Monte Carlo Volatility Stress Test (500 Stochastic Runs)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Tests Sequence of Returns Risk—accounting for random bear markets early in retirement
                  </p>
                </div>
              </div>

              {/* Explanatory callout */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sequence-of-Returns Insight</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  A static average return masks the reality that a market downturn during your first 3–5 years of retirement can prematurely exhaust your portfolio. The Monte Carlo simulation runs 500 possible market return sequences using a {marketVolatility}% annual volatility curve.
                </p>
              </div>

              {/* Monte Carlo Percentile Progression Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-medium">
                    <tr>
                      <th className="py-2.5 px-3">Year</th>
                      <th className="py-2.5 px-3 text-right text-amber-400">P10 (Bear Market)</th>
                      <th className="py-2.5 px-3 text-right">P25 (Conservative)</th>
                      <th className="py-2.5 px-3 text-right text-emerald-400">P50 (Median)</th>
                      <th className="py-2.5 px-3 text-right">P75 (Strong)</th>
                      <th className="py-2.5 px-3 text-right text-cyan-400">P90 (Bull Market)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {monteCarlo.paths.map((p) => (
                      <tr key={p.year} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2 px-3 font-sans text-white font-medium">Year {p.year}</td>
                        <td className="py-2 px-3 text-right text-amber-400">
                          {formatCurrency(p.p10, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(p.p25, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-400">
                          {formatCurrency(p.p50, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(p.p75, currencySymbol)}
                        </td>
                        <td className="py-2 px-3 text-right text-cyan-400">
                          {formatCurrency(p.p90, currencySymbol)}
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
