// Control — the active device's remote + scene pills + always-visible main volume.
import { useState, type CSSProperties, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon } from '../components/Icon';
import { Card, EmptyState, Mono, Sheet, Slider, Toggle, TopBar, TweenNumber, haptic } from '../components/ui';
import { SOUND_MODES, SOURCES } from '../data/constants';
import { useStore, useTweaks, VARKEY } from '../store/store';
import type { Device, RemoteStyle } from '../types';

function btnStyle(feel: RemoteStyle, active?: boolean): CSSProperties {
  const base: CSSProperties = {
    borderRadius: 10,
    border: 'none',
    cursor: 'pointer',
    color: T.text,
    fontFamily: T.sans,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform .1s, background .15s, box-shadow .15s',
    WebkitTapHighlightColor: 'transparent',
  };
  if (feel === 'flat') return { ...base, background: active ? T.violet : '#2b2b48' };
  if (feel === 'soft')
    return {
      ...base,
      background: active ? 'linear-gradient(160deg,#7b38ff,#5a20cc)' : 'linear-gradient(160deg,#30304f,#262640)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.35)',
    };
  return {
    ...base,
    background: active ? '#6B28EE' : '#2e2e4d',
    boxShadow: active ? '0 2px 0 #3d1599, 0 5px 12px rgba(0,0,0,0.5)' : '0 3px 0 #15152a, 0 5px 12px rgba(0,0,0,0.45)',
  };
}

function RBtn({
  feel,
  active,
  onClick,
  children,
  style,
}: {
  feel: RemoteStyle;
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <button
      style={{ ...btnStyle(feel, active), ...style }}
      onClick={() => {
        haptic();
        onClick?.();
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = feel === 'tactile' ? 'translateY(2px)' : 'scale(0.96)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'none')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
    >
      {children}
    </button>
  );
}

function ReadoutBar({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <div style={{ display: 'flex', gap: 18, justifyContent: 'center', padding: '8px 0 4px' }}>
      {items.map((it, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <Mono style={{ fontSize: 18, color: T.lime, fontWeight: 700, display: 'block' }}>{it.v}</Mono>
          <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 0.5 }}>{it.k}</span>
        </div>
      ))}
    </div>
  );
}

type Update = (id: string, patch: Record<string, unknown>) => void;

