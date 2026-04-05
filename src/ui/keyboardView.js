import * as Tone from 'tone';
import { PIANO_KEYS, getSongBpm } from '../data/songConfig.js';
import { state, keyElementsMap, pressedKeys } from '../lesson/lessonState.js';
import { updateFreePLayDisplay, closeFreePlay } from './freePlayView.js';
import { updateRepeatKeysDisplay, updateTeacherUI } from './teacherBoardView.js';
import { synth, tickSynth } from '../audio/pianoEngine.js';
import { backingSynth } from '../audio/backingEngine.js';

export function clearHighlightedKeys() {
  document.querySelectorAll('.key').forEach(el => {
    el.classList.remove('teacher-highlight', 'approach-ring', 'waiting-pulse');
  });
}

export function initKeyboard() {
  const keyboardEl = document.getElementById('keyboard');
  PIANO_KEYS.forEach((keyDef) => {
    const li = document.createElement('li');
    li.classList.add('key', keyDef.type);
    const keyLabel = document.createElement('div');
    keyLabel.classList.add('key-label');
    keyLabel.textContent = keyDef.display || keyDef.key;
    li.appendChild(keyLabel);
    keyboardEl.appendChild(li);
    keyElementsMap.set(keyDef.key.toLowerCase(), li);
    li.addEventListener('mousedown', async () => triggerNote(keyDef.key.toLowerCase()));
    li.addEventListener('mouseup', () => releaseNote(keyDef.key.toLowerCase()));
    li.addEventListener('mouseleave', () => {
      if (pressedKeys.has(keyDef.key.toLowerCase())) releaseNote(keyDef.key.toLowerCase());
    });
  });
}

