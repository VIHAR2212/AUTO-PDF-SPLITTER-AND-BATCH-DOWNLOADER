import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// Bolder stroke (2.2) and squarer joins than typical thin-line icon sets,
// approximating a Phosphor Bold / Radix aesthetic per the minimalist-ui skill.
const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'square' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const UploadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 15.5V4" />
    <path d="M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 16v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const FileIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 2.5h8l4.5 4.5V21a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V3a.5.5 0 0 1 .5-.5Z" />
    <path d="M14 2.5V7h4.5" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3.2 2" />
  </svg>
);

export const GearIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="2.8" />
    <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18.1 5.9l-1.6 1.6M7.5 16.5l-1.6 1.6M18.1 18.1l-1.6-1.6M7.5 7.5 5.9 5.9" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

export const WarnIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 21.5 20h-19L12 3.5Z" />
    <path d="M12 10v4.2M12 17.3h.01" />
  </svg>
);

export const PencilIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 20h16" />
    <path d="M15.5 4.5a2 2 0 0 1 2.8 2.8L8.8 16.8l-4 1 1-4L15.5 4.5Z" />
  </svg>
);

export const TrashIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7h16" />
    <path d="M9 7V4.8c0-.44.36-.8.8-.8h4.4c.44 0 .8.36.8.8V7m3 0-.9 13.1a1.8 1.8 0 0 1-1.8 1.65H7.7a1.8 1.8 0 0 1-1.8-1.65L5 7h14Z" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="2.6" />
  </svg>
);

export const ChevronUpIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 15 12 8.5 18.5 15" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 9 12 15.5 18.5 9" />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="M20 20l-4.8-4.8" />
  </svg>
);

export const DownloadIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3v11.5" />
    <path d="M7.5 10.5 12 15l4.5-4.5" />
    <path d="M5 17.5v2.8a1.7 1.7 0 0 0 1.7 1.7h10.6a1.7 1.7 0 0 0 1.7-1.7v-2.8" />
  </svg>
);

export const ArchiveIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4" width="17" height="4.5" rx="0.5" />
    <path d="M5 8.5V19a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8.5" />
    <path d="M10.2 13h3.6" />
  </svg>
);

export const UndoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6.5v5.5h5.5" />
    <path d="M4.5 12a8 8 0 1 1 2.5 5.8" />
  </svg>
);

export const RedoIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20 6.5v5.5h-5.5" />
    <path d="M19.5 12a8 8 0 1 0-2.5 5.8" />
  </svg>
);

export const SunIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.6" />
    <path d="M12 2.5v2.3M12 19.2v2.3M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.5 12h2.3M19.2 12h2.3M4.4 19.6 6 18M18 6l1.6-1.6" />
  </svg>
);

export const MoonIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M20.5 13.8A9 9 0 1 1 10.2 3.5 7 7 0 0 0 20.5 13.8Z" />
  </svg>
);

export const LaptopIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="11.5" rx="1" />
    <path d="M1.5 19.5h21" />
  </svg>
);

export const XIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M18.5 5.5 5.5 18.5M5.5 5.5l13 13" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4.5v15M4.5 12h15" />
  </svg>
);

export const SpinnerIcon = (p: IconProps) => (
  <svg {...base(p)} className={`animate-spin ${p.className ?? ''}`}>
    <path d="M12 2.5v4.2" />
    <path d="M12 17.3v4.2" opacity="0.3" />
    <path d="M4.2 4.2l3 3" opacity="0.55" />
    <path d="M16.8 16.8l3 3" opacity="0.15" />
    <path d="M2.5 12h4.2" opacity="0.7" />
    <path d="M17.3 12h4.2" opacity="0.4" />
    <path d="M4.2 19.8l3-3" opacity="0.85" />
    <path d="M16.8 7.2l3-3" opacity="0.15" />
  </svg>
);

export const FolderIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.2l2 2.2H19a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6.5Z" />
  </svg>
);

export const GripIcon = (p: IconProps) => (
  <svg {...base(p)} strokeWidth={0} fill="currentColor">
    <circle cx="9" cy="6" r="1.4" />
    <circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" />
    <circle cx="15" cy="18" r="1.4" />
  </svg>
);

export const DriveIcon = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.1 3.5h7.8l6 10.4-3.9 6.6H6l-3.9-6.6 6-10.4Z" />
    <path d="M8.1 3.5 12 10.3M15.9 3.5 20.9 12M6 20.5l3.9-6.5h8.2" />
  </svg>
);
