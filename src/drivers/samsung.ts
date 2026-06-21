// Samsung TV — Tizen remote over LAN WebSocket (non-TLS port 8001).
// Best effort: 2019+ TVs that require token pairing on wss:8002 (self-signed cert,
// unusable from WKWebView) will fail to connect and the device falls back to simulation.
import { nativeFetch } from '../lib/native';
import type { Device, DeviceState } from '../types';
import type { DeviceDriver } from './types';

const APP_NAME = typeof btoa !== 'undefined' ? btoa('Kun Troll') : 'S3VuIFRyb2xs';
const sockets = new Map<string, Promise<WebSocket>>();

function connect(ip: string): Promise<WebSocket> {
  const cached = sockets.get(ip);
  if (cached) return cached;
  const p = new Promise<WebSocket>((resolve, reject) => {
    const ws = new WebSocket(`ws://${ip}:8001/api/v2/channels/samsung.remote.control?name=${APP_NAME}`);
    const timer = setTimeout(() => {
      ws.close();
      reject(new Error('TV connect timeout'));
    }, 5000);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.event === 'ms.channel.connect') {
          clearTimeout(timer);
          resolve(ws);
        }
      } catch {
        /* ignore */
      }
    };
    ws.onerror = () => {
      clearTimeout(timer);
      reject(new Error('TV connection failed'));
    };
    ws.onclose = () => sockets.delete(ip);
  });
  sockets.set(ip, p);
  p.catch(() => sockets.delete(ip));
  return p;
}

export async function sendKey(ip: string, key: string) {
  const ws = await connect(ip);
  ws.send(
    JSON.stringify({
      method: 'ms.remote.control',
      params: { Cmd: 'Click', DataOfCmd: key, Option: 'false', TypeOfRemote: 'SendRemoteKey' },
    }),
  );
}

async function sendRepeated(ip: string, key: string, times: number) {
  for (let i = 0; i < times; i++) {
    await sendKey(ip, key);
    await new Promise((r) => setTimeout(r, 120));
  }
}

export const samsung: DeviceDriver = {
  id: 'samsung',
  async probe(device) {
    const t0 = performance.now();
    try {
      const res = await nativeFetch({ url: `http://${device.ip}:8001/api/v2/`, timeoutMs: 2500 });
      if (res.status >= 400) return { status: 'offline', latency: null };
      return { status: 'online', latency: Math.round(performance.now() - t0) };
    } catch {
      return { status: 'offline', latency: null };
    }
  },
  async setState(device: Device, patch: Partial<DeviceState>) {
    const ip = device.ip;
    if (patch.power !== undefined && patch.power !== device.state.power) await sendKey(ip, 'KEY_POWER');
    if (patch.muted !== undefined && patch.muted !== device.state.muted) await sendKey(ip, 'KEY_MUTE');
    if (patch.volume !== undefined && typeof device.state.volume === 'number') {
      const delta = patch.volume - device.state.volume;
      if (delta !== 0) await sendRepeated(ip, delta > 0 ? 'KEY_VOLUP' : 'KEY_VOLDOWN', Math.min(20, Math.abs(delta)));
    }
    if (patch.source !== undefined && patch.source !== device.state.source) await sendKey(ip, 'KEY_HDMI');
  },
};
