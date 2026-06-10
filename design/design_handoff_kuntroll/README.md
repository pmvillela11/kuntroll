# Handoff: Kun Troll — Homeware Hub (iPhone app)

> **Read this first.** The files in this bundle are **design references built in HTML/React-via-Babel** — a working, high-fidelity prototype that shows the intended look, motion, and behavior. They are **not** the production codebase. Your job is to **rebuild this app properly** in a real toolchain (recommended below), recreating the screens pixel-for-pixel and the interactions beat-for-beat, using production patterns (typed state, real build, tests, native device integration).

---

## 1. What this is

**Kun Troll — Homeware Hub** is a universal home-remote iPhone app. One app replaces every physical remote (TV, AV receiver, streamer, smart lights) and adds two differentiators:

1. **Troll Scout** — an AI command finder. When a device isn't in the library, it searches for control commands and presents them behind a mandatory *test-before-save* gate.
2. **Kun Troll** — a discreet character that gives the app personality without getting in the way. He appears on meaningful actions (scene fired, command found, device offline) then hides.

The aesthetic is locked and intentional: **dark navy, electric violet, lime-yellow accent**, rounded cards, Nunito + Space Mono. Minimalist line icons. Bold but restrained — "every pixel earns its place."

**Fidelity: HIGH.** Colors, type, spacing, motion, and copy in the prototype are final. Recreate them exactly. Where you must choose (e.g. a real component library), match the visual result, not the implementation.

---

## 2. Recommended target stack

The prototype is already React, decomposed into modules that map 1:1 to a real app — so the cleanest path:

| Concern | Recommendation | Why |
|---|---|---|
| Framework | **React + TypeScript + Vite** | Prototype is already React; least translation friction. |
| Styling | **CSS Modules or vanilla-extract** (or Tailwind w/ a token preset) | Tokens are already centralized (see §6). Avoid heavy CSS-in-JS — prototype uses inline styles only for speed. |
| State | **Zustand** (or Redux Toolkit) | App state is a single store of devices/scenes/rooms/activity. Zustand maps directly to the current `useState` cluster in `App.jsx`. |
| Persistence | **Zustand `persist` middleware** → localStorage | Prototype already persists a versioned slice under key `kuntroll.v1`. Keep the same shape. |
| Navigation | **React Router** (or a simple tab+stack state machine) | 5 tabs + modal sheets + full-screen overlays (onboarding, Troll Scout, scene runner). |
| Icons | Keep the **custom 24×24 line set** in `ui.jsx` (`P` map) | They're on-brand and tiny; port as an `<Icon name>` component. |
| Animation | **Framer Motion** | Replaces the hand-rolled CSS keyframes; see §5 for exact specs. |
| AI (Troll Scout) | Your backend proxies **Anthropic API** | The prototype calls `window.claude.complete`; in production this must be a server route (never ship an API key client-side). A local fallback synthesizer already exists for offline demos. |
| Device control | **Native modules / a hub service** | The real mountain — see §8. |

If the team prefers **native iOS (SwiftUI)**, everything in §3–§6 still applies; treat the HTML as a spec.

---

## 3. Information architecture

Bottom tab bar (5): **Home · Rooms · Control · Scenes · Settings**. Plus non-tab surfaces: **Onboarding** (first run), **Troll Scout**, **Scene Runner** (background — see note), **Activity**, **Diagnostics**, and bottom-sheet editors (Device, Room, Scene Builder, Add Device, Bridge config).

```
App
├─ Onboarding (first run, full screen, 7 steps)
├─ Tabs
│  ├─ Home        — editable dashboard: Favorites / Lights / Rooms / Devices
│  ├─ Rooms       — per room: Scenes & commands · Devices · Lights
│  ├─ Control      — the active device's remote + scene pills + sticky main volume
│  ├─ Scenes      — library (pre-built + custom), favourite, run, edit
│  └─ Settings    — devices, lights (+ hubs), organise, system (Activity/Diagnostics), app
├─ Overlays       — Troll Scout, Activity, Diagnostics
└─ Sheets         — Device settings, Room editor, Scene Builder, Add Device, Hue Bridge config
```

---

## 4. Screens & behavior (recreate exactly)

For exact markup, read the source files listed in §7 — they are the source of truth. This section is the implementer's map.

