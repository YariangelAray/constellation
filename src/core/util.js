export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
export const hex = (c) => (typeof c === 'number' ? c : parseInt(c.replace('#', ''), 16));

// RNG con semilla → las estrellas quedan en el mismo sitio si recarga la página.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

export const params = new URLSearchParams(location.search);

const KEY = 'constelacion20';
export const storage = {
  load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  },
  save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* modo privado, da igual */ }
  },
  clear() {
    try { localStorage.removeItem(KEY); } catch { /* nada */ }
  },
};

export function vibrate(ms) {
  try { navigator.vibrate?.(ms); } catch { /* no soportado */ }
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
