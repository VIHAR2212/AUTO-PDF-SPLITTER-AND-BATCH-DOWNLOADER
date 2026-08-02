import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { clearRecentFiles } from '@/lib/storage/chromeStorage';
import type { CompressionLevel, DetectionMode, ExportFormat, Theme } from '@/types';
import { SunIcon, MoonIcon, LaptopIcon, CheckIcon } from '@/components/icons';

const OCR_LANGUAGES = [
  { code: 'eng', label: 'English' },
  { code: 'hin', label: 'Hindi' },
  { code: 'mar', label: 'Marathi' },
  { code: 'fra', label: 'French' },
  { code: 'deu', label: 'German' },
  { code: 'spa', label: 'Spanish' },
];

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <h2 className="font-serif text-base text-ink dark:text-white tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-xs text-ink-muted">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

export default function SettingsApp() {
  const { settings, update, reset, loaded } = useSettings();
  useTheme(settings.theme);
  const [cleared, setCleared] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  if (!loaded) return null;

  function flashSaved() {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  }

  return (
    <div className="min-h-screen bg-bone dark:bg-[#141413] font-sans">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink dark:text-white tracking-tight">Settings</h1>
            <p className="mt-1 text-xs uppercase tracking-wider text-ink-muted">Smart PDF Experiment Splitter</p>
          </div>
          {savedFlash && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="tag tag-green"
            >
              <CheckIcon width={11} height={11} /> Saved
            </motion.span>
          )}
        </div>

        <div className="space-y-4">
          <SettingsSection title="Appearance" description="Choose how the extension looks">
            <div className="flex gap-2">
              {(
                [
                  { value: 'light', icon: SunIcon, label: 'Light' },
                  { value: 'dark', icon: MoonIcon, label: 'Dark' },
                  { value: 'system', icon: LaptopIcon, label: 'System' },
                ] as { value: Theme; icon: typeof SunIcon; label: string }[]
              ).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    update({ theme: value });
                    flashSaved();
                  }}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-control border px-4 py-3 text-xs font-medium transition-colors ${
                    settings.theme === value
                      ? 'border-ink dark:border-white bg-bone-100 dark:bg-white/10 text-ink dark:text-white'
                      : 'border-line dark:border-white/15 text-ink-muted hover:border-ink-faint'
                  }`}
                >
                  <Icon width={17} height={17} />
                  {label}
                </button>
              ))}
            </div>
          </SettingsSection>

          <SettingsSection
            title="Detection mode"
            description="Choose how sections are detected inside your documents"
          >
            <select
              className="select-field"
              value={settings.detectionMode}
              onChange={(e) => {
                update({ detectionMode: e.target.value as DetectionMode });
                flashSaved();
              }}
            >
              <option value="auto">Auto (regex first, OCR fallback)</option>
              <option value="regex-only">Regex only (fastest)</option>
              <option value="ocr-only">OCR only (best for scans)</option>
            </select>

            <div>
              <label className="text-xs text-ink-muted">OCR language</label>
              <select
                className="select-field mt-1"
                value={settings.ocrLanguage}
                onChange={(e) => {
                  update({ ocrLanguage: e.target.value });
                  flashSaved();
                }}
              >
                {OCR_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </SettingsSection>

          <SettingsSection title="Output" description="Compression and export defaults">
            <div>
              <label className="text-xs text-ink-muted">Compression</label>
              <select
                className="select-field mt-1"
                value={settings.compression}
                onChange={(e) => {
                  update({ compression: e.target.value as CompressionLevel });
                  flashSaved();
                }}
              >
                <option value="none">None (fastest, largest files)</option>
                <option value="balanced">Balanced (recommended)</option>
                <option value="max">Maximum (smallest files)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-ink-muted">Default export format</label>
              <select
                className="select-field mt-1"
                value={settings.exportFormat}
                onChange={(e) => {
                  update({ exportFormat: e.target.value as ExportFormat });
                  flashSaved();
                }}
              >
                <option value="zip">PDF · ZIP archive</option>
                <option value="individual">PDF · Individual files</option>
                <option value="docx-zip">DOCX · ZIP archive</option>
                <option value="docx-individual">DOCX · Individual files</option>
              </select>
            </div>
          </SettingsSection>

          <SettingsSection title="Naming defaults" description="Used as the starting point for every new document">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-ink-muted">Default category</label>
                <input
                  className="input-field mt-1"
                  value={settings.category}
                  onChange={(e) => update({ category: e.target.value as never })}
                  onBlur={flashSaved}
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted">Roll number</label>
                <input
                  className="input-field mt-1"
                  value={settings.rollNumber}
                  onChange={(e) => update({ rollNumber: e.target.value })}
                  onBlur={flashSaved}
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-ink-muted">Naming template</label>
                <input
                  className="input-field mt-1 font-mono text-xs"
                  value={settings.namingTemplate}
                  onChange={(e) => update({ namingTemplate: e.target.value })}
                  onBlur={flashSaved}
                />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Google Drive export"
            description="Sign in and export split files straight into a Drive folder"
          >
            <p className="text-[13px] leading-relaxed text-ink-soft dark:text-white/70">
              Open the extension popup and expand <span className="font-medium text-ink dark:text-white">Google Drive</span>{' '}
              at the bottom of the sidebar to connect your account, pick or create a folder,
              and export directly into it. This uses Drive's{' '}
              <span className="font-mono text-xs">drive.file</span> scope — the extension can
              only see files it creates itself, never the rest of your Drive.
            </p>
            <p className="text-[12px] text-ink-faint">
              Requires a one-time developer setup (Google OAuth Client ID) — see the README's
              "Setting Up Google Drive Export" section if the connect button doesn't work yet.
            </p>
          </SettingsSection>

          <SettingsSection title="History">
            <button
              className="btn-secondary"
              onClick={async () => {
                await clearRecentFiles();
                setCleared(true);
                setTimeout(() => setCleared(false), 1500);
              }}
            >
              Clear recent files
            </button>
            {cleared && <span className="ml-2 text-xs text-[#346538]">Cleared</span>}
          </SettingsSection>

          <SettingsSection title="Reset">
            <button
              className="btn-ghost-danger !px-4 !py-2 border border-[#9F2F2D]/20"
              onClick={() => {
                reset();
                flashSaved();
              }}
            >
              Restore default settings
            </button>
          </SettingsSection>
        </div>

        <p className="mt-10 text-center text-[11px] text-ink-faint">
          Smart PDF Experiment Splitter · Runs entirely on your device. No data ever leaves your browser.
        </p>
      </div>
    </div>
  );
}
