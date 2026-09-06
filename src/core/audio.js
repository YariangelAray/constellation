import * as Tone from 'tone';

// Chiptune generado en vivo con Tone.js. Nada de archivos.
let ready = false;
let building = false;
let muted = false;
try { muted = localStorage.getItem('c20-mute') === '1'; } catch { /* nada */ }

let melody, bass, pad, blipSynth, transport;

export const isReady = () => ready;
export const isMuted = () => muted;

export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('c20-mute', m ? '1' : '0'); } catch { /* nada */ }
  try { Tone.getDestination().mute = m; } catch { /* aún no hay contexto */ }
}

// Debe llamarse desde un gesto del usuario (el botón de la portada).
export async function unlock() {
  if (ready || building) return;
  building = true;
  try {
    await Tone.start();
    build();
    ready = true;
    Tone.getDestination().mute = muted;
  } catch (e) {
    console.warn('Audio no disponible:', e);
  }
  building = false;
}

// C  Am  F  G — dos vueltas con pequeña variación
const MEL = [
  'E5', null, 'G5', 'E5', 'C6', null, 'G5', null,
  'A5', null, 'E5', null, 'C5', 'E5', 'A5', null,
  'F5', null, 'A5', 'F5', 'C6', null, 'A5', null,
  'G5', null, 'D5', null, 'B4', 'D5', 'G5', null,
  'C6', null, null, 'B5', 'G5', null, 'E5', null,
  'A5', null, 'C6', null, 'E5', null, null, null,
  'F5', 'A5', 'C6', null, 'A5', null, 'F5', null,
  'D5', null, 'G5', null, 'B5', null, 'D6', null,
];
const BASS_BAR = [['C3', 'G3', 'C3', 'G3'], ['A2', 'E3', 'A2', 'E3'], ['F2', 'C3', 'F2', 'C3'], ['G2', 'D3', 'G2', 'D3']];
const BASS = [...BASS_BAR, ...BASS_BAR].flat();
const CHORDS_BAR = [['C4', 'E4', 'G4'], ['A3', 'C4', 'E4'], ['F3', 'A3', 'C4'], ['G3', 'B3', 'D4']];
const CHORDS = [...CHORDS_BAR, ...CHORDS_BAR];

function build() {
  const dest = Tone.getDestination();
  dest.volume.value = -4;

  const reverb = new Tone.Reverb({ decay: 2.4, wet: 0.32 }).toDestination();
  const filter = new Tone.Filter(2600, 'lowpass').connect(reverb);

  melody = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.01, decay: 0.18, sustain: 0.15, release: 0.4 },
    volume: -21,
  }).connect(filter);

  bass = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.25, sustain: 0.3, release: 0.3 },
    volume: -14,
  }).connect(filter);

  pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.8, decay: 0.5, sustain: 0.6, release: 1.5 },
    volume: -27,
  }).connect(reverb);

  blipSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'square' },
    envelope: { attack: 0.004, decay: 0.14, sustain: 0, release: 0.12 },
    volume: -15,
  }).connect(reverb);

  transport = Tone.getTransport();
  transport.bpm.value = 96;
  new Tone.Sequence((time, n) => { if (n) melody.triggerAttackRelease(n, '8n', time); }, MEL, '8n').start(0);
  new Tone.Sequence((time, n) => { if (n) bass.triggerAttackRelease(n, '4n', time); }, BASS, '4n').start(0);
  new Tone.Sequence((time, c) => { if (c) pad.triggerAttackRelease(c, '1m', time); }, CHORDS, '1m').start(0);
  transport.start('+0.05');

  document.addEventListener('visibilitychange', () => {
    if (!ready) return;
    try { document.hidden ? transport.pause() : transport.start(); } catch { /* nada */ }
  });
}

const SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

// Blip de la estrella n (0-19): cada una un poco más aguda que la anterior.
export function blip(n) {
  if (!ready) return;
  try {
    const note = `${SCALE[n % 7]}${4 + Math.floor(n / 7)}`;
    const fifth = Tone.Frequency(note).transpose(7).toNote();
    const now = Tone.now();
    blipSynth.triggerAttackRelease(note, '16n', now);
    blipSynth.triggerAttackRelease(fifth, '16n', now + 0.06, 0.6);
  } catch { /* nada */ }
}

// Chispita cortita (estrellas llegando a su sitio en el final)
export function tick(n) {
  if (!ready) return;
  try {
    const note = `${SCALE[n % 7]}${5 + Math.floor((n % 14) / 7)}`;
    blipSynth.triggerAttackRelease(note, '32n', Tone.now(), 0.5);
  } catch { /* nada */ }
}

// Fanfarria del "20 AÑOS"
export function fanfare() {
  if (!ready) return;
  try {
    const now = Tone.now();
    ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'].forEach((n, i) => blipSynth.triggerAttackRelease(n, '16n', now + i * 0.09));
    pad.triggerAttackRelease(['C4', 'E4', 'G4', 'C5'], '2m', now + 0.5);
    melody.triggerAttackRelease(['E6', 'G6', 'C7'], '2n', now + 0.6);
  } catch { /* nada */ }
}
