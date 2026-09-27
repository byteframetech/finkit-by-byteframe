export type CalculatorType = 
  | 'loan' 
  | 'debt_consolidation'
  | 'sip' 
  | 'goal_sip'
  | 'swp' 
  | 'fv' 
  | 'pv' 
  | 'income_tax' 
  | 'salary' 
  | 'freelancer_tax'
  | 'capital_gains'
  | 'esop_rsu';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'INR' | 'AUD';


export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  name: string;
}

// ---------------- LOAN TYPES ----------------
export interface LoanParams {
  principal: number;
  annualInterestRate: number;
  years: number;
  months: number;
  startMonth: number; // 0-11
  startYear: number;
  extraMonthlyPayment: number;
  lumpSumPayment: number;
  lumpSumMonth: number;
}

export interface ScheduleItem {
  month: number;
  dateString: string;
  yearNumber: number;
  monthInYear: number;
  regularPayment: number;
  extraPayment: number;
  totalPayment: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface YearlySummary {
  yearNumber: number;
  calendarYear: number;
  startBalance: number;
  endBalance: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
}

export interface CalculationResult {
  monthlyPayment: number;
  totalMonths: number;
  totalRepayment: number;
  totalInterest: number;
  schedule: ScheduleItem[];
  yearlySummary: YearlySummary[];
  payoffDate: string;
  interestPercentage: number;
  principalPercentage: number;
  savingsWithExtra?: {
    baselineTotalInterest: number;
    baselineMonths: number;
    interestSaved: number;
    monthsSaved: number;
    baselineMonthlyPayment: number;
  };
}

export interface PresetLoan {
  id: string;
  name: string;
  type: string;
  principal: number;
  annualInterestRate: number;
  years: number;
  months: number;
  description: string;
}

// ---------------- SIP TYPES ----------------
export interface SIPParams {
  monthlyInvestment: number;
  annualExpectedReturn: number;
  timePeriodYears: number;
  annualStepUpPercent: number; // e.g. 10% annual increase in SIP
}

export interface SIPYearlyItem {
  year: number;
  monthlyDeposit: number;
  annualDeposit: number;
  totalInvested: number;
  interestEarnedYear: number;
  totalWealthGain: number;
  endBalance: number;
}

export interface SIPResult {
  totalInvested: number;
  estimatedReturns: number;
  totalMaturityValue: number;
  investedPercentage: number;
  returnsPercentage: number;
  wealthMultiplier: number;
  yearlySchedule: SIPYearlyItem[];
}

// ---------------- SWP TYPES ----------------
export interface SWPParams {
  initialCorpus: number;
  monthlyWithdrawal: number;
  annualExpectedReturn: number;
  timePeriodYears: number;
  annualWithdrawalStepUp: number; // % increase in withdrawal per year for inflation
}

export interface SWPYearlyItem {
  year: number;
  startBalance: number;
  annualWithdrawal: number;
  annualGrowth: number;
  endBalance: number;
  cumulativeWithdrawn: number;
  cumulativeGrowth: number;
}

export interface SWPResult {
  initialCorpus: number;
  totalWithdrawn: number;
  finalCorpus: number;
  totalGrowthEarned: number;
  isDepleted: boolean;
  depletedMonth?: number;
  depletedYear?: number;
  yearlySchedule: SWPYearlyItem[];
}

// ---------------- FUTURE VALUE (FV) TYPES ----------------
export type CompoundingFrequency = 'annually' | 'semi-annually' | 'quarterly' | 'monthly' | 'daily';

export interface FVParams {
  presentValue: number; // initial lump sum
  periodicPayment: number; // recurring contribution
  paymentTiming: 'end' | 'beginning'; // ordinary annuity vs annuity due
  paymentFrequency: 'monthly' | 'annually';
  annualInterestRate: number;
  years: number;
  compoundingFrequency: CompoundingFrequency;
}

export interface FVYearlyItem {
  year: number;
  startingBalance: number;
  contributions: number;
  interestEarned: number;
  endingBalance: number;
  cumulativeContributions: number;
  cumulativeInterest: number;
}

export interface FVResult {
  futureValue: number;
  initialDeposit: number;
  totalContributions: number;
  totalInterestEarned: number;
  interestRatio: number;
  yearlySchedule: FVYearlyItem[];
}

// ---------------- PRESENT VALUE (PV) TYPES ----------------
export interface PVParams {
  futureValue: number;
  annualDiscountRate: number;
  years: number;
  compoundingFrequency: CompoundingFrequency;
  annualInflationRate: number; // for purchasing power calculation
}

export interface PVYearlyItem {
  year: number;
  discountedValue: number;
  nominalDiscount: number;
  realPurchasingPower: number;
}

export interface PVResult {
  presentValue: number;
  futureValue: number;
  totalDiscount: number;
  discountPercentage: number;
  purchasingPowerLoss: number;
  realPresentValue: number;
  yearlySchedule: PVYearlyItem[];
}

// ---------------- INCOME TAX TYPES ----------------
export type TaxRegime = 'new' | 'old';

export interface TaxBracket {
  from: number;
  to: number | null;
  rate: number;
  taxableInBracket: number;
  taxAmount: number;
}

export interface IncomeTaxParams {
  regime: TaxRegime;
  financialYear: string;
  grossAnnualIncome: number;
  otherIncome: number;
  standardDeduction: number;
  section80C: number; // PPF, EPF, ELSS, Life Insurance (up to 150,000)
  section80D: number; // Health Insurance (up to 50,000)
  hraDeduction: number; // House Rent Allowance
  homeLoanInterest: number; // Sec 24(b) (up to 200,000)
  npsSection80CCD: number; // NPS additional (up to 50,000)
  otherDeductions: number;
}

export interface RegimeTaxBreakdown {
  regimeName: string;
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  baseTax: number;
  rebate: number;
  netTaxBeforeCess: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  monthlyTax: number;
  inHandAnnual: number;
  inHandMonthly: number;
  brackets: TaxBracket[];
}

export interface IncomeTaxResult {
  currentRegime: RegimeTaxBreakdown;
  alternateRegime: RegimeTaxBreakdown;
  recommendedRegime: TaxRegime;
  taxSavingsWithRecommendation: number;
}

// ---------------- SALARY / CTC TYPES ----------------
export interface SalaryParams {
  annualCTC: number;
  bonusAnnual: number;
  employerPFMonthly: number;
  employeePFMonthly: number;
  professionalTaxMonthly: number;
  annualTaxDeducted: number; // TDS
  insuranceDeductionMonthly: number;
  otherDeductionsMonthly: number;
  customBasicPercent: number; // usually 40-50%
  customHRAPercent: number; // usually 40-50% of Basic
}

export interface SalaryBreakdownItem {
  component: string;
  category: 'earning' | 'deduction' | 'benefit';
  monthly: number;
  annual: number;
  percentOfCTC: number;
}

export interface SalaryResult {
  annualCTC: number;
  monthlyCTC: number;
  grossSalaryAnnual: number;
  grossSalaryMonthly: number;
  totalDeductionsAnnual: number;
  totalDeductionsMonthly: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  takeHomePercentage: number;
  deductionPercentage: number;
  breakdown: SalaryBreakdownItem[];
}

// ---------------- CAPITAL GAINS TAX TYPES ----------------
export type AssetCategory = 
  | 'equity_stocks' 
  | 'equity_mutual_funds' 
  | 'debt_mutual_funds' 
  | 'real_estate' 
  | 'crypto' 
  | 'gold_commodity';

export interface CapitalGainsParams {
  assetCategory: AssetCategory;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  holdingMonths: number;
  expensesOnSale: number; // brokerage, legal, commission
  improvementExpenses: number; // for real estate
  exemptionClaimed: number; // e.g. 54/54F or annual exemption
}

export interface CapitalGainsResult {
  assetCategory: AssetCategory;
  totalPurchaseCost: number;
  totalSaleProceeds: number;
  netSaleConsideration: number;
  gainType: 'STCG' | 'LTCG'; // Short-Term vs Long-Term
  thresholdMonths: number;
  grossCapitalGain: number;
  applicableExemptions: number;
  taxableCapitalGain: number;
  taxRatePercent: number;
  estimatedTax: number;
  cessAndSurcharge: number;
  totalTaxPayable: number;
  netRealizedProfit: number;
  roiPercentage: number;
  holdingSummary: string;
}

// ---------------- DEBT CONSOLIDATION TYPES ----------------
export interface DebtItem {
  id: string;
  name: string;
  category: 'credit_card' | 'personal_loan' | 'auto_loan' | 'student_loan' | 'medical' | 'other';
  currentBalance: number;
  annualInterestRate: number;
  monthlyPayment: number;
}

export interface DebtConsolidationParams {
  debts: DebtItem[];
  consolidationRate: number;
  consolidationYears: number;
  processingFeePercent: number;
}

export interface DebtConsolidationResult {
  totalCurrentBalance: number;
  totalCurrentMonthlyPayment: number;
  totalCurrentInterestRemaining: number;
  weightedAverageCurrentRate: number;
  newLoanPrincipal: number;
  newMonthlyPayment: number;
  newTotalInterest: number;
  newTotalRepayment: number;
  monthlySavings: number;
  lifetimeInterestSavings: number;
  netFinancialBenefit: number;
  breakEvenMonths: number;
  debts: (DebtItem & { currentPayoffMonths: number; currentTotalInterest: number })[];
}

// ---------------- RATE SHOCK & BI-WEEKLY TYPES ----------------
export interface RateShockParams {
  shockMonth: number;
  rateHikePercent: number;
  adjustmentMode: 'increase_emi' | 'extend_tenure';
}

export interface RateShockResult {
  baselineRate: number;
  newRate: number;
  shockMonth: number;
  baselineEMI: number;
  newEMI: number;
  monthlyEMIDifference: number;
  baselinePayoffMonths: number;
  newPayoffMonths: number;
  tenureExtensionMonths: number;
  baselineTotalInterest: number;
  newTotalInterest: number;
  extraInterestPaid: number;
}

export interface BiWeeklyResult {
  monthlyPayment: number;
  biWeeklyPayment: number;
  payoffMonthsMonthly: number;
  payoffMonthsBiWeekly: number;
  monthsSaved: number;
  totalInterestMonthly: number;
  totalInterestBiWeekly: number;
  interestSaved: number;
}

// ---------------- GOAL-BASED REVERSE SIP TYPES ----------------
export type FinancialGoalType = 
  | 'education' 
  | 'home_purchase' 
  | 'retirement' 
  | 'wealth_target' 
  | 'vacation' 
  | 'wedding' 
  | 'custom';

export interface GoalParams {
  goalName: string;
  goalType: FinancialGoalType;
  targetCorpus: number;
  targetYears: number;
  expectedAnnualReturn: number;
  annualStepUpPercent: number;
  existingSavings: number;
}

export interface GoalYearlyItem {
  year: number;
  monthlyContribution: number;
  annualDeposit: number;
  cumulativeDeposited: number;
  growthEarned: number;
  portfolioValue: number;
  targetProgressPercent: number;
}

export interface GoalResult {
  requiredMonthlySIP: number;
  startingMonthlySIP: number;
  totalDeposited: number;
  totalGrowthEarned: number;
  futureTargetValuation: number;
  annualStepUp: number;
  yearlyProgress: GoalYearlyItem[];
}

// ---------------- MONTE CARLO SWP TYPES ----------------
export interface MonteCarloYearPath {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface MonteCarloResult {
  iterations: number;
  successProbability: number;
  depletionRiskPercent: number;
  medianEndingCorpus: number;
  worstCaseEndingCorpus: number;
  bestCaseEndingCorpus: number;
  paths: MonteCarloYearPath[];
}

// ---------------- INFLATION BASKET TYPES ----------------
export interface InflationSubIndex {
  id: string;
  name: string;
  weightPercent: number;
  inflationRate: number;
  description: string;
}

export interface InflationBasketResult {
  blendedPersonalInflationRate: number;
  officialCPIRate: number;
  differentialRate: number;
  projectedCostMultiplier10Y: number;
  projectedCostMultiplier20Y: number;
  subIndices: InflationSubIndex[];
}

// ---------------- MULTI-YEAR TAX PROJECTION TYPES ----------------
export interface MultiYearTaxProjectionItem {
  yearIndex: number;
  financialYear: string;
  projectedGrossSalary: number;
  newRegimeTax: number;
  oldRegimeTax: number;
  recommendedRegime: 'new' | 'old';
  annualSavings: number;
  cumulativeSavings: number;
  inHandTakeHome: number;
}

export interface MultiYearTaxResult {
  annualSalaryHikePercent: number;
  years: MultiYearTaxProjectionItem[];
  total5YearGross: number;
  total5YearNewTax: number;
  total5YearOldTax: number;
  totalCumulativeSavings: number;
}

// ---------------- FREELANCER & SECTION 44ADA / GST TYPES ----------------
export interface FreelancerTaxParams {
  grossReceipts: number;
  isProfessionEligible44ADA: boolean;
  actualBusinessExpenses: number;
  otherIncome: number;
  section80CDeductions: number;
  section80DDeductions: number;
  regime: TaxRegime;
  gstTurnoverThreshold: number;
  gstRatePercent: number;
  exportServicesZeroRated: boolean;
}

export interface AdvanceTaxQuarter {
  quarter: string;
  dueDate: string;
  statutoryCumulativePercent: number;
  cumulativeTaxDue: number;
  installmentDue: number;
}

export interface FreelancerTaxResult {
  grossReceipts: number;
  presumptiveProfitRate: number;
  deemedTaxableProfit: number;
  totalDeductions: number;
  netTaxableIncome: number;
  totalIncomeTaxLiability: number;
  cess: number;
  totalTaxPayable: number;
  effectiveTaxRate: number;
  advanceTaxSchedule: AdvanceTaxQuarter[];
  gstRegistrationRequired: boolean;
  gstLiability: number;
  netInHandPostTaxAndGST: number;
}

// ---------------- RSU & ESOP VESTING TAX TYPES ----------------
export interface ESOPParams {
  planType: 'RSU' | 'ESOP';
  companyType: 'listed_domestic' | 'listed_foreign' | 'unlisted_startup';
  totalUnitsGranted: number;
  exercisePricePerUnit: number;
  fmvAtVestingExercise: number;
  currentSalePrice: number;
  unitsToSell: number;
  holdingMonthsSinceExercise: number;
  marginalIncomeTaxSlab: number;
}

export interface ESOPResult {
  perquisiteValuePerUnit: number;
  totalPerquisiteValue: number;
  perquisiteTaxPayable: number;
  netCostBasisPerUnit: number;
  totalSaleProceeds: number;
  totalCostBasis: number;
  capitalGainType: 'STCG' | 'LTCG';
  applicableCapitalGainRate: number;
  capitalGainTaxPayable: number;
  totalCombinedTax: number;
  totalGrossRealization: number;
  netPostTaxWealth: number;
  effectiveTotalTaxRate: number;
}

