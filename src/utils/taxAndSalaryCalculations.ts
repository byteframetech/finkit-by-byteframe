import {
  IncomeTaxParams,
  IncomeTaxResult,
  RegimeTaxBreakdown,
  TaxBracket,
  SalaryParams,
  SalaryResult,
  SalaryBreakdownItem,
  CapitalGainsParams,
  CapitalGainsResult,
  AssetCategory,
  MultiYearTaxResult,
  MultiYearTaxProjectionItem,
  FreelancerTaxParams,
  FreelancerTaxResult,
  AdvanceTaxQuarter,
  ESOPParams,
  ESOPResult,
} from '../types';
import { round2 } from './loanCalculations';

// ---------------- INCOME TAX CALCULATOR ----------------
export function calculateIncomeTax(params: IncomeTaxParams): IncomeTaxResult {
  const {
    financialYear,
    grossAnnualIncome,
    otherIncome = 0,
    standardDeduction = 75000,
    section80C = 0,
    section80D = 0,
    hraDeduction = 0,
    homeLoanInterest = 0,
    npsSection80CCD = 0,
    otherDeductions = 0,
  } = params;

  const totalGrossIncome = grossAnnualIncome + otherIncome;

  // 1. Calculate New Tax Regime (FY 2025-26 / prevailing)
  // New regime allows standard deduction (₹75,000) and NPS employer deduction, but not 80C/80D/HRA
  const newRegimeStandardDeduction = Math.min(totalGrossIncome, 75000);
  const newRegimeTaxableIncome = Math.max(0, totalGrossIncome - newRegimeStandardDeduction);

  const newBrackets: TaxBracket[] = [
    { from: 0, to: 300000, rate: 0, taxableInBracket: 0, taxAmount: 0 },
    { from: 300000, to: 700000, rate: 5, taxableInBracket: 0, taxAmount: 0 },
    { from: 700000, to: 1000000, rate: 10, taxableInBracket: 0, taxAmount: 0 },
    { from: 1000000, to: 1200000, rate: 15, taxableInBracket: 0, taxAmount: 0 },
    { from: 1200000, to: 1500000, rate: 20, taxableInBracket: 0, taxAmount: 0 },
    { from: 1500000, to: null, rate: 30, taxableInBracket: 0, taxAmount: 0 },
  ];

  let newBaseTax = 0;
  for (const b of newBrackets) {
    if (newRegimeTaxableIncome > b.from) {
      const taxable = b.to === null 
        ? newRegimeTaxableIncome - b.from 
        : Math.min(newRegimeTaxableIncome, b.to) - b.from;
      b.taxableInBracket = round2(taxable);
      b.taxAmount = round2((taxable * b.rate) / 100);
      newBaseTax += b.taxAmount;
    }
  }

  // Section 87A rebate under new regime: if taxable income <= 7,00,000, full rebate
  let newRebate = 0;
  if (newRegimeTaxableIncome <= 700000) {
    newRebate = newBaseTax;
  }
  const newTaxAfterRebate = Math.max(0, newBaseTax - newRebate);
  const newCess = round2(newTaxAfterRebate * 0.04);
  const newTotalTax = round2(newTaxAfterRebate + newCess);

  const newBreakdown: RegimeTaxBreakdown = {
    regimeName: 'New Tax Regime (Default)',
    grossIncome: round2(totalGrossIncome),
    totalDeductions: round2(newRegimeStandardDeduction),
    taxableIncome: round2(newRegimeTaxableIncome),
    baseTax: round2(newBaseTax),
    rebate: round2(newRebate),
    netTaxBeforeCess: round2(newTaxAfterRebate),
    cess: newCess,
    totalTax: newTotalTax,
    effectiveRate: totalGrossIncome > 0 ? round2((newTotalTax / totalGrossIncome) * 100) : 0,
    marginalRate: getMarginalRate(newRegimeTaxableIncome, 'new'),
    monthlyTax: round2(newTotalTax / 12),
    inHandAnnual: round2(totalGrossIncome - newTotalTax),
    inHandMonthly: round2((totalGrossIncome - newTotalTax) / 12),
    brackets: newBrackets,
  };

  // 2. Calculate Old Tax Regime
  // Old regime allows 50k standard deduction, 80C up to 1.5L, 80D up to 50k, HRA, Home loan interest up to 2L, NPS 50k
  const oldStandardDeduction = Math.min(totalGrossIncome, 50000);
  const capped80C = Math.min(section80C, 150000);
  const capped80D = Math.min(section80D, 75000);
  const cappedHomeLoan = Math.min(homeLoanInterest, 200000);
  const cappedNPS = Math.min(npsSection80CCD, 50000);

  const oldTotalDeductions = oldStandardDeduction + capped80C + capped80D + hraDeduction + cappedHomeLoan + cappedNPS + otherDeductions;
  const oldTaxableIncome = Math.max(0, totalGrossIncome - oldTotalDeductions);

  const oldBrackets: TaxBracket[] = [
    { from: 0, to: 250000, rate: 0, taxableInBracket: 0, taxAmount: 0 },
    { from: 250000, to: 500000, rate: 5, taxableInBracket: 0, taxAmount: 0 },
    { from: 500000, to: 1000000, rate: 20, taxableInBracket: 0, taxAmount: 0 },
    { from: 1000000, to: null, rate: 30, taxableInBracket: 0, taxAmount: 0 },
  ];

  let oldBaseTax = 0;
  for (const b of oldBrackets) {
    if (oldTaxableIncome > b.from) {
      const taxable = b.to === null 
        ? oldTaxableIncome - b.from 
        : Math.min(oldTaxableIncome, b.to) - b.from;
      b.taxableInBracket = round2(taxable);
      b.taxAmount = round2((taxable * b.rate) / 100);
      oldBaseTax += b.taxAmount;
    }
  }

  // Section 87A rebate under old regime: if taxable income <= 5,00,000, rebate up to ₹12,500
  let oldRebate = 0;
  if (oldTaxableIncome <= 500000) {
    oldRebate = Math.min(oldBaseTax, 12500);
  }
  const oldTaxAfterRebate = Math.max(0, oldBaseTax - oldRebate);
  const oldCess = round2(oldTaxAfterRebate * 0.04);
  const oldTotalTax = round2(oldTaxAfterRebate + oldCess);

  const oldBreakdown: RegimeTaxBreakdown = {
    regimeName: 'Old Tax Regime (With Deductions)',
    grossIncome: round2(totalGrossIncome),
    totalDeductions: round2(oldTotalDeductions),
    taxableIncome: round2(oldTaxableIncome),
    baseTax: round2(oldBaseTax),
    rebate: round2(oldRebate),
    netTaxBeforeCess: round2(oldTaxAfterRebate),
    cess: oldCess,
    totalTax: oldTotalTax,
    effectiveRate: totalGrossIncome > 0 ? round2((oldTotalTax / totalGrossIncome) * 100) : 0,
    marginalRate: getMarginalRate(oldTaxableIncome, 'old'),
    monthlyTax: round2(oldTotalTax / 12),
    inHandAnnual: round2(totalGrossIncome - oldTotalTax),
    inHandMonthly: round2((totalGrossIncome - oldTotalTax) / 12),
    brackets: oldBrackets,
  };

  const isCurrentNew = params.regime === 'new';
  const recommendedRegime = newTotalTax <= oldTotalTax ? 'new' : 'old';
  const taxSavingsWithRecommendation = Math.abs(newTotalTax - oldTotalTax);

  return {
    currentRegime: isCurrentNew ? newBreakdown : oldBreakdown,
    alternateRegime: isCurrentNew ? oldBreakdown : newBreakdown,
    recommendedRegime,
    taxSavingsWithRecommendation: round2(taxSavingsWithRecommendation),
  };
}

