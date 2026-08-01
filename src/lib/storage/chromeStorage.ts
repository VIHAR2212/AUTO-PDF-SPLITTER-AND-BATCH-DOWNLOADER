import { DEFAULT_SETTINGS, type AppSettings, type RecentFileEntry } from '@/types';

// Falls back to localStorage when chrome.storage isn't available (e.g. when
// running `npm run dev` in a plain browser tab outside the extension host),
// so the UI remains testable without loading the unpacked extension.
const hasChromeStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;

async function get<T>(key: string, fallback: T): Promise<T> {
  if (hasChromeStorage) {
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? fallback;
  }
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  if (hasChromeStorage) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }
  localStorage.setItem(key, JSON.stringify(value));
}

export async function loadSettings(): Promise<AppSettings> {
  const stored = await get<Partial<AppSettings>>('settings', {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await set('settings', settings);
}

export async function loadRecentFiles(): Promise<RecentFileEntry[]> {
  return get<RecentFileEntry[]>('recentFiles', []);
}

export async function addRecentFile(entry: RecentFileEntry): Promise<RecentFileEntry[]> {
  const existing = await loadRecentFiles();
  const filtered = existing.filter((e) => e.fileName !== entry.fileName);
  const updated = [entry, ...filtered].slice(0, 20);
  await set('recentFiles', updated);
  return updated;
}

export async function clearRecentFiles(): Promise<void> {
  await set('recentFiles', []);
}

export function onSettingsChanged(callback: (settings: AppSettings) => void): () => void {
  if (!hasChromeStorage) return () => {};
  const listener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && changes.settings) {
      callback({ ...DEFAULT_SETTINGS, ...(changes.settings.newValue as Partial<AppSettings>) });
    }
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
