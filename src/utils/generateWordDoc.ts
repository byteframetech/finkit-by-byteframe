import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  Packer,
} from 'docx';

// Design Palette Constants for FinKit by Byteframe
const COLOR_PRIMARY = '0F172A'; // Slate 900
const COLOR_ACCENT = '059669'; // Emerald 600
const COLOR_ACCENT_LIGHT = 'ECFDF5'; // Emerald 50
const COLOR_MUTED = '64748B'; // Slate 500
const COLOR_DARK = '1E293B'; // Slate 800
const COLOR_LIGHT_BG = 'F8FAFC'; // Slate 50
const COLOR_BORDER = 'CBD5E1'; // Slate 300
const COLOR_WHITE = 'FFFFFF';

const tableBorder = {
  style: BorderStyle.SINGLE,
  size: 1,
  color: COLOR_BORDER,
};

const cellBorders = {
  top: tableBorder,
  bottom: tableBorder,
  left: tableBorder,
  right: tableBorder,
};

const noBorder = {
  style: BorderStyle.NONE,
  size: 0,
  color: 'auto',
};

const noBorders = {
  top: noBorder,
  bottom: noBorder,
  left: noBorder,
  right: noBorder,
};

/**
 * Creates styled heading 1
 */
function createHeading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32, // 16pt
        color: COLOR_PRIMARY,
        font: 'Segoe UI',
      }),
    ],
  });
}

/**
 * Creates styled heading 2
 */
function createHeading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_ACCENT,
        font: 'Segoe UI',
      }),
    ],
  });
}

/**
 * Creates styled heading 3
 */
function createHeading3(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_DARK,
        font: 'Segoe UI',
      }),
    ],
  });
}

/**
 * Creates body paragraph
 */
function createBodyParagraph(text: string, options: { boldPrefix?: string; italic?: boolean } = {}): Paragraph {
  const children: TextRun[] = [];
  if (options.boldPrefix) {
    children.push(
      new TextRun({
        text: options.boldPrefix + ' ',
        bold: true,
        color: COLOR_DARK,
        size: 21,
        font: 'Segoe UI',
      })
    );
  }
  children.push(
    new TextRun({
      text,
      italics: options.italic,
      color: COLOR_DARK,
      size: 21,
      font: 'Segoe UI',
    })
  );

  return new Paragraph({
    spacing: { after: 120, line: 280 },
    children,
  });
}

/**
 * Creates bullet item
 */
function createBulletItem(boldText: string, normalText: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80, line: 260 },
    children: [
      new TextRun({
        text: boldText + ': ',
        bold: true,
        color: COLOR_DARK,
        size: 21,
        font: 'Segoe UI',
      }),
      new TextRun({
        text: normalText,
        color: COLOR_DARK,
        size: 21,
        font: 'Segoe UI',
      }),
    ],
  });
}

/**
 * Creates callout box with light background
 */
function createCalloutBox(title: string, content: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: noBorder,
      bottom: noBorder,
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_ACCENT },
      right: noBorder,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_ACCENT_LIGHT },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children: [
              new Paragraph({
                spacing: { after: 60 },
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 21,
                    color: COLOR_ACCENT,
                    font: 'Segoe UI',
                  }),
                ],
              }),
              new Paragraph({
                spacing: { after: 0, line: 260 },
                children: [
                  new TextRun({
                    text: content,
                    size: 20,
                    color: COLOR_DARK,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Creates styled feature comparison/summary table
 */
function createSummaryTable(headers: string[], rows: string[][], colWidthsPercent: number[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: cellBorders,
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: headers.map((headerText, idx) => (
          new TableCell({
            width: { size: colWidthsPercent[idx], type: WidthType.PERCENTAGE },
            shading: { fill: COLOR_PRIMARY },
            margins: { top: 100, bottom: 100, left: 120, right: 120 },
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                children: [
                  new TextRun({
                    text: headerText,
                    bold: true,
                    color: COLOR_WHITE,
                    size: 19,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          })
        )),
      }),
      // Data rows
      ...rows.map((row, rIdx) => (
        new TableRow({
          children: row.map((cellText, cIdx) => (
            new TableCell({
              width: { size: colWidthsPercent[cIdx], type: WidthType.PERCENTAGE },
              shading: { fill: rIdx % 2 === 1 ? COLOR_LIGHT_BG : COLOR_WHITE },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      size: 19,
                      color: COLOR_DARK,
                      font: 'Segoe UI',
                    }),
                  ],
                }),
              ],
            })
          )),
        })
      )),
    ],
  });
}

