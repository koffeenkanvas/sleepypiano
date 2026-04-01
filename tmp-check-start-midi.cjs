const { Midi } = require('@tonejs/midi');
const fs = require('fs');

const data = fs.readFileSync('public/lovely-full.mid');
const midi = new Midi(data);
const track = midi.tracks[0];

console.log('PPQ:', midi.header.ppq);
console.log('Total notes:', track.notes.length);
const firstNotes = track.notes.slice(0, 50);
firstNotes.forEach((n, i) => {
  console.log(`Note ${i}: ${n.name} beat=${(n.ticks/midi.header.ppq).toFixed(3)} dur=${n.duration.toFixed(3)}`);
});
