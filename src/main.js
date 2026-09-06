import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import './styles/main.css';

import { CONFIG } from '../config.js';
import { initApp, app } from './core/app.js';
import { buildTextures } from './art/sprites.js';
import { initInput, input } from './core/input.js';
import * as audio from './core/audio.js';
import { params, storage, clamp } from './core/util.js';
import { SpaceScene } from './scenes/space.js';
import { runFinale } from './scenes/finale.js';
import { hud } from './ui/hud.js';
import { letter } from './ui/letter.js';

const game = {
  state: 'boot',
  save: null,
  space: null,
};

function freshSave(record = 0) {
  return { collected: [], seed: (Math.random() * 1e9) | 0, done: false, record };
}

function startSpace() {
  hud.hideIntro();
  hud.hideFreeLetter();
  game.state = 'space';
  game.space.enter({ free: false });
  input.enabled = true;
}

function startFree() {
  hud.hideIntro();
  hud.hideFinale();
  hud.hideGameOver();
  game.state = 'free';
  game.space.enter({ free: true });
  input.enabled = true;
  if (CONFIG.modoLibre) hud.showFreeLetter(() => game.openLetter());
}

// Empezar de cero: borra el progreso pero NO el récord (esa marca es suya) y recarga limpio
function restart() {
  const record = game.save?.record || 0;
  storage.clear();
  if (record) storage.save(freshSave(record));
  location.replace(location.pathname);
}

// Fin de partida del modo arcade
game.gameOver = (score) => {
  game.state = 'gameover';
  input.enabled = false;
  hud.hideFreeLetter();
  const record = game.save.record || 0;
  const isNew = score > record;
  if (isNew) {
    game.save.record = score;
    storage.save(game.save);
  }
  setTimeout(() => {
    hud.showHud(false);
    hud.showRecord(0);
    hud.showGameOver({ score, record: Math.max(record, score), isNew });
  }, 1200);
};

game.complete = () => {
  game.state = 'finale';
  input.enabled = false;
  game.save.done = true;
  storage.save(game.save);
  runFinale(game, game.space);
};

game.openLetter = () => {
  const from = game.state;
  game.state = 'letter';
  input.enabled = false;
  game.space.paused = true; // que no la maten mientras lee
  hud.hideFreeLetter();
  hud.hideGameOver();
  if (from === 'finale') hud.hideFinale();
  // la máquina de escribir solo la primera vez que se abre la carta
  letter.show({ instant: !!game.save.letterSeen });
  game.save.letterSeen = true;
  storage.save(game.save);
};

async function boot() {
  if (params.has('reset')) storage.clear();
  game.save = storage.load() || freshSave();
  if (!Array.isArray(game.save.collected)) game.save = freshSave();
  if (params.has('stars')) {
    const n = clamp(parseInt(params.get('stars'), 10) || 0, 0, CONFIG.totalEstrellas);
    game.save.collected = Array.from({ length: n }, (_, i) => i);
    game.save.done = false;
  }

  hud.init();
  letter.init({
    onFly: () => (CONFIG.modoLibre ? startFree() : hud.showIntro({ done: true })),
    onRestart: restart,
  });
  hud.el.restart.addEventListener('click', restart);
  hud.el['over-again'].addEventListener('click', () => { hud.hideGameOver(); startFree(); });
  hud.el['over-back'].addEventListener('click', () => {
    hud.hideGameOver();
    hud.showHud(false);
    hud.showRecord(0);
    game.state = 'intro';
    game.space.enter({ intro: true });
    hud.showIntro({ done: !!game.save.done });
  });

  await initApp(document.getElementById('game-root'));
  buildTextures();
  initInput();

  game.space = new SpaceScene(game);
  app.stage.addChild(game.space.root);

  app.ticker.add((tk) => {
    const dt = Math.min(tk.deltaMS / 1000, 0.05);
    game.space.update(dt);
  });

  if (params.has('fps')) {
    window.__audio = audio;
    window.__game = game;
    setInterval(() => hud.fps(`${Math.round(app.ticker.FPS)} fps · ${audio.debugInfo()}`), 500);
  }

  // Cualquier toque en la portada desbloquea el audio (la música arranca ahí mismo)
  hud.el.intro.addEventListener('pointerdown', () => audio.unlock());
  // Botones de la portada
  hud.el.start.addEventListener('click', () => { audio.unlock(); startSpace(); });
  hud.el['fly-again'].addEventListener('click', () => { audio.unlock(); startFree(); });
  hud.el['read-again'].addEventListener('click', () => { audio.unlock(); startFree(); game.openLetter(); });

  // Atajos para probar sin recoger 20 estrellas: ?scene=final  ?scene=carta  ?stars=19
  const scene = params.get('scene');
  if (scene === 'final') {
    game.save.collected = Array.from({ length: CONFIG.totalEstrellas }, (_, i) => i);
    hud.el.intro.hidden = true;
    game.space.enter({ free: false });
    game.space.mode = 'finale-wait';
    setTimeout(() => game.complete(), 600);
  } else if (scene === 'carta') {
    hud.el.intro.hidden = true;
    startFree();
    game.openLetter();
  } else if (scene === 'libre') {
    hud.el.intro.hidden = true;
    startFree();
  } else {
    game.space.enter({ intro: true });
    hud.showIntro({ done: !!game.save.done });
  }
}

boot().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend',
    `<pre style="position:fixed;inset:0;margin:0;padding:16px;background:#05030f;color:#f9a8d4;font:14px monospace;white-space:pre-wrap;z-index:99">Algo salió mal 😢\n\n${e?.stack || e}</pre>`);
});
