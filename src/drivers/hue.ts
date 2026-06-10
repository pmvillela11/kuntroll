// Philips Hue — local API v1 over HTTP via the bridge (avoids v2's self-signed-cert issue).
// Pairing: press the bridge link button, then POST /api until it returns a username.
import { nativeFetch } from '../lib/native';
import type { Device } from '../types';
import type { DeviceDriver, DriverContext } from './types';

const APP_ID = 'kun_troll#iphone';

function bridgeFor(device: Device, ctx: DriverContext) {
  const b = ctx.bridges.find((x) => x.id === device.bridge);
  if (!b || !b.username) throw new Error('Hue bridge not paired');
  return b;
}

// brightness % → bri 1..254 · temp K → ct mireds 153..500
const toBri = (pct: number) => Math.max(1, Math.min(254, Math.round((pct / 100) * 254)));
const toCt = (kelvin: number) => Math.max(153, Math.min(500, Math.round(1_000_000 / kelvin)));

export interface HueLight {
  hueId: string;
  name: string;
  model: string;
  on: boolean;
  brightness: number;
  temp: number;
}

// One pairing attempt. Resolves a username once the link button has been pressed; null while waiting.
export async function pairHue(ip: string): Promise<string | null> {
  const res = await nativeFetch({ url: `http://${ip}/api`, method: 'POST', body: { devicetype: APP_ID } });
  const arr = res.data as Array<{ success?: { username: string }; error?: { type: number } }>;
  if (Array.isArray(arr) && arr[0]?.success?.username) return arr[0].success.username;
  if (Array.isArray(arr) && arr[0]?.error?.type === 101) return null; // link button not pressed yet
  throw new Error('Unexpected bridge response');
}

export async function listHueLights(ip: string, username: string): Promise<HueLight[]> {
  const res = await nativeFetch({ url: `http://${ip}/api/${username}/lights` });
  const obj = res.data as Record<string, { name: string; modelid?: string; state: { on: boolean; bri?: number; ct?: number } }>;
  return Object.entries(obj).map(([hueId, l]) => ({
    hueId,
    name: l.name,
    model: l.modelid || 'Hue light',
    on: !!l.state.on,
    brightness: Math.round(((l.state.bri ?? 254) / 254) * 100),
    temp: l.state.ct ? Math.round(1_000_000 / l.state.ct) : 2700,
  }));
}

export const hue: DeviceDriver = {
  id: 'hue',
  async probe(device, ctx) {
    const b = bridgeFor(device, ctx);
    const t0 = performance.now();
    const res = await nativeFetch({ url: `http://${b.ip}/api/${b.username}/config`, timeoutMs: 2500 });
    if (res.status >= 400) return { status: 'offline', latency: null };
    return { status: 'online', latency: Math.round(performance.now() - t0) };
  },
  async setState(device, patch, ctx) {
    const b = bridgeFor(device, ctx);
    if (!device.hueId) throw new Error('Light has no Hue id');
    const body: Record<string, unknown> = {};
    if (patch.on !== undefined) body.on = patch.on;
    if (patch.brightness !== undefined) {
      body.bri = toBri(patch.brightness);
      if (patch.on === undefined) body.on = true;
    }
    if (patch.temp !== undefined) body.ct = toCt(patch.temp);
    if (Object.keys(body).length === 0) return;
    const res = await nativeFetch({
      url: `http://${b.ip}/api/${b.username}/lights/${device.hueId}/state`,
      method: 'PUT',
      body,
    });
    if (res.status >= 400) throw new Error('Hue command failed');
  },
};
