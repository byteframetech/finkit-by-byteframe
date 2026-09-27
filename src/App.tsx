import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { LoanParams, CurrencyCode, PresetLoan, CalculatorType } from './types';
import { PRESET_LOANS, CURRENCIES } from './data/presets';
import { calculateLoan, generateAmortizationCSV } from './utils/loanCalculations';
import { generateFinKitDocxBlob } from './utils/generateWordDoc';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LoanInputForm } from './components/LoanInputForm';
import { MetricCards } from './components/MetricCards';
import { BalanceChart } from './components/BalanceChart';
import { DonutBreakdown } from './components/DonutBreakdown';
import { AmortizationTable } from './components/AmortizationTable';
import { LoanComparison } from './components/LoanComparison';
import { PrintReportModal } from './components/PrintReportModal';
import { SIPCalculator } from './components/SIPCalculator';
import { SWPCalculator } from './components/SWPCalculator';
import { FVCalculator } from './components/FVCalculator';
import { PVCalculator } from './components/PVCalculator';
import { IncomeTaxCalculator } from './components/IncomeTaxCalculator';
import { SalaryCalculator } from './components/SalaryCalculator';
import { CapitalGainsCalculator } from './components/CapitalGainsCalculator';
import { DebtConsolidationCalculator } from './components/DebtConsolidationCalculator';
import { GoalBasedCalculator } from './components/GoalBasedCalculator';
import { FreelancerTaxCalculator } from './components/FreelancerTaxCalculator';
import { ESOPCalculator } from './components/ESOPCalculator';
import { GoogleSyncButton } from './components/GoogleSyncButton';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';
import { useGoogleDriveSync, WorkspaceStatePayload } from './hooks/useGoogleDriveSync';
import { BarChart3, TableProperties, GitCompare, CheckCircle2 } from 'lucide-react';

