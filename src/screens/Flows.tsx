// Builders: AddDevice (discover → type/brand → name/room → commands) + SceneBuilder.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon, type IconName } from '../components/Icon';
import { Btn, Card, Mono, Sheet, haptic } from '../components/ui';
import { Troll } from '../components/Troll';
import { useStore, useTweaks, VARKEY } from '../store/store';
import type { Device, DeviceType, Scene, SceneStep } from '../types';

const TYPES: { type: DeviceType; label: string }[] = [
  { type: 'tv', label: 'TV' },
  { type: 'receiver', label: 'Receiver / Amp' },
  { type: 'appletv', label: 'Streamer' },
  { type: 'light', label: 'Light' },
  { type: 'ir', label: 'IR device' },
];
const BRANDS: Record<DeviceType, string[]> = {
  tv: ['Samsung', 'LG', 'Sony', 'TCL', 'Hisense', 'Other'],
  receiver: ['Yamaha', 'Denon', 'Marantz', 'Onkyo', 'Sonos', 'Other'],
  appletv: ['Apple TV', 'Roku', 'Fire TV', 'Chromecast', 'Other'],
  light: ['Philips Hue', 'LIFX', 'Nanoleaf', 'Govee', 'Other'],
  ir: ['Generic IR', 'Broadlink', 'Global Caché', 'Other'],
};
const DISCOVERED: { id: string; type: DeviceType; name: string; model: string; via: string }[] = [
  { id: 'd1', type: 'tv', name: 'Samsung TV', model: 'UE55 (untitled)', via: '192.168.1.88' },
  { id: 'd2', type: 'light', name: 'Hue · 2 new lights', model: 'Hallway, Office', via: 'Bridge 1' },
];

function StepHead({ step, total, onBack, onClose, title }: { step: number; total: number; onBack: () => void; onClose: () => void; title: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '56px 16px 6px' }}>
        <button
          onClick={step === 0 ? onClose : onBack}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={step === 0 ? 'x' : 'back'} size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <Mono style={{ fontSize: 11, color: T.lime, letterSpacing: 1.5 }}>
            STEP {step + 1} / {total}
          </Mono>
          <div style={{ fontWeight: 900, fontSize: 21, letterSpacing: -0.4, marginTop: 1 }}>{title}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 6 }}>
          <Icon name="x" size={20} />
        </button>
      </div>
      <div style={{ display: 'flex', gap: 5, padding: '8px 20px 0' }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i <= step ? T.lime : 'rgba(255,255,255,0.12)', transition: 'background .3s' }} />
        ))}
      </div>
    </>
  );
}