function getMarginalRate(taxable: number, regime: 'new' | 'old'): number {
  if (regime === 'new') {
    if (taxable > 1500000) return 30;
    if (taxable > 1200000) return 20;
    if (taxable > 1000000) return 15;
    if (taxable > 700000) return 10;
    if (taxable > 300000) return 5;
    return 0;
  } else {
    if (taxable > 1000000) return 30;
    if (taxable > 500000) return 20;
    if (taxable > 250000) return 5;
    return 0;
  }
}

// ---------------- SALARY / CTC CALCULATOR ----------------
export function calculateSalary(params: SalaryParams): SalaryResult {
  const {
    annualCTC,
    bonusAnnual = 0,
    employerPFMonthly,
    employeePFMonthly,
    professionalTaxMonthly = 200,
    annualTaxDeducted = 0,
    insuranceDeductionMonthly = 0,
    otherDeductionsMonthly = 0,
    customBasicPercent = 45,
    customHRAPercent = 40,
  } = params;

  const monthlyCTC = annualCTC / 12;

  // Basic salary calculation
  const annualBasic = (annualCTC * customBasicPercent) / 100;
  const monthlyBasic = annualBasic / 12;

  // HRA calculation (percentage of Basic)
  const annualHRA = (annualBasic * customHRAPercent) / 100;
  const monthlyHRA = annualHRA / 12;

  // Employer PF (default 12% of basic if not specified)
  const actualEmployerPFMonthly = employerPFMonthly > 0 ? employerPFMonthly : Math.min(monthlyBasic * 0.12, 1800);
  const actualEmployerPFAnnual = actualEmployerPFMonthly * 12;

  // Special allowance / remaining earnings
  const residualEarningAnnual = Math.max(0, annualCTC - annualBasic - annualHRA - bonusAnnual - actualEmployerPFAnnual);
  const monthlySpecialAllowance = residualEarningAnnual / 12;

  // Gross Salary = CTC minus employer benefits (Employer PF, Gratuity)
  const grossSalaryAnnual = annualCTC - actualEmployerPFAnnual;
  const grossSalaryMonthly = grossSalaryAnnual / 12;

  // Employee Deductions
  const actualEmployeePFMonthly = employeePFMonthly > 0 ? employeePFMonthly : actualEmployerPFMonthly;
  const actualEmployeePFAnnual = actualEmployeePFMonthly * 12;

  const actualPTMonthly = professionalTaxMonthly;
  const actualPTAnnual = actualPTMonthly * 12;

  const actualTDSMonthly = annualTaxDeducted / 12;

  const actualInsuranceAnnual = insuranceDeductionMonthly * 12;
  const actualOtherDeductionsAnnual = otherDeductionsMonthly * 12;

  const totalDeductionsMonthly = actualEmployeePFMonthly + actualPTMonthly + actualTDSMonthly + insuranceDeductionMonthly + otherDeductionsMonthly;
  const totalDeductionsAnnual = actualEmployeePFAnnual + actualPTAnnual + annualTaxDeducted + actualInsuranceAnnual + actualOtherDeductionsAnnual;

  // Net Take-Home (In-Hand Pay)
  const takeHomeAnnual = Math.max(0, grossSalaryAnnual - totalDeductionsAnnual);
  const takeHomeMonthly = takeHomeAnnual / 12;

  const takeHomePercentage = annualCTC > 0 ? round2((takeHomeAnnual / annualCTC) * 100) : 0;
  const deductionPercentage = annualCTC > 0 ? round2((totalDeductionsAnnual / annualCTC) * 100) : 0;

  // Breakdown items for transparency ledger
  const breakdown: SalaryBreakdownItem[] = [
    {
      component: 'Basic Salary',
      category: 'earning',
      monthly: round2(monthlyBasic),
      annual: round2(annualBasic),
      percentOfCTC: round2((annualBasic / (annualCTC || 1)) * 100),
    },
    {
      component: 'House Rent Allowance (HRA)',
      category: 'earning',
      monthly: round2(monthlyHRA),
      annual: round2(annualHRA),
      percentOfCTC: round2((annualHRA / (annualCTC || 1)) * 100),
    },
    {
      component: 'Special & Other Allowances',
      category: 'earning',
      monthly: round2(monthlySpecialAllowance),
      annual: round2(residualEarningAnnual),
      percentOfCTC: round2((residualEarningAnnual / (annualCTC || 1)) * 100),
    },
    ...(bonusAnnual > 0 ? [{
      component: 'Annual Performance Bonus',
      category: 'earning' as const,
      monthly: round2(bonusAnnual / 12),
      annual: round2(bonusAnnual),
      percentOfCTC: round2((bonusAnnual / (annualCTC || 1)) * 100),
    }] : []),
    {
      component: 'Employer PF Contribution (Part of CTC)',
      category: 'benefit',
      monthly: round2(actualEmployerPFMonthly),
      annual: round2(actualEmployerPFAnnual),
      percentOfCTC: round2((actualEmployerPFAnnual / (annualCTC || 1)) * 100),
    },
    {
      component: 'Employee PF Contribution (Deduction)',
      category: 'deduction',
      monthly: round2(actualEmployeePFMonthly),
      annual: round2(actualEmployeePFAnnual),
      percentOfCTC: round2((actualEmployeePFAnnual / (annualCTC || 1)) * 100),
    },
    {
      component: 'Professional Tax (PT)',
      category: 'deduction',
      monthly: round2(actualPTMonthly),
      annual: round2(actualPTAnnual),
      percentOfCTC: round2((actualPTAnnual / (annualCTC || 1)) * 100),
    },
    ...(annualTaxDeducted > 0 ? [{
      component: 'Estimated Income Tax (TDS)',
      category: 'deduction' as const,
      monthly: round2(actualTDSMonthly),
      annual: round2(annualTaxDeducted),
      percentOfCTC: round2((annualTaxDeducted / (annualCTC || 1)) * 100),
    }] : []),
    ...(insuranceDeductionMonthly > 0 ? [{
      component: 'Group Health Insurance',
      category: 'deduction' as const,
      monthly: round2(insuranceDeductionMonthly),
      annual: round2(actualInsuranceAnnual),
      percentOfCTC: round2((actualInsuranceAnnual / (annualCTC || 1)) * 100),
    }] : []),
  ];

  return {
    annualCTC: round2(annualCTC),
    monthlyCTC: round2(monthlyCTC),
    grossSalaryAnnual: round2(grossSalaryAnnual),
    grossSalaryMonthly: round2(grossSalaryMonthly),
    totalDeductionsAnnual: round2(totalDeductionsAnnual),
    totalDeductionsMonthly: round2(totalDeductionsMonthly),
    takeHomeAnnual: round2(takeHomeAnnual),
    takeHomeMonthly: round2(takeHomeMonthly),
    takeHomePercentage,
    deductionPercentage,
    breakdown,
  };
}

