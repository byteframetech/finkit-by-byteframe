import React, { useEffect } from 'react';
import {
  CalculationResult,
  LoanParams,
  CalculatorType,
  SIPParams,
  SWPParams,
  FVParams,
  PVParams,
  IncomeTaxParams,
  SalaryParams,
  CapitalGainsParams,
  DebtConsolidationParams,
  GoalParams,
  FreelancerTaxParams,
  ESOPParams,
} from '../types';
import {
  formatCurrency,
  formatPercent,
  calculateDebtConsolidation,
} from '../utils/loanCalculations';
import {
  calculateSIP,
  calculateSWP,
  calculateFV,
  calculatePV,
  calculateGoalReverseSIP,
} from '../utils/financialCalculations';
import {
  calculateIncomeTax,
  calculateSalary,
  calculateCapitalGains,
  calculateFreelancerTax,
  calculateESOPTax,
} from '../utils/taxAndSalaryCalculations';
import {
  X,
  Printer,
  FileDown,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Receipt,
  Briefcase,
  BadgePercent,
  Calculator,
  ArrowDownCircle,
  Sparkles,
  History,
  CreditCard,
  Target,
  Award,
  Scale,
} from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCalculator: CalculatorType;
  currencySymbol: string;
  // Loan
  loanParams: LoanParams;
  loanResults: CalculationResult;
  // Other calculators (optional live params)
  sipParams?: SIPParams;
  swpParams?: SWPParams;
  fvParams?: FVParams;
  pvParams?: PVParams;
  taxParams?: IncomeTaxParams;
  salaryParams?: SalaryParams;
  capitalGainsParams?: CapitalGainsParams;
  debtConsolidationParams?: DebtConsolidationParams;
  goalParams?: GoalParams;
  freelancerParams?: FreelancerTaxParams;
  esopParams?: ESOPParams;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  activeCalculator,
  currencySymbol,
  loanParams,
  loanResults,
  sipParams = {
    monthlyInvestment: 5000,
    annualExpectedReturn: 12.0,
    timePeriodYears: 15,
    annualStepUpPercent: 0,
  },
  swpParams = {
    initialCorpus: 5000000,
    monthlyWithdrawal: 35000,
    annualExpectedReturn: 8.5,
    timePeriodYears: 20,
    annualWithdrawalStepUp: 0,
  },
  fvParams = {
    presentValue: 100000,
    periodicPayment: 5000,
    paymentTiming: 'end',
    paymentFrequency: 'monthly',
    annualInterestRate: 8.5,
    years: 10,
    compoundingFrequency: 'monthly',
  },
  pvParams = {
    futureValue: 1000000,
    annualDiscountRate: 8.0,
    years: 10,
    compoundingFrequency: 'monthly',
    annualInflationRate: 6.0,
  },
  taxParams = {
    regime: 'new',
    financialYear: '2025-26',
    grossAnnualIncome: 1200000,
    otherIncome: 50000,
    standardDeduction: 75000,
    section80C: 150000,
    section80D: 25000,
    hraDeduction: 120000,
    homeLoanInterest: 0,
    npsSection80CCD: 50000,
    otherDeductions: 0,
  },
  salaryParams = {
    annualCTC: 1200000,
    bonusAnnual: 100000,
    employerPFMonthly: 1800,
    employeePFMonthly: 1800,
    professionalTaxMonthly: 200,
    annualTaxDeducted: 85000,
    insuranceDeductionMonthly: 1000,
    otherDeductionsMonthly: 0,
    customBasicPercent: 50,
    customHRAPercent: 40,
  },
  capitalGainsParams = {
    assetCategory: 'equity_stocks',
    buyPrice: 100000,
    sellPrice: 180000,
    quantity: 1,
    holdingMonths: 18,
    expensesOnSale: 1500,
    improvementExpenses: 0,
    exemptionClaimed: 0,
  },
  debtConsolidationParams = {
    debts: [
      {
        id: 'debt_1',
        name: 'Platinum Credit Card',
        category: 'credit_card',
        currentBalance: 180000,
        annualInterestRate: 38.0,
        monthlyPayment: 9000,
      },
      {
        id: 'debt_2',
        name: 'Personal Loan',
        category: 'personal_loan',
        currentBalance: 350000,
        annualInterestRate: 15.5,
        monthlyPayment: 10200,
      },
      {
        id: 'debt_3',
        name: 'Auto Loan Balance',
        category: 'auto_loan',
        currentBalance: 220000,
        annualInterestRate: 11.0,
        monthlyPayment: 5800,
      },
    ],
    consolidationRate: 10.5,
    consolidationYears: 5,
    processingFeePercent: 1.0,
  },
  goalParams = {
    goalName: "Child's Education Fund",
    goalType: 'education',
    targetCorpus: 10000000, // ₹1 Crore
    targetYears: 10,
    expectedAnnualReturn: 12.0,
    annualStepUpPercent: 10,
    existingSavings: 500000,
  },
  freelancerParams = {
    grossReceipts: 3000000, // ₹30 Lakhs
    isProfessionEligible44ADA: true,
    actualBusinessExpenses: 800000,
    otherIncome: 50000,
    section80CDeductions: 150000,
    section80DDeductions: 25000,
    regime: 'new',
    gstTurnoverThreshold: 2000000,
    gstRatePercent: 18,
    exportServicesZeroRated: false,
  },
  esopParams = {
    planType: 'RSU',
    companyType: 'listed_foreign',
    totalUnitsGranted: 500,
    exercisePricePerUnit: 0,
    fmvAtVestingExercise: 12000,
    currentSalePrice: 18500,
    unitsToSell: 500,
    holdingMonthsSinceExercise: 24,
    marginalIncomeTaxSlab: 31.2,
  },
}) => {
  // Listen for Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const getReportMeta = () => {
    switch (activeCalculator) {
      case 'loan':
        return {
          title: 'Loan Amortization & Financing Report',
          badge: 'Debt Analytics',
          icon: <Calculator className="w-4 h-4 text-emerald-400" />,
        };
      case 'debt_consolidation':
        return {
          title: 'Debt Consolidation & Restructuring Strategy Report',
          badge: 'Debt Optimization',
          icon: <CreditCard className="w-4 h-4 text-emerald-400" />,
        };
      case 'sip':
        return {
          title: 'Systematic Investment Plan (SIP) Compounding Statement',
          badge: 'Wealth Building',
          icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
        };
      case 'goal_sip':
        return {
          title: 'Goal-Based Financial Reverse Engineering Report',
          badge: 'Target Wealth',
          icon: <Target className="w-4 h-4 text-emerald-400" />,
        };
      case 'swp':
        return {
          title: 'Systematic Withdrawal Plan (SWP) Longevity Report',
          badge: 'Retirement Drawdown',
          icon: <ArrowDownCircle className="w-4 h-4 text-emerald-400" />,
        };
      case 'fv':
        return {
          title: 'Future Value (FV) Annuity Projection Statement',
          badge: 'Compound Growth',
          icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
        };
      case 'pv':
        return {
          title: 'Present Value (PV) & Inflation Basket Discounting Analysis',
          badge: 'Time Value of Money',
          icon: <History className="w-4 h-4 text-emerald-400" />,
        };
      case 'income_tax':
        return {
          title: 'Income Tax Optimization & Multi-Year Projection Statement',
          badge: 'Tax Engineering',
          icon: <Receipt className="w-4 h-4 text-emerald-400" />,
        };
      case 'salary':
        return {
          title: 'Cost to Company (CTC) & Net Take-Home Statement',
          badge: 'Payroll Analytics',
          icon: <Briefcase className="w-4 h-4 text-emerald-400" />,
        };
      case 'freelancer_tax':
        return {
          title: 'Freelancer Presumptive Taxation (44ADA) & GST Assessment',
          badge: 'Self-Employed Tax',
          icon: <Scale className="w-4 h-4 text-emerald-400" />,
        };
      case 'capital_gains':
        return {
          title: 'Capital Gains Tax Assessment Statement',
          badge: 'Investment Tax',
          icon: <BadgePercent className="w-4 h-4 text-emerald-400" />,
        };
      case 'esop_rsu':
        return {
          title: 'RSU & ESOP Dual-Stage Vesting & Liquidity Tax Statement',
          badge: 'Equity Compensation',
          icon: <Award className="w-4 h-4 text-emerald-400" />,
        };
      default:
        return {
          title: 'Executive Financial Summary Report',
          badge: 'Verified Record',
          icon: <Calculator className="w-4 h-4 text-emerald-400" />,
        };
    }
  };

  const meta = getReportMeta();

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm print:p-0 print:static print:bg-white print:backdrop-blur-none"
      role="dialog"
      aria-modal="true"
      aria-label="Executive Print and PDF Report Preview"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none print:bg-white">
        {/* Sticky Header with prominent CLOSE and PRINT / SAVE AS PDF options */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-950/95 no-print select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              {meta.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-tight truncate">
                  Executive Report Preview
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {meta.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                FinKit by Byteframe · Print & PDF Exporter
              </p>
            </div>
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Close Button */}
            <button
              onClick={onClose}
              title="Close Report Preview (Esc)"
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs rounded-xl transition-colors border border-slate-700 cursor-pointer shadow-xs"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              title="Print or Save as PDF"
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-slate-950 text-slate-100 print:bg-white print:text-slate-900 print:p-0 print:overflow-visible space-y-6">
          {/* Document Header */}
          <div className="flex items-start justify-between border-b border-slate-800 print:border-slate-300 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-xs print:bg-emerald-700">
                  FK
                </div>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white print:text-slate-900">
                  FinKit by Byteframe
                </h1>
              </div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-300 print:text-slate-800 mt-1">
                {meta.title}
              </h2>
              <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                Generated on {currentDate} · Verified Mathematical Schedule
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 font-mono text-emerald-400 print:text-emerald-700 font-semibold text-xs border border-emerald-500/30 print:border-emerald-600 px-2 py-0.5 rounded bg-emerald-500/10 print:bg-emerald-50">
                <ShieldCheck className="w-3.5 h-3.5" />
                VERIFIED
              </span>
              <div className="text-[10px] text-slate-400 print:text-slate-500 mt-1">
                Currency: {currencySymbol}
              </div>
            </div>
          </div>

          {/* Dynamic Content based on Active Calculator */}
          {activeCalculator === 'loan' && (
            <LoanReportView
              params={loanParams}
              results={loanResults}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'debt_consolidation' && (
            <DebtConsolidationReportView
              params={debtConsolidationParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'sip' && (
            <SIPReportView
              params={sipParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'goal_sip' && (
            <GoalSIPReportView
              params={goalParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'swp' && (
            <SWPReportView
              params={swpParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'fv' && (
            <FVReportView
              params={fvParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'pv' && (
            <PVReportView
              params={pvParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'income_tax' && (
            <TaxReportView
              params={taxParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'salary' && (
            <SalaryReportView
              params={salaryParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'freelancer_tax' && (
            <FreelancerTaxReportView
              params={freelancerParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'capital_gains' && (
            <CapitalGainsReportView
              params={capitalGainsParams}
              currencySymbol={currencySymbol}
            />
          )}

          {activeCalculator === 'esop_rsu' && (
            <ESOPReportView
              params={esopParams}
              currencySymbol={currencySymbol}
            />
          )}

          {/* Document Footer Note */}
          <div className="pt-4 border-t border-slate-800 print:border-slate-300 text-[11px] text-slate-400 print:text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              FinKit by Byteframe · High-Precision Financial Engineering Suite
            </span>
            <span className="text-slate-400 print:text-slate-500">
              Confidential & Proprietary · Byteframe Technologies
            </span>
          </div>
        </div>

        {/* Sticky Modal Bottom Footer with CLOSE and PRINT / SAVE AS PDF options */}
        <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/95 no-print select-none">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 text-center sm:text-left">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>
              Tip: In the print dialog, select <strong className="text-slate-200">"Save as PDF"</strong> under Destination to save this document to your device.
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Close Button in Footer */}
            <button
              onClick={onClose}
              title="Close this report"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-colors border border-slate-700 cursor-pointer shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>

            {/* Print / Save as PDF Button in Footer */}
            <button
              onClick={handlePrint}
              title="Print or Save as PDF"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-emerald-500/20 cursor-pointer active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------------- LOAN SUB-VIEW ----------------
function LoanReportView({
  params,
  results,
  currencySymbol,
}: {
  params: LoanParams;
  results: CalculationResult;
  currencySymbol: string;
}) {
  return (
    <div className="space-y-6">
      {/* Parameters Grid */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Financing Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Principal Amount:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.principal, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Interest Rate:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualInterestRate)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Tenure:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.years} yrs {params.months > 0 ? `${params.months} mos` : ''}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">First Payment Date:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {results.schedule[0]?.dateString || 'Immediate'}
            </strong>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Monthly Payment (EMI)</span>
          <span className="text-xl font-bold font-mono text-white print:text-slate-900">
            {formatCurrency(results.monthlyPayment, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Interest Paid</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(results.totalInterest, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Repayment</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(results.totalRepayment, currencySymbol)}
          </span>
        </div>
      </div>

      {/* Prepayment Savings if applicable */}
      {results.savingsWithExtra && results.savingsWithExtra.interestSaved > 0 && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 print:bg-emerald-50 border border-emerald-500/20 print:border-emerald-300 text-xs flex items-center justify-between">
          <span className="text-emerald-300 print:text-emerald-900 font-medium">
            Prepayment Benefit: Saving {formatCurrency(results.savingsWithExtra.interestSaved, currencySymbol)} in interest and {results.savingsWithExtra.monthsSaved} months off tenure.
          </span>
          <span className="font-mono text-emerald-400 print:text-emerald-800 font-bold">
            Accelerated Payoff
          </span>
        </div>
      )}

      {/* Annual Ledger Table */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Annual Servicing Ledger (Summary)
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-slate-300">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 print:bg-slate-200 text-slate-400 print:text-slate-700 font-medium">
              <tr>
                <th className="py-2 px-3">Year</th>
                <th className="py-2 px-3 text-right">Start Principal</th>
                <th className="py-2 px-3 text-right">Annual Payment</th>
                <th className="py-2 px-3 text-right">Principal Reduction</th>
                <th className="py-2 px-3 text-right">Interest Charged</th>
                <th className="py-2 px-3 text-right">Year-End Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-mono">
              {results.yearlySummary.map((y) => (
                <tr key={y.yearNumber}>
                  <td className="py-1.5 px-3 font-sans">
                    Year {y.yearNumber} ({y.calendarYear})
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300 print:text-slate-700">
                    {formatCurrency(y.startBalance, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-200 print:text-slate-900">
                    {formatCurrency(y.totalPaid, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-cyan-400 print:text-cyan-800">
                    {formatCurrency(y.principalPaid, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-amber-400 print:text-amber-800">
                    {formatCurrency(y.interestPaid, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold text-emerald-400 print:text-emerald-800">
                    {formatCurrency(y.endBalance, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- SIP SUB-VIEW ----------------
function SIPReportView({
  params,
  currencySymbol,
}: {
  params: SIPParams;
  currencySymbol: string;
}) {
  const result = calculateSIP(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          SIP Contribution Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Monthly SIP:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.monthlyInvestment, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Expected Return:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualExpectedReturn)} p.a.
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Investment Horizon:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.timePeriodYears} Years
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Annual Step-Up:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.annualStepUpPercent > 0 ? `${params.annualStepUpPercent}% / yr` : 'None'}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Invested</span>
          <span className="text-xl font-bold font-mono text-white print:text-slate-900">
            {formatCurrency(result.totalInvested, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Estimated Returns</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.estimatedReturns, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Maturity Value</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.totalMaturityValue, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Wealth Multiplier</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {result.wealthMultiplier.toFixed(2)}x
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Yearly Compounding Breakdown
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-slate-300">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900 print:bg-slate-200 text-slate-400 print:text-slate-700 font-medium">
              <tr>
                <th className="py-2 px-3">Year</th>
                <th className="py-2 px-3 text-right">Monthly Deposit</th>
                <th className="py-2 px-3 text-right">Annual Deposit</th>
                <th className="py-2 px-3 text-right">Total Invested</th>
                <th className="py-2 px-3 text-right">Annual Growth</th>
                <th className="py-2 px-3 text-right">End Valuation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-mono">
              {result.yearlySchedule.map((y) => (
                <tr key={y.year}>
                  <td className="py-1.5 px-3 font-sans">Year {y.year}</td>
                  <td className="py-1.5 px-3 text-right text-slate-300 print:text-slate-700">
                    {formatCurrency(y.monthlyDeposit, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-200 print:text-slate-900">
                    {formatCurrency(y.annualDeposit, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-slate-300 print:text-slate-700">
                    {formatCurrency(y.totalInvested, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right text-emerald-400 print:text-emerald-800">
                    {formatCurrency(y.interestEarnedYear, currencySymbol)}
                  </td>
                  <td className="py-1.5 px-3 text-right font-semibold text-cyan-400 print:text-cyan-800">
                    {formatCurrency(y.endBalance, currencySymbol)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- SWP SUB-VIEW ----------------
function SWPReportView({
  params,
  currencySymbol,
}: {
  params: SWPParams;
  currencySymbol: string;
}) {
  const result = calculateSWP(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Retirement Corpus & Drawdown Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Initial Corpus:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.initialCorpus, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Monthly Withdrawal:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.monthlyWithdrawal, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Expected Return:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualExpectedReturn)} p.a.
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Duration:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.timePeriodYears} Years
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Withdrawn</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalWithdrawn, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Final Corpus Balance</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.finalCorpus, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Portfolio Growth Earned</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.totalGrowthEarned, currencySymbol)}
          </span>
        </div>
      </div>

      {result.isDepleted && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 print:bg-rose-50 border border-rose-500/20 print:border-rose-300 text-xs text-rose-300 print:text-rose-900 font-medium">
          Warning: Corpus is projected to deplete in Year {result.depletedYear || 0}, Month {result.depletedMonth || 0}. Consider reducing monthly withdrawals or boosting portfolio yield.
        </div>
      )}
    </div>
  );
}

// ---------------- FV SUB-VIEW ----------------
function FVReportView({
  params,
  currencySymbol,
}: {
  params: FVParams;
  currencySymbol: string;
}) {
  const result = calculateFV(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Future Value Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Initial Deposit (PV):</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.presentValue, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Periodic Addition:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.periodicPayment, currencySymbol)} / {params.paymentFrequency}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Interest Rate:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualInterestRate)} ({params.compoundingFrequency})
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Horizon:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.years} Years
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Target Future Value</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.futureValue, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Contributions</span>
          <span className="text-xl font-bold font-mono text-white print:text-slate-900">
            {formatCurrency(result.initialDeposit + result.totalContributions, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Interest Earned</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.totalInterestEarned, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- PV SUB-VIEW ----------------
function PVReportView({
  params,
  currencySymbol,
}: {
  params: PVParams;
  currencySymbol: string;
}) {
  const result = calculatePV(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Present Value & Inflation Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Target Future Sum:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.futureValue, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Discount Rate:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualDiscountRate)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Inflation Rate:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatPercent(params.annualInflationRate)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Years:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.years} Years
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Required Present Value</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.presentValue, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Nominal Discount</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalDiscount, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Real Inflation-Adjusted PV</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.realPresentValue, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- INCOME TAX SUB-VIEW ----------------
function TaxReportView({
  params,
  currencySymbol,
}: {
  params: IncomeTaxParams;
  currencySymbol: string;
}) {
  const result = calculateIncomeTax(params);
  const curr = result.currentRegime;
  const alt = result.alternateRegime;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Tax Computation Profile ({params.financialYear})
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Gross Income:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.grossAnnualIncome + params.otherIncome, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Standard Deduction:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.standardDeduction, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Section 80C + 80D:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.section80C + params.section80D, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Recommended Regime:</span>
            <strong className="font-mono text-sm text-emerald-400 print:text-emerald-800 font-bold uppercase">
              {result.recommendedRegime.toUpperCase()} REGIME
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">
            Total Tax ({curr.regimeName})
          </span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(curr.totalTax, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">
            Effective Tax Rate
          </span>
          <span className="text-xl font-bold font-mono text-white print:text-slate-900">
            {curr.effectiveRate.toFixed(2)}%
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">
            Monthly In-Hand
          </span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(curr.inHandMonthly, currencySymbol)}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-slate-300">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-900 print:bg-slate-200 text-slate-400 print:text-slate-700 font-medium">
            <tr>
              <th className="py-2 px-3">Tax Parameter</th>
              <th className="py-2 px-3 text-right">New Tax Regime</th>
              <th className="py-2 px-3 text-right">Old Tax Regime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 print:divide-slate-200 font-mono">
            <tr>
              <td className="py-1.5 px-3 font-sans">Gross Total Income</td>
              <td className="py-1.5 px-3 text-right">{formatCurrency(curr.grossIncome, currencySymbol)}</td>
              <td className="py-1.5 px-3 text-right">{formatCurrency(alt.grossIncome, currencySymbol)}</td>
            </tr>
            <tr>
              <td className="py-1.5 px-3 font-sans">Total Deductions Claimed</td>
              <td className="py-1.5 px-3 text-right text-cyan-400 print:text-cyan-800">
                {formatCurrency(params.regime === 'new' ? curr.totalDeductions : alt.totalDeductions, currencySymbol)}
              </td>
              <td className="py-1.5 px-3 text-right text-cyan-400 print:text-cyan-800">
                {formatCurrency(params.regime === 'old' ? curr.totalDeductions : alt.totalDeductions, currencySymbol)}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-1.5 px-3 font-sans">Net Annual Tax Liability</td>
              <td className="py-1.5 px-3 text-right text-amber-400 print:text-amber-800">
                {formatCurrency(params.regime === 'new' ? curr.totalTax : alt.totalTax, currencySymbol)}
              </td>
              <td className="py-1.5 px-3 text-right text-amber-400 print:text-amber-800">
                {formatCurrency(params.regime === 'old' ? curr.totalTax : alt.totalTax, currencySymbol)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------------- SALARY SUB-VIEW ----------------
function SalaryReportView({
  params,
  currencySymbol,
}: {
  params: SalaryParams;
  currencySymbol: string;
}) {
  const result = calculateSalary(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Compensation Package Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Annual CTC:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.annualCTC, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Monthly CTC:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(result.monthlyCTC, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Annual Bonus:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.bonusAnnual, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Take-Home Ratio:</span>
            <strong className="font-mono text-sm text-emerald-400 print:text-emerald-800 font-bold">
              {result.takeHomePercentage.toFixed(1)}% of CTC
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Monthly In-Hand Pay</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.takeHomeMonthly, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Annual In-Hand Pay</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.takeHomeAnnual, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Monthly Deductions</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalDeductionsMonthly, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- CAPITAL GAINS SUB-VIEW ----------------
function CapitalGainsReportView({
  params,
  currencySymbol,
}: {
  params: CapitalGainsParams;
  currencySymbol: string;
}) {
  const result = calculateCapitalGains(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Transaction Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Asset Category:</span>
            <strong className="font-mono text-xs text-white print:text-slate-900 uppercase">
              {params.assetCategory.replace('_', ' ')}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Total Purchase Cost:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(result.totalPurchaseCost, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Total Sale Value:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(result.totalSaleProceeds, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Holding Duration:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.holdingMonths} Months
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Gain Classification</span>
          <span className="text-base font-bold font-mono text-cyan-400 print:text-cyan-800">
            {result.gainType === 'LTCG' ? 'Long-Term (LTCG)' : 'Short-Term (STCG)'}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Taxable Gain</span>
          <span className="text-base font-bold font-mono text-white print:text-slate-900">
            {formatCurrency(result.taxableCapitalGain, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Tax Payable</span>
          <span className="text-base font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalTaxPayable, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Net Realized Profit</span>
          <span className="text-base font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.netRealizedProfit, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- DEBT CONSOLIDATION SUB-VIEW ----------------
function DebtConsolidationReportView({
  params,
  currencySymbol,
}: {
  params: DebtConsolidationParams;
  currencySymbol: string;
}) {
  const result = calculateDebtConsolidation(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Consolidation Strategy & Terms
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Total Active Debts:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.debts.length} Accounts
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Current Avg Rate:</span>
            <strong className="font-mono text-sm text-amber-400 print:text-amber-700">
              {formatPercent(result.weightedAverageCurrentRate)} p.a.
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">New Consolidated Rate:</span>
            <strong className="font-mono text-sm text-emerald-400 print:text-emerald-700">
              {formatPercent(params.consolidationRate)} p.a.
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Loan Tenure:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.consolidationYears} Years
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Monthly Cashflow Relief</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.monthlySavings, currencySymbol)}/mo
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Lifetime Interest Saved</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.lifetimeInterestSavings, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Net Financial Benefit</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.netFinancialBenefit, currencySymbol)}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-300 print:text-slate-700 mb-2">Individual Debt Accounts</h4>
        <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold border-b border-slate-800 print:border-slate-300">
              <tr>
                <th className="py-2 px-3">Account Name</th>
                <th className="py-2 px-3 text-right">Balance</th>
                <th className="py-2 px-3 text-right">Interest Rate</th>
                <th className="py-2 px-3 text-right">Monthly EMI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {result.debts.map((d) => (
                <tr key={d.id}>
                  <td className="py-2 px-3 font-medium text-white print:text-slate-900">{d.name}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(d.currentBalance, currencySymbol)}</td>
                  <td className="py-2 px-3 text-right font-mono text-amber-400 print:text-amber-800">{formatPercent(d.annualInterestRate)}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(d.monthlyPayment, currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- GOAL-BASED SIP SUB-VIEW ----------------
function GoalSIPReportView({
  params,
  currencySymbol,
}: {
  params: GoalParams;
  currencySymbol: string;
}) {
  const result = calculateGoalReverseSIP(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Goal & Target Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Goal Description:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.goalName}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Target Valuation:</span>
            <strong className="font-mono text-sm text-emerald-400 print:text-emerald-700">
              {formatCurrency(params.targetCorpus, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Time Horizon:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.targetYears} Years
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Expected CAGR:</span>
            <strong className="font-mono text-sm text-cyan-400 print:text-cyan-700">
              {formatPercent(params.expectedAnnualReturn)} p.a.
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Required Starting Monthly SIP</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.startingMonthlySIP, currencySymbol)}/mo
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Cumulative Principal Outlay</span>
          <span className="text-xl font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.totalDeposited, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Compound Growth Generated</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalGrowthEarned, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- FREELANCER / 44ADA SUB-VIEW ----------------
function FreelancerTaxReportView({
  params,
  currencySymbol,
}: {
  params: FreelancerTaxParams;
  currencySymbol: string;
}) {
  const result = calculateFreelancerTax(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Gross Professional Receipts & Scheme (Section 44ADA)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Gross Invoiced Receipts:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.grossReceipts, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Presumptive Profit (50%):</span>
            <strong className="font-mono text-sm text-cyan-400 print:text-cyan-800">
              {formatCurrency(result.deemedTaxableProfit, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Total Deductions Claimed:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(result.totalDeductions, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Net Taxable Income:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(result.netTaxableIncome, currencySymbol)}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Income Tax Payable</span>
          <span className="text-xl font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.totalTaxPayable, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Net Realized Retained Cash</span>
          <span className="text-xl font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.netInHandPostTaxAndGST, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">GST Liability Status</span>
          <span className="text-base font-bold font-mono text-cyan-400 print:text-cyan-800">
            {result.gstRegistrationRequired ? formatCurrency(result.gstLiability, currencySymbol) : 'Exempt (<₹20L)'}
          </span>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-300 print:text-slate-700 mb-2">Quarterly Advance Tax Schedule</h4>
        <div className="border border-slate-800 print:border-slate-300 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 print:bg-slate-100 text-slate-400 print:text-slate-700 font-semibold border-b border-slate-800 print:border-slate-300">
              <tr>
                <th className="py-2 px-3">Quarter</th>
                <th className="py-2 px-3">Statutory Due Date</th>
                <th className="py-2 px-3 text-right">Cumulative %</th>
                <th className="py-2 px-3 text-right">Cumulative Due</th>
                <th className="py-2 px-3 text-right">Quarterly Installment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-slate-200">
              {result.advanceTaxSchedule.map((q) => (
                <tr key={q.quarter}>
                  <td className="py-2 px-3 font-medium text-white print:text-slate-900">{q.quarter}</td>
                  <td className="py-2 px-3 text-slate-400 print:text-slate-600">{q.dueDate}</td>
                  <td className="py-2 px-3 text-right font-mono">{q.statutoryCumulativePercent}%</td>
                  <td className="py-2 px-3 text-right font-mono">{formatCurrency(q.cumulativeTaxDue, currencySymbol)}</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-400 print:text-emerald-700 font-bold">{formatCurrency(q.installmentDue, currencySymbol)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------- ESOP & RSU SUB-VIEW ----------------
function ESOPReportView({
  params,
  currencySymbol,
}: {
  params: ESOPParams;
  currencySymbol: string;
}) {
  const result = calculateESOPTax(params);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 print:text-slate-600 mb-2.5">
          Equity Grant & Vesting Parameters
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 print:bg-slate-100 border border-slate-800 print:border-slate-300 text-xs">
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Instrument Type:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900 uppercase">
              {params.planType} ({params.companyType.replace('_', ' ')})
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Vesting FMV:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.fmvAtVestingExercise, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Current Sale Price:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {formatCurrency(params.currentSalePrice, currencySymbol)}
            </strong>
          </div>
          <div>
            <span className="text-slate-400 print:text-slate-600 block">Units Liquidated:</span>
            <strong className="font-mono text-sm text-white print:text-slate-900">
              {params.unitsToSell} Units
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Stage 1 Perquisite Tax</span>
          <span className="text-base font-bold font-mono text-amber-400 print:text-amber-800">
            {formatCurrency(result.perquisiteTaxPayable, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Stage 2 Capital Gain Tax</span>
          <span className="text-base font-bold font-mono text-cyan-400 print:text-cyan-800">
            {formatCurrency(result.capitalGainTaxPayable, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Total Combined Taxes</span>
          <span className="text-base font-bold font-mono text-rose-400 print:text-rose-800">
            {formatCurrency(result.totalCombinedTax, currencySymbol)}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-slate-900 print:bg-slate-50 border border-slate-800 print:border-slate-200">
          <span className="text-xs text-slate-400 print:text-slate-600 block mb-1">Net Post-Tax Wealth</span>
          <span className="text-base font-bold font-mono text-emerald-400 print:text-emerald-800">
            {formatCurrency(result.netPostTaxWealth, currencySymbol)}
          </span>
        </div>
      </div>
    </div>
  );
}
