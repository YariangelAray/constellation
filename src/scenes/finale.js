import { Graphics, Rectangle } from 'pixi.js';
import { gsap } from 'gsap';
import confetti from 'canvas-confetti';
import { AdvancedBloomFilter } from 'pixi-filters';
import { CONFIG } from '../../config.js';
import { view } from '../core/app.js';
import { hex, params } from '../core/util.js';
import * as audio from '../core/audio.js';
import { hud } from '../ui/hud.js';

// ── Dónde va cada estrella para dibujar el "20" (en píxeles de pantalla) ──
function samplePolyline(pts, n) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1].x - pts[i].x, pts[i + 1].y - pts[i].y);
    segs.push(l); total += l;
  }
  const out = [];
  for (let k = 0; k < n; k++) {
    let d = (total * k) / (n - 1);
    let i = 0;
    while (i < segs.length - 1 && d > segs[i]) { d -= segs[i]; i++; }
    const t = segs[i] ? d / segs[i] : 0;
    out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * t, y: pts[i].y + (pts[i + 1].y - pts[i].y) * t });
  }
  return out;
}

export function formation(w, h, count = 20) {
  const unit = Math.min((w * 0.8) / 8, (h * 0.3) / 6);
  const ox = (w - 8 * unit) / 2;
  const oy = h * 0.25;
  const P = (x, y) => ({ x: ox + x * unit, y: oy + y * unit });

  const nTwo = Math.ceil(count / 2);
  const nZero = count - nTwo;
  const two = samplePolyline(
    [P(0, 1.3), P(0.3, 0.5), P(1, 0), P(2, 0), P(2.7, 0.5), P(3, 1.3), P(2.7, 2.2), P(0, 6), P(3, 6)],
    nTwo,
  );
  const zero = [];
  for (let k = 0; k < nZero; k++) {
    const a = -Math.PI / 2 + (k / nZero) * Math.PI * 2;
    zero.push(P(6.5 + Math.cos(a) * 1.5, 3 + Math.sin(a) * 3));
  }
  const points = [...two, ...zero].map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  const segments = [];
  for (let i = 0; i < nTwo - 1; i++) segments.push([i, i + 1]);
  for (let i = 0; i < nZero; i++) segments.push([nTwo + i, nTwo + ((i + 1) % nZero)]);
  return { points, segments };
}

function drawLines(g, points, segments, progress) {
  g.clear();
  const per = 1 / segments.length;
  segments.forEach(([a, b], i) => {
    const local = Math.max(0, Math.min(1, (progress - i * per) / per));
    if (local <= 0) return;
    const A = points[a], B = points[b];
    g.moveTo(A.x, A.y).lineTo(A.x + (B.x - A.x) * local, A.y + (B.y - A.y) * local);
  });
  g.stroke({ width: 1, color: 0x7dd3fc, alpha: 0.75 });
}

const tryLoad = (u) => new Promise((res) => {
  const im = new Image();
  im.onload = () => res(u);
  im.onerror = () => res(null);
  im.src = u;
});

// 'auto': busca fotos/1…8 con extensión .jpg, .jpeg o .png (la primera que exista)
function loadPhotos() {
  if (CONFIG.fotos !== 'auto') {
    return Promise.all((CONFIG.fotos || []).map(tryLoad)).then((a) => a.filter(Boolean).slice(0, 8));
  }
  const slots = Array.from({ length: 8 }, (_, i) => i + 1);
  return Promise.all(slots.map(async (n) => {
    for (const ext of ['jpg', 'jpeg', 'png']) {
      const u = await tryLoad(`fotos/${n}.${ext}`);
      if (u) return u;
    }
    return null;
  })).then((a) => a.filter(Boolean));
}

function confettiBurst() {
  try {
    const colors = CONFIG.paleta.estrellas;
    confetti({ particleCount: 110, spread: 75, startVelocity: 38, origin: { y: 0.62 }, colors, scalar: 0.9, zIndex: 5, disableForReducedMotion: true });
    setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors, zIndex: 5 }), 350);
    setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors, zIndex: 5 }), 500);
  } catch { /* nada */ }
}

