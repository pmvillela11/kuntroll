import type { IconName } from './components/Icon';

export type DeviceType = 'tv' | 'receiver' | 'appletv' | 'light' | 'ir';
export type DeviceStatus = 'online' | 'offline';
export type CommandSource = 'manual' | 'library' | 'ai_fetched';
export type RemoteStyle = 'flat' | 'soft' | 'tactile';
export type TrollRendering = 'Pebble' | 'Quiet' | 'Sticker';
export type TrollVariant = 'A' | 'B' | 'C';
export type TrollExpression = 'happy' | 'wow' | 'wink' | 'sleepy' | 'love';

export interface DeviceCommand {
  name: string;
  code: string;
  source: CommandSource;
  confidence: number; // 0..1
}

export interface DeviceState {
  power?: boolean;
  source?: string;
  volume?: number;
  muted?: boolean;
  input?: string;
  soundMode?: string;
  app?: string;
  on?: boolean;
  brightness?: number;
  temp?: number;
}

export interface Device {
  id: string;
  type: DeviceType;
  name: string;
  model: string;
  room: string;
  status: DeviceStatus;
  protocol: string;
  ip: string;
  port: string;
  latency?: number | null;
  lastSeen?: string;
  bridge?: number;
  hueId?: string; // light id on its Hue bridge
  state: DeviceState;
  commands?: DeviceCommand[];
}

export interface SceneStep {
  device: string; // device id, or 'lights' (virtual all-lights target)
  label: string;
  delay: number;
  action?: string;
  value?: number | string; // volume/brightness level, source/input name, …
}

export interface Scene {
  id: string;
  name: string;
  icon: IconName;
  prebuilt: boolean;
  favourite: boolean;
  lastFired: string;
  steps: SceneStep[];
}

export interface Room {
  id: string;
  name: string;
  icon: IconName;
  deviceIds: string[];
  sceneIds?: string[];
}

export interface Bridge {
  id: number;
  name: string;
  model: string;
  ip: string;
  status: DeviceStatus;
  username?: string; // Hue API key obtained via link-button pairing
}

export interface LightScene {
  id: string;
  name: string;
  icon: IconName;
  preset?: { brightness: number; temp: number };
  snapshot?: Record<string, { on?: boolean; brightness?: number; temp?: number }>;
}

export type ActivityKind = 'scene' | 'command' | 'scout';
export type ActivityStatus = 'ok' | 'partial' | 'fail';

export interface ActivityEvent {
  id: string;
  ts: number;
  kind: ActivityKind;
  status: ActivityStatus;
  title: string;
  icon: IconName;
  detail?: string;
}

export type HomeSectionId = 'favorites' | 'lights' | 'rooms' | 'devices';
export type SectionSize = 'S' | 'M' | 'L';
export type HomeSizes = Record<HomeSectionId, SectionSize>;

export interface ScoutCommand {
  name: string;
  category: string;
  code: string;
  source: 'official' | 'community' | 'forum';
  confidence: number;
}
