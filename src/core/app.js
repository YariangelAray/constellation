import { Application, TextureStyle } from 'pixi.js';
import { CONFIG } from '../../config.js';

export const app = new Application();

// Tamaño virtual del lienzo (píxeles de arte) y cuántos px CSS mide cada uno.
export const view = { w: 1, h: 1, cssScale: 1, cssW: 1, cssH: 1 };

const listeners = new Set();
export const onResize = (fn) => listeners.add(fn);

export async function initApp(root) {
  try { TextureStyle.defaultOptions.scaleMode = 'nearest'; } catch { /* versión sin defaultOptions */ }

  await app.init({
    background: CONFIG.paleta.fondo,
    antialias: false,
    resolution: 1,
    autoDensity: false,
    roundPixels: true,
    preference: 'webgl',
    powerPreference: 'high-performance',
  });
  root.appendChild(app.canvas);
  app.ticker.maxFPS = 60;

  resize();
  window.addEventListener('resize', resize);
  window.visualViewport?.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 150));
}

function resize() {
  const cssW = Math.max(1, Math.round(window.innerWidth));
  const cssH = Math.max(1, Math.round(window.innerHeight));
  const dpr = window.devicePixelRatio || 1;
  const physW = cssW * dpr;
  const physH = cssH * dpr;

  // Cuántos píxeles físicos mide cada píxel de arte: el lado corto de la pantalla
  // queda en ~CONFIG.pixelDetail píxeles virtuales (S24: 1080/260 → 4 → 270×585).
  const scale = Math.max(1, Math.round(Math.min(physW, physH) / CONFIG.pixelDetail));
  const w = Math.max(1, Math.round(physW / scale));
  const h = Math.max(1, Math.round(physH / scale));

  if (w !== view.w || h !== view.h) app.renderer.resize(w, h);
  app.canvas.style.width = cssW + 'px';
  app.canvas.style.height = cssH + 'px';

  view.w = w; view.h = h;
  view.cssW = cssW; view.cssH = cssH;
  view.cssScale = cssW / w;
  listeners.forEach((fn) => fn(view));
}
