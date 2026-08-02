// ---------------------------------------------------------------------------
// Google Drive export integration.
//
// Uses chrome.identity.getAuthToken() for OAuth (no server, no client
// secret needed — this is the standard flow for Chrome extensions) and the
// Drive REST API v3 directly via fetch. Scope is drive.file, meaning this
// extension can only see/manage files *it* creates — it cannot browse or
// read the rest of the user's Drive.
//
// IMPORTANT: this requires a real OAuth Client ID registered in Google
// Cloud Console, configured in public/manifest.json under "oauth2.client_id".
// See README.md -> "Setting Up Google Drive Export" for the exact steps.
// ---------------------------------------------------------------------------

const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';

export interface DriveFolder {
  id: string;
  name: string;
}

export class DriveAuthError extends Error {}
export class DriveApiError extends Error {}

function hasIdentityApi(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.identity?.getAuthToken;
}

/** Requests (or silently reuses) an OAuth token. Throws DriveAuthError on failure/denial. */
export async function getAuthToken(interactive: boolean): Promise<string> {
  if (!hasIdentityApi()) {
    throw new DriveAuthError(
      'Google sign-in is unavailable outside the installed extension (chrome.identity is not present in this context).',
    );
  }

  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(
          new DriveAuthError(
            chrome.runtime.lastError?.message ??
              'Google sign-in was cancelled or denied. Nothing was uploaded.',
          ),
        );
        return;
      }
      resolve(typeof token === 'string' ? token : (token as { token?: string }).token ?? '');
    });
  });
}

export async function signOut(): Promise<void> {
  if (!hasIdentityApi()) return;
  try {
    const token = await getAuthToken(false);
    await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
    chrome.identity.removeCachedAuthToken({ token }, () => {});
  } catch {
    // Already signed out or token unavailable — nothing to clean up.
  }
}

/** Lists folders under "My Drive" (top-level) that the app can see, plus a search term for nested lookup. */
export async function listDriveFolders(token: string, query?: string): Promise<DriveFolder[]> {
  const q = [
    "mimeType='application/vnd.google-apps.folder'",
    'trashed=false',
    query ? `name contains '${query.replace(/'/g, "\\'")}'` : null,
  ]
    .filter(Boolean)
    .join(' and ');

  const url = `${DRIVE_FILES_URL}?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=50`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  if (!res.ok) {
    throw new DriveApiError(`Could not list Drive folders (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as { files?: DriveFolder[] };
  return data.files ?? [];
}

/** Creates a new folder under "My Drive" (or under a given parent) and returns its ID. */
export async function createDriveFolder(token: string, name: string, parentId?: string): Promise<DriveFolder> {
  const res = await fetch(DRIVE_FILES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    }),
  });

  if (!res.ok) {
    throw new DriveApiError(`Could not create the Drive folder "${name}" (HTTP ${res.status}).`);
  }
  return (await res.json()) as DriveFolder;
}

export interface DriveUploadTarget {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
}

/**
 * Uploads a single file into a specific Drive folder using the simple
 * multipart upload flow (fine for the file sizes this extension produces —
 * individual split PDFs/DOCX/ZIPs, not multi-GB files that would need
 * resumable upload).
 */
export async function uploadFileToDriveFolder(
  token: string,
  folderId: string,
  target: DriveUploadTarget,
): Promise<{ id: string; webViewLink?: string }> {
  const metadata = {
    name: target.name,
    parents: [folderId],
  };

  const boundary = `----smartpdfsplitter-${Date.now()}`;
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const filePartHeader = `--${boundary}\r\nContent-Type: ${target.mimeType}\r\n\r\n`;
  const closing = `\r\n--${boundary}--`;

  const body = new Blob([metadataPart, filePartHeader, new Uint8Array(target.bytes), closing]);

  const res = await fetch(`${DRIVE_UPLOAD_URL}?uploadType=multipart&fields=id,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new DriveApiError(`Upload of "${target.name}" failed (HTTP ${res.status}). ${text}`.trim());
  }

  return (await res.json()) as { id: string; webViewLink?: string };
}

/** Uploads multiple files sequentially to a given folder, reporting progress. */
export async function uploadFilesToDriveFolder(
  token: string,
  folderId: string,
  targets: DriveUploadTarget[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  let uploaded = 0;
  for (const target of targets) {
    await uploadFileToDriveFolder(token, folderId, target);
    uploaded++;
    onProgress?.(uploaded, targets.length);
  }
  return uploaded;
}
