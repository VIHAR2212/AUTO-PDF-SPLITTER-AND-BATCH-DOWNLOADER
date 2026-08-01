import { useState } from 'react';
import { DriveIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

export function DriveExportHint() {
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          <DriveIcon width={13} height={13} />
          Save to Google Drive
        </span>
        {open ? <ChevronUpIcon width={13} height={13} className="text-ink-faint" /> : <ChevronDownIcon width={13} height={13} className="text-ink-faint" />}
      </button>

      {open && (
        <div className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-soft dark:text-white/70">
          <p>
            This extension has no direct Drive integration — that would require Google
            OAuth and network calls, which breaks the local-only, no-server design.
          </p>
          <p className="font-medium text-ink dark:text-white">The reliable workaround:</p>
          <ol className="list-decimal list-inside space-y-1 text-ink-muted">
            <li>Install Google Drive for Desktop and let it sync a local folder</li>
            <li>
              In Chrome, go to <span className="font-mono text-xs">Settings → Downloads</span> and set your default
              download location to that synced Drive folder
            </li>
            <li>Every export from this extension lands in Drive automatically</li>
          </ol>
          <p className="text-ink-faint text-xs pt-1">
            Want a real one-click "Export to a specific Drive folder" picker instead?
            That's buildable with the Drive API and a one-time sign-in — ask and it can
            be added as an optional connected feature.
          </p>
        </div>
      )}
    </div>
  );
}
