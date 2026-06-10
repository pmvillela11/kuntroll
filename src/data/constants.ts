// App-level constants (not user data).
export const SOURCES: Record<'tv' | 'rec', string[]> = {
  tv: ['HDMI1', 'HDMI2', 'HDMI3', 'TV', 'Apple TV'],
  rec: ['Apple TV', 'HDMI2', 'AirPlay', 'Spotify', 'Tuner', 'Phono'],
};
export const SOUND_MODES = ['Movie', 'Music', 'Sport', 'Game', 'Straight'];

export const clone = <V,>(o: V): V => JSON.parse(JSON.stringify(o));
