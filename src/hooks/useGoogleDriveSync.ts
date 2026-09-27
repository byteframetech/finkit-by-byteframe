import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout as authLogout,
  getAccessToken,
  getCurrentUser,
} from '../services/googleAuth';
import {
  saveToAppData,
  findAppDataFile,
  loadFromAppData,
  loadLatestAppData,
  deleteFromAppData,
  APP_DATA_FILE_NAME,
  DriveFileMetadata,
} from '../services/driveSync';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

export const LOCAL_CACHE_KEY = 'finkit_workspace_cache';

export interface WorkspaceStatePayload {
  version: string;
  updatedAt: string;
  appName: string;
  currency: string;
  activeCalculator: string;
  loanParams: any;
  currentPresetId?: string | null;
  customScenarios?: Array<{
    id: string;
    title: string;
    type: string;
    createdAt: string;
    params: any;
  }>;
  extraSettings?: Record<string, any>;
  allCalculatorsState?: Record<string, any>;
}

export interface UseGoogleDriveSyncReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  isSaving: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  lastSyncError: string | null;
  cloudFile: DriveFileMetadata | null;
  isOnline: boolean;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  saveToCloud: (state: WorkspaceStatePayload, showConfirmation?: boolean) => Promise<boolean>;
  saveCurrentWorkspace: (state: WorkspaceStatePayload) => Promise<boolean>;
  loadFromCloud: () => Promise<WorkspaceStatePayload | null>;
  deleteCloudBackup: () => Promise<boolean>;
  checkCloudStatus: () => Promise<void>;
}

