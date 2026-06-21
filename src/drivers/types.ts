import type { Bridge, Device, DeviceState } from '../types';

export interface DriverHealth {
  status: 'online' | 'offline';
  latency: number | null;
}

export interface DriverContext {
  bridges: Bridge[];
}

// One driver per protocol. setState pushes a state patch to the real device;
// probe measures reachability/latency for Diagnostics.
export interface DeviceDriver {
  id: string;
  probe(device: Device, ctx: DriverContext): Promise<DriverHealth>;
  setState(device: Device, patch: Partial<DeviceState>, ctx: DriverContext): Promise<void>;
}