### Home (`Home.jsx`)
- Greeting header ("Good morning/afternoon/evening" + "N of M devices online"), small Kun Troll (52px), **Edit** button.
- Four reorderable sections in this default order: **Favorites, Lights, Rooms, Devices**.
- **Edit mode**: each section gets an **S/M/L** size control and a drag handle; sections reorder by drag. Inside Favorites and Lights, individual scene cards reorder by drag and have a red **−** delete (favorites un-pin; light scenes delete). Rooms and Devices cards reorder by drag (no delete — that lives in their editors).
- **Favorites**: scene cards (icon badge + name only — no step count/time). Empty → EmptyState (happy Troll, "Browse scenes").
- **Lights**: light-scene cards (Relax/Concentrate/Energize/Nightlight + "Save scene" which snapshots current lamp states) at the **same card size** as favorites; below them, **lamps as on/off pills** (lime when on, shows brightness %). "All off" action top-right.
- **Rooms**: room cards (icon, name, "N devices · K on").
- **Devices**: command-bearing devices only (lamps live in Lights). ON devices get a lime **active glow**. Empty → EmptyState ("Add a device").
- Tapping a scene **fires it in the background** and navigates straight to **Control** (no step-by-step runner screen) with a toast; a partial/failure (offline device in the scene) shows a Sleepy Troll + warning toast and logs a "partial" event.

### Rooms (`App.jsx` → RoomsScreen)
- Per room, three labelled sub-sections: **Scenes & commands** (bigger cards incl. quick "Lights on/Lights off" command cards), **Devices**, **Lights** (inline dimming). Back button. New-room and per-room edit (pencil).

### Control / Remote (`Remote.jsx`)
- Header: device name + model, back button, "set main" button (top-right).
- **Scene pills** row (not device pills) — tapping fires a scene; the fired pill pulses lime.
- **Sticky main volume** bar — always visible; user chooses which device is the volume source via the "set main" sheet, which also sets which device's screen is "main".
- Contextual remote body by type:
  - **TV**: power, source picker (sheet), D-pad with OK, transport, 4 app shortcuts.
  - **Receiver**: power, input picker, sound-mode chips, Zone 2 expander.
  - **Apple TV**: large swipe trackpad (height 356px), Back/Play/Home, Siri/Search.
  - **Lamp**: big power button, brightness + warmth sliders.
- **Button feel** is a global option: `flat` / `soft` / `tactile` (changes button background/shadow/press).

### Scenes (`Scenes.jsx`)
- Library split **Pre-built / Custom**, filters **All / Favourites / By Room**. Each card: icon, name, device chips, favourite heart, ⋯ menu (Edit/Duplicate/Delete), **Run scene**. Edit mode: drag-reorder + delete. Empty → EmptyState. "New scene" → Scene Builder.

### Troll Scout (`TrollScout.jsx`) — the differentiator
- Idle: editable Brand + Model, "Search the web".
- Searching: ring animation + cycling source lines (manufacturer docs, IRDB, RemoteCentral, GitHub, Home Assistant).
- Results: list of commands each with **source badge** (official/community/forum → ai_fetched), **confidence dots** (1–3), and a **Test** button → "Did that work? Yes, save / No" gate. Footer: **Save confirmed (n)** / **Save all (n)**.
- **Production**: replace `window.claude.complete` with a call to **your backend**, which calls the Anthropic API server-side. The prompt is in `search()`. A deterministic offline synthesizer (`simulatedCommands`) already exists as fallback.
- Saved commands **persist onto the matching device** and show in Device settings as "N · K via Scout".

### Onboarding (`Onboarding.jsx`)
- 7-step first-run, hero Kun Troll, ends by setting `seenOnboarding`. "Replay intro" in Settings re-triggers it.

### Activity & Diagnostics (`Activity.jsx`)
- **Activity**: health summary (online/offline), offline-device recovery banner ("Fix"), filters (All/Scenes/Failures), day-grouped timeline; each event badged **Sent/Partial/Failed**.
- **Recovery**: Sleepy-Troll troubleshooting sheet → "Reconnecting" sequence → "Back online"; flips device status, logs a reconnect event.
- **Diagnostics**: per-device protocol, color-coded latency, last-seen, IP; Troubleshoot on offline.

