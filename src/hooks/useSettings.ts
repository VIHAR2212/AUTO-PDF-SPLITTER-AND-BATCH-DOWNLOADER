import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, type AppSettings } from '@/types';
import { loadSettings, saveSettings, onSettingsChanged } from '@/lib/storage/chromeStorage';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSettings().then((s) => {
      if (mounted) {
        setSettings(s);
        setLoaded(true);
      }
    });
    const unsubscribe = onSettingsChanged((s) => {
      if (mounted) setSettings(s);
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const update = useCallback(async (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(async () => {
    setSettings(DEFAULT_SETTINGS);
    await saveSettings(DEFAULT_SETTINGS);
  }, []);

  return { settings, update, reset, loaded };
}
