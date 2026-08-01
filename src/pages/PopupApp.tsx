import { useEffect, useMemo, useRef, useState } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useTheme } from '@/hooks/useTheme';
import { useDocumentProcessor } from '@/hooks/useDocumentProcessor';
import { useHistory } from '@/hooks/useHistory';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Header } from '@/components/Header';
import { DropZone } from '@/components/DropZone';
import { SectionCard } from '@/components/SectionCard';
import { NamingBuilder } from '@/components/NamingBuilder';
import { StatsPanel } from '@/components/StatsPanel';
import { WarningsPanel } from '@/components/WarningsPanel';
import { ProgressOverlay } from '@/components/ProgressOverlay';
import { PreviewModal } from '@/components/PreviewModal';
import { RecentFiles } from '@/components/RecentFiles';
import { ActionBar } from '@/components/ActionBar';
import { DriveExportHint } from '@/components/DriveExportHint';
import { renderFilename, dedupeFilenames } from '@/lib/naming/namingEngine';
import { splitPdfBySections, applyCompression } from '@/lib/pdf/splitPdf';
import { exportAsZip, exportIndividually, totalOutputSize } from '@/lib/export/exportFiles';
import { createManualSection } from '@/lib/detection/buildSections';
import { addRecentFile, loadRecentFiles } from '@/lib/storage/chromeStorage';
import type { DetectedSection, RecentFileEntry } from '@/types';

type Tab = 'workspace' | 'recent';