### Builders / editors (`Flows.jsx`, sheets in `App.jsx`)
- **Add Device**: discover → type/brand → name/room → optionally Troll Scout for commands.
- **Scene Builder**: ordered steps, per-step device/command/delay, drag-reorder.
- **Room editor**: name, icon, device + scene multi-select.
- **Device settings**: editable name/model/room/IP/port + command list (library/manual/ai_fetched).
- **Hue Bridge config**: multiple hubs (bridges) listed in Settings › Lights; editable name/IP, lights on that hub, "Search for new lights".

---

## 5. Motion specs (port to Framer Motion)

| Animation | Spec | Where |
|---|---|---|
| Kun Troll float | translateY 0 → −8px, 4s ease-in-out, infinite | whenever visible |
| Blink | scaleY → 0.08 for ~200ms, random 5–7s | Happy & Wink only |
| Expression change | spring (stiffness ~200, damping ~20), ~300ms | any expression swap |
| Reaction pulse | scale 1 → 1.15 → 1, ~0.9s | Wow & Love |
| Screen transition | directional slide+fade, ~280ms (forward/back aware) | tab/stack nav |
| Tactile press | scale 0.97 on press, spring back | all cards/rows/pills |
| Scene pill fire | one-shot lime ring pulse, ~0.7s | Control scene pills |
| Toast | rise + fade, ~250ms, auto-dismiss ~1.9s | global announcements |
| Number tween | animated count to target | volume/brightness readouts |
| Active glow | static lime border + soft shadow | ON devices |

Respect `prefers-reduced-motion`: render end-states, skip loops.

The **Kun Troll character** is a single parametric SVG builder (`kuntroll.jsx`, `buildTrollSVG(expression, variant)`). Five expressions: **happy, wow, wink, sleepy, love**. Three renderings; production uses **Pebble** (variant key `A`). Anatomy is locked: wide low oval head, exactly 3 spikes, troll ears, close-set lime eyes, no nose/eyebrows/body. Port the builder verbatim — don't redraw by hand.

---

## 6. Design tokens (exact)

```
/* Color */
--bg:           #1A1A2E   /* app background (navy) */
--card:         #252540   /* primary surface */
--card-2:       #1E1E38   /* recessed surface / inputs */
--violet:       #6B28EE   /* primary brand */
--violet-deep:  #5A20CC   /* gradient/pressed */
--violet-soft:  rgba(107,40,238,0.16)  /* icon chips */
--lime:         #C8FF00   /* accent / active / CTA-on-dark */
--text:         #F0F0F0
--muted:        #9B8BC4   /* secondary text */
--border:       rgba(180,160,255,0.15)
--border-strong:rgba(180,160,255,0.28)
--success:      #4ADE80   /* online / sent */
--warning:      #FACC15   /* partial / attention */
--error:        #F87171   /* offline / failed / destructive */
--ai-violet:    #A78BFA   /* Troll Scout / AI affordances */

/* Type */
--font-sans: 'Nunito', system-ui, sans-serif;   /* weights 600–900 */
--font-mono: 'Space Mono', monospace;            /* labels, codes, metrics */

/* Radius */  card 18–20px · chip/pill 100px · small tile 10–13px
/* Shadow */  card: 0 4px 12px rgba(0,0,0,0.4)
/* Source badges */ manual→success, library→lime, ai_fetched→ai-violet
/* Status dot */ online→success, offline→error, idle→warning (with matching glow)
```

Hit targets ≥ 44px. Minimum body text 13px; metrics in mono.

---

## 7. State & data model

Single source of truth (see `data.jsx` for seed values; `App.jsx` for the live store).

- **Device**: `{ id, type:'tv'|'receiver'|'appletv'|'light'|'ir', name, model, room, status:'online'|'offline', protocol, ip, port, latency, lastSeen, bridge?, state:{…type-specific}, commands?:[{name,code,source,confidence}] }`
- **Scene**: `{ id, name, icon, prebuilt, favourite, lastFired, steps:[{device, label, delay}] }` (device `'lights'` is a virtual all-lights target)
- **Room**: `{ id, name, icon, deviceIds:[], sceneIds?:[] }`
- **Bridge (Hue hub)**: `{ id, name, model, ip, status }`
- **Light scene**: `{ id, name, icon, preset?:{brightness,temp} | snapshot?:{[lampId]:state} }`
- **Activity event**: `{ id, ts, kind:'scene'|'command'|'scout', status:'ok'|'partial'|'fail', title, icon, detail }`

