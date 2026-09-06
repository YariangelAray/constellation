import { Container, Graphics, TilingSprite } from 'pixi.js';
import { TEX } from '../art/sprites.js';
import { CONFIG } from '../../config.js';
import { hex } from '../core/util.js';

// Cielo de fondo con parallax: nebulosas + tres capas de estrellitas.
export class Starfield {
  constructor() {
    this.container = new Container();
    this.layers = [];

    const neb = CONFIG.paleta.nebulosas;
    const nebulaDefs = [
      { tex: TEX.nebula[0], f: 0.06, scale: 5, tint: neb[0], alpha: 0.42, ox: 0, oy: 0 },
      { tex: TEX.nebula[1], f: 0.09, scale: 4, tint: neb[1], alpha: 0.32, ox: 200, oy: 140 },
      { tex: TEX.nebula[2], f: 0.12, scale: 6, tint: neb[2] || neb[0], alpha: 0.26, ox: 90, oy: 400 },
    ];
    for (const d of nebulaDefs) {
      const s = new TilingSprite({ texture: d.tex, width: 10, height: 10 });
      s.tileScale.set(d.scale);
      s.tint = hex(d.tint);
      s.alpha = d.alpha;
      s.blendMode = 'add';
      this.container.addChild(s);
      this.layers.push({ s, f: d.f, ox: d.ox, oy: d.oy, drift: 1.5 + this.layers.length });
    }

    const skyDefs = [
      { tex: TEX.sky[0], f: 0.15 },
      { tex: TEX.sky[1], f: 0.32 },
      { tex: TEX.sky[2], f: 0.55 },
    ];
    for (const d of skyDefs) {
      const s = new TilingSprite({ texture: d.tex, width: 10, height: 10 });
      this.container.addChild(s);
      this.layers.push({ s, f: d.f, ox: 0, oy: 0, drift: 0 });
    }

    // Constelación del "20" que queda en el cielo tras el final (modo libre)
    this.constellation = new Graphics();
    this.constellation.visible = false;
    this.container.addChild(this.constellation);
    this.constF = 0.28;
    this.constOffset = { x: 0, y: 0 };
    this.t = 0;
  }

  resize(w, h) {
    for (const l of this.layers) { l.s.width = w; l.s.height = h; }
  }

  update(camX, camY, dt = 0) {
    this.t += dt;
    for (const l of this.layers) {
      l.s.tilePosition.set(-camX * l.f + l.ox + this.t * l.drift, -camY * l.f + l.oy + this.t * l.drift * 0.4);
    }
    if (this.constellation.visible) {
      this.constellation.position.set(
        Math.round(-camX * this.constF + this.constOffset.x),
        Math.round(-camY * this.constF + this.constOffset.y),
      );
    }
  }

  // points: [{x,y}] en pantalla; segments: [[a,b]] índices. cam: cámara actual.
  setConstellation(points, segments, cam) {
    const g = this.constellation;
    g.clear();
    for (const [a, b] of segments) {
      g.moveTo(points[a].x, points[a].y).lineTo(points[b].x, points[b].y);
    }
    g.stroke({ width: 1, color: 0x7dd3fc, alpha: 0.35 });
    for (const p of points) g.rect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, 2).fill({ color: 0xfde68a, alpha: 0.9 });
    // que aparezca justo donde estaba con la cámara actual
    this.constOffset.x = cam.x * this.constF;
    this.constOffset.y = cam.y * this.constF;
    g.visible = true;
  }
}
