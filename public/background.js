// Minimal MV3 service worker.
// The extension does all real work inside the popup/settings pages (no
// network access needed, no persistent background processing required).
// This worker only seeds default settings on first install.

const DEFAULT_SETTINGS = {
  theme: 'system',
  detectionMode: 'auto', // 'auto' | 'regex-only' | 'ocr-only'
  ocrLanguage: 'eng',
  compression: 'balanced', // 'none' | 'balanced' | 'max'
  namingTemplate: '{Category} {Number} {Roll}',
  category: 'Experiment',
  prefix: '',
  rollNumber: '',
  suffix: '',
  exportFormat: 'zip', // 'zip' | 'individual'
};

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    const existing = await chrome.storage.local.get('settings');
    if (!existing.settings) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS, recentFiles: [] });
    }
  }
});
