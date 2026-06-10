// Onboarding — 7-step first-run flow, hero Kun Troll. Ends by setting `seenOnboarding`.
import { useEffect, useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon, type IconName } from '../components/Icon';
import { Btn, Mono, haptic } from '../components/ui';
import { Troll } from '../components/Troll';
import { useTweaks, VARKEY } from '../store/store';
import type { TrollExpression } from '../types';

const FOUND = [
  { id: 'tv', type: 'tv', name: 'Samsung TV', model: 'QE75QN800BT', via: 'WebSocket LAN' },
  { id: 'rec', type: 'receiver', name: 'Yamaha Receiver', model: 'RX-A870', via: 'MusicCast' },
  { id: 'atv', type: 'appletv', name: 'Apple TV', model: 'Apple TV 4K', via: 'mDNS' },
  { id: 'hue', type: 'light', name: 'Hue Bridge', model: '2 bridges · 6 lights', via: 'Hue API' },
];

function Dots({ n, i }: { n: number; i: number }) {
  return (
    <div style={{ display: 'flex', gap: 7, justifyContent: 'center' }}>
      {Array.from({ length: n }).map((_, k) => (
        <div
          key={k}
          style={{ height: 6, borderRadius: 100, transition: 'all .3s', width: k === i ? 22 : 6, background: k === i ? T.lime : k < i ? T.violet : 'rgba(255,255,255,0.18)' }}
        />
      ))}
    </div>
  );
}

