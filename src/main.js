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

function freshSave() {
  return { collected: [], seed: (Math.random() * 1e9) | 0, done: false };
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
  game.state = 'free';
  game.space.enter({ free: true });
  input.enabled = true;
  if (CONFIG.modoLibre) hud.showFreeLetter(() => game.openLetter());
}

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
  hud.hideFreeLetter();
  if (from === 'finale') hud.hideFinale();
  letter.show();
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
  letter.init({ onFly: () => (CONFIG.modoLibre ? startFree() : hud.showIntro({ done: true })) });

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
    setInterval(() => hud.fps(`${Math.round(app.ticker.FPS)} fps · ${game.space.root.width | 0}`), 500);
  }

  // Botones de la portada (el primer toque desbloquea el audio)
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
