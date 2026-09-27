import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { DriveFileMetadata } from '../services/driveSync';
import { WorkspaceStatePayload } from '../hooks/useGoogleDriveSync';
import {
  X,
  Cloud,
  ShieldCheck,
  Download,
  UploadCloud,
  DownloadCloud,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Calendar,
  Lock,
  HardDrive,
  RefreshCw,
  Info,
} from 'lucide-react';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  cloudFile: DriveFileMetadata | null;
  lastSyncedAt: Date | null;
  isOnline: boolean;
  currentState: WorkspaceStatePayload;
  onSaveToCloud: () => Promise<boolean>;
  onRestoreFromCloud: () => Promise<boolean>;
  onDeleteCloudBackup: () => Promise<boolean>;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  cloudFile,
  lastSyncedAt,
  isOnline,
  currentState,
  onSaveToCloud,
  onRestoreFromCloud,
  onDeleteCloudBackup,
}) => {
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: 'overwrite_cloud' | 'restore_local' | 'delete_cloud' | null;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: 'emerald' | 'amber' | 'rose';
  }>({
    type: null,
    title: '',
    message: '',
    confirmText: '',
    confirmStyle: 'emerald',
  });

  if (!isOpen) return null;

  const handleExportLocalJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentState, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `FinKit_Workspace_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmAction = async () => {
    const actionType = confirmDialog.type;
    setConfirmDialog({ type: null, title: '', message: '', confirmText: '', confirmStyle: 'emerald' });

    if (actionType === 'overwrite_cloud') {
      setActionInProgress('Saving snapshot to Google Drive...');
      try {
        await onSaveToCloud();
      } finally {
        setActionInProgress(null);
      }
    } else if (actionType === 'restore_local') {
      setActionInProgress('Restoring scenarios from Google Drive...');
      try {
        await onRestoreFromCloud();
      } finally {
        setActionInProgress(null);
      }
    } else if (actionType === 'delete_cloud') {
      setActionInProgress('Deleting cloud backup from Google Drive...');
      try {
        await onDeleteCloudBackup();
      } finally {
        setActionInProgress(null);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !actionInProgress) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="Google Drive Cloud Synchronization Manager"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                Google Drive Cloud Sync
              </h2>
              <p className="text-[11px] text-slate-400">
                Private Application Data Folder (<code className="text-emerald-400">appDataFolder</code>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={!!actionInProgress}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Privacy & Architecture Callout */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-500/20 text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Zero-Leakage Privacy Architecture</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              FinKit uses Google Drive's restricted <strong className="text-slate-200">Application Data Folder</strong> (scope: <code className="text-emerald-300">drive.appdata</code>). Scenarios are stored in an isolated, private vault accessible only by this application. Your main Google Drive folders and other files are never read or touched.
            </p>
          </div>

          {/* Account Status Card */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connected Account:</span>
              <span className="font-semibold text-white truncate max-w-[200px]">
                {user?.email || 'Not connected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Network State:</span>
              <span className={`font-mono font-medium flex items-center gap-1 ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isOnline ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </>
                ) : (
                  'Offline'
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Last Synced:</span>
              <span className="font-mono text-slate-200">
                {lastSyncedAt ? lastSyncedAt.toLocaleString() : 'Never'}
              </span>
            </div>
          </div>

          {/* Cloud Snapshot Info */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cloud File Snapshot Status</span>
              </h3>
              {cloudFile ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Backed Up
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                  No Cloud Backup
                </span>
              )}
            </div>

            {cloudFile ? (
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>
                  File Name: <span className="font-mono text-slate-200">{cloudFile.name}</span>
                </p>
                <p>
                  File ID: <span className="font-mono text-slate-400 text-[10px]">{cloudFile.id}</span>
                </p>
                <p>
                  Modified: <span className="font-mono text-slate-200">{new Date(cloudFile.modifiedTime).toLocaleString()}</span>
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">
                You haven't saved a workspace snapshot to your Google Drive yet. Click "Save to Google Drive" below to create your initial encrypted backup.
              </p>
            )}
          </div>

          {/* Action Progress Spinner */}
          {actionInProgress && (
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-cyan-400" />
              <span>{actionInProgress}</span>
            </div>
          )}

          {/* Primary Operations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {/* Save to Cloud Button */}
            <button
              onClick={() => {
                setConfirmDialog({
                  type: 'overwrite_cloud',
                  title: cloudFile ? 'Overwrite Cloud Backup?' : 'Create Cloud Backup on Google Drive?',
                  message: cloudFile
                    ? 'This will update your private Google Drive appDataFolder backup with your currently active calculation parameters and currency settings.'
                    : 'This will create a new private scenario backup in your Google Drive appDataFolder.',
                  confirmText: 'Save to Cloud',
                  confirmStyle: 'emerald',
                });
              }}
              disabled={!isOnline || !!actionInProgress}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Save to Google Drive</span>
            </button>

            {/* Restore from Cloud Button */}
            <button
              onClick={() => {
                setConfirmDialog({
                  type: 'restore_local',
                  title: 'Restore Workspace from Google Drive?',
                  message: 'This will replace your current active calculator values and settings with the scenario last backed up to Google Drive. Any unsaved changes on your current screen will be overwritten.',
                  confirmText: 'Restore Scenarios',
                  confirmStyle: 'amber',
                });
              }}
              disabled={!isOnline || !cloudFile || !!actionInProgress}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4 text-cyan-400" />
              <span>Restore from Cloud</span>
            </button>
          </div>

          {/* Secondary Utilities */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
            <button
              onClick={handleExportLocalJSON}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1 px-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-slate-400" />
              <span>Export Offline JSON</span>
            </button>

            {cloudFile && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    type: 'delete_cloud',
                    title: 'Delete Cloud Backup from Google Drive?',
                    message: 'Are you sure you want to permanently delete your saved scenario file from your Google Drive appDataFolder? This action cannot be undone.',
                    confirmText: 'Delete Cloud Backup',
                    confirmStyle: 'rose',
                  });
                }}
                disabled={!isOnline || !!actionInProgress}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 py-1 px-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Cloud Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Sub-Dialog for User Consent on Mutating/Destructive Operations */}
        {confirmDialog.type && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 animate-in fade-in duration-150 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                confirmDialog.confirmStyle === 'rose'
                  ? 'text-rose-400'
                  : confirmDialog.confirmStyle === 'amber'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`} />
              <div>
                <h4 className="font-bold text-white text-xs">{confirmDialog.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setConfirmDialog({ type: null, title: '', message: '', confirmText: '', confirmStyle: 'emerald' })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  confirmDialog.confirmStyle === 'rose'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : confirmDialog.confirmStyle === 'amber'
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
