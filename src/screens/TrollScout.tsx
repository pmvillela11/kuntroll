// Troll Scout — AI device-command discovery with a mandatory test-before-save gate.
import { useEffect, useState } from 'react';
import { T } from '../design/tokens';
import { Icon } from '../components/Icon';
import { Btn, ConfidenceDots, Mono, SourceBadge, haptic } from '../components/ui';
import { Troll } from '../components/Troll';
import { findCommands } from '../lib/scout';
import { useTweaks, VARKEY } from '../store/store';
import type { ScoutCommand } from '../types';

const SOURCE_LINES = ['Checking manufacturer docs…', 'Searching IRDB.tk…', 'Reading RemoteCentral…', 'Scanning GitHub repos…', 'Home Assistant community…'];
const FROM_LABEL: Record<string, string> = { official: 'Official docs', community: 'Community', forum: 'Forum' };
const CONF_FROM: Record<string, number> = { official: 3, community: 2, forum: 1 };

type Phase = 'idle' | 'searching' | 'results' | 'notfound' | 'error';
type TestState = 'testing' | 'ask' | 'pass' | 'fail';

export function TrollScout({
  prefill,
  onClose,
  onSave,
}: {
  prefill: { brand: string; model: string } | null;
  onClose: () => void;
  onSave: (cmds: ScoutCommand[], brand: string, model: string) => void;
}) {
  const variant = VARKEY[useTweaks((s) => s.trollRendering)];
  const [brand, setBrand] = useState(prefill ? prefill.brand : 'Yamaha');
  const [model, setModel] = useState(prefill ? prefill.model : 'RX-A870');
  const [phase, setPhase] = useState<Phase>('idle');
  const [line, setLine] = useState(0);
  const [cmds, setCmds] = useState<ScoutCommand[]>([]);
  const [tested, setTested] = useState<Record<number, TestState>>({});
  const [confirmed, setConfirmed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (phase !== 'searching') return;
    const iv = setInterval(() => setLine((l) => (l + 1) % SOURCE_LINES.length), 1100);
    return () => clearInterval(iv);
  }, [phase]);

  async function search() {
    haptic(12);
    setPhase('searching');
    setLine(0);
    setCmds([]);
    setTested({});
    setConfirmed({});
    try {
      const found = await findCommands(brand, model);
      if (!found || !found.length) {
        setPhase('notfound');
        return;
      }
      setCmds(found);
      setPhase('results');
      haptic(20);
    } catch {
      setPhase('error');
    }
  }

  function test(i: number) {
    setTested((t) => ({ ...t, [i]: 'testing' }));
    setTimeout(() => setTested((t) => ({ ...t, [i]: 'ask' })), 850);
  }
  const confirmedCount = Object.values(confirmed).filter(Boolean).length;

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 300, background: T.bg, display: 'flex', flexDirection: 'column', animation: 'ktFade .2s ease' }}>
      {/* top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '62px 16px 8px' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>
          <Icon name="x" size={24} />
        </button>
        <div style={{ fontFamily: T.mono, fontSize: 12, color: T.lime, letterSpacing: 1.5, fontWeight: 700 }}>TROLL SCOUT</div>
      </div>

      {/* IDLE — editable device */}
      {phase === 'idle' && (
        <div style={{ flex: 1, overflow: 'auto', padding: '10px 24px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 18px' }}>
            <Troll exp="happy" variant={variant} presence="subtle" size={108} glow />
          </div>
          <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 24, letterSpacing: -0.5 }}>Find device commands</div>
          <p style={{ textAlign: 'center', color: T.muted, fontWeight: 600, fontSize: 14, margin: '8px auto 22px', maxWidth: 280, lineHeight: 1.5 }}>
            No library match? Troll Scout searches the web for control commands. You confirm before anything saves.
          </p>
          {(
            [
              ['Brand', brand, setBrand, 'Yamaha'],
              ['Model', model, setModel, 'RX-A870'],
            ] as const
          ).map(([lab, val, set, ph]) => (
            <div key={lab} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>{lab}</label>
              <input
                value={val}
                onChange={(e) => set(e.target.value)}
                placeholder={ph}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: T.card,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: T.text,
                  fontFamily: T.sans,
                  fontWeight: 800,
                  fontSize: 16,
                  outline: 'none',
                }}
              />
            </div>
          ))}
          <Btn kind="primary" full style={{ marginTop: 8 }} onClick={search}>
            <Icon name="search" size={18} /> Search the web
          </Btn>
        </div>
      )}

      {/* SEARCHING */}
      {phase === 'searching' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 30 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="ktring"
                style={{ position: 'absolute', inset: 0, border: `1.5px solid rgba(200,255,0,0.4)`, borderRadius: '50%', animationDelay: `${i * 0.8}s` }}
              />
            ))}
            <Troll exp="wink" variant={variant} presence="subtle" size={120} glow />
          </div>
          <div style={{ fontWeight: 900, fontSize: 21, marginBottom: 14, lineHeight: 1.2 }}>Troll Scout is searching…</div>
          <Mono style={{ fontSize: 13, color: T.lime, display: 'block', minHeight: 20 }}>{SOURCE_LINES[line]}</Mono>
          <Mono style={{ fontSize: 11, color: T.muted, marginTop: 8, display: 'block' }}>
            {brand} {model}
          </Mono>
          <Btn kind="ghost" style={{ marginTop: 30 }} onClick={onClose}>
            Cancel
          </Btn>
        </div>
      )}

      {/* NOT FOUND */}
      {phase === 'notfound' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center' }}>
          <Troll exp="sleepy" variant={variant} presence="subtle" size={110} />
          <div style={{ fontWeight: 900, fontSize: 21, marginTop: 16 }}>Couldn't find commands</div>
          <p style={{ color: T.muted, fontWeight: 600, fontSize: 14, marginTop: 8, maxWidth: 260, lineHeight: 1.5 }}>
            Troll Scout came up empty for {brand} {model}. Add them manually?
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Btn kind="ghost" onClick={() => setPhase('idle')}>
              Try again
            </Btn>
            <Btn kind="primary" onClick={onClose}>
              Add manually
            </Btn>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 30, textAlign: 'center' }}>
          <Troll exp="sleepy" variant={variant} presence="subtle" size={110} />
          <div style={{ fontWeight: 900, fontSize: 21, marginTop: 16 }}>Search hit a snag</div>
          <p style={{ color: T.muted, fontWeight: 600, fontSize: 14, marginTop: 8, maxWidth: 260 }}>Couldn't reach the AI. Check the connection and try again.</p>
          <Btn kind="primary" style={{ marginTop: 24 }} onClick={() => setPhase('idle')}>
            Retry
          </Btn>
        </div>
      )}

      {/* RESULTS */}
      {phase === 'results' && (
        <>
          <div style={{ textAlign: 'center', padding: '4px 0 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Troll exp={confirmedCount > 0 ? 'happy' : 'wow'} variant={variant} presence="subtle" size={92} glow />
            </div>
            <div style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.3, padding: '0 24px' }}>Found {cmds.length} commands</div>
            <Mono style={{ fontSize: 12, color: T.muted }}>
              {brand} {model}
            </Mono>
          </div>
          <div style={{ padding: '0 16px 6px' }}>
            <div
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: `1px solid rgba(167,139,250,0.3)`,
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                gap: 10,
                alignItems: 'center',
              }}
            >
              <Icon name="bolt" size={16} color={T.aiViolet} />
              <span style={{ fontSize: 12.5, color: '#D8CCFF', fontWeight: 700 }}>Won't fire automatically. Test each, then save.</span>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: '10px 16px 8px' }}>
            {cmds.map((c, i) => {
              const ts = tested[i];
              const isConf = confirmed[i];
              return (
                <div
                  key={i}
                  style={{
                    background: T.card,
                    border: `1px solid ${isConf ? 'rgba(74,222,128,0.4)' : T.border}`,
                    borderRadius: 14,
                    padding: '12px 14px',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 5, flexWrap: 'wrap' }}>
                        <SourceBadge source="ai_fetched" />
                        <span style={{ fontSize: 10.5, color: T.muted, fontWeight: 700 }}>{FROM_LABEL[c.source]}</span>
                        <ConfidenceDots level={CONF_FROM[c.source]} />
                      </div>
                      {c.code && (
                        <Mono style={{ fontSize: 10.5, color: T.muted, display: 'block', marginTop: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.code}
                        </Mono>
                      )}
                    </div>
                    {ts === 'testing' ? (
                      <div
                        className="ktspin"
                        style={{ width: 20, height: 20, borderRadius: '50%', border: `2.5px solid rgba(200,255,0,0.25)`, borderTopColor: T.lime, margin: '0 8px' }}
                      />
                    ) : isConf ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: T.success, fontWeight: 800, fontSize: 12 }}>
                        <Icon name="check" size={16} />
                        Saved
                      </div>
                    ) : (
                      <button
                        onClick={() => test(i)}
                        style={{
                          background: T.violetSoft,
                          border: `1px solid ${T.border}`,
                          borderRadius: 100,
                          padding: '7px 14px',
                          color: T.text,
                          fontFamily: T.sans,
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        Test
                      </button>
                    )}
                  </div>
                  {ts === 'ask' && !isConf && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: T.muted }}>Did that work?</span>
                      <button
                        onClick={() => {
                          haptic();
                          setConfirmed((c2) => ({ ...c2, [i]: true }));
                        }}
                        style={{ background: 'rgba(74,222,128,0.15)', border: 'none', borderRadius: 100, padding: '7px 14px', color: T.success, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                      >
                        Yes, save
                      </button>
                      <button
                        onClick={() => setTested((t) => ({ ...t, [i]: 'fail' }))}
                        style={{ background: 'rgba(248,113,113,0.12)', border: 'none', borderRadius: 100, padding: '7px 14px', color: T.error, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ padding: '10px 16px calc(20px + env(safe-area-inset-bottom))', borderTop: `1px solid ${T.border}`, display: 'flex', gap: 10 }}>
            <Btn
              kind="ghost"
              style={{ flex: 1, padding: '13px' }}
              onClick={() => {
                haptic();
                onSave(
                  cmds.filter((_, i) => confirmed[i]),
                  brand,
                  model,
                );
                onClose();
              }}
            >
              <span>{`Save confirmed (${confirmedCount})`}</span>
            </Btn>
            <Btn
              kind="lime"
              style={{ flex: 1, padding: '13px' }}
              onClick={() => {
                haptic();
                onSave(cmds, brand, model);
                onClose();
              }}
            >
              <span>{`Save all (${cmds.length})`}</span>
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
