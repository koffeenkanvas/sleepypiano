const { Midi } = require('@tonejs/midi');
const fs = require('fs');

const data = fs.readFileSync('public/lovely-full.mid');
const midi = new Midi(data);
const track = midi.tracks[0];

console.log('Extracting notes between beat 90 and 130...');
const chorusNotes = track.notes.filter(n => {
  const b = n.ticks / midi.header.ppq;
  return b >= 90 && b <= 130;
});

chorusNotes.forEach((n, i) => {
  console.log(`Note ${i}: ${n.name} beat=${(n.ticks/midi.header.ppq).toFixed(3)} dur=${n.duration.toFixed(3)}`);
});
