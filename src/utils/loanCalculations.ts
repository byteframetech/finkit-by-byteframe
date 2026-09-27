import {
  LoanParams,
  ScheduleItem,
  YearlySummary,
  CalculationResult,
  BiWeeklyResult,
  RateShockParams,
  RateShockResult,
  DebtConsolidationParams,
  DebtConsolidationResult,
  DebtItem,
} from '../types';

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function calculateLoan(params: LoanParams): CalculationResult {
  const {
    principal,
    annualInterestRate,
    years,
    months,
    startMonth,
    startYear,
    extraMonthlyPayment = 0,
    lumpSumPayment = 0,
    lumpSumMonth = 0
  } = params;

  const totalNominalMonths = (years * 12) + months;
  const monthlyRate = (annualInterestRate / 100) / 12;

  // Baseline monthly payment without extra payments
  let baseMonthlyPayment = 0;
  if (totalNominalMonths <= 0 || principal <= 0) {
    baseMonthlyPayment = 0;
  } else if (monthlyRate === 0) {
    baseMonthlyPayment = principal / totalNominalMonths;
  } else {
    baseMonthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalNominalMonths)) /
      (Math.pow(1 + monthlyRate, totalNominalMonths) - 1);
  }

  // Calculate baseline schedule (without extra payments) for comparison
  let baselineTotalInterest = 0;
  if (totalNominalMonths > 0 && principal > 0) {
    let bal = principal;
    for (let m = 1; m <= totalNominalMonths; m++) {
      const interest = bal * monthlyRate;
      const prin = Math.min(bal, baseMonthlyPayment - interest);
      bal -= prin;
      baselineTotalInterest += interest;
      if (bal <= 0.001) break;
    }
  }

  // Generate actual schedule with potential extra monthly and lump-sum payments
  const schedule: ScheduleItem[] = [];
  let currentBalance = principal;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;
  let totalRepayment = 0;

  const maxSafetyMonths = 600; // 50 years max
  let monthIndex = 1;

  while (currentBalance > 0.005 && monthIndex <= maxSafetyMonths) {
    // Current date calculation
    const currentCalMonth = (startMonth + monthIndex - 1) % 12;
    const currentCalYear = startYear + Math.floor((startMonth + monthIndex - 1) / 12);
    const dateString = `${MONTH_NAMES[currentCalMonth]} ${currentCalYear}`;
    const yearNumber = Math.floor((monthIndex - 1) / 12) + 1;
    const monthInYear = ((monthIndex - 1) % 12) + 1;

    const interestPayment = monthlyRate > 0 ? currentBalance * monthlyRate : 0;
    
    // Regular scheduled principal payment
    let regularPrincipal = baseMonthlyPayment - interestPayment;
    if (regularPrincipal > currentBalance) {
      regularPrincipal = currentBalance;
    }
    if (regularPrincipal < 0) {
      regularPrincipal = 0;
    }

    // Extra payments for this month
    let extra = extraMonthlyPayment > 0 ? extraMonthlyPayment : 0;
    if (lumpSumPayment > 0 && lumpSumMonth === monthIndex) {
      extra += lumpSumPayment;
    }

    // Don't overpay beyond remaining balance
    const remainingAfterRegular = Math.max(0, currentBalance - regularPrincipal);
    if (extra > remainingAfterRegular) {
      extra = remainingAfterRegular;
    }

    const totalPrincipal = regularPrincipal + extra;
    const actualTotalPayment = interestPayment + totalPrincipal;

    currentBalance = Math.max(0, currentBalance - totalPrincipal);
    cumulativeInterest += interestPayment;
    cumulativePrincipal += totalPrincipal;
    totalRepayment += actualTotalPayment;

    schedule.push({
      month: monthIndex,
      dateString,
      yearNumber,
      monthInYear,
      regularPayment: round2(baseMonthlyPayment),
      extraPayment: round2(extra),
      totalPayment: round2(actualTotalPayment),
      principalPayment: round2(totalPrincipal),
      interestPayment: round2(interestPayment),
      remainingBalance: round2(currentBalance),
      cumulativeInterest: round2(cumulativeInterest),
      cumulativePrincipal: round2(cumulativePrincipal),
    });

    if (currentBalance <= 0.005) {
      break;
    }

    monthIndex++;
  }

  const actualTotalMonths = schedule.length;
  const totalInterest = cumulativeInterest;
  const roundedTotalRepayment = principal + totalInterest;

  // Last payment date
  let payoffDate = 'N/A';
  if (schedule.length > 0) {
    const lastItem = schedule[schedule.length - 1];
    payoffDate = lastItem.dateString;
  }

  // Yearly Summary aggregation
  const yearlySummaryMap = new Map<number, YearlySummary>();
  let prevYearEndBalance = principal;

  schedule.forEach((item) => {
    const y = item.yearNumber;
    if (!yearlySummaryMap.has(y)) {
      const calYear = startYear + Math.floor((startMonth + item.month - 1) / 12);
      yearlySummaryMap.set(y, {
        yearNumber: y,
        calendarYear: calYear,
        startBalance: prevYearEndBalance,
        endBalance: item.remainingBalance,
        totalPaid: 0,
        principalPaid: 0,
        interestPaid: 0,
      });
    }

    const currentYearSummary = yearlySummaryMap.get(y)!;
    currentYearSummary.totalPaid += item.totalPayment;
    currentYearSummary.principalPaid += item.principalPayment;
    currentYearSummary.interestPaid += item.interestPayment;
    currentYearSummary.endBalance = item.remainingBalance;
    prevYearEndBalance = item.remainingBalance;
  });

  const yearlySummary: YearlySummary[] = Array.from(yearlySummaryMap.values()).map(y => ({
    ...y,
    startBalance: round2(y.startBalance),
    endBalance: round2(y.endBalance),
    totalPaid: round2(y.totalPaid),
    principalPaid: round2(y.principalPaid),
    interestPaid: round2(y.interestPaid),
  }));

  const principalPercentage = roundedTotalRepayment > 0 ? (principal / roundedTotalRepayment) * 100 : 100;
  const interestPercentage = roundedTotalRepayment > 0 ? (totalInterest / roundedTotalRepayment) * 100 : 0;

  const hasExtra = (extraMonthlyPayment > 0 || lumpSumPayment > 0);
  const savingsWithExtra = hasExtra ? {
    baselineTotalInterest: round2(baselineTotalInterest),
    baselineMonths: totalNominalMonths,
    interestSaved: Math.max(0, round2(baselineTotalInterest - totalInterest)),
    monthsSaved: Math.max(0, totalNominalMonths - actualTotalMonths),
    baselineMonthlyPayment: round2(baseMonthlyPayment),
  } : undefined;

  return {
    monthlyPayment: round2(baseMonthlyPayment),
    totalMonths: actualTotalMonths,
    totalRepayment: round2(roundedTotalRepayment),
    totalInterest: round2(totalInterest),
    schedule,
    yearlySummary,
    payoffDate,
    principalPercentage: round2(principalPercentage),
    interestPercentage: round2(interestPercentage),
    savingsWithExtra,
  };
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(amount: number, symbol = '₹'): string {
  if (isNaN(amount) || amount === undefined || amount === null) return `${symbol}0.00`;
  
  if (symbol === '₹') {
    // Format using standard Indian numbering system (Lakhs & Crores)
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
  }

  // Standard Western numbering system (Thousands, Millions)
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${symbol}${formatted}`;
}

export function formatPercent(rate: number): string {
  if (isNaN(rate) || rate === undefined) return '0.0%';
  return `${rate.toFixed(2)}%`;
}

export function generateAmortizationCSV(schedule: ScheduleItem[], currencySymbol = '₹'): string {
  const headers = [
    'Month',
    'Date',
    'Year',
    `Total Payment (${currencySymbol})`,
    `Principal (${currencySymbol})`,
    `Interest (${currencySymbol})`,
    `Extra Payment (${currencySymbol})`,
    `Remaining Balance (${currencySymbol})`,
    `Cumulative Interest (${currencySymbol})`,
    `Cumulative Principal (${currencySymbol})`
  ];

  const rows = schedule.map(row => [
    row.month,
    `"${row.dateString}"`,
    row.yearNumber,
    row.totalPayment.toFixed(2),
    row.principalPayment.toFixed(2),
    row.interestPayment.toFixed(2),
    row.extraPayment.toFixed(2),
    row.remainingBalance.toFixed(2),
    row.cumulativeInterest.toFixed(2),
    row.cumulativePrincipal.toFixed(2)
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

// ---------------- BI-WEEKLY LOAN CALCULATIONS ----------------
export function calculateBiWeeklyLoan(params: LoanParams): BiWeeklyResult {
  const { principal, annualInterestRate, years, months } = params;
  const totalNominalMonths = years * 12 + months;
  const monthlyRate = annualInterestRate / 100 / 12;

  // Monthly baseline
  let monthlyPayment = 0;
  if (monthlyRate === 0) {
    monthlyPayment = principal / totalNominalMonths;
  } else {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, totalNominalMonths)) /
      (Math.pow(1 + monthlyRate, totalNominalMonths) - 1);
  }

  // Baseline total interest under monthly
  let monthlyTotalInterest = 0;
  let mBalance = principal;
  for (let m = 1; m <= totalNominalMonths; m++) {
    const interest = mBalance * monthlyRate;
    const prin = Math.min(mBalance, monthlyPayment - interest);
    mBalance -= prin;
    monthlyTotalInterest += interest;
    if (mBalance <= 0.001) break;
  }

  // Bi-weekly payment = half of monthly EMI, paid 26 times per year
  const biWeeklyPayment = monthlyPayment / 2;
  const biWeeklyRate = annualInterestRate / 100 / 26;

  let bwBalance = principal;
  let biWeeklyTotalInterest = 0;
  let biWeeklyPeriods = 0;
  const maxPeriods = 26 * 50; // 50 years cap

  while (bwBalance > 0.01 && biWeeklyPeriods < maxPeriods) {
    biWeeklyPeriods++;
    const periodInterest = bwBalance * biWeeklyRate;
    const periodPrincipal = Math.min(bwBalance, biWeeklyPayment - periodInterest);
    bwBalance -= periodPrincipal;
    biWeeklyTotalInterest += periodInterest;
  }

  // Convert bi-weekly periods to equivalent months (26 periods = 12 months)
  const payoffMonthsBiWeekly = round2((biWeeklyPeriods / 26) * 12);
  const monthsSaved = Math.max(0, round2(totalNominalMonths - payoffMonthsBiWeekly));
  const interestSaved = Math.max(0, round2(monthlyTotalInterest - biWeeklyTotalInterest));

  return {
    monthlyPayment: round2(monthlyPayment),
    biWeeklyPayment: round2(biWeeklyPayment),
    payoffMonthsMonthly: totalNominalMonths,
    payoffMonthsBiWeekly,
    monthsSaved,
    totalInterestMonthly: round2(monthlyTotalInterest),
    totalInterestBiWeekly: round2(biWeeklyTotalInterest),
    interestSaved,
  };
}

// ---------------- RATE SHOCK STRESS TEST ----------------
export function calculateRateShock(
  params: LoanParams,
  shock: RateShockParams
): RateShockResult {
  const { principal, annualInterestRate, years, months } = params;
  const totalNominalMonths = years * 12 + months;
  const baselineMonthlyRate = annualInterestRate / 100 / 12;

  // Baseline Monthly EMI
  let baselineEMI = 0;
  if (baselineMonthlyRate === 0) {
    baselineEMI = principal / totalNominalMonths;
  } else {
    baselineEMI =
      (principal * baselineMonthlyRate * Math.pow(1 + baselineMonthlyRate, totalNominalMonths)) /
      (Math.pow(1 + baselineMonthlyRate, totalNominalMonths) - 1);
  }

  // Amortize until shockMonth
  const shockMonthClamped = Math.min(Math.max(1, shock.shockMonth), totalNominalMonths - 1);
  let balanceAtShock = principal;
  let interestPaidBeforeShock = 0;

  for (let m = 1; m <= shockMonthClamped; m++) {
    const interest = balanceAtShock * baselineMonthlyRate;
    const prin = Math.min(balanceAtShock, baselineEMI - interest);
    balanceAtShock -= prin;
    interestPaidBeforeShock += interest;
    if (balanceAtShock <= 0.01) break;
  }

  const remainingMonths = totalNominalMonths - shockMonthClamped;
  const newRate = annualInterestRate + shock.rateHikePercent;
  const newMonthlyRate = newRate / 100 / 12;

  let newEMI = baselineEMI;
  let newPayoffMonths = totalNominalMonths;
  let interestPaidAfterShock = 0;

  if (shock.adjustmentMode === 'increase_emi') {
    // Recompute EMI for remaining tenure at the higher interest rate
    if (newMonthlyRate === 0) {
      newEMI = balanceAtShock / remainingMonths;
    } else {
      newEMI =
        (balanceAtShock * newMonthlyRate * Math.pow(1 + newMonthlyRate, remainingMonths)) /
        (Math.pow(1 + newMonthlyRate, remainingMonths) - 1);
    }

    let b = balanceAtShock;
    for (let m = 1; m <= remainingMonths; m++) {
      const interest = b * newMonthlyRate;
      const prin = Math.min(b, newEMI - interest);
      b -= prin;
      interestPaidAfterShock += interest;
      if (b <= 0.01) break;
    }
  } else {
    // Keep old EMI, extend tenure until paid off
    let b = balanceAtShock;
    let extraMonths = 0;
    const maxSafety = 600;

    while (b > 0.01 && extraMonths < maxSafety) {
      extraMonths++;
      const interest = b * newMonthlyRate;
      if (baselineEMI <= interest) {
        // Negative amortization: EMI cannot even service interest!
        interestPaidAfterShock += interest * (remainingMonths * 2);
        extraMonths = remainingMonths * 3;
        break;
      }
      const prin = Math.min(b, baselineEMI - interest);
      b -= prin;
      interestPaidAfterShock += interest;
    }

    newPayoffMonths = shockMonthClamped + extraMonths;
  }

  // Baseline total interest
  let baselineTotalInterest = 0;
  let bBase = principal;
  for (let m = 1; m <= totalNominalMonths; m++) {
    const interest = bBase * baselineMonthlyRate;
    const prin = Math.min(bBase, baselineEMI - interest);
    bBase -= prin;
    baselineTotalInterest += interest;
    if (bBase <= 0.01) break;
  }

  const newTotalInterest = interestPaidBeforeShock + interestPaidAfterShock;

  return {
    baselineRate: annualInterestRate,
    newRate,
    shockMonth: shockMonthClamped,
    baselineEMI: round2(baselineEMI),
    newEMI: round2(newEMI),
    monthlyEMIDifference: round2(newEMI - baselineEMI),
    baselinePayoffMonths: totalNominalMonths,
    newPayoffMonths,
    tenureExtensionMonths: Math.max(0, newPayoffMonths - totalNominalMonths),
    baselineTotalInterest: round2(baselineTotalInterest),
    newTotalInterest: round2(newTotalInterest),
    extraInterestPaid: round2(Math.max(0, newTotalInterest - baselineTotalInterest)),
  };
}

// ---------------- DEBT CONSOLIDATION SIMULATOR ----------------
export function calculateDebtConsolidation(
  params: DebtConsolidationParams
): DebtConsolidationResult {
  const { debts, consolidationRate, consolidationYears, processingFeePercent = 1.0 } = params;

  let totalCurrentBalance = 0;
  let totalCurrentMonthlyPayment = 0;
  let totalCurrentInterestRemaining = 0;
  let weightedRateSum = 0;

  const analyzedDebts = debts.map((d) => {
    totalCurrentBalance += d.currentBalance;
    totalCurrentMonthlyPayment += d.monthlyPayment;
    weightedRateSum += d.currentBalance * d.annualInterestRate;

    const r = d.annualInterestRate / 100 / 12;
    let bal = d.currentBalance;
    let interestSum = 0;
    let monthsCount = 0;
    const maxMonths = 360;

    if (d.monthlyPayment > bal * r && r > 0) {
      while (bal > 0.01 && monthsCount < maxMonths) {
        monthsCount++;
        const interest = bal * r;
        const prin = Math.min(bal, d.monthlyPayment - interest);
        bal -= prin;
        interestSum += interest;
      }
    } else if (r === 0 && d.monthlyPayment > 0) {
      monthsCount = Math.ceil(bal / d.monthlyPayment);
    } else {
      monthsCount = 120;
      interestSum = bal * (d.annualInterestRate / 100) * 3;
    }

    totalCurrentInterestRemaining += interestSum;

    return {
      ...d,
      currentPayoffMonths: monthsCount,
      currentTotalInterest: round2(interestSum),
    };
  });

  const weightedAverageCurrentRate =
    totalCurrentBalance > 0 ? weightedRateSum / totalCurrentBalance : 0;

  // New Consolidated Loan
  const feeAmount = totalCurrentBalance * (processingFeePercent / 100);
  const newLoanPrincipal = totalCurrentBalance + feeAmount;
  const newTenureMonths = consolidationYears * 12;
  const newMonthlyRate = consolidationRate / 100 / 12;

  let newMonthlyPayment = 0;
  if (newMonthlyRate === 0) {
    newMonthlyPayment = newLoanPrincipal / newTenureMonths;
  } else {
    newMonthlyPayment =
      (newLoanPrincipal * newMonthlyRate * Math.pow(1 + newMonthlyRate, newTenureMonths)) /
      (Math.pow(1 + newMonthlyRate, newTenureMonths) - 1);
  }

  let newTotalInterest = 0;
  let nBal = newLoanPrincipal;
  for (let m = 1; m <= newTenureMonths; m++) {
    const interest = nBal * newMonthlyRate;
    const prin = Math.min(nBal, newMonthlyPayment - interest);
    nBal -= prin;
    newTotalInterest += interest;
    if (nBal <= 0.01) break;
  }

  const newTotalRepayment = newLoanPrincipal + newTotalInterest;
  const monthlySavings = round2(totalCurrentMonthlyPayment - newMonthlyPayment);
  const lifetimeInterestSavings = round2(
    Math.max(0, totalCurrentInterestRemaining - (newTotalInterest + feeAmount))
  );
  const netFinancialBenefit = round2(
    totalCurrentInterestRemaining - newTotalInterest - feeAmount
  );
  const breakEvenMonths =
    monthlySavings > 0 ? Math.ceil(feeAmount / monthlySavings) : 0;

  return {
    totalCurrentBalance: round2(totalCurrentBalance),
    totalCurrentMonthlyPayment: round2(totalCurrentMonthlyPayment),
    totalCurrentInterestRemaining: round2(totalCurrentInterestRemaining),
    weightedAverageCurrentRate: round2(weightedAverageCurrentRate),
    newLoanPrincipal: round2(newLoanPrincipal),
    newMonthlyPayment: round2(newMonthlyPayment),
    newTotalInterest: round2(newTotalInterest),
    newTotalRepayment: round2(newTotalRepayment),
    monthlySavings,
    lifetimeInterestSavings,
    netFinancialBenefit,
    breakEvenMonths,
    debts: analyzedDebts,
  };
}
