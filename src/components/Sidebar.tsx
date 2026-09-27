import React from 'react';
import { CalculatorType, CurrencyCode } from '../types';
import { CURRENCIES } from '../data/presets';
import {
  Calculator,
  TrendingUp,
  ArrowDownCircle,
  Sparkles,
  History,
  Receipt,
  Briefcase,
  BadgePercent,
  X,
  Printer,
  FileText,
  CreditCard,
  Target,
  Award,
  Scale
} from 'lucide-react';

interface SidebarProps {
  activeCalculator: CalculatorType;
  onSelectCalculator: (type: CalculatorType) => void;
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDownloadDocx?: () => void;
}

interface NavItem {
  id: CalculatorType;
  label: string;
  badge?: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeCalculator,
  onSelectCalculator,
  currency,
  onCurrencyChange,
  isOpen,
  onClose,
  onPrint,
  onDownloadDocx,
}) => {
  const sections: NavSection[] = [
    {
      title: 'Lending & Debt',
      items: [
        {
          id: 'loan',
          label: 'Loan Amortization',
          icon: <Calculator className="w-4 h-4" />,
        },
        {
          id: 'debt_consolidation',
          label: 'Debt Consolidation',
          icon: <CreditCard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Wealth & Investments',
      items: [
        {
          id: 'sip',
          label: 'SIP Calculator',
          icon: <TrendingUp className="w-4 h-4" />,
        },
        {
          id: 'goal_sip',
          label: 'Goal-Based Planner',
          icon: <Target className="w-4 h-4" />,
        },
        {
          id: 'swp',
          label: 'SWP & Monte Carlo',
          icon: <ArrowDownCircle className="w-4 h-4" />,
        },
        {
          id: 'fv',
          label: 'Future Value (FV)',
          icon: <Sparkles className="w-4 h-4" />,
        },
        {
          id: 'pv',
          label: 'Present Value & Basket',
          icon: <History className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Taxation & Payroll',
      items: [
        {
          id: 'income_tax',
          label: 'Income Tax & Horizon',
          icon: <Receipt className="w-4 h-4" />,
        },
        {
          id: 'salary',
          label: 'Salary Take-Home (CTC)',
          icon: <Briefcase className="w-4 h-4" />,
        },
        {
          id: 'freelancer_tax',
          label: 'Freelancer / 44ADA & GST',
          icon: <Scale className="w-4 h-4" />,
        },
        {
          id: 'capital_gains',
          label: 'Capital Gains Tax',
          icon: <BadgePercent className="w-4 h-4" />,
        },
        {
          id: 'esop_rsu',
          label: 'RSU & ESOP Vesting Tax',
          icon: <Award className="w-4 h-4" />,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 print:hidden no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Lockup */}
        <div className="h-14 px-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40 text-white font-bold text-xs tracking-wider">
              FK
            </div>
            <div>
              <div className="text-sm font-bold tracking-tight text-white leading-tight">
                FinKit
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                by Byteframe
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5 select-none">
          {sections.map((sec) => (
            <div key={sec.title}>
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                {sec.title}
              </div>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = activeCalculator === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectCalculator(item.id);
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-xs'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <span className={isActive ? 'text-emerald-400' : 'text-slate-500'}>
                        {item.icon}
                      </span>
                      <span className="truncate flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: Currency Selector & Actions */}
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-slate-950 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="text-[11px] font-medium text-slate-400">Currency</span>
            <select
              value={currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Select currency"
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono cursor-pointer"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {onDownloadDocx && (
              <button
                onClick={onDownloadDocx}
                title="Download Feature Documentation (Word .docx)"
                className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-emerald-400 hover:text-emerald-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word Doc</span>
              </button>
            )}

            <button
              onClick={onPrint}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                !onDownloadDocx ? 'col-span-2' : ''
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print Report</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <span className="text-[10px] text-slate-500 font-mono tracking-tight">FinKit · by Byteframe</span>
          </div>
        </div>
      </aside>
    </>
  );
};
