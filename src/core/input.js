// Entrada unificada: dedo/ratón (pointer events) + teclado.
export const input = {
  down: false,
  pointer: { x: 0, y: 0 }, // en px CSS
  keys: { x: 0, y: 0 },
  enabled: false,
};

const held = new Set();
let activeId = null;

function updateKeys() {
  const l = held.has('ArrowLeft') || held.has('KeyA');
  const r = held.has('ArrowRight') || held.has('KeyD');
  const u = held.has('ArrowUp') || held.has('KeyW');
  const d = held.has('ArrowDown') || held.has('KeyS');
  input.keys.x = (r ? 1 : 0) - (l ? 1 : 0);
  input.keys.y = (d ? 1 : 0) - (u ? 1 : 0);
}

const isUi = (e) => e.target?.closest?.('button, .paper, .overlay');

export function initInput() {
  window.addEventListener('pointerdown', (e) => {
    if (!input.enabled || isUi(e)) return;
    if (activeId !== null) return; // solo el primer dedo
    activeId = e.pointerId;
    input.down = true;
    input.pointer.x = e.clientX;
    input.pointer.y = e.clientY;
  });
  window.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activeId) return;
    input.pointer.x = e.clientX;
    input.pointer.y = e.clientY;
  });
  const release = (e) => {
    if (e.pointerId !== activeId) return;
    activeId = null;
    input.down = false;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  window.addEventListener('blur', () => { activeId = null; input.down = false; held.clear(); updateKeys(); });

  window.addEventListener('keydown', (e) => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    held.add(e.code);
    updateKeys();
  });
  window.addEventListener('keyup', (e) => { held.delete(e.code); updateKeys(); });
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}
