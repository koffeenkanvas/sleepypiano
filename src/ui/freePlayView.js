import * as Tone from 'tone';
import { PIANO_KEYS, NOTE_NAMES } from '../data/songConfig.js';
import { state, pressedKeys } from '../lesson/lessonState.js';
import { backingSynth } from '../audio/backingEngine.js';
import { clearHighlightedKeys, releaseNote } from './keyboardView.js';

export function openFreePlay() {
  state.isFreePlaying = true;
  state.fpNoteHistory = [];
  const overlay = document.getElementById('free-play-overlay');
  if (overlay) {
    overlay.classList.add('active');
    updateFpHistory();
    buildRadialKeyMap();
  }
  // Stop any active lesson
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  backingSynth.releaseAll();
  state.isLessonActive = false;
  state.isAutoplayActive = false;
  state.repeatListening = false;
  clearHighlightedKeys();
}

export function closeFreePlay() {
  state.isFreePlaying = false;
  const overlay = document.getElementById('free-play-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  pressedKeys.forEach(k => releaseNote(k));
  pressedKeys.clear();
}

export function buildRadialKeyMap() {
  const mapEl = document.getElementById('fp-radial-map');
  if (!mapEl || mapEl.dataset.built) return;
  mapEl.dataset.built = "true";

  const radius = 140; // distance from center to tick base
  const labelRadius = 170; // distance for key labels
  
  PIANO_KEYS.forEach((k, i) => {
    // Distribute keys around 320 degrees (leaving a gap at bottom)
    const angle = (i / (PIANO_KEYS.length - 1)) * 300 - 150; 
    const rad = (angle * Math.PI) / 180;
    
    // Tick
    const tick = document.createElement('div');
    tick.className = `fp-tick fp-tick-${k.type}`;
    tick.id = `fp-tick-${k.key.toLowerCase().charCodeAt(0)}`;
    
    const x = Math.sin(rad) * radius;
    const y = -Math.cos(rad) * radius;
    
    tick.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;
    mapEl.appendChild(tick);
    
    // Label (Laptop Key)
    const label = document.createElement('div');
    label.className = 'fp-tick-label';
    label.id = `fp-label-${k.key.toLowerCase().charCodeAt(0)}`;
    label.textContent = (k.display || k.key).toUpperCase();
    
    const lx = Math.sin(rad) * labelRadius;
    const ly = -Math.cos(rad) * labelRadius;
    label.style.transform = `translate(${lx}px, ${ly}px)`;
    mapEl.appendChild(label);

    // Musical Note Label (e.g. "E4")
    const noteLabel = document.createElement('div');
    noteLabel.className = 'fp-tick-note-label';
    noteLabel.id = `fp-note-label-${k.key.toLowerCase().charCodeAt(0)}`;
    noteLabel.textContent = k.note;
    
    // Position it slightly further out than the laptop key
    const nx = Math.sin(rad) * (labelRadius + 22);
    const ny = -Math.cos(rad) * (labelRadius + 22);
    noteLabel.style.transform = `translate(${nx}px, ${ny}px)`;
    mapEl.appendChild(noteLabel);
  });
}

export function updateFreePLayDisplay(note) {
  const nameEl = document.getElementById('fp-note-name');
  const fullEl = document.getElementById('fp-note-full');
  if (!nameEl || !fullEl) return;

  const match = note.match(/^([A-G]#?)(\d)$/);
  if (!match) return;
  const [, name, octave] = match;

  nameEl.textContent = note;
  nameEl.classList.remove('fp-note-animate');
  void nameEl.offsetWidth;
  nameEl.classList.add('fp-note-animate');

  fullEl.textContent = `${NOTE_NAMES[name] || name}  ·  Octave ${octave}`;

  // Highlight radial tick & label
  const keyDef = PIANO_KEYS.find(k => k.note === note);
  if (keyDef) {
    const charCode = keyDef.key.toLowerCase().charCodeAt(0);
    const tick = document.getElementById(`fp-tick-${charCode}`);
    const label = document.getElementById(`fp-label-${charCode}`);
    const noteLabel = document.getElementById(`fp-note-label-${charCode}`);
    if (tick) tick.classList.add('active');
    if (label) label.classList.add('active');
    if (noteLabel) noteLabel.classList.add('active');
    
    // Use Tone.Transport to clear highlight (more reliable than setTimeout)
    Tone.Transport.scheduleOnce(() => {
      if (!pressedKeys.has(keyDef.key.toLowerCase())) {
        tick?.classList.remove('active');
        label?.classList.remove('active');
        noteLabel?.classList.remove('active');
      }
    }, "+0.2");
  }

  state.fpNoteHistory.unshift(note);
  if (state.fpNoteHistory.length > 6) state.fpNoteHistory.pop();
  updateFpHistory();
}

export function updateFpHistory() {
  const histEl = document.getElementById('fp-history');
  if (!histEl) return;
  histEl.innerHTML = state.fpNoteHistory.map((n, i) => `
    <span class="fp-history-note" style="opacity:${1 - i * 0.15}">${n}</span>
  `).join('');
}
