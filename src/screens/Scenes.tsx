// Scenes — library (pre-built / custom), filters, favourite, run, edit; background fire → Control.
import { useState } from 'react';
import { T } from '../design/tokens';
import { DEVICE_ICON, Icon } from '../components/Icon';
import { Btn, Card, EmptyState, PillButton, Sheet, TopBar, haptic } from '../components/ui';
import { EditWrap } from '../components/EditWrap';
import { useStore, useTweaks, VARKEY } from '../store/store';
import type { Device, Scene } from '../types';

const chipMeta = (id: string, devices: Device[]) => (id === 'lights' ? { type: 'light' } : devices.find((x) => x.id === id) || null);

function SceneCard({
  scene,
  devices,
  onFire,
  onFav,
  onMenu,
}: {
  scene: Scene;
  devices: Device[];
  onFire: (id: string) => void;
  onFav: (id: string) => void;
  onMenu: (s: Scene) => void;
}) {
  const devIds = [...new Set(scene.steps.map((s) => s.device))];
  return (
    <Card pad={16} style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          onClick={() => {
            haptic(12);
            onFire(scene.id);
          }}
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            flexShrink: 0,
            cursor: 'pointer',
            background: 'linear-gradient(150deg,#2c2150,#211b3c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={scene.icon} size={26} color={T.lime} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 17 }}>{scene.name}</div>
          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
            {devIds.map((id) => {
              const d = chipMeta(id, devices);
              return d ? (
                <div key={id} style={{ width: 26, height: 26, borderRadius: 8, background: T.violetSoft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={DEVICE_ICON[d.type]} size={14} color={T.muted} />
                </div>
              ) : null;
            })}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => {
              haptic();
              onFav(scene.id);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            <Icon name={scene.favourite ? 'heartFill' : 'heart'} size={20} color={scene.favourite ? T.lime : T.muted} />
          </button>
          <button onClick={() => onMenu(scene)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
            <Icon name="more" size={20} color={T.muted} />
          </button>
        </div>
      </div>
      <Btn kind="primary" full onClick={() => onFire(scene.id)} style={{ marginTop: 14, padding: '11px' }}>
        <Icon name="play" size={15} fill /> Run scene
      </Btn>
    </Card>
  );
}

export function Scenes({ onNewScene, onEditScene, onDuplicate }: { onNewScene: () => void; onEditScene: (s: Scene) => void; onDuplicate: (s: Scene) => void }) {
  const scenes = useStore((s) => s.scenes);
  const devices = useStore((s) => s.devices);
  const { runScene, favScene, go, reorderScene, deleteScene } = useStore();
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];
  const [filter, setFilter] = useState('All');
  const [menu, setMenu] = useState<Scene | null>(null);
  const [edit, setEdit] = useState(false);

  let list = scenes;
  if (filter === 'Favourites') list = scenes.filter((s) => s.favourite);
  const prebuilt = list.filter((s) => s.prebuilt);
  const custom = list.filter((s) => !s.prebuilt);
  // global index within full scenes array, for reordering
  const gi = (s: Scene) => scenes.findIndex((x) => x.id === s.id);
  const renderCard = (s: Scene) =>
    edit ? (
      <EditWrap key={s.id} group="scenetab" idx={gi(s)} onReorder={reorderScene} onDelete={() => deleteScene(s.id)} style={{ marginBottom: 12 }}>
        <SceneCard scene={s} devices={devices} onFire={runScene} onFav={favScene} onMenu={setMenu} />
      </EditWrap>
    ) : (
      <SceneCard key={s.id} scene={s} devices={devices} onFire={runScene} onFav={favScene} onMenu={setMenu} />
    );

  return (
    <div style={{ padding: '4px 20px 20px' }}>
      <TopBar
        title="Scenes"
        onBack={() => go('home')}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <PillButton active={edit} onClick={() => setEdit((e) => !e)}>
              <Icon name={edit ? 'check' : 'edit'} size={15} />
              {edit ? 'Done' : 'Edit'}
            </PillButton>
            {!edit && (
              <PillButton onClick={onNewScene}>
                <Icon name="plus" size={15} color={T.lime} /> New
              </PillButton>
            )}
          </div>
        }
      />
      {edit && (
        <div style={{ fontSize: 12.5, color: T.muted, fontWeight: 600, margin: '-6px 0 14px', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Icon name="drag" size={14} color={T.aiViolet} /> Drag to reorder · tap − to delete.
        </div>
      )}
      {!edit && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          {['All', 'Favourites', 'By Room'].map((f) => (
            <button
              key={f}
              onClick={() => {
                haptic();
                setFilter(f);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 100,
                border: `1px solid ${filter === f ? T.lime : T.border}`,
                background: filter === f ? 'rgba(200,255,0,0.1)' : 'transparent',
                color: filter === f ? T.lime : T.muted,
                fontFamily: T.sans,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}
      {prebuilt.length > 0 && (
        <>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Pre-built</div>
          {prebuilt.map(renderCard)}
        </>
      )}
      {custom.length > 0 && (
        <>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase', margin: '18px 0 10px' }}>Custom</div>
          {custom.map(renderCard)}
        </>
      )}
      {list.length === 0 && (
        <div style={{ border: `1px dashed ${T.border}`, borderRadius: 20, marginTop: 8 }}>
          <EmptyState
            exp={filter === 'Favourites' ? 'happy' : 'sleepy'}
            variant={trollVariant}
            title={filter === 'Favourites' ? 'No favourite scenes' : 'No scenes yet'}
            sub={filter === 'Favourites' ? 'Heart a scene to keep it close.' : 'Build a scene to control several devices with one tap.'}
            action={filter === 'Favourites' ? null : 'New scene'}
            onAction={onNewScene}
          />
        </div>
      )}
      {!edit && (
        <Btn kind="ghost" full style={{ marginTop: 8 }} onClick={onNewScene}>
          <Icon name="plus" size={18} /> New scene
        </Btn>
      )}

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu ? menu.name : ''}>
        {['Edit scene', 'Duplicate', 'Delete'].map((o, i) => (
          <div
            key={o}
            onClick={() => {
              if (o === 'Delete' && menu) deleteScene(menu.id);
              else if (o === 'Edit scene' && menu) onEditScene(menu);
              else if (o === 'Duplicate' && menu) onDuplicate(menu);
              setMenu(null);
            }}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              padding: '15px 4px',
              borderBottom: i < 2 ? `1px solid ${T.border}` : 'none',
              cursor: 'pointer',
              color: o === 'Delete' ? T.error : T.text,
              fontWeight: 800,
              fontSize: 16,
            }}
          >
            <Icon name={o === 'Edit scene' ? 'edit' : o === 'Duplicate' ? 'rooms' : 'x'} size={20} />
            {o}
          </div>
        ))}
      </Sheet>
    </div>
  );
}