export default function App() {
  const currentCalDate = new Date();
  const defaultMonth = currentCalDate.getMonth();
  const defaultYear = currentCalDate.getFullYear();

  // Active top-level calculator
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('loan');

  // Mobile navigation sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Default Loan state configured in INR: ₹5,00,000 @ 10.5% for 5 years
  const [params, setParams] = useState<LoanParams>({
    principal: 500000.0,
    annualInterestRate: 10.5,
    years: 5,
    months: 0,
    startMonth: defaultMonth,
    startYear: defaultYear,
    extraMonthlyPayment: 0,
    lumpSumPayment: 0,
    lumpSumMonth: 12,
  });

  const [currentPresetId, setCurrentPresetId] = useState<string | null>('personal_5y');
  const [currency, setCurrency] = useState<CurrencyCode>('INR');
  const [activeTab, setActiveTab] = useState<'summary' | 'schedule' | 'compare'>('summary');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Apply restored payload from Google Drive or local cache to workspace
  const applyWorkspacePayload = useCallback((data: WorkspaceStatePayload) => {
    if (!data) return;
    if (data.currency && CURRENCIES.some((c) => c.code === data.currency)) {
      setCurrency(data.currency as CurrencyCode);
    }
    if (data.activeCalculator) {
      setActiveCalculator(data.activeCalculator as CalculatorType);
    }
    if (data.loanParams) {
      setParams(data.loanParams);
    }
    if (data.currentPresetId !== undefined) {
      setCurrentPresetId(data.currentPresetId);
    }
  }, []);

  // Google Drive Cloud Sync Hook with AUTOMATIC RESTORE on login
  const {
    user,
    isAuthenticated,
    isLoggingIn,
    isSaving,
    syncStatus,
    lastSyncedAt,
    lastSyncError,
    cloudFile,
    isOnline,
    login,
    logout,
    saveToCloud,
    saveCurrentWorkspace,
    loadFromCloud,
    deleteCloudBackup,
  } = useGoogleDriveSync(showToast, applyWorkspacePayload);

  // Restore cached state on initial mount if available
  useEffect(() => {
    try {
      const cached = localStorage.getItem('finkit_workspace_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        applyWorkspacePayload(parsed);
      }
    } catch (e) {
      console.warn('Failed to load local cache:', e);
    }
  }, [applyWorkspacePayload]);

  const currencyConfig = useMemo(() => {
    return CURRENCIES.find((c) => c.code === currency) || CURRENCIES[0];
  }, [currency]);

  // Current workspace snapshot payload for Google Drive
  const currentWorkspacePayload: WorkspaceStatePayload = useMemo(
    () => ({
      version: '1.0.0',
      updatedAt: new Date().toISOString(),
      appName: 'FinKit by Byteframe',
      currency,
      activeCalculator,
      loanParams: params,
      currentPresetId,
    }),
    [currency, activeCalculator, params, currentPresetId]
  );

  const handleSaveCurrentToCloud = useCallback(async () => {
    return await saveCurrentWorkspace(currentWorkspacePayload);
  }, [saveCurrentWorkspace, currentWorkspacePayload]);

  const handleRestoreFromCloud = useCallback(async () => {
    const data = await loadFromCloud();
    if (data) {
      applyWorkspacePayload(data);
      showToast('Workspace restored successfully from Google Drive!');
      return true;
    }
    return false;
  }, [loadFromCloud, applyWorkspacePayload, showToast]);

  // Real-time calculation result for loan
  const results = useMemo(() => {
    return calculateLoan(params);
  }, [params]);

  // Handle parameter updates
  const handleParamChange = useCallback((updated: Partial<LoanParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
    setCurrentPresetId(null);
  }, []);

  // Reset to original defaults
  const handleReset = useCallback(() => {
    setParams({
      principal: 500000.0,
      annualInterestRate: 10.5,
      years: 5,
      months: 0,
      startMonth: defaultMonth,
      startYear: defaultYear,
      extraMonthlyPayment: 0,
      lumpSumPayment: 0,
      lumpSumMonth: 12,
    });
    setCurrentPresetId('personal_5y');
    showToast(`Reset loan to default values (${currencyConfig.symbol}5,00,000 at 10.5% for 5 years)`);
  }, [defaultMonth, defaultYear, currencyConfig.symbol]);

  // Apply preset loan configuration
  const handleSelectPreset = useCallback((preset: PresetLoan) => {
    setParams((prev) => ({
      ...prev,
      principal: preset.principal,
      annualInterestRate: preset.annualInterestRate,
      years: preset.years,
      months: preset.months,
      extraMonthlyPayment: 0,
      lumpSumPayment: 0,
    }));
    setCurrentPresetId(preset.id);
    showToast(`Loaded ${preset.name} preset`);
  }, [showToast]);

  // Quick download schedule CSV
  const handleDownloadCSV = useCallback(() => {
    const csvContent = generateAmortizationCSV(results.schedule, currencyConfig.symbol);
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `amortization_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Amortization schedule downloaded as CSV');
  }, [results.schedule, currencyConfig.symbol]);

  // Download complete Word document feature documentation (.docx)
  const handleDownloadDocx = useCallback(async () => {
    try {
      showToast('Generating Word Document (.docx)...');
      const blob = await generateFinKitDocxBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'FinKit_by_Byteframe_Feature_Documentation.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Downloaded FinKit Feature Documentation (.docx)');
    } catch (err) {
      console.error('Docx download error, falling back to static asset', err);
      const link = document.createElement('a');
      link.href = '/FinKit_by_Byteframe_Feature_Documentation.docx';
      link.setAttribute('download', 'FinKit_by_Byteframe_Feature_Documentation.docx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Downloaded FinKit Feature Documentation (.docx)');
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Left Vertical Navigation Menu */}
      <Sidebar
        activeCalculator={activeCalculator}
        onSelectCalculator={(calc) => {
          setActiveCalculator(calc);
          showToast(`Switched to ${calc.toUpperCase()} calculator`);
        }}
        currency={currency}
        onCurrencyChange={setCurrency}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onPrint={() => {
          setIsPrintModalOpen(true);
        }}
        onDownloadDocx={handleDownloadDocx}
      />

      {/* Main Content Workspace Column (Offset by sidebar width on lg screens) */}
      <div className={`flex-1 flex flex-col min-w-0 lg:pl-64 ${isPrintModalOpen ? 'print:hidden' : ''}`}>
        {/* Top Bar for breadcrumbs, quick currency switcher, print & CSV */}
        <TopBar
          activeCalculator={activeCalculator}
          currency={currency}
          onCurrencyChange={setCurrency}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onPrint={() => {
            setIsPrintModalOpen(true);
          }}
          onDownloadCSV={activeCalculator === 'loan' ? handleDownloadCSV : undefined}
          hasCSV={activeCalculator === 'loan'}
          onDownloadDocx={handleDownloadDocx}
          onSave={handleSaveCurrentToCloud}
          isSaving={isSaving}
          syncComponent={
            <GoogleSyncButton
              user={user}
              isAuthenticated={isAuthenticated}
              isLoggingIn={isLoggingIn}
              syncStatus={syncStatus}
              lastSyncedAt={lastSyncedAt}
              lastSyncError={lastSyncError}
              isOnline={isOnline}
              onLogin={login}
              onLogout={logout}
              onSaveToCloud={handleSaveCurrentToCloud}
              onLoadFromCloud={handleRestoreFromCloud}
              onOpenManageModal={() => setIsDriveModalOpen(true)}
            />
          }
        />

        {/* Main Workspace Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
          {/* Loan Amortization View */}
          {activeCalculator === 'loan' && (
            <div className="space-y-4 sm:space-y-5">
              {/* Quick Presets Ribbon */}
              <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs overflow-x-auto">
                <span className="text-slate-400 whitespace-nowrap mr-2.5 font-medium text-[11px]">Quick Presets:</span>
                <div className="flex items-center gap-1.5">
                  {PRESET_LOANS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
                        currentPresetId === preset.id
                          ? 'bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {preset.name} ({currencyConfig.symbol}{preset.principal >= 100000 ? `${(preset.principal / 100000).toFixed(0)}L` : `${(preset.principal / 1000).toFixed(0)}k`} @ {preset.annualInterestRate}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Compact Top Hero KPI Metrics Strip */}
              <MetricCards
                results={results}
                params={params}
                currencySymbol={currencyConfig.symbol}
              />

              {/* Core Layout: Left Controls Form & Right Analytics & Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left Column: Input Form (4 columns on desktop) */}
                <div className="lg:col-span-4 sticky top-18">
                  <LoanInputForm
                    params={params}
                    onChange={handleParamChange}
                    onReset={handleReset}
                    onCalculate={() => showToast('Calculations updated!')}
                    currencySymbol={currencyConfig.symbol}
                    onSave={handleSaveCurrentToCloud}
                    isSaving={isSaving}
                  />
                </div>

                {/* Right Column: Tabbed Analytics & Data Views (8 columns on desktop) */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Tab Navigation Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                          activeTab === 'summary'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Summary & Balance Chart</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('schedule')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                          activeTab === 'schedule'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <TableProperties className="w-3.5 h-3.5" />
                        <span>Schedule</span>
                        <span className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {results.schedule.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('compare')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                          activeTab === 'compare'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5" />
                        <span>Compare / Refi</span>
                      </button>
                    </div>

                    <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-mono">Real-time</span>
                    </div>
                  </div>

                  {/* Tab 1: Summary & Balance Chart */}
                  {activeTab === 'summary' && (
                    <div className="space-y-4">
                      <BalanceChart
                        results={results}
                        params={params}
                        currencySymbol={currencyConfig.symbol}
                      />
                      <DonutBreakdown
                        results={results}
                        params={params}
                        currencySymbol={currencyConfig.symbol}
                      />
                    </div>
                  )}

                  {/* Tab 2: Month-by-Month Amortization Schedule */}
                  {activeTab === 'schedule' && (
                    <AmortizationTable
                      schedule={results.schedule}
                      currencySymbol={currencyConfig.symbol}
                    />
                  )}

                  {/* Tab 3: Loan Comparison & Refinance Simulator */}
                  {activeTab === 'compare' && (
                    <LoanComparison
                      currentParams={params}
                      currencySymbol={currencyConfig.symbol}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debt Consolidation Simulator View */}
          {activeCalculator === 'debt_consolidation' && (
            <DebtConsolidationCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* SIP Calculator View */}
          {activeCalculator === 'sip' && (
            <SIPCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Goal-Based Reverse Planner View */}
          {activeCalculator === 'goal_sip' && (
            <GoalBasedCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* SWP Calculator View */}
          {activeCalculator === 'swp' && (
            <SWPCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Future Value (FV) Calculator View */}
          {activeCalculator === 'fv' && (
            <FVCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Present Value (PV) Calculator View */}
          {activeCalculator === 'pv' && (
            <PVCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Income Tax Calculator View */}
          {activeCalculator === 'income_tax' && (
            <IncomeTaxCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Salary / CTC Calculator View */}
          {activeCalculator === 'salary' && (
            <SalaryCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Freelancer / 44ADA & GST View */}
          {activeCalculator === 'freelancer_tax' && (
            <FreelancerTaxCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* Capital Gains Tax Calculator View */}
          {activeCalculator === 'capital_gains' && (
            <CapitalGainsCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}

          {/* RSU & ESOP Vesting View */}
          {activeCalculator === 'esop_rsu' && (
            <ESOPCalculator
              currencySymbol={currencyConfig.symbol}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Printable Report Modal (Universal for All Calculators) */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeCalculator={activeCalculator}
        loanParams={params}
        loanResults={results}
        currencySymbol={currencyConfig.symbol}
      />

      {/* Google Drive Cloud Sync Manager Modal */}
      <GoogleDriveSyncModal
        isOpen={isDriveModalOpen}
        onClose={() => setIsDriveModalOpen(false)}
        user={user}
        cloudFile={cloudFile}
        lastSyncedAt={lastSyncedAt}
        isOnline={isOnline}
        currentState={currentWorkspacePayload}
        onSaveToCloud={handleSaveCurrentToCloud}
        onRestoreFromCloud={handleRestoreFromCloud}
        onDeleteCloudBackup={deleteCloudBackup}
      />
    </div>
  );
}
