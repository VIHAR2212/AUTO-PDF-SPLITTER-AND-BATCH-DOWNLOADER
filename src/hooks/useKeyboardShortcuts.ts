import { useEffect } from 'react';

interface ShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod) return;

      // Don't hijack shortcuts while typing in a text field
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'z' && !e.shiftKey && !isTyping) {
        e.preventDefault();
        handlers.onUndo?.();
      } else if ((e.key === 'z' && e.shiftKey) || (e.key === 'y' && !isTyping)) {
        e.preventDefault();
        handlers.onRedo?.();
      } else if (e.key === 'f' && !isTyping) {
        e.preventDefault();
        handlers.onSearch?.();
      } else if (e.key === 'Enter' && !isTyping) {
        e.preventDefault();
        handlers.onExport?.();
      }
    };

    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [handlers]);
}
