const { Midi } = require('@tonejs/midi');
const fs = require('fs');

const data = fs.readFileSync('public/lovely-full.mid');
const midi = new Midi(data);
const track = midi.tracks[0];

console.log('Total notes:', track.notes.length);
const lastNotes = track.notes.slice(-20);
lastNotes.forEach((n, i) => {
  console.log(`Note ${i}: ${n.name} beat=${(n.ticks/midi.header.ppq).toFixed(3)} duration=${n.duration.toFixed(3)}`);
});
