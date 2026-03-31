import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// Tone.js Synthesizer Setup: Using a Sampler with high-quality piano audio files
const synth = new Tone.Sampler({
  urls: {
    "A0": "A0.mp3", "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3",
    "A1": "A1.mp3", "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3",
    "A2": "A2.mp3", "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3",
    "A3": "A3.mp3", "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3",
    "A4": "A4.mp3", "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3",
    "A5": "A5.mp3", "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3",
    "A6": "A6.mp3", "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3",
    "A7": "A7.mp3", "C8": "C8.mp3"
  },
  release: 1,
  baseUrl: "https://tonejs.github.io/audio/salamander/"
}).toDestination();

// Soft reverb and Felt-Piano Filter to fit the SleepyKeys aesthetic perfectly
const reverb = new Tone.Reverb(2.5).toDestination();
// Rolling off high frequencies makes the Grand Piano sound like a muted felt piano!
const feltFilter = new Tone.Filter(700, "lowpass").toDestination();

synth.chain(feltFilter, reverb);


const backingSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: {
    attack: 0.5,
    decay: 0.5,
    sustain: 0.8,
    release: 0.8 // Lush padded strings
  }
}).connect(reverb).toDestination();
backingSynth.volume.value = -15; // Slightly louder backing strings

const tickSynth = new Tone.MembraneSynth().toDestination();
tickSynth.volume.value = -25; // Soft tap

// Teacher State
let activeHoldNote = null;

// 3-Octave Linear Mapping for standard QWERTY layout
const PIANO_KEYS = [
  // Octave 3 
  { note: 'C3', type: 'white', key: '1' },
  { note: 'C#3', type: 'black', key: '2' },
  { note: 'D3', type: 'white', key: '3' },
  { note: 'D#3', type: 'black', key: '4' },
  { note: 'E3', type: 'white', key: 'z' },
  { note: 'F3', type: 'white', key: 'x' },
  { note: 'F#3', type: 'black', key: 'c' },
  { note: 'G3', type: 'white', key: 'v' },
  { note: 'G#3', type: 'black', key: 'b' },
  { note: 'A3', type: 'white', key: 'n' },
  { note: 'A#3', type: 'black', key: ',' },
  { note: 'B3', type: 'white', key: 'm' },

  // Octave 4
  { note: 'C4', type: 'white', key: 'a' },
  { note: 'C#4', type: 'black', key: 'w' },
  { note: 'D4', type: 'white', key: 's' },
  { note: 'D#4', type: 'black', key: 'e' },
  { note: 'E4', type: 'white', key: 'd' },
  { note: 'F4', type: 'white', key: 'f' },
  { note: 'F#4', type: 'black', key: 't' },
  { note: 'G4', type: 'white', key: 'g' },
  { note: 'G#4', type: 'black', key: 'y' },
  { note: 'A4', type: 'white', key: 'h' },
  { note: 'A#4', type: 'black', key: 'u' },
  { note: 'B4', type: 'white', key: 'j' },

  // Octave 5
  { note: 'C5', type: 'white', key: 'k' },
  { note: 'C#5', type: 'black', key: 'i' },
  { note: 'D5', type: 'white', key: 'l' },
  { note: 'D#5', type: 'black', key: 'o' },
  { note: 'E5', type: 'white', key: ';' },
  { note: 'F5', type: 'white', key: "'", display: "'" },
  { note: 'F#5', type: 'black', key: '[' },
  { note: 'G5', type: 'white', key: 'enter', display: 'ENT' },
  { note: 'G#5', type: 'black', key: ']' },
  { note: 'A5', type: 'white', key: '\\' },
  { note: 'A#5', type: 'black', key: '7' },
  { note: 'B5', type: 'white', key: '8' }
];

