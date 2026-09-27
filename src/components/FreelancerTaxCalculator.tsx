import React, { useState, useMemo } from 'react';
import { FreelancerTaxParams } from '../types';
import { calculateFreelancerTax } from '../utils/taxAndSalaryCalculations';
import { formatCurrency, formatPercent } from '../utils/loanCalculations';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Receipt,
  Clock,
  HelpCircle,
} from 'lucide-react';

interface FreelancerTaxCalculatorProps {
  currencySymbol: string;
  onToast: (msg: string) => void;
}

export const FreelancerTaxCalculator: React.FC<FreelancerTaxCalculatorProps> = ({
  currencySymbol,
  onToast,
}) => {
  const [params, setParams] = useState<FreelancerTaxParams>({
    grossReceipts: 3000000, // 30 Lakhs
    isProfessionEligible44ADA: true,
    actualBusinessExpenses: 800000,
    otherIncome: 50000,
    section80CDeductions: 150000,
    section80DDeductions: 25000,
    regime: 'new',
    gstTurnoverThreshold: 2000000, // 20 Lakhs
    gstRatePercent: 18,
    exportServicesZeroRated: false,
  });

  const result = useMemo(() => calculateFreelancerTax(params), [params]);

  const handleReset = () => {
    setParams({
      grossReceipts: 3000000,
      isProfessionEligible44ADA: true,
      actualBusinessExpenses: 800000,
      otherIncome: 50000,
      section80CDeductions: 150000,
      section80DDeductions: 25000,
      regime: 'new',
      gstTurnoverThreshold: 2000000,
      gstRatePercent: 18,
      exportServicesZeroRated: false,
    });
    onToast('Reset Freelancer Tax calculator to default profile');
  };

  const handleDownloadCSV = () => {
    const headers = ['Quarter', 'Due Date', 'Statutory %', `Cumulative Tax (${currencySymbol})`, `Installment Due (${currencySymbol})`];
    const rows = result.advanceTaxSchedule.map((q) => [
      `"${q.quarter}"`,
      q.dueDate,
      `${q.statutoryCumulativePercent}%`,
      q.cumulativeTaxDue.toFixed(2),
      q.installmentDue.toFixed(2),
    ]);

    rows.push([]);
    rows.push(['FREELANCER TAX SUMMARY', '', '', '', '']);
    rows.push(['Gross Professional Receipts', '', '', result.grossReceipts.toFixed(2), '']);
    rows.push(['Deemed Taxable Profit (50% 44ADA)', '', '', result.deemedTaxableProfit.toFixed(2), '']);
    rows.push(['Total Tax Payable', '', '', result.totalTaxPayable.toFixed(2), '']);
    rows.push(['Effective Tax Rate', '', '', `${result.effectiveTaxRate}%`, '']);
    rows.push(['GST Registration Required', '', '', result.gstRegistrationRequired ? 'YES' : 'NO', '']);
    rows.push(['Net Post-Tax In-Hand Realization', '', '', result.netInHandPostTaxAndGST.toFixed(2), '']);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `freelancer_tax_advance_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onToast('Exported Freelancer Advance Tax Schedule to CSV');
  };

  return (
    <div className="space-y-5">
      {/* Header ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-4 rounded-2xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Freelancer, Consultant & Presumptive Tax (Section 44ADA)
            </h2>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
              Sec 44ADA & GST
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Presumptive 50% profit modeling, quarterly advance tax planning & GST compliance
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

      {/* Hero KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Deemed Taxable Income */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Deemed Taxable Profit (50%)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-400">
            {formatCurrency(result.deemedTaxableProfit, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Flat 50% profit presumed under Sec 44ADA
          </span>
        </div>

        {/* Total Income Tax Payable */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Annual Income Tax + Cess</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-400">
            {formatCurrency(result.totalTaxPayable, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Effective rate: <strong className="text-white">{result.effectiveTaxRate.toFixed(1)}%</strong> of gross receipts
          </span>
        </div>

        {/* GST Status */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">GST Compliance Status</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl font-bold font-mono text-white">
            {params.exportServicesZeroRated ? (
              <span className="text-emerald-400">0% (LUT Export)</span>
            ) : result.gstRegistrationRequired ? (
              <span className="text-amber-400">Registration Mandatory</span>
            ) : (
              <span className="text-emerald-400">Exempt (&lt;20L)</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {params.exportServicesZeroRated
              ? 'Zero-rated under Letter of Undertaking'
              : `Threshold: ${currencySymbol}20 Lakhs/yr`}
          </span>
        </div>

        {/* Net In-Hand Take Home */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Net Realized In-Hand</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-300">
            {formatCurrency(result.netInHandPostTaxAndGST, currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {((result.netInHandPostTaxAndGST / params.grossReceipts) * 100).toFixed(1)}% of gross retainers kept
          </span>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form Controls (5 columns) */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-emerald-400" />
            <span>Freelancer Retainers & Expenses</span>
          </h3>

          {/* Gross Receipts */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium block">
              Annual Professional Invoicing / Receipts ({currencySymbol})
            </label>
            <input
              type="number"
              min={100000}
              step={50000}
              value={params.grossReceipts}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, grossReceipts: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full bg-slate-950 border border-slate-800 text-sm font-mono text-white px-3 py-2 rounded-xl focus:border-emerald-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-400">
              Sec 44ADA limit is ₹75 Lakhs (or ₹50 Lakhs if non-digital payments &gt;5%).
            </p>
          </div>

          {/* 44ADA Scheme Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">
                Opt for Section 44ADA Scheme
              </span>
              <span className="text-[11px] text-slate-400 block">
                Deems 50% profit. No accounting books maintenance needed.
              </span>
            </div>
            <input
              type="checkbox"
              checked={params.isProfessionEligible44ADA}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, isProfessionEligible44ADA: e.target.checked }))
              }
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Export Services LUT Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-white block">
                Export Services to Foreign Clients (LUT)
              </span>
              <span className="text-[11px] text-slate-400 block">
                Foreign retainers received in convertible forex are zero-rated.
              </span>
            </div>
            <input
              type="checkbox"
              checked={params.exportServicesZeroRated}
              onChange={(e) =>
                setParams((prev) => ({ ...prev, exportServicesZeroRated: e.target.checked }))
              }
              className="w-4 h-4 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Chapter VI-A Deductions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Section 80C ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                max={150000}
                step={10000}
                value={params.section80CDeductions}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, section80CDeductions: Number(e.target.value) }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Section 80D ({currencySymbol})
              </label>
              <input
                type="number"
                min={0}
                max={50000}
                step={5000}
                value={params.section80DDeductions}
                onChange={(e) =>
                  setParams((prev) => ({ ...prev, section80DDeductions: Number(e.target.value) }))
                }
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Statutory Advance Tax Calendar & Payment Schedule (7 columns) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Quarterly Advance Tax Schedule</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Avoid Sec 234B/C Penalties
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Taxpayers with an estimated tax liability exceeding ₹10,000 must pay tax in four quarterly installments:
            </p>

            <div className="space-y-2.5">
              {result.advanceTaxSchedule.map((q, idx) => (
                <div
                  key={q.quarter}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
                      Q{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-white">{q.quarter}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>Deadline: <strong className="text-slate-300">{q.dueDate}</strong></span>
                        <span className="text-slate-600">•</span>
                        <span>{q.statutoryCumulativePercent}% cumulative</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-emerald-400">
                      {formatCurrency(q.installmentDue, currencySymbol)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Cumulative: {formatCurrency(q.cumulativeTaxDue, currencySymbol)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Regulatory Advice Box */}
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Section 44ADA Special Concession</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                Eligible professionals (software engineers, lawyers, architects, accountants, medical consultants) who opt for Sec 44ADA can pay 100% of their advance tax in a single installment on or before <strong className="text-white">March 15</strong> without attracting late-payment interest penalties!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
