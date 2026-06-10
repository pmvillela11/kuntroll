// Driver registry — picks the real protocol driver on native iOS, simulation everywhere else.
import { isNative } from '../lib/native';
import type { Bridge, Device, DeviceState } from '../types';
import { hue } from './hue';
import { musiccast } from './musiccast';
import { samsung } from './samsung';
import { simulated } from './simulated';
import type { DeviceDriver, DriverHealth } from './types';

export const PROTOCOLS = {
  hue: 'Hue Local API',
  samsung: 'Samsung WS',
  musiccast: 'MusicCast REST',
  simulated: '—',
} as const;

export function driverFor(device: Device): DeviceDriver {
  if (!isNative()) return simulated;
  switch (device.protocol) {
    case PROTOCOLS.hue:
      return hue;
    case PROTOCOLS.samsung:
      return samsung;
    case PROTOCOLS.musiccast:
      return musiccast;
    default:
      return simulated;
  }
}

// Push a state patch to the device. Resolves true on success, false on failure
// (caller decides how to surface it — Activity/offline UI is built for this).
export async function dispatchState(device: Device, patch: Partial<DeviceState>, bridges: Bridge[]): Promise<boolean> {
  try {
    await driverFor(device).setState(device, patch, { bridges });
    return true;
  } catch {
    return false;
  }
}

export async function probeDevice(device: Device, bridges: Bridge[]): Promise<DriverHealth> {
  try {
    return await driverFor(device).probe(device, { bridges });
  } catch {
    return { status: 'offline', latency: null };
  }
}
