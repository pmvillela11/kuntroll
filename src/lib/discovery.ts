// Device discovery. Native iOS: Hue cloud lookup + mDNS browse (capacitor-zeroconf).
// Web: a simulated pool so the whole flow is testable anywhere.
// Manual IP entry in Add Device remains the universal fallback.
import { isNative, nativeFetch } from './native';
import { PROTOCOLS } from '../drivers';
import type { DeviceType } from '../types';

export interface Discovered {
  key: string;
  kind: 'device' | 'bridge';
  type: DeviceType;
  name: string;
  model: string;
  via: string;
  ip: string;
  protocol: string;
  brand: string;
}

export interface DiscoveryFilter {
  knownIps: string[];
  knownNames: string[];
}

const SIM_POOL: Discovered[] = [
  { key: 'sim-tv', kind: 'device', type: 'tv', name: 'Samsung TV', model: 'QE55Q80B', via: '192.168.1.42', ip: '192.168.1.42', protocol: PROTOCOLS.samsung, brand: 'Samsung' },
  { key: 'sim-rec', kind: 'device', type: 'receiver', name: 'Yamaha RX-A870', model: 'RX-A870', via: '192.168.1.51', ip: '192.168.1.51', protocol: PROTOCOLS.musiccast, brand: 'Yamaha' },
  { key: 'sim-hue', kind: 'bridge', type: 'light', name: 'Hue Bridge', model: 'Hue Bridge v2', via: '192.168.1.7', ip: '192.168.1.7', protocol: PROTOCOLS.hue, brand: 'Philips Hue' },
];

// Starts a scan; calls onFound progressively. Returns a cancel function.
export function discoverDevices(filter: DiscoveryFilter, onFound: (d: Discovered) => void, onDone?: () => void): () => void {
  const seen = new Set<string>();
  const emit = (d: Discovered) => {
    if (seen.has(d.key)) return;
    if (filter.knownIps.includes(d.ip) || filter.knownNames.includes(d.name)) return;
    seen.add(d.key);
    onFound(d);
  };

  if (!isNative()) {
    const timers = SIM_POOL.map((d, i) => setTimeout(() => emit(d), 900 + i * 800));
    const done = setTimeout(() => onDone?.(), 900 + SIM_POOL.length * 800 + 300);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(done);
    };
  }

  let cancelled = false;

  // 1. Hue cloud discovery — returns bridges on this network.
  nativeFetch({ url: 'https://discovery.meethue.com', timeoutMs: 5000 })
    .then((res) => {
      if (cancelled || !Array.isArray(res.data)) return;
      (res.data as Array<{ id: string; internalipaddress: string }>).forEach((b) =>
        emit({
          key: 'hue-' + b.id,
          kind: 'bridge',
          type: 'light',
          name: 'Hue Bridge',
          model: 'Hue Bridge',
          via: b.internalipaddress,
          ip: b.internalipaddress,
          protocol: PROTOCOLS.hue,
          brand: 'Philips Hue',
        }),
      );
    })
    .catch(() => {});

  // 2. mDNS browse — _hue._tcp (bridges) and _airplay._tcp (Samsung TVs advertise AirPlay).
  const watches: Array<{ type: string; handle?: unknown }> = [{ type: '_hue._tcp.' }, { type: '_airplay._tcp.' }];
  import('capacitor-zeroconf')
    .then(({ ZeroConf }) => {
      if (cancelled) return;
      watches.forEach((w) => {
        ZeroConf.watch({ type: w.type, domain: 'local.' }, (result) => {
          if (cancelled || !result || result.action !== 'resolved') return;
          const svc = result.service;
          const ip = (svc.ipv4Addresses && svc.ipv4Addresses[0]) || '';
          if (!ip) return;
          if (w.type.startsWith('_hue')) {
            emit({
              key: 'hue-mdns-' + ip,
              kind: 'bridge',
              type: 'light',
              name: svc.name || 'Hue Bridge',
              model: 'Hue Bridge',
              via: ip,
              ip,
              protocol: PROTOCOLS.hue,
              brand: 'Philips Hue',
            });
          } else if (/samsung/i.test(svc.name || '')) {
            emit({
              key: 'tv-' + ip,
              kind: 'device',
              type: 'tv',
              name: svc.name,
              model: 'Samsung TV',
              via: ip,
              ip,
              protocol: PROTOCOLS.samsung,
              brand: 'Samsung',
            });
          }
        }).catch(() => {});
      });
    })
    .catch(() => {});

  const done = setTimeout(() => onDone?.(), 8000);
  return () => {
    cancelled = true;
    clearTimeout(done);
    import('capacitor-zeroconf')
      .then(({ ZeroConf }) => watches.forEach((w) => ZeroConf.unwatch({ type: w.type, domain: 'local.' }).catch(() => {})))
      .catch(() => {});
  };
}

// Hue pairing helpers shared by the Add Device flow. Simulated on web.
export async function pairBridge(ip: string, onTick?: (attempt: number) => void): Promise<string> {
  if (!isNative()) {
    for (let i = 0; i < 3; i++) {
      onTick?.(i);
      await new Promise((r) => setTimeout(r, 1300));
    }
    return 'simulated-user-' + Math.random().toString(36).slice(2, 8);
  }
  const { pairHue } = await import('../drivers/hue');
  for (let i = 0; i < 40; i++) {
    onTick?.(i);
    const user = await pairHue(ip).catch(() => null);
    if (user) return user;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('Pairing timed out — press the bridge button and retry.');
}

export interface ImportableLight {
  hueId: string;
  name: string;
  model: string;
  on: boolean;
  brightness: number;
  temp: number;
}

export async function fetchBridgeLights(ip: string, username: string): Promise<ImportableLight[]> {
  if (!isNative()) {
    return [
      { hueId: '1', name: 'Sofa Lamp', model: 'Hue Color A19', on: true, brightness: 62, temp: 2700 },
      { hueId: '2', name: 'TV Backlight', model: 'Hue Lightstrip', on: false, brightness: 40, temp: 2700 },
      { hueId: '3', name: 'Ceiling', model: 'Hue White A60', on: false, brightness: 80, temp: 4000 },
    ];
  }
  const { listHueLights } = await import('../drivers/hue');
  return listHueLights(ip, username);
}
