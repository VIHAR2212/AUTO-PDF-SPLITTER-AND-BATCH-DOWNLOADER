import { useCallback, useRef, useState } from 'react';
import type { DetectedSection } from '@/types';

const MAX_HISTORY = 50;

/**
 * Simple linear undo/redo stack over DetectedSection[] snapshots.
 * `commit` should be called any time the user makes an edit (rename,
 * delete, reorder, page adjust, add). `undo`/`redo` navigate the stack.
 */
export function useHistory(initial: DetectedSection[]) {
  const [present, setPresent] = useState<DetectedSection[]>(initial);
  const past = useRef<DetectedSection[][]>([]);
  const future = useRef<DetectedSection[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const syncFlags = useCallback(() => {
    setCanUndo(past.current.length > 0);
    setCanRedo(future.current.length > 0);
  }, []);

  const commit = useCallback(
    (next: DetectedSection[]) => {
      past.current.push(present);
      if (past.current.length > MAX_HISTORY) past.current.shift();
      future.current = [];
      setPresent(next);
      syncFlags();
    },
    [present, syncFlags],
  );

  const reset = useCallback(
    (next: DetectedSection[]) => {
      past.current = [];
      future.current = [];
      setPresent(next);
      syncFlags();
    },
    [syncFlags],
  );

  const undo = useCallback(() => {
    if (past.current.length === 0) return;
    const previous = past.current.pop()!;
    future.current.push(present);
    setPresent(previous);
    syncFlags();
  }, [present, syncFlags]);

  const redo = useCallback(() => {
    if (future.current.length === 0) return;
    const next = future.current.pop()!;
    past.current.push(present);
    setPresent(next);
    syncFlags();
  }, [present, syncFlags]);

  return { sections: present, commit, reset, undo, redo, canUndo, canRedo };
}
