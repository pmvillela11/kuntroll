# Kun Troll — Homeware Hub

A universal home-remote iPhone app: one app replaces every physical remote (TV, AV receiver, streamer, smart lights), with two differentiators:

1. **Troll Scout** — an AI command finder with a mandatory *test-before-save* gate.
2. **Kun Troll** — a discreet parametric SVG character that appears on meaningful actions, then hides.

Built from the design handoff in [`design/design_handoff_kuntroll/`](design/design_handoff_kuntroll/README.md) — the prototype there is the visual/behavioral source of truth.

## How it works

The app **starts fully bare**: no devices, no scenes, no rooms. Onboarding is intro-only; you then scan your network, pair/add each device, and build every scene yourself. `Settings → Erase all data` returns to that state.

A **driver layer** (`src/drivers/`) sits between the store and device state:

| Where | Device I/O |
|---|---|
| **iOS app** (Capacitor) | Real protocol drivers on your Wi-Fi: **Philips Hue** (local API v1 + link-button pairing + light import), **Yamaha MusicCast** (REST), **Samsung TV** (LAN WebSocket :8001, best-effort — newer TVs that force secure pairing fall back to simulation). Discovery = Hue cloud lookup + mDNS (`capacitor-zeroconf`) + manual IP. |
| **Web** (Vercel / browser) | Everything runs against the **simulated home** — browsers can't reach LAN devices. Discovery emits a simulated pool so every flow is testable anywhere. |

## Stack

React 18 + TypeScript + Vite · Zustand (persisted flat under `kuntroll.v2`) · Capacitor 8 (iOS, CocoaPods) · design tokens in `src/design/tokens.ts` + `src/styles/global.css` · Kun Troll builder in `src/components/Troll.tsx`.

## Run (web)

```sh
npm install
npm run dev        # dev server (simulated home)
npm run build      # type-check + production build
```

## Build the iPhone app (on a Mac)

```sh
npm install
npm run build
npx cap sync ios          # copies web assets + pod install
npx cap open ios          # opens Xcode
```

In Xcode: select the **App** target → Signing & Capabilities → choose your team → run on your iPhone (must be on the same Wi-Fi as your devices). iOS will ask for **Local Network** permission on first scan — required for discovery and control. For TestFlight/App Store: Product → Archive → Distribute.

## Layout

```
src/
  drivers/            driver layer: simulated, hue, musiccast, samsung + registry
  lib/                native.ts (Capacitor platform/HTTP/haptics) · discovery.ts · scout.ts
  store/store.ts      Zustand store, persistence (kuntroll.v2), command routing, health poll
  components/         Icon, Troll, UI kit, EditWrap
  screens/            Home, Rooms, Controller, Scenes, Settings, Activity, Onboarding,
                      TrollScout, Flows (AddDevice + bridge pairing + SceneBuilder)
  sheets/             DeviceSettings, RoomEditor, BridgeConfig
ios/                  Capacitor Xcode project (CocoaPods)
```

## Remaining work

- Samsung secure pairing (wss:8002, token) for 2019+ TVs; Apple TV (MediaRemote) and IP→IR gateways.
- Backend route for Troll Scout (`/api/scout` → Anthropic API); offline synthesizer is the current fallback.
- Framer Motion pass per handoff §5 (CSS keyframes currently match the prototype).
