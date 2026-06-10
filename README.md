# Kun Troll — Homeware Hub

A universal home-remote iPhone app: one app replaces every physical remote (TV, AV receiver, streamer, smart lights), with two differentiators:

1. **Troll Scout** — an AI command finder with a mandatory *test-before-save* gate.
2. **Kun Troll** — a discreet parametric SVG character that appears on meaningful actions, then hides.

Built from the design handoff in [`design/design_handoff_kuntroll/`](design/design_handoff_kuntroll/README.md) — read that first; the prototype there is the visual/behavioral source of truth.

## Stack

| Concern | Choice |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| State | Zustand, persisted under the versioned key `kuntroll.v1` (same shape as the prototype) |
| Styling | Design tokens (`src/design/tokens.ts` + CSS variables in `src/styles/global.css`), Nunito + Space Mono |
| Character | `src/components/Troll.tsx` — `buildTrollSVG(expression, variant)`, ported verbatim from the spec |
| AI (Troll Scout) | `src/lib/scout.ts` — tries `POST /api/scout` (a backend that calls the Anthropic API server-side), falls back to a deterministic offline synthesizer |
| Device I/O | **Mocked.** Real integrations (Samsung WS, MusicCast, MediaRemote, Hue, IP→IR) are §8 of the handoff and come last |

## Run

```sh
npm install
npm run dev        # dev server
npm run build      # type-check + production build
```

First run shows the 7-step onboarding; **Settings → Replay intro** re-triggers it, **Settings → Reset demo data** restores seed data.

## Layout

```
src/
  design/tokens.ts        exact design tokens (§6 of the handoff)
  styles/global.css       fonts, CSS vars, motion keyframes, prefers-reduced-motion
  components/             Icon (24×24 line set), Troll, UI kit (Card/Btn/Sheet/…), EditWrap
  data/seed.ts            mock devices/scenes/rooms/bridges/light-scenes/activity
  store/store.ts          Zustand store + persistence + tweaks (button feel, Troll rendering)
  lib/scout.ts            Troll Scout discovery (backend call + offline fallback)
  screens/                Home, Rooms, Controller, Scenes, Settings, Activity (+Recovery/
                          Diagnostics), Onboarding, TrollScout, Flows (AddDevice/SceneBuilder)
  sheets/                 DeviceSettings, RoomEditor, BridgeConfig
```

## Remaining work (per handoff §9)

- Framer Motion pass for the remaining hand-rolled animations (§5 specs; CSS keyframes currently match the prototype).
- A backend route for Troll Scout (`/api/scout` → Anthropic API).
- Real device integrations behind the command abstraction (§8): discovery (mDNS/SSDP), pairing, health/latency.
