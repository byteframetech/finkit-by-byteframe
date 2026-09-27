import React, { useState, useMemo, useRef } from 'react';
import { CalculationResult, LoanParams } from '../types';
import { formatCurrency } from '../utils/loanCalculations';

interface BalanceChartProps {
  results: CalculationResult;
  params: LoanParams;
  currencySymbol: string;
}

export const BalanceChart: React.FC<BalanceChartProps> = ({
  results,
  params,
  currencySymbol,
}) => {
  const [chartMode, setChartMode] = useState<'balance' | 'breakdown'>('balance');
  const [granularity, setGranularity] = useState<'year' | 'month'>('year');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prepare chart points
  const points = useMemo(() => {
    if (results.schedule.length === 0) return [];

    if (granularity === 'year') {
      // Year 0 is start
      const pts = [
        {
          label: 'Start',
          subLabel: `Year 0`,
          remainingBalance: params.principal,
          cumulativePrincipal: 0,
          cumulativeInterest: 0,
          month: 0,
        },
      ];

      results.yearlySummary.forEach((y) => {
        const lastMonthInYear = results.schedule.filter((s) => s.yearNumber === y.yearNumber).pop();
        pts.push({
          label: `${y.calendarYear}`,
          subLabel: `Year ${y.yearNumber}`,
          remainingBalance: y.endBalance,
          cumulativePrincipal: lastMonthInYear ? lastMonthInYear.cumulativePrincipal : 0,
          cumulativeInterest: lastMonthInYear ? lastMonthInYear.cumulativeInterest : 0,
          month: lastMonthInYear ? lastMonthInYear.month : y.yearNumber * 12,
        });
      });
      return pts;
    } else {
      // Monthly points
      const pts = [
        {
          label: 'Start',
          subLabel: `Month 0`,
          remainingBalance: params.principal,
          cumulativePrincipal: 0,
          cumulativeInterest: 0,
          month: 0,
        },
      ];

      results.schedule.forEach((s) => {
        pts.push({
          label: s.dateString,
          subLabel: `Month ${s.month}`,
          remainingBalance: s.remainingBalance,
          cumulativePrincipal: s.cumulativePrincipal,
          cumulativeInterest: s.cumulativeInterest,
          month: s.month,
        });
      });
      return pts;
    }
  }, [results, params.principal, granularity]);

  const maxVal = useMemo(() => {
    if (chartMode === 'balance') {
      return Math.max(params.principal, 1);
    } else {
      return Math.max(results.totalRepayment, params.principal, 1);
    }
  }, [chartMode, params.principal, results.totalRepayment]);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 280;
  const paddingLeft = 65;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Coordinate mappers
  const getX = (idx: number) => {
    if (points.length <= 1) return paddingLeft;
    return paddingLeft + (idx / (points.length - 1)) * chartW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(val, maxVal));
    return paddingTop + chartH - (clamped / maxVal) * chartH;
  };

  // Generate SVG Path for Balance
  const balancePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.remainingBalance).toFixed(1)}`)
      .join(' ');
  }, [points, maxVal]);

  const balanceArea = useMemo(() => {
    if (points.length === 0) return '';
    const baseLineY = paddingTop + chartH;
    return `${balancePath} L ${getX(points.length - 1).toFixed(1)} ${baseLineY} L ${getX(0).toFixed(1)} ${baseLineY} Z`;
  }, [balancePath, points]);

  // Generate SVG Path for Principal & Interest (Breakdown mode)
  const principalPath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.cumulativePrincipal).toFixed(1)}`)
      .join(' ');
  }, [points, maxVal]);

  const interestPath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(p.cumulativeInterest).toFixed(1)}`)
      .join(' ');
  }, [points, maxVal]);

  // Y Axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: getY(maxVal * pct),
  }));

  // Handle pointer hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = svgWidth / rect.width;
    const svgX = clientX * scaleX;

    const relativeX = svgX - paddingLeft;
    if (relativeX < 0) {
      setHoverIndex(0);
      return;
    }
    if (relativeX > chartW) {
      setHoverIndex(points.length - 1);
      return;
    }

    const estimatedIdx = Math.round((relativeX / chartW) * (points.length - 1));
    const boundedIdx = Math.max(0, Math.min(points.length - 1, estimatedIdx));
    setHoverIndex(boundedIdx);
  };

  const activePoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl" ref={containerRef}>
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Remaining Balance Over Time
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Trajectory of debt reduction from starting balance down to complete payoff
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Chart Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setChartMode('balance')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'balance'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Loan Balance
            </button>
            <button
              onClick={() => setChartMode('breakdown')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'breakdown'
                  ? 'bg-emerald-500/20 text-emerald-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Principal vs Interest
            </button>
          </div>

          {/* Granularity Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setGranularity('year')}
              className={`px-2 py-1 rounded-md transition-colors ${
                granularity === 'year'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yearly
            </button>
            <button
              onClick={() => setGranularity('month')}
              className={`px-2 py-1 rounded-md transition-colors ${
                granularity === 'month'
                  ? 'bg-slate-800 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="interestGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {yTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={tick.y}
                x2={svgWidth - paddingRight}
                y2={tick.y}
                stroke="#334155"
                strokeDasharray="3 3"
                strokeWidth="1"
                opacity={0.35}
              />
              <text
                x={paddingLeft - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {tick.val >= 1000 ? `${currencySymbol}${(tick.val / 1000).toFixed(0)}k` : `${currencySymbol}${tick.val.toFixed(0)}`}
              </text>
            </g>
          ))}

          {/* X Axis bottom border line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartH}
            x2={svgWidth - paddingRight}
            y2={paddingTop + chartH}
            stroke="#475569"
            strokeWidth="1"
          />

          {/* Chart Curves */}
          {chartMode === 'balance' ? (
            <>
              {/* Balance Area Fill */}
              <path d={balanceArea} fill="url(#balanceGradient)" />
              {/* Balance Stroke Line */}
              <path
                d={balancePath}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              {/* Cumulative Principal */}
              <path
                d={principalPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Cumulative Interest */}
              <path
                d={interestPath}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* X Axis Ticks */}
          {points.map((p, idx) => {
            // Filter labels so they don't crowd
            const step = Math.max(1, Math.floor(points.length / 7));
            const isFirst = idx === 0;
            const isLast = idx === points.length - 1;
            const isStep = idx % step === 0;

            if (!isFirst && !isLast && !isStep) return null;

            return (
              <text
                key={idx}
                x={getX(idx)}
                y={paddingTop + chartH + 20}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                className="text-[10px] fill-slate-400 font-mono"
              >
                {p.label}
              </text>
            );
          })}

          {/* Active Hover Crosshair Line */}
          {activePoint && hoverIndex !== null && (
            <g>
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={paddingTop + chartH}
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
              {chartMode === 'balance' ? (
                <circle
                  cx={getX(hoverIndex)}
                  cy={getY(activePoint.remainingBalance)}
                  r="5"
                  className="fill-emerald-400 stroke-slate-950 stroke-2"
                />
              ) : (
                <>
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(activePoint.cumulativePrincipal)}
                    r="4"
                    className="fill-cyan-400 stroke-slate-950 stroke-2"
                  />
                  <circle
                    cx={getX(hoverIndex)}
                    cy={getY(activePoint.cumulativeInterest)}
                    r="4"
                    className="fill-amber-400 stroke-slate-950 stroke-2"
                  />
                </>
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activePoint && hoverIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none bg-slate-950/95 border border-slate-700/80 shadow-2xl rounded-xl p-3 text-xs z-20 backdrop-blur-md transition-all"
            style={{
              left: `${Math.min(
                Math.max(15, (getX(hoverIndex) / svgWidth) * 100),
                75
              )}%`,
            }}
          >
            <div className="font-semibold text-white border-b border-slate-800 pb-1.5 mb-1.5 flex items-center justify-between gap-4">
              <span>{activePoint.label}</span>
              <span className="text-[11px] text-slate-400 font-mono">{activePoint.subLabel}</span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex items-center justify-between gap-4 text-emerald-400">
                <span className="text-slate-400">Remaining Balance:</span>
                <span className="font-semibold">{formatCurrency(activePoint.remainingBalance, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-cyan-400">
                <span className="text-slate-400">Principal Paid:</span>
                <span>{formatCurrency(activePoint.cumulativePrincipal, currencySymbol)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-amber-400">
                <span className="text-slate-400">Interest Paid:</span>
                <span>{formatCurrency(activePoint.cumulativeInterest, currencySymbol)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
        {chartMode === 'balance' ? (
          <div className="flex items-center gap-2">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span className="text-slate-300">Remaining Loan Balance</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-cyan-400 rounded-full" />
              <span className="text-slate-300">Cumulative Principal Paid</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-1 bg-amber-400 rounded-full" />
              <span className="text-slate-300">Cumulative Interest Paid</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
