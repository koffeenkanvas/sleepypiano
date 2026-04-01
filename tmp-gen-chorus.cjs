const { Midi } = require('@tonejs/midi');
const fs = require('fs');

const data = fs.readFileSync('public/lovely-full.mid');
const midi = new Midi(data);
const track = midi.tracks[0];
const ppq = midi.header.ppq;

function toAppNote(midiName, octave) {
  if (octave === 5) return `^${midiName}`;
  if (octave === 3) return `.${midiName}`;
  return midiName;
}

const lines = [
  "Heart made of glass, my mind of stone",
  "Tear me to pieces, skin and bone",
  "Hello ~ welcome home",
  "Walkin' out of town",
  "Lookin' for a better place",
  "Something's on my mind",
  "Always in my headspace",
  "But I know someday",
  "I'll make it out of here"
];

let currentBeat = 91.673; // Based on Note 156 from previous run
console.log('Generating JSON for Chorus...');

// Note: I'll just look for the specific melody notes in the MIDI around these beats
// Actually, I can see the pattern is a 0.5 beat interval usually.
// Let's just find the melody track's notes between beat 91 and 130 and group them into lines.

const notes = track.notes.filter(n => {
  const b = n.ticks / ppq;
  return b >= 91.5 && b <= 130;
});

// We'll manually group them to match the lyrics
notes.forEach(n => {
   const b = (n.ticks/ppq).toFixed(3);
   console.log(`${n.name}@${b}`);
});
