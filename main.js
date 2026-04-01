import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// Smart Device Detection
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// ─── CENTRALIZED SONG CONFIG ─────────────────────────────────────────────────
const SONG_CONFIG = {
  hey_jude:          { midi: 'hey-jude.mid?v=2.2',    track: 4, offset: 3, bpm: 90  },
  lovely:            { midi: 'lovely-full.mid?v=2.2', track: 0, offset: 0, bpm: 150, melodyTrack: 1 },
  bohemian_rhapsody: { bpm: 120 }
};

function getSongBpm(songId) {
  return (SONG_CONFIG[songId] && SONG_CONFIG[songId].bpm) || 90;
}

// ─── AUDIO ENGINE ─────────────────────────────────────────────────────────────
const synth = new Tone.Sampler({
  urls: {
    "A0":"A0.mp3","C1":"C1.mp3","D#1":"Ds1.mp3","F#1":"Fs1.mp3",
    "A1":"A1.mp3","C2":"C2.mp3","D#2":"Ds2.mp3","F#2":"Fs2.mp3",
    "A2":"A2.mp3","C3":"C3.mp3","D#3":"Ds3.mp3","F#3":"Fs3.mp3",
    "A3":"A3.mp3","C4":"C4.mp3","D#4":"Ds4.mp3","F#4":"Fs4.mp3",
    "A4":"A4.mp3","C5":"C5.mp3","D#5":"Ds5.mp3","F#5":"Fs5.mp3",
    "A5":"A5.mp3","C6":"C6.mp3","D#6":"Ds6.mp3","F#6":"Fs6.mp3",
    "A6":"A6.mp3","C7":"C7.mp3","D#7":"Ds7.mp3","F#7":"Fs7.mp3",
    "A7":"A7.mp3","C8":"C8.mp3"
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/",
  onerror: (err) => {
    console.error("Sampler Error:", err);
    alert("Piano sounds failed to load. Check your connection!");
  },
}).toDestination();

const reverb = new Tone.Reverb(2.5).toDestination();
const feltFilter = new Tone.Filter(isMobile ? 1500 : 700, "lowpass").toDestination();
synth.chain(feltFilter, reverb);

const backingSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 0.8 }
}).connect(reverb).toDestination();
backingSynth.volume.value = -12;

const tickSynth = new Tone.MembraneSynth().toDestination();
tickSynth.volume.value = -25;

// ─── PIANO KEYS ───────────────────────────────────────────────────────────────
const PIANO_KEYS = [
  { note: 'C3',  type: 'white', key: '1' },
  { note: 'C#3', type: 'black', key: '2' },
  { note: 'D3',  type: 'white', key: '3' },
  { note: 'D#3', type: 'black', key: '4' },
  { note: 'E3',  type: 'white', key: 'z' },
  { note: 'F3',  type: 'white', key: 'x' },
  { note: 'F#3', type: 'black', key: 'c' },
  { note: 'G3',  type: 'white', key: 'v' },
  { note: 'G#3', type: 'black', key: 'b' },
  { note: 'A3',  type: 'white', key: 'n' },
  { note: 'A#3', type: 'black', key: ',' },
  { note: 'B3',  type: 'white', key: 'm' },
  { note: 'C4',  type: 'white', key: 'a' },
  { note: 'C#4', type: 'black', key: 'w' },
  { note: 'D4',  type: 'white', key: 's' },
  { note: 'D#4', type: 'black', key: 'e' },
  { note: 'E4',  type: 'white', key: 'd' },
  { note: 'F4',  type: 'white', key: 'f' },
  { note: 'F#4', type: 'black', key: 't' },
  { note: 'G4',  type: 'white', key: 'g' },
  { note: 'G#4', type: 'black', key: 'y' },
  { note: 'A4',  type: 'white', key: 'h' },
  { note: 'A#4', type: 'black', key: 'u' },
  { note: 'B4',  type: 'white', key: 'j' },
  { note: 'C5',  type: 'white', key: 'k' },
  { note: 'C#5', type: 'black', key: 'i' },
  { note: 'D5',  type: 'white', key: 'l' },
  { note: 'D#5', type: 'black', key: 'o' },
  { note: 'E5',  type: 'white', key: ';' },
  { note: 'F5',  type: 'white', key: "'", display: "'" },
  { note: 'F#5', type: 'black', key: '[' },
  { note: 'G5',  type: 'white', key: 'enter', display: 'ENT' },
  { note: 'G#5', type: 'black', key: ']' },
  { note: 'A5',  type: 'white', key: '\\' },
  { note: 'A#5', type: 'black', key: '7' },
  { note: 'B5',  type: 'white', key: '8' }
];

