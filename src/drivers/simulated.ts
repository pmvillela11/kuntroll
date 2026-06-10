// Simulated home: every command succeeds after a small realistic latency.
// Used for all devices on web, and on native for devices without a real driver.
import type { DeviceDriver } from './types';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const jitter = (lo: number, hi: number) => Math.round(lo + Math.random() * (hi - lo));

export const simulated: DeviceDriver = {
  id: 'simulated',
  async probe() {
    await wait(jitter(20, 60));
    return { status: 'online', latency: jitter(14, 46) };
  },
  async setState() {
    await wait(jitter(40, 140));
  },
};
