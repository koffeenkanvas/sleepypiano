import * as Tone from 'tone';
import { MODE_DESC, PIANO_KEYS, getSongBpm } from '../data/songConfig.js';
import { state, keyElementsMap } from '../lesson/lessonState.js';
import { prepLesson, playAutoplayDemo, playRepeatPhrase } from '../lesson/lessonModes.js';
import { backingSynth } from '../audio/backingEngine.js';
import { synth } from '../audio/pianoEngine.js';
import { clearHighlightedKeys } from './keyboardView.js';
import { openFreePlay, closeFreePlay } from './freePlayView.js';
import { SONG_LIBRARY } from '../data/songs.js';

export function updateSongHint(songId) {
  const hintEl = document.getElementById('song-hint');
  if (hintEl) {
    hintEl.textContent = '';
    hintEl.style.display = 'none';
  }
}

export function updateMainBtnText() {
  const mainBtn = document.getElementById('main-action-btn');
  if (!mainBtn) return;
  const labels = {
    step: 'Start Step Mode',
    follow: 'Start Follow Mode',
    autoplay: 'Start Autoplay',
    repeat: '🎯 Start Repeat After Me'
  };
  mainBtn.textContent = labels[state.currentMode] || 'Start';
}

export function initTeacher() {
  const mainBtn = document.getElementById('main-action-btn');
  const songSelector = document.getElementById('song-selector');
  const modeToggles = document.querySelectorAll('.mode-toggle');
  const frePlayBtn = document.getElementById('free-play-fab');

  modeToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      modeToggles.forEach(t => t.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      state.currentMode = target.dataset.mode;
      
      const descEl = document.getElementById('mode-description');
      if (descEl) descEl.textContent = MODE_DESC[state.currentMode] || "";

      const noHintRow = document.getElementById('no-hint-row');
      if (noHintRow) noHintRow.style.display = state.currentMode === 'repeat' ? 'flex' : 'none';
      updateSongHint(target.value);
      prepLesson(songSelector.value);
    });
  });

  mainBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    await Tone.context.resume();

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      const osc = new Tone.Oscillator().toDestination();
      osc.start().stop("+0.1");
    }

    if (!synth.loaded) {
      alert("Piano sounds still loading... try again in a few seconds.");
      return;
    }

    Tone.Transport.stop();
    Tone.Transport.cancel(0);
    backingSynth.releaseAll();
    mainBtn.style.display = 'none';

    if (state.currentMode === "step" || state.currentMode === "follow") {
      state.isLessonActive = true;
      state.isAutoplayActive = false;
      state.currentLineIndex = 0;
      state.currentNoteInLine = 0;
      updateTeacherUI();
    } else if (state.currentMode === "autoplay") {
      playAutoplayDemo();
    } else if (state.currentMode === "repeat") {
      state.repeatLineIndex = 0;
      playRepeatPhrase(0);
    }
  });

  songSelector.addEventListener('change', (e) => {
    prepLesson(e.target.value);
  });

  if (frePlayBtn) {
    frePlayBtn.addEventListener('click', openFreePlay);
  }
  document.getElementById('close-free-play')?.addEventListener('click', closeFreePlay);
}

window.resumeLesson = function() {
  document.querySelector('.pause-alert')?.remove();
  if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
  updateTeacherUI();
};

