// Yamaha MusicCast — Extended Control REST API over plain HTTP (main zone).
import { nativeFetch } from '../lib/native';
import type { DeviceDriver } from './types';

const base = (ip: string) => `http://${ip}/YamahaExtendedControl/v1/main`;

// App-facing names → MusicCast input ids (best-effort defaults; editable later per device).
const INPUT_MAP: Record<string, string> = {
  'apple tv': 'hdmi1',
  hdmi1: 'hdmi1',
  hdmi2: 'hdmi2',
  hdmi3: 'hdmi3',
  airplay: 'airplay',
  spotify: 'spotify',
  tuner: 'tuner',
  phono: 'phono',
};
const PROGRAM_MAP: Record<string, string> = {
  movie: 'standard',
  music: '2ch_stereo',
  sport: 'sports',
  game: 'action_game',
  straight: 'straight',
};

async function call(ip: string, path: string) {
  const res = await nativeFetch({ url: `${base(ip)}/${path}` });
  const code = (res.data as { response_code?: number })?.response_code;
  if (res.status >= 400 || (code !== undefined && code !== 0)) throw new Error(`MusicCast error on ${path}`);
  return res.data as Record<string, unknown>;
}

export const musiccast: DeviceDriver = {
  id: 'musiccast',
  async probe(device) {
    const t0 = performance.now();
    try {
      await call(device.ip, 'getStatus');
      return { status: 'online', latency: Math.round(performance.now() - t0) };
    } catch {
      return { status: 'offline', latency: null };
    }
  },
  async setState(device, patch) {
    const ip = device.ip;
    if (patch.power !== undefined) await call(ip, `setPower?power=${patch.power ? 'on' : 'standby'}`);
    if (patch.muted !== undefined) await call(ip, `setMute?enable=${patch.muted}`);
    if (patch.volume !== undefined) {
      // volume is device-unit based; read max and map our 0–100%
      const st = (await call(ip, 'getStatus')) as { max_volume?: number };
      const max = typeof st.max_volume === 'number' ? st.max_volume : 100;
      await call(ip, `setVolume?volume=${Math.round((patch.volume / 100) * max)}`);
    }
    if (patch.input !== undefined) {
      const id = INPUT_MAP[String(patch.input).toLowerCase()] || String(patch.input).toLowerCase().replace(/\s+/g, '');
      await call(ip, `setInput?input=${id}`);
    }
    if (patch.soundMode !== undefined) {
      const prog = PROGRAM_MAP[String(patch.soundMode).toLowerCase()] || 'straight';
      await call(ip, `setSoundProgram?program=${prog}`);
    }
  },
};
