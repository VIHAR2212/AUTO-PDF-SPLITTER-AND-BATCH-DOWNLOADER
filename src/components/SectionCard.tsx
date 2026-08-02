import { useState } from 'react';
import { motion } from 'framer-motion';
import type { DetectedSection } from '@/types';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  CheckIcon,
  WarnIcon,
  GripIcon,
} from './icons';

interface SectionCardProps {
  section: DetectedSection;
  index: number;
  total: number;
  isDuplicate: boolean;
  fileName: string;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onPreview: (section: DetectedSection) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onPageAdjust: (id: string, startPage: number, endPage: number) => void;
  onDragStart: (id: string) => void;
  onDragOver: (id: string) => void;
  onDragEnd: () => void;
  isDragTarget: boolean;
}

export function SectionCard({
  section,
  index,
  total,
  isDuplicate,
  fileName,
  onRename,
  onDelete,
  onPreview,
  onMoveUp,
  onMoveDown,
  onPageAdjust,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragTarget,
}: SectionCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(section.title);
  const [editingPages, setEditingPages] = useState(false);
  const [draftStart, setDraftStart] = useState(section.startPage);
  const [draftEnd, setDraftEnd] = useState(section.endPage);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    if (trimmed && trimmed !== section.title) onRename(section.id, trimmed);
    setEditing(false);
  };

  const commitPages = () => {
    onPageAdjust(section.id, draftStart, draftEnd);
    setEditingPages(false);
  };

  const lowConfidence = section.confidence < 0.75 && section.source === 'regex';

  return (
    <motion.div
      draggable
      onDragStart={() => onDragStart(section.id)}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver(section.id);
      }}
      onDragEnd={onDragEnd}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        borderColor: isDragTarget ? '#111111' : '#EAEAEA',
      }}
      transition={{
        opacity: { duration: 0.35, delay: Math.min(index * 0.04, 0.4) },
        y: { type: 'spring', bounce: 0, duration: 0.4, delay: Math.min(index * 0.04, 0.4) },
        borderColor: { duration: 0.15 },
      }}
      className="card card-hover group flex gap-3 border p-3"
    >
      <button className="cursor-grab active:cursor-grabbing text-ink-faint hover:text-ink-muted self-center">
        <GripIcon width={15} height={15} />
      </button>

      <div className="relative h-24 w-[76px] flex-shrink-0 overflow-hidden rounded-[6px] bg-bone-100 dark:bg-white/5 border border-line dark:border-white/10">
        {section.thumbnailDataUrl ? (
          <img src={section.thumbnailDataUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="skeleton h-full w-full" />
        )}
        <span className="absolute bottom-1 right-1 rounded bg-ink/80 px-1 py-0.5 text-[9px] font-mono text-white">
          p{section.startPage}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                autoFocus
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitRename();
                  if (e.key === 'Escape') {
                    setDraftTitle(section.title);
                    setEditing(false);
                  }
                }}
                className="input-field py-1 font-serif text-base"
              />
            ) : (
              <p className="truncate font-serif text-base text-ink dark:text-white tracking-tight">
                {section.title}
              </p>
            )}
            <p className="mt-0.5 truncate font-mono text-[11px] text-ink-faint">{fileName}.pdf</p>
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="btn-ghost" title="Preview" onClick={() => onPreview(section)}>
              <EyeIcon width={13} height={13} />
            </button>
            <button className="btn-ghost" title="Rename" onClick={() => setEditing(true)}>
              <PencilIcon width={13} height={13} />
            </button>
            <button className="btn-ghost-danger" title="Delete" onClick={() => onDelete(section.id)}>
              <TrashIcon width={13} height={13} />
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {editingPages ? (
            <div className="flex items-center gap-1 text-xs">
              <input
                type="number"
                value={draftStart}
                min={1}
                onChange={(e) => setDraftStart(Number(e.target.value))}
                className="input-field w-14 py-0.5 px-1.5 font-mono text-xs"
              />
              <span className="text-ink-faint">–</span>
              <input
                type="number"
                value={draftEnd}
                min={1}
                onChange={(e) => setDraftEnd(Number(e.target.value))}
                className="input-field w-14 py-0.5 px-1.5 font-mono text-xs"
              />
              <button className="btn-ghost !text-ink dark:!text-white font-medium" onClick={commitPages}>
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDraftStart(section.startPage);
                setDraftEnd(section.endPage);
                setEditingPages(true);
              }}
              className="tag tag-blue hover:brightness-95 transition-[filter]"
              title="Click to adjust page range"
            >
              Pages {section.startPage}–{section.endPage}
            </button>
          )}

          <span className="tag tag-neutral">{section.endPage - section.startPage + 1} pg</span>

          {section.source === 'bookmark' && <span className="tag tag-neutral">bookmark</span>}
          {section.source === 'manual' && <span className="tag tag-yellow">manual</span>}
          {section.manuallyEdited && <span className="tag tag-neutral">edited</span>}

          {isDuplicate && (
            <span className="tag tag-red">
              <WarnIcon width={10} height={10} /> duplicate
            </span>
          )}
          {lowConfidence && !isDuplicate && (
            <span className="tag tag-yellow">
              <WarnIcon width={10} height={10} /> low confidence
            </span>
          )}
          {!lowConfidence && !isDuplicate && section.source === 'regex' && (
            <span className="tag tag-green">
              <CheckIcon width={10} height={10} /> confirmed
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 self-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          disabled={index === 0}
          onClick={() => onMoveUp(section.id)}
          className="btn-ghost !p-1 disabled:opacity-20"
        >
          <ChevronUpIcon width={13} height={13} />
        </button>
        <button
          disabled={index === total - 1}
          onClick={() => onMoveDown(section.id)}
          className="btn-ghost !p-1 disabled:opacity-20"
        >
          <ChevronDownIcon width={13} height={13} />
        </button>
      </div>
    </motion.div>
  );
}