**Persistence**: versioned key `kuntroll.v1`; durable slices = `devices, scenes, rooms, mainId, volId, homeOrder, sizes, lightScenes, bridges, activity, seenOnboarding`. A **Reset demo data** action clears it back to seed.

**Tweaks** (design options, separate from app data): `remoteStyle` (flat/soft/tactile), `trollRendering` (Pebble/Quiet/Sticker).

---

## 8. The real work (not in the prototype)

The prototype mocks all device I/O. Production must implement actual control — this is the bulk of engineering effort:

- **Samsung TV** — WebSocket LAN (`8001`), token pairing.
- **Yamaha receiver** — MusicCast REST.
- **Apple TV** — MediaRemote / companion protocol (this is the hardest; may need a companion device or HomeKit bridge).
- **Philips Hue** — local API v2 over the bridge, with bridge discovery + button-press pairing; support **multiple bridges**.
- **IR devices** — via an IP→IR gateway (e.g. Global Caché iTach).

Implications: device **discovery (mDNS/SSDP)**, **pairing flows**, a **command abstraction layer** (the prototype's `commands[]` is the UI contract for it), connection **health/latency** (Diagnostics already designed for it), and a **backend** for the Anthropic-powered Troll Scout. Treat the prototype's offline/recovery/diagnostics UI as the spec for how real failures should surface.

---

## 9. Suggested build order

1. Scaffold Vite + React + TS; port **tokens** (§6) and the **Icon** + **Kun Troll** components.
2. Build the **UI kit** (`ui.jsx`: Card, Btn, Toggle, Slider, Sheet, pills, badges, EmptyState, TopBar) as typed components.
3. Stand up the **Zustand store** from §7 with `persist` (key `kuntroll.v1`).
4. Build screens top-down with **mock data** first: Home → Control → Scenes → Rooms → Settings → Activity/Diagnostics → Onboarding → builders.
5. Wire **Troll Scout** to a backend route (keep the offline synthesizer as fallback).
6. Layer in **Framer Motion** per §5; verify `prefers-reduced-motion`.
7. Replace mocks with **real device integrations** (§8) behind the command abstraction.

---

## 10. Files in this bundle

| File | Role |
|---|---|
| `Kun Troll - Prototype.html` | Entry point — loads React/Babel + all modules, scales into an iPhone frame. **Run this to see the app.** |
| `Kun Troll - Character Spec.html` | Standalone character spec — 3 renderings, 5 expressions, motion. |
| `app/kuntroll.jsx` | Parametric Kun Troll SVG builder (port verbatim). |
| `app/ui.jsx` | Design tokens, icon set, shared primitives. |
| `app/data.jsx` | Seed devices/scenes/rooms/bridges/light-scenes/activity. |
| `app/Home.jsx` | Home dashboard (sections, edit mode, sizes, glows). |
| `app/Remote.jsx` | Control screen + per-type remotes + main volume. |
| `app/Scenes.jsx` | Scene library. |
| `app/TrollScout.jsx` | AI command finder (real call + offline fallback). |
| `app/Activity.jsx` | Activity log, recovery, diagnostics. |
| `app/Onboarding.jsx` | First-run flow. |
| `app/Flows.jsx` | Add-Device + Scene Builder. |
| `app/App.jsx` | Shell: nav, store, sheets, persistence, settings, rooms. |
| `frames/ios-frame.jsx` | iPhone bezel/status bar (prototype-only; not needed in a real iOS app). |
| `frames/tweaks-panel.jsx` | Design-option panel (prototype-only). |

> The HTML loads `.jsx` through an in-browser Babel transformer for prototyping only. In production, compile with a real bundler and drop the iPhone frame + tweaks panel.

## 11. GitHub workflow (suggested)

1. Create a new repo (e.g. `kuntroll-app`).
2. Drop this `design_handoff_kuntroll/` folder in at the root (or in `/design`).
3. Open the repo in **Claude Code** and prompt: *"Read design_handoff_kuntroll/README.md and the referenced files, then scaffold the app per §2 and build the screens per §4, starting with the design system and Home."*
4. Build with mock data first; integrate real device protocols last.
