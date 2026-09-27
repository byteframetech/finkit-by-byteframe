import React, { useState, useMemo } from 'react';
import { ScheduleItem } from '../types';
import { formatCurrency, generateAmortizationCSV } from '../utils/loanCalculations';
import { Download, Search, Copy, Check, Filter } from 'lucide-react';

interface AmortizationTableProps {
  schedule: ScheduleItem[];
  currencySymbol: string;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  currencySymbol,
}) => {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pageSize, setPageSize] = useState<number>(12);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  // Extract unique years
  const availableYears = useMemo(() => {
    const years = Array.from(new Set(schedule.map((s) => s.yearNumber)));
    return years.sort((a, b) => a - b);
  }, [schedule]);

  // Filter schedule based on year and search
  const filteredSchedule = useMemo(() => {
    return schedule.filter((item) => {
      const matchesYear = selectedYear === 'all' || item.yearNumber === parseInt(selectedYear, 10);
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.dateString.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.month.toString() === searchQuery.trim();
      return matchesYear && matchesSearch;
    });
  }, [schedule, selectedYear, searchQuery]);

  // Pagination
  const totalPages = pageSize === 0 ? 1 : Math.max(1, Math.ceil(filteredSchedule.length / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedSchedule = useMemo(() => {
    if (pageSize === 0) return filteredSchedule;
    const start = (effectivePage - 1) * pageSize;
    return filteredSchedule.slice(start, start + pageSize);
  }, [filteredSchedule, effectivePage, pageSize]);

  // Handle CSV Download
  const handleDownloadCSV = () => {
    const csvContent = generateAmortizationCSV(schedule, currencySymbol);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `amortization_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy to clipboard
  const handleCopyClipboard = () => {
    const csv = generateAmortizationCSV(filteredSchedule, currencySymbol);
    navigator.clipboard.writeText(csv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
      {/* Top Header & Search/Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-4">
        <div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Month-by-Month Amortization Table
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete payment schedule detailing principal reduction, interest, and remaining balance
          </p>
        </div>

        {/* Filter and Download controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="all">All Years ({schedule.length} mos)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date / mo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-36 sm:w-44"
            />
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopyClipboard}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-lg transition-colors"
            title="Copy filtered rows to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download CSV button */}
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 sticky top-0 z-10 select-none">
            <tr>
              <th className="py-3 px-3.5 text-center">#</th>
              <th className="py-3 px-3.5">Payment Date</th>
              <th className="py-3 px-3.5 text-right">Payment</th>
              <th className="py-3 px-3.5 text-right">Principal</th>
              <th className="py-3 px-3.5 text-right">Interest</th>
              <th className="py-3 px-3.5 text-right">Extra Principal</th>
              <th className="py-3 px-3.5 text-right">Remaining Balance</th>
              <th className="py-3 px-3.5 text-right hidden sm:table-cell">Total Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedSchedule.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                  No amortization entries match your search criteria.
                </td>
              </tr>
            ) : (
              paginatedSchedule.map((item) => (
                <tr
                  key={item.month}
                  className="hover:bg-slate-800/50 transition-colors group"
                >
                  <td className="py-2.5 px-3.5 text-center text-slate-400 font-sans">
                    {item.month}
                  </td>
                  <td className="py-2.5 px-3.5 font-sans font-medium text-slate-200 whitespace-nowrap">
                    {item.dateString}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-white font-medium">
                    {formatCurrency(item.totalPayment, currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-emerald-400 font-medium">
                    {formatCurrency(item.principalPayment, currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-amber-400">
                    {formatCurrency(item.interestPayment, currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-cyan-400">
                    {item.extraPayment > 0 ? (
                      `+${formatCurrency(item.extraPayment, currencySymbol)}`
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-white font-semibold whitespace-nowrap">
                    {formatCurrency(item.remainingBalance, currencySymbol)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-slate-400 hidden sm:table-cell">
                    {formatCurrency(item.cumulativeInterest, currencySymbol)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>
            Showing <strong className="text-slate-200">{paginatedSchedule.length}</strong> of{' '}
            <strong className="text-slate-200">{filteredSchedule.length}</strong> months
          </span>
          <div className="flex items-center gap-1">
            <span className="text-slate-500">Rows:</span>
            {[12, 24, 60, 0].map((size) => (
              <button
                key={size}
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                  pageSize === size
                    ? 'bg-slate-800 text-emerald-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size === 0 ? 'All' : size}
              </button>
            ))}
          </div>
        </div>

        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center gap-1.5 self-end sm:self-center font-mono">
            <button
              disabled={effectivePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Prev
            </button>
            <span className="px-2 py-1 text-slate-300">
              Page {effectivePage} / {totalPages}
            </span>
            <button
              disabled={effectivePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 bg-slate-950 border border-slate-800 rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
