// Shared UI primitives — typed port of the handoff's ui.jsx. Visuals are locked; match exactly.
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from 'react';
import { T } from '../design/tokens';
import { Icon } from './Icon';
import { Troll } from './Troll';
import type { DeviceStatus, TrollExpression, TrollVariant, CommandSource } from '../types';

export function haptic(ms = 8) {
  if (navigator.vibrate)
    try {
      navigator.vibrate(ms);
    } catch {
      /* unsupported */
    }
}

type PressEvent = ReactMouseEvent<HTMLElement> | ReactTouchEvent<HTMLElement>;

// Unified tactile press: spread onto any tappable element.
export function pressable(scale = 0.97) {
  const down = (e: PressEvent) => {
    (e.currentTarget as HTMLElement).style.transform = `scale(${scale})`;
  };
  const up = (e: PressEvent) => {
    (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
  };
  return {
    onMouseDown: down,
    onMouseUp: up,
    onMouseLeave: up,
    onTouchStart: down,
    onTouchEnd: up,
    onTouchCancel: up,
  };
}

export function Mono({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span style={{ fontFamily: T.mono, ...style }}>{children}</span>;
}

// ---- TweenNumber: animated count to target ----
export function TweenNumber({
  value,
  dur = 380,
  format = (v: number) => Math.round(v),
}: {
  value: number;
  dur?: number;
  format?: (v: number) => ReactNode;
}) {
  const [disp, setDisp] = useState(value);
  const ref = useRef({ from: value, to: value, start: 0, raf: 0 });
  useEffect(() => {
    const s = ref.current;
    s.from = disp;
    s.to = value;
    s.start = performance.now();
    cancelAnimationFrame(s.raf);
    const tick = (now: number) => {
      const t = Math.min(1, (now - s.start) / dur);
      const e = 1 - Math.pow(1 - t, 3); // easeOutCubic
      setDisp(s.from + (s.to - s.from) * e);
      if (t < 1) s.raf = requestAnimationFrame(tick);
    };
    s.raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(s.raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{format(disp)}</>;
}

// ---- EmptyState: Troll + line + optional action ----
export function EmptyState({
  exp = 'sleepy',
  title,
  sub,
  action,
  onAction,
  variant = 'A',
  compact = false,
}: {
  exp?: TrollExpression;
  title: ReactNode;
  sub?: ReactNode;
  action?: ReactNode;
  onAction?: () => void;
  variant?: TrollVariant;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: compact ? '20px 16px' : '34px 24px',
      }}
    >
      <div style={{ opacity: 0.92, marginBottom: 6 }}>
        <Troll exp={exp} variant={variant} presence="subtle" size={compact ? 64 : 88} />
      </div>
      <div style={{ fontWeight: 900, fontSize: compact ? 16 : 18, marginTop: 6 }}>{title}</div>
      {sub && (
        <div style={{ color: T.muted, fontWeight: 600, fontSize: 13.5, marginTop: 7, maxWidth: 260, lineHeight: 1.5 }}>
          {sub}
        </div>
      )}
      {action && (
        <button
          onClick={onAction}
          {...pressable()}
          style={{
            marginTop: 18,
            display: 'inline-flex',
            gap: 7,
            alignItems: 'center',
            background: T.violet,
            border: 'none',
            borderRadius: 100,
            padding: '11px 20px',
            color: '#fff',
            fontFamily: T.sans,
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
            transition: 'transform .14s cubic-bezier(.2,.9,.3,1)',
          }}
        >
          <Icon name="plus" size={16} />
          {action}
        </button>
      )}
    </div>
  );
}

// ---- Card (tactile when clickable) ----
export function Card({
  children,
  style,
  onClick,
  active = false,
  pad = 16,
}: {
  children: ReactNode;
  style?: CSSProperties;
  onClick?: () => void;
  active?: boolean;
  pad?: number;
}) {
  const press = onClick ? pressable() : {};
  return (
    <div
      onClick={onClick}
      {...press}
      style={{
        background: T.card,
        border: `1px solid ${active ? T.borderStrong : T.border}`,
        borderRadius: 20,
        padding: pad,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .14s cubic-bezier(.2,.9,.3,1)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- Pill button ----
export function Btn({
  children,
  onClick,
  kind = 'primary',
  style,
  full = false,
}: {
  children: ReactNode;
  onClick?: (e: ReactMouseEvent<HTMLButtonElement>) => void;
  kind?: 'primary' | 'lime' | 'ghost' | 'danger';
  style?: CSSProperties;
  full?: boolean;
}) {
  const base: CSSProperties = {
    border: 'none',
    borderRadius: 100,
    fontFamily: T.sans,
    fontWeight: 800,
    fontSize: 16,
    whiteSpace: 'nowrap',
    padding: '14px 24px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: full ? '100%' : 'auto',
    transition: 'transform .12s, filter .15s',
    WebkitTapHighlightColor: 'transparent',
  };
  const kinds: Record<string, CSSProperties> = {
    primary: { background: T.violet, color: '#fff' },
    lime: { background: T.lime, color: '#16161f' },
    ghost: { background: 'transparent', color: T.text, border: `1px solid ${T.border}` },
    danger: { background: 'rgba(248,113,113,0.14)', color: T.error },
  };
  return (
    <button
      onClick={(e) => {
        haptic();
        onClick?.(e);
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      style={{ ...base, ...kinds[kind], ...style }}
    >
      {children}
    </button>
  );
}

// ---- SourceBadge / ConfidenceDots ----
export function SourceBadge({ source }: { source: CommandSource }) {
  const map: Record<CommandSource, [string, string]> = {
    manual: [T.success, 'manual'],
    library: [T.lime, 'library'],
    ai_fetched: [T.aiViolet, 'ai_fetched'],
  };
  const [c, label] = map[source] || map.library;
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontSize: 10,
        fontWeight: 700,
        color: c,
        border: `1px solid ${c}55`,
        background: `${c}1a`,
        borderRadius: 100,
        padding: '2px 8px',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </span>
  );
}

export function ConfidenceDots({ level }: { level: number }) {
  // 1..3
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          style={{ width: 6, height: 6, borderRadius: '50%', background: i <= level ? T.lime : 'rgba(255,255,255,0.18)' }}
        />
      ))}
    </span>
  );
}

// ---- Toggle ----
export function Toggle({ on, onChange, size = 1 }: { on: boolean; onChange?: (v: boolean) => void; size?: number }) {
  return (
    <div
      onClick={() => {
        haptic();
        onChange?.(!on);
      }}
      style={{
        width: 46 * size,
        height: 28 * size,
        borderRadius: 100,
        background: on ? T.lime : '#3a3a55',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .2s',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3 * size,
          left: on ? 46 * size - 25 * size : 3 * size,
          width: 22 * size,
          height: 22 * size,
          borderRadius: '50%',
          background: on ? '#16161f' : '#fff',
          transition: 'left .2s',
        }}
      />
    </div>
  );
}

// ---- Slider (drag/tap) ----
export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  accent,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  accent?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const acc = accent || T.lime;
  const set = (clientX: number) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    let p = (clientX - r.left) / r.width;
    p = Math.max(0, Math.min(1, p));
    onChange(Math.round(min + p * (max - min)));
  };
  const onDown = (e: ReactMouseEvent | ReactTouchEvent) => {
    haptic();
    set('touches' in e ? e.touches[0].clientX : e.clientX);
    const mv = (ev: MouseEvent | TouchEvent) => set('touches' in ev ? ev.touches[0].clientX : ev.clientX);
    const up = () => {
      window.removeEventListener('mousemove', mv);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', mv);
      window.removeEventListener('touchend', up);
    };
    window.addEventListener('mousemove', mv);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', mv, { passive: false });
    window.addEventListener('touchend', up);
  };
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div
      ref={ref}
      onMouseDown={onDown}
      onTouchStart={onDown}
      style={{
        height: 36,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.08)',
        position: 'relative',
        cursor: 'pointer',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: acc, opacity: 0.9, transition: 'width .05s' }}
      />
      <div
        style={{
          position: 'absolute',
          left: `calc(${pct}% - 3px)`,
          top: 4,
          bottom: 4,
          width: 6,
          borderRadius: 4,
          background: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}

// ---- Bottom sheet ----
export function Sheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        background: 'rgba(8,8,18,0.6)',
        backdropFilter: 'blur(2px)',
        animation: 'ktFade .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: T.card,
          borderRadius: '28px 28px 0 0',
          padding: '10px 20px calc(20px + env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.8)',
          maxHeight: '82%',
          overflow: 'auto',
          animation: 'ktSlideUp .26s cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <div style={{ width: 38, height: 5, borderRadius: 100, background: 'rgba(255,255,255,0.2)', margin: '4px auto 14px' }} />
        {title && <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 14 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// ---- Status dot ----
export function StatusDot({ status }: { status: DeviceStatus | 'idle' }) {
  const c = status === 'online' ? T.success : status === 'offline' ? T.error : T.warning;
  return (
    <span
      style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block', boxShadow: `0 0 6px ${c}` }}
    />
  );
}

// ---- Top bar with back button ----
export function TopBar({
  title,
  onBack,
  right,
  sub,
}: {
  title: ReactNode;
  onBack?: () => void;
  right?: ReactNode;
  sub?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '2px 16px 14px' }}>
      {onBack && (
        <button
          onClick={() => {
            haptic();
            onBack();
          }}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="back" size={20} />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {sub && <div style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>{sub}</div>}
        <div
          style={{
            fontWeight: 900,
            fontSize: 26,
            letterSpacing: -0.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.15,
          }}
        >
          {title}
        </div>
      </div>
      {right}
    </div>
  );
}

// ---- Small pill button used in headers (Edit / New / Done) ----
export function PillButton({
  onClick,
  active = false,
  children,
  style,
}: {
  onClick?: () => void;
  active?: boolean;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={() => {
        haptic();
        onClick?.();
      }}
      style={{
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: active ? T.lime : T.card,
        border: `1px solid ${active ? T.lime : T.border}`,
        borderRadius: 100,
        padding: '8px 14px',
        color: active ? '#16161f' : T.text,
        fontWeight: 800,
        fontSize: 13,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ---- mono section sub-heading ----
export function SectionLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: T.mono,
        fontSize: 11,
        color: T.muted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