// Song Library Data
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
    bpm: 90,
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
    bpm: 150,
    notes: [
      {
            "lyrics": "Thought I found a way",
            "notes": ".E@15.998,1.98 .F#@17.998,1.93 .G@20,1.96 .A@22,1.09 .B@23.002,0.96"
      },
      {
            "lyrics": "Thought I found a way, yeah",
            "notes": "D@24,0.61 E@24.502,1.06 D@25.5,0.34 D@26,1.45 .B@27.5,0.28 .B@27.998,1.14"
      },
      {
            "lyrics": "But you never go away",
            "notes": ".A@28.998,0.54 .B@29.502,0.61 .A@29.998,0.53 .G@30.5,0.24 .G@31.002,0.57 .E@31.5,0.2 .E@31.998,1.98"
      },
      {
            "lyrics": "So I guess I gotta stay now",
            "notes": ".F#@34,1.96 .G@36,2.05 .A@37.998,1 .B@39,1.16 D@40,0.52 E@40.5,1.06 D@41.5,0.29 D@42.002,0.97"
      },
      {
            "lyrics": "Oh, I hope someday",
            "notes": ".B@43,0.27 .B@43.502,1.57 .A@45,0.52 .B@45.5,0.66 .A@45.998,0.6 .G@46.498,0.36"
      },
      {
            "lyrics": "I'll make it out of here",
            "notes": ".G@47,0.61 .E@47.498,0.25 .E@47.998,1.97 .F#@50,2 .G@52,2.07 .A@54,1.02"
      },
      {
            "lyrics": "Even if it takes all night",
            "notes": ".B@55,1.09 D@55.998,0.55 E@56.5,1.06 D@57.498,0.35 D@58,1.57 .B@59.5,0.31 .B@59.998,1.07"
      },
      {
            "lyrics": "Or a hundred years",
            "notes": ".A@61,1.18 B@64,1.52 A@65.502,0.33 G@65.75,0.37 F#@66.002,0.51"
      },
      {
            "lyrics": "Need a place to hide",
            "notes": "E@66.5,0.31 E@67,1.13 A@69.333,0.46 G@69.667,0.37 F#@70,0.97"
      },
      {
            "lyrics": "But I can't find one near",
            "notes": "B@72,1.55 A@73.5,0.29 G@73.752,0.28 F#@74,0.55 E@74.5,0.27 E@74.998,1.01 F#@76,0.45"
      },
      {
            "lyrics": "Wanna feel alive",
            "notes": "E@76.5,0.28 E@77.002,0.99 G@77.998,1.14 B@80,1.5 A@81.5,0.33"
      },
      {
            "lyrics": "Outside I can fight my fear",
            "notes": "G@81.75,0.34 F#@82,0.54 E@82.502,0.29 E@83,1.09 A@85.333,0.48 G@85.667,0.48 F#@85.998,0.9 F#@89,0.51 G@89.498,0.62"
      },
      {
            "lyrics": "Isn't it lovely, all alone?",
            "notes": "F#@90,1.13 F#@92.002,0.48 E@92.5,0.32 E@93.002,2.03 G@94.998,1.12 E3@0.000,0.5 G3@0.652,0.5 E3@1.304,0.5"
      },
      {
            "lyrics": "Heart made of glass, my mind of stone",
            "notes": "G3@1.956,0.5 E3@2.608,0.5 G3@3.260,0.5 E3@3.912,0.5 G3@4.564,0.5 E3@5.216,0.5 G3@5.868,0.5 E3@6.520,0.5"
      },
      {
            "lyrics": "Tear me to pieces, skin and bone",
            "notes": "G3@7.172,0.5 E3@7.824,0.5 G3@8.476,0.5 E3@9.128,0.5 G3@9.780,0.5 E4@10.432,0.5 G3@11.084,0.5 E3@11.736,0.5"
      },
      {
            "lyrics": "Hello ~ welcome home",
            "notes": "G3@12.388,0.5 E3@13.040,0.5 G3@13.692,0.5 E3@14.344,0.5 G3@14.996,0.5 E3@15.648,0.5"
      },
      {
            "lyrics": "Walkin' out of town",
            "notes": "G3@16.300,0.5 E3@16.952,0.5 G3@17.604,0.5 F#4@18.256,0.5 G3@18.908,0.5 E3@19.560,0.5"
      },
      {
            "lyrics": "Lookin' for a better place",
            "notes": "F#4@20.212,0.5 G4@20.864,0.5 G3@21.516,0.5 E3@22.168,0.5 G3@22.820,0.5 B3@23.472,0.5 G3@24.124,0.5"
      },
      {
            "lyrics": "Something's on my mind",
            "notes": "E3@24.776,0.5 G3@25.428,0.5 F#4@26.080,0.5 B3@26.732,0.5 F#3@27.384,0.5"
      },
      {
            "lyrics": "Always in my headspace",
            "notes": "B3@28.036,0.5 D4@28.688,0.5 B3@29.340,0.5 F#3@29.992,0.5 B3@30.644,0.5 E4@31.296,0.5"
      },
      {
            "lyrics": "But I know someday",
            "notes": "G3@31.948,0.5 E3@0.000,0.5 G3@0.652,0.5 E3@1.304,0.5 G3@1.956,0.5"
      },
      {
            "lyrics": "I'll make it out of here",
            "notes": "E3@2.608,0.5 G3@3.260,0.5 E3@3.912,0.5 G3@4.564,0.5 E3@5.216,0.5 G3@5.868,0.5"
      }
]
  },
};

