// Parametric Kun Troll character — ported verbatim from the approved spec (kuntroll.jsx).
// Anatomy is locked: wide low oval head, exactly 3 spikes, troll ears, close-set lime eyes,
// no nose/eyebrows/body. Five expressions; production rendering is Pebble (variant 'A').
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { TrollExpression, TrollVariant } from '../types';

const OUT = '#1A1A2E';
const VIOLET = '#6B28EE';
const LIME = '#C8FF00';
let UID = 0;

interface VariantSpec {
  headRx: number;
  headRy: number;
  outline: number;
  eyeR: number;
  irisR: number;
  pupilR: number;
  spikeW: number;
  spikeH: number;
  mouthW: number;
}

const VARIANTS: Record<TrollVariant, VariantSpec> = {
  A: { headRx: 72, headRy: 52, outline: 2.4, eyeR: 18, irisR: 14, pupilR: 6.2, spikeW: 22, spikeH: 38, mouthW: 55 }, // Pebble (default)
  C: { headRx: 74, headRy: 50, outline: 1.6, eyeR: 16, irisR: 12, pupilR: 5.2, spikeW: 18, spikeH: 32, mouthW: 50 }, // Quiet
  B: { headRx: 69, headRy: 54, outline: 3.6, eyeR: 20, irisR: 16, pupilR: 7.2, spikeW: 26, spikeH: 42, mouthW: 60 }, // Sticker
};

function starPath(cx: number, cy: number, r: number) {
  const ir = r * 0.34;
  const p: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : ir;
    p.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
  }
  return 'M' + p.join(' L') + ' Z';
}

function heartPath(cx: number, cy: number, s: number) {
  return `M ${cx} ${cy + s * 0.9} C ${cx - s * 1.4} ${cy - s * 0.4}, ${cx - s * 0.6} ${cy - s * 1.3}, ${cx} ${cy - s * 0.45} C ${cx + s * 0.6} ${cy - s * 1.3}, ${cx + s * 1.4} ${cy - s * 0.4}, ${cx} ${cy + s * 0.9} Z`;
}

function buildEye(ex: number, ey: number, v: VariantSpec, exp: TrollExpression, closed: boolean) {
  if (exp === 'love')
    return `<path d="${starPath(ex, ey, v.eyeR * 0.95)}" fill="${LIME}" stroke="${OUT}" stroke-width="${v.outline}" stroke-linejoin="round"/>`;
  if (closed) {
    const w = v.eyeR * 0.85;
    return `<path d="M ${ex - w} ${ey - 2} Q ${ex} ${ey + v.eyeR * 0.6} ${ex + w} ${ey - 2}" fill="none" stroke="${OUT}" stroke-width="${(v.outline + 0.6).toFixed(1)}" stroke-linecap="round"/>`;
  }
  const sc = exp === 'wow' ? 1.26 : 1;
  const R = v.eyeR * sc;
  const IR = v.irisR * sc;
  const PR = v.pupilR * sc;
  let s =
    `<circle cx="${ex}" cy="${ey}" r="${R.toFixed(1)}" fill="#fff" stroke="${OUT}" stroke-width="${v.outline}"/>` +
    `<circle cx="${ex}" cy="${ey}" r="${IR.toFixed(1)}" fill="${LIME}"/>` +
    `<circle cx="${ex}" cy="${ey}" r="${PR.toFixed(1)}" fill="#16161f"/>` +
    `<circle cx="${(ex + PR * 0.42).toFixed(1)}" cy="${(ey - PR * 0.5).toFixed(1)}" r="${(PR * 0.34).toFixed(1)}" fill="#fff"/>`;
  if (exp === 'sleepy') {
    const id = 'lid' + UID++;
    s +=
      `<clipPath id="${id}"><circle cx="${ex}" cy="${ey}" r="${R.toFixed(1)}"/></clipPath>` +
      `<g clip-path="url(#${id})"><rect x="${ex - R - 2}" y="${ey - R - 2}" width="${2 * R + 4}" height="${R * 1.55}" fill="${VIOLET}"/>` +
      `<line x1="${ex - R}" y1="${(ey - R * 0.45).toFixed(1)}" x2="${ex + R}" y2="${(ey - R * 0.45).toFixed(1)}" stroke="${OUT}" stroke-width="${v.outline}"/></g>` +
      `<circle cx="${ex}" cy="${ey}" r="${R.toFixed(1)}" fill="none" stroke="${OUT}" stroke-width="${v.outline}"/>`;
  }
  return s;
}

function buildMouth(v: VariantSpec, exp: TrollExpression, my: number) {
  const cx = 100;
  const w = v.mouthW;
  if (exp === 'wow')
    return `<ellipse cx="${cx}" cy="${my + 2}" rx="${(w * 0.17).toFixed(1)}" ry="${(w * 0.22).toFixed(1)}" fill="#2A1052" stroke="${OUT}" stroke-width="${v.outline}"/>`;
  if (exp === 'sleepy')
    return `<path d="M ${cx - w * 0.28} ${my} Q ${cx} ${my - 4} ${cx + w * 0.28} ${my}" fill="none" stroke="${OUT}" stroke-width="${(v.outline + 0.4).toFixed(1)}" stroke-linecap="round"/>`;
  if (exp === 'love')
    return `<path d="M ${cx - w * 0.55} ${my - 2} Q ${cx} ${my + w * 0.5} ${cx + w * 0.55} ${my - 2}" fill="none" stroke="${OUT}" stroke-width="${(v.outline + 0.4).toFixed(1)}" stroke-linecap="round"/>`;
  return `<path d="M ${cx - w * 0.5} ${my} Q ${cx} ${my + w * 0.32} ${cx + w * 0.5} ${my}" fill="none" stroke="${OUT}" stroke-width="${(v.outline + 0.4).toFixed(1)}" stroke-linecap="round"/>`;
}

