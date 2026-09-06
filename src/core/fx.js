import { Container, Sprite, Texture } from 'pixi.js';
import { hex } from './util.js';

// Sistema de partículas con pool fijo: chispas, propulsor, fuegos, estrellas fugaces.
export class Particles {
  constructor(max = 500) {
    this.container = new Container();
    this.pool = [];
    this.live = [];
    for (let i = 0; i < max; i++) {
      const sp = new Sprite(Texture.WHITE);
      sp.anchor.set(0.5);
      sp.visible = false;
      this.container.addChild(sp);
      this.pool.push(sp);
    }
  }

  emit({
    x, y, count = 1, colors = [0xffffff], speed = 40, dir = null, spread = Math.PI * 2,
    life = 0.6, size = 1, gravity = 0, drag = 0, add = false, stretch = 0, shrink = false, jitter = 0,
  }) {
    for (let i = 0; i < count; i++) {
      let sp = this.pool.pop();
      if (!sp) { const old = this.live.shift(); sp = old.sp; }
      const base = dir ? Math.atan2(dir.y, dir.x) : Math.random() * Math.PI * 2;
      const ang = base + (Math.random() - 0.5) * spread;
      const v = speed * (0.45 + Math.random() * 0.8);
      const c = colors[(Math.random() * colors.length) | 0];
      sp.tint = hex(c);
      sp.alpha = 1;
      sp.visible = true;
      sp.blendMode = add ? 'add' : 'normal';
      const s = size * (0.7 + Math.random() * 0.6);
      if (stretch) { sp.width = stretch; sp.height = Math.max(1, s); sp.rotation = ang; }
      else { sp.width = sp.height = Math.max(1, s); sp.rotation = 0; }
      sp.position.set(x + (Math.random() - 0.5) * jitter, y + (Math.random() - 0.5) * jitter);
      const l = life * (0.7 + Math.random() * 0.6);
      this.live.push({ sp, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, life: l, max: l, gravity, drag, shrink, s });
    }
  }

  update(dt) {
    for (let i = this.live.length - 1; i >= 0; i--) {
      const p = this.live[i];
      p.life -= dt;
      if (p.life <= 0) {
        p.sp.visible = false;
        this.pool.push(p.sp);
        this.live.splice(i, 1);
        continue;
      }
      if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; }
      p.vy += p.gravity * dt;
      p.sp.x += p.vx * dt;
      p.sp.y += p.vy * dt;
      const t = p.life / p.max;
      p.sp.alpha = t < 0.5 ? t * 2 : 1;
      if (p.shrink) { const sz = Math.max(1, p.s * t); p.sp.width = p.sp.height = sz; }
    }
  }

  clear() {
    for (const p of this.live) { p.sp.visible = false; this.pool.push(p.sp); }
    this.live.length = 0;
  }

  // ── presets ──
  sparkle(x, y, color) {
    this.emit({ x, y, count: 22, colors: [color, 0xffffff, color], speed: 75, life: 0.7, size: 1.6, drag: 2.5, add: true, shrink: true });
    this.emit({ x, y, count: 6, colors: [0xffffff], speed: 20, life: 0.5, size: 2.4, drag: 3, add: true, shrink: true });
  }

  firework(x, y, color) {
    this.emit({ x, y, count: 40, colors: [color, 0xffffff], speed: 70, life: 1.3, size: 1.5, gravity: 28, drag: 1.4, add: true, shrink: true });
    this.emit({ x, y, count: 14, colors: [0xffffff, color], speed: 28, life: 0.9, size: 2.2, gravity: 20, drag: 1.4, add: true, shrink: true });
  }

  shootingStar(x, y, dirX = 1, dirY = 0.55) {
    this.emit({ x, y, count: 1, colors: [0xffffff], speed: 230, dir: { x: dirX, y: dirY }, spread: 0.05, life: 0.9, size: 1, stretch: 16, add: true });
    this.emit({ x, y, count: 1, colors: [0xbae6fd], speed: 230, dir: { x: dirX, y: dirY }, spread: 0.05, life: 0.9, size: 2, add: true, shrink: true });
  }
}