// ---------- TV ----------
function TVRemote({ d, update, feel, act, sources }: { d: Device; update: Update; feel: RemoteStyle; act: () => void; sources: string[] }) {
  const [pickSrc, setPickSrc] = useState(false);
  const s = d.state;
  const cmd = (p: Record<string, unknown>) => {
    update(d.id, p);
    act();
  };
  return (
    <div style={{ padding: '4px 6px 20px' }}>
      <ReadoutBar items={[{ k: 'SOURCE', v: s.power ? s.source : '—' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <RBtn feel={feel} active={s.power} onClick={() => cmd({ power: !s.power })} style={{ width: 56, height: 56, borderRadius: '50%' }}>
          <Icon name="power" size={24} color={s.power ? '#fff' : T.error} />
        </RBtn>
        <RBtn feel={feel} onClick={() => setPickSrc(true)} style={{ flex: 1, height: 48, margin: '0 12px', gap: 8 }}>
          <Icon name="tv" size={18} /> Source
        </RBtn>
        <RBtn feel={feel} onClick={act} style={{ width: 56, height: 56, borderRadius: '50%' }}>
          <Icon name="back" size={22} />
        </RBtn>
      </div>
      <div
        style={{
          position: 'relative',
          width: 220,
          height: 220,
          margin: '22px auto',
          borderRadius: '50%',
          background: feel === 'flat' ? '#23233c' : 'radial-gradient(circle at 50% 35%,#2f2f50,#1f1f38)',
          boxShadow: feel === 'tactile' ? '0 6px 16px rgba(0,0,0,0.5)' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        {(
          [
            ['chevU', 'up'],
            ['chevD', 'down'],
            ['chevL', 'left'],
            ['chevR', 'right'],
          ] as const
        ).map((p, i) => {
          const pos: CSSProperties =
            p[1] === 'up'
              ? { top: 12, left: '50%', transform: 'translateX(-50%)' }
              : p[1] === 'down'
                ? { bottom: 12, left: '50%', transform: 'translateX(-50%)' }
                : p[1] === 'left'
                  ? { left: 12, top: '50%', transform: 'translateY(-50%)' }
                  : { right: 12, top: '50%', transform: 'translateY(-50%)' };
          return (
            <button
              key={i}
              onClick={() => {
                haptic();
                act();
              }}
              style={{ position: 'absolute', ...pos, background: 'none', border: 'none', cursor: 'pointer', color: T.text, padding: 8 }}
            >
              <Icon name={p[0]} size={24} />
            </button>
          );
        })}
        <RBtn
          feel={feel}
          onClick={act}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 78,
            height: 78,
            borderRadius: '50%',
            fontSize: 15,
            fontWeight: 900,
            background: feel === 'flat' ? T.violet : undefined,
          }}
        >
          OK
        </RBtn>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['rew', 'play', 'ff'] as const).map((n) => (
          <RBtn
            key={n}
            feel={feel}
            onClick={() => {
              haptic();
              act();
            }}
            style={{ flex: 1, height: 48 }}
          >
            <Icon name={n} size={20} fill={n === 'play'} />
          </RBtn>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10, marginTop: 14 }}>
        {(
          [
            ['Netflix', '#E50914'],
            ['YouTube', '#FF0000'],
            ['Home', T.violet],
            ['Menu', '#555'],
          ] as const
        ).map((sc) => (
          <button
            key={sc[0]}
            onClick={() => {
              haptic();
              act();
            }}
            style={{
              height: 46,
              borderRadius: 12,
              border: `1px solid ${T.border}`,
              background: T.card,
              color: T.text,
              fontFamily: T.sans,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc[1] }} />
            {sc[0]}
          </button>
        ))}
      </div>
      <Sheet open={pickSrc} onClose={() => setPickSrc(false)} title="Source">
        {sources.map((src) => (
          <div
            key={src}
            onClick={() => {
              cmd({ source: src });
              setPickSrc(false);
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 4px',
              borderBottom: `1px solid ${T.border}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 16 }}>{src}</span>
            {s.source === src && <Icon name="check" size={20} color={T.lime} />}
          </div>
        ))}
      </Sheet>
    </div>
  );
}

// ---------- RECEIVER ----------
function ReceiverRemote({
  d,
  update,
  feel,
  act,
  sources,
  soundModes,
}: {
  d: Device;
  update: Update;
  feel: RemoteStyle;
  act: () => void;
  sources: string[];
  soundModes: string[];
}) {
  const [pickIn, setPickIn] = useState(false);
  const [zone2, setZone2] = useState(false);
  const s = d.state;
  const cmd = (p: Record<string, unknown>) => {
    update(d.id, p);
    act();
  };
  return (
    <div style={{ padding: '4px 6px 20px' }}>
      <ReadoutBar
        items={[
          { k: 'INPUT', v: s.input },
          { k: 'MODE', v: s.soundMode },
        ]}
      />
      <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
        <RBtn feel={feel} active={s.power} onClick={() => cmd({ power: !s.power })} style={{ width: 60, height: 52 }}>
          <Icon name="power" size={22} color={s.power ? '#fff' : T.error} />
        </RBtn>
        <RBtn feel={feel} onClick={() => setPickIn(true)} style={{ flex: 1, height: 52, gap: 8 }}>
          <Icon name="receiver" size={18} />
          {s.input}
        </RBtn>
      </div>
      <div style={{ marginTop: 18 }}>
        <div style={{ fontSize: 13, color: T.muted, fontWeight: 700, marginBottom: 10 }}>Sound mode</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {soundModes.map((m) => (
            <button
              key={m}
              onClick={() => cmd({ soundMode: m })}
              style={{
                padding: '10px 16px',
                borderRadius: 100,
                border: `1px solid ${s.soundMode === m ? T.lime : T.border}`,
                background: s.soundMode === m ? 'rgba(200,255,0,0.12)' : T.card,
                color: s.soundMode === m ? T.lime : T.text,
                fontFamily: T.sans,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 18 }}>
        <Card pad={14} style={{ cursor: 'pointer' }} onClick={() => setZone2((z) => !z)}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Zone 2</div>
            <Icon name={zone2 ? 'chevU' : 'chevD'} size={18} color={T.muted} />
          </div>
          {zone2 && (
            <div style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center' }} onClick={(e) => e.stopPropagation()}>
              <Toggle on={false} onChange={act} />
              <div style={{ flex: 1 }}>
                <Slider value={20} onChange={() => {}} accent={T.violet} />
              </div>
              <Mono style={{ fontSize: 13, color: T.muted }}>20%</Mono>
            </div>
          )}
        </Card>
      </div>
      <Sheet open={pickIn} onClose={() => setPickIn(false)} title="Input">
        {sources.map((src) => (
          <div
            key={src}
            onClick={() => {
              cmd({ input: src });
              setPickIn(false);
            }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '14px 4px',
              borderBottom: `1px solid ${T.border}`,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 800, fontSize: 16 }}>{src}</span>
            {s.input === src && <Icon name="check" size={20} color={T.lime} />}
          </div>
        ))}
      </Sheet>
    </div>
  );
}

// ---------- APPLE TV (large swipe trackpad) ----------
function AppleTVRemote({ feel, act }: { feel: RemoteStyle; act: () => void }) {
  return (
    <div style={{ padding: '8px 6px 20px' }}>
      <div
        onClick={() => {
          haptic();
          act();
        }}
        style={{
          height: 356,
          borderRadius: 24,
          margin: '6px 0 18px',
          cursor: 'pointer',
          background: feel === 'flat' ? '#23233c' : 'radial-gradient(circle at 50% 40%,#30304f,#1d1d36)',
          border: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <span style={{ fontFamily: T.mono, fontSize: 12, color: T.muted, letterSpacing: 1 }}>SWIPE TO NAVIGATE</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <RBtn feel={feel} onClick={act} style={{ flex: 1, height: 52 }}>
          <Icon name="back" size={20} />
        </RBtn>
        <RBtn feel={feel} onClick={act} style={{ flex: 1, height: 52, gap: 8 }}>
          <Icon name="play" size={18} fill /> Play
        </RBtn>
        <RBtn feel={feel} onClick={act} style={{ flex: 1, height: 52 }}>
          <Icon name="home" size={20} />
        </RBtn>
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        <RBtn feel={feel} onClick={act} style={{ flex: 1, height: 52, gap: 8 }}>
          <Icon name="sparkle" size={18} color={T.lime} /> Siri
        </RBtn>
        <RBtn feel={feel} onClick={act} style={{ flex: 1, height: 52, gap: 8 }}>
          <Icon name="search" size={18} /> Search
        </RBtn>
      </div>
    </div>
  );
}

// ---------- LAMP ----------
function LampRemote({ d, update, feel, act }: { d: Device; update: Update; feel: RemoteStyle; act: () => void }) {
  const s = d.state;
  return (
    <div style={{ padding: '8px 6px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 22px' }}>
        <RBtn
          feel={feel}
          active={s.on}
          onClick={() => {
            update(d.id, { on: !s.on });
            act();
          }}
          style={{ width: 96, height: 96, borderRadius: '50%' }}
        >
          <Icon name="light" size={40} color={s.on ? T.lime : T.muted} />
        </RBtn>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Brightness</span>
        <Mono style={{ fontSize: 14, color: T.lime }}>
          <TweenNumber value={s.brightness ?? 0} />%
        </Mono>
      </div>
      <Slider value={s.brightness ?? 0} onChange={(v) => update(d.id, { brightness: v })} />
      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0 8px' }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Warmth</span>
        <Mono style={{ fontSize: 14, color: T.lime }}>
          <TweenNumber value={s.temp ?? 2700} />K
        </Mono>
      </div>
      <Slider value={s.temp ?? 2700} min={2200} max={6500} onChange={(v) => update(d.id, { temp: v })} accent={T.warning} />
    </div>
  );
}

export function Controller({ openAddDevice }: { openAddDevice: () => void }) {
  const devices = useStore((s) => s.devices);
  const scenes = useStore((s) => s.scenes);
  const mainId = useStore((s) => s.mainId);
  const volId = useStore((s) => s.volId);
  const { updateDevice, runScene, back, setMainId, setVolId } = useStore();
  const feel = useTweaks((s) => s.remoteStyle);
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];
  const [setMainOpen, setSetMainOpen] = useState(false);
  const [firedPill, setFiredPill] = useState<string | null>(null);

  // controller buttons: haptic only — Troll reserved for scenes/lights/device events
  const act = () => haptic();
  const update: Update = (id, patch) => updateDevice(id, patch);

  const controllable = devices.filter((d) => d.type !== 'ir');
  const volCapable = devices.filter((d) => typeof d.state.volume === 'number');
  const d = devices.find((x) => x.id === mainId);
  const vd = devices.find((x) => x.id === volId);

  if (controllable.length === 0) {
    return (
      <div style={{ minHeight: '100%' }}>
        <TopBar title="Control" onBack={back} />
        <div style={{ padding: '40px 20px' }}>
          <EmptyState
            exp="sleepy"
            variant={trollVariant}
            title="Nothing to control yet"
            sub="Add your TV, receiver or lights and their remote appears right here."
            action="Add a device"
            onAction={openAddDevice}
          />
        </div>
      </div>
    );
  }

  let body;
  if (!d) body = <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>Pick a device.</div>;
  else if (d.type === 'tv') body = <TVRemote d={d} update={update} feel={feel} act={act} sources={SOURCES.tv} />;
  else if (d.type === 'receiver') body = <ReceiverRemote d={d} update={update} feel={feel} act={act} sources={SOURCES.rec} soundModes={SOUND_MODES} />;
  else if (d.type === 'appletv') body = <AppleTVRemote feel={feel} act={act} />;
  else if (d.type === 'light') body = <LampRemote d={d} update={update} feel={feel} act={act} />;
  else body = <div style={{ padding: 40, textAlign: 'center', color: T.muted }}>No controller for this device.</div>;

  const vs = vd ? vd.state : null;
  const vol = vs ? vs.volume || 0 : 0;
  const setVol = (v: number) => {
    if (!vd) return;
    update(vd.id, { volume: Math.max(0, Math.min(100, v)), muted: false });
    act();
  };

  return (
    <div style={{ minHeight: '100%' }}>
      <TopBar
        title={d ? d.name : 'Control'}
        sub={d ? d.model : ''}
        onBack={back}
        right={
          <button
            onClick={() => {
              haptic();
              setSetMainOpen(true);
            }}
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: T.card,
              border: `1px solid ${T.border}`,
              color: T.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="remote" size={18} />
          </button>
        }
      />

      {/* scene pills */}
      <div style={{ display: 'flex', gap: 8, padding: '0 20px 12px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {scenes.map((s) => (
          <button
            key={s.id}
            className={firedPill === s.id ? 'ktPulse' : ''}
            onClick={() => {
              haptic(12);
              setFiredPill(s.id);
              setTimeout(() => setFiredPill(null), 750);
              runScene(s.id);
            }}
            style={{
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              padding: '8px 14px',
              borderRadius: 100,
              whiteSpace: 'nowrap',
              border: `1px solid ${T.border}`,
              background: T.card,
              color: T.text,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            <Icon name={s.icon} size={15} color={T.lime} />
            {s.name}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 14px' }}>
        {/* always-visible main volume */}
        {vd && vs && (
          <div style={{ position: 'sticky', top: 0, zIndex: 6, background: T.bg, paddingBottom: 10, marginBottom: 6 }}>
            <Card pad={12} style={{ borderColor: T.borderStrong }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon name={DEVICE_ICON[vd.type]} size={16} color={T.lime} />
                  <span style={{ fontWeight: 800, fontSize: 13 }}>{vd.name} · volume</span>
                </div>
                <Mono style={{ fontSize: 15, color: T.lime }}>{vs.muted ? 'MUTE' : <TweenNumber value={vol} />}</Mono>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <RBtn feel={feel} onClick={() => setVol(vol - 2)} style={{ width: 46, height: 42 }}>
                  <Icon name="minus" size={20} />
                </RBtn>
                <div style={{ flex: 1 }}>
                  <Slider value={vol} onChange={setVol} />
                </div>
                <RBtn feel={feel} onClick={() => setVol(vol + 2)} style={{ width: 46, height: 42 }}>
                  <Icon name="plus" size={20} />
                </RBtn>
                <RBtn
                  feel={feel}
                  active={vs.muted}
                  onClick={() => {
                    update(vd.id, { muted: !vs.muted });
                    act();
                  }}
                  style={{ width: 46, height: 42 }}
                >
                  <Icon name="mute" size={18} color={vs.muted ? T.lime : T.text} />
                </RBtn>
              </div>
            </Card>
          </div>
        )}
        {body}
      </div>

      <Sheet open={setMainOpen} onClose={() => setSetMainOpen(false)} title="Main controller">
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 10 }}>Which device's screen is main</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {controllable.map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setMainId(x.id);
                setSetMainOpen(false);
              }}
              style={{
                display: 'flex',
                gap: 7,
                alignItems: 'center',
                padding: '9px 14px',
                borderRadius: 100,
                border: `1px solid ${d && x.id === d.id ? T.lime : T.border}`,
                background: d && x.id === d.id ? 'rgba(200,255,0,0.1)' : T.card2,
                color: d && x.id === d.id ? T.lime : T.text,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Icon name={DEVICE_ICON[x.type]} size={15} />
              {x.name}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 10 }}>Main volume source</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {volCapable.map((x) => (
            <button
              key={x.id}
              onClick={() => {
                setVolId(x.id);
                setSetMainOpen(false);
              }}
              style={{
                display: 'flex',
                gap: 7,
                alignItems: 'center',
                padding: '9px 14px',
                borderRadius: 100,
                border: `1px solid ${vd && x.id === vd.id ? T.lime : T.border}`,
                background: vd && x.id === vd.id ? 'rgba(200,255,0,0.1)' : T.card2,
                color: vd && x.id === vd.id ? T.lime : T.text,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Icon name={DEVICE_ICON[x.type]} size={15} />
              {x.name}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
