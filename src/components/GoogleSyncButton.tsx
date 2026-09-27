import React, { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { SyncStatus } from '../hooks/useGoogleDriveSync';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  LogOut,
  UploadCloud,
  DownloadCloud,
  Settings,
  ShieldCheck,
  ChevronDown,
  WifiOff,
} from 'lucide-react';

interface GoogleSyncButtonProps {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  isOnline: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSaveToCloud: () => void;
  onLoadFromCloud: () => void;
  onOpenManageModal: () => void;
}

export const GoogleSyncButton: React.FC<GoogleSyncButtonProps> = ({
  user,
  isAuthenticated,
  isLoggingIn,
  syncStatus,
  lastSyncedAt,
  lastSyncError,
  isOnline,
  onLogin,
  onLogout,
  onSaveToCloud,
  onLoadFromCloud,
  onOpenManageModal,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format relative timestamp
  const getRelativeTimeString = (date: Date | null): string => {
    if (!date) return 'Not synced yet';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // 1. Signed Out: Google Material Design Sign-In Button
  if (!isAuthenticated || !user) {
    return (
      <button
        onClick={onLogin}
        disabled={isLoggingIn || !isOnline}
        title={!isOnline ? 'Offline: Check internet connection' : 'Sign in with Google to sync scenarios to Google Drive'}
        className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-xs cursor-pointer ${
          !isOnline
            ? 'bg-slate-900 border-slate-800 text-slate-500 opacity-60 cursor-not-allowed'
            : isLoggingIn
            ? 'bg-slate-900 border-slate-700 text-slate-300'
            : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 hover:border-slate-400 active:scale-98 shadow-sm'
        }`}
      >
        {isLoggingIn ? (
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
        ) : (
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span className="font-semibold tracking-tight whitespace-nowrap">
          {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
        </span>
      </button>
    );
  }

  // 2. Signed In: Status Pill & Dropdown
  const userInitials = (user.displayName || user.email || 'U')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 text-xs text-slate-200 transition-all cursor-pointer shadow-xs"
        aria-expanded={isDropdownOpen}
        aria-label="Google Drive Sync Menu"
      >
        {/* User Avatar */}
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Google User'}
            className="w-5 h-5 rounded-full ring-1 ring-emerald-500/50 object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
            {userInitials}
          </div>
        )}

        {/* Sync Status Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] leading-tight text-left">
          {syncStatus === 'syncing' ? (
            <>
              <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin shrink-0" />
              <span className="text-cyan-300 font-medium">Syncing...</span>
            </>
          ) : !isOnline ? (
            <>
              <WifiOff className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-amber-300 font-medium">Offline</span>
            </>
          ) : syncStatus === 'error' ? (
            <>
              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="text-rose-300 font-medium">Sync error</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-300 truncate max-w-[90px]">
                {lastSyncedAt ? getRelativeTimeString(lastSyncedAt) : 'Synced'}
              </span>
            </>
          )}
        </div>

        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* User Profile Header */}
          <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-2">
            <div className="flex items-center gap-2.5">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full ring-1 ring-emerald-500/50 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                  {userInitials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate text-xs">
                  {user.displayName || 'Google Account'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Google Drive: appDataFolder (Privacy-Protected)</span>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="px-2.5 py-1.5 mb-2 rounded-lg bg-slate-800/40 text-[11px] flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Cloud Status:</span>
            <span className="font-mono font-medium flex items-center gap-1">
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  <span className="text-cyan-300">Syncing...</span>
                </>
              ) : !isOnline ? (
                <>
                  <CloudOff className="w-3 h-3 text-amber-400" />
                  <span className="text-amber-300">Offline</span>
                </>
              ) : syncStatus === 'error' ? (
                <>
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  <span className="text-rose-300">Needs Attention</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">
                    {lastSyncedAt ? `Synced ${getRelativeTimeString(lastSyncedAt)}` : 'Connected'}
                  </span>
                </>
              )}
            </span>
          </div>

          {lastSyncError && (
            <div className="mb-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-400" />
              <span className="break-words">{lastSyncError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onSaveToCloud();
              }}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="font-medium text-xs leading-none">Sync to Google Drive</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload current workspace snapshot</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onLoadFromCloud();
              }}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <p className="font-medium text-xs leading-none">Restore from Google Drive</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Load last saved scenario backup</p>
              </div>
            </button>

            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenManageModal();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 text-slate-200 hover:text-white transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <p className="font-medium text-xs leading-none">Cloud Scenario Manager</p>
                <p className="text-[10px] text-slate-400 mt-0.5">View details, export JSON, or wipe</p>
              </div>
            </button>

            <div className="pt-1 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left hover:bg-rose-500/10 text-rose-300 hover:text-rose-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-medium text-xs">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
