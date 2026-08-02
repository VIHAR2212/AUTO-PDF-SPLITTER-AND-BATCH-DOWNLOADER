import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDriveExport } from '@/hooks/useDriveExport';
import { DriveIcon, ChevronDownIcon, ChevronUpIcon, FolderIcon, PlusIcon, CheckIcon, WarnIcon } from './icons';
import { GooeyLoader } from './GooeyLoader';
import type { DriveUploadTarget } from '@/lib/drive/driveApi';

interface DrivePanelProps {
  /** Called to produce the files that should be uploaded, generated lazily
   * only when the user actually clicks upload (avoids re-splitting on every render). */
  onPrepareUploadTargets: () => Promise<DriveUploadTarget[]>;
}

export function DrivePanel({ onPrepareUploadTargets }: DrivePanelProps) {
  const { state, connect, disconnect, refreshFolders, createFolder, selectFolder, uploadFiles } = useDriveExport();
  const [open, setOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploadedOk, setUploadedOk] = useState(false);

  async function handleUpload() {
    setUploadedOk(false);
    const targets = await onPrepareUploadTargets();
    if (targets.length === 0) return;
    const ok = await uploadFiles(targets);
    if (ok) {
      setUploadedOk(true);
      setTimeout(() => setUploadedOk(false), 2500);
    }
  }

  return (
    <div className="card p-4">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between text-left">
        <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
          <DriveIcon width={13} height={13} />
          Google Drive
          {state.connected && <span className="tag tag-green !text-[9px]">connected</span>}
        </span>
        {open ? (
          <ChevronUpIcon width={13} height={13} className="text-ink-faint" />
        ) : (
          <ChevronDownIcon width={13} height={13} className="text-ink-faint" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-3">
              {!state.connected ? (
                <>
                  <p className="text-[13px] leading-relaxed text-ink-soft dark:text-white/70">
                    Sign in to export split files directly into a folder in your Drive. This
                    extension can only see files it creates itself (Drive's <code className="font-mono text-xs">drive.file</code> scope) —
                    it cannot browse or read the rest of your Drive.
                  </p>
                  <button className="btn-primary w-full justify-center" onClick={connect} disabled={state.connecting}>
                    {state.connecting ? <GooeyLoader className="h-6 scale-50" /> : 'Connect Google Drive'}
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs text-ink-muted">Export to folder</label>
                    <select
                      className="select-field mt-1"
                      value={state.selectedFolder?.id ?? ''}
                      onChange={(e) => {
                        const folder = state.folders.find((f) => f.id === e.target.value) ?? null;
                        selectFolder(folder);
                      }}
                    >
                      <option value="">Choose a folder...</option>
                      {state.folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {showNewFolder ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        className="input-field text-xs"
                        placeholder="New folder name"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newFolderName.trim()) {
                            createFolder(newFolderName.trim());
                            setNewFolderName('');
                            setShowNewFolder(false);
                          }
                        }}
                      />
                      <button
                        className="btn-ghost"
                        onClick={() => {
                          if (newFolderName.trim()) {
                            createFolder(newFolderName.trim());
                            setNewFolderName('');
                            setShowNewFolder(false);
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button className="btn-ghost !px-2" onClick={() => setShowNewFolder(true)}>
                        <PlusIcon width={12} height={12} /> New folder
                      </button>
                      <button className="btn-ghost !px-2" onClick={() => refreshFolders()}>
                        Refresh
                      </button>
                    </div>
                  )}

                  <button
                    className="btn-primary w-full justify-center"
                    onClick={handleUpload}
                    disabled={!state.selectedFolder || state.uploading}
                  >
                    {state.uploading ? (
                      <span className="flex items-center gap-2">
                        <GooeyLoader className="h-5 scale-40" />
                        {state.uploadProgress
                          ? `Uploading ${state.uploadProgress.done}/${state.uploadProgress.total}...`
                          : 'Uploading...'}
                      </span>
                    ) : (
                      <>
                        <FolderIcon width={14} height={14} /> Export to Drive
                      </>
                    )}
                  </button>

                  {uploadedOk && (
                    <p className="flex items-center gap-1.5 text-xs text-[#346538]">
                      <CheckIcon width={12} height={12} /> Uploaded to Drive successfully
                    </p>
                  )}

                  <button className="text-[11px] text-ink-faint hover:text-ink-muted underline" onClick={disconnect}>
                    Disconnect
                  </button>
                </>
              )}

              {state.error && (
                <p className="flex items-start gap-1.5 text-xs text-[#9F2F2D]">
                  <WarnIcon width={12} height={12} className="mt-0.5 flex-shrink-0" />
                  {state.error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
