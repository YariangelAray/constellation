import { Texture } from 'pixi.js';
import { mulberry32 } from '../core/util.js';

// Todo el arte del juego se dibuja aquí por código: no hay imágenes que descargar.

function canvasTexture(canvas) {
  const t = Texture.from(canvas);
  try { t.source.scaleMode = 'nearest'; } catch { /* default ya es nearest */ }
  return t;
}

export function pixelTexture(rows, palette) {
  const h = rows.length;
  const w = rows[0].length;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = palette[ch];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    });
  });
  return canvasTexture(c);
}

// ── Astronauta (14 × 20) ──
const ASTRO_PAL = {
  W: '#f8f8ff', S: '#c7cbe6', K: '#14142b', C: '#38bdf8', L: '#e0f2fe', M: '#0c4a6e',
  G: '#7c8aa5', D: '#3b4460', R: '#a855f7', O: '#fb923c',
};
const ASTRO_ROWS = [
  '....WWWWWW....',
  '...WWWWWWWW...',
  '..WWKKKKKKWW..',
  '..WKCCCCCCKW..',
  '..WKCLLCCCKW..',
  '..WKCLCCCCKW..',
  '..WKMCCCCMKW..',
  '..WWKKKKKKWW..',
  '...WWWWWWWW...',
  '.GGSWWRRWWSGG.',
  'GGWWWWRRWWWWGG',
  'GGWWSWWWWSWWGG',
  'GGWW.WWWW.WWGG',
  '.GOO.WWWW.OOG.',
  '....WWWWWW....',
  '....WWWWWW....',
  '...WWW..WWW...',
  '...WWW..WWW...',
  '..SWWS..SWWS..',
  '..DDDD..DDDD..',
];

// ── Estrella (7 × 7) + puntito central (3 × 3) ──
const STAR_ROWS = ['...W...', '...W...', '..WWW..', 'WWWWWWW', '..WWW..', '...W...', '...W...'];
const DOT_ROWS = ['.W.', 'WWW', '.W.'];

// Flechita de la brújula (7 × 7), apunta a la derecha
const ARROW_ROWS = ['..W....', '..WW...', '..WWW..', 'WWWWWWW', '..WWW..', '..WW...', '..W....'];

// ── Cometa (7 × 7): roca con núcleo caliente ──
const COMET_PAL = { R: '#7c2d12', O: '#ea580c', Y: '#fbbf24', W: '#fff7ed' };
const COMET_ROWS = [
  '..RRR..',
  '.ROOOR.',
  'ROYYYOR',
  'ROYWWYR',
  'ROYYYOR',
  '.ROOOR.',
  '..RRR..',
];

// Halo suave (se tiñe con el color de cada estrella)
function haloTexture(size = 26) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvasTexture(c);
}

// Nubes de nebulosa (blancas; se tiñen por capa)
function nebulaTexture(seed, size = 128) {
  const rng = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const blobs = 3 + Math.floor(rng() * 2);
  for (let i = 0; i < blobs; i++) {
    const r = size * (0.16 + rng() * 0.16);
    const x = r + rng() * (size - 2 * r);
    const y = r + rng() * (size - 2 * r);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${0.45 + rng() * 0.25})`);
    g.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return canvasTexture(c);
}

// Cielo de fondo: puntitos aleatorios que se repiten en mosaico
function starfieldTexture(seed, size, count, bright) {
  const rng = mulberry32(seed);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const tints = ['#ffffff', '#e0f2fe', '#fde68a', '#fbcfe8', '#ddd6fe'];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(rng() * size);
    const y = Math.floor(rng() * size);
    ctx.globalAlpha = bright * (0.45 + rng() * 0.55);
    ctx.fillStyle = tints[Math.floor(rng() * tints.length)];
    const big = rng() < 0.12;
    ctx.fillRect(x, y, big ? 2 : 1, big ? 2 : 1);
  }
  return canvasTexture(c);
}

export const TEX = {};

export function buildTextures() {
  TEX.astronaut = pixelTexture(ASTRO_ROWS, ASTRO_PAL);
  TEX.star = pixelTexture(STAR_ROWS, { W: '#ffffff' });
  TEX.dot = pixelTexture(DOT_ROWS, { W: '#ffffff' });
  TEX.arrow = pixelTexture(ARROW_ROWS, { W: '#ffffff' });
  TEX.comet = pixelTexture(COMET_ROWS, COMET_PAL);
  TEX.halo = haloTexture(26);
  TEX.haloBig = haloTexture(64);
  TEX.nebula = [nebulaTexture(11), nebulaTexture(23), nebulaTexture(47)];
  TEX.sky = [
    starfieldTexture(101, 192, 70, 0.45),
    starfieldTexture(202, 192, 34, 0.75),
    starfieldTexture(303, 192, 14, 1.0),
  ];
}