function fireworks(space, seconds) {
  const colors = CONFIG.paleta.estrellas.map(hex);
  const n = Math.round(seconds / 0.55);
  for (let k = 0; k < n; k++) {
    gsap.delayedCall(k * 0.55 + Math.random() * 0.3, () => {
      if (space.mode !== 'finale') return;
      space.screenFx.firework(
        view.w * (0.12 + Math.random() * 0.76),
        view.h * (0.08 + Math.random() * 0.5),
        colors[(Math.random() * colors.length) | 0],
      );
    });
  }
}

export function runFinale(game, space) {
  space.mode = 'finale';
  hud.showHud(false);
  hud.compassHint(false);

  const { fxLayer, stars, astronaut, cam, screenFx } = space;
  const w = view.w, h = view.h;

  if (CONFIG.bloom && !params.has('nofx')) {
    try {
      fxLayer.filters = [new AdvancedBloomFilter({ threshold: 0.3, bloomScale: 1.0, brightness: 1.0, blur: 4, quality: 4 })];
      fxLayer.filterArea = new Rectangle(0, 0, w, h);
    } catch (e) { console.warn('Sin bloom:', e); }
  }

  // La astronauta pasa a coordenadas de pantalla y baja al centro-abajo
  const ax = astronaut.x - cam.x, ay = astronaut.y - cam.y;
  fxLayer.addChild(astronaut.view);
  astronaut.view.position.set(ax, ay);
  astronaut.sprite.rotation = 0;
  const homeX = w / 2, homeY = h * 0.86;

  const { points, segments } = formation(w, h, stars.length);
  space.constellationData = { points, segments };
  const lines = new Graphics();
  fxLayer.addChildAt(lines, 0);
  space.finaleLines = lines;

  const tl = gsap.timeline();
  tl.to(space.world, { alpha: 0.22, duration: 1.4, ease: 'power1.inOut' }, 0);
  tl.to(space.starfield.container, { alpha: 0.7, duration: 1.4 }, 0);
  tl.to(astronaut.view, { x: homeX, y: homeY, duration: 1.7, ease: 'power2.inOut' }, 0);

  // Las 20 estrellas salen de la astronauta y vuelan en arco a formar el "20"
  const T0 = 1.6, GAP = 0.11, FLY = 1.5;
  tl.add(() => screenFx.sparkle(homeX, homeY - 6, 0xfde68a), T0 - 0.1);
  stars.forEach((s, i) => {
    const p = points[i];
    fxLayer.addChild(s.view);
    s.view.visible = true; s.view.alpha = 1;
    s.view.scale.set(0.3);
    s.view.position.set(homeX, homeY - 6);
    const sx = homeX, sy = homeY - 6;
    const mx = (sx + p.x) / 2 + (Math.random() - 0.5) * w * 0.7;
    const my = (sy + p.y) / 2 - 20 - Math.random() * 50;
    const o = { u: 0 };
    const at = T0 + i * GAP;
    tl.to(o, {
      u: 1, duration: FLY, ease: 'power2.inOut',
      onUpdate: () => {
        const u = o.u, iu = 1 - u;
        s.view.x = Math.round(iu * iu * sx + 2 * iu * u * mx + u * u * p.x);
        s.view.y = Math.round(iu * iu * sy + 2 * iu * u * my + u * u * p.y);
      },
      onComplete: () => { s.view.position.set(p.x, p.y); screenFx.sparkle(p.x, p.y, hex(s.color)); audio.tick(i); },
    }, at);
    tl.to(s.view.scale, { x: 1.35, y: 1.35, duration: 0.5, ease: 'back.out(2.5)' }, at + FLY - 0.1);
  });

  const tStars = T0 + (stars.length - 1) * GAP + FLY;
  const prog = { t: 0 };
  tl.to(prog, { t: 1, duration: 2.4, ease: 'none', onUpdate: () => drawLines(lines, points, segments, prog.t) }, tStars - 0.2);

  const tTitle = tStars + 1.9;
  tl.add(() => {
    hud.finaleTitle(`${CONFIG.totalEstrellas} AÑOS`, `Feliz día, mi bonita ✦`);
    audio.fanfare();
    confettiBurst();
    fireworks(space, 9);
  }, tTitle);

  tl.add(() => { loadPhotos().then((urls) => { if (space.mode === 'finale') hud.showPolaroids(urls); }); }, tTitle + 2.6);
  tl.add(() => hud.showLetterButton(() => game.openLetter()), tTitle + 4.6);

  return tl;
}