// Utility: Parses user custom note format (^=Octave5, .=Octave3) to ToneJS format (A#4)
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
    
    if (name.startsWith('^')) { octave = 5; name = name.substring(1); }
    else if (name.startsWith('.')) { octave = 3; name = name.substring(1); }
    
    if (name === 'Bb') name = 'A#'; // Normalize
    
    return {
      note: `${name}${octave}`,
      beat: b,
      duration: d
    };
  });
}

// Teacher State
let lessonLines = [];
let currentLineIndex = -1;
let currentNoteInLine = 0;
let isLessonActive = false;
let isAutoplayActive = false;
let currentMode = "step"; // step, follow, autoplay
let backingChordsData = [];
const pressedKeys = new Set();
const keyElementsMap = new Map();

async function loadBackingTrack(songId) {
  backingChordsData = [];
  try {
     let url = '';
     let trackIdx = 0;
     let beatOffset = 0;
     
     if (songId === "hey_jude") {
        url = 'hey-jude.mid';
        trackIdx = 4;
        beatOffset = 3;
     } else if (songId === "lovely") {
        url = 'lovely-full.mid'; // Use long MIDI for full song
        trackIdx = 0; // Use Track 0 (smashed) but it covers everything
        beatOffset = 0;
     } else {
        return;
     }
     
     try {
       const resp = await fetch(url);      
       if(!resp.ok) {
          throw new Error(`Failed to load MIDI: ${resp.status} ${resp.statusText}`);
       }
       const ab = await resp.arrayBuffer();
       const midi = new Midi(ab);
       const track = midi.tracks[trackIdx]; 
       if (track) {
         track.notes.forEach(n => {
           const rawBeat = n.ticks / midi.header.ppq;
           const shiftedBeat = rawBeat - beatOffset;
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
        console.error("Backtrack error:", err);
        alert("Backtrack not playing: " + url + "\nReason: " + err.message + "\nTry refreshing or checking if the file is in your GitHub repo!");
     }
  } catch(e) {
    console.error("MIDI Backing Track failed to load:", e);
  }
}

// Initialize the visual keyboard
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
    
    // Map dynamically for fast lookup
    keyElementsMap.set(keyDef.key.toLowerCase(), li);
    
    // Mouse Interaction
    li.addEventListener('mousedown', async () => triggerNote(keyDef.key.toLowerCase()));
    li.addEventListener('mouseup', () => releaseNote(keyDef.key.toLowerCase()));
    li.addEventListener('mouseleave', () => {
      if (pressedKeys.has(keyDef.key.toLowerCase())) releaseNote(keyDef.key.toLowerCase());
    });
  });
}

