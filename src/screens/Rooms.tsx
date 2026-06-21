// Rooms — per room: Scenes & commands · Devices · Lights (inline dimming).
import { useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon } from '../components/Icon';
import { Btn, Card, EmptyState, Mono, PillButton, Slider, StatusDot, Toggle, TopBar, haptic } from '../components/ui';
import { EditWrap } from '../components/EditWrap';
import { useStore, useTweaks, VARKEY } from '../store/store';
import type { Device, Room } from '../types';

function Sub({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontFamily: T.mono, fontSize: 10.5, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', margin: '0 2px 10px' }}>
      {children}
    </div>
  );
}

export function Rooms({
  openDevice,
  onAddRoom,
  onEditRoom,
}: {
  openDevice: (d: Device) => void;
  onAddRoom: () => void;
  onEditRoom: (r: Room) => void;
}) {
  const rooms = useStore((s) => s.rooms);
  const devices = useStore((s) => s.devices);
  const scenes = useStore((s) => s.scenes);
  const { runScene, updateDevice, go, reorderRoom, deleteRoom } = useStore();
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];
  const [edit, setEdit] = useState(false);

  if (rooms.length === 0) {
    return (
      <div style={{ padding: '4px 20px 20px' }}>
        <TopBar title="Rooms" onBack={() => go('home')} />
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 20, marginTop: 8 }}>
          <EmptyState
            exp="happy"
            variant={trollVariant}
            title="No rooms yet"
            sub="Group your devices by room to get per-room scenes, lights and quick controls."
            action="New room"
            onAction={onAddRoom}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <TopBar
        title="Rooms"
        onBack={() => go('home')}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <PillButton active={edit} onClick={() => setEdit((e) => !e)}>
              <Icon name={edit ? 'check' : 'edit'} size={15} />
              {edit ? 'Done' : 'Edit'}
            </PillButton>
            {!edit && (
              <PillButton onClick={onAddRoom}>
                <Icon name="plus" size={15} color={T.lime} /> New
              </PillButton>
            )}
          </div>
        }
      />
      {edit && (
        <>
          <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600, margin: '-6px 0 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Icon name="drag" size={14} color={T.aiViolet} /> Drag to reorder · − removes the room · pencil edits it.
          </div>
          {rooms.map((r, i) => {
            const devs = devices.filter((d) => r.deviceIds.includes(d.id));
            return (
              <EditWrap key={r.id} group="roomtab" idx={i} onReorder={reorderRoom} onDelete={() => deleteRoom(r.id)} style={{ marginBottom: 10 }}>
                <Card pad={14} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 13,
                      background: T.violetSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 18,
                    }}
                  >
                    <Icon name={r.icon} size={22} color={T.lime} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{r.name}</div>
                    <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>{devs.length} devices</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRoom(r);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6, pointerEvents: 'auto' }}
                  >
                    <Icon name="edit" size={18} />
                  </button>
                </Card>
              </EditWrap>
            );
          })}
          <Btn kind="ghost" full style={{ marginTop: 6 }} onClick={onAddRoom}>
            <Icon name="plus" size={18} /> New room
          </Btn>
        </>
      )}
      {!edit &&
        rooms.map((r) => {
          const devs = devices.filter((d) => r.deviceIds.includes(d.id));
          const lamps = devs.filter((d) => d.type === 'light');
          const nonLight = devs.filter((d) => d.type !== 'light');
          const rScenes = scenes.filter(
            (s) => (r.sceneIds && r.sceneIds.includes(s.id)) || s.steps.some((st) => r.deviceIds.includes(st.device)),
          );
          const setLamps = (on: boolean) => {
            lamps.forEach((l) => updateDevice(l.id, { on }));
            haptic(12);
          };
          return (
            <div key={r.id} style={{ marginBottom: 30 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={r.icon} size={18} color={T.lime} />
                </div>
                <div style={{ fontWeight: 900, fontSize: 20 }}>{r.name}</div>
                <span style={{ fontSize: 13, color: T.muted, fontWeight: 700 }}>· {devs.length}</span>
                <button onClick={() => onEditRoom(r)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: T.muted, padding: 6 }}>
                  <Icon name="edit" size={18} />
                </button>
              </div>

              {/* Scenes & commands — bigger cards */}
              <Sub>Scenes &amp; commands</Sub>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 22 }}>
                {rScenes.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      haptic(12);
                      runScene(s.id);
                    }}
                    style={{
                      background: 'linear-gradient(155deg,#2c2150,#211b3c)',
                      border: `1px solid ${T.border}`,
                      borderRadius: 18,
                      padding: 16,
                      cursor: 'pointer',
                      minHeight: 104,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(200,255,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name={s.icon} size={20} color={T.lime} />
                      </div>
                      <Icon name="play" size={16} color={T.muted} fill />
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 17 }}>{s.name}</div>
                  </div>
                ))}
                {lamps.length > 0 && (
                  <>
                    <div
                      onClick={() => setLamps(true)}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 18,
                        padding: 16,
                        cursor: 'pointer',
                        minHeight: 104,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="light" size={20} color={T.lime} />
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>Lights on</div>
                    </div>
                    <div
                      onClick={() => setLamps(false)}
                      style={{
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        borderRadius: 18,
                        padding: 16,
                        cursor: 'pointer',
                        minHeight: 104,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="lightoff" size={20} color={T.muted} />
                      </div>
                      <div style={{ fontWeight: 900, fontSize: 16 }}>Lights off</div>
                    </div>
                  </>
                )}
              </div>

              {/* Devices */}
              {nonLight.length > 0 && (
                <>
                  <Sub>Devices</Sub>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
                    {nonLight.map((d) => (
                      <Card key={d.id} pad={14} onClick={() => openDevice(d)} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Icon name={DEVICE_ICON[d.type]} size={20} color={d.status === 'online' ? T.lime : T.muted} />
                          <StatusDot status={d.status} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
                      </Card>
                    ))}
                  </div>
                </>
              )}

              {/* Lights */}
              {lamps.length > 0 && (
                <>
                  <Sub>Lights</Sub>
                  {lamps.map((l) => (
                    <Card key={l.id} pad={14} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: l.state.on ? 12 : 0 }}>
                        <Icon name="light" size={20} color={l.state.on ? T.lime : T.muted} />
                        <div style={{ flex: 1, fontWeight: 800, fontSize: 15 }}>{l.name}</div>
                        <Toggle on={!!l.state.on} onChange={(v) => updateDevice(l.id, { on: v })} />
                      </div>
                      {l.state.on && (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <Slider value={l.state.brightness ?? 0} onChange={(v) => updateDevice(l.id, { brightness: v })} />
                          </div>
                          <Mono style={{ fontSize: 13, color: T.muted, minWidth: 38, textAlign: 'right' }}>{l.state.brightness}%</Mono>
                        </div>
                      )}
                    </Card>
                  ))}
                </>
              )}
            </div>
          );
        })}
    </div>
  );
}
