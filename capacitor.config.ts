import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kuntroll.app',
  appName: 'Kun Troll',
  webDir: 'dist',
  backgroundColor: '#1A1A2E',
  plugins: {
    // Native HTTP for LAN device control (Hue / MusicCast) — bypasses WKWebView CORS.
    CapacitorHttp: { enabled: true },
  },
};

export default config;
