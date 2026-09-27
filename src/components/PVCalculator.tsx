import React, { useState, useMemo } from 'react';
import { PVParams, CompoundingFrequency, InflationSubIndex } from '../types';
import {
  calculatePV,
  calculateInflationBasket,
  generatePVCSV,
} from '../utils/financialCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  History,
  Target,
  TrendingDown,
  Coins,
  Download,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Percent,
} from 'lucide-react';

interface PVCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

const DEFAULT_BASKET: InflationSubIndex[] = [
  {
    id: 'healthcare',
    name: 'Healthcare & Medical Care',
    weightPercent: 20,
    inflationRate: 11.5,
    description: 'Hospitalization, diagnostics & medicines',
  },
  {
    id: 'education',
    name: 'Higher Education & Coaching',
    weightPercent: 25,
    inflationRate: 9.5,
    description: 'School/College tuition & study fees',
  },
  {
    id: 'housing',
    name: 'Housing, Rent & Utilities',
    weightPercent: 25,
    inflationRate: 7.0,
    description: 'Rental leases, maintenance & energy',
  },
  {
    id: 'food',
    name: 'Food & Household Groceries',
    weightPercent: 20,
    inflationRate: 6.5,
    description: 'Daily perishables, dining & provisions',
  },
  {
    id: 'general',
    name: 'General CPI Baseline Goods',
    weightPercent: 10,
    inflationRate: 5.0,
    description: 'Electronics, transport & apparel',
  },
];

