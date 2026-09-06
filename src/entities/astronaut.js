import { Container, Sprite } from 'pixi.js';
import { TEX } from '../art/sprites.js';
import { clamp } from '../core/util.js';

const ACCEL = 300;   // px virtuales / s²
const MAX = 135;     // velocidad máxima
const DAMP = 1.4;    // fricción "espacial" (baja: sigue derivando un rato)

export class Astronaut {
  constructor(particles) {
    this.particles = particles;
    this.view = new Container();
    this.sprite = new Sprite(TEX.astronaut);
    this.sprite.anchor.set(0.5, 0.5);
    this.view.addChild(this.sprite);
    this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
    this.t = 0;
    this.facing = 1;
    this.thrusting = false;
    this.emitAcc = 0;
  }

  reset(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.vy = 0;
    this.facing = 1;
    this.sprite.scale.set(1);
    this.sprite.rotation = 0;
    this.view.position.set(x, y);
    this.view.alpha = 1;
    this.view.visible = true;
  }

  // ax, ay: dirección deseada (-1..1). W, H: tamaño del mundo.
  update(dt, ax, ay, W, H) {
    this.t += dt;
    this.thrusting = !!(ax || ay);
    if (this.thrusting) {
      this.vx += ax * ACCEL * dt;
      this.vy += ay * ACCEL * dt;
      // propulsor: chispitas saliendo por detrás
      this.emitAcc += dt * 40;
      while (this.emitAcc >= 1) {
        this.emitAcc -= 1;
        this.particles.emit({
          x: this.x - ax * 5, y: this.y + 2 - ay * 5,
          count: 1, colors: [0xfb923c, 0xfde68a, 0x7dd3fc],
          speed: 32, dir: { x: -ax, y: -ay }, spread: 0.9,
          life: 0.38, size: 1.6, drag: 3, add: true, shrink: true, jitter: 3,
        });
      }
    }
    const k = Math.exp(-DAMP * dt);
    this.vx *= k; this.vy *= k;
    const sp = Math.hypot(this.vx, this.vy);
    if (sp > MAX) { this.vx *= MAX / sp; this.vy *= MAX / sp; }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // bordes del mundo: rebote suave
    const m = 10;
    if (this.x < m) { this.x = m; this.vx = Math.abs(this.vx) * 0.4; }
    if (this.x > W - m) { this.x = W - m; this.vx = -Math.abs(this.vx) * 0.4; }
    if (this.y < m) { this.y = m; this.vy = Math.abs(this.vy) * 0.4; }
    if (this.y > H - m) { this.y = H - m; this.vy = -Math.abs(this.vy) * 0.4; }

    if (Math.abs(this.vx) > 10) this.facing = Math.sign(this.vx);
    this.sprite.scale.x = this.facing;
    this.sprite.rotation = clamp(this.vx * 0.0032, -0.4, 0.4);

    // flotación
    this.view.position.set(Math.round(this.x), Math.round(this.y + Math.sin(this.t * 2.2) * 1.5));
  }
}
