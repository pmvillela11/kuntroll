// Onboarding — intro-only first-run flow (5 steps). Adds nothing to the home;
// it ends on the empty dashboard, optionally jumping straight into Add Device.
import { useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { Icon, type IconName } from '../components/Icon';
import { Btn, Mono, haptic } from '../components/ui';
import { Troll } from '../components/Troll';
import { useStore, useTweaks, VARKEY } from '../store/store';
import type { TrollExpression } from '../types';

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

export function Onboarding({ onDone }: { onDone: (addFirstDevice: boolean) => void }) {
  const tv = VARKEY[useTweaks((s) => s.trollRendering)];
  const { setHomeName } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(useStore.getState().homeName);
  const N = 5;
  const go = (d: number) => {
    haptic();
    setStep((s) => Math.max(0, Math.min(N - 1, s + d)));
  };
  const finish = (addFirstDevice: boolean) => {
    setHomeName(name.trim());
    onDone(addFirstDevice);
  };

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
    // 1 — the promise
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
        <Sub>When you add a device I scan your local Wi-Fi to find it. Everything stays on your network — nothing leaves the house.</Sub>
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
    // 3 — name your home
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
    // 4 — done → add first device
    () => (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 8px' }}>
        <Hero exp="love" size={168} />
        <Title>You're in{name.trim() ? `, welcome to ${name.trim()}` : ''}</Title>
        <Sub>Your home is a blank canvas. Let's find your first device — your TV, receiver or a Hue Bridge — and build from there.</Sub>
      </div>
    ),
  ];

  const last = step === N - 1;
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
          <button onClick={() => finish(false)} style={{ background: 'none', border: 'none', color: T.muted, fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: 6 }}>
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
          <Btn kind={last ? 'lime' : 'primary'} full onClick={() => (last ? finish(true) : go(1))}>
            {last ? 'Add my first device' : step === 0 ? 'Get started' : 'Continue'}
          </Btn>
        </div>
        {last && (
          <button
            onClick={() => finish(false)}
            style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: T.muted, fontWeight: 800, fontSize: 14, cursor: 'pointer', padding: 6 }}
          >
            I'll look around first
          </button>
        )}
      </div>
    </div>
  );
}
