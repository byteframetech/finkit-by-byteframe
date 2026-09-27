import React, { useState, useMemo } from 'react';
import { CapitalGainsParams, AssetCategory } from '../types';
import { calculateCapitalGains, generateCapitalGainsCSV } from '../utils/taxAndSalaryCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import { 
  BadgePercent, 
  Coins, 
  TrendingUp, 
  Receipt, 
  Download, 
  RotateCcw,
  Sparkles,
  Building,
  Clock,
  HelpCircle
} from 'lucide-react';

interface CapitalGainsCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const CapitalGainsCalculator: React.FC<CapitalGainsCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<CapitalGainsParams>({
    assetCategory: 'equity_stocks',
    buyPrice: 150,
    sellPrice: 280,
    quantity: 1000,
    holdingMonths: 18,
    expensesOnSale: 500,
    improvementExpenses: 0,
    exemptionClaimed: 0,
  });

  const result = useMemo(() => calculateCapitalGains(params), [params]);

  const handleReset = () => {
    setParams({
      assetCategory: 'equity_stocks',
      buyPrice: 150,
      sellPrice: 280,
      quantity: 1000,
      holdingMonths: 18,
      expensesOnSale: 500,
      improvementExpenses: 0,
      exemptionClaimed: 0,
    });
    onToast('Reset capital gains calculator to stock trade baseline');
  };

  const handleDownloadCSV = () => {
    const csv = generateCapitalGainsCSV(result, currencySymbol);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `capital_gains_tax_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Capital gains tax assessment exported to CSV');
  };

  const assetOptions: { id: AssetCategory; label: string; desc: string }[] = [
    { id: 'equity_stocks', label: 'Listed Equities / Stocks', desc: 'STCG (<=12m): 20% | LTCG (>12m): 12.5% (1.25L exempt)' },
    { id: 'equity_mutual_funds', label: 'Equity Mutual Funds', desc: 'STCG (<=12m): 20% | LTCG (>12m): 12.5% (1.25L exempt)' },
    { id: 'real_estate', label: 'Real Estate / Property', desc: 'Threshold 24m | LTCG: 12.5% (Sec 54 reinvestment available)' },
    { id: 'crypto', label: 'Cryptocurrency / VDA', desc: 'Flat 30% tax + 4% cess on all gains without deduction' },
    { id: 'debt_mutual_funds', label: 'Debt Mutual Funds', desc: 'Taxed at normal income tax slab rate' },
    { id: 'gold_commodity', label: 'Gold / Physical Commodities', desc: 'Threshold 24m | STCG: Slab | LTCG: 12.5%' },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Compact Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Tax Owed</span>
            <div className="w-4 h-4 rounded bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0 ml-1">
              <Receipt className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-rose-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.totalTaxPayable, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            {result.taxRatePercent}% rate + 4% cess
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Net Profit</span>
            <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 ml-1">
              <Coins className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-emerald-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {formatCurrency(result.netRealizedProfit, currencySymbol)}
          </div>
          <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
            After taxes & fees
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Classification</span>
            <div className="w-4 h-4 rounded bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0 ml-1">
              <Clock className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-sky-400 tracking-tight mt-1 truncate leading-tight">
            {result.gainType}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {result.gainType === 'LTCG' ? 'Long-Term Gain' : 'Short-Term Gain'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 hover:border-slate-700/80 transition-colors">
          <div className="flex items-center justify-between text-[11px] text-slate-400 leading-none">
            <span className="font-medium text-slate-300 truncate">Realized ROI</span>
            <div className="w-4 h-4 rounded bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 ml-1">
              <TrendingUp className="w-2.5 h-2.5" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-amber-400 tracking-tight tabular-nums mt-1 truncate leading-tight">
            {result.roiPercentage.toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            Holding: {params.holdingMonths} mos
          </div>
        </div>
      </div>

      {/* Main Grid: Left Form (4 cols), Right Views (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Asset Transaction Details</h2>
              <p className="text-xs text-slate-400">Prevailing capital gains tax rules</p>
            </div>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Asset Category */}
          <div>
            <label className="block text-xs text-slate-300 font-medium mb-1.5">
              Asset Category
            </label>
            <select
              value={params.assetCategory}
              onChange={(e) => setParams((p) => ({ ...p, assetCategory: e.target.value as AssetCategory }))}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {assetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              {assetOptions.find((a) => a.id === params.assetCategory)?.desc}
            </p>
          </div>

          {/* Buy Price & Sell Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Purchase Price ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={params.buyPrice}
                onChange={(e) => setParams((p) => ({ ...p, buyPrice: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-300 mb-1">
                Sale Price ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="5"
                value={params.sellPrice}
                onChange={(e) => setParams((p) => ({ ...p, sellPrice: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">
              Quantity / Units Sold
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={params.quantity}
              onChange={(e) => setParams((p) => ({ ...p, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) }))}
              className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 tabular-nums"
            />
          </div>

          {/* Holding Period */}
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1">
              <span>Holding Duration</span>
              <span className="font-mono text-emerald-400 font-semibold">{params.holdingMonths} Months ({(params.holdingMonths / 12).toFixed(1)} yrs)</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              {[6, 12, 18, 24, 36, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setParams((p) => ({ ...p, holdingMonths: m }))}
                  className={`flex-1 py-1 text-[11px] rounded font-medium transition-colors ${
                    params.holdingMonths === m
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}M
                </button>
              ))}
            </div>
            <input
              type="range"
              min="1"
              max="120"
              step="1"
              value={params.holdingMonths}
              onChange={(e) => setParams((p) => ({ ...p, holdingMonths: Number(e.target.value) }))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Transaction Expenses & Deductions */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">
              Expenses & Exemptions
            </span>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Sale Expenses (Brokerage, STT, Legal) ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={params.expensesOnSale}
                onChange={(e) => setParams((p) => ({ ...p, expensesOnSale: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>

            {params.assetCategory === 'real_estate' && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Improvement / Renovation Costs ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={params.improvementExpenses}
                  onChange={(e) => setParams((p) => ({ ...p, improvementExpenses: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">
                Capital Gains Exemption (Section 54 / 54F / 54EC) ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={params.exemptionClaimed}
                onChange={(e) => setParams((p) => ({ ...p, exemptionClaimed: Math.max(0, parseFloat(e.target.value) || 0) }))}
                className="w-full bg-slate-950 border border-slate-800 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 tabular-nums"
              />
            </div>
          </div>
        </div>

        {/* Right Section: Visual Breakdown & Detailed Ledger */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-white">Tax Computation & Proceeds Ledger</h3>
                <p className="text-xs text-slate-400">{result.holdingSummary}</p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Asset Proceeds Visual Bar */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
              <span className="text-xs font-semibold text-slate-300 block">
                Proceeds Distribution Architecture
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Acquisition Cost:</span>
                  <strong className="text-white text-sm">{formatCurrency(result.totalPurchaseCost, currencySymbol)}</strong>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Sale Proceeds:</span>
                  <strong className="text-sky-400 text-sm">{formatCurrency(result.totalSaleProceeds, currencySymbol)}</strong>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Capital Gains Tax:</span>
                  <strong className="text-rose-400 text-sm">{formatCurrency(result.totalTaxPayable, currencySymbol)}</strong>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-[11px] text-slate-400 block">Net Realized Gain:</span>
                  <strong className="text-emerald-400 text-sm">{formatCurrency(result.netRealizedProfit, currencySymbol)}</strong>
                </div>
              </div>
            </div>

            {/* Detailed Calculation Audit Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                Capital Gains Assessment Breakdown
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800 font-mono text-xs">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans text-slate-300">Total Sale Proceeds ({params.quantity} units @ {formatCurrency(params.sellPrice, currencySymbol)})</td>
                      <td className="py-2.5 px-3 text-right text-slate-200">{formatCurrency(result.totalSaleProceeds, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans text-slate-400">Less: Transfer & Sale Expenses</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">-{formatCurrency(params.expensesOnSale, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 bg-slate-950/40 font-semibold">
                      <td className="py-2.5 px-3 font-sans text-slate-200">Net Sale Consideration</td>
                      <td className="py-2.5 px-3 text-right text-white">{formatCurrency(result.netSaleConsideration, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans text-slate-400">Less: Total Acquisition Cost</td>
                      <td className="py-2.5 px-3 text-right text-rose-400">-{formatCurrency(result.totalPurchaseCost, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40 bg-slate-950/40 font-semibold">
                      <td className="py-2.5 px-3 font-sans text-slate-200">Gross Capital Gain / Profit</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400">{formatCurrency(result.grossCapitalGain, currencySymbol)}</td>
                    </tr>
                    {result.applicableExemptions > 0 && (
                      <tr className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-sans text-cyan-400">Less: Exemptions Applied (Annual exemption or Sec 54)</td>
                        <td className="py-2.5 px-3 text-right text-cyan-400">-{formatCurrency(result.applicableExemptions, currencySymbol)}</td>
                      </tr>
                    )}
                    <tr className="hover:bg-slate-800/40 font-semibold">
                      <td className="py-2.5 px-3 font-sans text-slate-200">Net Taxable Capital Gain</td>
                      <td className="py-2.5 px-3 text-right text-white">{formatCurrency(result.taxableCapitalGain, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans text-slate-400">Applicable Tax Rate ({result.gainType} @ {result.taxRatePercent}%)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(result.estimatedTax, currencySymbol)}</td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-sans text-slate-400">Add: Health & Education Cess (4%)</td>
                      <td className="py-2.5 px-3 text-right text-slate-300">+{formatCurrency(result.cessAndSurcharge, currencySymbol)}</td>
                    </tr>
                    <tr className="font-bold border-t border-slate-800 text-rose-400 bg-slate-950">
                      <td className="py-2.5 px-3 font-sans">Total Capital Gains Tax Payable:</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(result.totalTaxPayable, currencySymbol)}</td>
                    </tr>
                    <tr className="font-bold border-t border-slate-800 text-emerald-400 bg-emerald-950/20">
                      <td className="py-2.5 px-3 font-sans">Net Realized In-Pocket Profit:</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(result.netRealizedProfit, currencySymbol)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