// ---------- ADD DEVICE ----------
export function AddDevice({ onClose, openScout }: { onClose: () => void; openScout: (prefill: { brand: string; model: string }) => void }) {
  const rooms = useStore((s) => s.rooms);
  const { addNewDevice } = useStore();
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];
  const [step, setStep] = useState(0);
  const [scanning, setScanning] = useState(true);
  const [shown, setShown] = useState(0);
  const [type, setType] = useState<DeviceType | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [room, setRoom] = useState(rooms[0] ? rooms[0].name : '');
  const N = 4;
  const addedRef = useRef<Device | null>(null);

  useEffect(() => {
    if (step !== 0) return;
    setScanning(true);
    setShown(0);
    let k = 0;
    const iv = setInterval(() => {
      k++;
      setShown(k);
      haptic(8);
      if (k >= DISCOVERED.length) {
        clearInterval(iv);
        setScanning(false);
      }
    }, 800);
    return () => clearInterval(iv);
  }, [step]);

  const back = () => setStep((s) => Math.max(0, s - 1));
  const pickDiscovered = (d: (typeof DISCOVERED)[number]) => {
    setType(d.type);
    setBrand(d.name.split(' ')[0]);
    setName(d.name);
    setStep(2);
  };

  function finish(): Device {
    if (addedRef.current) return addedRef.current;
    const id = (type || 'dev') + Date.now();
    const dev: Device = {
      id,
      type: type || 'ir',
      name: name || `${brand || 'New'} device`,
      model: brand || 'Manual',
      room,
      status: 'online',
      protocol: '—',
      ip: '192.168.1.x',
      port: '—',
      state:
        type === 'light'
          ? { on: false, brightness: 60, temp: 2700 }
          : type === 'tv'
            ? { power: false, source: 'HDMI1', volume: 30, muted: false }
            : type === 'receiver'
              ? { power: false, input: 'Apple TV', volume: 30, muted: false, soundMode: 'Movie' }
              : type === 'appletv'
                ? { power: false, app: 'Home' }
                : {},
    };
    addedRef.current = dev;
    addNewDevice(dev);
    return dev;
  }

  const body: (() => ReactNode)[] = [
    // 0 — discover
    () => (
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
          {scanning &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="ktring"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: 110,
                  height: 110,
                  marginLeft: -55,
                  marginTop: -55,
                  border: `1.5px solid rgba(200,255,0,0.4)`,
                  borderRadius: '50%',
                  animationDelay: `${i * 0.8}s`,
                }}
              />
            ))}
          <Troll exp={scanning ? 'wink' : 'wow'} variant={trollVariant} presence="subtle" size={104} glow />
        </div>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 18, marginBottom: 4 }}>{scanning ? 'Looking for new devices…' : 'New on your network'}</div>
        <p style={{ textAlign: 'center', color: T.muted, fontWeight: 600, fontSize: 13, marginBottom: 18 }}>Tap one to add it, or set it up manually below.</p>
        {DISCOVERED.map((d, i) => {
          const vis = i < shown;
          return (
            <Card
              key={d.id}
              pad={14}
              onClick={() => {
                if (vis) pickDiscovered(d);
              }}
              style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 10, opacity: vis ? 1 : 0.25, transform: vis ? 'none' : 'translateY(8px)', transition: 'all .35s' }}
            >
              <Icon name={DEVICE_ICON[d.type]} size={22} color={T.lime} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>{d.name}</div>
                <Mono style={{ fontSize: 11, color: T.muted }}>
                  {d.model} · {d.via}
                </Mono>
              </div>
              <Icon name="plus" size={20} color={T.lime} />
            </Card>
          );
        })}
        <Btn kind="ghost" full style={{ marginTop: 6 }} onClick={() => setStep(1)}>
          <Icon name="edit" size={16} /> Add manually
        </Btn>
      </div>
    ),
    // 1 — type + brand
    () => (
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ fontSize: 13, color: T.muted, fontWeight: 700, marginBottom: 10 }}>Device type</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          {TYPES.map((tp) => (
            <button
              key={tp.type}
              onClick={() => {
                setType(tp.type);
                setBrand(null);
              }}
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'center',
                padding: '14px',
                borderRadius: 14,
                border: `1px solid ${type === tp.type ? T.lime : T.border}`,
                background: type === tp.type ? 'rgba(200,255,0,0.08)' : T.card,
                color: T.text,
                cursor: 'pointer',
              }}
            >
              <Icon name={DEVICE_ICON[tp.type]} size={20} color={type === tp.type ? T.lime : T.muted} />
              <span style={{ fontWeight: 800, fontSize: 14 }}>{tp.label}</span>
            </button>
          ))}
        </div>
        {type && (
          <>
            <div style={{ fontSize: 13, color: T.muted, fontWeight: 700, marginBottom: 10 }}>Brand</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {BRANDS[type].map((b) => (
                <button
                  key={b}
                  onClick={() => setBrand(b)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 100,
                    border: `1px solid ${brand === b ? T.lime : T.border}`,
                    background: brand === b ? 'rgba(200,255,0,0.1)' : T.card,
                    color: brand === b ? T.lime : T.text,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {b}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    ),
    // 2 — name + room
    () => (
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={(type && DEVICE_ICON[type]) || 'remote'} size={32} color={T.lime} />
          </div>
        </div>
        <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${brand || ''} ${type || ''}`.trim()}
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
            marginBottom: 18,
          }}
        />
        <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>Room</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => setRoom(r.name)}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 100,
                border: `1px solid ${room === r.name ? T.lime : T.border}`,
                background: room === r.name ? 'rgba(200,255,0,0.1)' : T.card,
                color: room === r.name ? T.lime : T.text,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Icon name={r.icon} size={15} />
              {r.name}
            </button>
          ))}
        </div>
      </div>
    ),
    // 3 — commands
    () => (
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Troll exp="happy" variant={trollVariant} presence="subtle" size={92} glow />
        </div>
        <div style={{ textAlign: 'center', fontWeight: 900, fontSize: 19 }}>How should I learn its commands?</div>
        <p style={{ textAlign: 'center', color: T.muted, fontWeight: 600, fontSize: 13, margin: '8px auto 20px', maxWidth: 280 }}>
          Most {brand || 'devices'} are in the library. If not, Troll Scout searches the web.
        </p>
        {(
          [
            ['library', 'Use the command library', 'Instant · works for most devices', 'check', T.success],
            ['scout', 'Search with Troll Scout', 'AI finds commands online', 'bolt', T.aiViolet],
          ] as [string, string, string, IconName, string][]
        ).map(([id, t1, t2, ic, c]) => (
          <Card
            key={id}
            pad={16}
            style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12, cursor: 'pointer' }}
            onClick={() => {
              finish();
              if (id === 'scout') {
                onClose();
                setTimeout(() => openScout({ brand: brand || '', model: name }), 50);
              } else {
                onClose();
              }
            }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${c}1a`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={ic} size={22} color={c} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{t1}</div>
              <Mono style={{ fontSize: 11, color: T.muted }}>{t2}</Mono>
            </div>
            <Icon name="chevR" size={18} color={T.muted} />
          </Card>
        ))}
      </div>
    ),
  ];

  const canNext = step === 1 ? !!(type && brand) : step === 2 ? !!name.trim() : true;
  const titles = ['Add a device', 'What is it?', 'Name & room', 'Commands'];
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 380, background: T.bg, display: 'flex', flexDirection: 'column', animation: 'ktFade .2s ease' }}>
      <StepHead step={step} total={N} onBack={back} onClose={onClose} title={titles[step]} />
      {body[step]()}
      {step < 3 && (
        <div style={{ padding: '8px 20px calc(22px + env(safe-area-inset-bottom))' }}>
          <Btn
            kind="primary"
            full
            onClick={() => {
              if (step === 2) {
                finish();
                setStep(3);
              } else if (canNext) setStep((s) => s + 1);
            }}
            style={{ opacity: canNext ? 1 : 0.5 }}
          >
            {step === 2 ? 'Add device' : 'Continue'}
          </Btn>
        </div>
      )}
    </div>
  );
}