// Prepare Lesson Data
function prepLesson(songId) {
  const songData = SONG_LIBRARY[songId];
  if (!songData) return;
  
  let autoBeat = 0;
  lessonLines = songData.notes.map(line => {
    const rawNotes = parseNoteString(line.notes);
    rawNotes.forEach(n => {
       if (n.beat === null || isNaN(n.beat)) {
           n.beat = autoBeat;
           n.duration = 1;
           autoBeat += 1;
       } else {
           autoBeat = n.beat + n.duration;
       }
    });
    return {
      lyric: line.lyrics,
      notes: rawNotes,
      totalNotes: rawNotes.length
    };
  });
  
  // Reset states
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  backingSynth.releaseAll();
  isLessonActive = false;
  isAutoplayActive = false;
  currentLineIndex = -1;
  currentNoteInLine = 0;
  
  const hasAutoplay = lessonLines.some(l => l.notes.some(n => n.beat !== null));
  
  // Configure UI
  const mainBtn = document.getElementById('main-action-btn');
  const modeToggles = document.querySelectorAll('.mode-toggle');
  
  if (mainBtn) {
    mainBtn.style.display = 'block';
    if (currentMode === "autoplay" && !hasAutoplay) {
      // Force switch if unavailable
      currentMode = "step";
      modeToggles.forEach(t => t.classList.remove('active'));
      document.querySelector('.mode-toggle[data-mode="step"]').classList.add('active');
    }
    
    if (currentMode === "step") mainBtn.textContent = "Start Step Mode";
    else if (currentMode === "follow") mainBtn.textContent = "Start Follow Mode";
    else if (currentMode === "autoplay") mainBtn.textContent = "Start Autoplay";
    
    // Disable Autoplay toggle if no data
    const apToggle = Array.from(modeToggles).find(t => t.dataset.mode === "autoplay");
    if (apToggle) {
      apToggle.style.opacity = hasAutoplay ? '1' : '0.3';
      apToggle.style.pointerEvents = hasAutoplay ? 'auto' : 'none';
    }
  }
  
  document.getElementById('schema-container').innerHTML = `<p class="placeholder-text">Select a mode and dive in.</p>`;
  clearHighlightedKeys();
  
  // Load backing Track silently
  loadBackingTrack(songId);
}

// Setup Event Listeners for the Lesson Start
function initTeacher() {
  const mainBtn = document.getElementById('main-action-btn');
  const songSelector = document.getElementById('song-selector');
  const modeToggles = document.querySelectorAll('.mode-toggle');
  
  modeToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
      modeToggles.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentMode = e.target.dataset.mode;
      prepLesson(songSelector.value);
    });
  });
  
  mainBtn.addEventListener('click', async () => {
    if (Tone.context.state !== 'running') await Tone.start();
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
    }
  });
  
  songSelector.addEventListener('change', (e) => {
    prepLesson(e.target.value);
  });
}

function playAutoplayDemo() {
  if (Tone.context.state !== 'running') Tone.start();
  Tone.Transport.stop();
  Tone.Transport.cancel(0);
  
  const songId = document.getElementById('song-selector').value;
  const songData = SONG_LIBRARY[songId];
  if (!songData) return;
  
  const bpm = songData.bpm || 90;
  Tone.Transport.bpm.value = bpm;
  
  isLessonActive = false;
  isAutoplayActive = true;
  
  const schemaEl = document.getElementById('schema-container');
  schemaEl.innerHTML = ``;
  
  const beatSec = 60 / bpm;
  let maxBeat = 0;
  
  // Schedule Melody
  lessonLines.forEach((line, lineIdx) => {
    line.notes.forEach((noteObj, noteIdx) => {
      if (noteObj.beat !== null && noteObj.duration !== null) {
        if (noteObj.beat + noteObj.duration > maxBeat) {
          maxBeat = noteObj.beat + noteObj.duration;
        }
        
        const timeInSeconds = noteObj.beat * beatSec;
        const durInSeconds = noteObj.duration * beatSec;
        
        Tone.Transport.schedule((time) => {
          synth.triggerAttackRelease(noteObj.note, durInSeconds, time);
          
          Tone.Draw.schedule(() => {
            currentLineIndex = lineIdx;
            currentNoteInLine = noteIdx;
            updateTeacherUI(true); // force rerender immediately
            
            const keyDef = PIANO_KEYS.find(k => k.note === noteObj.note);
            if (keyDef) {
              const domKey = keyElementsMap.get(keyDef.key.toLowerCase());
              if (domKey) {
                domKey.classList.add('active');
                setTimeout(() => domKey.classList.remove('active'), durInSeconds * 1000);
              }
            }
          }, time);
        }, timeInSeconds);
      }
    });
  });
  
  // Schedule full MIDI Backing Track for Autoplay
  const playBacking = document.getElementById('backing-toggle') ? document.getElementById('backing-toggle').checked : true;
  
  if (playBacking) {
    backingChordsData.forEach(chord => {
      const timeInSeconds = chord.beat * beatSec;
      const durInSeconds = chord.duration * beatSec;
      Tone.Transport.schedule((time) => {
        backingSynth.triggerAttackRelease(chord.note, durInSeconds, time);
      }, timeInSeconds);
    });
  }
  
  if (maxBeat > 0) {
    Tone.Transport.schedule((time) => {
      Tone.Draw.schedule(() => {
        Tone.Transport.stop();
        Tone.Transport.cancel(0);
        backingSynth.releaseAll();
        isAutoplayActive = false;
        document.getElementById('schema-container').innerHTML = `<p class="schema-lyrics" style="text-shadow: 0 0 20px var(--accent-pink);">Autoplay Complete!</p>`;
        const mainBtn = document.getElementById('main-action-btn');
        if (mainBtn) {
          mainBtn.textContent = "Restart Autoplay";
          mainBtn.style.display = 'block';
        }
        clearHighlightedKeys();
      }, time);
    }, (maxBeat * beatSec) + 1);
  }
  
  Tone.Transport.start("+0.1");
}