// ─── SONG LIBRARY ─────────────────────────────────────────────────────────────
const SONG_LIBRARY = {
  "bohemian_rhapsody": {
    title: "Bohemian Rhapsody",
    notes: [
      {"lyrics": "Is this the real life?", "notes": "^F ^F ^F ^F ^F"},
      {"lyrics": "Is this just fantasy?", "notes": "^E ^E ^F ^E ^D ^C"},
      {"lyrics": "Caught in a landslide", "notes": "^F ^F ^F ^G ^F"},
      {"lyrics": "No escape from reality...", "notes": "F F ^D ^D ^D# ^D ^C Bb"},
      {"lyrics": "Open your eyes", "notes": "D D D# D"},
      {"lyrics": "Look up to the skies and see...", "notes": "D D D D# F .Bb G"},
      {"lyrics": "I'm just a poor boy", "notes": "G G G G G"},
      {"lyrics": "I need no sympathy", "notes": "F F G F D# C"},
      {"lyrics": "Because I'm easy come, easy go", "notes": "G A Bb B B Bb A A Bb"},
      {"lyrics": "Little high, little low...", "notes": "B B Bb A A Bb"},
      {"lyrics": "Anyway the wind blows,", "notes": "G G G G F Bb"},
      {"lyrics": "Doesn't really matter to me,", "notes": "E E E E F .F .A D#"},
      {"lyrics": "To me...", "notes": ".A .Bb .Bb"}
    ]
  },
  "hey_jude": {
    title: "Hey Jude",
    notes: [
      {"lyrics": "Hey Jude, don't make it bad", "notes": "^C@0,1 A@1,1 A@2,1 ^C@3,1 ^D@4,1 G@5,2"},
      {"lyrics": "Take a sad song and make it better", "notes": "G@7,1 A@8,1 Bb@9,1 ^F@10,0.5 ^F@10.5,0.5 ^E@11,0.5 ^C@11.5,0.5 ^D@12,0.5 C@12.5,0.5 Bb@13,0.5 A@13.5,1.5"},
      {"lyrics": "Remember to let her into your heart", "notes": "^C@15,0.5 ^D@15.5,0.5 ^D@16,1 ^D@17,1 ^G@18,1 ^F@19,1 ^E@20,0.5 ^F@20.5,0.5 ^D@21,1 ^C@22,2"},
      {"lyrics": "Then you can start to make it better", "notes": "F@24,1 G@25,1 A@26,1 ^D@27,0.5 ^C@27.5,0.5 ^C@28,1 Bb@29,1 A@30,1 E@31,0.5 F@31.5,1.5"},
      {"lyrics": "Hey Jude, don't be afraid", "notes": "^C A A ^C ^D G"},
      {"lyrics": "You were made to go out and get her", "notes": "G A Bb ^F ^F ^E ^C ^D C Bb A"},
      {"lyrics": "The minute you let her under your skin", "notes": "^C ^D ^D ^D ^G ^F ^E ^F ^D ^C"},
      {"lyrics": "Then you begin to make it better...", "notes": "F G A ^D ^C ^C Bb A E F"},
      {"lyrics": "And anytime you feel the pain,", "notes": "F ^F ^D ^D ^C ^C Bb ^D"},
      {"lyrics": "Hey Jude, refrain", "notes": "^F ^D ^F Bb"},
      {"lyrics": "Don't carry the world upon your shoulders....", "notes": "^F ^D ^C Bb ^C ^D ^C Bb A G F"},
      {"lyrics": "For well you know that it's a fool", "notes": "F ^F ^D ^D ^C ^C Bb ^D"},
      {"lyrics": "Who plays it cool", "notes": "^F ^D ^F Bb"},
      {"lyrics": "By making his world a little colder....", "notes": "^F ^D ^C Bb ^C ^D ^C Bb A G F"},
      {"lyrics": "Nah... nah nah", "notes": "F A ^C"},
      {"lyrics": "Nah -nah nah-nah", "notes": "^G ^F ^G ^F"},
      {"lyrics": "Nah -nah nah-nah,", "notes": "^G ^F ^G ^F"},
      {"lyrics": "Hey Jude!", "notes": "^D ^C"}
    ]
  },
  "lovely": {
    title: "Lovely",
    notes: [
      {"lyrics": "Thought I found a way",
       "notes": ".E@15.998,1.98 .F#@17.998,1.93 .G@20,1.96 .A@22,1.09 .B@23.002,0.96"},
      {"lyrics": "Thought I found a way, yeah",
       "notes": "D@24,0.61 E@24.502,1.06 D@25.5,0.34 D@26,1.45 .B@27.5,0.28 .B@27.998,1.14"},
      {"lyrics": "But you never go away",
       "notes": ".A@28.998,0.54 .B@29.502,0.61 .A@29.998,0.53 .G@30.5,0.24 .G@31.002,0.57 .E@31.5,0.2 .E@31.998,1.98"},
      {"lyrics": "So I guess I gotta stay now",
       "notes": ".F#@34,1.96 .G@36,2.05 .A@37.998,1 .B@39,1.16 D@40,0.52 E@40.5,1.06 D@41.5,0.29 D@42.002,0.97"},
      {"lyrics": "Oh, I hope someday",
       "notes": ".B@43,0.27 .B@43.502,1.57 .A@45,0.52 .B@45.5,0.66 .A@45.998,0.6 .G@46.498,0.36"},
      {"lyrics": "I'll make it out of here",
       "notes": ".G@47,0.61 .E@47.498,0.25 .E@47.998,1.97 .F#@50,2 .G@52,2.07 .A@54,1.02"},
      {"lyrics": "Even if it takes all night",
       "notes": ".B@55,1.09 D@55.998,0.55 E@56.5,1.06 D@57.498,0.35 D@58,1.57 .B@59.5,0.31 .B@59.998,1.07"},
      {"lyrics": "Or a hundred years",
       "notes": ".A@61,1.18 B@64,1.52 A@65.502,0.33 G@65.75,0.37 F#@66.002,0.51"},
      {"lyrics": "Need a place to hide",
       "notes": "E@66.5,0.31 E@67,1.13 A@69.333,0.46 G@69.667,0.37 F#@70,0.97"},
      {"lyrics": "But I can't find one near",
       "notes": "B@72,1.55 A@73.5,0.29 G@73.752,0.28 F#@74,0.55 E@74.5,0.27 E@74.998,1.01 F#@76,0.45"},
      {"lyrics": "Wanna feel alive",
       "notes": "E@76.5,0.28 E@77.002,0.99 G@77.998,1.14 B@80,1.5 A@81.5,0.33"},
      {"lyrics": "Outside I can fight my fear",
       "notes": "G@81.75,0.34 F#@82,0.54 E@82.502,0.29 E@83,1.09 A@85.333,0.48 G@85.667,0.48 F#@85.998,0.9 F#@89,0.51 G@89.498,0.62"}
    ]
  }
};

