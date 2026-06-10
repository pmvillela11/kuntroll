// Hue Bridge config sheet — editable name/IP, lights on that hub, "Search for new lights".
import { useEffect, useState } from 'react';
import { T } from '../design/tokens';
import { Icon } from '../components/Icon';
import { Btn, Card, Mono, Sheet, StatusDot } from '../components/ui';
import { useStore } from '../store/store';
import type { Bridge } from '../types';

export function BridgeConfig({ bridge, onClose }: { bridge: Bridge | null; onClose: () => void }) {
  const lamps = useStore((s) => s.devices).filter((d) => d.type === 'light');
  const { editBridge } = useStore();
  const [edits, setEdits] = useState<Partial<Bridge>>({});
  useEffect(() => {
    setEdits({});
  }, [bridge]);
  if (!bridge) return null;
  const b = { ...bridge, ...edits };
  const upd = (p: Partial<Bridge>) => {
    const ne = { ...edits, ...p };
    setEdits(ne);
    editBridge({ ...bridge, ...ne });
  };
  const myLamps = lamps.filter((l) => l.bridge === bridge.id);
  const field = (label: string, key: 'name' | 'ip', mono?: boolean) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        value={b[key]}
        onChange={(e) => upd({ [key]: e.target.value })}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: T.card2,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: '12px 14px',
          color: T.text,
          fontFamily: mono ? T.mono : T.sans,
          fontWeight: mono ? 700 : 800,
          fontSize: mono ? 14 : 16,
          outline: 'none',
        }}
      />
    </div>
  );
  return (
    <Sheet open={!!bridge} onClose={onClose} title="Hue Bridge">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="ir" size={22} color={T.aiViolet} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 900, fontSize: 16 }}>{b.model}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <StatusDot status={b.status} />
            <Mono style={{ fontSize: 11, color: T.muted }}>{b.status}</Mono>
          </div>
        </div>
      </div>
      {field('Name', 'name')}
      {field('IP address', 'ip', true)}
      <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', margin: '10px 4px 8px' }}>
        Lights on this hub · {myLamps.length}
      </div>
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 14 }}>
        {myLamps.map((l, i) => (
          <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < myLamps.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <Icon name="light" size={18} color={l.state.on ? T.lime : T.muted} />
            <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{l.name}</div>
            <Mono style={{ fontSize: 11, color: T.muted }}>{l.room}</Mono>
          </div>
        ))}
      </Card>
      <Btn kind="ghost" full style={{ marginBottom: 10 }}>
        <Icon name="search" size={16} /> Search for new lights
      </Btn>
      <Btn kind="lime" full onClick={onClose}>
        Done
      </Btn>
    </Sheet>
  );
}
