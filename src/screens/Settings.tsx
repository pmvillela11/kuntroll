// Settings — devices, lights (+ hubs), organise, system (Activity/Diagnostics), app.
import { useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon, type IconName } from '../components/Icon';
import { Card, Mono, SectionLabel, Sheet, StatusDot, TopBar } from '../components/ui';
import { useStore, useTweaks } from '../store/store';
import type { Bridge, Device, RemoteStyle, TrollRendering } from '../types';

export function Settings({
  openDeviceSettings,
  openBridge,
  openScout,
  onAddRoom,
  onAddScene,
  onAddDevice,
  onReplay,
  onDiagnostics,
}: {
  openDeviceSettings: (d: Device) => void;
  openBridge: (b: Bridge) => void;
  openScout: () => void;
  onAddRoom: () => void;
  onAddScene: () => void;
  onAddDevice: () => void;
  onReplay: () => void;
  onDiagnostics: () => void;
}) {
  const devices = useStore((s) => s.devices);
  const bridges = useStore((s) => s.bridges);
  const { go, resetDemo } = useStore();
  const { remoteStyle, trollRendering, setTweak } = useTweaks();
  const [open, setOpen] = useState<Record<string, boolean>>({ devices: true, lights: false });
  const [prefsOpen, setPrefsOpen] = useState(false);
  const core = devices.filter((d) => d.type !== 'light');
  const lamps = devices.filter((d) => d.type === 'light');

  const Group = ({ id, header, count, items }: { id: string; header: string; count: number; items: Device[] }) => {
    const isOpen = open[id];
    return (
      <div style={{ marginBottom: 14 }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}>
            <Icon name={id === 'lights' ? 'light' : 'remote'} size={18} color={T.lime} />
            <div style={{ flex: 1, fontWeight: 900, fontSize: 15 }}>{header}</div>
            <Mono style={{ fontSize: 12, color: T.muted }}>{count}</Mono>
            <Icon name={isOpen ? 'chevU' : 'chevD'} size={18} color={T.muted} />
          </div>
          {isOpen && (
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              {items.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => openDeviceSettings(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '13px 16px',
                    borderBottom: i < items.length - 1 ? `1px solid ${T.border}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name={DEVICE_ICON[d.type]} size={18} color={d.status === 'online' ? T.lime : T.muted} />
                  <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{d.name}</div>
                  <Mono style={{ fontSize: 11, color: T.muted }}>{d.room}</Mono>
                  <Icon name="chevR" size={15} color={T.muted} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const LightsGroup = () => {
    const isOpen = open.lights;
    return (
      <div style={{ marginBottom: 14 }}>
        <Card pad={0} style={{ overflow: 'hidden' }}>
          <div onClick={() => setOpen((o) => ({ ...o, lights: !o.lights }))} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', cursor: 'pointer' }}>
            <Icon name="light" size={18} color={T.lime} />
            <div style={{ flex: 1, fontWeight: 900, fontSize: 15 }}>Lights</div>
            <Mono style={{ fontSize: 12, color: T.muted }}>{lamps.length}</Mono>
            <Icon name={isOpen ? 'chevU' : 'chevD'} size={18} color={T.muted} />
          </div>
          {isOpen && (
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              <div style={{ padding: '10px 16px 4px', fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>HUBS · {bridges.length}</div>
              {bridges.map((b) => (
                <div key={b.id} onClick={() => openBridge(b)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: `1px solid ${T.border}`, cursor: 'pointer' }}>
                  <Icon name="ir" size={18} color={T.aiViolet} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{b.name}</div>
                    <Mono style={{ fontSize: 11, color: T.muted }}>{b.ip}</Mono>
                  </div>
                  <StatusDot status={b.status} />
                  <Mono style={{ fontSize: 11, color: T.muted }}>{lamps.filter((l) => l.bridge === b.id).length} lights</Mono>
                  <Icon name="chevR" size={15} color={T.muted} />
                </div>
              ))}
              <div style={{ padding: '12px 16px 4px', fontFamily: T.mono, fontSize: 10, color: T.muted, letterSpacing: 1.5 }}>LIGHTS</div>
              {lamps.map((d, i) => (
                <div
                  key={d.id}
                  onClick={() => openDeviceSettings(d)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < lamps.length - 1 ? `1px solid ${T.border}` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Icon name="light" size={18} color={d.status === 'online' ? T.lime : T.muted} />
                  <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{d.name}</div>
                  <Mono style={{ fontSize: 11, color: T.muted }}>
                    B{d.bridge} · {d.room}
                  </Mono>
                  <Icon name="chevR" size={15} color={T.muted} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const Action = ({ icon, label, onClick, color }: { icon: IconName; label: string; onClick?: () => void; color?: string }) => (
    <Card pad={0} style={{ overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}>
        <Icon name={icon} size={18} color={color || T.lime} />
        <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{label}</div>
        <Icon name="chevR" size={15} color={T.muted} />
      </div>
    </Card>
  );

  const RadioRow = <V extends string>({ label, value, options, onChange }: { label: string; value: V; options: V[]; onChange: (v: V) => void }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            style={{
              padding: '9px 14px',
              borderRadius: 100,
              border: `1px solid ${value === o ? T.lime : T.border}`,
              background: value === o ? 'rgba(200,255,0,0.1)' : T.card2,
              color: value === o ? T.lime : T.muted,
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );

  const Row = ({ icon, label, onClick, color, last }: { icon: IconName; label: ReactNode; onClick?: () => void; color?: string; last?: boolean }) => (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        borderBottom: last ? 'none' : `1px solid ${T.border}`,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <Icon name={icon} size={18} color={color || T.muted} />
      <div style={{ flex: 1, fontWeight: 800, fontSize: 15, color: color === T.error ? T.error : T.text }}>{label}</div>
      {onClick && <Icon name="chevR" size={15} color={T.muted} />}
    </div>
  );

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <TopBar title="Settings" onBack={() => go('home')} />
      <SectionLabel style={{ margin: '0 4px 10px' }}>Devices</SectionLabel>
      <Group id="devices" header="Devices" count={core.length} items={core} />
      <LightsGroup />
      <Action icon="plus" label="Add a device" onClick={onAddDevice} />
      <SectionLabel style={{ margin: '18px 4px 10px' }}>Organise</SectionLabel>
      <Action icon="sofa" label="New room" onClick={onAddRoom} />
      <Action icon="sparkle" label="New scene" onClick={onAddScene} />
      <Action icon="bolt" label="Troll Scout" color={T.aiViolet} onClick={openScout} />
      <SectionLabel style={{ margin: '18px 4px 10px' }}>System</SectionLabel>
      <Action icon="scenes" label="Activity" onClick={() => go('activity')} />
      <Action icon="ir" label="Diagnostics" onClick={onDiagnostics} />
      <SectionLabel style={{ margin: '18px 4px 10px' }}>App</SectionLabel>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <Row icon="sparkle" label="Replay intro" onClick={onReplay} color={T.lime} />
        <Row icon="grid" label="Widgets" />
        <Row icon="settings" label="Preferences" onClick={() => setPrefsOpen(true)} />
        <Row icon="refresh" label="Reset demo data" onClick={resetDemo} color={T.error} last />
      </Card>
      <p style={{ textAlign: 'center', color: T.muted, fontSize: 12, fontWeight: 600, marginTop: 14 }}>Kun Troll — Homeware Hub · v1.0</p>

      {/* Preferences — design options (the prototype's tweaks): button feel + Troll rendering */}
      <Sheet open={prefsOpen} onClose={() => setPrefsOpen(false)} title="Preferences">
        <RadioRow<RemoteStyle> label="Button feel" value={remoteStyle} options={['flat', 'soft', 'tactile']} onChange={(v) => setTweak('remoteStyle', v)} />
        <RadioRow<TrollRendering> label="Kun Troll rendering" value={trollRendering} options={['Pebble', 'Quiet', 'Sticker']} onChange={(v) => setTweak('trollRendering', v)} />
      </Sheet>
    </div>
  );
}