// ---------- SCENE BUILDER ----------
const ACTIONS: Record<DeviceType, [string, string][]> = {
  tv: [
    ['power_on', 'Turn on'],
    ['power_off', 'Turn off'],
    ['source', 'Set source'],
    ['volume', 'Set volume'],
    ['app', 'Open app'],
  ],
  receiver: [
    ['power_on', 'Turn on'],
    ['power_off', 'Turn off'],
    ['input', 'Set input'],
    ['volume', 'Set volume'],
    ['mode', 'Sound mode'],
  ],
  appletv: [
    ['wake', 'Wake'],
    ['sleep', 'Sleep'],
    ['app', 'Open app'],
    ['play', 'Play / Pause'],
  ],
  light: [
    ['on', 'Turn on'],
    ['off', 'Turn off'],
    ['brightness', 'Set brightness'],
    ['temp', 'Set warmth'],
  ],
  ir: [['cmd', 'Send command']],
};

function defaultLabel(dev: Device, action: string) {
  const m: Record<string, string> = {
    power_on: 'Turn on',
    power_off: 'Turn off',
    on: 'Turn on',
    off: 'Turn off',
    wake: 'Wake',
    sleep: 'Sleep',
    source: 'Set source',
    input: 'Set input',
    volume: 'Set volume',
    brightness: 'Set brightness',
    temp: 'Set warmth',
    mode: 'Sound mode',
    app: 'Open app',
    play: 'Play',
    cmd: 'Send command',
  };
  return `${dev.name} · ${m[action] || action}`;
}

type BuilderStep = SceneStep & { key: string; action: string };

