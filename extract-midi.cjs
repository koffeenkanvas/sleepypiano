const fs = require('fs');
const { Midi } = require('@tonejs/midi');

const midiData = fs.readFileSync('Hey-Jude-1.mid');
const midi = new Midi(midiData);

console.log('BPM:', Math.round(midi.header.tempos[0].bpm));
console.log('PPQ:', midi.header.ppq);

const melodyTrack = midi.tracks[1];
const pianoTrack = midi.tracks[4];

console.log('First 5 Melody (Track 1) Notes:');
for(let i=0; i<5 && i<melodyTrack.notes.length; i++) {
   const n = melodyTrack.notes[i];
   console.log(`- ${n.name}: ticks=${n.ticks}, beats=${n.ticks / midi.header.ppq}, time=${n.time}s`);
}

console.log('\nFirst 5 Piano (Track 4) Notes:');
for(let i=0; i<5 && i<pianoTrack.notes.length; i++) {
   const n = pianoTrack.notes[i];
   console.log(`- ${n.name}: ticks=${n.ticks}, beats=${n.ticks / midi.header.ppq}, time=${n.time}s`);
}
