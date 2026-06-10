// Device settings sheet — editable name/model/room/IP/port + command list (library/manual/ai_fetched).
import { useEffect, useState } from 'react';
import { T } from '../design/tokens';
import { Icon } from '../components/Icon';
import { Btn, Card, ConfidenceDots, Sheet, SourceBadge } from '../components/ui';
import { useStore } from '../store/store';
import type { CommandSource, Device } from '../types';

export function DeviceSettings({
  device,
  onClose,
  openScout,
}: {
  device: Device | null;
  onClose: () => void;
  openScout: (prefill: { brand: string; model: string }) => void;
}) {
  const rooms = useStore((s) => s.rooms);
  const { editDevice } = useStore();
  const [edits, setEdits] = useState<Partial<Device>>({});
  useEffect(() => {
    setEdits({});
  }, [device]);
  if (!device) return null;
  const d = { ...device, ...edits };
  const upd = (patch: Partial<Device>) => {
    const ne = { ...edits, ...patch };
    setEdits(ne);
    editDevice({ ...device, ...ne });
  };
  const field = (label: string, key: 'name' | 'model' | 'ip' | 'port', mono?: boolean) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>{label}</label>
      <input
        value={d[key]}
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
  const libCmds: { n: string; s: CommandSource; c: number }[] = [
    { n: 'Power', s: 'library', c: 3 },
    { n: 'Volume Up', s: 'library', c: 3 },
    { n: 'Source', s: 'manual', c: 3 },
  ];
  const aiCmds = (d.commands || []).map((c) => ({
    n: c.name,
    s: 'ai_fetched' as CommandSource,
    c: c.confidence >= 0.85 ? 3 : c.confidence >= 0.6 ? 2 : 1,
  }));
  const allCmds = [...libCmds, ...aiCmds];
  return (
    <Sheet open={!!device} onClose={onClose} title="Device">
      {field('Name', 'name')}
      {field('Model', 'model', true)}
      <div style={{ marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>Room</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {rooms.map((r) => (
            <button
              key={r.id}
              onClick={() => upd({ room: r.name })}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                padding: '9px 14px',
                borderRadius: 100,
                border: `1px solid ${d.room === r.name ? T.lime : T.border}`,
                background: d.room === r.name ? 'rgba(200,255,0,0.1)' : T.card2,
                color: d.room === r.name ? T.lime : T.muted,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <Icon name={r.icon} size={14} /> {r.name}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1 }}>{field('IP address', 'ip', true)}</div>
        <div style={{ width: 96 }}>{field('Port', 'port', true)}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '8px 4px 8px' }}>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase' }}>Commands</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.muted }}>
          {allCmds.length}
          {aiCmds.length ? ` · ${aiCmds.length} via Scout` : ''}
        </span>
      </div>
      <Card pad={0} style={{ overflow: 'hidden', marginBottom: 14 }}>
        {allCmds.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: i < allCmds.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ flex: 1, fontWeight: 800, fontSize: 14 }}>{c.n}</div>
            <SourceBadge source={c.s} />
            <ConfidenceDots level={c.c} />
          </div>
        ))}
      </Card>
      <Btn
        kind="ghost"
        full
        style={{ marginBottom: 10 }}
        onClick={() => {
          onClose();
          openScout({ brand: d.name.split(' ')[0], model: d.model });
        }}
      >
        <Icon name="bolt" size={16} color={T.aiViolet} /> Find more with Troll Scout
      </Btn>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn kind="ghost" style={{ flex: 1 }}>
          <Icon name="refresh" size={16} /> Test
        </Btn>
        <Btn kind="lime" style={{ flex: 1 }} onClick={onClose}>
          Done
        </Btn>
      </div>
    </Sheet>
  );
}