export function useGoogleDriveSync(
  onToast?: (msg: string) => void,
  onAutoRestore?: (restoredState: WorkspaceStatePayload) => void
): UseGoogleDriveSyncReturn {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);
  const [cloudFile, setCloudFile] = useState<DriveFileMetadata | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const autoRestoreRef = useRef(onAutoRestore);
  autoRestoreRef.current = onAutoRestore;

  // Monitor network online / offline transitions
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (syncStatus === 'offline') {
        setSyncStatus('idle');
        setLastSyncError(null);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      setLastSyncError('Network connection lost. Offline mode active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncStatus]);

  // Check cloud backup file metadata
  const checkCloudStatus = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;

      const file = await findAppDataFile(APP_DATA_FILE_NAME, token);
      setCloudFile(file);
      if (file?.modifiedTime) {
        setLastSyncedAt(new Date(file.modifiedTime));
        setSyncStatus('synced');
      }
    } catch (err: any) {
      if (err.code === 'TOKEN_EXPIRED') {
        setUser(null);
        setSyncStatus('error');
        setLastSyncError('Session expired. Please sign in again.');
      }
    }
  }, []);

  // Initialize Auth state listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, _token) => {
        setUser(authedUser);
        checkCloudStatus();
      },
      () => {
        setUser(null);
        setCloudFile(null);
        setSyncStatus('idle');
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [checkCloudStatus]);

  // Interactive Sign In with AUTOMATIC RESTORE as soon as user is logged in
  const login = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      onToast?.('Cannot sign in: You are currently offline.');
      return false;
    }

    setIsLoggingIn(true);
    setLastSyncError(null);

    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);

        // Immediately fetch and restore stored content from Google Drive appDataFolder
        setSyncStatus('syncing');
        try {
          const cloudResult = await loadLatestAppData<WorkspaceStatePayload>(
            APP_DATA_FILE_NAME,
            result.accessToken
          );

          if (cloudResult && cloudResult.data) {
            setCloudFile(cloudResult.metadata);
            setLastSyncedAt(new Date(cloudResult.metadata.modifiedTime || Date.now()));
            setSyncStatus('synced');

            // Apply restored state to workspace
            if (autoRestoreRef.current) {
              autoRestoreRef.current(cloudResult.data);
            }

            // Sync to local cache
            try {
              localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cloudResult.data));
            } catch {}

            const userName = result.user.displayName || 'User';
            onToast?.(`Welcome back, ${userName}! Restored your scenarios from Google Drive.`);
          } else {
            await checkCloudStatus();
            setSyncStatus('idle');
            const userName = result.user.displayName || result.user.email || 'User';
            onToast?.(`Signed in as ${userName}. Click "Save Changes" to back up your scenarios.`);
          }
        } catch (fetchErr: any) {
          console.warn('[DriveSync] Auto-fetch on login warning:', fetchErr);
          await checkCloudStatus();
          onToast?.(`Signed in as ${result.user.displayName || result.user.email}`);
        }

        return true;
      }
      return false;
    } catch (err: any) {
      const msg = err.message || 'Google Sign-In failed';
      setLastSyncError(msg);
      onToast?.(msg);
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, [isOnline, onToast, checkCloudStatus]);

  // Sign out
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authLogout();
      setUser(null);
      setCloudFile(null);
      setLastSyncedAt(null);
      setSyncStatus('idle');
      setLastSyncError(null);
      onToast?.('Signed out of Google account.');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  }, [onToast]);

  // Save state to Google Drive appDataFolder
  const saveToCloud = useCallback(
    async (state: WorkspaceStatePayload): Promise<boolean> => {
      if (!isOnline) {
        setSyncStatus('offline');
        setLastSyncError('Offline: changes cannot be uploaded to Google Drive right now.');
        // Cache locally even when offline
        try {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
        } catch {}
        onToast?.('Offline: Saved scenario locally in browser cache.');
        return false;
      }

      setSyncStatus('syncing');
      setIsSaving(true);
      setLastSyncError(null);

      try {
        let token = await getAccessToken();
        if (!token) {
          // Token expired or missing, attempt re-auth prompt
          setSyncStatus('error');
          setLastSyncError('Sign-in required to save to Google Drive.');
          onToast?.('Please sign in with Google to sync your scenarios.');
          return false;
        }

        const metadata = await saveToAppData(APP_DATA_FILE_NAME, state, token);
        setCloudFile(metadata);
        setLastSyncedAt(new Date());
        setSyncStatus('synced');

        // Cache locally as safety fallback
        try {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
        } catch {}

        onToast?.('Scenarios saved to Google Drive appDataFolder!');
        return true;
      } catch (err: any) {
        console.error('[DriveSync] Save failed:', err);
        setSyncStatus('error');
        const msg = err.message || 'Failed to save to Google Drive';
        setLastSyncError(msg);
        onToast?.(msg);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [isOnline, onToast]
  );

  // Convenient 1-Click Save Handler (Signs in if needed, then immediately saves)
  const saveCurrentWorkspace = useCallback(
    async (state: WorkspaceStatePayload): Promise<boolean> => {
      // If user is already authenticated with valid token
      const token = await getAccessToken();
      if (user && token) {
        return await saveToCloud(state);
      }

      // If not authenticated, prompt sign in and immediately save
      if (!isOnline) {
        try {
          localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
        } catch {}
        onToast?.('Offline: Saved scenario locally.');
        return false;
      }

      setIsSaving(true);
      setIsLoggingIn(true);
      try {
        const result = await googleSignIn();
        if (result) {
          setUser(result.user);
          setSyncStatus('syncing');

          const metadata = await saveToAppData(APP_DATA_FILE_NAME, state, result.accessToken);
          setCloudFile(metadata);
          setLastSyncedAt(new Date());
          setSyncStatus('synced');

          try {
            localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(state));
          } catch {}

          const userName = result.user.displayName || 'User';
          onToast?.(`Signed in as ${userName} & saved your scenarios to Google Drive!`);
          return true;
        }
        return false;
      } catch (err: any) {
        const msg = err.message || 'Failed to sign in and save';
        setLastSyncError(msg);
        onToast?.(msg);
        return false;
      } finally {
        setIsSaving(false);
        setIsLoggingIn(false);
      }
    },
    [user, isOnline, saveToCloud, onToast]
  );

  // Load state from Google Drive appDataFolder
  const loadFromCloud = useCallback(async (): Promise<WorkspaceStatePayload | null> => {
    if (!isOnline) {
      onToast?.('Offline: Cannot load cloud scenarios.');
      return null;
    }

    setSyncStatus('syncing');
    setLastSyncError(null);

    try {
      const token = await getAccessToken();
      if (!token) {
        setSyncStatus('error');
        setLastSyncError('Sign-in required to access Google Drive.');
        onToast?.('Please sign in with Google to load cloud scenarios.');
        return null;
      }

      const cloudResult = await loadLatestAppData<WorkspaceStatePayload>(
        APP_DATA_FILE_NAME,
        token
      );

      if (!cloudResult || !cloudResult.data) {
        setSyncStatus('idle');
        onToast?.('No cloud scenarios found in your Google Drive appDataFolder.');
        return null;
      }

      setCloudFile(cloudResult.metadata);
      setLastSyncedAt(new Date(cloudResult.metadata.modifiedTime || Date.now()));
      setSyncStatus('synced');

      // Sync local cache
      try {
        localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cloudResult.data));
      } catch {}

      if (autoRestoreRef.current) {
        autoRestoreRef.current(cloudResult.data);
      }

      onToast?.('Scenarios restored from Google Drive!');
      return cloudResult.data;
    } catch (err: any) {
      console.error('[DriveSync] Load failed:', err);
      setSyncStatus('error');
      const msg = err.message || 'Failed to load scenarios from Google Drive';
      setLastSyncError(msg);
      onToast?.(msg);
      return null;
    }
  }, [isOnline, onToast]);

  // Delete cloud file (requires user confirmation before calling)
  const deleteCloudBackup = useCallback(async (): Promise<boolean> => {
    if (!isOnline) {
      onToast?.('Offline: Cannot delete cloud backup.');
      return false;
    }

    try {
      const token = await getAccessToken();
      if (!token || !cloudFile) return false;

      await deleteFromAppData(cloudFile.id, token);
      setCloudFile(null);
      setLastSyncedAt(null);
      setSyncStatus('idle');
      onToast?.('Cloud backup removed from Google Drive.');
      return true;
    } catch (err: any) {
      const msg = err.message || 'Failed to delete cloud backup';
      onToast?.(msg);
      return false;
    }
  }, [isOnline, cloudFile, onToast]);

  return {
    user,
    isAuthenticated: !!user,
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
    checkCloudStatus,
  };
}
