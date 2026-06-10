// Seed demo data — port of the handoff's data.jsx. Mock data first; real device I/O comes later (§8).
import type { ActivityEvent, Bridge, Device, LightScene, Room, Scene } from '../types';

const CORE: Device[] = [
  {
    id: 'tv',
    type: 'tv',
    name: 'Samsung TV',
    model: 'QE75QN800BT',
    room: 'Living Room',
    status: 'online',
    protocol: 'WebSocket LAN',
    ip: '192.168.1.42',
    port: '8001',
    latency: 24,
    lastSeen: 'now',
    state: { power: true, source: 'HDMI1', volume: 42, muted: false },
  },
  {
    id: 'rec',
    type: 'receiver',
    name: 'Yamaha Receiver',
    model: 'RX-A870',
    room: 'Living Room',
    status: 'online',
    protocol: 'MusicCast REST',
    ip: '192.168.1.51',
    port: '80',
    latency: 38,
    lastSeen: 'now',
    state: { power: true, input: 'Apple TV', volume: 35, muted: false, soundMode: 'Movie' },
  },
  {
    id: 'atv',
    type: 'appletv',
    name: 'Apple TV',
    model: 'Apple TV 4K',
    room: 'Living Room',
    status: 'online',
    protocol: 'MediaRemoteTV',
    ip: '192.168.1.66',
    port: 'mDNS',
    latency: 19,
    lastSeen: 'now',
    state: { power: true, app: 'Home' },
  },
  {
    id: 'ir',
    type: 'ir',
    name: 'IR Gateway',
    model: 'Global Caché iTach',
    room: 'Living Room',
    status: 'offline',
    protocol: 'TCP → IR',
    ip: '169.254.1.70',
    port: '4998',
    latency: null,
    lastSeen: '26h ago',
    state: {},
  },
];

