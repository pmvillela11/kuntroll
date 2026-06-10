import type { CSSProperties } from 'react';

// Custom 24×24 line icon set, ported 1:1 from the handoff (`ui.jsx` P map).
const P = {
  home: 'M3 11l9-8 9 8M5 9.5V21h5v-6h4v6h5V9.5',
  rooms: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  remote:
    'M9 2h6a2 2 0 012 2v16a2 2 0 01-2 2H9a2 2 0 01-2-2V4a2 2 0 012-2zM12 6.5v.01M12 11a1.5 1.5 0 100 3 1.5 1.5 0 000-3z',
  scenes: 'M12 3l1.8 4.6L18.5 9l-4 3 1.3 5L12 14.8 8.2 17l1.3-5-4-3 4.7-1.4z',
  settings:
    'M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a7.5 7.5 0 000-2l2-1.5-2-3.5-2.4 1a7.5 7.5 0 00-1.7-1l-.4-2.5h-4l-.4 2.5a7.5 7.5 0 00-1.7 1l-2.4-1-2 3.5L4.6 11a7.5 7.5 0 000 2l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 001.7 1l.4 2.5h4l.4-2.5a7.5 7.5 0 001.7-1l2.4 1 2-3.5z',
  tv: 'M3 5h18v11H3zM8 20h8M12 16v4',
  receiver:
    'M5 3h14a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1zM12 9a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM8 6.5h.01M12 6.5h.01',
  light: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.3 1 2.5h6c0-1.2.3-1.8 1-2.5A6 6 0 0012 3z',
  appletv: 'M3 4h18v13H3zM8 21h8M10 8.5l5 3-5 3z',
  ir: 'M12 12v.01M8.5 8.5a5 5 0 000 7M15.5 8.5a5 5 0 010 7M5.5 5.5a9 9 0 000 13M18.5 5.5a9 9 0 010 13',
  power: 'M12 4v8M7.5 7a7 7 0 109 0',
  volup: 'M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14',
  voldown: 'M11 5L6 9H3v6h3l5 4zM16 9.5l5 5M21 9.5l-5 5',
  mute: 'M11 5L6 9H3v6h3l5 4zM16 9.5l5 5M21 9.5l-5 5',
  chevR: 'M9 6l6 6-6 6',
  chevL: 'M15 6l-6 6 6 6',
  chevU: 'M6 15l6-6 6 6',
  chevD: 'M6 9l6 6 6-6',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  play: 'M7 4l13 8-13 8z',
  pause: 'M8 5v14M16 5v14',
  rew: 'M11 6L4 12l7 6zM20 6l-7 6 7 6z',
  ff: 'M13 6l7 6-7 6zM4 6l7 6-7 6z',
  heart: 'M12 20s-7-4.6-9.5-9A5 5 0 0112 5a5 5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z',
  heartFill: 'M12 20s-7-4.6-9.5-9A5 5 0 0112 5a5 5 0 019.5 6c-2.5 4.4-9.5 9-9.5 9z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3',
  check: 'M5 13l4 4 10-11',
  x: 'M6 6l12 12M18 6L6 18',
  drag: 'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01',
  edit: 'M4 20h4L18.5 9.5a2 2 0 00-3-3L5 17v3zM14 7l3 3',
  back: 'M15 5l-7 7 7 7',
  sparkle: 'M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3',
  refresh: 'M20 11a8 8 0 10-2 6M20 5v6h-6',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cancel: 'M12 3a9 9 0 100 18 9 9 0 000-18zM9 9l6 6M15 9l-6 6',
  plug: 'M9 2v6M15 2v6M7 8h10v3a5 5 0 01-10 0zM12 16v6',
  film: 'M3 8h18v12H3zM3 8l3-4h12l3 4M8 4l-2 4M14 4l-2 4',
  moon: 'M20.5 14.5A8 8 0 119.5 3.5a6.5 6.5 0 0011 11z',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M5.6 5.6L4.2 4.2M19.8 19.8l-1.4-1.4M18.4 5.6l1.4-1.4M4.2 19.8l1.4-1.4M12 7a5 5 0 100 10 5 5 0 000-10z',
  note: 'M9 18V6l11-2v12M9 18a3 3 0 11-6 0 3 3 0 016 0zM20 16a3 3 0 11-6 0 3 3 0 016 0z',
  sofa: 'M5 11V8a3 3 0 013-3h8a3 3 0 013 3v3M3 12a2 2 0 014 0v3h10v-3a2 2 0 014 0v5H3zM6 19v2M18 19v2',
  bed: 'M3 18V7M3 13h18v5M21 18v-5a3 3 0 00-3-3h-7v3M6 13v-1a1 1 0 011-1h2a1 1 0 011 1v1',
  kitchen:
    'M6 3v7M4 3v3a2 2 0 004 0V3M6 10v11M16 3c-1.7 0-2.5 2.2-2.5 4.5S14.3 12 16 12s2.5-2.2 2.5-4.5S17.7 3 16 3zM16 12v9',
  lightoff: 'M3 3l18 18M9 18h6M10 21h4M8.5 13.8A6 6 0 0112 3a6 6 0 014 10.5c-.7.7-1 1.3-1 2.5',
} as const;

export type IconName = keyof typeof P;

export const DEVICE_ICON: Record<string, IconName> = {
  tv: 'tv',
  receiver: 'receiver',
  light: 'light',
  appletv: 'appletv',
  ir: 'ir',
};

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  sw?: number;
  style?: CSSProperties;
  fill?: boolean;
}

export function Icon({ name, size = 24, color, sw = 2, style, fill = false }: IconProps) {
  const d = P[name] || '';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ? color || 'currentColor' : 'none'}
      stroke={fill ? 'none' : color || 'currentColor'}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      {name === 'heartFill' ? <path d={P.heart} fill={color || 'currentColor'} stroke="none" /> : <path d={d} />}
    </svg>
  );
}