export function buildTrollSVG(exp: TrollExpression, vkey: TrollVariant) {
  const v = VARIANTS[vkey] || VARIANTS.A;
  const cx = 100;
  const cy = 110;
  const headTop = cy - v.headRy;
  const baseY = headTop + 10;
  const sp = [
    { bx: cx - 28, hf: 0.86 },
    { bx: cx + 1, hf: 1.0 },
    { bx: cx + 27, hf: 0.9 },
  ];
  const spikes = sp
    .map((s) => {
      const w = v.spikeW;
      const h = v.spikeH * s.hf;
      const ax = s.bx + 5;
      const ay = baseY - h;
      return `<path d="M ${s.bx - w / 2} ${baseY} L ${ax} ${ay.toFixed(1)} L ${s.bx + w / 2} ${baseY} Z" fill="${VIOLET}" stroke="${OUT}" stroke-width="${v.outline}" stroke-linejoin="round"/>`;
    })
    .join('');
  const ex = v.headRx;
  const ears =
    `<path d="M ${cx - ex + 6} ${cy - 12} L ${cx - ex - 12} ${cy} L ${cx - ex + 6} ${cy + 12} Z" fill="${VIOLET}" stroke="${OUT}" stroke-width="${v.outline}" stroke-linejoin="round"/>` +
    `<path d="M ${cx + ex - 6} ${cy - 12} L ${cx + ex + 12} ${cy} L ${cx + ex - 6} ${cy + 12} Z" fill="${VIOLET}" stroke="${OUT}" stroke-width="${v.outline}" stroke-linejoin="round"/>`;
  const head = `<ellipse cx="${cx}" cy="${cy}" rx="${v.headRx}" ry="${v.headRy}" fill="${VIOLET}" stroke="${OUT}" stroke-width="${v.outline}"/>`;
  const gap = v.eyeR * 1.08;
  const eyeY = cy - 6;
  const eyes = `<g class="eyes">${buildEye(cx - gap, eyeY, v, exp, false)}${buildEye(cx + gap, eyeY, v, exp, exp === 'wink')}</g>`;
  const mouth = buildMouth(v, exp, cy + v.headRy * 0.52);
  let hearts = '';
  if (exp === 'love')
    hearts = `<g class="hearts"><path d="${heartPath(cx - 30, headTop - 14, 5)}" fill="${LIME}" stroke="${OUT}" stroke-width="1.2"/><path d="${heartPath(cx + 6, headTop - 30, 7)}" fill="${LIME}" stroke="${OUT}" stroke-width="1.2"/><path d="${heartPath(cx + 34, headTop - 16, 4)}" fill="${LIME}" stroke="${OUT}" stroke-width="1.2"/></g>`;
  const tilt = exp === 'wink' ? ` transform="rotate(5 100 110)"` : exp === 'wow' ? ` transform="rotate(-3 100 110)"` : '';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;overflow:visible"><g class="troll-body"${tilt}>${spikes}${ears}${head}${eyes}${mouth}</g>${hearts}</svg>`;
}

export interface TrollProps {
  exp?: TrollExpression;
  variant?: TrollVariant;
  size?: number;
  glow?: boolean;
  float?: boolean;
  blink?: boolean;
  presence?: 'subtle' | 'off';
  style?: CSSProperties;
  className?: string;
}

export function Troll({
  exp = 'happy',
  variant = 'A',
  size = 44,
  glow = false,
  float = true,
  blink = true,
  presence = 'subtle',
  style,
  className = '',
}: TrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pk, setPk] = useState(0);
  useEffect(() => {
    if (exp === 'wow' || exp === 'love') setPk((k) => k + 1);
  }, [exp]);
  useEffect(() => {
    if (!blink || presence === 'off' || !(exp === 'happy' || exp === 'wink')) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      const eyes = ref.current?.querySelector('.eyes');
      if (eyes) {
        eyes.classList.add('tblink');
        setTimeout(() => eyes.classList.remove('tblink'), 200);
      }
      t = setTimeout(loop, 5000 + Math.random() * 2000);
    };
    t = setTimeout(loop, 4000 + Math.random() * 3000);
    return () => clearTimeout(t);
  }, [exp, blink, presence]);
  if (presence === 'off') return null;
  const doFloat = float;
  const pulse = exp === 'wow' || exp === 'love';
  return (
    <div ref={ref} className={className} style={{ width: size, height: size, position: 'relative', flexShrink: 0, ...style }}>
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-45%',
            borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(107,40,238,0.42),transparent 68%)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      <div
        key={pk}
        className={(doFloat ? 'tfloat ' : '') + (pulse ? 'tpulse' : '')}
        style={{ width: '100%', height: '100%', position: 'relative', zIndex: 1 }}
        dangerouslySetInnerHTML={{ __html: buildTrollSVG(exp, variant) }}
      />
    </div>
  );
}
