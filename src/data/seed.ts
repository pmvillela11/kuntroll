// Demo-home fixture — used ONLY by the smoke test; not reachable from the app.
// The app starts fully bare: the user discovers/adds every device and creates every scene.
import type { Bridge, Device, Room, Scene } from '../types';

export function demoHome(): { devices: Device[]; rooms: Room[]; scenes: Scene[]; bridges: Bridge[] } {
  const devices: Device[] = [
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
      id: 'l1',
      type: 'light',
      name: 'Sofa Lamp',
      model: 'Hue Color A19',
      room: 'Living Room',
      bridge: 1,
      status: 'online',
      protocol: 'Hue Local API',
      ip: '192.168.1.7',
      port: '80',
      state: { on: true, brightness: 62, temp: 2700 },
    },
  ];
  const rooms: Room[] = [{ id: 'living', name: 'Living Room', icon: 'sofa', deviceIds: ['tv', 'rec', 'l1'] }];
  const scenes: Scene[] = [
    {
      id: 'cinema',
      name: 'Cinema',
      icon: 'film',
      prebuilt: false,
      favourite: true,
      lastFired: '—',
      steps: [
        { device: 'l1', label: 'Sofa Lamp · Brightness → 10', delay: 0, action: 'brightness', value: 10 },
        { device: 'tv', label: 'Samsung TV · Turn on', delay: 500, action: 'power_on' },
        { device: 'rec', label: 'Yamaha Receiver · Volume → 35', delay: 300, action: 'volume', value: 35 },
      ],
    },
  ];
  const bridges: Bridge[] = [{ id: 1, name: 'Hue Bridge', model: 'Hue Bridge v2', ip: '192.168.1.7', status: 'online' }];
  return { devices, rooms, scenes, bridges };
}
