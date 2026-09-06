import { gsap } from 'gsap';
import { CONFIG } from '../../config.js';
import * as audio from '../core/audio.js';

const $ = (s) => document.querySelector(s);

// Iconos pixel del botón de sonido, dibujados como rects de SVG (12×12)
const SPEAKER = [
  '......#.....',
  '.....##.....',
  '....###..#..',
  '.#####....#.',
  '.#####.#..#.',
  '.#####..#.#.',
  '.#####..#.#.',
  '.#####.#..#.',
  '.#####....#.',
  '....###..#..',
  '.....##.....',
  '......#.....',
];
const SPEAKER_OFF = [
  '......#.....',
  '.....##.....',
  '....###.....',
  '.#####.#...#',
  '.#####..#.#.',
  '.#####...#..',
  '.#####...#..',
  '.#####..#.#.',
  '.#####.#...#',
  '....###.....',
  '.....##.....',
  '......#.....',
];
function pixelSvg(rows, cls) {
  const rects = [];
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') rects.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`); }));
  return `<svg class="${cls}" viewBox="0 0 12 12" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects.join('')}</svg>`;
}

// Todo lo que es texto/botones vive en el DOM encima del canvas.
export const hud = {
  el: {},
  phraseTl: null,

  init() {
    const el = this.el;
    ['hud', 'count', 'total', 'mute', 'phrase', 'compass-hint', 'intro', 'intro-date', 'intro-name', 'intro-hint',
      'start', 'intro-done', 'read-again', 'fly-again', 'finale', 'finale-title', 'finale-sub', 'polaroids',
      'open-letter', 'free-letter', 'fps', 'restart', 'record',
      'gameover', 'over-title', 'over-score', 'over-record', 'over-again', 'over-back'].forEach((id) => { el[id] = $('#' + id); });

    el.mute.innerHTML = pixelSvg(SPEAKER, 'ico-on') + pixelSvg(SPEAKER_OFF, 'ico-off');

    el.total.textContent = CONFIG.totalEstrellas;
    el['intro-date'].textContent = CONFIG.fecha || '';
    el['intro-name'].textContent = CONFIG.nombre;

    this.syncMute();
    el.mute.addEventListener('click', () => { audio.setMuted(!audio.isMuted()); this.syncMute(); });
  },

  syncMute() {
    this.el.mute.classList.toggle('off', audio.isMuted());
  },

  // ── portada ──
  showIntro({ done = false } = {}) {
    const el = this.el;
    el.intro.hidden = false;
    el.intro.style.opacity = '';
    el.start.hidden = done;
    el['intro-done'].hidden = !done;
    el['intro-hint'].innerHTML = done
      ? 'Ya recogiste las <b>' + CONFIG.totalEstrellas + '</b> estrellas ✦<br />¿qué quieres hacer?'
      : 'Arrastra el dedo para volar<br />y recoge las <b>' + CONFIG.totalEstrellas + '</b> estrellas ✦';
    gsap.fromTo('.intro-box > *', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.09, ease: 'power2.out' });
  },
  hideIntro() {
    const el = this.el;
    gsap.to(el.intro, { opacity: 0, duration: 0.5, onComplete: () => { el.intro.hidden = true; } });
    el.mute.hidden = false;
  },

  // ── juego ──
  showHud(v) { this.el.hud.hidden = !v; },
  // modo libre: solo "✦ N" (sin el "/ 20")
  freeMode(v) { this.el.hud.classList.toggle('free', v); },
  showRecord(n) {
    const el = this.el.record;
    el.hidden = !n;
    if (n) el.textContent = `récord ${n}`;
  },
  // destello dorado del contador (estrella dorada / récord batido)
  flashCount() {
    gsap.fromTo(this.el.count, { scale: 2.4 }, { scale: 1, duration: 0.7, ease: 'back.out(2.5)' });
  },
  setCount(n, pop = false) {
    this.el.count.textContent = n;
    if (pop) gsap.fromTo(this.el.count, { scale: 1.8 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
  },
  phrase(text) {
    if (!text) return;
    const p = this.el.phrase;
    this.phraseTl?.kill();
    p.textContent = text;
    this.phraseTl = gsap.timeline()
      .fromTo(p, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' })
      .to(p, { opacity: 0, y: -10, duration: 0.6, ease: 'power1.in' }, '+=2.3');
  },
  compassHint(v) { this.el['compass-hint'].hidden = !v; },

  // ── final ──
  finaleTitle(title, sub) {
    const el = this.el;
    el['finale-title'].textContent = '';
    el['finale-sub'].textContent = sub;
    el.finale.style.opacity = '';
    let i = 0;
    const step = () => {
      i++;
      el['finale-title'].textContent = title.slice(0, i);
      if (i < title.length) setTimeout(step, 110);
      else gsap.to(el['finale-sub'], { opacity: 1, duration: 1.2, delay: 0.3 });
    };
    step();
  },
  showPolaroids(urls) {
    const box = this.el.polaroids;
    box.innerHTML = '';
    if (!urls.length) return;
    const figs = urls.map((u) => {
      const f = document.createElement('figure');
      f.className = 'polaroid';
      const img = document.createElement('img');
      img.src = u; img.alt = '';
      f.appendChild(img);
      box.appendChild(f);
      return f;
    });
    gsap.fromTo(figs,
      { opacity: 0, y: 90, rotation: () => gsap.utils.random(-25, 25) },
      { opacity: 1, y: 0, rotation: () => gsap.utils.random(-9, 9), duration: 1, ease: 'back.out(1.4)', stagger: 0.22,
        onComplete: () => figs.forEach((f, i) => gsap.to(f, { y: -7, duration: 1.8 + i * 0.25, yoyo: true, repeat: -1, ease: 'sine.inOut' })) });
  },
  showLetterButton(cb) {
    const b = this.el['open-letter'];
    b.hidden = false;
    b.onclick = cb;
    gsap.fromTo(b, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.6)' });
  },
  hideFinale() {
    const el = this.el;
    gsap.to(el.finale, { opacity: 0, duration: 0.5, onComplete: () => {
      el['finale-title'].textContent = '';
      el['finale-sub'].textContent = '';
      el['finale-sub'].style.opacity = '';
      el.polaroids.innerHTML = '';
      el['open-letter'].hidden = true;
      el.finale.style.opacity = '';
    } });
  },

  // ── modo libre ──
  showFreeLetter(cb) {
    const b = this.el['free-letter'];
    b.hidden = false;
    b.onclick = cb;
    gsap.fromTo(b, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(2)' });
  },
  hideFreeLetter() { this.el['free-letter'].hidden = true; },

  // ── fin de partida (modo arcade) ──
  showGameOver({ score, record, isNew }) {
    const el = this.el;
    el['over-score'].textContent = `✦ ${score}`;
    el['over-record'].textContent = isNew ? '¡NUEVO RÉCORD!' : `tu récord: ${record}`;
    el['over-record'].classList.toggle('new', !!isNew);
    el['over-title'].textContent = isNew ? '¡BOOM!' : 'SE ACABÓ';
    el.gameover.hidden = false;
    el.gameover.style.opacity = '';
    gsap.fromTo('.over-box > *', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.6)' });
  },
  hideGameOver() {
    const el = this.el;
    gsap.to(el.gameover, { opacity: 0, duration: 0.35, onComplete: () => { el.gameover.hidden = true; el.gameover.style.opacity = ''; } });
  },

  fps(text) { const f = this.el.fps; f.hidden = false; f.textContent = text; },
};