window.resumeLesson = function() {
  const alertEl = document.querySelector('.pause-alert');
  if (alertEl) alertEl.remove();
  
  if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
  
  // Re-trigger the UI setup to start listening and glowing again
  updateTeacherUI();
};

function clearHighlightedKeys() {
  document.querySelectorAll('.key').forEach(el => {
    el.classList.remove('teacher-highlight', 'approach-ring', 'waiting-pulse');
  });
}

// Update the Teacher GUI visually
function updateTeacherUI(isAutoplay = false) {
  if (!isLessonActive && !isAutoplay) return;
  
  const schemaEl = document.getElementById('schema-container');
  const mainBtn = document.getElementById('main-action-btn');
  
  if (currentLineIndex >= lessonLines.length) {
    schemaEl.innerHTML = `<p class="schema-lyrics" style="text-shadow: 0 0 20px var(--accent-pink);">Lesson Complete! Great Job!</p>`;
    if (mainBtn) {
      mainBtn.textContent = "Restart";
      mainBtn.style.display = 'block';
    }
    isLessonActive = false;
    clearHighlightedKeys();
    return;
  }
  
  const currentLine = lessonLines[currentLineIndex];
  const expectedNoteData = currentLine.notes[currentNoteInLine];
  if(!expectedNoteData) return;
  
  const songBpm = document.getElementById('song-selector').value === "hey_jude" ? 90 : 120;
  const beatSec = 60 / songBpm;
  
  // Build Keys Text with Dash Rhythm Spacing
  let keyHtml = "";
  currentLine.notes.forEach((noteData, index) => {
    const keyDef = PIANO_KEYS.find(k => k.note === noteData.note);
    const displayChar = keyDef ? (keyDef.display || keyDef.key.toUpperCase()) : '?';
    
    let dashes = " ";
    if (index < currentLine.notes.length - 1) {
       const nextNote = currentLine.notes[index + 1];
       if (noteData.beat !== null && nextNote.beat !== null) {
          const gapBeats = nextNote.beat - noteData.beat;
          if (gapBeats >= 1.5) dashes = " - ";
          if (gapBeats >= 2.5) dashes = " - - ";
          if (gapBeats >= 3.5) dashes = " - - - ";
       }
    }
    
    if (isAutoplay) {
       if (index < currentNoteInLine) keyHtml += `<span class="karaoke-played">${displayChar} </span>`;
       else if (index === currentNoteInLine) keyHtml += `<span class="karaoke-played" style="color:var(--accent-pink); text-shadow:0 0 15px var(--accent-pink);">${displayChar} </span>`;
       else keyHtml += `<span class="karaoke-unplayed">${displayChar} </span>`;
    } else {
       if (index < currentNoteInLine - 1) {
         keyHtml += `<span class="karaoke-played">${displayChar}</span><span class="karaoke-played">${dashes}</span>`;
       } else if (index === currentNoteInLine - 1) {
         // The note perfectly struck right now (holding)
         const holdMs = Math.max((noteData.duration || 1) * beatSec * 1000, 300);
         keyHtml += `<span class="karaoke-holding" data-text="${displayChar}" style="--hold-time: ${holdMs}ms;">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
       } else if (index === currentNoteInLine) {
         // The upcoming note waiting to be struck (boxed target)
         let prevBeat = (index > 0) ? currentLine.notes[index-1].beat : null;
         if (index === 0 && currentLineIndex > 0) {
            const pLine = lessonLines[currentLineIndex-1];
            prevBeat = pLine.notes[pLine.notes.length-1].beat;
         }
         let gapMs = 1000;
         if (noteData.beat !== null && prevBeat !== null) {
            gapMs = Math.max((noteData.beat - prevBeat) * beatSec * 1000, 100);
         }
         
         // Setup Fallback Pause Alert if user never hits this active key
         if (window.pauseTimeout) clearTimeout(window.pauseTimeout);
         window.pauseTimeout = setTimeout(() => {
             if (isLessonActive && !isAutoplayActive) {
                 const schemaBox = document.getElementById('schema-container');
                 if (!schemaBox.querySelector('.pause-alert')) {
                     schemaBox.innerHTML += `<div class="pause-alert" onclick="resumeLesson()">PAUSED<span>(Fell too far behind) Click here to resume</span></div>`;
                 }
                 if(Tone.Transport.state === 'started') Tone.Transport.pause();
                 backingSynth.releaseAll();
             }
         }, gapMs + 4000); // Wait gap time + 4 silent seconds before alerting
         
         keyHtml += `<span class="karaoke-active">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
       } else {
         keyHtml += `<span class="karaoke-unplayed">${displayChar}</span><span class="karaoke-unplayed">${dashes}</span>`;
       }
    }
  });

  // Apple Music Style Karaoke Overlay for Lyrics (Simple implementation for words)
  const words = currentLine.lyric.split(" ");
  let playedText = "";
  let unplayedText = "";
  
  if (words.length === currentLine.totalNotes) {
    const glowIndex = isAutoplay ? currentNoteInLine + 1 : currentNoteInLine;
    playedText = words.slice(0, glowIndex).join(" ") + (glowIndex > 0 ? " " : "");
    unplayedText = words.slice(glowIndex).join(" ");
  } else {
    const glowIndex = isAutoplay ? currentNoteInLine + 1 : currentNoteInLine;
    const ratio = glowIndex / currentLine.totalNotes;
    const splitIndex = Math.floor(currentLine.lyric.length * ratio);
    
    let adjustedSplit = splitIndex;
    if (splitIndex > 0 && splitIndex < currentLine.lyric.length) {
       let spaceIdx = currentLine.lyric.indexOf(" ", splitIndex);
       if (spaceIdx === -1) spaceIdx = currentLine.lyric.length;
       adjustedSplit = spaceIdx;
    }
    playedText = currentLine.lyric.substring(0, adjustedSplit);
    unplayedText = currentLine.lyric.substring(adjustedSplit);
  }
  
  schemaEl.innerHTML = `
    <div class="schema-keys-text">${keyHtml}</div>
    <div class="schema-lyrics"><span class="karaoke-played">${playedText}</span><span class="karaoke-unplayed">${unplayedText}</span></div>
  `;

  // Highlight physical key just slightly (removed massive target rings)
  if (!isAutoplay) {
    const nextKeyDef = PIANO_KEYS.find(k => k.note === expectedNoteData.note);
    clearHighlightedKeys();

    if (nextKeyDef) {
      const domKey = keyElementsMap.get(nextKeyDef.key.toLowerCase());
      if (domKey) {
        domKey.classList.add('teacher-highlight'); // Only leaves minor inline bottom border from CSS
      }
    }
  }
}

