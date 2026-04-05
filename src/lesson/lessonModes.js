import * as Tone from 'tone';
import { SONG_LIBRARY } from '../data/songs.js';
import { getSongBpm, PIANO_KEYS } from '../data/songConfig.js';
import { state, keyElementsMap } from './lessonState.js';
import { parseNoteString, getNoteBase } from './lessonParser.js';
import { synth } from '../audio/pianoEngine.js';
import { backingSynth, loadBackingTrack } from '../audio/backingEngine.js';
import { updateSongHint, updateMainBtnText, updateTeacherUI } from '../ui/teacherBoardView.js';
import { clearHighlightedKeys } from '../ui/keyboardView.js';

export function prepLesson(songId) {
  state.currentSongId = songId;
  const songData = SONG_LIBRARY[songId];
  if (!songData) return;

  let autoBeat = 0;
  state.lessonLines = songData.notes.map(line => {
    const rawNotes = parseNoteString(line.notes);
    rawNotes.forEach(n => {
      if (n.beat === null || isNaN(n.beat)) {
        n.beat = autoBeat; n.duration = 1; autoBeat += 1;
      } else {
        autoBeat = n.beat + n.duration;
      }
    });
    return { lyric: line.lyrics, notes: rawNotes, totalNotes: rawNotes.length };
  });

  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  backingSynth.releaseAll();
  state.isLessonActive = false;
  state.isAutoplayActive = false;
  state.repeatListening = false;
  state.currentLineIndex = -1;
  state.currentNoteInLine = 0;
  state.repeatLineIndex = 0;

  const hasAutoplay = state.lessonLines.some(l => l.notes.some(n => n.beat !== null));

  const mainBtn = document.getElementById('main-action-btn');
  const modeToggles = document.querySelectorAll('.mode-toggle');

  if (mainBtn) {
    mainBtn.style.display = 'block';
    if (state.currentMode === "autoplay" && !hasAutoplay) {
      state.currentMode = "step";
      modeToggles.forEach(t => t.classList.remove('active'));
      const stepTarget = document.querySelector('.mode-toggle[data-mode="step"]');
      if (stepTarget) stepTarget.classList.add('active');
    }
    updateMainBtnText();
    const apToggle = Array.from(modeToggles).find(t => t.dataset.mode === "autoplay");
    if (apToggle) {
      apToggle.style.opacity = hasAutoplay ? '1' : '0.3';
      apToggle.style.pointerEvents = hasAutoplay ? 'auto' : 'none';
    }
  }

  updateSongHint(songId);

  const noHintRow = document.getElementById('no-hint-row');
  if (noHintRow) noHintRow.style.display = state.currentMode === 'repeat' ? 'flex' : 'none';

  const schemaContainer = document.getElementById('schema-container');
  if (schemaContainer) schemaContainer.innerHTML = `<p class="placeholder-text">Select a mode and dive in.</p>`;
  clearHighlightedKeys();
  loadBackingTrack(songId);
}