export function SceneBuilder({ existing, onClose }: { existing: Scene | null; onClose: () => void }) {
  const devices = useStore((s) => s.devices).filter((d) => d.type !== 'ir');
  const { saveScene } = useStore();
  const isEdit = !!existing;
  const [name, setName] = useState(existing ? existing.name : '');
  const [icon, setIcon] = useState<IconName>(existing ? existing.icon : 'sparkle');
  const [steps, setSteps] = useState<BuilderStep[]>(
    existing ? existing.steps.map((s, i) => ({ ...s, key: 'k' + i, action: s.action || 'power_on' })) : [],
  );
  const [picker, setPicker] = useState(false);
  const [editStep, setEditStep] = useState<string | null>(null);
  const ICONS: IconName[] = ['film', 'moon', 'sun', 'note', 'power', 'bolt', 'sparkle', 'light'];
  const dmap = Object.fromEntries(devices.map((d) => [d.id, d]));

  const addStep = (dev: Device) => {
    const action = ACTIONS[dev.type][0][0];
    setSteps((s) => [...s, { key: 'k' + Date.now(), device: dev.id, action, label: defaultLabel(dev, action), delay: s.length ? 300 : 0 }]);
    setPicker(false);
  };
  const removeStep = (key: string) => setSteps((s) => s.filter((x) => x.key !== key));
  const move = (from: number, to: number) =>
    setSteps((s) => {
      const a = [...s];
      const [m] = a.splice(from, 1);
      a.splice(to, 0, m);
      return a;
    });
  const patchStep = (key: string, patch: Partial<BuilderStep>) => setSteps((s) => s.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  function save() {
    if (!name.trim() || !steps.length) return;
    saveScene({
      id: existing ? existing.id : 'scene' + Date.now(),
      name: name.trim(),
      icon,
      prebuilt: existing ? existing.prebuilt : false,
      favourite: existing ? existing.favourite : false,
      lastFired: existing ? existing.lastFired : '—',
      steps: steps.map(({ key: _key, ...rest }) => rest),
    });
    onClose();
  }

  const [dragKey, setDragKey] = useState<string | null>(null);
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 380, background: T.bg, display: 'flex', flexDirection: 'column', animation: 'ktFade .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '56px 16px 10px' }}>
        <button
          onClick={onClose}
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            background: T.card,
            border: `1px solid ${T.border}`,
            color: T.text,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="x" size={20} />
        </button>
        <div style={{ flex: 1, fontWeight: 900, fontSize: 21, letterSpacing: -0.4 }}>{isEdit ? 'Edit scene' : 'New scene'}</div>
        <button
          onClick={save}
          style={{
            background: steps.length && name.trim() ? T.lime : T.card,
            border: `1px solid ${steps.length && name.trim() ? T.lime : T.border}`,
            borderRadius: 100,
            padding: '9px 18px',
            color: steps.length && name.trim() ? '#16161f' : T.muted,
            fontWeight: 800,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '8px 20px 20px' }}>
        {/* name + icon */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 22, alignItems: 'center' }}>
          <button
            onClick={() => {
              const i = ICONS.indexOf(icon);
              setIcon(ICONS[(i + 1) % ICONS.length]);
            }}
            style={{
              width: 58,
              height: 58,
              borderRadius: 16,
              flexShrink: 0,
              background: 'linear-gradient(150deg,#2c2150,#211b3c)',
              border: `1px solid ${T.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <Icon name={icon} size={26} color={T.lime} />
          </button>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Scene name"
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box',
              background: T.card,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              padding: '15px 16px',
              color: T.text,
              fontFamily: T.sans,
              fontWeight: 800,
              fontSize: 17,
              outline: 'none',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          {ICONS.map((ic) => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                border: `1px solid ${icon === ic ? T.lime : T.border}`,
                background: icon === ic ? 'rgba(200,255,0,0.1)' : T.card,
                color: icon === ic ? T.lime : T.muted,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={ic} size={18} />
            </button>
          ))}
        </div>

        {/* steps */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Steps</div>
          <Mono style={{ fontSize: 12, color: T.muted }}>{steps.length} · runs top to bottom</Mono>
        </div>

        {steps.length === 0 && (
          <div style={{ textAlign: 'center', color: T.muted, fontWeight: 600, fontSize: 13, padding: '24px 0', border: `1px dashed ${T.border}`, borderRadius: 16, marginBottom: 14 }}>
            No steps yet. Add a device action below.
          </div>
        )}

        {steps.map((st, i) => {
          const dev = dmap[st.device];
          if (!dev) return null;
          return (
            <div
              key={st.key}
              draggable
              onDragStart={() => setDragKey(st.key)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragKey) {
                  const from = steps.findIndex((x) => x.key === dragKey);
                  move(from, i);
                  setDragKey(null);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: T.card,
                border: `1px solid ${T.border}`,
                borderRadius: 14,
                padding: '12px 14px',
                marginBottom: 10,
                cursor: 'grab',
              }}
            >
              <Icon name="drag" size={18} color={T.aiViolet} />
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={DEVICE_ICON[dev.type]} size={17} color={T.lime} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }} onClick={() => setEditStep(st.key)}>
                <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.label}</div>
                <Mono style={{ fontSize: 11, color: T.muted }}>
                  {dev.name}
                  {st.delay ? ` · +${st.delay}ms` : ' · immediate'}
                </Mono>
              </div>
              <button onClick={() => setEditStep(st.key)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4 }}>
                <Icon name="settings" size={18} />
              </button>
              <button onClick={() => removeStep(st.key)} style={{ background: 'none', border: 'none', color: T.error, cursor: 'pointer', padding: 4 }}>
                <Icon name="x" size={18} />
              </button>
            </div>
          );
        })}

        <Btn kind="ghost" full style={{ marginTop: 4 }} onClick={() => setPicker(true)}>
          <Icon name="plus" size={18} color={T.lime} /> Add step
        </Btn>
      </div>

      {/* device picker */}
      <Sheet open={picker} onClose={() => setPicker(false)} title="Add a device step">
        {devices.map((d) => (
          <div key={d.id} onClick={() => addStep(d)} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '13px 4px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
            <Icon name={DEVICE_ICON[d.type]} size={20} color={T.lime} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{d.name}</div>
              <Mono style={{ fontSize: 11, color: T.muted }}>{d.room}</Mono>
            </div>
            <Icon name="plus" size={18} color={T.muted} />
          </div>
        ))}
      </Sheet>

      {/* step editor */}
      <Sheet open={!!editStep} onClose={() => setEditStep(null)} title="Step">
        {editStep &&
          (() => {
            const st = steps.find((x) => x.key === editStep);
            if (!st) return null;
            const dev = dmap[st.device];
            if (!dev) return null;
            return (
              <div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name={DEVICE_ICON[dev.type]} size={20} color={T.lime} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{dev.name}</div>
                    <Mono style={{ fontSize: 11, color: T.muted }}>{dev.room}</Mono>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 8 }}>Action</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                  {ACTIONS[dev.type].map(([a, lab]) => (
                    <button
                      key={a}
                      onClick={() => patchStep(st.key, { action: a, label: defaultLabel(dev, a) })}
                      style={{
                        padding: '9px 14px',
                        borderRadius: 100,
                        border: `1px solid ${st.action === a ? T.lime : T.border}`,
                        background: st.action === a ? 'rgba(200,255,0,0.1)' : T.card,
                        color: st.action === a ? T.lime : T.text,
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {lab}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 8 }}>Label</div>
                <input
                  value={st.label}
                  onChange={(e) => patchStep(st.key, { label: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: T.card2,
                    border: `1px solid ${T.border}`,
                    borderRadius: 12,
                    padding: '12px 14px',
                    color: T.text,
                    fontFamily: T.sans,
                    fontWeight: 800,
                    fontSize: 15,
                    outline: 'none',
                    marginBottom: 20,
                  }}
                />
                <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 8 }}>
                  Delay before this step · <span style={{ color: T.lime }}>{st.delay}ms</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="100"
                  value={st.delay}
                  onChange={(e) => patchStep(st.key, { delay: parseInt(e.target.value) })}
                  style={{ width: '100%', accentColor: T.lime, marginBottom: 20 }}
                />
                <Btn kind="lime" full onClick={() => setEditStep(null)}>
                  Done
                </Btn>
              </div>
            );
          })()}
      </Sheet>
    </div>
  );
}
