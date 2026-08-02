import { useCallback, useState } from 'react';
import {
  getAuthToken,
  signOut as driveSignOut,
  listDriveFolders,
  createDriveFolder,
  uploadFilesToDriveFolder,
  DriveAuthError,
  DriveApiError,
  type DriveFolder,
  type DriveUploadTarget,
} from '@/lib/drive/driveApi';

interface DriveState {
  connected: boolean;
  connecting: boolean;
  folders: DriveFolder[];
  selectedFolder: DriveFolder | null;
  uploading: boolean;
  uploadProgress: { done: number; total: number } | null;
  error: string | null;
}

const initialState: DriveState = {
  connected: false,
  connecting: false,
  folders: [],
  selectedFolder: null,
  uploading: false,
  uploadProgress: null,
  error: null,
};

export function useDriveExport() {
  const [state, setState] = useState<DriveState>(initialState);
  const [tokenCache, setTokenCache] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, connecting: true, error: null }));
    try {
      const token = await getAuthToken(true);
      setTokenCache(token);
      const folders = await listDriveFolders(token);
      setState((s) => ({ ...s, connected: true, connecting: false, folders }));
    } catch (err) {
      const message =
        err instanceof DriveAuthError || err instanceof DriveApiError
          ? err.message
          : 'Could not connect to Google Drive.';
      setState((s) => ({ ...s, connecting: false, error: message }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    await driveSignOut();
    setTokenCache(null);
    setState(initialState);
  }, []);

  const refreshFolders = useCallback(
    async (query?: string) => {
      if (!tokenCache) return;
      try {
        const folders = await listDriveFolders(tokenCache, query);
        setState((s) => ({ ...s, folders }));
      } catch (err) {
        setState((s) => ({ ...s, error: err instanceof Error ? err.message : 'Could not refresh folders.' }));
      }
    },
    [tokenCache],
  );

  const createFolder = useCallback(
    async (name: string) => {
      if (!tokenCache) return;
      try {
        const folder = await createDriveFolder(tokenCache, name);
        setState((s) => ({ ...s, folders: [folder, ...s.folders], selectedFolder: folder }));
      } catch (err) {
        setState((s) => ({ ...s, error: err instanceof Error ? err.message : 'Could not create folder.' }));
      }
    },
    [tokenCache],
  );

  const selectFolder = useCallback((folder: DriveFolder | null) => {
    setState((s) => ({ ...s, selectedFolder: folder }));
  }, []);

  const uploadFiles = useCallback(
    async (targets: DriveUploadTarget[]): Promise<boolean> => {
      if (!tokenCache || !state.selectedFolder) {
        setState((s) => ({ ...s, error: 'Pick a Drive folder before exporting.' }));
        return false;
      }
      setState((s) => ({ ...s, uploading: true, uploadProgress: { done: 0, total: targets.length }, error: null }));
      try {
        await uploadFilesToDriveFolder(tokenCache, state.selectedFolder.id, targets, (done, total) => {
          setState((s) => ({ ...s, uploadProgress: { done, total } }));
        });
        setState((s) => ({ ...s, uploading: false, uploadProgress: null }));
        return true;
      } catch (err) {
        setState((s) => ({
          ...s,
          uploading: false,
          uploadProgress: null,
          error: err instanceof Error ? err.message : 'Upload to Drive failed.',
        }));
        return false;
      }
    },
    [tokenCache, state.selectedFolder],
  );

  return { state, connect, disconnect, refreshFolders, createFolder, selectFolder, uploadFiles };
}