export function playAutoplayDemo() {
  if (Tone.context.state !== 'running') Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);

  const bpm = getSongBpm(state.currentSongId);
  Tone.Transport.bpm.value = bpm;
  const beatSec = 60 / bpm;

  state.isLessonActive = false;
  state.isAutoplayActive = true;

  const schemaEl = document.getElementById('schema-container');

  let firstMelodyBeat = Infinity;
  state.lessonLines.forEach(line => {
    line.notes.forEach(n => {
      if (n.beat !== null && n.beat < firstMelodyBeat) firstMelodyBeat = n.beat;
    });
  });

  const hasIntro = firstMelodyBeat !== Infinity && firstMelodyBeat > 2;
  if (hasIntro && schemaEl) {
    const introSec = firstMelodyBeat * beatSec;
    schemaEl.innerHTML = `
      <div class="intro-indicator">
        <div class="intro-pulse-dot"></div>
        <em>( ♪ backtrack started... piano enters soon )</em>
        <span style="font-size:0.8rem; opacity:0.6; margin-top:0.5rem">Starting in ${Math.round(introSec)}s</span>
      </div>`;
  } else if (schemaEl) {
    schemaEl.innerHTML = '';
  }

  let maxBeat = 0;
  let firstNoteScheduled = false;

  state.lessonLines.forEach((line, lineIdx) => {
    line.notes.forEach((noteObj, noteIdx) => {
      if (noteObj.beat !== null && noteObj.duration !== null) {
        if (noteObj.beat + noteObj.duration > maxBeat) maxBeat = noteObj.beat + noteObj.duration;

        const timeInSeconds = noteObj.beat * beatSec;
        const durInSeconds = noteObj.duration * beatSec;

        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(noteObj.note, durInSeconds, time);

          Tone.Draw.schedule(() => {
            if (!firstNoteScheduled) {
              firstNoteScheduled = true;
              const introEl = schemaEl?.querySelector('.intro-indicator');
              if (introEl) introEl.remove();
            }

            state.currentLineIndex = lineIdx;
            state.currentNoteInLine = noteIdx;
            updateTeacherUI(true);

            const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
            if (keyDef) {
              const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
              if (domKey) {
                domKey.classList.add('active');
                Tone.Draw.schedule(() => {
                  domKey.classList.remove('active');
                }, time + durInSeconds);
              }
            }
          }, time);
        }, timeInSeconds);
      }
    });
  });

  const playBacking = document.getElementById('backing-toggle')?.checked ?? true;
  if (playBacking) {
    const melodyNotes = [];
    state.lessonLines.forEach(l => l.notes.forEach(n => {
      if (n.beat !== null) melodyNotes.push({ beat: n.beat, note: n.note });
    }));

    state.backingChordsData.forEach(chord => {
      const isMelody = melodyNotes.some(m => 
        getNoteBase(m.note) === getNoteBase(chord.note) && 
        Math.abs(m.beat - chord.beat) < 0.15
      );
      
      if (!isMelody) {
        const timeInSeconds = chord.beat * beatSec;
        const durInSeconds = chord.duration * beatSec;
        Tone.Transport.schedule((time) => {
          backingSynth.triggerAttackRelease(chord.note, durInSeconds, time);
        }, timeInSeconds);
      }
    });
  }

  if (maxBeat > 0) {
    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        backingSynth.releaseAll();
        state.isAutoplayActive = false;
        if (schemaEl) {
          schemaEl.innerHTML = `<p class="schema-lyrics" style="text-shadow:0 0 20px var(--accent-pink)">Autoplay Complete! ✨</p>`;
        }
        const mainBtn = document.getElementById('main-action-btn');
        if (mainBtn) { mainBtn.textContent = "Restart Autoplay"; mainBtn.style.display = 'block'; }
        clearHighlightedKeys();
      }, time);
    }, (maxBeat * beatSec) + 1);
  }

  Tone.Transport.start("+0.1");
}