export function updateTeacherUI(isAutoplay = false) {
  if (!state.isLessonActive && !isAutoplay) return;

  const schemaEl = document.getElementById('schema-container');
  const mainBtn = document.getElementById('main-action-btn');

  if (state.currentLineIndex >= state.lessonLines.length) {
    schemaEl.innerHTML = `<p class="schema-lyrics" style="text-shadow:0 0 20px var(--accent-pink)">🎉 Lesson Complete! Great job!</p>`;
    if (mainBtn) { mainBtn.textContent = "Restart"; mainBtn.style.display = 'block'; }
    state.isLessonActive = false;
    clearHighlightedKeys();
    return;
  }

  const currentLine = state.lessonLines[state.currentLineIndex];
  const expectedNoteData = currentLine.notes[state.currentNoteInLine];
  if (!expectedNoteData) return;

  const bpm = getSongBpm(state.currentSongId);
  const beatSec = 60 / bpm;

  // Build key row HTML
  let keyHtml = "";
  currentLine.notes.forEach((noteData, index) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteData.note);
    const displayChar = keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '–';

    let dashes = " ";
    if (index < currentLine.notes.length - 1) {
      const nextNote = currentLine.notes[index + 1];
      if (noteData.beat !== null && nextNote.beat !== null) {
        const gap = nextNote.beat - noteData.beat;
        if (gap >= 1.5) dashes = " – ";
        if (gap >= 2.5) dashes = " – – ";
        if (gap >= 3.5) dashes = " – – – ";
      }
    }

    if (isAutoplay) {
      if (index < state.currentNoteInLine)       keyHtml += `<span class="karaoke-played">${displayChar} </span>`;
      else if (index === state.currentNoteInLine) keyHtml += `<span class="karaoke-played" style="color:var(--accent-pink);text-shadow:0 0 15px var(--accent-pink)">${displayChar} </span>`;
      else                                  keyHtml += `<span class="karaoke-unplayed">${displayChar} </span>`;
    } else {
      if (index < state.currentNoteInLine - 1) {
        keyHtml += `<span class="karaoke-played">${displayChar}</span><span class="karaoke-played">${dashes}</span>`;
      } else if (index === state.currentNoteInLine - 1) {
        const holdMs = Math.max((noteData.duration || 1) * beatSec * 1000, 300);
        keyHtml += `<span class="karaoke-holding" data-text="${displayChar}" style="--hold-time:${holdMs}ms">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
      } else if (index === state.currentNoteInLine) {
        // Pause alert if user takes too long
        if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
        let gapMs = 6000;
        if (noteData.beat !== null) {
          const prevBeat = index > 0 ? currentLine.notes[index - 1].beat : 0;
          if (prevBeat !== null) gapMs = Math.max((noteData.beat - prevBeat) * beatSec * 1000, 100) + 4000;
        }
        window.pauseTimeout = setTimeout(() => {
          if (state.isLessonActive && !state.isAutoplayActive) {
            const schemaBox = document.getElementById('schema-container');
            if (schemaBox && !schemaBox.querySelector('.pause-alert')) {
              schemaBox.innerHTML += `<div class="pause-alert" onclick="resumeLesson()">PAUSED<span>(fell behind — click to resume)</span></div>`;
            }
            if (Tone.Transport.state === 'started') Tone.Transport.pause();
            backingSynth.releaseAll();
          }
        }, gapMs);
        keyHtml += `<span class="karaoke-active">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
      } else {
        keyHtml += `<span class="karaoke-unplayed">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
      }
    }
  });

  // Lyrics karaoke
  const words = currentLine.lyric.split(" ");
  let playedText = "", unplayedText = "";
  if (words.length === currentLine.totalNotes) {
    const glowIndex = isAutoplay ? state.currentNoteInLine + 1 : state.currentNoteInLine;
    playedText = words.slice(0, glowIndex).join(" ") + (glowIndex > 0 ? " " : "");
    unplayedText = words.slice(glowIndex).join(" ");
  } else {
    const glowIndex = isAutoplay ? state.currentNoteInLine + 1 : state.currentNoteInLine;
    const ratio = glowIndex / currentLine.totalNotes;
    let splitIndex = Math.floor(currentLine.lyric.length * ratio);
    if (splitIndex > 0 && splitIndex < currentLine.lyric.length) {
      let spaceIdx = currentLine.lyric.indexOf(" ", splitIndex);
      if (spaceIdx === -1) spaceIdx = currentLine.lyric.length;
      splitIndex = spaceIdx;
    }
    playedText = currentLine.lyric.substring(0, splitIndex);
    unplayedText = currentLine.lyric.substring(splitIndex);
  }

  schemaEl.innerHTML = `
    <div class="schema-keys-text">${keyHtml}</div>
    <div class="schema-lyrics"><span class="karaoke-played">${playedText}</span><span class="karaoke-unplayed">${unplayedText}</span></div>
  `;

  // Highlight target key
  if (!isAutoplay) {
    const nextKeyDef = PIANO_KEYS.find(k => k.note === expectedNoteData.note);
    clearHighlightedKeys();
    if (nextKeyDef) {
      const domKey = keyElementsMap.get(nextKeyDef.key.toLowerCase());
      if (domKey) domKey.classList.add('teacher-highlight');
    }
  }
}

export function updateRepeatKeysDisplay() {
  const keysRow = document.getElementById('repeat-keys-row');
  if (!keysRow) return;
  const noHint = document.getElementById('no-hint-check')?.checked ?? false;
  const line = state.lessonLines[state.repeatLineIndex];

  let keysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = noHint ? '?' : (keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '?');

    let cls = 'karaoke-unplayed';
    if (idx < state.repeatNoteIndex)      cls = 'karaoke-played';
    else if (idx === state.repeatNoteIndex) cls = 'karaoke-active';
    keysHtml += `<span class="${cls}">${disp}</span> `;
  });
  keysRow.innerHTML = keysHtml;
}
