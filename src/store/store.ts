import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { haptic } from '../components/ui';
import { dispatchState, probeDevice } from '../drivers';
import type {
  ActivityEvent,
  Bridge,
  Device,
  DeviceState,
  HomeSectionId,
  HomeSizes,
  LightScene,
  RemoteStyle,
  Room,
  Scene,
  SceneStep,
  ScoutCommand,
  SectionSize,
  TrollExpression,
  TrollRendering,
} from '../types';

export type Tab = 'home' | 'rooms' | 'controller' | 'scenes' | 'settings' | 'activity';
const TAB_ORDER: Tab[] = ['home', 'rooms', 'controller', 'scenes', 'settings'];

// Durable slices, persisted under the versioned key `kuntroll.v2`.
interface PersistedSlice {
  devices: Device[];
  scenes: Scene[];
  rooms: Room[];
  mainId: string | null;
  volId: string | null;
  homeOrder: HomeSectionId[];
  sizes: HomeSizes;
  lightScenes: LightScene[];
  bridges: Bridge[];
  activity: ActivityEvent[];
  seenOnboarding: boolean;
  homeName: string;
}

interface AppStore extends PersistedSlice {
  // navigation (ephemeral)
  tab: Tab;
  prev: Tab;
  dir: 1 | -1;
  go: (to: Tab) => void;
  back: () => void;

  // announcements (ephemeral): Kun Troll peek + toast pill
  act: { show: boolean; exp: TrollExpression };
  toast: string | null;
  ping: (exp?: TrollExpression) => void;
  showToast: (m: string) => void;

  logEvent: (ev: Omit<ActivityEvent, 'id' | 'ts'>) => void;

  setMainId: (id: string) => void;
  setVolId: (id: string) => void;
  setHomeOrder: (order: HomeSectionId[]) => void;
  setSize: (id: HomeSectionId, s: SectionSize) => void;
  setSeenOnboarding: (v: boolean) => void;
  setHomeName: (name: string) => void;

  updateDevice: (id: string, patch: Partial<DeviceState>) => void;
  editDevice: (d: Device) => void;
  addNewDevice: (d: Device) => void;
  reconnectDevice: (id: string) => void;
  refreshHealth: () => Promise<void>;

  favScene: (id: string) => void;
  runScene: (id: string) => void;
  saveScene: (s: Scene) => void;
  deleteScene: (id: string) => void;
  reorderScene: (from: number, to: number) => void;

  allLightsOff: () => void;
  applyLightScene: (sc: LightScene) => void;
  addLightScene: () => void;
  removeLightScene: (id: string) => void;

  saveRoom: (r: Room) => void;
  deleteRoom: (id: string) => void;
  reorderRoom: (from: number, to: number) => void;
  reorderDevice: (from: number, to: number) => void;
  reorderFav: (from: number, to: number, kind?: 'light') => void;
  removeFav: (id: string) => void;

  saveScoutCmds: (cmds: ScoutCommand[], brand: string, model: string) => void;
  saveBridge: (b: Bridge) => void;
  importHueLights: (bridge: Bridge, lights: Device[]) => void;
  eraseAll: () => void;
}

// The app starts fully bare — the user discovers/adds every device and creates every scene.
const seedState = (): PersistedSlice => ({
  devices: [],
  scenes: [],
  rooms: [],
  mainId: null,
  volId: null,
  homeOrder: ['favorites', 'lights', 'rooms', 'devices'],
  sizes: { favorites: 'M', lights: 'M', rooms: 'M', devices: 'M' },
  lightScenes: [],
  bridges: [],
  activity: [],
  seenOnboarding: false,
  homeName: '',
});

const SKEY = 'kuntroll.v2';
// One-time cleanup of the old demo-era slice.
try {
  localStorage.removeItem('kuntroll.v1');
} catch {
  /* storage unavailable */
}

// Store the durable slice flat (not wrapped in zustand's {state,version} envelope).
const flatStorage: PersistStorage<PersistedSlice> = {
  getItem: (name) => {
    try {
      const str = localStorage.getItem(name);
      if (!str) return null;
      return { state: JSON.parse(str), version: 2 };
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, JSON.stringify(value.state));
    } catch {
      /* storage unavailable */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* storage unavailable */
    }
  },
};

const move = <V,>(arr: V[], from: number, to: number): V[] => {
  const a = [...arr];
  const [m] = a.splice(from, 1);
  a.splice(to, 0, m);
  return a;
};

let actTimer: ReturnType<typeof setTimeout> | undefined;
let toastTimer: ReturnType<typeof setTimeout> | undefined;