export function Onboarding({ onDone }: { onDone: () => void }) {
  const tv = VARKEY[useTweaks((s) => s.trollRendering)];
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [foundN, setFoundN] = useState(0);
  const [picked, setPicked] = useState(FOUND.map((f) => f.id));
  const [name, setName] = useState('');
  const [firing, setFiring] = useState(false);
  const N = 7;
  const go = (d: number) => {
    haptic();
    setStep((s) => Math.max(0, Math.min(N - 1, s + d)));
  };

  // step 3: run discovery animation
  useEffect(() => {
    if (step !== 3) return;
    setScanning(true);
    setFoundN(0);
    let k = 0;
    const iv = setInterval(() => {
      k++;
      setFoundN(k);
      haptic(8);
      if (k >= FOUND.length) {
        clearInterval(iv);
        setScanning(false);
      }
    }, 650);
    return () => clearInterval(iv);
  }, [step]);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const Hero = ({ exp = 'happy', size = 150, glow = true }: { exp?: TrollExpression; size?: number; glow?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Troll exp={exp} variant={tv} presence="subtle" size={size} glow={glow} />
    </div>
  );
  const Title = ({ children }: { children: ReactNode }) => (
    <div style={{ fontWeight: 900, fontSize: 27, letterSpacing: -0.6, textAlign: 'center', lineHeight: 1.12, marginTop: 20 }}>{children}</div>
  );
  const Sub = ({ children }: { children: ReactNode }) => (
    <p style={{ textAlign: 'center', color: T.muted, fontWeight: 600, fontSize: 15, margin: '12px auto 0', maxWidth: 300, lineHeight: 1.55 }}>{children}</p>
  );

  const STEPS: (() => ReactNode)[] = [
    // 0 — welcome
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="happy" size={168} />
        <Title>Meet Kun Troll</Title>
        <Sub>Your whole living room — every remote, every light, every scene — in one app. Hi. I'll get you set up in under three minutes.</Sub>
      </div>
    ),
    // 1 — the problem / promise
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="wink" size={140} />
        <Title>One app. Every device.</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '26px auto 0', maxWidth: 300, width: '100%' }}>
          {(
            [
              ['remote', 'Control any brand — TV, receiver, lights'],
              ['bolt', 'AI finds commands the library is missing'],
              ['scenes', 'One tap fires a whole-room scene'],
            ] as [IconName, string][]
          ).map(([ic, tx]) => (
            <div key={ic} style={{ display: 'flex', gap: 14, alignItems: 'center', background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={ic} size={20} color={T.lime} />
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{tx}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    // 2 — permissions
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="happy" size={130} />
        <Title>Let me see your network</Title>
        <Sub>I scan your local Wi-Fi to discover devices. Everything stays on your network — nothing leaves the house.</Sub>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '24px auto 0', maxWidth: 300, width: '100%' }}>
          {(
            [
              ['ir', 'Local network', 'Find devices on Wi-Fi'],
              ['plug', 'Smart home hubs', 'Connect Hue & more'],
            ] as [IconName, string, string][]
          ).map(([ic, t1, t2]) => (
            <div key={ic} style={{ display: 'flex', gap: 14, alignItems: 'center', background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
              <Icon name={ic} size={22} color={T.aiViolet} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{t1}</div>
                <Mono style={{ fontSize: 11, color: T.muted }}>{t2}</Mono>
              </div>
              <Icon name="check" size={18} color={T.success} />
            </div>
          ))}
        </div>
      </div>
    ),
    // 3 — discovery (animated)
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
          {scanning &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="ktring"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 130,
                  height: 130,
                  marginLeft: -65,
                  marginTop: -65,
                  border: `1.5px solid rgba(200,255,0,0.4)`,
                  borderRadius: '50%',
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          <Troll exp={scanning ? 'wink' : 'wow'} variant={tv} presence="subtle" size={130} glow />
        </div>
        <Title>{scanning ? 'Scanning your home…' : `Found ${FOUND.length} devices`}</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '22px auto 0', maxWidth: 320, width: '100%' }}>
          {FOUND.map((f, i) => {
            const shown = i < foundN;
            const on = picked.includes(f.id);
            return (
              <div
                key={f.id}
                onClick={() => shown && toggle(f.id)}
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'center',
                  background: T.card,
                  border: `1px solid ${on && shown ? T.borderStrong : T.border}`,
                  borderRadius: 14,
                  padding: '13px 15px',
                  cursor: shown ? 'pointer' : 'default',
                  opacity: shown ? 1 : 0.25,
                  transform: shown ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'all .35s',
                }}
              >
                <Icon name={DEVICE_ICON[f.type]} size={22} color={T.lime} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{f.name}</div>
                  <Mono style={{ fontSize: 11, color: T.muted }}>
                    {f.model} · {f.via}
                  </Mono>
                </div>
                {shown && (
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 7,
                      border: `1.5px solid ${on ? T.lime : T.border}`,
                      background: on ? T.lime : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {on && <Icon name="check" size={15} color="#16161f" />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),
    // 4 — name your home
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="happy" size={130} />
        <Title>Name your home</Title>
        <Sub>So your scenes and rooms feel like yours.</Sub>
        <div style={{ margin: '24px auto 0', maxWidth: 300, width: '100%' }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="The Loft"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: '15px 18px',
              color: T.text,
              fontFamily: T.sans,
              fontWeight: 800,
              fontSize: 18,
              outline: 'none',
              textAlign: 'center',
            }}
          />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            {['The Loft', 'Home', 'Apartment 4B'].map((s) => (
              <button
                key={s}
                onClick={() => setName(s)}
                style={{ padding: '8px 14px', borderRadius: 100, border: `1px solid ${T.border}`, background: T.card, color: T.muted, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
    // 5 — first scene (fire it)
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp={firing ? 'love' : 'wow'} size={140} />
        <Title>{firing ? 'Look at that.' : 'Try your first scene'}</Title>
        <Sub>{firing ? 'That just controlled four devices at once. This is what every tap can do.' : 'I built a few scenes from what I found. Tap one to fire it now.'}</Sub>
        {!firing && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '24px auto 0', maxWidth: 320, width: '100%' }}>
            {(
              [
                ['Cinema', 'film'],
                ['Good Night', 'moon'],
              ] as [string, IconName][]
            ).map(([nm, ic]) => (
              <div
                key={nm}
                onClick={() => {
                  haptic(15);
                  setFiring(true);
                }}
                style={{
                  background: 'linear-gradient(155deg,#2c2150,#211b3c)',
                  border: `1px solid ${T.border}`,
                  borderRadius: 18,
                  padding: 18,
                  cursor: 'pointer',
                  minHeight: 104,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(200,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={ic} size={22} color={T.lime} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{nm}</div>
              </div>
            ))}
          </div>
        )}
        {firing && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(74,222,128,0.12)', border: `1px solid rgba(74,222,128,0.3)`, borderRadius: 100, padding: '10px 18px' }}>
              <Icon name="check" size={16} color={T.success} />
              <span style={{ fontWeight: 800, fontSize: 14, color: T.success }}>Cinema fired · 4 devices</span>
            </div>
          </div>
        )}
      </div>
    ),
    // 6 — done
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="love" size={168} />
        <Title>You're all set{name ? `, ${name}` : ''}</Title>
        <Sub>Everything's on your home screen. Miss a device or a command? Troll Scout's got you — just ask me to find it.</Sub>
      </div>
    ),
  ];

  const last = step === N - 1;
  const canNext = step !== 3 || foundN >= FOUND.length;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 400,
        background: `radial-gradient(circle at 50% 22%, #221a3e, ${T.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        animation: 'ktFade .25s ease',
      }}
    >
      {/* skip */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '56px 20px 0' }}>
        {!last && (
          <button onClick={onDone} style={{ background: 'none', border: 'none', color: T.muted, fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: 6 }}>
            Skip
          </button>
        )}
      </div>
      {STEPS[step]()}
      {/* footer */}
      <div style={{ padding: '0 24px calc(26px + env(safe-area-inset-bottom))' }}>
        <div style={{ marginBottom: 20 }}>
          <Dots n={N} i={step} />
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {step > 0 && !last && (
            <Btn kind="ghost" onClick={() => go(-1)} style={{ width: 54, padding: '15px 0' }}>
              <Icon name="back" size={20} />
            </Btn>
          )}
          <Btn kind={last ? 'lime' : 'primary'} full onClick={() => (last ? onDone() : canNext && go(1))} style={{ opacity: canNext ? 1 : 0.5 }}>
            {last ? 'Enter my home' : step === 0 ? 'Get started' : step === 3 ? `Add ${picked.length} devices` : 'Continue'}
          </Btn>
        </div>
      </div>
    </div>
  );
}