// Global Note Trigger
async function triggerNote(laptopKey) {
  if (Tone.context.state !== 'running') await Tone.start();
  if (pressedKeys.has(laptopKey)) return; 
  pressedKeys.add(laptopKey);
  
  const keyDef = PIANO_KEYS.find(k => k.key.toLowerCase() === laptopKey);
  if (!keyDef) return;

  // Sound!
  synth.triggerAttack(keyDef.note);
  
  // Visuals
  const keyEl = keyElementsMap.get(laptopKey);
  if (keyEl) keyEl.classList.add('active');

  // Teacher Logic validation
  if (isLessonActive && currentLineIndex < lessonLines.length && !isAutoplayActive) {
    const currentLine = lessonLines[currentLineIndex];
    const expectedNoteObj = currentLine.notes[currentNoteInLine];
    
    const songBpm = document.getElementById('song-selector').value === "hey_jude" ? 90 : 120;
    const beatSec = 60 / songBpm;
    
    if (keyDef.note === expectedNoteObj.note) {
       // Correct note played!
       
       if (keyEl) {
         const holdMs = Math.max((expectedNoteObj.duration || 1) * beatSec * 1000, 300);
         keyEl.style.setProperty('--hold-time', `${holdMs}ms`);
         keyEl.classList.add('active-hold');
         activeHoldNote = { key: laptopKey, startTime: performance.now(), targetHold: holdMs, domKey: keyEl };
       }
       
       // Handle Modes Mechanics
       const playBacking = document.getElementById('backing-toggle') ? document.getElementById('backing-toggle').checked : true;
       
       if (currentMode === "step") {
         if (playBacking) tickSynth.triggerAttackRelease("C2", "8n"); // Metronome tick
         backingSynth.releaseAll(); // Clear previous soft pad
         if (playBacking) {
            backingSynth.triggerAttack([keyDef.note]); // Soft pad mirror
            if (window.sustainTimeout) clearTimeout(window.sustainTimeout);
            window.sustainTimeout = setTimeout(() => backingSynth.releaseAll(), 2000);
         }
       } 
       else if (currentMode === "follow") {
         backingSynth.releaseAll(); // The 200ms fadeOut is cleanly handled
         
         const currentBeat = expectedNoteObj.beat;
         if (currentBeat !== null && playBacking) {
            // Find all chords playing around this exact beat
            const harmonyNotes = backingChordsData
              .filter(c => Math.abs(c.beat - currentBeat) <= 0.1)
              .map(c => c.note);
              
            if (harmonyNotes.length > 0) {
              backingSynth.triggerAttack(harmonyNotes);
              
              const maxSustainMs = 4 * (60 / songBpm) * 1000;
              
              if (window.sustainTimeout) clearTimeout(window.sustainTimeout);
              window.sustainTimeout = setTimeout(() => backingSynth.releaseAll(), maxSustainMs);
            }
         }
       }
       
       const board = document.querySelector('.teacher-board');
       board.classList.remove('flash-correct');
       void board.offsetWidth;
       board.classList.add('flash-correct');

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
  
  if (activeHoldNote && activeHoldNote.key === laptopKey) {
    const { domKey, startTime, targetHold } = activeHoldNote;
    domKey.classList.remove('active-hold');
    
    const heldTime = performance.now() - startTime;
    if (heldTime < targetHold - 200) { // Early Release Error (200ms grace period)
       domKey.classList.add('error-shake');
       setTimeout(() => domKey.classList.remove('error-shake'), 300);
    } else {
       domKey.classList.add('success-glow');
       setTimeout(() => domKey.classList.remove('success-glow'), 400);
    }
    activeHoldNote = null;
  }
}

// Global Keyboard hooks
function setupKeyboardListeners() {
  window.addEventListener('keydown', (e) => {
    if(e.repeat) return; 
    let key = e.key.toLowerCase();
    
    triggerNote(key);
  });

  window.addEventListener('keyup', (e) => {
    let key = e.key.toLowerCase();
    
    if (pressedKeys.has(key)) {
      releaseNote(key);
    }
  });
}

// Run setup on load
window.addEventListener('DOMContentLoaded', () => {
  initKeyboard();
  setupKeyboardListeners();
  prepLesson('bohemian_rhapsody');
  initTeacher();
});

