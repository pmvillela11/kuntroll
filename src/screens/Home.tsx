// Home — editable dashboard: Favorites / Lights / Rooms / Devices, per-section card sizes.
import { useState, type ReactNode } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon } from '../components/Icon';
import { Card, EmptyState, Mono, PillButton, TopBar, haptic } from '../components/ui';
import { EditWrap } from '../components/EditWrap';
import { greetingNow, useStore, useTweaks, VARKEY } from '../store/store';
import type { Device, HomeSectionId, LightScene, Room, Scene, SectionSize } from '../types';
import type { IconName } from '../components/Icon';

const SIZES: SectionSize[] = ['S', 'M', 'L'];
const onGlow = (on: boolean | undefined) =>
  on
    ? { borderColor: 'rgba(200,255,0,0.45)', boxShadow: '0 0 0 1px rgba(200,255,0,0.18), 0 4px 14px rgba(120,160,0,0.18)' }
    : {};
const isOn = (d: Device) => (d.type === 'light' ? !!d.state.on : !!d.state.power);

function SceneTile({
  scene,
  onFire,
  size,
  editHome,
  idx,
  onReorder,
  onDelete,
}: {
  scene: { id: string; name: string; icon: IconName };
  onFire: (id: string) => void;
  size: SectionSize;
  editHome: boolean;
  idx: number;
  onReorder: (from: number, to: number) => void;
  onDelete: (id: string) => void;
}) {
  const big = size === 'L';
  const sm = size === 'S';
  const [over, setOver] = useState(false);
  if (editHome) {
    return (
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setData('scene', String(idx));
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOver(false);
          const from = e.dataTransfer.getData('scene');
          if (from !== '') onReorder(parseInt(from), idx);
        }}
        style={{
          position: 'relative',
          background: 'linear-gradient(155deg,#2c2150,#211b3c)',
          border: `1px solid ${over ? T.lime : T.borderStrong}`,
          borderRadius: 18,
          padding: sm ? 12 : 16,
          cursor: 'grab',
          display: 'flex',
          flexDirection: big ? 'row' : 'column',
          gap: big ? 16 : 14,
          minHeight: sm ? 78 : big ? 72 : 104,
          alignItems: big ? 'center' : 'stretch',
          justifyContent: 'space-between',
          boxShadow: over ? `0 0 0 1px ${T.lime}` : '0 4px 12px rgba(0,0,0,0.4)',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            haptic();
            onDelete(scene.id);
          }}
          style={{
            position: 'absolute',
            top: -9,
            right: -9,
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: T.error,
            border: `2px solid ${T.bg}`,
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3,
          }}
        >
          <Icon name="minus" size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: big ? 16 : 0, justifyContent: 'space-between', width: big ? 'auto' : '100%' }}>
          <div
            style={{
              width: sm ? 32 : 38,
              height: sm ? 32 : 38,
              borderRadius: 12,
              background: 'rgba(200,255,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={scene.icon} size={sm ? 17 : 20} color={T.lime} />
          </div>
          {!big && <Icon name="drag" size={18} color={T.aiViolet} />}
        </div>
        <div style={{ flex: big ? 1 : 'none', fontWeight: 900, fontSize: sm ? 14 : 17 }}>{scene.name}</div>
        {big && <Icon name="drag" size={18} color={T.aiViolet} />}
      </div>
    );
  }
  return (
    <div
      onClick={() => {
        haptic(12);
        onFire(scene.id);
      }}
      style={{
        background: 'linear-gradient(155deg,#2c2150,#211b3c)',
        border: `1px solid ${T.border}`,
        borderRadius: 18,
        padding: sm ? 12 : 16,
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: big ? 'row' : 'column',
        gap: big ? 16 : 14,
        minHeight: sm ? 78 : big ? 72 : 104,
        alignItems: big ? 'center' : 'stretch',
        justifyContent: 'space-between',
        transition: 'transform .12s',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <div
        style={{
          width: sm ? 32 : 38,
          height: sm ? 32 : 38,
          borderRadius: 12,
          background: 'rgba(200,255,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name={scene.icon} size={sm ? 17 : 20} color={T.lime} />
      </div>
      <div style={{ flex: big ? 1 : 'none', fontWeight: 900, fontSize: sm ? 14 : 17 }}>{scene.name}</div>
    </div>
  );
}

function RoomCard({ room, devices, onOpen, size }: { room: Room; devices: Device[]; onOpen: (r: Room) => void; size: SectionSize }) {
  const on = devices.filter((d) => room.deviceIds.includes(d.id) && (d.state.power || d.state.on)).length;
  if (size === 'S')
    return (
      <Card onClick={() => onOpen(room)} pad={14} style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 84 }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={room.icon} size={18} color={T.lime} />
        </div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{room.name}</div>
      </Card>
    );
  return (
    <Card onClick={() => onOpen(room)} style={{ display: 'flex', alignItems: 'center', gap: 14 }} pad={size === 'L' ? 18 : 14}>
      <div
        style={{
          width: size === 'L' ? 50 : 42,
          height: size === 'L' ? 50 : 42,
          borderRadius: 13,
          background: T.violetSoft,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={room.icon} size={size === 'L' ? 26 : 22} color={T.lime} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 800, fontSize: size === 'L' ? 18 : 16 }}>{room.name}</div>
        <span style={{ fontSize: 13, color: T.muted, fontWeight: 600 }}>
          {room.deviceIds.length} devices · {on} on
        </span>
      </div>
      <Icon name="chevR" size={18} color={T.muted} />
    </Card>
  );
}

function DeviceRow({ d, onOpen, size }: { d: Device; onOpen: (d: Device) => void; size: SectionSize }) {
  const ro =
    d.type === 'tv'
      ? `${d.state.source} · Vol ${d.state.volume}`
      : d.type === 'receiver'
        ? `Vol ${d.state.volume}`
        : d.type === 'appletv'
          ? d.state.app
          : d.status;
  const lit = isOn(d) && d.status === 'online';
  if (size === 'S')
    return (
      <Card onClick={() => onOpen(d)} pad={14} style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 84, ...onGlow(lit) }}>
        <Icon name={DEVICE_ICON[d.type]} size={20} color={d.status === 'online' ? T.lime : T.muted} />
        <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
      </Card>
    );
  return (
    <Card onClick={() => onOpen(d)} pad={size === 'L' ? 18 : 14} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, ...onGlow(lit) }}>
      <Icon name={DEVICE_ICON[d.type]} size={size === 'L' ? 26 : 22} color={d.status === 'online' ? T.lime : T.muted} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: size === 'L' ? 17 : 15 }}>{d.name}</div>
        <Mono style={{ fontSize: 11, color: T.muted }}>{d.model}</Mono>
      </div>
      <Mono style={{ fontSize: 12, color: T.muted }}>{ro}</Mono>
      <Icon name="chevR" size={16} color={T.muted} />
    </Card>
  );
}

