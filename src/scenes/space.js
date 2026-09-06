import { Container, Sprite } from 'pixi.js';
import { gsap } from 'gsap';
import { CONFIG } from '../../config.js';
import { view, onResize } from '../core/app.js';
import { input } from '../core/input.js';
import { TEX } from '../art/sprites.js';
import { Particles } from '../core/fx.js';
import { Astronaut } from '../entities/astronaut.js';
import { Starfield } from '../entities/starfield.js';
import { mulberry32, clamp, dist, hex, vibrate, storage, params } from '../core/util.js';
import * as audio from '../core/audio.js';
import { hud } from '../ui/hud.js';
import { formation } from './finale.js';

const MAGNET = 34;   // radio en el que la estrella se deja atraer
const GRAB = 7;      // radio de recogida
const IDLE_HINT = 6; // segundos sin recoger nada → aparece la brújula

function makeStar(i, x, y, color, rng) {
  const v = new Container();
  v.position.set(Math.round(x), Math.round(y));
  const halo = new Sprite(TEX.halo);
  halo.anchor.set(0.5); halo.tint = hex(color); halo.blendMode = 'add'; halo.alpha = 0.6;
  const core = new Sprite(TEX.star);
  core.anchor.set(0.5); core.tint = hex(color);
  const dot = new Sprite(TEX.dot);
  dot.anchor.set(0.5);
  v.addChild(halo, core, dot);
  return { i, x, y, color, view: v, halo, core, dot, phase: rng() * Math.PI * 2, collected: false };
}

export class SpaceScene {
  constructor(game) {
    this.game = game;
    this.root = new Container();
    this.starfield = new Starfield();
    this.world = new Container();
    this.starLayer = new Container();
    this.particles = new Particles(400);
    this.astronaut = new Astronaut(this.particles);
    this.compass = new Sprite(TEX.arrow);
    this.compass.anchor.set(0.5);
    this.compass.tint = 0xfde68a;
    this.compass.alpha = 0;
    this.world.addChild(this.starLayer, this.particles.container, this.astronaut.view, this.compass);

    // Capa en coordenadas de pantalla (final, fuegos, estrellas fugaces)
    this.fxLayer = new Container();
    this.screenFx = new Particles(700);
    this.fxLayer.addChild(this.screenFx.container);

    this.root.addChild(this.starfield.container, this.world, this.fxLayer);

    this.cam = { x: 0, y: 0 };
    this.mode = 'idle'; // idle | play | finale | free
    this.stars = [];
    this.built = false;
    this.idle = 0;
    this.t = 0;
    this.ambient = 2;
    this.constellationData = null;

    onResize((v) => this.starfield.resize(v.w, v.h));
    this.starfield.resize(view.w, view.h);
  }

  // Mundo ≈ 2.2 pantallas; posiciones con semilla para que no cambien al recargar.
  build() {
    const baseW = Math.max(view.w, 240);
    const baseH = Math.max(view.h, 400);
    this.W = Math.round(baseW * 2.2);
    this.H = Math.round(baseH * 2.2);
    const rng = mulberry32(this.game.save.seed);
    const cx = this.W / 2, cy = this.H / 2;
    const pts = [];
    let minD = 64;
    let tries = 0;
    while (pts.length < CONFIG.totalEstrellas) {
      if (++tries > 400) { tries = 0; minD *= 0.85; }
      const x = 24 + rng() * (this.W - 48);
      const y = 24 + rng() * (this.H - 48);
      if (dist(x, y, cx, cy) < 80) continue;
      if (pts.some((p) => dist(p.x, p.y, x, y) < minD)) continue;
      pts.push({ x, y });
    }
    const colors = CONFIG.paleta.estrellas;
    pts.forEach((p, i) => {
      const s = makeStar(i, p.x, p.y, colors[i % colors.length], rng);
      this.stars.push(s);
      this.starLayer.addChild(s.view);
    });
    this.built = true;
  }

  enter({ free = false, intro = false } = {}) {
    if (!this.built) this.build();
    this.mode = intro ? 'intro' : free ? 'free' : 'play';
    this.idle = 0;
    // en la portada la astronauta flota arriba, por encima del título
    this.camOffsetY = intro ? view.h * 0.28 : 0;

    // Deshacer lo que haya hecho el final
    gsap.killTweensOf([this.world, this.astronaut.view, ...this.stars.map((s) => s.view), ...this.stars.map((s) => s.view.scale)]);
    this.world.alpha = 1;
    this.starfield.container.alpha = 1;
    this.world.addChildAt(this.astronaut.view, 2);
    this.screenFx.clear();
    this.particles.clear();
    if (this.finaleLines) { this.finaleLines.destroy(); this.finaleLines = null; }

    const collected = new Set(this.game.save.collected);
    for (const s of this.stars) {
      s.collected = collected.has(s.i);
      this.starLayer.addChild(s.view);
      s.view.position.set(Math.round(s.x), Math.round(s.y));
      s.view.scale.set(1);
      s.view.alpha = 1;
      s.view.visible = free || !s.collected;
    }

    this.astronaut.reset(this.W / 2, this.H / 2);
    this.cam.x = this.camTargetX();
    this.cam.y = this.camTargetY();
    this.applyCamera();

    if (free) {
      if (!this.constellationData) this.constellationData = formation(view.w, view.h, this.stars.length);
      this.starfield.setConstellation(this.constellationData.points, this.constellationData.segments, this.cam);
    }

    hud.showHud(this.mode === 'play');
    hud.setCount(collected.size);
    hud.compassHint(false);
  }

