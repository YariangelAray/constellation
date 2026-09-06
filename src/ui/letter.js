import { gsap } from 'gsap';
import { CARTA, FIRMA } from '../../carta.js';

const $ = (s) => document.querySelector(s);

// Mini-markdown: párrafos, **negrita**, *cursiva*, --- separador. Todo lo demás se escapa.
export function renderMarkdown(text) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const blocks = text.replace(/\r\n/g, '\n').trim().split(/\n\s*\n/);
  return blocks.map((b) => {
    if (/^-{3,}$/.test(b.trim())) return '<hr>';
    const html = esc(b)
      .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
      .replace(/\*(.+?)\*/g, '<i>$1</i>')
      .replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  }).join('');
}

// Envuelve cada carácter en un <span class="ch"> (ocultos, van apareciendo uno a uno).
function wrapChars(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    for (const ch of n.textContent) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      frag.appendChild(s);
    }
    n.parentNode.replaceChild(frag, n);
  }
}

export const letter = {
  el: {},
  typing: false,
  timer: null,
  onFly: null,

  init({ onFly, onRestart }) {
    this.onFly = onFly;
    this.onRestart = onRestart;
    const el = this.el;
    el.overlay = $('#letter');
    el.paper = $('.paper');
    el.content = $('#letter-content');
    el.sign = $('#letter-sign');
    el.heart = $('.heart');
    el.actions = $('.letter-actions');
    el.hint = $('#tap-hint');

    $('#letter-again').addEventListener('click', () => this.start());
    $('#letter-fly').addEventListener('click', () => { this.hide(); this.onFly?.(); });
    $('#letter-restart').addEventListener('click', () => this.onRestart?.());
    el.overlay.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      if (this.typing) this.finish();
    });
  },

  show() {
    const el = this.el;
    el.overlay.hidden = false;
    el.overlay.style.opacity = '';
    gsap.fromTo(el.paper, { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' });
    this.start();
  },

  hide() {
    const el = this.el;
    clearTimeout(this.timer);
    this.typing = false;
    gsap.to(el.overlay, { opacity: 0, duration: 0.45, onComplete: () => { el.overlay.hidden = true; } });
  },

  start() {
    const el = this.el;
    clearTimeout(this.timer);
    el.content.innerHTML = renderMarkdown(CARTA);
    wrapChars(el.content);
    el.sign.textContent = FIRMA || '';
    el.sign.style.opacity = 0;
    el.heart.style.opacity = 0;
    el.actions.style.opacity = 0;
    el.actions.style.pointerEvents = 'none';
    el.hint.hidden = false;
    el.paper.scrollTop = 0;

    const chars = [...el.content.querySelectorAll('.ch')];
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▌';
    this.chars = chars;
    this.caret = caret;
    this.typing = true;
    el.content.classList.add('typing');

    let i = 0;
    const step = () => {
      if (!this.typing) return;
      if (i >= chars.length) { this.finish(); return; }
      const c = chars[i];
      c.classList.add('on');
      c.parentNode.insertBefore(caret, c.nextSibling);
      i++;
      // que el caret siempre se vea
      const cr = caret.getBoundingClientRect();
      const pr = el.paper.getBoundingClientRect();
      if (cr.bottom > pr.bottom - 30) el.paper.scrollTop += cr.bottom - (pr.bottom - 30);

      const ch = c.textContent;
      let delay = 28;
      if (',;:'.includes(ch)) delay = 160;
      else if ('.!?…'.includes(ch)) delay = 320;
      else if (ch === '\n') delay = 200;
      this.timer = setTimeout(step, delay);
    };
    this.timer = setTimeout(step, 500);
  },

  finish() {
    const el = this.el;
    clearTimeout(this.timer);
    this.typing = false;
    this.chars?.forEach((c) => c.classList.add('on'));
    this.caret?.remove();
    el.content.classList.remove('typing');
    el.hint.hidden = true;
    el.actions.style.pointerEvents = '';
    gsap.timeline()
      .to(el.sign, { opacity: 1, duration: 0.8 })
      .to(el.heart, { opacity: 1, duration: 0.6 }, '-=0.3')
      .to(el.actions, { opacity: 1, duration: 0.6 }, '-=0.2')
      .add(() => { el.paper.scrollTo({ top: el.paper.scrollHeight, behavior: 'smooth' }); }, '-=0.6');
  },
};