export function Home({
  editHome,
  setEditHome,
  openDevice,
  openAddDevice,
}: {
  editHome: boolean;
  setEditHome: (v: boolean) => void;
  openDevice: (d: Device) => void;
  openAddDevice: () => void;
}) {
  const devices = useStore((s) => s.devices);
  const scenes = useStore((s) => s.scenes);
  const rooms = useStore((s) => s.rooms);
  const homeOrder = useStore((s) => s.homeOrder);
  const sizes = useStore((s) => s.sizes);
  const lightScenes = useStore((s) => s.lightScenes);
  const homeName = useStore((s) => s.homeName);
  const {
    runScene,
    updateDevice,
    allLightsOff,
    setHomeOrder,
    setSize,
    applyLightScene,
    addLightScene,
    reorderFav,
    removeFav,
    removeLightScene,
    reorderRoom,
    reorderDevice,
    go,
  } = useStore();
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];

  const online = devices.filter((d) => d.status === 'online').length;
  const greeting = greetingNow(online, devices.length, homeName);
  const favs = scenes.filter((s) => s.favourite);
  const lamps = devices.filter((d) => d.type === 'light');
  const coreDevices = devices.filter((d) => d.type !== 'light' && d.type !== 'ir');
  const cols = (sz: SectionSize, base: number) => (sz === 'S' ? base + 1 : sz === 'L' ? 1 : base);
  const reorderHome = (from: number, to: number) => {
    const a = [...homeOrder];
    const [m] = a.splice(from, 1);
    a.splice(to, 0, m);
    setHomeOrder(a);
  };
  const openRoom = () => go('rooms');

  const SizeCtl = ({ id }: { id: HomeSectionId }) => (
    <div style={{ display: 'flex', gap: 4, background: T.card2, borderRadius: 100, padding: 3 }}>
      {SIZES.map((s) => (
        <button
          key={s}
          onClick={() => setSize(id, s)}
          style={{
            width: 26,
            height: 24,
            borderRadius: 100,
            border: 'none',
            cursor: 'pointer',
            background: sizes[id] === s ? T.lime : 'transparent',
            color: sizes[id] === s ? '#16161f' : T.muted,
            fontFamily: T.mono,
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );

  const Shell = ({ id, idx, title, right, children }: { id: HomeSectionId; idx: number; title: string; right?: ReactNode; children: ReactNode }) => (
    <div
      draggable={editHome}
      onDragStart={(e) => e.dataTransfer.setData('text', String(idx))}
      onDragOver={(e) => {
        if (editHome) e.preventDefault();
      }}
      onDrop={(e) => {
        if (editHome) reorderHome(parseInt(e.dataTransfer.getData('text')), idx);
      }}
      style={{
        marginBottom: 22,
        borderRadius: 18,
        padding: editHome ? 12 : 0,
        border: editHome ? `1px dashed ${T.borderStrong}` : 'none',
        background: editHome ? 'rgba(167,139,250,0.05)' : 'transparent',
        cursor: editHome ? 'grab' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {editHome && <Icon name="drag" size={18} color={T.aiViolet} />}
          <div style={{ fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap' }}>{title}</div>
        </div>
        {editHome ? <SizeCtl id={id} /> : right}
      </div>
      {children}
    </div>
  );

  const SECTIONS: Record<HomeSectionId, (idx: number) => ReactNode> = {
    favorites: (idx) => (
      <Shell key="favorites" id="favorites" idx={idx} title="Favorites">
        {favs.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(sizes.favorites, 2)},1fr)`, gap: 12 }}>
            {favs.map((s: Scene, i: number) => (
              <SceneTile key={s.id} scene={s} onFire={runScene} size={sizes.favorites} editHome={editHome} idx={i} onReorder={reorderFav} onDelete={removeFav} />
            ))}
          </div>
        ) : (
          <div style={{ border: `1px dashed ${T.border}`, borderRadius: 18 }}>
            <EmptyState
              exp="happy"
              variant={trollVariant}
              compact
              title="No favorites yet"
              sub="Heart a scene to pin it here for one-tap access."
              action="Browse scenes"
              onAction={() => go('scenes')}
            />
          </div>
        )}
      </Shell>
    ),
    lights: (idx) => (
      <Shell
        key="lights"
        id="lights"
        idx={idx}
        title="Lights"
        right={
          lamps.length === 0 ? undefined : (
          <button
            onClick={allLightsOff}
            style={{
              display: 'flex',
              gap: 6,
              alignItems: 'center',
              background: 'none',
              border: `1px solid ${T.border}`,
              borderRadius: 100,
              padding: '6px 12px',
              color: T.muted,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Icon name="lightoff" size={15} /> All off
          </button>
          )
        }
      >
        {lamps.length === 0 ? (
          <div style={{ border: `1px dashed ${T.border}`, borderRadius: 18 }}>
            <EmptyState
              exp="sleepy"
              variant={trollVariant}
              compact
              title="No lights yet"
              sub="Pair a Hue Bridge or add a lamp to control your lights from here."
              action="Add lights"
              onAction={openAddDevice}
            />
          </div>
        ) : (
          <>
        {/* light scenes — same card size as favorites */}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols(sizes.lights, 2)},1fr)`, gap: 12, marginBottom: 14 }}>
          {lightScenes.map((sc: LightScene, i: number) => (
            <SceneTile
              key={sc.id}
              scene={sc}
              onFire={(id) => {
                const found = lightScenes.find((s) => s.id === id);
                if (found) applyLightScene(found);
              }}
              size={sizes.lights}
              editHome={editHome}
              idx={i}
              onReorder={(from, to) => reorderFav(from, to, 'light')}
              onDelete={(id) => removeLightScene(id)}
            />
          ))}
          {!editHome && (
            <div
              onClick={addLightScene}
              style={{
                border: `1px dashed ${T.borderStrong}`,
                borderRadius: 18,
                padding: 16,
                cursor: 'pointer',
                minHeight: sizes.lights === 'S' ? 78 : sizes.lights === 'L' ? 72 : 104,
                display: 'flex',
                flexDirection: sizes.lights === 'L' ? 'row' : 'column',
                gap: 10,
                alignItems: 'center',
                justifyContent: 'center',
                color: T.aiViolet,
              }}
            >
              <Icon name="plus" size={20} />
              <div style={{ fontWeight: 800, fontSize: 13 }}>Save scene</div>
            </div>
          )}
        </div>
        {/* lamps as pills (usually many) */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {lamps.map((l) => {
            const on = l.state.on;
            return (
              <button
                key={l.id}
                onClick={() => {
                  haptic();
                  updateDevice(l.id, { on: !on });
                }}
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'center',
                  padding: '9px 13px',
                  borderRadius: 100,
                  border: `1px solid ${on ? T.lime : T.border}`,
                  background: on ? 'rgba(200,255,0,0.1)' : T.card,
                  color: on ? T.lime : T.muted,
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                <Icon name="light" size={15} />
                {l.name}
                {on && <span style={{ fontFamily: T.mono, fontSize: 11, opacity: 0.85 }}>{l.state.brightness}%</span>}
              </button>
            );
          })}
        </div>
          </>
        )}
      </Shell>
    ),
    rooms: (idx) => (
      <Shell key="rooms" id="rooms" idx={idx} title="Rooms">
        {sizes.rooms === 'S' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {rooms.map((r, i) =>
              editHome ? (
                <EditWrap key={r.id} group="room" idx={i} onReorder={reorderRoom}>
                  <RoomCard room={r} devices={devices} onOpen={openRoom} size="S" />
                </EditWrap>
              ) : (
                <RoomCard key={r.id} room={r} devices={devices} onOpen={openRoom} size="S" />
              ),
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rooms.map((r, i) =>
              editHome ? (
                <EditWrap key={r.id} group="room" idx={i} onReorder={reorderRoom}>
                  <RoomCard room={r} devices={devices} onOpen={openRoom} size={sizes.rooms} />
                </EditWrap>
              ) : (
                <RoomCard key={r.id} room={r} devices={devices} onOpen={openRoom} size={sizes.rooms} />
              ),
            )}
          </div>
        )}
      </Shell>
    ),
    devices: (idx) => (
      <Shell key="devices" id="devices" idx={idx} title="Devices">
        {coreDevices.length === 0 ? (
          <div style={{ border: `1px dashed ${T.border}`, borderRadius: 18 }}>
            <EmptyState
              exp="sleepy"
              variant={trollVariant}
              compact
              title="No devices yet"
              sub="Add your TV, receiver or streamer to start controlling."
              action="Add a device"
              onAction={openAddDevice}
            />
          </div>
        ) : sizes.devices === 'S' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {coreDevices.map((d, i) =>
              editHome ? (
                <EditWrap key={d.id} group="dev" idx={i} onReorder={reorderDevice}>
                  <DeviceRow d={d} onOpen={openDevice} size="S" />
                </EditWrap>
              ) : (
                <DeviceRow key={d.id} d={d} onOpen={openDevice} size="S" />
              ),
            )}
          </div>
        ) : (
          coreDevices.map((d, i) =>
            editHome ? (
              <EditWrap key={d.id} group="dev" idx={i} onReorder={reorderDevice} style={{ marginBottom: 10 }}>
                <DeviceRow d={d} onOpen={openDevice} size={sizes.devices} />
              </EditWrap>
            ) : (
              <DeviceRow key={d.id} d={d} onOpen={openDevice} size={sizes.devices} />
            ),
          )
        )}
      </Shell>
    ),
  };

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <TopBar
        title={greeting.main}
        sub={greeting.sub}
        right={
          <PillButton active={editHome} onClick={() => setEditHome(!editHome)}>
            <Icon name={editHome ? 'check' : 'edit'} size={15} />
            {editHome ? 'Done' : 'Edit'}
          </PillButton>
        }
      />
      {editHome && (
        <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600, margin: '-6px 0 16px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icon name="drag" size={14} color={T.aiViolet} /> Drag to reorder · S/M/L resizes each section.
        </div>
      )}
      {homeOrder.map((key, idx) => SECTIONS[key](idx))}
    </div>
  );
}
