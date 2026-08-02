import { motion } from 'framer-motion';
import type { Theme } from '@/types';
import { GearIcon, SunIcon, MoonIcon, LaptopIcon, FileIcon } from './icons';

interface HeaderProps {
  theme: Theme;
  onThemeChange: (t: Theme) => void;
  onOpenSettings: () => void;
}

const THEME_OPTIONS: { value: Theme; icon: typeof SunIcon; label: string }[] = [
  { value: 'light', icon: SunIcon, label: 'Light' },
  { value: 'dark', icon: MoonIcon, label: 'Dark' },
  { value: 'system', icon: LaptopIcon, label: 'System' },
];

export function Header({ theme, onThemeChange, onOpenSettings }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-line dark:border-white/10">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-control bg-ink dark:bg-white text-white dark:text-ink">
          <FileIcon width={16} height={16} />
        </div>
        <div>
          <h1 className="font-serif text-[15px] leading-none text-ink dark:text-white tracking-tight">
            Smart PDF Experiment Splitter
          </h1>
          <p className="mt-1 text-[10px] uppercase tracking-wider text-ink-muted">Local · No upload</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center rounded-control border border-line dark:border-white/15 p-0.5">
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              title={label}
              onClick={() => onThemeChange(value)}
              className="relative flex h-6 w-6 items-center justify-center rounded-[4px] text-ink-muted transition-colors"
            >
              {theme === value && (
                <motion.div
                  layoutId="theme-pill"
                  className="absolute inset-0 rounded-[4px] bg-bone-100 dark:bg-white/10"
                  transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                />
              )}
              <Icon
                width={13}
                height={13}
                className={`relative z-10 ${theme === value ? 'text-ink dark:text-white' : ''}`}
              />
            </button>
          ))}
        </div>
        <button onClick={onOpenSettings} className="btn-ghost" title="Settings">
          <GearIcon width={16} height={16} />
        </button>
      </div>
    </header>
  );
}