// ---------------- CAPITAL GAINS TAX CALCULATOR ----------------
export function calculateCapitalGains(params: CapitalGainsParams): CapitalGainsResult {
  const {
    assetCategory,
    buyPrice,
    sellPrice,
    quantity = 1,
    holdingMonths,
    expensesOnSale = 0,
    improvementExpenses = 0,
    exemptionClaimed = 0,
  } = params;

  const totalPurchaseCost = buyPrice * quantity + improvementExpenses;
  const totalSaleProceeds = sellPrice * quantity;
  const netSaleConsideration = Math.max(0, totalSaleProceeds - expensesOnSale);
  const grossCapitalGain = netSaleConsideration - totalPurchaseCost;

  // Determine holding threshold by asset category
  let thresholdMonths = 12;
  let stcgRate = 20; // Listed equity updated STCG rate
  let ltcgRate = 12.5; // Listed equity updated LTCG rate
  let annualExemptionLimit = 0;

  switch (assetCategory) {
    case 'equity_stocks':
    case 'equity_mutual_funds':
      thresholdMonths = 12;
      stcgRate = 20;
      ltcgRate = 12.5;
      annualExemptionLimit = 125000; // Updated ₹1.25 Lakh exemption on LTCG
      break;

    case 'debt_mutual_funds':
      // Debt funds taxed at slab rate regardless of holding
      thresholdMonths = 36;
      stcgRate = 30; // representative slab rate
      ltcgRate = 30;
      annualExemptionLimit = 0;
      break;

    case 'real_estate':
      thresholdMonths = 24; // 2 years for immovable property
      stcgRate = 30; // slab rate
      ltcgRate = 12.5; // updated 12.5% without indexation
      annualExemptionLimit = 0;
      break;

    case 'crypto':
      // Flat 30% without exemption or loss set-off
      thresholdMonths = 0; // all crypto is flat 30%
      stcgRate = 30;
      ltcgRate = 30;
      annualExemptionLimit = 0;
      break;

    case 'gold_commodity':
      thresholdMonths = 24; // updated 24 months for physical gold
      stcgRate = 30;
      ltcgRate = 12.5;
      annualExemptionLimit = 0;
      break;
  }

  const isLTCG = assetCategory !== 'crypto' && holdingMonths > thresholdMonths;
  const gainType = isLTCG ? 'LTCG' : 'STCG';
  const applicableTaxRate = isLTCG ? ltcgRate : stcgRate;

  // Apply exemption (if LTCG on equity, up to 1.25L exempt; or custom exemption like Sec 54 for real estate)
  let totalExemptions = exemptionClaimed;
  if (isLTCG && annualExemptionLimit > 0 && grossCapitalGain > 0) {
    totalExemptions += Math.min(grossCapitalGain, annualExemptionLimit);
  }

  const taxableGain = Math.max(0, grossCapitalGain - totalExemptions);
  const baseTax = grossCapitalGain > 0 ? (taxableGain * applicableTaxRate) / 100 : 0;
  const cessAndSurcharge = round2(baseTax * 0.04);
  const totalTaxPayable = round2(baseTax + cessAndSurcharge);

  const netRealizedProfit = round2(grossCapitalGain - totalTaxPayable);
  const roiPercentage = totalPurchaseCost > 0 ? round2((netRealizedProfit / totalPurchaseCost) * 100) : 0;

  const holdingSummary = `${holdingMonths} month${holdingMonths !== 1 ? 's' : ''} (${(holdingMonths / 12).toFixed(1)} yrs) — ${gainType} rules apply (threshold: ${thresholdMonths} mos)`;

  return {
    assetCategory,
    totalPurchaseCost: round2(totalPurchaseCost),
    totalSaleProceeds: round2(totalSaleProceeds),
    netSaleConsideration: round2(netSaleConsideration),
    gainType,
    thresholdMonths,
    grossCapitalGain: round2(grossCapitalGain),
    applicableExemptions: round2(totalExemptions),
    taxableCapitalGain: round2(taxableGain),
    taxRatePercent: applicableTaxRate,
    estimatedTax: round2(baseTax),
    cessAndSurcharge,
    totalTaxPayable,
    netRealizedProfit,
    roiPercentage,
    holdingSummary,
  };
}

