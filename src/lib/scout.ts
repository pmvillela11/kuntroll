// Troll Scout command discovery.
// Production path: POST /api/scout → a backend route that calls the Anthropic API server-side
// (never ship an API key client-side). Offline/dev fallback: a deterministic synthesizer so
// the flow always demos.
import type { ScoutCommand } from '../types';

export function simulatedCommands(brand: string, model: string): ScoutCommand[] {
  const b = (brand || 'Device').trim();
  const key = (b + ' ' + (model || '')).toLowerCase();
  const lib: Record<string, Omit<ScoutCommand, 'code'>[]> = {
    power: [
      { name: 'Power On', category: 'power', source: 'official', confidence: 0.95 },
      { name: 'Power Off', category: 'power', source: 'official', confidence: 0.95 },
      { name: 'Power Toggle', category: 'power', source: 'community', confidence: 0.82 },
    ],
    volume: [
      { name: 'Volume Up', category: 'volume', source: 'official', confidence: 0.93 },
      { name: 'Volume Down', category: 'volume', source: 'official', confidence: 0.93 },
      { name: 'Mute', category: 'volume', source: 'official', confidence: 0.9 },
    ],
    input: [
      { name: 'Input HDMI 1', category: 'input', source: 'community', confidence: 0.8 },
      { name: 'Input HDMI 2', category: 'input', source: 'community', confidence: 0.78 },
    ],
    nav: [
      { name: 'OK / Select', category: 'navigation', source: 'forum', confidence: 0.66 },
      { name: 'Back', category: 'navigation', source: 'forum', confidence: 0.64 },
      { name: 'Home', category: 'navigation', source: 'community', confidence: 0.7 },
    ],
    play: [{ name: 'Play / Pause', category: 'playback', source: 'community', confidence: 0.74 }],
  };
  let pick = [...lib.power, ...lib.volume];
  if (/(tv|samsung|lg|sony|qe|oled|appletv|streamer|roku)/.test(key)) pick = pick.concat(lib.input, lib.nav, lib.play);
  else if (/(receiver|amp|yamaha|denon|marantz|rx-)/.test(key))
    pick = pick.concat(lib.input, [{ name: 'Sound Mode', category: 'custom', source: 'community', confidence: 0.72 }]);
  else if (/(hue|light|lamp|bulb)/.test(key))
    pick = [
      { name: 'On', category: 'lighting', source: 'official', confidence: 0.96 },
      { name: 'Off', category: 'lighting', source: 'official', confidence: 0.96 },
      { name: 'Brightness +', category: 'lighting', source: 'official', confidence: 0.9 },
      { name: 'Brightness −', category: 'lighting', source: 'official', confidence: 0.9 },
      { name: 'Warm White', category: 'lighting', source: 'community', confidence: 0.8 },
    ];
  else pick = pick.concat(lib.nav);
  const codePfx = b.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'CMD';
  return pick.slice(0, 10).map((c, i) => ({
    ...c,
    code: `${codePfx}_${c.category.slice(0, 3).toUpperCase()}_${(i + 17).toString(16).toUpperCase()}${(i * 7 + 3).toString(16).toUpperCase()}`,
  }));
}

export function parseCommands(text: string): ScoutCommand[] | null {
  try {
    const m = text.match(/\[[\s\S]*\]/);
    if (!m) return null;
    const arr = JSON.parse(m[0]);
    if (!Array.isArray(arr) || !arr.length) return null;
    return arr.slice(0, 12).map((c, i) => ({
      name: (c.name || 'Command ' + (i + 1)).toString().slice(0, 40),
      category: c.category || 'custom',
      code: (c.code || '').toString().slice(0, 48),
      source: ['official', 'community', 'forum'].includes(c.source) ? c.source : 'community',
      confidence: typeof c.confidence === 'number' ? c.confidence : 0.7,
    }));
  } catch {
    return null;
  }
}

// The exact discovery prompt from the handoff (TrollScout.jsx search()). The backend
// forwards it to the Anthropic API and returns the raw completion text.
export function scoutPrompt(brand: string, model: string) {
  return `You are Troll Scout, a database of consumer home-device control commands. For the device "${brand} ${model}", return ONLY a JSON array (no prose) of up to 10 real control commands. Each item: {"name": short label, "category": one of power|volume|input|navigation|playback|lighting|custom, "code": a realistic protocol/IR command string for this exact model, "source": one of official|community|forum, "confidence": number 0-1}. Base codes on the real protocol this model uses. Return only the JSON array.`;
}

export async function findCommands(brand: string, model: string): Promise<ScoutCommand[]> {
  try {
    const res = await fetch('/api/scout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand, model, prompt: scoutPrompt(brand, model) }),
    });
    if (res.ok) {
      const data = await res.json();
      const parsed = parseCommands(typeof data === 'string' ? data : (data.text ?? JSON.stringify(data.commands ?? '')));
      if (parsed) return parsed;
    }
  } catch {
    // no backend in mock mode — fall through to the synthesizer
  }
  await new Promise((r) => setTimeout(r, 2600));
  return simulatedCommands(brand, model);
}