// Translate a scene step (action + value) into a device-state patch.
// Falls back to label parsing for legacy steps without an action.
export function stepPatch(step: SceneStep): Partial<DeviceState> {
  const v = step.value;
  switch (step.action) {
    case 'power_on':
    case 'wake':
      return { power: true };
    case 'power_off':
    case 'sleep':
      return { power: false };
    case 'on':
      return { on: true };
    case 'off':
      return { on: false };
    case 'volume':
      return typeof v === 'number' ? { volume: v, muted: false } : {};
    case 'brightness':
      return typeof v === 'number' ? { on: true, brightness: v } : {};
    case 'temp':
      return typeof v === 'number' ? { temp: v } : {};
    case 'source':
      return v ? { source: String(v), power: true } : {};
    case 'input':
      return v ? { input: String(v), power: true } : {};
    case 'mode':
      return v ? { soundMode: String(v) } : {};
    default: {
      const L = step.label.toLowerCase();
      const patch: Partial<DeviceState> = {};
      if (/(off|sleep)/.test(L)) patch.power = false;
      else if (/(on|wake)/.test(L)) patch.power = true;
      const vm = step.label.match(/→\s*(\d{1,4})/) || step.label.match(/volume\D*(\d{1,3})/i);
      if (vm) patch.volume = parseInt(vm[1]);
      return patch;
    }
  }
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => {
      // Optimistic local update + real driver dispatch; on failure mark offline + log.
      const pushState = (device: Device, patch: Partial<DeviceState>) => {
        dispatchState(device, patch, get().bridges).then((ok) => {
          if (ok) return;
          set((s) => ({
            devices: s.devices.map((d) => (d.id === device.id ? { ...d, status: 'offline' as const } : d)),
          }));
          get().logEvent({
            kind: 'command',
            status: 'fail',
            title: 'No response',
            icon: 'cancel',
            detail: `${device.name} didn't acknowledge the command`,
          });
        });
      };

      return {
        ...seedState(),

        tab: 'home',
        prev: 'home',
        dir: 1,
        go: (to) => {
          const { tab } = get();
          if (to === tab) return;
          const dir = TAB_ORDER.indexOf(to) >= TAB_ORDER.indexOf(tab) ? 1 : -1;
          set({ dir, prev: tab, tab: to });
        },
        back: () => {
          const { prev } = get();
          set({ dir: -1, tab: prev === 'controller' ? 'home' : prev });
        },

        act: { show: false, exp: 'wow' },
        toast: null,
        ping: (exp = 'wow') => {
          set({ act: { show: true, exp } });
          if (actTimer) clearTimeout(actTimer);
          actTimer = setTimeout(() => set((s) => ({ act: { ...s.act, show: false } })), 1900);
        },
        showToast: (m) => {
          set({ toast: m });
          if (toastTimer) clearTimeout(toastTimer);
          toastTimer = setTimeout(() => set({ toast: null }), 1900);
        },

        logEvent: (ev) =>
          set((s) => ({
            activity: [
              { id: 'ev' + Date.now() + Math.random().toString(36).slice(2, 6), ts: Date.now(), ...ev },
              ...s.activity,
            ].slice(0, 80),
          })),

        setMainId: (id) => set({ mainId: id }),
        setVolId: (id) => set({ volId: id }),
        setHomeOrder: (order) => set({ homeOrder: order }),
        setSize: (id, sz) => set((s) => ({ sizes: { ...s.sizes, [id]: sz } })),
        setSeenOnboarding: (v) => set({ seenOnboarding: v }),
        setHomeName: (name) => set({ homeName: name }),

        updateDevice: (id, patch) => {
          const device = get().devices.find((d) => d.id === id);
          if (!device) return;
          set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, state: { ...d.state, ...patch } } : d)) }));
          pushState(device, patch);
        },
        editDevice: (nd) => set((s) => ({ devices: s.devices.map((d) => (d.id === nd.id ? nd : d)) })),
        addNewDevice: (d) => {
          set((s) => ({
            devices: [...s.devices, d],
            // first controllable device becomes the Control screen's main; first volume-capable feeds the volume bar
            mainId: s.mainId ?? (d.type !== 'ir' ? d.id : s.mainId),
            volId: s.volId ?? (typeof d.state.volume === 'number' ? d.id : s.volId),
          }));
          get().showToast(`${d.name} added`);
          get().ping('wow');
          get().logEvent({ kind: 'command', status: 'ok', title: `${d.name} added`, icon: 'plus', detail: d.model });
        },
        reconnectDevice: (id) => {
          const dv = get().devices.find((d) => d.id === id);
          set((s) => ({
            devices: s.devices.map((d) => (d.id === id ? { ...d, status: 'online', latency: 32, lastSeen: 'now' } : d)),
          }));
          get().ping('wow');
          get().showToast(`${dv ? dv.name : 'Device'} reconnected`);
          get().logEvent({
            kind: 'command',
            status: 'ok',
            title: 'Reconnected',
            icon: 'refresh',
            detail: (dv ? dv.name : 'Device') + ' is back online',
          });
        },
        refreshHealth: async () => {
          const { devices, bridges } = get();
          await Promise.all(
            devices.map(async (d) => {
              const h = await probeDevice(d, bridges);
              set((s) => ({
                devices: s.devices.map((x) =>
                  x.id === d.id
                    ? { ...x, status: h.status, latency: h.latency, lastSeen: h.status === 'online' ? 'now' : x.lastSeen }
                    : x,
                ),
              }));
            }),
          );
        },

        favScene: (id) =>
          set((s) => ({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, favourite: !x.favourite } : x)) })),
        runScene: (id) => {
          const { scenes, devices, ping, showToast, logEvent, go, updateDevice } = get();
          const s = scenes.find((x) => x.id === id);
          if (!s) return;
          haptic(15);
          // execute steps in order, honouring per-step delays
          let cum = 0;
          s.steps.forEach((step) => {
            cum += step.delay;
            const patch = stepPatch(step);
            const targets =
              step.device === 'lights' ? devices.filter((d) => d.type === 'light').map((d) => d.id) : [step.device];
            setTimeout(() => {
              targets.forEach((tid) => {
                if (Object.keys(patch).length) updateDevice(tid, patch);
              });
            }, cum);
          });
          const stepDevIds = [...new Set(s.steps.map((st) => st.device).filter((x) => x !== 'lights'))];
          const failed = stepDevIds
            .map((did) => devices.find((d) => d.id === did))
            .filter((d): d is Device => !!d && d.status === 'offline');
          if (failed.length) {
            ping('sleepy');
            showToast(`${s.name} — ${failed.length} device didn't respond`);
            logEvent({
              kind: 'scene',
              status: 'partial',
              title: s.name,
              icon: s.icon,
              detail: `${failed[0].name} offline · ${s.steps.length - failed.length}/${s.steps.length} sent`,
            });
          } else {
            ping('wow');
            showToast(`${s.name} is on`);
            logEvent({ kind: 'scene', status: 'ok', title: s.name, icon: s.icon, detail: `${s.steps.length} commands sent` });
          }
          const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
          set((st) => ({ scenes: st.scenes.map((x) => (x.id === id ? { ...x, lastFired: now } : x)) }));
          go('controller');
        },
        saveScene: (sc) => {
          set((s) => ({
            scenes: s.scenes.some((x) => x.id === sc.id) ? s.scenes.map((x) => (x.id === sc.id ? sc : x)) : [...s.scenes, sc],
          }));
          get().showToast(`${sc.name} saved`);
        },
        deleteScene: (id) => {
          haptic();
          set((s) => ({ scenes: s.scenes.filter((x) => x.id !== id) }));
          get().showToast('Scene deleted');
        },
        reorderScene: (from, to) => set((s) => ({ scenes: move(s.scenes, from, to) })),

        allLightsOff: () => {
          haptic(12);
          get()
            .devices.filter((d) => d.type === 'light')
            .forEach((d) => get().updateDevice(d.id, { on: false }));
          get().ping('happy');
          get().showToast('All lights off');
          get().logEvent({ kind: 'command', status: 'ok', title: 'All lights off', icon: 'lightoff', detail: 'Every light' });
        },
        applyLightScene: (sc) => {
          haptic(12);
          get()
            .devices.filter((d) => d.type === 'light')
            .forEach((d) => {
              const snap = sc.snapshot && sc.snapshot[d.id];
              const patch = snap ? snap : sc.preset ? { on: true, brightness: sc.preset.brightness, temp: sc.preset.temp } : null;
              if (patch) get().updateDevice(d.id, patch);
            });
          get().ping('happy');
          get().showToast(`${sc.name} · lights set`);
        },
        addLightScene: () => {
          const { devices, lightScenes } = get();
          const snapshot: NonNullable<LightScene['snapshot']> = {};
          devices
            .filter((d) => d.type === 'light')
            .forEach((l) => {
              snapshot[l.id] = { on: l.state.on, brightness: l.state.brightness, temp: l.state.temp };
            });
          const n = lightScenes.filter((s) => s.snapshot).length + 1;
          set((s) => ({
            lightScenes: [...s.lightScenes, { id: 'ls' + Date.now(), name: 'My Scene ' + n, icon: 'sparkle', snapshot }],
          }));
          haptic(12);
          get().showToast('Light scene saved');
        },
        removeLightScene: (id) => {
          haptic();
          set((s) => ({ lightScenes: s.lightScenes.filter((x) => x.id !== id) }));
          get().showToast('Light scene removed');
        },

        saveRoom: (r) =>
          set((s) => ({
            rooms: s.rooms.some((x) => x.id === r.id) ? s.rooms.map((x) => (x.id === r.id ? r : x)) : [...s.rooms, r],
          })),
        deleteRoom: (id) => {
          haptic();
          set((s) => ({ rooms: s.rooms.filter((r) => r.id !== id) }));
          get().showToast('Room removed');
        },
        reorderRoom: (from, to) => set((s) => ({ rooms: move(s.rooms, from, to) })),
        reorderDevice: (from, to) =>
          set((s) => {
            const core = s.devices.filter((d) => d.type !== 'light' && d.type !== 'ir');
            const moved = move(core, from, to);
            let i = 0;
            return { devices: s.devices.map((d) => (d.type !== 'light' && d.type !== 'ir' ? moved[i++] : d)) };
          }),
        reorderFav: (from, to, kind) => {
          if (kind === 'light') {
            set((s) => ({ lightScenes: move(s.lightScenes, from, to) }));
            return;
          }
          set((s) => {
            const favs = s.scenes.filter((x) => x.favourite);
            const moved = move(favs, from, to);
            let i = 0;
            return { scenes: s.scenes.map((x) => (x.favourite ? moved[i++] : x)) };
          });
        },
        removeFav: (id) => {
          haptic();
          set((s) => ({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, favourite: false } : x)) }));
          get().showToast('Removed from Home');
        },

        saveScoutCmds: (cmds, brand, model) => {
          if (!cmds || !cmds.length) return;
          // Attach confirmed commands to the matching device (by model, else by brand in name).
          set((s) => ({
            devices: s.devices.map((d) => {
              const match =
                (!!model && d.model === model) || (!!brand && d.name.toLowerCase().includes(String(brand).toLowerCase()));
              if (!match) return d;
              const prior = d.commands || [];
              const merged = [
                ...prior,
                ...cmds.map((c) => ({ name: c.name, code: c.code, source: 'ai_fetched' as const, confidence: c.confidence })),
              ];
              return { ...d, commands: merged };
            }),
          }));
          get().showToast(`${cmds.length} command${cmds.length > 1 ? 's' : ''} saved`);
          get().ping('wow');
          get().logEvent({
            kind: 'scout',
            status: 'ok',
            title: `${cmds.length} commands saved`,
            icon: 'bolt',
            detail: `${brand || ''} ${model || ''}`.trim() + ' · via Troll Scout',
          });
        },
        saveBridge: (b) =>
          set((s) => ({
            bridges: s.bridges.some((x) => x.id === b.id) ? s.bridges.map((x) => (x.id === b.id ? b : x)) : [...s.bridges, b],
          })),
        importHueLights: (bridge, lights) => {
          get().saveBridge(bridge);
          set((s) => {
            const devices = [...s.devices, ...lights];
            const first = lights[0];
            return {
              devices,
              mainId: s.mainId ?? (first ? first.id : null),
            };
          });
          get().showToast(`${lights.length} light${lights.length === 1 ? '' : 's'} added`);
          get().ping('love');
          get().logEvent({
            kind: 'command',
            status: 'ok',
            title: `${bridge.name} paired`,
            icon: 'light',
            detail: `${lights.length} lights imported`,
          });
        },
        eraseAll: () => {
          if (!window.confirm('Erase all data — devices, scenes, rooms and activity? This starts setup over.')) return;
          try {
            localStorage.removeItem(SKEY);
          } catch {
            /* storage unavailable */
          }
          set({ ...seedState() });
          haptic(20);
          get().go('home');
        },
      };
    },
    {
      name: SKEY,
      version: 2,
      storage: flatStorage,
      partialize: (s) => ({
        devices: s.devices,
        scenes: s.scenes,
        rooms: s.rooms,
        mainId: s.mainId,
        volId: s.volId,
        homeOrder: s.homeOrder,
        sizes: s.sizes,
        lightScenes: s.lightScenes,
        bridges: s.bridges,
        activity: s.activity,
        seenOnboarding: s.seenOnboarding,
        homeName: s.homeName,
      }),
    },
  ),
);

// ---- Tweaks (design options, separate from app data) ----
interface TweaksStore {
  remoteStyle: RemoteStyle;
  trollRendering: TrollRendering;
  setTweak: <K extends 'remoteStyle' | 'trollRendering'>(k: K, v: TweaksStore[K]) => void;
}

export const useTweaks = create<TweaksStore>()(
  persist(
    (set) => ({
      remoteStyle: 'soft',
      trollRendering: 'Pebble',
      setTweak: (k, v) => set({ [k]: v }),
    }),
    { name: 'kuntroll.tweaks' },
  ),
);

export const VARKEY = { Pebble: 'A', Quiet: 'C', Sticker: 'B' } as const;

export function greetingNow(online: number, total: number, homeName?: string) {
  const h = new Date().getHours();
  const main = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  if (total === 0) return { main, sub: "Let's set up your home" };
  const counts = `${online} of ${total} devices online`;
  return { main, sub: homeName ? `${homeName} · ${counts}` : counts };
}