function getNoteBase(note) {
  if (!note) return "";
  // Strip octaves (E3 -> E), prefixes (.G -> G), and carets (^F -> F)
  const match = note.replace(/[\.\^0-9]/g, '').match(/^[A-G]#?/);
  return match ? match[0] : note;
}

// ─── NOTE PARSER (with explicit-octave fix: E3, G3 etc.) ──────────────────────
function parseNoteString(noteStr) {
  const rawNotes = noteStr.split(/[\s-]+/).filter(n => n.trim() !== '');
  return rawNotes.map(n => {
    let name = n;
    let b = null;
    let d = null;

    if (name.includes('@')) {
      const parts = name.split('@');
      name = parts[0];
      const timingParts = parts[1].split(',');
      b = parseFloat(timingParts[0]);
      d = parseFloat(timingParts[1]);
    }

    let octave = 4;
    if (name.startsWith('^'))      { octave = 5; name = name.substring(1); }
    else if (name.startsWith('.')) { octave = 3; name = name.substring(1); }

    // Handle explicit octave suffix like "E3", "G3", "F#4", "B3"
    const lastChar = name[name.length - 1];
    if (!isNaN(parseInt(lastChar, 10))) {
      octave = parseInt(lastChar, 10);
      name = name.slice(0, -1);
    }

    if (name === 'Bb') name = 'A#';
    return { note: `${name}${octave}`, beat: b, duration: d };
  });
}

const MODE_DESC = {
  step: "Press each note at your own pace. The song waits for you.",
  follow: "Play along with the backing track. The song keeps moving.",
  autoplay: "Sit back and watch the song play itself.",
  repeat: "Listen to a phrase, then try to play it back from memory."
};

// ─── TEACHER STATE ────────────────────────────────────────────────────────────
let activeHoldNote = null;
let lessonLines = [];
let currentLineIndex = -1;
let currentNoteInLine = 0;
let isLessonActive = false;
let isAutoplayActive = false;
let currentMode = "step";
let backingChordsData = [];
let currentSongId = 'hey_jude';

const pressedKeys = new Set();
const keyElementsMap = new Map();

// ─── REPEAT-AFTER-ME STATE ────────────────────────────────────────────────────
let repeatLineIndex = 0;
let repeatExpectedNotes = [];
let repeatNoteIndex = 0;
let repeatListening = false;

// ─── FREE PLAY STATE ──────────────────────────────────────────────────────────
let isFreePlaying = false;
let fpNoteHistory = [];

// ─── BACKING TRACK LOADER (uses SONG_CONFIG) ──────────────────────────────────
async function loadBackingTrack(songId) {
  backingChordsData = [];
  const cfg = SONG_CONFIG[songId];
  if (!cfg || !cfg.midi) return;

  try {
    const resp = await fetch(cfg.midi);
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
    const ab = await resp.arrayBuffer();
    const midi = new Midi(ab);
    const track = midi.tracks[cfg.track || 0];
    if (track) {
      track.notes.forEach(n => {
        const rawBeat = n.ticks / midi.header.ppq;
        const shiftedBeat = rawBeat - (cfg.offset || 0);
        if (shiftedBeat >= 0) {
          backingChordsData.push({
            note: n.name,
            beat: shiftedBeat,
            duration: n.durationTicks / midi.header.ppq
          });
        }
      });
    }
  } catch (err) {
    console.error("Backing track error:", err);
    const hintEl = document.getElementById('song-hint');
    if (hintEl) hintEl.textContent = '⚠ backing track unavailable';
  }
}

// ─── KEYBOARD INIT ────────────────────────────────────────────────────────────
function initKeyboard() {
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

// ─── LESSON PREP ──────────────────────────────────────────────────────────────
function prepLesson(songId) {
  currentSongId = songId;
  const songData = SONG_LIBRARY[songId];
  if (!songData) return;

  let autoBeat = 0;
  lessonLines = songData.notes.map(line => {
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
  isLessonActive = false;
  isAutoplayActive = false;
  repeatListening = false;
  currentLineIndex = -1;
  currentNoteInLine = 0;
  repeatLineIndex = 0;

  const hasAutoplay = lessonLines.some(l => l.notes.some(n => n.beat !== null));

  const mainBtn = document.getElementById('main-action-btn');
  const modeToggles = document.querySelectorAll('.mode-toggle');

  if (mainBtn) {
    mainBtn.style.display = 'block';
    if (currentMode === "autoplay" && !hasAutoplay) {
      currentMode = "step";
      modeToggles.forEach(t => t.classList.remove('active'));
      document.querySelector('.mode-toggle[data-mode="step"]').classList.add('active');
    }
    updateMainBtnText();
    const apToggle = Array.from(modeToggles).find(t => t.dataset.mode === "autoplay");
    if (apToggle) {
      apToggle.style.opacity = hasAutoplay ? '1' : '0.3';
      apToggle.style.pointerEvents = hasAutoplay ? 'auto' : 'none';
    }
  }

  // Song hint
  updateSongHint(songId);

  // Show/hide no-hint checkbox
  const noHintRow = document.getElementById('no-hint-row');
  if (noHintRow) noHintRow.style.display = currentMode === 'repeat' ? 'flex' : 'none';

  document.getElementById('schema-container').innerHTML = `<p class="placeholder-text">Select a mode and dive in.</p>`;
  clearHighlightedKeys();
  loadBackingTrack(songId);
}

function updateSongHint(songId) {
  const hintEl = document.getElementById('song-hint');
  if (hintEl) {
    hintEl.textContent = '';
    hintEl.style.display = 'none';
  }
}

function updateMainBtnText() {
  const mainBtn = document.getElementById('main-action-btn');
  if (!mainBtn) return;
  const labels = {
    step: 'Start Step Mode',
    follow: 'Start Follow Mode',
    autoplay: 'Start Autoplay',
    repeat: '🎯 Start Repeat After Me'
  };
  mainBtn.textContent = labels[currentMode] || 'Start';
}

// ─── TEACHER INIT ─────────────────────────────────────────────────────────────
function initTeacher() {
  const mainBtn = document.getElementById('main-action-btn');
  const songSelector = document.getElementById('song-selector');
  const modeToggles = document.querySelectorAll('.mode-toggle');
  const frePlayBtn = document.getElementById('free-play-fab');

  modeToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      modeToggles.forEach(t => t.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentMode = target.dataset.mode;
      
      const descEl = document.getElementById('mode-description');
      if (descEl) descEl.textContent = MODE_DESC[currentMode] || "";

      const noHintRow = document.getElementById('no-hint-row');
      if (noHintRow) noHintRow.style.display = currentMode === 'repeat' ? 'flex' : 'none';
      updateSongHint(target.value);
      prepLesson(songSelector.value);
    });
  });

  mainBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();
    await Tone.context.resume();

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

    if (currentMode === "step" || currentMode === "follow") {
      isLessonActive = true;
      isAutoplayActive = false;
      currentLineIndex = 0;
      currentNoteInLine = 0;
      updateTeacherUI();
    } else if (currentMode === "autoplay") {
      playAutoplayDemo();
    } else if (currentMode === "repeat") {
      repeatLineIndex = 0;
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

// ─── AUTOPLAY ─────────────────────────────────────────────────────────────────
function playAutoplayDemo() {
  if (Tone.context.state !== 'running') Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);

  const bpm = getSongBpm(currentSongId);
  Tone.Transport.bpm.value = bpm;
  const beatSec = 60 / bpm;

  isLessonActive = false;
  isAutoplayActive = true;

  const schemaEl = document.getElementById('schema-container');

  // Find first melody beat to detect intro gap
  let firstMelodyBeat = Infinity;
  lessonLines.forEach(line => {
    line.notes.forEach(n => {
      if (n.beat !== null && n.beat < firstMelodyBeat) firstMelodyBeat = n.beat;
    });
  });

  const hasIntro = firstMelodyBeat !== Infinity && firstMelodyBeat > 2;
  if (hasIntro) {
    const introSec = firstMelodyBeat * beatSec;
    schemaEl.innerHTML = `
      <div class="intro-indicator">
        <div class="intro-pulse-dot"></div>
        <em>( ♪ backtrack started... piano enters soon )</em>
        <span style="font-size:0.8rem; opacity:0.6; margin-top:0.5rem">Starting in ${Math.round(introSec)}s</span>
      </div>`;
    // It will be replaced by lyrics/notes via updateTeacherUI on the first note
  } else {
    schemaEl.innerHTML = '';
  }

  let maxBeat = 0;
  let firstNoteScheduled = false;

  // Schedule Melody
  lessonLines.forEach((line, lineIdx) => {
    line.notes.forEach((noteObj, noteIdx) => {
      if (noteObj.beat !== null && noteObj.duration !== null) {
        if (noteObj.beat + noteObj.duration > maxBeat) maxBeat = noteObj.beat + noteObj.duration;

        const timeInSeconds = noteObj.beat * beatSec;
        const durInSeconds = noteObj.duration * beatSec;

        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(noteObj.note, durInSeconds, time);

          Tone.Draw.schedule(() => {
            // Clear intro text on very first note
            if (!firstNoteScheduled) {
              firstNoteScheduled = true;
              const introEl = schemaEl.querySelector('.intro-indicator');
              if (introEl) introEl.remove();
            }

            currentLineIndex = lineIdx;
            currentNoteInLine = noteIdx;
            updateTeacherUI(true);

            const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
            if (keyDef) {
              const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
              if (domKey) {
                domKey.classList.add('active');
                // Use Tone.Draw at future audio time instead of setTimeout
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

  // Schedule backing track
  const playBacking = document.getElementById('backing-toggle')?.checked ?? true;
  if (playBacking) {
    // Collect all melody notes for fuzzy filtering
    const melodyNotes = [];
    lessonLines.forEach(l => l.notes.forEach(n => {
      if (n.beat !== null) melodyNotes.push({ beat: n.beat, note: n.note });
    }));

    backingChordsData.forEach(chord => {
      // Fuzzy filter: mute MIDI notes within 0.15 beats of JSON melody to avoid double-piano
      // Use getNoteBase to normalize: ".E", "E3", "E" all match for suppression purposes
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

  // End of song
  if (maxBeat > 0) {
    Tone.Transport.scheduleOnce((time) => {
      Tone.Draw.schedule(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        backingSynth.releaseAll();
        isAutoplayActive = false;
        schemaEl.innerHTML = `<p class="schema-lyrics" style="text-shadow:0 0 20px var(--accent-pink)">Autoplay Complete! ✨</p>`;
        const mainBtn = document.getElementById('main-action-btn');
        if (mainBtn) { mainBtn.textContent = "Restart Autoplay"; mainBtn.style.display = 'block'; }
        clearHighlightedKeys();
      }, time);
    }, (maxBeat * beatSec) + 1);
  }

  Tone.Transport.start("+0.1");
}

// ─── REPEAT AFTER ME ──────────────────────────────────────────────────────────
function playRepeatPhrase(lineIdx) {
  if (lineIdx >= lessonLines.length) {
    // All lines done
    const schemaEl = document.getElementById('schema-container');
    schemaEl.innerHTML = `
      <div class="repeat-complete">
        <div class="repeat-complete-icon">🎉</div>
        <p>Song complete! Amazing!</p>
        <button class="glow-btn" onclick="restartRepeat()">Play Again</button>
      </div>`;
    const mainBtn = document.getElementById('main-action-btn');
    if (mainBtn) mainBtn.style.display = 'none';
    return;
  }

  if (Tone.context.state !== 'running') Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  backingSynth.releaseAll();

  repeatListening = false;
  repeatNoteIndex = 0;
  repeatExpectedNotes = lessonLines[lineIdx].notes;

  const bpm = getSongBpm(currentSongId);
  Tone.Transport.bpm.value = bpm;
  const beatSec = 60 / bpm;

  const schemaEl = document.getElementById('schema-container');
  const line = lessonLines[lineIdx];

  // Build listen-phase key row HTML (all unplayed at start)
  let listenKeysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const kd = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = kd ? (kd.display || kd.key.toUpperCase()) : '–';
    listenKeysHtml += `<span class="karaoke-unplayed" data-listen-idx="${idx}">${disp}</span> `;
  });

  schemaEl.innerHTML = `
    <div class="repeat-listen-banner">
      <div class="repeat-listen-icon">👂</div>
      <div class="repeat-listen-text">
        <strong>Listen...</strong>
        <span>${line.lyric}</span>
      </div>
      <div class="repeat-progress">Line ${lineIdx + 1} of ${lessonLines.length}</div>
    </div>
    <div class="schema-keys-text repeat-listen-keys" id="repeat-listen-keys">${listenKeysHtml}</div>`;

  clearHighlightedKeys();

  // Find time range for this line
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

  // Schedule melody notes relative to 0
  line.notes.forEach((noteObj, noteIdx) => {
    if (noteObj.beat !== null && noteObj.duration !== null) {
      const timeInSeconds = (noteObj.beat - offset) * beatSec;
      const durInSeconds = noteObj.duration * beatSec;
      Tone.Transport.schedule((time) => {
        synth.triggerAttackRelease(noteObj.note, durInSeconds, time);
        Tone.Draw.schedule(() => {
          // Animate listen keys row
          const listenRow = document.getElementById('repeat-listen-keys');
          if (listenRow) {
            const spans = listenRow.querySelectorAll('span');
            spans.forEach((sp, i) => {
              if (i < noteIdx)       sp.className = 'karaoke-played';
              else if (i === noteIdx) sp.className = 'karaoke-active';
              else                   sp.className = 'karaoke-unplayed';
            });
          }
          // Light up physical key
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

  // Schedule backing notes for this line's window
  const playBacking = document.getElementById('backing-toggle')?.checked ?? true;
  if (playBacking) {
    backingChordsData
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

  // After playback ends → Your Turn!
  const phraseDurSec = (lineEnd - lineStart) * beatSec;
  Tone.Transport.scheduleOnce((time) => {
    Tone.Draw.schedule(() => {
      Tone.Transport.stop();
      Tone.Transport.cancel(0);
      backingSynth.releaseAll();
      clearHighlightedKeys();
      repeatListening = true;
      showRepeatYourTurn(lineIdx);
    }, time);
  }, phraseDurSec + 0.5);

  Tone.Transport.start("+0.1");
}

function showRepeatYourTurn(lineIdx) {
  const schemaEl = document.getElementById('schema-container');
  const line = lessonLines[lineIdx];
  const noHint = document.getElementById('no-hint-check')?.checked ?? false;

  let keysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = noHint ? '?' : (keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '?');
    const cls = idx === 0 ? 'karaoke-active' : 'karaoke-unplayed';
    keysHtml += `<span class="${cls}" data-idx="${idx}">${disp}</span> `;
  });

  schemaEl.innerHTML = `
    <div class="repeat-your-turn-banner">
      <div class="repeat-mic-icon">🎤</div>
      <strong>Your turn!</strong>
      <span class="repeat-sub">${line.lyric}</span>
    </div>
    <div class="schema-keys-text repeat-keys" id="repeat-keys-row">${keysHtml}</div>
    <div class="repeat-note-feedback" id="repeat-feedback"></div>`;

  // Highlight first expected key
  const firstNote = line.notes[0];
  if (firstNote) {
    const keyDef = PIANO_KEYS.find(k => k.note === firstNote.note);
    if (keyDef) {
      const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
      if (domKey) domKey.classList.add('teacher-highlight');
    }
  }
}

function updateRepeatKeysDisplay() {
  const keysRow = document.getElementById('repeat-keys-row');
  if (!keysRow) return;
  const noHint = document.getElementById('no-hint-check')?.checked ?? false;
  const line = lessonLines[repeatLineIndex];

  let keysHtml = '';
  line.notes.forEach((noteObj, idx) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
    const disp = noHint ? '?' : (keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '?');

    let cls = 'karaoke-unplayed';
    if (idx < repeatNoteIndex)      cls = 'karaoke-played';
    else if (idx === repeatNoteIndex) cls = 'karaoke-active';
    keysHtml += `<span class="${cls}">${disp}</span> `;
  });
  keysRow.innerHTML = keysHtml;
}

window.restartRepeat = function() {
  repeatLineIndex = 0;
  playRepeatPhrase(0);
};

window.retryRepeat = function() {
  playRepeatPhrase(repeatLineIndex);
};

window.nextRepeatLine = function() {
  repeatLineIndex++;
  playRepeatPhrase(repeatLineIndex);
};

window.resumeLesson = function() {
  document.querySelector('.pause-alert')?.remove();
  if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
  updateTeacherUI();
};

// ─── TEACHER UI ───────────────────────────────────────────────────────────────
function clearHighlightedKeys() {
  document.querySelectorAll('.key').forEach(el => {
    el.classList.remove('teacher-highlight', 'approach-ring', 'waiting-pulse');
  });
}

function updateTeacherUI(isAutoplay = false) {
  if (!isLessonActive && !isAutoplay) return;

  const schemaEl = document.getElementById('schema-container');
  const mainBtn = document.getElementById('main-action-btn');

  if (currentLineIndex >= lessonLines.length) {
    schemaEl.innerHTML = `<p class="schema-lyrics" style="text-shadow:0 0 20px var(--accent-pink)">🎉 Lesson Complete! Great job!</p>`;
    if (mainBtn) { mainBtn.textContent = "Restart"; mainBtn.style.display = 'block'; }
    isLessonActive = false;
    clearHighlightedKeys();
    return;
  }

  const currentLine = lessonLines[currentLineIndex];
  const expectedNoteData = currentLine.notes[currentNoteInLine];
  if (!expectedNoteData) return;

  const bpm = getSongBpm(currentSongId);
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
      if (index < currentNoteInLine)       keyHtml += `<span class="karaoke-played">${displayChar} </span>`;
      else if (index === currentNoteInLine) keyHtml += `<span class="karaoke-played" style="color:var(--accent-pink);text-shadow:0 0 15px var(--accent-pink)">${displayChar} </span>`;
      else                                  keyHtml += `<span class="karaoke-unplayed">${displayChar} </span>`;
    } else {
      if (index < currentNoteInLine - 1) {
        keyHtml += `<span class="karaoke-played">${displayChar}</span><span class="karaoke-played">${dashes}</span>`;
      } else if (index === currentNoteInLine - 1) {
        const holdMs = Math.max((noteData.duration || 1) * beatSec * 1000, 300);
        keyHtml += `<span class="karaoke-holding" data-text="${displayChar}" style="--hold-time:${holdMs}ms">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
      } else if (index === currentNoteInLine) {
        // Pause alert if user takes too long
        if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
        let gapMs = 6000;
        if (noteData.beat !== null) {
          const prevBeat = index > 0 ? currentLine.notes[index - 1].beat : 0;
          if (prevBeat !== null) gapMs = Math.max((noteData.beat - prevBeat) * beatSec * 1000, 100) + 4000;
        }
        window.pauseTimeout = setTimeout(() => {
          if (isLessonActive && !isAutoplayActive) {
            const schemaBox = document.getElementById('schema-container');
            if (!schemaBox.querySelector('.pause-alert')) {
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
    const glowIndex = isAutoplay ? currentNoteInLine + 1 : currentNoteInLine;
    playedText = words.slice(0, glowIndex).join(" ") + (glowIndex > 0 ? " " : "");
    unplayedText = words.slice(glowIndex).join(" ");
  } else {
    const glowIndex = isAutoplay ? currentNoteInLine + 1 : currentNoteInLine;
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

// ─── NOTE TRIGGER ─────────────────────────────────────────────────────────────
async function triggerNote(laptopKey) {
  if (Tone.context.state !== 'running') await Tone.start();
  if (pressedKeys.has(laptopKey)) return;
  pressedKeys.add(laptopKey);

  const keyDef = PIANO_KEYS.find(k => k.key.toLowerCase() === laptopKey);
  if (!keyDef) return;

  synth.triggerAttack(keyDef.note);

  const keyEl = keyElementsMap.get(laptopKey);
  if (keyEl) keyEl.classList.add('active');

  // ── FREE PLAY ──
  if (isFreePlaying) {
    updateFreePLayDisplay(keyDef.note);
    return;
  }

  // ── REPEAT MODE ──
  if (currentMode === 'repeat' && repeatListening) {
    const expected = repeatExpectedNotes[repeatNoteIndex];
    if (!expected) return;

    if (keyDef.note === expected.note) {
      // Correct!
      const board = document.querySelector('.teacher-board');
      board.classList.remove('flash-correct'); void board.offsetWidth; board.classList.add('flash-correct');

      repeatNoteIndex++;
      updateRepeatKeysDisplay();

      // Advance highlight
      clearHighlightedKeys();
      if (repeatNoteIndex < repeatExpectedNotes.length) {
        const nextKeyDef = PIANO_KEYS.find(k => k.note === repeatExpectedNotes[repeatNoteIndex].note);
        if (nextKeyDef) {
          const domKey = keyElementsMap.get(nextKeyDef.key.toLowerCase());
          if (domKey) domKey.classList.add('teacher-highlight');
        }
      }

      // Line complete
      if (repeatNoteIndex >= repeatExpectedNotes.length) {
        repeatListening = false;
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
  if (isLessonActive && currentLineIndex < lessonLines.length && !isAutoplayActive) {
    const currentLine = lessonLines[currentLineIndex];
    const expectedNoteObj = currentLine.notes[currentNoteInLine];

    const bpm = getSongBpm(currentSongId);
    const beatSec = 60 / bpm;

    if (keyDef.note === expectedNoteObj.note) {
      if (keyEl) {
        const holdMs = Math.max((expectedNoteObj.duration || 1) * beatSec * 1000, 300);
        keyEl.style.setProperty('--hold-time', `${holdMs}ms`);
        keyEl.classList.add('active-hold');
        activeHoldNote = { key: laptopKey, startTime: performance.now(), targetHold: holdMs, domKey: keyEl };
        
        // Schedule auto-release visual if user releases too early (though releaseNote handles most)
        Tone.Transport.scheduleOnce(() => {
          if (activeHoldNote && activeHoldNote.key === laptopKey) {
             keyEl.classList.remove('active-hold');
          }
        }, `+${(holdMs/1000).toFixed(2)}`);
      }

      const playBacking = document.getElementById('backing-toggle')?.checked ?? true;

      if (currentMode === "step") {
        if (playBacking) tickSynth.triggerAttackRelease("C2", "8n");
        backingSynth.releaseAll();
        if (playBacking) {
          backingSynth.triggerAttack([keyDef.note]);
          if (window.sustainTimeoutID) Tone.Transport.clear(window.sustainTimeoutID);
          window.sustainTimeoutID = Tone.Transport.scheduleOnce(() => backingSynth.releaseAll(), "+2");
        }
      } else if (currentMode === "follow") {
        backingSynth.releaseAll();
        const currentBeat = expectedNoteObj.beat;
        if (currentBeat !== null && playBacking) {
          const harmonyNotes = backingChordsData
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
      board.classList.remove('flash-correct'); void board.offsetWidth; board.classList.add('flash-correct');

      currentNoteInLine++;
      if (currentNoteInLine >= currentLine.totalNotes) {
        currentLineIndex++;
        currentNoteInLine = 0;
      }
      updateTeacherUI();
    }
  }
}

function releaseNote(laptopKey) {
  pressedKeys.delete(laptopKey);
  const keyDef = PIANO_KEYS.find(k => k.key.toLowerCase() === laptopKey);
  if (!keyDef) return;

  synth.triggerRelease(keyDef.note);
  const keyEl = keyElementsMap.get(laptopKey);
  if (keyEl) keyEl.classList.remove('active');

  // Also clear radial map lights
  const charCode = laptopKey.charCodeAt(0);
  const tick = document.getElementById(`fp-tick-${charCode}`);
  const label = document.getElementById(`fp-label-${charCode}`);
  if (tick) tick.classList.remove('active');
  if (label) label.classList.remove('active');

  if (activeHoldNote && activeHoldNote.key === laptopKey) {
    const { domKey, startTime, targetHold } = activeHoldNote;
    domKey.classList.remove('active-hold');
    const heldTime = performance.now() - startTime;
    if (heldTime < targetHold - 200) {
      domKey.classList.add('error-shake');
      Tone.Transport.scheduleOnce(() => domKey.classList.remove('error-shake'), "+0.3");
    } else {
      domKey.classList.add('success-glow');
      Tone.Transport.scheduleOnce(() => domKey.classList.remove('success-glow'), "+0.4");
    }
    activeHoldNote = null;
  }
}

// ─── FREE PLAY ────────────────────────────────────────────────────────────────
const NOTE_NAMES = {
  'C': 'C', 'C#': 'C♯ / D♭', 'D': 'D', 'D#': 'D♯ / E♭',
  'E': 'E', 'F': 'F', 'F#': 'F♯ / G♭', 'G': 'G',
  'G#': 'G♯ / A♭', 'A': 'A', 'A#': 'A♯ / B♭', 'B': 'B'
};

function openFreePlay() {
  isFreePlaying = true;
  fpNoteHistory = [];
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
  isLessonActive = false;
  isAutoplayActive = false;
  repeatListening = false;
  clearHighlightedKeys();
}

function closeFreePlay() {
  isFreePlaying = false;
  const overlay = document.getElementById('free-play-overlay');
  if (overlay) {
    overlay.classList.remove('active');
  }
  pressedKeys.forEach(k => releaseNote(k));
  pressedKeys.clear();
}

function buildRadialKeyMap() {
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

function updateFreePLayDisplay(note) {
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

  fpNoteHistory.unshift(note);
  if (fpNoteHistory.length > 6) fpNoteHistory.pop();
  updateFpHistory();
}

function updateFpHistory() {
  const histEl = document.getElementById('fp-history');
  if (!histEl) return;
  histEl.innerHTML = fpNoteHistory.map((n, i) => `
    <span class="fp-history-note" style="opacity:${1 - i * 0.15}">${n}</span>
  `).join('');
}

// ─── KEYBOARD LISTENERS ───────────────────────────────────────────────────────
function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;

    // Escape closes free play
    if (e.key === 'Escape' && isFreePlaying) { closeFreePlay(); return; }

    const key = e.key.toLowerCase();
    triggerNote(key);
  });

  window.addEventListener('keyup', (e) => {
    const key = e.key.toLowerCase();
    if (pressedKeys.has(key)) releaseNote(key);
  });
}

// ─── BOOT ─────────────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initKeyboard();
  setupKeyboardListeners();
  prepLesson('hey_jude');
  initTeacher();
});
