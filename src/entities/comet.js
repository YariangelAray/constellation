import { Container, Sprite } from 'pixi.js';
import { TEX } from '../art/sprites.js';
import { view } from '../core/app.js';
import { clamp, lerp } from '../core/util.js';

// Peligro del modo arcade: cometas que cruzan la pantalla, siempre anunciados antes.
//
// Regla de oro: el cometa más rápido (95 px/s) es más lento que la astronauta a tope
// (135 px/s en astronaut.js). Siempre se le puede huir; nunca hay una muerte inevitable.

const WARN_TIME = 1.1;    // segundos de aviso antes de que entre
const SPEED_MIN = 55;
const SPEED_MAX = 95;
const GAP_MIN = 1.2;      // segundos entre cometas en lo más difícil
const GAP_MAX = 3.5;      // ... y en lo más fácil
const HIT_R = 8;          // radio de choque (generoso a su favor)
const MARGIN = 26;        // cuánto fuera de la cámara nacen y mueren

export class CometField {
  constructor(particles) {
    this.particles = particles;      // partículas en coordenadas de mundo (la estela)
    this.container = new Container(); // cometas, en coordenadas de mundo
    this.warnLayer = new Container(); // avisos, en coordenadas de pantalla
    this.comets = [];
    this.warnings = [];
    this.timer = GAP_MAX;
    this.t = 0;
  }

  clear() {
    for (const c of this.comets) c.view.destroy({ children: true });
    for (const w of this.warnings) w.view.destroy({ children: true });
    this.comets = [];
    this.warnings = [];
    this.timer = GAP_MAX;
  }

  get maxAlive() { return 1 + Math.floor(this.danger * (this.maxComets - 1)); }

  // danger: 0 → recién empieza el peligro, 1 → dificultad máxima
  update(dt, { danger, maxComets, target, cam, W, H }) {
    this.t += dt;
    this.danger = clamp(danger, 0, 1);
    this.maxComets = Math.max(1, maxComets);
    this.cam = cam; // la usa spawn() para pasar de pantalla a mundo

    // ── avisos parpadeando en el borde de la pantalla ──
    for (let i = this.warnings.length - 1; i >= 0; i--) {
      const w = this.warnings[i];
      w.left -= dt;
      const blink = Math.abs(Math.sin(this.t * 9));
      w.view.alpha = 0.45 + blink * 0.55;
      w.view.scale.set(2 + blink * 0.5);
      if (w.left <= 0) {
        this.spawn(w);
        w.view.destroy({ children: true });
        this.warnings.splice(i, 1);
      }
    }

    // ── programar el siguiente ──
    this.timer -= dt;
    if (this.timer <= 0 && this.comets.length + this.warnings.length < this.maxAlive) {
      this.timer = lerp(GAP_MAX, GAP_MIN, this.danger) * (0.75 + Math.random() * 0.5);
      this.warn(target, cam);
    }

    // ── mover cometas ──
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.view.position.set(Math.round(c.x), Math.round(c.y));
      c.view.rock.rotation += c.spin * dt; // gira la roca, no el halo

      c.puff -= dt;
      if (c.puff <= 0) {
        c.puff = 0.03;
        this.particles.emit({
          x: c.x, y: c.y, count: 1,
          colors: [0xfbbf24, 0xea580c, 0xfff7ed],
          speed: 14, dir: { x: -c.vx, y: -c.vy }, spread: 0.8,
          life: 0.5, size: 2, drag: 2.5, add: true, shrink: true, jitter: 2,
        });
      }

      const out = c.x < -MARGIN * 2 || c.x > W + MARGIN * 2 || c.y < -MARGIN * 2 || c.y > H + MARGIN * 2;
      if (out) { c.view.destroy({ children: true }); this.comets.splice(i, 1); }
    }
  }

  // Elige por dónde entra y deja la flechita de aviso en ese borde
  warn(target, cam) {
    const side = Math.floor(Math.random() * 4); // 0 arriba, 1 derecha, 2 abajo, 3 izquierda
    const w = view.w, h = view.h;
    // punto de entrada en coordenadas de pantalla
    let sx, sy;
    if (side === 0) { sx = Math.random() * w; sy = -MARGIN; }
    else if (side === 1) { sx = w + MARGIN; sy = Math.random() * h; }
    else if (side === 2) { sx = Math.random() * w; sy = h + MARGIN; }
    else { sx = -MARGIN; sy = Math.random() * h; }

    // apunta cerca de ella, pero no exactamente (así se puede esquivar sin correr)
    const tx = target.x - cam.x + (Math.random() - 0.5) * 70;
    const ty = target.y - cam.y + (Math.random() - 0.5) * 70;
    const ang = Math.atan2(ty - sy, tx - sx);

    // aviso bien visible: halo naranja + flecha grande parpadeando en el borde
    const v = new Container();
    const glow = new Sprite(TEX.halo);
    glow.anchor.set(0.5);
    glow.tint = 0xfb923c;
    glow.blendMode = 'add';
    glow.scale.set(1.6);
    const arrow = new Sprite(TEX.arrow);
    arrow.anchor.set(0.5);
    arrow.tint = 0xfff7ed;
    arrow.rotation = ang;
    v.addChild(glow, arrow);
    v.position.set(clamp(sx, 14, w - 14), clamp(sy, 14, h - 14));
    this.warnLayer.addChild(v);

    this.warnings.push({ view: v, left: WARN_TIME, sx, sy, ang });
  }

  // Convierte un aviso en cometa de verdad (pasa de pantalla a mundo)
  spawn(w) {
    const speed = lerp(SPEED_MIN, SPEED_MAX, this.danger) * (0.85 + Math.random() * 0.3);
    // núcleo pixel + halo naranja para que se lea claramente sobre el fondo oscuro
    const v = new Container();
    const glow = new Sprite(TEX.halo);
    glow.anchor.set(0.5);
    glow.tint = 0xf97316;
    glow.blendMode = 'add';
    glow.alpha = 0.85;
    const rock = new Sprite(TEX.comet);
    rock.anchor.set(0.5);
    v.addChild(glow, rock);
    v.rock = rock;
    const c = {
      view: v,
      x: w.sx + this.cam.x,
      y: w.sy + this.cam.y,
      vx: Math.cos(w.ang) * speed,
      vy: Math.sin(w.ang) * speed,
      spin: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 3),
      puff: 0,
    };
    v.position.set(Math.round(c.x), Math.round(c.y));
    this.container.addChild(v);
    this.comets.push(c);
  }

  // ¿alguno está tocando este punto del mundo?
  hits(x, y) {
    for (const c of this.comets) {
      if (Math.hypot(c.x - x, c.y - y) < HIT_R) return c;
    }
    return null;
  }
}
