import {
  SIPParams,
  SIPResult,
  SIPYearlyItem,
  SWPParams,
  SWPResult,
  SWPYearlyItem,
  FVParams,
  FVResult,
  FVYearlyItem,
  PVParams,
  PVResult,
  PVYearlyItem,
  CompoundingFrequency,
  GoalParams,
  GoalResult,
  GoalYearlyItem,
  MonteCarloResult,
  MonteCarloYearPath,
  InflationSubIndex,
  InflationBasketResult,
} from '../types';
import { round2 } from './loanCalculations';

// ---------------- SIP CALCULATIONS ----------------
export function calculateSIP(params: SIPParams): SIPResult {
  const {
    monthlyInvestment,
    annualExpectedReturn,
    timePeriodYears,
    annualStepUpPercent = 0,
  } = params;

  const totalMonths = Math.max(1, timePeriodYears * 12);
  const monthlyRate = annualExpectedReturn / 100 / 12;

  let currentMonthlySIP = monthlyInvestment;
  let runningBalance = 0;
  let totalInvested = 0;

  const yearlyMap = new Map<number, SIPYearlyItem>();

  for (let m = 1; m <= totalMonths; m++) {
    const yearNumber = Math.floor((m - 1) / 12) + 1;

    // Apply step up at the start of each new year
    if (m > 1 && (m - 1) % 12 === 0 && annualStepUpPercent > 0) {
      currentMonthlySIP = currentMonthlySIP * (1 + annualStepUpPercent / 100);
    }

    totalInvested += currentMonthlySIP;
    // Compounded growth for this month
    runningBalance = (runningBalance + currentMonthlySIP) * (1 + monthlyRate);

    // Yearly tracking
    if (!yearlyMap.has(yearNumber)) {
      yearlyMap.set(yearNumber, {
        year: yearNumber,
        monthlyDeposit: round2(currentMonthlySIP),
        annualDeposit: 0,
        totalInvested: 0,
        interestEarnedYear: 0,
        totalWealthGain: 0,
        endBalance: 0,
      });
    }

    const yItem = yearlyMap.get(yearNumber)!;
    yItem.annualDeposit += currentMonthlySIP;
    yItem.totalInvested = round2(totalInvested);
    yItem.endBalance = round2(runningBalance);
    yItem.totalWealthGain = round2(Math.max(0, runningBalance - totalInvested));
  }

  const yearlySchedule = Array.from(yearlyMap.values()).map((item, idx, arr) => {
    const prevEnd = idx > 0 ? arr[idx - 1].endBalance : 0;
    const yearGrowth = item.endBalance - prevEnd - item.annualDeposit;
    return {
      ...item,
      annualDeposit: round2(item.annualDeposit),
      interestEarnedYear: round2(Math.max(0, yearGrowth)),
    };
  });

  const totalMaturityValue = round2(runningBalance);
  const estimatedReturns = round2(Math.max(0, totalMaturityValue - totalInvested));
  const roundedTotalInvested = round2(totalInvested);

  const investedPercentage =
    totalMaturityValue > 0 ? round2((roundedTotalInvested / totalMaturityValue) * 100) : 100;
  const returnsPercentage =
    totalMaturityValue > 0 ? round2((estimatedReturns / totalMaturityValue) * 100) : 0;
  const wealthMultiplier =
    roundedTotalInvested > 0 ? round2(totalMaturityValue / roundedTotalInvested) : 1;

  return {
    totalInvested: roundedTotalInvested,
    estimatedReturns,
    totalMaturityValue,
    investedPercentage,
    returnsPercentage,
    wealthMultiplier,
    yearlySchedule,
  };
}