/**
 * Builds the complete FinKit by Byteframe Word Document
 */
export function buildFinKitDocumentation(): Document {
  return new Document({
    creator: 'Byteframe Technologies',
    title: 'FinKit by Byteframe - Feature Documentation',
    description: 'Executive & Technical Feature Documentation for FinKit financial intelligence suite',
    styles: {
      default: {
        document: {
          run: {
            font: 'Segoe UI',
            size: 21,
            color: COLOR_DARK,
          },
          paragraph: {
            spacing: { line: 280, after: 120 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'FinKit by Byteframe  |  Feature Documentation',
                    size: 17,
                    color: COLOR_MUTED,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Confidential & Proprietary  •  Byteframe Technologies  •  Page ',
                    size: 17,
                    color: COLOR_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 17,
                    color: COLOR_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    text: ' of ',
                    size: 17,
                    color: COLOR_MUTED,
                    font: 'Segoe UI',
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 17,
                    color: COLOR_MUTED,
                    font: 'Segoe UI',
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Document Header / Cover Banner
          new Paragraph({
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: 'FINKIT BY BYTEFRAME',
                bold: true,
                size: 40, // 20pt
                color: COLOR_ACCENT,
                font: 'Segoe UI',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'Comprehensive Application Feature & Architecture Documentation',
                bold: true,
                size: 26, // 13pt
                color: COLOR_PRIMARY,
                font: 'Segoe UI',
              }),
            ],
          }),

          // Metadata Table
          createSummaryTable(
            ['Document Property', 'Details'],
            [
              ['Application Name', 'FinKit by Byteframe'],
              ['Product Release', 'Version 1.0 (Production Master)'],
              ['Publishing Organization', 'Byteframe Technologies'],
              ['Target Ecosystem', 'Retail Finance, Wealth Advisors, Accountants & Borrowers'],
              ['Architecture Style', 'Zero-Latency Client-Side Financial Engineering Engine'],
              ['Supported Currencies', 'INR (₹), USD ($), EUR (€), GBP (£), CAD (C$), AUD (A$)'],
              ['Document Scope', 'End-to-End Functional Breakdown of all 12 Analytical Engines & Simulators'],
            ],
            [35, 65]
          ),

          new Paragraph({ spacing: { after: 200 } }),

          // 1. Executive Summary
          createHeading1('1. Executive Summary & Product Vision'),
          createBodyParagraph(
            'FinKit by Byteframe is an enterprise-grade financial calculation, loan amortization, wealth accumulation, and taxation intelligence application. Designed for modern borrowers, investors, financial planners, and accounting professionals, FinKit replaces fragmented spreadsheets and ad-hoc calculators with a unified, high-precision, interactive workspace.'
          ),
          createBodyParagraph(
            'The platform delivers instant mathematical clarity across personal debt optimization, accelerated loan payoff simulation, systematic wealth compounding, retirement corpus drawdown sustainability, time-value-of-money discounting, dual-regime income tax optimization, take-home CTC structuring, and asset-specific capital gains taxation.'
          ),

          createCalloutBox(
            'Core Value Proposition',
            'FinKit empowers users to execute complex financial modeling without friction. By pairing bank-accurate mathematical precision with real-time reactive visualization, users uncover actionable insights such as exact prepayment interest savings, breakeven loan refinance thresholds, and optimal tax regime choices.'
          ),

          new Paragraph({ spacing: { after: 160 } }),

          // 2. Core Architecture & Privacy Principles
          createHeading1('2. System Architecture & Privacy-First Security'),
          createBodyParagraph(
            'FinKit is built with a modern web architecture focusing on speed, responsiveness, and zero data leakage:'
          ),
          createBulletItem(
            '100% Client-Side Computation',
            'All financial computations, amortization recursive algorithms, and tax simulations run entirely in the user’s browser memory. Sensitive personal financial data, salary figures, and loan balances never leave the client device.'
          ),
          createBulletItem(
            'Sub-Millisecond Reactivity',
            'State updates propagate instantaneously using optimized React 19 memoization and hooks. Modifying a loan slider immediately recalculates all metrics, redraws SVG amortization curves, and recalculates monthly schedules with zero perceptible lag.'
          ),
          createBulletItem(
            'Multi-Currency Engine',
            'Full runtime localization supporting Indian Rupee (₹), US Dollar ($), Euro (€), British Pound (£), Canadian Dollar (C$), and Australian Dollar (A$) with regional digit grouping (including Indian Lakhs/Crores notation).'
          ),
          createBulletItem(
            'Universal Export & Print Pipeline',
            'Built-in support for instant RFC-4180 CSV generation of comprehensive monthly amortization schedules and executive PDF/print-ready summary reports.'
          ),

          new Paragraph({ spacing: { after: 160 } }),

          // 3. Functional Modules Breakdown
          createHeading1('3. Comprehensive Module-by-Module Feature Breakdown'),
          createBodyParagraph(
            'The application is organized into three distinct financial pillars housing twelve dedicated computational engines and advanced stress-testing simulators:'
          ),

          // Pillar A: Lending & Debt
          createHeading2('Pillar A: Lending & Debt Analytics'),

          createHeading3('Module 1: Loan Amortization & Accelerated Payoff Engine'),
          createBodyParagraph(
            'The Loan Amortization engine is a comprehensive debt modeling system designed to calculate standard reducing balance loans and simulate accelerated payoff strategies.'
          ),
          createBulletItem(
            'Core Loan Parameters',
            'Supports customizable Principal Amount, Annual Nominal Interest Rate (with 0.01% precision), Loan Tenure in both Years and Months, and Calendar Start Date.'
          ),
          createBulletItem(
            'Accelerated Prepayment Simulation',
            'Enables simultaneous modeling of ongoing monthly extra payments and a one-time lump-sum prepayment applied at any specified future loan month.'
          ),
          createBulletItem(
            'Instant Analytical KPI Cards',
            'Displays Monthly EMI, Total Repayment, Total Interest Payable, Projected Payoff Date, and exact Interest & Tenure Saved via prepayments.'
          ),
          createBulletItem(
            'Interactive Balance & Interest Curve',
            'An SVG area and line chart depicting Outstanding Principal Balance over time, alongside Cumulative Interest and Principal curves with hover tooltips.'
          ),
          createBulletItem(
            'Month-by-Month & Annual Amortization Table',
            'Full schedule listing Month Index, Calendar Date, Regular EMI, Extra Payment, Principal Component, Interest Component, and Remaining Principal Balance.'
          ),
          createBulletItem(
            'Loan Comparison & Refinance Simulator',
            'Side-by-side comparative modeling contrasting the baseline loan against a refinanced loan with automatic calculation of monthly EMI differential and net interest savings.'
          ),
          createBulletItem(
            'What-If Floating Interest Rate Hike Stress Test',
            'Simulates floating interest rate hikes (e.g. +1.0%, +2.0% mid-tenure at any future month) under two borrower adjustment strategies: (a) Increase Monthly EMI to maintain payoff tenure, or (b) Keep EMI constant and Extend Loan Tenure, calculating the exact extra interest and months added.'
          ),
          createBulletItem(
            'Bi-Weekly Payment Schedule Optimizer',
            'Models an accelerated 26 bi-weekly half-payment schedule (equivalent to 13 full monthly payments per year), quantifying substantial tenure reduction (often 3-4 years saved on a 20-year loan) and significant lifetime interest savings.'
          ),

          createHeading3('Module 2: Debt Consolidation Simulator'),
          createBodyParagraph(
            'Allows borrowers, financial advisors, and credit counselors to evaluate the financial feasibility of consolidating multiple high-interest revolving liabilities (credit cards, high-APR personal loans, auto loans) into a single streamlined term loan.'
          ),
          createBulletItem(
            'Multi-Debt Portfolio Ingestion',
            'Add, edit, and remove dynamic debt accounts specifying account name, debt category (credit card, personal loan, auto loan, etc.), outstanding balance, annual APR, and current monthly payment.'
          ),
          createBulletItem(
            'Consolidated Terms Engine',
            'Configures the target consolidation interest rate, consolidated loan tenure, and one-time upfront processing fees.'
          ),
          createBulletItem(
            'Comprehensive Financial Relief Metrics',
            'Highlights weighted average current interest rate vs. new consolidated rate, monthly cash flow savings, lifetime net interest reduction, net financial benefit after fees, and the exact break-even month.'
          ),

          new Paragraph({ spacing: { after: 140 } }),

          // Pillar B: Wealth & Investments
          createHeading2('Pillar B: Wealth Accumulation & Retirement Planning'),

          createHeading3('Module 3: Systematic Investment Plan (SIP) Calculator'),
          createBodyParagraph(
            'Designed for mutual fund investors and recurring equity allocations to project long-term wealth compounding with periodic step-ups.'
          ),
          createBulletItem(
            'Step-Up Capability',
            'Supports an optional Annual Step-Up percentage (e.g., 5% to 15%), mimicking annual salary increments and expanding annual contributions.'
          ),
          createBulletItem(
            'Wealth Multiplier Metric',
            'Calculates the compounding wealth multiplier (e.g., 3.42x), illustrating how early and steady contributions generate geometric asset expansion.'
          ),
          createBulletItem(
            'Yearly Compounding Breakdown',
            'Itemizes annual deposits, cumulative principal invested, annual growth earned, and cumulative portfolio valuation at each milestone year.'
          ),

          createHeading3('Module 4: Goal-Based Reverse SIP Engineering'),
          createBodyParagraph(
            'Reverses the traditional compounding formula. Instead of asking "What will my SIP become?", users declare target life milestones (e.g., ₹1 Crore Child Education in 10 years, ₹30 Lakh Home Down Payment in 5 years, or Custom Target), and the algorithm solves for the exact required monthly investment.'
          ),
          createBulletItem(
            'Dual Reverse-Engineering Modes',
            'Solves for required starting monthly SIP factoring in existing accumulated savings, expected annual CAGR, and anticipated annual step-up rate.'
          ),
          createBulletItem(
            'Pre-Configured Goal Archetypes',
            'Quick-start presets for Higher Education, Residential Down Payment, Early Retirement, Dream Vacation, and Wedding Celebrations.'
          ),
          createBulletItem(
            'Milestone Progress Roadmap',
            'Tabular milestone trajectory tracing cumulative principal outlays, compound growth generated, and portfolio valuation towards 100% goal achievement.'
          ),

          createHeading3('Module 5: Systematic Withdrawal Plan (SWP) with Monte Carlo Simulation'),
          createBodyParagraph(
            'Models retirement drawdowns and post-retirement income streams, assessing the longevity of accumulated wealth against inflation and market volatility.'
          ),
          createBulletItem(
            'Inflation-Adjusted Withdrawals',
            'Allows an Annual Withdrawal Step-Up percentage to preserve real purchasing power against living expense inflation.'
          ),
          createBulletItem(
            'Corpus Depletion Warning System',
            'Automatically alerts the user if monthly withdrawals outpace portfolio compounding, identifying the exact year and month the capital will be exhausted.'
          ),
          createBulletItem(
            'Probabilistic Monte Carlo Stress Test',
            'Runs 500 stochastic market path iterations using customizable annual market volatility (standard deviation 8% to 25%). Evaluates probability of portfolio survival (e.g., 94% success rate), median ending wealth, 10th percentile worst-case outcomes, and 90th percentile optimal outcomes.'
          ),

          createHeading3('Module 6: Future Value (FV) Annuity Calculator'),
          createBodyParagraph(
            'Computes the prospective value of an asset or cash stream based on compound growth and recurring periodic cash infusions.'
          ),
          createBulletItem(
            'Ordinary Annuity vs. Annuity Due',
            'Supports timing toggle between End-of-period (Ordinary Annuity) and Beginning-of-period (Annuity Due) payments.'
          ),
          createBulletItem(
            'Multiple Compounding Frequencies',
            'Enables daily, monthly, quarterly, semi-annual, and annual compounding calculations adhering to rigorous financial math standards.'
          ),

          createHeading3('Module 7: Present Value (PV) & Inflation Basket Customization'),
          createBodyParagraph(
            'Determines the current lump-sum value required to achieve a target future financial milestone, discounted at an expected hurdle rate, coupled with granular personal inflation modeling.'
          ),
          createBulletItem(
            'Real Purchasing Power Evaluation',
            'Calculates purchasing power degradation and true inflation-adjusted present value.'
          ),
          createBulletItem(
            'Customizable Inflation Basket Sub-Indices',
            'Allows investors to tweak individual inflation rates across specific categories: Healthcare & Medical Care (11.5%), Higher Education (9.5%), Housing & Utilities (7.0%), Food & Household Groceries (6.5%), and General CPI Goods (5.0%). Demonstrates how medical and tuition hyper-inflation severely erode long-term purchasing power.'
          ),

          new Paragraph({ spacing: { after: 140 } }),

          // Pillar C: Taxation & Payroll
          createHeading2('Pillar C: Taxation Engineering & Payroll Structuring'),

          createHeading3('Module 8: Income Tax Optimization Suite with Multi-Year Horizon'),
          createBodyParagraph(
            'An analytical tax computation engine comparing India’s New Tax Regime against the Old Tax Regime under recent Finance Act provisions, enhanced with multi-year career projections.'
          ),
          createBulletItem(
            'Dual-Regime Parallel Processing',
            'Computes liabilities under both regimes simultaneously, breaking down tax obligations slab-by-slab with applicable standard deductions.'
          ),
          createBulletItem(
            'Comprehensive Deductions Modeling',
            'Supports Section 80C (PPF, EPF, ELSS up to ₹1.5L), Section 80D (Health Insurance up to ₹50k), Section 24(b) (Home Loan Interest up to ₹2L), Section 80CCD(1B) (NPS additional up to ₹50k), HRA exemptions, and standard deduction.'
          ),
          createBulletItem(
            'Automated Regime Recommendation',
            'Evaluates total tax liability plus 4% Health & Education Cess, and highlights the recommended regime with the exact net cash savings.'
          ),
          createBulletItem(
            '3- to 5-Year Multi-Year Tax Horizon Projection',
            'Projects annual gross compensation growth (e.g., 8-15% annual salary hikes), modeling future tax liabilities under both regimes across a 5-year career horizon and computing cumulative multi-year tax savings.'
          ),

          createHeading3('Module 9: Salary Take-Home & CTC Deconstructor'),
          createBodyParagraph(
            'Deconstructs total Cost to Company (CTC) into monthly and annual in-hand take-home pay, statutory deductions, and tax withholdings.'
          ),
          createBulletItem(
            'Customizable Pay Structuring',
            'Configurable Basic Salary percentage, HRA allocation, Employer & Employee Provident Fund (PF), Professional Tax (PT), and TDS withholdings.'
          ),
          createBulletItem(
            'Net In-Hand Realization Ratio',
            'Displays the exact percentage of gross CTC that effectively lands in the employee’s bank account.'
          ),

          createHeading3('Module 10: Freelancer / Gig-Worker Presumptive Tax & GST Module'),
          createBodyParagraph(
            'A dedicated calculation flow for independent contractors, consultants, doctors, lawyers, and gig-economy software engineers.'
          ),
          createBulletItem(
            'Section 44ADA Presumptive Scheme',
            'Evaluates professional eligibility (turnover up to ₹75 Lakhs), allowing 50% deemed taxable profit without maintaining statutory books of accounts.'
          ),
          createBulletItem(
            'Quarterly Advance Tax Compliance Schedule',
            'Generates statutory advance tax calendar deadlines (15th June 15%, 15th Sept 45%, 15th Dec 75%, 15th March 100%) with exact installment dues to avoid Section 234B/234C interest penalties.'
          ),
          createBulletItem(
            'GST Registration & Liability Estimation',
            'Evaluates ₹20 Lakh turnover threshold for services, export service zero-rated exemptions (LUT), and 18% GST liability calculations.'
          ),

          createHeading3('Module 11: Capital Gains Tax Calculator'),
          createBodyParagraph(
            'Calculates Short-Term Capital Gains (STCG) and Long-Term Capital Gains (LTCG) across multiple asset classes with statutory holding rules.'
          ),
          createBulletItem(
            'Multi-Asset Class Support',
            'Listed Equity Stocks, Equity Mutual Funds, Debt Mutual Funds, Real Estate, Cryptocurrencies / VDAs, and Gold / Commodities.'
          ),
          createBulletItem(
            'Automatic Classification Thresholds',
            'Automatically applies 12-month, 24-month, or 36-month holding threshold rules depending on the selected asset category.'
          ),
          createBulletItem(
            'Deductions & Exemptions',
            'Accounts for transfer expenses, brokerage, real estate improvements, and statutory Section 54/54F capital gains exemptions.'
          ),

          createHeading3('Module 12: RSU & ESOP Dual-Stage Vesting & Sale Taxation'),
          createBodyParagraph(
            'A specialized equity compensation taxation engine for startup employees and corporate executives holding Restricted Stock Units (RSUs) or Employee Stock Option Plans (ESOPs).'
          ),
          createBulletItem(
            'Stage 1 (Vesting / Exercise Event)',
            'Calculates perquisite value (FMV minus Exercise Price) treated as salary income and taxed at marginal income tax slab rates.'
          ),
          createBulletItem(
            'Stage 2 (Liquidity / Sale Event)',
            'Establishes new cost basis at vesting FMV and calculates subsequent capital gains (STCG vs. LTCG) upon ultimate liquidation.'
          ),
          createBulletItem(
            'Multi-Jurisdiction Coverage',
            'Pre-configured presets for US Tech MNC Foreign RSUs (Meta, Google, Amazon, Microsoft), Domestic Listed Indian Shares, and Unlisted Indian Startups.'
          ),

          new Paragraph({ spacing: { after: 160 } }),

          // 4. Feature Summary Matrix Table
          createHeading1('4. Quick Reference Feature & Specification Matrix'),
          createBodyParagraph(
            'The following table summarizes all twelve modules, their primary financial formulations, key input parameters, and prime use cases:'
          ),

          createSummaryTable(
            ['Module', 'Core Formulation / Concept', 'Primary Inputs', 'Key Outputs & Highlights'],
            [
              [
                'Loan Amortization & Stress',
                'Reducing balance monthly compounding with discrete prepayment & rate hike shock',
                'Principal, Interest Rate, Tenure, Monthly Extra, Lump Sum, Rate Shock',
                'Monthly EMI, Total Interest, Payoff Date, Prepayment Savings, Rate Shock Stress Test, Bi-Weekly Schedule, CSV Export',
              ],
              [
                'Debt Consolidation',
                'Weighted debt portfolio refinancing and APR reduction optimization',
                'Multiple Debt Balances, Current Rates & EMIs, Consolidation Rate & Tenure',
                'Single Consolidated EMI, Monthly Cash Flow Relief, Lifetime Interest Reduction, Break-Even Horizon',
              ],
              [
                'SIP Calculator',
                'Future value of annuity with compounding step-up',
                'Monthly Investment, Annual Return %, Years, Annual Step-Up %',
                'Total Invested, Estimated Returns, Maturity Value, Wealth Multiplier, Compounding Schedule',
              ],
              [
                'Goal-Based Reverse SIP',
                'Target corpus reverse-engineering and contribution back-solving',
                'Target Corpus, Target Years, Expected CAGR, Existing Savings, Step-Up %',
                'Required Starting Monthly SIP, Milestone Trajectory Schedule, Cumulative Capital Outlay',
              ],
              [
                'SWP & Monte Carlo',
                'Recursive monthly drawdown with 500-iteration stochastic volatility modeling',
                'Initial Corpus, Monthly Withdrawal, Expected Return %, Years, Volatility %',
                'Portfolio Longevity, Depletion Year/Month Alert, Probability of Success %, P10/P50/P90 Percentiles',
              ],
              [
                'Future Value (FV)',
                'Compound interest & periodic ordinary / annuity due additions',
                'Present Value, Recurring Additions, Interest %, Frequency, Timing',
                'Target Future Value, Contribution Breakdown, Cumulative Interest Trajectory',
              ],
              [
                'Present Value & Basket',
                'Discounted cash flow discounting & weighted sub-index inflation modeling',
                'Target Sum, Discount Rate %, Years, Category Weights (Medical, Tuition, Rent)',
                'Blended Personal Inflation Rate, Nominal Present Value, Purchasing Power Degradation %',
              ],
              [
                'Income Tax & Horizon',
                'Dual-regime slab decomposition with 5-year compensation growth modeling',
                'Gross Salary, 80C, 80D, 24b, NPS, HRA, Expected Salary Hike %',
                'New vs Old Comparison, Optimal Recommendation, 5-Year Horizon Cumulative Tax Savings',
              ],
              [
                'Salary / CTC',
                'Payroll component deconstruction and statutory deduction net out',
                'Annual CTC, Annual Bonus, Basic %, HRA %, EPF, PT, Monthly TDS',
                'In-Hand Monthly Pay, In-Hand Annual Pay, Net Realization Ratio %, Itemized Payroll Breakdown',
              ],
              [
                'Freelancer / 44ADA & GST',
                'Presumptive 50% profit scheme, quarterly advance tax dates & GST evaluation',
                'Gross Receipts, 44ADA Eligibility, Actual Expenses, GST Rate & Turnover',
                'Deemed Taxable Profit, 4-Quarter Advance Tax Due Dates & Installments, GST Liability, Net Realized Cash',
              ],
              [
                'Capital Gains Tax',
                'Asset-specific holding duration classification & statutory tax brackets',
                'Asset Type, Buy Price, Sell Price, Quantity, Holding Months, Expenses, Exemptions',
                'STCG vs LTCG Classification, Tax Payable, Cess, Net Realized Profit, ROI %',
              ],
              [
                'RSU & ESOP Vesting',
                'Dual-stage perquisite salary tax at vesting + capital gain tax at liquidation',
                'Instrument, Company Type, Grant Units, FMV at Vesting, Sale Price, Slab Rate',
                'Stage 1 Perquisite Tax, Stage 2 Capital Gain Tax, Total Combined Tax, Net Realized Post-Tax Wealth',
              ],
            ],
            [18, 28, 26, 28]
          ),

          new Paragraph({ spacing: { after: 160 } }),

          // 5. Reporting, Print & Export Capabilities
          createHeading1('5. Reporting, Documentation & Data Export'),
          createBodyParagraph(
            'FinKit by Byteframe includes professional data export and executive reporting tools designed for formal client presentations and offline spreadsheet analysis:'
          ),
          createBulletItem(
            'Universal Executive Print & Save as PDF Engine',
            'Generates tailored executive-formatted summary statements across all 12 analytical modules and simulators. Features a fixed header and sticky action footer equipped with explicit "Close" and "Print / Save as PDF" buttons, keyboard Escape and backdrop dismissal, and CSS print isolation ensuring pristine PDF/paper output without UI chrome.'
          ),
          createBulletItem(
            'Full RFC-4180 CSV Schedule Export',
            'Instantly exports the complete multi-year, month-by-month loan amortization schedule into standard CSV format with UTF-8 BOM encoding for seamless import into Microsoft Excel, Google Sheets, or Apple Numbers.'
          ),
          createBulletItem(
            'Integrated Word (.docx) Documentation Generator',
            'Empowers users and administrators to generate and download this comprehensive technical and functional documentation file directly from the application interface.'
          ),
          createBulletItem(
            'Google Drive Privacy-First Cloud Sync (appDataFolder)',
            'Allows users to sign in with their personal Google accounts and synchronize calculation scenarios directly to Google Drive\'s restricted Application Data folder (scope: https://www.googleapis.com/auth/drive.appdata). Scenario snapshots are isolated from user-visible Drive folders, maintaining complete privacy while enabling effortless cross-device continuity.'
          ),

          new Paragraph({ spacing: { after: 160 } }),

          // 6. User Interface & Experience Excellence
          createHeading1('6. User Interface & Workflow Design'),
          createBulletItem(
            'Responsive Dual-Pane Workspace',
            'Desktop displays parameter controls on the left and dynamic analytics, charts, and schedules on the right. Mobile screens adapt fluidly with a slide-over navigation drawer.'
          ),
          createBulletItem(
            'Synchronized Dual Inputs',
            'Sliders and numeric inputs are tightly synchronized with real-time error guards preventing negative or unrealistic values.'
          ),
          createBulletItem(
            'Non-Intrusive Feedback System',
            'Contextual toasts confirm preset selections, reset triggers, and document export events without obstructing the calculation workspace.'
          ),

          new Paragraph({ spacing: { after: 200 } }),

          // Sign-off Box
          createCalloutBox(
            'Document Authenticity & Ownership',
            'This feature documentation reflects the exact technical implementation of FinKit by Byteframe (Version 1.0). All algorithms, UI components, and business rules documented herein are proprietary to Byteframe Technologies.'
          ),
        ],
      },
    ],
  });
}

/**
 * Generates a Blob representing the Word document for client-side download
 */
export async function generateFinKitDocxBlob(): Promise<Blob> {
  const doc = buildFinKitDocumentation();
  return await Packer.toBlob(doc);
}