export default function App() {
  const { settings, update: updateSettings, loaded } = useSettings();
  useTheme(settings.theme);

  const { state, processFile, updateSections, reset, pdfDocRef } = useDocumentProcessor(settings);
  const history = useHistory([]);
  const historySeeded = useRef(false);

  const [tab, setTab] = useState<Tab>('workspace');
  const [search, setSearch] = useState('');
  const [previewSection, setPreviewSection] = useState<DetectedSection | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [recentFiles, setRecentFiles] = useState<RecentFileEntry[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Seed history stack whenever a fresh document finishes processing
  useEffect(() => {
    if (state.stage === 'ready' && !historySeeded.current) {
      history.reset(state.sections);
      historySeeded.current = true;

      if (state.document) {
        addRecentFile({
          id: state.document.id,
          fileName: state.document.fileName,
          importedAt: state.document.importedAt,
          sectionCount: state.sections.length,
          totalPages: state.document.totalPages,
        }).then(setRecentFiles);
      }
    }
    if (state.stage !== 'ready') {
      historySeeded.current = false;
    }
  }, [state.stage, state.sections, state.document, history]);

  useEffect(() => {
    loadRecentFiles().then(setRecentFiles);
  }, []);

  // Keep the processor's duplicate/missing detection synced with edits made via history
  useEffect(() => {
    if (historySeeded.current) updateSections(history.sections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history.sections]);

  const filteredSections = useMemo(() => {
    if (!search.trim()) return history.sections;
    const q = search.toLowerCase();
    return history.sections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.category.toLowerCase().includes(q),
    );
  }, [history.sections, search]);

  const duplicateIds = useMemo(() => {
    const ids = new Set<string>();
    state.duplicates.forEach((d) => d.sectionIds.forEach((id) => ids.add(id)));
    return ids;
  }, [state.duplicates]);

  const fileNames = useMemo(() => {
    const rendered = history.sections.map((s) =>
      renderFilename({ section: s, settings }),
    );
    return dedupeFilenames(rendered);
  }, [history.sections, settings]);

  const fileNameFor = (id: string) => {
    const idx = history.sections.findIndex((s) => s.id === id);
    return idx === -1 ? '' : fileNames[idx];
  };

  function handleRename(id: string, title: string) {
    history.commit(history.sections.map((s) => (s.id === id ? { ...s, title, manuallyEdited: true } : s)));
  }

  function handleDelete(id: string) {
    history.commit(history.sections.filter((s) => s.id !== id));
  }

  function handleMoveUp(id: string) {
    const idx = history.sections.findIndex((s) => s.id === id);
    if (idx <= 0) return;
    const next = [...history.sections];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    history.commit(next);
  }

  function handleMoveDown(id: string) {
    const idx = history.sections.findIndex((s) => s.id === id);
    if (idx === -1 || idx >= history.sections.length - 1) return;
    const next = [...history.sections];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    history.commit(next);
  }

  function handlePageAdjust(id: string, startPage: number, endPage: number) {
    const total = state.document?.totalPages ?? 9999;
    const clampedStart = Math.max(1, Math.min(startPage, total));
    const clampedEnd = Math.max(clampedStart, Math.min(endPage, total));
    history.commit(
      history.sections.map((s) =>
        s.id === id ? { ...s, startPage: clampedStart, endPage: clampedEnd, manuallyEdited: true } : s,
      ),
    );
  }

  function handleAddManual() {
    const total = state.document?.totalPages ?? 1;
    const newSection = createManualSection(1, Math.min(5, total), total);
    history.commit([...history.sections, newSection]);
  }

  function handleDragStart(id: string) {
    setDragId(id);
  }
  function handleDragOver(id: string) {
    if (id !== dragId) setDragOverId(id);
  }
  function handleDragEnd() {
    if (dragId && dragOverId && dragId !== dragOverId) {
      const sections = [...history.sections];
      const fromIdx = sections.findIndex((s) => s.id === dragId);
      const toIdx = sections.findIndex((s) => s.id === dragOverId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = sections.splice(fromIdx, 1);
        sections.splice(toIdx, 0, moved);
        history.commit(sections);
      }
    }
    setDragId(null);
    setDragOverId(null);
  }

  async function handleExport() {
    if (!state.document || history.sections.length === 0) return;
    setExporting(true);
    try {
      const names = fileNames;
      const results = await splitPdfBySections(state.document.bytes, history.sections, names);

      const compressed = await Promise.all(
        results.map(async (r) => ({ ...r, bytes: await applyCompression(r.bytes, settings.compression) })),
      );

      if (settings.exportFormat === 'zip') {
        await exportAsZip(
          compressed,
          `${state.document.fileName.replace(/\.(pdf|docx)$/i, '')}-split.zip`,
        );
      } else {
        await exportIndividually(compressed);
      }

      void totalOutputSize(compressed);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(false);
    }
  }

  useKeyboardShortcuts({
    onUndo: history.undo,
    onRedo: history.redo,
    onSearch: () => searchInputRef.current?.focus(),
    onExport: handleExport,
  });

  if (!loaded) return null;

  const hasDocument = state.stage === 'ready' || (state.document && state.stage !== 'idle');

  return (
    <div className="flex h-full flex-col bg-bone dark:bg-[#141413] text-ink dark:text-white font-sans">
      <Header
        theme={settings.theme}
        onThemeChange={(t) => updateSettings({ theme: t })}
        onOpenSettings={() => chrome.runtime?.openOptionsPage?.()}
      />

      <div className="flex items-center gap-1 border-b border-line dark:border-white/10 px-6">
        {(['workspace', 'recent'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
              tab === t ? 'text-ink dark:text-white' : 'text-ink-faint hover:text-ink-muted'
            }`}
          >
            {t}
            {tab === t && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-ink dark:bg-white" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {tab === 'recent' ? (
          <RecentFiles files={recentFiles} />
        ) : !hasDocument ? (
          <div className="mx-auto max-w-xl pt-6">
            <DropZone onFile={processFile} />
          </div>
        ) : state.stage !== 'ready' && state.stage !== 'error' ? (
          <div className="flex h-full items-center justify-center pt-12">
            <ProgressOverlay stage={state.stage} label={state.progressLabel} pct={state.progressPct} />
          </div>
        ) : state.stage === 'error' ? (
          <div className="mx-auto max-w-md pt-12 text-center">
            <p className="text-sm font-medium text-[#9F2F2D]">{state.error}</p>
            <button className="btn-secondary mt-4" onClick={reset}>
              Try another file
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_300px]">
            <div className="space-y-3">
              <ActionBar
                search={search}
                onSearchChange={setSearch}
                exportFormat={settings.exportFormat}
                onExportFormatChange={(f) => updateSettings({ exportFormat: f })}
                onExport={handleExport}
                exporting={exporting}
                canUndo={history.canUndo}
                canRedo={history.canRedo}
                onUndo={history.undo}
                onRedo={history.redo}
                onAddManual={handleAddManual}
                sectionCount={history.sections.length}
              />

              {filteredSections.length === 0 ? (
                <div className="card p-8 text-center text-sm text-ink-muted">
                  No sections match your search.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredSections.map((s, i) => (
                    <SectionCard
                      key={s.id}
                      section={s}
                      index={i}
                      total={filteredSections.length}
                      isDuplicate={duplicateIds.has(s.id)}
                      fileName={fileNameFor(s.id)}
                      onRename={handleRename}
                      onDelete={handleDelete}
                      onPreview={setPreviewSection}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onPageAdjust={handlePageAdjust}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      isDragTarget={dragOverId === s.id}
                    />
                  ))}
                </div>
              )}

              <button
                onClick={reset}
                className="btn-secondary w-full justify-center border-dashed"
              >
                Process a different file
              </button>
            </div>

            <div className="space-y-4">
              <StatsPanel
                stats={{
                  totalPages: state.document?.totalPages ?? 0,
                  detectedSections: history.sections.length,
                  outputSizeBytes: 0,
                  processingTimeMs: state.processingTimeMs,
                }}
              />
              <WarningsPanel duplicates={state.duplicates} missing={state.missing} />
              <NamingBuilder settings={settings} onChange={updateSettings} />
              <DriveExportHint />
            </div>
          </div>
        )}
      </div>

      <PreviewModal section={previewSection} pdfDoc={pdfDocRef.current} onClose={() => setPreviewSection(null)} />
    </div>
  );
}
