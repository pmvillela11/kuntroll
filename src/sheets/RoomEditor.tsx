// Room editor sheet — name, icon, device + scene multi-select.
import { useEffect, useState } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon, type IconName } from '../components/Icon';
import { Btn, Sheet } from '../components/ui';
import { useStore } from '../store/store';
import type { Room } from '../types';

const ROOM_ICONS: IconName[] = ['sofa', 'bed', 'kitchen', 'tv', 'sun', 'light'];

export function RoomEditor({ open, room, onClose }: { open: boolean; room: Room | null; onClose: () => void }) {
  const devices = useStore((s) => s.devices);
  const scenes = useStore((s) => s.scenes);
  const { saveRoom } = useStore();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<IconName>('sofa');
  const [devIds, setDevIds] = useState<string[]>([]);
  const [scIds, setScIds] = useState<string[]>([]);
  useEffect(() => {
    if (open) {
      setName(room ? room.name : '');
      setIcon(room ? room.icon : 'sofa');
      setDevIds(room ? [...room.deviceIds] : []);
      setScIds(room && room.sceneIds ? [...room.sceneIds] : []);
    }
  }, [open, room]);
  if (!open) return null;
  const tog = (arr: string[], set: (v: string[]) => void, id: string) => set(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);
  return (
    <Sheet open={open} onClose={onClose} title={room ? 'Edit room' : 'New room'}>
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 6 }}>Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Living Room"
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
          fontSize: 16,
          outline: 'none',
          marginBottom: 14,
        }}
      />
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>Icon</label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {ROOM_ICONS.map((ic) => (
          <button
            key={ic}
            onClick={() => setIcon(ic)}
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              border: `1px solid ${icon === ic ? T.lime : T.border}`,
              background: icon === ic ? 'rgba(200,255,0,0.1)' : T.card2,
              color: icon === ic ? T.lime : T.muted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={ic} size={20} />
          </button>
        ))}
      </div>
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>Devices</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {devices.map((d) => {
          const on = devIds.includes(d.id);
          return (
            <button
              key={d.id}
              onClick={() => tog(devIds, setDevIds, d.id)}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 100,
                border: `1px solid ${on ? T.lime : T.border}`,
                background: on ? 'rgba(200,255,0,0.1)' : T.card2,
                color: on ? T.lime : T.muted,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Icon name={DEVICE_ICON[d.type]} size={14} />
              {d.name}
            </button>
          );
        })}
      </div>
      <label style={{ fontSize: 12, color: T.muted, fontWeight: 700, display: 'block', marginBottom: 8 }}>Scenes</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {scenes.map((s) => {
          const on = scIds.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => tog(scIds, setScIds, s.id)}
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: 100,
                border: `1px solid ${on ? T.lime : T.border}`,
                background: on ? 'rgba(200,255,0,0.1)' : T.card2,
                color: on ? T.lime : T.muted,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Icon name={s.icon} size={14} />
              {s.name}
            </button>
          );
        })}
      </div>
      <Btn
        kind="lime"
        full
        onClick={() => {
          if (!name.trim()) return;
          saveRoom({ id: room ? room.id : 'room' + Date.now(), name: name.trim(), icon, deviceIds: devIds, sceneIds: scIds });
          onClose();
        }}
      >
        {room ? 'Save room' : 'Create room'}
      </Btn>
    </Sheet>
  );
}