export async function triggerNote(laptopKey) {
  if (Tone.context.state !== 'running') await Tone.start();
  if (pressedKeys.has(laptopKey)) return;
  pressedKeys.add(laptopKey);

  const keyDef = PIANO_KEYS.find(k => k.key.toLowerCase() === laptopKey);
  if (!keyDef) return;

  synth.triggerAttack(keyDef.note);

  const keyEl = keyElementsMap.get(laptopKey);
  if (keyEl) keyEl.classList.add('active');

  // ── FREE PLAY ──
  if (state.isFreePlaying) {
    updateFreePLayDisplay(keyDef.note);
    return;
  }

  // ── REPEAT MODE ──
  if (state.currentMode === 'repeat' && state.repeatListening) {
    const expected = state.repeatExpectedNotes[state.repeatNoteIndex];
    if (!expected) return;

    if (keyDef.note === expected.note) {
      // Correct!
      const board = document.querySelector('.teacher-board');
      if (board) {
        board.classList.remove('flash-correct'); void board.offsetWidth; board.classList.add('flash-correct');
      }

      state.repeatNoteIndex++;
      updateRepeatKeysDisplay();

      // Advance highlight
      clearHighlightedKeys();
      if (state.repeatNoteIndex < state.repeatExpectedNotes.length) {
        const nextKeyDef = PIANO_KEYS.find(k => k.note === state.repeatExpectedNotes[state.repeatNoteIndex].note);
        if (nextKeyDef) {
          const domKey = keyElementsMap.get(nextKeyDef.key.toLowerCase());
          if (domKey) domKey.classList.add('teacher-highlight');
        }
      }

      // Line complete
      if (state.repeatNoteIndex >= state.repeatExpectedNotes.length) {
        state.repeatListening = false;
        clearHighlightedKeys();
        const feedbackEl = document.getElementById('repeat-feedback');
        if (feedbackEl) feedbackEl.innerHTML = `
          <div class="repeat-success">
            <span>✅ Nice!</span>
            <button class="repeat-action-btn" onclick="nextRepeatLine()">Next Line →</button>
            <button class="repeat-action-btn repeat-retry" onclick="retryRepeat()">🔁 Replay</button>
          </div>`;
      }
    } else {
      // Wrong note — brief shake
      if (keyEl) {
        keyEl.classList.add('error-shake');
        Tone.Transport.scheduleOnce(() => keyEl.classList.remove('error-shake'), "+0.3");
      }
    }
    return;
  }

  // ── LESSON MODE (Step / Follow) ──
  if (state.isLessonActive && state.currentLineIndex < state.lessonLines.length && !state.isAutoplayActive) {
    const currentLine = state.lessonLines[state.currentLineIndex];
    const expectedNoteObj = currentLine.notes[state.currentNoteInLine];

    const bpm = getSongBpm(state.currentSongId);
    const beatSec = 60 / bpm;

    if (keyDef.note === expectedNoteObj.note) {
      if (keyEl) {
        const holdMs = Math.max((expectedNoteObj.duration || 1) * beatSec * 1000, 300);
        keyEl.style.setProperty('--hold-time', `${holdMs}ms`);
        keyEl.classList.add('active-hold');
        state.activeHoldNote = { key: laptopKey, startTime: performance.now(), targetHold: holdMs, domKey: keyEl };
        
        Tone.Transport.scheduleOnce(() => {
          if (state.activeHoldNote && state.activeHoldNote.key === laptopKey) {
             keyEl.classList.remove('active-hold');
          }
        }, `+${(holdMs/1000).toFixed(2)}`);
      }

      const playBacking = document.getElementById('backing-toggle')?.checked ?? true;

      if (state.currentMode === "step") {
        if (playBacking) tickSynth.triggerAttackRelease("C2", "8n");
        backingSynth.releaseAll();
        if (playBacking) {
          backingSynth.triggerAttack([keyDef.note]);
          if (window.sustainTimeoutID) Tone.Transport.clear(window.sustainTimeoutID);
          window.sustainTimeoutID = Tone.Transport.scheduleOnce(() => backingSynth.releaseAll(), "+2");
        }
      } else if (state.currentMode === "follow") {
        backingSynth.releaseAll();
        const currentBeat = expectedNoteObj.beat;
        if (currentBeat !== null && playBacking) {
          const harmonyNotes = state.backingChordsData
            .filter(c => Math.abs(c.beat - currentBeat) <= 0.1)
            .map(c => c.note);
          if (harmonyNotes.length > 0) {
            backingSynth.triggerAttack(harmonyNotes);
            const maxSustainSec = 4 * beatSec;
            if (window.sustainTimeoutID) Tone.Transport.clear(window.sustainTimeoutID);
            window.sustainTimeoutID = Tone.Transport.scheduleOnce(() => backingSynth.releaseAll(), `+${maxSustainSec.toFixed(2)}`);
          }
        }
      }

      const board = document.querySelector('.teacher-board');
      if (board) {
        board.classList.remove('flash-correct'); void board.offsetWidth; board.classList.add('flash-correct');
      }

      state.currentNoteInLine++;
      if (state.currentNoteInLine >= currentLine.totalNotes) {
        state.currentLineIndex++;
        state.currentNoteInLine = 0;
      }
      updateTeacherUI();
    }
  }
}

export function releaseNote(laptopKey) {
  pressedKeys.delete(laptopKey);
  const keyDef = PIANO_KEYS.find(k => k.key.toLowerCase() === laptopKey);
  if (!keyDef) return;

  synth.triggerRelease(keyDef.note);
  const keyEl = keyElementsMap.get(laptopKey);
  if (keyEl) keyEl.classList.remove('active');

  const charCode = laptopKey.charCodeAt(0);
  const tick = document.getElementById(`fp-tick-${charCode}`);
  const label = document.getElementById(`fp-label-${charCode}`);
  if (tick) tick.classList.remove('active');
  if (label) label.classList.remove('active');

  if (state.activeHoldNote && state.activeHoldNote.key === laptopKey) {
    const { domKey, startTime, targetHold } = state.activeHoldNote;
    domKey.classList.remove('active-hold');
    const heldTime = performance.now() - startTime;
    if (heldTime < targetHold - 200) {
      domKey.classList.add('error-shake');
      Tone.Transport.scheduleOnce(() => domKey.classList.remove('error-shake'), "+0.3");
    } else {
      domKey.classList.add('success-glow');
      Tone.Transport.scheduleOnce(() => domKey.classList.remove('success-glow'), "+0.4");
    }
    state.activeHoldNote = null;
  }
}

export function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    if (e.key === 'Escape' && state.isFreePlaying) {
      closeFreePlay();
      return; 
    }

    const key = e.key.toLowerCase();
    triggerNote(key);
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (pressedKeys.has(key)) releaseNote(key);
  });
}