export function playRepeatPhrase(lineIdx) {
  if (lineIdx >= state.lessonLines.length) {
    const schemaEl = document.getElementById('schema-container');
    if (schemaEl) {
      schemaEl.innerHTML = `
        <div class="repeat-complete">
          <div class="repeat-complete-icon">🎉</div>
          <p>Song complete! Amazing!</p>
          <button class="glow-btn" onclick="restartRepeat()">Play Again</button>
        </div>`;
    }
    const mainBtn = document.getElementById('main-action-btn');
    if (mainBtn) mainBtn.style.display = 'none';
    return;
  }

  if (Tone.context.state !== 'running') Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  backingSynth.releaseAll();

  state.repeatListening = false;
  state.repeatNoteIndex = 0;
  state.repeatExpectedNotes = state.lessonLines[lineIdx].notes;

  const bpm = getSongBpm(state.currentSongId);
  Tone.Transport.bpm.value = bpm;
  const beatSec = 60 / bpm;

  const schemaEl = document.getElementById('schema-container');
  const line = state.lessonLines[lineIdx];

  let listenKeysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const kd = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = kd ? (kd.display || kd.key.toUpperCase()) : '–';
    listenKeysHtml += `<span class="karaoke-unplayed" data-listen-idx="${idx}">${disp}</span> `;
  });

  if (schemaEl) {
    schemaEl.innerHTML = `
      <div class="repeat-listen-banner">
        <div class="repeat-listen-icon">👂</div>
        <div class="repeat-listen-text">
          <strong>Listen...</strong>
          <span>${line.lyric}</span>
        </div>
        <div class="repeat-progress">Line ${lineIdx + 1} of ${state.lessonLines.length}</div>
      </div>
      <div class="schema-keys-text repeat-listen-keys" id="repeat-listen-keys">${listenKeysHtml}</div>`;
  }

  clearHighlightedKeys();

  let lineStart = Infinity, lineEnd = 0;
  line.notes.forEach(n => {
    if (n.beat !== null) {
      if (n.beat < lineStart) lineStart = n.beat;
      const end = n.beat + (n.duration || 1);
      if (end > lineEnd) lineEnd = end;
    }
  });
  if (lineStart === Infinity) lineStart = 0;

  const offset = lineStart;

  line.notes.forEach((noteObj, noteIdx) => {
    if (noteObj.beat !== null && noteObj.duration !== null) {
      const timeInSeconds = (noteObj.beat - offset) * beatSec;
      const durInSeconds = noteObj.duration * beatSec;
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(noteObj.note, durInSeconds, time);
        Tone.Draw.schedule(() => {
          const listenRow = document.getElementById('repeat-listen-keys');
          if (listenRow) {
            const spans = listenRow.querySelectorAll('span');
            spans.forEach((sp, i) => {
              if (i < noteIdx)       sp.className = 'karaoke-played';
              else if (i === noteIdx) sp.className = 'karaoke-active';
              else                   sp.className = 'karaoke-unplayed';
            });
          }
          const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
          if (keyDef) {
            const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
            if (domKey) {
              domKey.classList.add('active');
              Tone.Draw.schedule(() => domKey.classList.remove('active'), time + durInSeconds);
            }
          }
        }, time);
      }, timeInSeconds);
    }
  });

  const playBacking = document.getElementById('backing-toggle')?.checked ?? true;
  if (playBacking) {
    state.backingChordsData
      .filter(c => c.beat >= lineStart - 0.5 && c.beat <= lineEnd + 0.5)
      .forEach(chord => {
        const timeInSeconds = (chord.beat - lineStart) * beatSec;
        const durInSeconds = chord.duration * beatSec;
        if (timeInSeconds >= 0) {
          Tone.Transport.schedule((time) => {
            backingSynth.triggerAttackRelease(chord.note, durInSeconds, time);
          }, timeInSeconds);
        }
      });
  }

  const phraseDurSec = (lineEnd - lineStart) * beatSec;
  Tone.Transport.scheduleOnce((time) => {
    Tone.Draw.schedule(() => {
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
      backingSynth.releaseAll();
      clearHighlightedKeys();
      state.repeatListening = true;
      showRepeatYourTurn(lineIdx);
    }, time);
  }, phraseDurSec + 0.5);

  Tone.Transport.start("+0.1");
}

export function showRepeatYourTurn(lineIdx) {
  const schemaEl = document.getElementById('schema-container');
  const line = state.lessonLines[lineIdx];
  const noHint = document.getElementById('no-hint-check')?.checked ?? false;

  let keysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = noHint ? '?' : (keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '?');
    const cls = idx === 0 ? 'karaoke-active' : 'karaoke-unplayed';
    keysHtml += `<span class="${cls}" data-idx="${idx}">${disp}</span> `;
  });

  if (schemaEl) {
    schemaEl.innerHTML = `
      <div class="repeat-your-turn-banner">
        <div class="repeat-mic-icon">🎤</div>
        <strong>Your turn!</strong>
        <span class="repeat-sub">${line.lyric}</span>
      </div>
      <div class="schema-keys-text repeat-keys" id="repeat-keys-row">${keysHtml}</div>
      <div class="repeat-note-feedback" id="repeat-feedback"></div>`;
  }

  const firstNote = line.notes[0];
  if (firstNote) {
    const keyDef = PIANO_KEYS.find(k => k.note === firstNote.note);
    if (keyDef) {
      const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
      if (domKey) domKey.classList.add('teacher-highlight');
    }
  }
}

// Attach repeat global handlers to window
window.restartRepeat = function() {
  state.repeatLineIndex = 0;
  playRepeatPhrase(0);
};

window.retryRepeat = function() {
  playRepeatPhrase(state.repeatLineIndex);
};

window.nextRepeatLine = function() {
  state.repeatLineIndex++;
  playRepeatPhrase(state.repeatLineIndex);
};
