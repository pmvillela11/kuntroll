import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import {
  BRIDGES,
  DEVICES,
  LIGHT_SCENES,
  ROOMS,
  SCENES,
  clone,
  seedActivity,
} from '../data/seed';
import { haptic } from '../components/ui';
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
  ScoutCommand,
  SectionSize,
  TrollExpression,
  TrollRendering,
} from '../types';

export type Tab = 'home' | 'rooms' | 'controller' | 'scenes' | 'settings' | 'activity';
const TAB_ORDER: Tab[] = ['home', 'rooms', 'controller', 'scenes', 'settings'];

// Durable slices, persisted under the versioned key `kuntroll.v1` — same shape as the prototype.
interface PersistedSlice {
  devices: Device[];
  scenes: Scene[];
  rooms: Room[];
  mainId: string;
  volId: string;
  homeOrder: HomeSectionId[];
  sizes: HomeSizes;
  lightScenes: LightScene[];
  bridges: Bridge[];
  activity: ActivityEvent[];
  seenOnboarding: boolean;
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

  updateDevice: (id: string, patch: Partial<DeviceState>) => void;
  editDevice: (d: Device) => void;
  addNewDevice: (d: Device) => void;
  reconnectDevice: (id: string) => void;

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
  editBridge: (b: Bridge) => void;
  resetDemo: () => void;
}

const seedState = (): PersistedSlice => ({
  devices: clone(DEVICES),
  scenes: clone(SCENES),
  rooms: clone(ROOMS),
  mainId: 'tv',
  volId: 'rec',
  homeOrder: ['favorites', 'lights', 'rooms', 'devices'],
  sizes: { favorites: 'M', lights: 'M', rooms: 'M', devices: 'M' },
  lightScenes: clone(LIGHT_SCENES),
  bridges: clone(BRIDGES),
  activity: seedActivity(),
  seenOnboarding: false,
});

// Store the durable slice flat (not wrapped in zustand's {state,version} envelope) so the
// localStorage shape stays identical to the prototype's `kuntroll.v1`.
const flatStorage: PersistStorage<PersistedSlice> = {
  getItem: (name) => {
    try {
      const str = localStorage.getItem(name);
      if (!str) return null;
      return { state: JSON.parse(str), version: 1 };
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

// Apply a scene's steps to local device state (mock execution; real command layer comes later).
function applyScene(devices: Device[], s: Scene): Device[] {
  return devices.map((dv) => {
    const st = { ...dv.state };
    s.steps.forEach((step) => {
      if (step.device !== dv.id) return;
      const L = step.label.toLowerCase();
      if (/(off|sleep)/.test(L)) st.power = false;
      else if (/(on|wake)/.test(L)) st.power = true;
      const vm = step.label.match(/→\s*(\d{1,3})/) || step.label.match(/volume\D*(\d{1,3})/i);
      if (vm && typeof st.volume === 'number') st.volume = parseInt(vm[1]);
    });
    return { ...dv, state: st };
  });
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
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

      updateDevice: (id, patch) =>
        set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, state: { ...d.state, ...patch } } : d)) })),
      editDevice: (nd) => set((s) => ({ devices: s.devices.map((d) => (d.id === nd.id ? nd : d)) })),
      addNewDevice: (d) => {
        set((s) => ({ devices: [...s.devices, d] }));
        get().showToast(`${d.name} added`);
        get().ping('wow');
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

      favScene: (id) =>
        set((s) => ({ scenes: s.scenes.map((x) => (x.id === id ? { ...x, favourite: !x.favourite } : x)) })),
      runScene: (id) => {
        const { scenes, devices, ping, showToast, logEvent, go } = get();
        const s = scenes.find((x) => x.id === id);
        if (!s) return;
        haptic(15);
        set({ devices: applyScene(devices, s) });
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
        set((s) => ({
          devices: s.devices.map((d) => (d.type === 'light' ? { ...d, state: { ...d.state, on: false } } : d)),
        }));
        get().ping('happy');
        get().showToast('All lights off');
        get().logEvent({ kind: 'command', status: 'ok', title: 'All lights off', icon: 'lightoff', detail: 'Every Hue light' });
      },
      applyLightScene: (sc) => {
        haptic(12);
        set((s) => ({
          devices: s.devices.map((d) => {
            if (d.type !== 'light') return d;
            const snap = sc.snapshot && sc.snapshot[d.id];
            return {
              ...d,
              state: { ...d.state, ...(snap ? snap : { on: true, brightness: sc.preset!.brightness, temp: sc.preset!.temp }) },
            };
          }),
        }));
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
        set((s) => ({ lightScenes: [...s.lightScenes, { id: 'ls' + Date.now(), name: 'My Scene ' + n, icon: 'sparkle', snapshot }] }));
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
      editBridge: (b) => set((s) => ({ bridges: s.bridges.map((x) => (x.id === b.id ? b : x)) })),
      resetDemo: () => {
        if (!window.confirm('Reset all demo data — devices, scenes, rooms and activity — to factory defaults?')) return;
        set({ ...seedState(), seenOnboarding: true });
        haptic(20);
        get().showToast('Demo data reset');
        get().go('home');
      },
    }),
    {
      name: 'kuntroll.v1',
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

export function greetingNow(online: number, total: number) {
  const h = new Date().getHours();
  return {
    main: h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening',
    sub: `${online} of ${total} devices online`,
  };
}