// CSV Export helpers
export function generateTaxCSV(result: IncomeTaxResult, currencySymbol = '$'): string {
  const cur = result.currentRegime;
  const headers = ['Metric', `Amount (${currencySymbol})`];
  const rows = [
    ['Regime', cur.regimeName],
    ['Gross Total Income', cur.grossIncome.toFixed(2)],
    ['Total Deductions & Exemptions', cur.totalDeductions.toFixed(2)],
    ['Net Taxable Income', cur.taxableIncome.toFixed(2)],
    ['Base Tax Payable', cur.baseTax.toFixed(2)],
    ['Section 87A Tax Rebate', cur.rebate.toFixed(2)],
    ['Health & Education Cess (4%)', cur.cess.toFixed(2)],
    ['Total Net Tax Owed', cur.totalTax.toFixed(2)],
    ['Effective Tax Rate', `${cur.effectiveRate}%`],
    ['Marginal Tax Rate', `${cur.marginalRate}%`],
    ['Annual In-Hand Net Income', cur.inHandAnnual.toFixed(2)],
    ['Monthly In-Hand Net Income', cur.inHandMonthly.toFixed(2)],
  ];
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

export function generateSalaryCSV(result: SalaryResult, currencySymbol = '$'): string {
  const headers = ['Component', 'Category', `Monthly (${currencySymbol})`, `Annual (${currencySymbol})`, '% of CTC'];
  const rows = result.breakdown.map(b => [
    `"${b.component}"`,
    b.category,
    b.monthly.toFixed(2),
    b.annual.toFixed(2),
    `${b.percentOfCTC}%`,
  ]);
  rows.push(['Take-Home Pay', 'net_in_hand', result.takeHomeMonthly.toFixed(2), result.takeHomeAnnual.toFixed(2), `${result.takeHomePercentage}%`]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

export function generateCapitalGainsCSV(result: CapitalGainsResult, currencySymbol = '$'): string {
  const headers = ['Metric', 'Value'];
  const rows = [
    ['Asset Category', result.assetCategory],
    ['Gain Classification', result.gainType],
    ['Total Acquisition Cost', result.totalPurchaseCost.toFixed(2)],
    ['Total Sale Proceeds', result.totalSaleProceeds.toFixed(2)],
    ['Net Sale Consideration', result.netSaleConsideration.toFixed(2)],
    ['Gross Capital Gain / Loss', result.grossCapitalGain.toFixed(2)],
    ['Exemptions Claimed', result.applicableExemptions.toFixed(2)],
    ['Taxable Capital Gain', result.taxableCapitalGain.toFixed(2)],
    ['Applicable Tax Rate', `${result.taxRatePercent}%`],
    ['Cess & Surcharge (4%)', result.cessAndSurcharge.toFixed(2)],
    ['Total Tax Payable', result.totalTaxPayable.toFixed(2)],
    ['Net Realized In-Pocket Profit', result.netRealizedProfit.toFixed(2)],
    ['Return on Investment (ROI)', `${result.roiPercentage}%`],
  ];
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
}

// ---------------- MULTI-YEAR TAX PROJECTION ----------------
export function calculateMultiYearTax(
  params: IncomeTaxParams,
  annualHikePercent: number,
  yearsCount = 5
): MultiYearTaxResult {
  const years: MultiYearTaxProjectionItem[] = [];
  let total5YearGross = 0;
  let total5YearNewTax = 0;
  let total5YearOldTax = 0;
  let runningCumulativeSavings = 0;

  const currentYearNum = parseInt(params.financialYear.slice(0, 4), 10) || 2025;

  for (let i = 1; i <= yearsCount; i++) {
    const hikeMultiplier = Math.pow(1 + annualHikePercent / 100, i - 1);
    const projectedGross = round2(params.grossAnnualIncome * hikeMultiplier);
    const startYr = currentYearNum + i - 1;
    const endYrShort = ((startYr + 1) % 100).toString().padStart(2, '0');
    const fyString = `${startYr}-${endYrShort}`;

    // Run tax calculation for this projected year
    const yrResult = calculateIncomeTax({
      ...params,
      financialYear: fyString,
      grossAnnualIncome: projectedGross,
    });

    const newTax = yrResult.currentRegime.regimeName.toLowerCase().includes('new')
      ? yrResult.currentRegime.totalTax
      : yrResult.alternateRegime.totalTax;

    const oldTax = yrResult.currentRegime.regimeName.toLowerCase().includes('old')
      ? yrResult.currentRegime.totalTax
      : yrResult.alternateRegime.totalTax;

    const recommended = newTax <= oldTax ? 'new' : 'old';
    const annualSavings = round2(Math.abs(oldTax - newTax));
    runningCumulativeSavings += annualSavings;

    const winningTax = Math.min(newTax, oldTax);
    const inHand = round2(projectedGross - winningTax);

    total5YearGross += projectedGross;
    total5YearNewTax += newTax;
    total5YearOldTax += oldTax;

    years.push({
      yearIndex: i,
      financialYear: fyString,
      projectedGrossSalary: projectedGross,
      newRegimeTax: round2(newTax),
      oldRegimeTax: round2(oldTax),
      recommendedRegime: recommended,
      annualSavings,
      cumulativeSavings: round2(runningCumulativeSavings),
      inHandTakeHome: inHand,
    });
  }

  return {
    annualSalaryHikePercent: annualHikePercent,
    years,
    total5YearGross: round2(total5YearGross),
    total5YearNewTax: round2(total5YearNewTax),
    total5YearOldTax: round2(total5YearOldTax),
    totalCumulativeSavings: round2(runningCumulativeSavings),
  };
}

// ---------------- FREELANCER / 44ADA & GST CALCULATOR ----------------
export function calculateFreelancerTax(params: FreelancerTaxParams): FreelancerTaxResult {
  const {
    grossReceipts,
    isProfessionEligible44ADA,
    actualBusinessExpenses = 0,
    otherIncome = 0,
    section80CDeductions = 0,
    section80DDeductions = 0,
    gstTurnoverThreshold = 2000000,
    gstRatePercent = 18,
    exportServicesZeroRated = false,
  } = params;

  // Presumptive scheme 44ADA offers 50% deemed taxable profit
  const presumptiveProfitRate = isProfessionEligible44ADA ? 50 : 0;
  let deemedTaxableProfit = 0;

  if (isProfessionEligible44ADA) {
    deemedTaxableProfit = round2(grossReceipts * 0.5);
  } else {
    deemedTaxableProfit = round2(Math.max(0, grossReceipts - actualBusinessExpenses));
  }

  const grossTotalIncome = deemedTaxableProfit + otherIncome;

  // Chapter VI-A deductions (Capped at statutory limits)
  const capped80C = Math.min(150000, Math.max(0, section80CDeductions));
  const capped80D = Math.min(50000, Math.max(0, section80DDeductions));
  const totalDeductions = round2(capped80C + capped80D);

  const netTaxableIncome = Math.max(0, grossTotalIncome - totalDeductions);

  // Progressive Tax Slabs (Simplified standard New/Presumptive schedule)
  let baseTax = 0;
  if (netTaxableIncome > 1500000) {
    baseTax = 150000 + (netTaxableIncome - 1500000) * 0.3;
  } else if (netTaxableIncome > 1200000) {
    baseTax = 90000 + (netTaxableIncome - 1200000) * 0.2;
  } else if (netTaxableIncome > 900000) {
    baseTax = 45000 + (netTaxableIncome - 900000) * 0.15;
  } else if (netTaxableIncome > 600000) {
    baseTax = 15000 + (netTaxableIncome - 600000) * 0.1;
  } else if (netTaxableIncome > 300000) {
    baseTax = (netTaxableIncome - 300000) * 0.05;
  }

  // Rebate under section 87A if taxable income <= 7,00,000
  if (netTaxableIncome <= 700000) {
    baseTax = 0;
  }

  const cess = round2(baseTax * 0.04);
  const totalTaxPayable = round2(baseTax + cess);
  const effectiveTaxRate = grossReceipts > 0 ? round2((totalTaxPayable / grossReceipts) * 100) : 0;

  // Advance Tax Installment Schedule (Statutory dates in India)
  const advanceTaxSchedule: AdvanceTaxQuarter[] = [
    {
      quarter: 'Q1 (Apr - Jun)',
      dueDate: 'June 15',
      statutoryCumulativePercent: 15,
      cumulativeTaxDue: round2(totalTaxPayable * 0.15),
      installmentDue: round2(totalTaxPayable * 0.15),
    },
    {
      quarter: 'Q2 (Jul - Sep)',
      dueDate: 'September 15',
      statutoryCumulativePercent: 45,
      cumulativeTaxDue: round2(totalTaxPayable * 0.45),
      installmentDue: round2(totalTaxPayable * 0.30),
    },
    {
      quarter: 'Q3 (Oct - Dec)',
      dueDate: 'December 15',
      statutoryCumulativePercent: 75,
      cumulativeTaxDue: round2(totalTaxPayable * 0.75),
      installmentDue: round2(totalTaxPayable * 0.30),
    },
    {
      quarter: 'Q4 (Jan - Mar)',
      dueDate: 'March 15',
      statutoryCumulativePercent: 100,
      cumulativeTaxDue: round2(totalTaxPayable),
      installmentDue: round2(totalTaxPayable * 0.25),
    },
  ];

  // GST Calculation
  const gstRegistrationRequired = grossReceipts > gstTurnoverThreshold && !exportServicesZeroRated;
  let gstLiability = 0;
  if (gstRegistrationRequired && !exportServicesZeroRated) {
    gstLiability = round2(grossReceipts * (gstRatePercent / 100));
  }

  const netInHandPostTaxAndGST = round2(grossReceipts - totalTaxPayable);

  return {
    grossReceipts: round2(grossReceipts),
    presumptiveProfitRate,
    deemedTaxableProfit,
    totalDeductions,
    netTaxableIncome: round2(netTaxableIncome),
    totalIncomeTaxLiability: round2(baseTax),
    cess,
    totalTaxPayable,
    effectiveTaxRate,
    advanceTaxSchedule,
    gstRegistrationRequired,
    gstLiability,
    netInHandPostTaxAndGST,
  };
}

// ---------------- RSU & ESOP VESTING / SALE CALCULATOR ----------------
export function calculateESOPTax(params: ESOPParams): ESOPResult {
  const {
    companyType,
    exercisePricePerUnit = 0,
    fmvAtVestingExercise,
    currentSalePrice,
    unitsToSell,
    holdingMonthsSinceExercise,
    marginalIncomeTaxSlab = 31.2,
  } = params;

  // Stage 1: Vesting / Exercise (Perquisite Tax)
  const perquisiteValuePerUnit = Math.max(0, fmvAtVestingExercise - exercisePricePerUnit);
  const totalPerquisiteValue = round2(perquisiteValuePerUnit * unitsToSell);
  const perquisiteTaxPayable = round2(totalPerquisiteValue * (marginalIncomeTaxSlab / 100));
  const netCostBasisPerUnit = fmvAtVestingExercise;

  // Stage 2: Sale Event (Capital Gains Tax)
  const totalSaleProceeds = round2(currentSalePrice * unitsToSell);
  const totalCostBasis = round2(fmvAtVestingExercise * unitsToSell);
  const grossCapitalGain = Math.max(0, totalSaleProceeds - totalCostBasis);

  // Determine holding threshold based on asset class
  // Listed domestic equity: 12 months threshold. Foreign (US RSUs) / Unlisted: 24 months threshold.
  const thresholdMonths = companyType === 'listed_domestic' ? 12 : 24;
  const capitalGainType = holdingMonthsSinceExercise >= thresholdMonths ? 'LTCG' : 'STCG';

  let applicableCapitalGainRate = 0;
  let capitalGainTaxPayable = 0;

  if (companyType === 'listed_domestic') {
    if (capitalGainType === 'STCG') {
      applicableCapitalGainRate = 20.0; // Budget 2024 STCG 20%
      capitalGainTaxPayable = round2(grossCapitalGain * 0.20 * 1.04);
    } else {
      applicableCapitalGainRate = 12.5; // Budget 2024 LTCG 12.5%
      const taxableLTCG = Math.max(0, grossCapitalGain - 125000); // 1.25L exemption
      capitalGainTaxPayable = round2(taxableLTCG * 0.125 * 1.04);
    }
  } else {
    // Foreign RSUs (Alphabet, Meta, Microsoft, Amazon) or Unlisted Startup ESOPs
    if (capitalGainType === 'STCG') {
      applicableCapitalGainRate = marginalIncomeTaxSlab; // Taxed at marginal income slab
      capitalGainTaxPayable = round2(grossCapitalGain * (marginalIncomeTaxSlab / 100));
    } else {
      applicableCapitalGainRate = 12.5; // Budget 2024 Foreign/Unlisted LTCG 12.5%
      capitalGainTaxPayable = round2(grossCapitalGain * 0.125 * 1.04);
    }
  }

  const totalCombinedTax = round2(perquisiteTaxPayable + capitalGainTaxPayable);
  const netPostTaxWealth = round2(totalSaleProceeds - totalCombinedTax);
  const effectiveTotalTaxRate =
    totalSaleProceeds > 0 ? round2((totalCombinedTax / totalSaleProceeds) * 100) : 0;

  return {
    perquisiteValuePerUnit: round2(perquisiteValuePerUnit),
    totalPerquisiteValue,
    perquisiteTaxPayable,
    netCostBasisPerUnit: round2(netCostBasisPerUnit),
    totalSaleProceeds,
    totalCostBasis,
    capitalGainType,
    applicableCapitalGainRate,
    capitalGainTaxPayable,
    totalCombinedTax,
    totalGrossRealization: totalSaleProceeds,
    netPostTaxWealth,
    effectiveTotalTaxRate,
  };
}
