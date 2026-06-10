// Platform layer: native (Capacitor/iOS) vs web. Real device I/O only exists on native;
// the web build always falls back to the simulated home.
import { Capacitor, CapacitorHttp } from '@capacitor/core';

export const isNative = () => Capacitor.isNativePlatform();

export interface HttpResult {
  status: number;
  data: unknown;
}

// HTTP that works against LAN devices: CapacitorHttp runs natively (no WKWebView CORS);
// on web it uses fetch (and will generally only work against CORS-enabled endpoints).
export async function nativeFetch(opts: {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
}): Promise<HttpResult> {
  const { url, method = 'GET', body, timeoutMs = 4000 } = opts;
  if (isNative()) {
    const res = await CapacitorHttp.request({
      url,
      method,
      data: body,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      connectTimeout: timeoutMs,
      readTimeout: timeoutMs,
    });
    return { status: res.status, data: res.data };
  }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      signal: ctrl.signal,
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON body */
    }
    return { status: res.status, data };
  } finally {
    clearTimeout(t);
  }
}

// Haptic tap: real haptics on iOS, vibration API elsewhere.
export function hapticTap(ms = 8) {
  if (isNative()) {
    import('@capacitor/haptics')
      .then(({ Haptics, ImpactStyle }) => Haptics.impact({ style: ms >= 15 ? ImpactStyle.Medium : ImpactStyle.Light }))
      .catch(() => {});
    return;
  }
  if (navigator.vibrate)
    try {
      navigator.vibrate(ms);
    } catch {
      /* unsupported */
    }
}