export const PVCalculator: React.FC<PVCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [basket, setBasket] = useState<InflationSubIndex[]>(DEFAULT_BASKET);
  const [usePersonalBasket, setUsePersonalBasket] = useState<boolean>(true);
  const [showBasketCustomizer, setShowBasketCustomizer] = useState<boolean>(false);

  const basketResult = useMemo(
    () => calculateInflationBasket(basket, 5.5),
    [basket]
  );

  const [params, setParams] = useState<PVParams>({
    futureValue: 1000000,
    annualDiscountRate: 7.0,
    years: 10,
    compoundingFrequency: 'monthly',
    annualInflationRate: 8.2, // Will dynamically follow basketResult if enabled
  });

  const activeInflationRate = usePersonalBasket
    ? basketResult.blendedPersonalInflationRate
    : params.annualInflationRate;

  const result = useMemo(
    () =>
      calculatePV({
        ...params,
        annualInflationRate: activeInflationRate,
      }),
    [params, activeInflationRate]
  );

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const handleUpdateSubIndexRate = (id: string, rate: number) => {
    setBasket((prev) =>
      prev.map((item) => (item.id === id ? { ...item, inflationRate: rate } : item))
    );
  };

  const handleReset = () => {
    setParams({
      futureValue: 1000000,
      annualDiscountRate: 7.0,
      years: 10,
      compoundingFrequency: 'monthly',
      annualInflationRate: 8.2,
    });
    setBasket(DEFAULT_BASKET);
    setUsePersonalBasket(true);
    onToast(`Reset Present Value calculator to defaults`);
  };

  const handleDownloadCSV = () => {
    const csv = generatePVCSV(result.yearlySchedule, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `present_value_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Present value schedule exported to CSV');
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

  const getX = (idx: number) =>
    padL + (idx / Math.max(1, result.yearlySchedule.length - 1)) * chartW;
  const getY = (val: number) => padT + chartH - (val / maxVal) * chartH;

  const discountedPoints = result.yearlySchedule.map((item, idx) => ({
    x: getX(idx),
    y: getY(item.discountedValue),
    item,
  }));

  const purchasingPoints = result.yearlySchedule.map((item, idx) => ({
    x: getX(idx),
    y: getY(item.realPurchasingPower),
    item,
  }));

  const pathDiscounted = discountedPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`,
    ''
  );
  const pathPurchasing = purchasingPoints.reduce(
    (acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`,
    ''
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => ({
    val: maxVal * pct,
    y: padT + chartH - pct * chartH,
  }));

  return (
    <div className="space-y-6">
      {/* Top Action Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Present Value & Custom Inflation Basket Modeler</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Discount future sums to today's purchasing power with weighted healthcare, education & living costs
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

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
          <span className="text-[11px] text-slate-400 font-medium block">Present Value Needed</span>
          <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {formatCurrency(result.presentValue, currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Discounted at {params.annualDiscountRate}%
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
          <span className="text-[11px] text-slate-400 font-medium block">Nominal Discount</span>
          <div className="text-lg font-bold font-mono text-white mt-1">
            {formatCurrency(result.totalDiscount, currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {result.discountPercentage.toFixed(1)}% time value discount
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
          <span className="text-[11px] text-slate-400 font-medium block">Personal Inflation Rate</span>
          <div className="text-lg font-bold font-mono text-amber-400 mt-1">
            {activeInflationRate.toFixed(2)}%
          </div>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block">
            {usePersonalBasket
              ? `+${basketResult.differentialRate.toFixed(1)}% over official CPI (5.5%)`
              : 'Flat inflation rate'}
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-3">
          <span className="text-[11px] text-slate-400 font-medium block">Real Purchasing Power</span>
          <div className="text-lg font-bold font-mono text-rose-400 mt-1">
            {formatCurrency(result.realPresentValue, currencySymbol)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            -{result.purchasingPowerLoss.toFixed(1)}% real value erosion
          </span>
        </div>
      </div>

      {/* Inflation Basket Sub-Panel */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 to-slate-900 border border-amber-500/30 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Customized Personal Inflation Basket
            </span>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Blended: {basketResult.blendedPersonalInflationRate.toFixed(2)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUsePersonalBasket(!usePersonalBasket)}
              className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors cursor-pointer ${
                usePersonalBasket
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {usePersonalBasket ? 'Active in Calculations' : 'Enable Personal Basket'}
            </button>
            <button
              onClick={() => setShowBasketCustomizer(!showBasketCustomizer)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
            >
              {showBasketCustomizer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showBasketCustomizer && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {basket.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <span className="font-mono text-amber-400 font-bold">{item.inflationRate.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={0.5}
                  value={item.inflationRate}
                  onChange={(e) => handleUpdateSubIndexRate(item.id, Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Weight: {item.weightPercent}%</span>
                  <span>{item.description.slice(0, 16)}...</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Grid: Controls (4 cols) & Analytics (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Present Value Parameters</span>
          </h3>

          {/* Target Future Sum */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Target Future Sum ({currencySymbol})
            </label>
            <input
              type="number"
              min={10000}
              step={50000}
              value={params.futureValue}
              onChange={(e) =>
                setParams((p) => ({ ...p, futureValue: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Discount Rate */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Annual Discount / Hurdle Rate</span>
              <span className="text-emerald-400 font-mono font-bold">{params.annualDiscountRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={0.25}
              value={params.annualDiscountRate}
              onChange={(e) =>
                setParams((p) => ({ ...p, annualDiscountRate: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Years */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Time Horizon (Years)</span>
              <span className="text-emerald-400 font-mono font-bold">{params.years} Years</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={params.years}
              onChange={(e) =>
                setParams((p) => ({ ...p, years: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Compounding Frequency */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">Discounting Frequency</label>
            <select
              value={params.compoundingFrequency}
              onChange={(e) =>
                setParams((p) => ({ ...p, compoundingFrequency: e.target.value as CompoundingFrequency }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annually">Semi-Annually</option>
              <option value="annually">Annually</option>
            </select>
          </div>
        </div>

        {/* Right Analytics Column */}
        <div className="lg:col-span-8 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Present Value & Real Purchasing Power Decay</h3>
                <p className="text-xs text-slate-400">Green = Discounted Investment PV | Rose = Real Purchasing Power</p>
              </div>
            </div>

            {/* SVG Trajectory Chart */}
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

                {/* Lines */}
                {pathDiscounted && <path d={pathDiscounted} fill="none" stroke="#10b981" strokeWidth="2.5" />}
                {pathPurchasing && <path d={pathPurchasing} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4 4" />}

                {/* Hover dots */}
                {hoverIndex !== null && discountedPoints[hoverIndex] && (
                  <circle
                    cx={discountedPoints[hoverIndex].x}
                    cy={discountedPoints[hoverIndex].y}
                    r="5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                )}
              </svg>
            </div>

            {/* Yearly Schedule Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-medium">
                  <tr>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3 text-right">Discounted PV</th>
                    <th className="py-2.5 px-3 text-right">Nominal Discount</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">Real Purchasing Power</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  {result.yearlySchedule.map((y) => (
                    <tr key={y.year} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 font-sans text-white font-medium">Year {y.year}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-bold">
                        {formatCurrency(y.discountedValue, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300">
                        {formatCurrency(y.nominalDiscount, currencySymbol)}
                      </td>
                      <td className="py-2 px-3 text-right text-rose-400 font-semibold">
                        {formatCurrency(y.realPurchasingPower, currencySymbol)}
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
