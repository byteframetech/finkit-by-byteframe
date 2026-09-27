/**
 * Google Drive Sync Service for FinKit by Byteframe
 * Uses Google Drive REST API v3 restricted strictly to the hidden appDataFolder.
 * 
 * Scope: https://www.googleapis.com/auth/drive.appdata
 * Space: 'appDataFolder'
 */

export interface DriveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
}

export interface DriveSyncResult<T> {
  success: boolean;
  data?: T;
  fileMetadata?: DriveFileMetadata;
  error?: string;
  isTokenExpired?: boolean;
  isOffline?: boolean;
}

export const APP_DATA_FILE_NAME = 'finkit_workspace_scenarios.json';

/**
 * Searches for an existing file within the hidden appDataFolder by name.
 */
export async function findAppDataFile(
  fileName: string,
  accessToken: string
): Promise<DriveFileMetadata | null> {
  checkNetworkOnline();

  // Primary: Search via search query in appDataFolder
  try {
    const query = encodeURIComponent(`name = '${fileName}' and trashed = false`);
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=10`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      if (result.files && result.files.length > 0) {
        return result.files[0] as DriveFileMetadata;
      }
    }
  } catch (err) {
    console.warn('[DriveSync] Query search failed, attempting fallback list:', err);
  }

  // Fallback: List files directly in spaces=appDataFolder and match name
  try {
    const listUrl = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)&pageSize=25`;
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const result = await response.json();
      const matched = (result.files || []).find((f: any) => f.name === fileName);
      if (matched) return matched as DriveFileMetadata;
    }
  } catch (err) {
    console.warn('[DriveSync] Fallback list failed:', err);
  }

  return null;
}

/**
 * Lists all configuration and scenario files saved in the user's hidden appDataFolder.
 */
export async function listAppDataFiles(
  accessToken: string
): Promise<DriveFileMetadata[]> {
  checkNetworkOnline();

  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime,size)&orderBy=modifiedTime desc`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    await handleDriveApiError(response);
  }

  const result = await response.json();
  return (result.files || []) as DriveFileMetadata[];
}

/**
 * Saves or updates a JSON file inside the user's hidden Google Drive appDataFolder.
 * If file exists, performs an in-place content update (PATCH).
 * If file does not exist, performs a multipart upload (POST) creating the file in appDataFolder.
 */
export async function saveToAppData<T>(
  fileName: string,
  content: T,
  accessToken: string
): Promise<DriveFileMetadata> {
  checkNetworkOnline();

  const existingFile = await findAppDataFile(fileName, accessToken);
  const jsonContent = JSON.stringify(content, null, 2);

  if (existingFile) {
    // In-place content update
    const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const response = await fetch(uploadUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json; charset=UTF-8',
      },
      body: jsonContent,
    });

    if (!response.ok) {
      await handleDriveApiError(response);
    }

    const updatedMetadata = await response.json();
    return {
      id: updatedMetadata.id || existingFile.id,
      name: updatedMetadata.name || existingFile.name,
      modifiedTime: updatedMetadata.modifiedTime || new Date().toISOString(),
    };
  } else {
    // Create new file via RFC-compliant multipart upload to appDataFolder
    const metadata = {
      name: fileName,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const boundary = '-------FinKitDriveBoundary' + Math.random().toString(36).substring(2);
    // Boundary lines must start without leading CRLF for the first part
    const multipartRequestBody =
      `--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\n` +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      jsonContent +
      `\r\n--${boundary}--`;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,size';
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!response.ok) {
      await handleDriveApiError(response);
    }

    const createdMetadata = await response.json();
    return createdMetadata as DriveFileMetadata;
  }
}

/**
 * Loads and parses JSON state content from a specific file in appDataFolder.
 */
export async function loadFromAppData<T>(
  fileId: string,
  accessToken: string
): Promise<T> {
  checkNetworkOnline();

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    await handleDriveApiError(response);
  }

  const rawText = await response.text();
  try {
    return JSON.parse(rawText) as T;
  } catch (parseErr) {
    console.error('[DriveSync] Corrupted JSON received:', rawText);
    throw new Error('Retrieved cloud file does not contain valid JSON data.');
  }
}

/**
 * Convenience helper to locate and load the latest appData file in one call.
 */
export async function loadLatestAppData<T>(
  fileName: string,
  accessToken: string
): Promise<{ data: T; metadata: DriveFileMetadata } | null> {
  const file = await findAppDataFile(fileName, accessToken);
  if (!file) return null;
  const data = await loadFromAppData<T>(file.id, accessToken);
  return { data, metadata: file };
}

/**
 * Deletes a file from appDataFolder.
 * Note: Must be accompanied by user confirmation before execution.
 */
export async function deleteFromAppData(
  fileId: string,
  accessToken: string
): Promise<void> {
  checkNetworkOnline();

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    await handleDriveApiError(response);
  }
}

/**
 * Helper to check network connectivity before sending requests.
 */
function checkNetworkOnline(): void {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const error: any = new Error('You are currently offline. Please check your internet connection to sync with Google Drive.');
    error.code = 'OFFLINE';
    throw error;
  }
}

/**
 * Robust error parser for Google Drive v3 REST API responses.
 */
async function handleDriveApiError(response: Response): Promise<never> {
  let errorData: any = {};
  try {
    errorData = await response.json();
  } catch {
    // Response not JSON
  }

  const message = errorData?.error?.message || response.statusText || 'Google Drive API error';
  const error: any = new Error(message);
  error.status = response.status;
  error.details = errorData;

  if (response.status === 401) {
    error.code = 'TOKEN_EXPIRED';
    error.message = 'Your Google session has expired. Please sign in again to sync.';
  } else if (response.status === 403) {
    error.code = 'ACCESS_DENIED';
    error.message = 'Google Drive access denied. Please grant the requested appDataFolder permission.';
  } else if (response.status === 404) {
    error.code = 'NOT_FOUND';
    error.message = 'The requested cloud scenario was not found on Google Drive.';
  }

  throw error;
}