  camTargetX() {
    return this.W <= view.w ? (this.W - view.w) / 2 : clamp(this.astronaut.x - view.w / 2, 0, this.W - view.w);
  }
  camTargetY() {
    return this.H <= view.h ? (this.H - view.h) / 2 : clamp(this.astronaut.y - view.h / 2 + (this.camOffsetY || 0), 0, this.H - view.h);
  }
  applyCamera() {
    this.world.position.set(-Math.round(this.cam.x), -Math.round(this.cam.y));
  }

  update(dt) {
    this.t += dt;
    const t = this.t;
    if (this.mode === 'idle') { this.starfield.update(this.cam.x, this.cam.y, dt); return; }

    const playing = this.mode === 'play' || this.mode === 'free' || this.mode === 'intro';
    const a = this.astronaut;

    if (playing) {
      // ── dirección deseada ──
      let ax = 0, ay = 0;
      if (input.enabled && input.down) {
        const px = input.pointer.x / view.cssScale + this.cam.x;
        const py = input.pointer.y / view.cssScale + this.cam.y;
        const dx = px - a.x, dy = py - a.y;
        const d = Math.hypot(dx, dy);
        if (d > 5) { const f = Math.min(d / 36, 1); ax = (dx / d) * f; ay = (dy / d) * f; }
      } else if (input.enabled && (input.keys.x || input.keys.y)) {
        const l = Math.hypot(input.keys.x, input.keys.y);
        ax = input.keys.x / l; ay = input.keys.y / l;
      }
      a.update(dt, ax, ay, this.W, this.H);

      // ── estrellas ──
      let nearest = null, nearestD = Infinity;
      for (const s of this.stars) {
        if (!s.view.visible) continue;
        s.halo.scale.set(1.05 + Math.sin(t * 3 + s.phase) * 0.25);
        s.halo.alpha = 0.5 + Math.sin(t * 3 + s.phase) * 0.2;
        s.dot.visible = Math.sin(t * 7 + s.phase) > -0.6;
        if (s.collected) continue;
        const d = dist(s.view.x, s.view.y, a.x, a.y);
        if (d < nearestD) { nearestD = d; nearest = s; }
        if (d < MAGNET) {
          const k = 1 - Math.exp(-9 * dt);
          s.view.x += (a.x - s.view.x) * k;
          s.view.y += (a.y - s.view.y) * k;
          if (d < GRAB) this.collect(s);
        } else if (s.view.x !== s.x || s.view.y !== s.y) {
          const k = 1 - Math.exp(-4 * dt);
          s.view.x += (s.x - s.view.x) * k;
          s.view.y += (s.y - s.view.y) * k;
        }
      }

      // ── brújula ──
      this.idle += dt;
      const showCompass = this.mode === 'play' && nearest && this.idle > IDLE_HINT;
      const target = showCompass ? 0.95 : 0;
      this.compass.alpha += (target - this.compass.alpha) * (1 - Math.exp(-4 * dt));
      if (nearest && this.compass.alpha > 0.01) {
        const ang = Math.atan2(nearest.view.y - a.y, nearest.view.x - a.x);
        const r = 20 + Math.sin(t * 5) * 2;
        this.compass.position.set(Math.round(a.x + Math.cos(ang) * r), Math.round(a.y + Math.sin(ang) * r));
        this.compass.rotation = ang;
      }
      hud.compassHint(!!showCompass && this.idle < IDLE_HINT + 4);

      // ── cámara ──
      const k = 1 - Math.exp(-5 * dt);
      this.cam.x += (this.camTargetX() - this.cam.x) * k;
      this.cam.y += (this.camTargetY() - this.cam.y) * k;
      this.applyCamera();
    } else {
      // finale: las estrellas viven en fxLayer y las mueve GSAP; solo pulsan
      for (const s of this.stars) {
        s.halo.scale.set(1.05 + Math.sin(t * 3 + s.phase) * 0.25);
        s.halo.alpha = 0.5 + Math.sin(t * 3 + s.phase) * 0.2;
      }
    }

    // ── estrellas fugaces de ambiente (final y modo libre) ──
    if (this.mode === 'free' || this.mode === 'finale') {
      this.ambient -= dt;
      if (this.ambient <= 0) {
        this.ambient = 1.5 + Math.random() * 3;
        const fromLeft = Math.random() < 0.5;
        this.screenFx.shootingStar(fromLeft ? -10 : view.w + 10, Math.random() * view.h * 0.5, fromLeft ? 1 : -1, 0.5);
      }
    }

    this.particles.update(dt);
    this.screenFx.update(dt);
    this.starfield.update(this.cam.x, this.cam.y, dt);
  }

  collect(s) {
    s.collected = true;
    this.idle = 0;
    this.particles.sparkle(s.view.x, s.view.y, hex(s.color));
    gsap.to(s.view.scale, { x: 2.4, y: 2.4, duration: 0.35, ease: 'power2.out' });
    gsap.to(s.view, { alpha: 0, duration: 0.35, onComplete: () => { s.view.visible = false; } });

    const save = this.game.save;
    if (!save.collected.includes(s.i)) save.collected.push(s.i);
    storage.save(save);
    const n = save.collected.length;

    hud.setCount(n, true);
    hud.phrase(CONFIG.frases[n - 1]);
    audio.blip(n - 1);
    if (CONFIG.vibracion && !params.has('novib')) vibrate(n >= CONFIG.totalEstrellas ? [30, 40, 60] : 15);

    if (n >= CONFIG.totalEstrellas) {
      this.mode = 'finale-wait';
      input.enabled = false;
      setTimeout(() => this.game.complete(), 900);
    }
  }
}