export function generateSIPCSV(schedule: SIPYearlyItem[], currencySymbol = '₹'): string {
  const headers = [
    'Year',
    `Monthly Deposit (${currencySymbol})`,
    `Annual Deposit (${currencySymbol})`,
    `Total Invested (${currencySymbol})`,
    `Interest Earned in Year (${currencySymbol})`,
    `Total Wealth Gain (${currencySymbol})`,
    `Portfolio Balance (${currencySymbol})`,
  ];

  const rows = schedule.map((row) => [
    row.year,
    row.monthlyDeposit.toFixed(2),
    row.annualDeposit.toFixed(2),
    row.totalInvested.toFixed(2),
    row.interestEarnedYear.toFixed(2),
    row.totalWealthGain.toFixed(2),
    row.endBalance.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// ---------------- SWP CALCULATIONS ----------------
export function calculateSWP(params: SWPParams): SWPResult {
  const {
    initialCorpus,
    monthlyWithdrawal,
    annualExpectedReturn,
    timePeriodYears,
    annualWithdrawalStepUp = 0,
  } = params;

  const totalMonths = Math.max(1, timePeriodYears * 12);
  const monthlyRate = annualExpectedReturn / 100 / 12;

  let balance = initialCorpus;
  let currentWithdrawal = monthlyWithdrawal;
  let totalWithdrawn = 0;
  let totalGrowthEarned = 0;
  let isDepleted = false;
  let depletedMonth: number | undefined;
  let depletedYear: number | undefined;

  const yearlyMap = new Map<number, SWPYearlyItem>();
  let prevYearEnd = initialCorpus;

  for (let m = 1; m <= totalMonths; m++) {
    const yearNumber = Math.floor((m - 1) / 12) + 1;

    // Annual step-up in withdrawal
    if (m > 1 && (m - 1) % 12 === 0 && annualWithdrawalStepUp > 0) {
      currentWithdrawal = currentWithdrawal * (1 + annualWithdrawalStepUp / 100);
    }

    if (!yearlyMap.has(yearNumber)) {
      yearlyMap.set(yearNumber, {
        year: yearNumber,
        startBalance: round2(prevYearEnd),
        annualWithdrawal: 0,
        annualGrowth: 0,
        endBalance: 0,
        cumulativeWithdrawn: 0,
        cumulativeGrowth: 0,
      });
    }

    const yItem = yearlyMap.get(yearNumber)!;

    if (balance > 0) {
      // Interest earned on balance before withdrawal
      const monthlyInterest = balance * monthlyRate;
      totalGrowthEarned += monthlyInterest;
      yItem.annualGrowth += monthlyInterest;

      // Deduct withdrawal
      const actualWithdrawal = Math.min(balance + monthlyInterest, currentWithdrawal);
      balance = Math.max(0, balance + monthlyInterest - actualWithdrawal);
      totalWithdrawn += actualWithdrawal;
      yItem.annualWithdrawal += actualWithdrawal;

      if (balance <= 0.01 && !isDepleted) {
        isDepleted = true;
        depletedMonth = m;
        depletedYear = yearNumber;
        balance = 0;
      }
    }

    yItem.endBalance = round2(balance);
    yItem.cumulativeWithdrawn = round2(totalWithdrawn);
    yItem.cumulativeGrowth = round2(totalGrowthEarned);
    prevYearEnd = balance;
  }

  const yearlySchedule = Array.from(yearlyMap.values()).map((item) => ({
    ...item,
    annualWithdrawal: round2(item.annualWithdrawal),
    annualGrowth: round2(item.annualGrowth),
  }));

  return {
    initialCorpus: round2(initialCorpus),
    totalWithdrawn: round2(totalWithdrawn),
    finalCorpus: round2(balance),
    totalGrowthEarned: round2(totalGrowthEarned),
    isDepleted,
    depletedMonth,
    depletedYear,
    yearlySchedule,
  };
}

export function generateSWPCSV(schedule: SWPYearlyItem[], currencySymbol = '₹'): string {
  const headers = [
    'Year',
    `Starting Balance (${currencySymbol})`,
    `Annual Withdrawn (${currencySymbol})`,
    `Investment Growth in Year (${currencySymbol})`,
    `Year-End Corpus (${currencySymbol})`,
    `Cumulative Withdrawn (${currencySymbol})`,
    `Cumulative Growth (${currencySymbol})`,
  ];

  const rows = schedule.map((row) => [
    row.year,
    row.startBalance.toFixed(2),
    row.annualWithdrawal.toFixed(2),
    row.annualGrowth.toFixed(2),
    row.endBalance.toFixed(2),
    row.cumulativeWithdrawn.toFixed(2),
    row.cumulativeGrowth.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// ---------------- FUTURE VALUE (FV) CALCULATIONS ----------------
export function getCompoundingPeriodsPerYear(freq: CompoundingFrequency): number {
  switch (freq) {
    case 'daily':
      return 365;
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    case 'semi-annually':
      return 2;
    case 'annually':
    default:
      return 1;
  }
}

export function calculateFV(params: FVParams): FVResult {
  const {
    presentValue,
    periodicPayment,
    paymentTiming = 'end',
    paymentFrequency = 'monthly',
    annualInterestRate,
    years,
    compoundingFrequency,
  } = params;

  const r = annualInterestRate / 100;
  const n = getCompoundingPeriodsPerYear(compoundingFrequency);
  const totalYears = Math.max(1, years);

  // Month-by-month compounding engine for precision schedule
  const periodsPerYear = paymentFrequency === 'monthly' ? 12 : 1;
  const periodRate = Math.pow(1 + r / n, n / periodsPerYear) - 1;

  let balance = presentValue;
  let totalContributions = 0;
  const yearlySchedule: FVYearlyItem[] = [];

  let cumContributions = 0;
  let cumInterest = 0;

  for (let y = 1; y <= totalYears; y++) {
    const startBal = balance;
    let yearContributions = 0;
    let yearInterest = 0;

    for (let p = 1; p <= periodsPerYear; p++) {
      if (paymentTiming === 'beginning') {
        balance += periodicPayment;
        yearContributions += periodicPayment;
        const interest = balance * periodRate;
        balance += interest;
        yearInterest += interest;
      } else {
        const interest = balance * periodRate;
        balance += interest;
        yearInterest += interest;
        balance += periodicPayment;
        yearContributions += periodicPayment;
      }
    }

    cumContributions += yearContributions;
    cumInterest += yearInterest;

    yearlySchedule.push({
      year: y,
      startingBalance: round2(startBal),
      contributions: round2(yearContributions),
      interestEarned: round2(yearInterest),
      endingBalance: round2(balance),
      cumulativeContributions: round2(cumContributions),
      cumulativeInterest: round2(cumInterest),
    });
  }

  const futureValue = round2(balance);
  const roundedContributions = round2(cumContributions);
  const totalInterestEarned = round2(Math.max(0, futureValue - presentValue - roundedContributions));
  const totalBase = presentValue + roundedContributions;
  const interestRatio = futureValue > 0 ? round2((totalInterestEarned / futureValue) * 100) : 0;

  return {
    futureValue,
    initialDeposit: round2(presentValue),
    totalContributions: roundedContributions,
    totalInterestEarned,
    interestRatio,
    yearlySchedule,
  };
}

export function generateFVCSV(schedule: FVYearlyItem[], currencySymbol = '₹'): string {
  const headers = [
    'Year',
    `Starting Balance (${currencySymbol})`,
    `Contributions Added (${currencySymbol})`,
    `Interest Earned (${currencySymbol})`,
    `Ending Balance (${currencySymbol})`,
    `Total Contributions (${currencySymbol})`,
    `Total Interest Earned (${currencySymbol})`,
  ];

  const rows = schedule.map((row) => [
    row.year,
    row.startingBalance.toFixed(2),
    row.contributions.toFixed(2),
    row.interestEarned.toFixed(2),
    row.endingBalance.toFixed(2),
    row.cumulativeContributions.toFixed(2),
    row.cumulativeInterest.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// ---------------- PRESENT VALUE (PV) CALCULATIONS ----------------
export function calculatePV(params: PVParams): PVResult {
  const {
    futureValue,
    annualDiscountRate,
    years,
    compoundingFrequency,
    annualInflationRate = 2.5,
  } = params;

  const r = annualDiscountRate / 100;
  const n = getCompoundingPeriodsPerYear(compoundingFrequency);
  const t = Math.max(1, years);

  // Present Value formula: PV = FV / (1 + r/n)^(n*t)
  const discountFactor = Math.pow(1 + r / n, n * t);
  const presentValue = discountFactor > 0 ? round2(futureValue / discountFactor) : futureValue;
  const totalDiscount = round2(futureValue - presentValue);
  const discountPercentage = futureValue > 0 ? round2((totalDiscount / futureValue) * 100) : 0;

  // Real purchasing power loss due to inflation
  const inflationFactor = Math.pow(1 + annualInflationRate / 100, t);
  const realPurchasingPowerOfFV = inflationFactor > 0 ? round2(futureValue / inflationFactor) : futureValue;
  const purchasingPowerLoss = round2(futureValue - realPurchasingPowerOfFV);

  // Year-by-year discounting trajectory
  const yearlySchedule: PVYearlyItem[] = [];
  for (let y = 1; y <= t; y++) {
    const yrFactor = Math.pow(1 + r / n, n * y);
    const yrPV = yrFactor > 0 ? round2(futureValue / yrFactor) : futureValue;
    const yrInflation = Math.pow(1 + annualInflationRate / 100, y);
    const yrPurchasingPower = yrInflation > 0 ? round2(futureValue / yrInflation) : futureValue;

    yearlySchedule.push({
      year: y,
      discountedValue: yrPV,
      nominalDiscount: round2(futureValue - yrPV),
      realPurchasingPower: yrPurchasingPower,
    });
  }

  return {
    presentValue,
    futureValue: round2(futureValue),
    totalDiscount,
    discountPercentage,
    purchasingPowerLoss,
    realPresentValue: realPurchasingPowerOfFV,
    yearlySchedule,
  };
}

export function generatePVCSV(schedule: PVYearlyItem[], currencySymbol = '₹'): string {
  const headers = [
    'Year',
    `Discounted Present Value (${currencySymbol})`,
    `Discount from Future Sum (${currencySymbol})`,
    `Inflation-Adjusted Purchasing Power (${currencySymbol})`,
  ];

  const rows = schedule.map((row) => [
    row.year,
    row.discountedValue.toFixed(2),
    row.nominalDiscount.toFixed(2),
    row.realPurchasingPower.toFixed(2),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

// ---------------- GOAL-BASED REVERSE SIP CALCULATOR ----------------
export function calculateGoalReverseSIP(params: GoalParams): GoalResult {
  const {
    targetCorpus,
    targetYears,
    expectedAnnualReturn,
    annualStepUpPercent = 0,
    existingSavings = 0,
  } = params;

  const totalMonths = Math.max(1, targetYears * 12);
  const monthlyRate = expectedAnnualReturn / 100 / 12;

  // Growth of existing initial capital
  const fvExisting = existingSavings * Math.pow(1 + monthlyRate, totalMonths);
  const netCorpusNeeded = Math.max(0, targetCorpus - fvExisting);

  // Helper: compute future value of starting monthly SIP with annual step-up
  const simulateSIPFutureValue = (startingSIP: number): number => {
    let bal = 0;
    let currentSIP = startingSIP;
    for (let m = 1; m <= totalMonths; m++) {
      if (m > 1 && (m - 1) % 12 === 0 && annualStepUpPercent > 0) {
        currentSIP = currentSIP * (1 + annualStepUpPercent / 100);
      }
      bal = (bal + currentSIP) * (1 + monthlyRate);
    }
    return bal;
  };

  // Binary search to find exact starting SIP required
  let low = 0;
  let high = netCorpusNeeded;
  let startingSIP = 0;

  if (netCorpusNeeded > 0) {
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      const fv = simulateSIPFutureValue(mid);
      if (Math.abs(fv - netCorpusNeeded) < 0.1) {
        startingSIP = mid;
        break;
      }
      if (fv < netCorpusNeeded) {
        low = mid;
      } else {
        high = mid;
      }
      startingSIP = mid;
    }
  }

  // Generate Year-by-Year Progress
  const yearlyProgress: GoalYearlyItem[] = [];
  let runningSIP = startingSIP;
  let portfolioBalance = existingSavings;
  let totalDeposited = existingSavings;

  for (let y = 1; y <= targetYears; y++) {
    let yearDeposit = 0;
    for (let m = 1; m <= 12; m++) {
      yearDeposit += runningSIP;
      portfolioBalance = (portfolioBalance + runningSIP) * (1 + monthlyRate);
    }
    totalDeposited += yearDeposit;
    const progressPercent = Math.min(100, (portfolioBalance / targetCorpus) * 100);

    yearlyProgress.push({
      year: y,
      monthlyContribution: round2(runningSIP),
      annualDeposit: round2(yearDeposit),
      cumulativeDeposited: round2(totalDeposited),
      growthEarned: round2(Math.max(0, portfolioBalance - totalDeposited)),
      portfolioValue: round2(portfolioBalance),
      targetProgressPercent: round2(progressPercent),
    });

    if (annualStepUpPercent > 0) {
      runningSIP = runningSIP * (1 + annualStepUpPercent / 100);
    }
  }

  const finalValuation = round2(portfolioBalance);
  const totalGrowth = round2(Math.max(0, finalValuation - totalDeposited));

  return {
    requiredMonthlySIP: round2(startingSIP),
    startingMonthlySIP: round2(startingSIP),
    totalDeposited: round2(totalDeposited),
    totalGrowthEarned: totalGrowth,
    futureTargetValuation: finalValuation,
    annualStepUp: annualStepUpPercent,
    yearlyProgress,
  };
}

// ---------------- MONTE CARLO PROBABILISTIC SIMULATION FOR SWP ----------------
function randomNormal(mean = 0, stdDev = 1): number {
  let u = 1 - Math.random();
  let v = Math.random();
  let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

export function calculateSWPMonteCarlo(
  params: SWPParams,
  iterations = 500,
  stdDevPercent = 14
): MonteCarloResult {
  const {
    initialCorpus,
    monthlyWithdrawal,
    annualExpectedReturn,
    timePeriodYears,
    annualWithdrawalStepUp = 0,
  } = params;

  const annualMean = annualExpectedReturn / 100;
  const annualVol = stdDevPercent / 100;
  const monthlyMean = annualMean / 12;
  const monthlyVol = annualVol / Math.sqrt(12);

  const yearBalances: number[][] = Array.from({ length: timePeriodYears }, () => []);
  let successfulRuns = 0;
  const finalCorpusList: number[] = [];

  for (let iter = 0; iter < iterations; iter++) {
    let currentCorpus = initialCorpus;
    let currentMonthlyWithdrawal = monthlyWithdrawal;
    let didDeplete = false;

    for (let y = 1; y <= timePeriodYears; y++) {
      if (y > 1 && annualWithdrawalStepUp > 0) {
        currentMonthlyWithdrawal =
          currentMonthlyWithdrawal * (1 + annualWithdrawalStepUp / 100);
      }

      for (let m = 1; m <= 12; m++) {
        if (currentCorpus <= 0) {
          currentCorpus = 0;
          didDeplete = true;
          break;
        }

        const rMonth = randomNormal(monthlyMean, monthlyVol);
        currentCorpus = currentCorpus * (1 + rMonth) - currentMonthlyWithdrawal;
        if (currentCorpus < 0) currentCorpus = 0;
      }

      yearBalances[y - 1].push(currentCorpus);
    }

    if (!didDeplete && currentCorpus > 0) {
      successfulRuns++;
    }
    finalCorpusList.push(currentCorpus);
  }

  const paths: MonteCarloYearPath[] = [];

  for (let y = 1; y <= timePeriodYears; y++) {
    const list = [...yearBalances[y - 1]].sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const idx = Math.min(list.length - 1, Math.floor((p / 100) * list.length));
      return round2(list[idx]);
    };

    paths.push({
      year: y,
      p10: getPercentile(10),
      p25: getPercentile(25),
      p50: getPercentile(50),
      p75: getPercentile(75),
      p90: getPercentile(90),
    });
  }

  finalCorpusList.sort((a, b) => a - b);
  const successProbability = round2((successfulRuns / iterations) * 100);
  const depletionRiskPercent = round2(100 - successProbability);
  const medianEndingCorpus = round2(finalCorpusList[Math.floor(iterations * 0.5)]);
  const worstCaseEndingCorpus = round2(finalCorpusList[Math.floor(iterations * 0.1)]);
  const bestCaseEndingCorpus = round2(finalCorpusList[Math.floor(iterations * 0.9)]);

  return {
    iterations,
    successProbability,
    depletionRiskPercent,
    medianEndingCorpus,
    worstCaseEndingCorpus,
    bestCaseEndingCorpus,
    paths,
  };
}

// ---------------- INFLATION BASKET CUSTOMIZATION ----------------
export function calculateInflationBasket(
  subIndices: InflationSubIndex[],
  officialCPI = 5.5
): InflationBasketResult {
  let totalWeight = 0;
  let weightedRateSum = 0;

  subIndices.forEach((item) => {
    totalWeight += item.weightPercent;
    weightedRateSum += item.weightPercent * item.inflationRate;
  });

  const blendedPersonalInflationRate =
    totalWeight > 0 ? round2(weightedRateSum / totalWeight) : officialCPI;

  const differentialRate = round2(blendedPersonalInflationRate - officialCPI);
  const projectedCostMultiplier10Y = round2(
    Math.pow(1 + blendedPersonalInflationRate / 100, 10)
  );
  const projectedCostMultiplier20Y = round2(
    Math.pow(1 + blendedPersonalInflationRate / 100, 20)
  );

  return {
    blendedPersonalInflationRate,
    officialCPIRate: officialCPI,
    differentialRate,
    projectedCostMultiplier10Y,
    projectedCostMultiplier20Y,
    subIndices,
  };
}
