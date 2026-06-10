// Shell: tab nav + back, screen transitions, on-action Kun Troll + toast, overlays & sheets.
import { useState } from 'react';
import { T } from './design/tokens';
import { Icon, type IconName } from './components/Icon';
import { Troll } from './components/Troll';
import { haptic } from './components/ui';
import { useStore, useTweaks, VARKEY, type Tab } from './store/store';
import { Home } from './screens/Home';
import { Rooms } from './screens/Rooms';
import { Controller } from './screens/Controller';
import { Scenes } from './screens/Scenes';
import { Settings } from './screens/Settings';
import { Activity, Diagnostics, Recovery } from './screens/Activity';
import { Onboarding } from './screens/Onboarding';
import { TrollScout } from './screens/TrollScout';
import { AddDevice, SceneBuilder } from './screens/Flows';
import { DeviceSettings } from './sheets/DeviceSettings';
import { RoomEditor } from './sheets/RoomEditor';
import { BridgeConfig } from './sheets/BridgeConfig';
import { clone } from './data/seed';
import type { Bridge, Device, Room, Scene } from './types';

const TABS: [Tab, string, IconName][] = [
  ['home', 'Home', 'home'],
  ['rooms', 'Rooms', 'rooms'],
  ['controller', 'Control', 'remote'],
  ['scenes', 'Scenes', 'scenes'],
  ['settings', 'Settings', 'settings'],
];

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 6px)',
        paddingTop: 8,
        background: 'rgba(20,20,34,0.82)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        borderTop: `1px solid ${T.border}`,
        boxShadow: '0 -2px 20px rgba(0,0,0,0.6)',
        display: 'flex',
        justifyContent: 'space-around',
      }}
    >
      {TABS.map(([id, label, icon]) => {
        const act = tab === id;
        return (
          <button
            key={id}
            onClick={() => {
              haptic();
              setTab(id);
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '2px 10px', flex: 1 }}
          >
            <Icon name={icon} size={24} color={act ? T.lime : T.muted} sw={act ? 2.2 : 2} />
            <span style={{ fontSize: 10, fontWeight: 800, color: act ? T.lime : T.muted }}>{label}</span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: act ? T.lime : 'transparent' }} />
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const tab = useStore((s) => s.tab);
  const dir = useStore((s) => s.dir);
  const act = useStore((s) => s.act);
  const toast = useStore((s) => s.toast);
  const seenOnboarding = useStore((s) => s.seenOnboarding);
  const { go, setMainId, setSeenOnboarding, saveScoutCmds, saveScene } = useStore();
  const trollVariant = VARKEY[useTweaks((s) => s.trollRendering)];

  const [editHome, setEditHome] = useState(false);
  const [scout, setScout] = useState<{ open: boolean; prefill: { brand: string; model: string } | null }>({ open: false, prefill: null });
  const [devSettings, setDevSettings] = useState<Device | null>(null);
  const [roomEd, setRoomEd] = useState<{ open: boolean; room: Room | null }>({ open: false, room: null });
  const [sceneEd, setSceneEd] = useState<{ open: boolean; scene: Scene | null }>({ open: false, scene: null });
  const [addDevice, setAddDevice] = useState(false);
  const [bridgeCfg, setBridgeCfg] = useState<Bridge | null>(null);
  const [recovery, setRecovery] = useState<Device | null>(null);
  const [diagOpen, setDiagOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(!seenOnboarding);

  const openScout = (prefill: { brand: string; model: string } | null) => setScout({ open: true, prefill });
  const openDevice = (d: Device) => {
    if (d.type === 'ir') {
      setDevSettings(d);
      return;
    }
    setMainId(d.id);
    go('controller');
  };
  const duplicateScene = (s: Scene) =>
    saveScene({ ...clone(s), id: 'scene' + Date.now(), name: `${s.name} copy`, prebuilt: false, favourite: false, lastFired: '—' });

  let screen;
  if (tab === 'home') screen = <Home editHome={editHome} setEditHome={setEditHome} openDevice={openDevice} openAddDevice={() => setAddDevice(true)} />;
  else if (tab === 'rooms') screen = <Rooms openDevice={openDevice} onAddRoom={() => setRoomEd({ open: true, room: null })} onEditRoom={(r) => setRoomEd({ open: true, room: r })} />;
  else if (tab === 'controller') screen = <Controller />;
  else if (tab === 'scenes')
    screen = <Scenes onNewScene={() => setSceneEd({ open: true, scene: null })} onEditScene={(s) => setSceneEd({ open: true, scene: s })} onDuplicate={duplicateScene} />;
  else if (tab === 'activity') screen = <Activity onDiagnostics={() => setDiagOpen(true)} onRecover={(d) => setRecovery(d)} />;
  else
    screen = (
      <Settings
        openDeviceSettings={setDevSettings}
        openBridge={(b) => setBridgeCfg(b)}
        openScout={() => openScout(null)}
        onAddRoom={() => setRoomEd({ open: true, room: null })}
        onAddScene={() => setSceneEd({ open: true, scene: null })}
        onAddDevice={() => setAddDevice(true)}
        onReplay={() => setOnboarding(true)}
        onDiagnostics={() => setDiagOpen(true)}
      />
    );

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: 430,
        height: '100dvh',
        margin: '0 auto',
        background: T.bg,
        color: T.text,
        fontFamily: T.sans,
        fontWeight: 700,
        overflow: 'hidden',
      }}
    >
      <div
        key={tab}
        style={{
          position: 'absolute',
          inset: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 78px)',
        }}
      >
        <div style={{ animation: `${dir >= 0 ? 'ktSlideFwd' : 'ktSlideBack'} .32s cubic-bezier(.2,.9,.3,1)` }}>{screen}</div>
      </div>
      <TabBar tab={tab} setTab={go} />

      {/* coordinated announcement: toast pill above the tab bar, Kun Troll peeks up behind it */}
      {(act.show || toast) && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(env(safe-area-inset-bottom) + 92px)',
            left: 0,
            right: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 250,
            pointerEvents: 'none',
          }}
        >
          {act.show && (
            <div style={{ marginBottom: -14, filter: 'drop-shadow(0 6px 16px rgba(107,40,238,0.5))', animation: 'ktTrollPeek .42s cubic-bezier(.34,1.4,.5,1)' }}>
              <Troll exp={act.exp} variant={trollVariant} presence="subtle" size={72} float={false} />
            </div>
          )}
          {toast && (
            <div
              style={{
                background: 'rgba(37,37,64,0.97)',
                border: `1px solid ${T.borderStrong}`,
                borderRadius: 100,
                padding: '11px 20px',
                fontWeight: 800,
                fontSize: 14,
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                animation: 'ktToastRise .4s cubic-bezier(.2,.9,.3,1) .06s both',
              }}
            >
              {toast}
            </div>
          )}
        </div>
      )}

      {scout.open && <TrollScout prefill={scout.prefill} onClose={() => setScout({ open: false, prefill: null })} onSave={saveScoutCmds} />}
      <DeviceSettings device={devSettings} onClose={() => setDevSettings(null)} openScout={openScout} />
      <RoomEditor open={roomEd.open} room={roomEd.room} onClose={() => setRoomEd({ open: false, room: null })} />
      {sceneEd.open && <SceneBuilder existing={sceneEd.scene} onClose={() => setSceneEd({ open: false, scene: null })} />}
      {addDevice && <AddDevice onClose={() => setAddDevice(false)} openScout={openScout} />}
      {onboarding && (
        <Onboarding
          onDone={() => {
            setOnboarding(false);
            setSeenOnboarding(true);
          }}
        />
      )}
      <BridgeConfig bridge={bridgeCfg} onClose={() => setBridgeCfg(null)} />
      {recovery && <Recovery device={recovery} onClose={() => setRecovery(null)} />}
      <Diagnostics open={diagOpen} onClose={() => setDiagOpen(false)} onRecover={(d) => setRecovery(d)} />
    </div>
  );
}