// Each Hue lamp is its own device (not a single "Philips Hue").
const LAMPS: Device[] = [
  { id: 'l1', type: 'light', name: 'Sofa Lamp', model: 'Hue Color A19', room: 'Living Room', bridge: 1, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.7', port: '443', state: { on: true, brightness: 62, temp: 2700 } },
  { id: 'l2', type: 'light', name: 'TV Backlight', model: 'Hue Lightstrip', room: 'Living Room', bridge: 1, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.7', port: '443', state: { on: true, brightness: 40, temp: 2700 } },
  { id: 'l3', type: 'light', name: 'Ceiling', model: 'Hue White A60', room: 'Living Room', bridge: 1, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.7', port: '443', state: { on: false, brightness: 80, temp: 4000 } },
  { id: 'l4', type: 'light', name: 'Bedside', model: 'Hue Color A19', room: 'Bedroom', bridge: 2, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.9', port: '443', state: { on: false, brightness: 30, temp: 2700 } },
  { id: 'l5', type: 'light', name: 'Wardrobe', model: 'Hue White A60', room: 'Bedroom', bridge: 2, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.9', port: '443', state: { on: false, brightness: 55, temp: 3000 } },
  { id: 'l6', type: 'light', name: 'Counter', model: 'Hue Lightstrip', room: 'Kitchen', bridge: 1, status: 'online', protocol: 'Hue Local API v2', ip: '192.168.1.7', port: '443', state: { on: true, brightness: 90, temp: 4000 } },
];

export const DEVICES: Device[] = [...CORE, ...LAMPS];

export const ROOMS: Room[] = [
  { id: 'living', name: 'Living Room', icon: 'sofa', deviceIds: ['tv', 'rec', 'atv', 'l1', 'l2', 'l3'] },
  { id: 'bedroom', name: 'Bedroom', icon: 'bed', deviceIds: ['l4', 'l5'] },
  { id: 'kitchen', name: 'Kitchen', icon: 'kitchen', deviceIds: ['l6'] },
];

// Scenes — light steps reference the virtual 'lights' group for display.
export const SCENES: Scene[] = [
  {
    id: 'cinema',
    name: 'Cinema',
    icon: 'film',
    prebuilt: true,
    favourite: true,
    lastFired: '8:42 PM',
    steps: [
      { device: 'lights', label: 'Lights → 10% warm', delay: 0 },
      { device: 'rec', label: 'Receiver ON · HDMI1', delay: 500 },
      { device: 'tv', label: 'TV ON · Source HDMI1', delay: 800 },
      { device: 'atv', label: 'Apple TV wake', delay: 500 },
      { device: 'rec', label: 'Volume → 35', delay: 300 },
    ],
  },
  {
    id: 'goodnight',
    name: 'Good Night',
    icon: 'moon',
    prebuilt: true,
    favourite: true,
    lastFired: 'Yesterday',
    steps: [
      { device: 'atv', label: 'Apple TV sleep', delay: 0 },
      { device: 'tv', label: 'TV OFF', delay: 400 },
      { device: 'rec', label: 'Receiver OFF', delay: 400 },
      { device: 'lights', label: 'Bedroom → 5% warm', delay: 300 },
    ],
  },
  {
    id: 'goodmorning',
    name: 'Good Morning',
    icon: 'sun',
    prebuilt: true,
    favourite: false,
    lastFired: '—',
    steps: [
      { device: 'lights', label: 'Living room → 80% cool', delay: 0 },
      { device: 'atv', label: 'Apple TV wake', delay: 400 },
      { device: 'tv', label: 'TV ON · Apple TV', delay: 600 },
    ],
  },
  {
    id: 'music',
    name: 'Music',
    icon: 'note',
    prebuilt: true,
    favourite: true,
    lastFired: '2 days ago',
    steps: [
      { device: 'rec', label: 'Receiver ON · AirPlay', delay: 0 },
      { device: 'rec', label: 'Sound Mode → Stereo', delay: 300 },
      { device: 'lights', label: 'Lights → 60% warm', delay: 300 },
      { device: 'atv', label: 'Apple TV → Music', delay: 400 },
    ],
  },
  {
    id: 'tvoff',
    name: 'TV Off',
    icon: 'power',
    prebuilt: true,
    favourite: true,
    lastFired: '8:42 PM',
    steps: [
      { device: 'atv', label: 'Apple TV sleep', delay: 0 },
      { device: 'tv', label: 'TV OFF', delay: 400 },
      { device: 'rec', label: 'Receiver OFF', delay: 400 },
    ],
  },
];

export const SOURCES: Record<'tv' | 'rec', string[]> = {
  tv: ['HDMI1', 'HDMI2', 'HDMI3', 'TV', 'Apple TV'],
  rec: ['Apple TV', 'HDMI2', 'AirPlay', 'Spotify', 'Tuner', 'Phono'],
};
export const SOUND_MODES = ['Movie', 'Music', 'Sport', 'Game', 'Straight'];

// Hue hubs (bridges) — configured in Settings › Lights.
export const BRIDGES: Bridge[] = [
  { id: 1, name: 'Living Room Bridge', model: 'Hue Bridge v2', ip: '192.168.1.7', status: 'online' },
  { id: 2, name: 'Bedroom Bridge', model: 'Hue Bridge v2', ip: '192.168.1.9', status: 'online' },
];

// Built-in Hue light scenes (presets) for the Lights section.
export const LIGHT_SCENES: LightScene[] = [
  { id: 'relax', name: 'Relax', icon: 'moon', preset: { brightness: 30, temp: 2200 } },
  { id: 'concentrate', name: 'Concentrate', icon: 'sun', preset: { brightness: 90, temp: 4600 } },
  { id: 'energize', name: 'Energize', icon: 'bolt', preset: { brightness: 100, temp: 6500 } },
  { id: 'nightlight', name: 'Nightlight', icon: 'moon', preset: { brightness: 5, temp: 2200 } },
];

export function seedActivity(): ActivityEvent[] {
  const now = Date.now();
  return [
    { id: 's1', ts: now - 1000 * 60 * 8, kind: 'scene', status: 'ok', title: 'Cinema', icon: 'film', detail: '5 commands sent' },
    { id: 's2', ts: now - 1000 * 60 * 42, kind: 'command', status: 'ok', title: 'Volume 35', icon: 'receiver', detail: 'Yamaha Receiver' },
    { id: 's3', ts: now - 1000 * 60 * 60 * 2, kind: 'scene', status: 'partial', title: 'Good Morning', icon: 'sun', detail: 'IR Gateway offline · 2/3 sent' },
    { id: 's4', ts: now - 1000 * 60 * 60 * 5, kind: 'scout', status: 'ok', title: '8 commands saved', icon: 'bolt', detail: 'Samsung QE75QN800BT · via Troll Scout' },
    { id: 's5', ts: now - 1000 * 60 * 60 * 22, kind: 'scene', status: 'ok', title: 'Good Night', icon: 'moon', detail: '4 commands sent' },
    { id: 's6', ts: now - 1000 * 60 * 60 * 26, kind: 'command', status: 'fail', title: 'Power on', icon: 'ir', detail: 'IR Gateway — no response' },
  ];
}

export const clone = <V,>(o: V): V => JSON.parse(JSON.stringify(o));
