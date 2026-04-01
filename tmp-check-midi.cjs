const { Midi } = require('@tonejs/midi');
const fs = require('fs');

const data = fs.readFileSync('public/lovely-full.mid');
const midi = new Midi(data);

console.log('MIDI Header:', midi.header.name);
console.log('Tracks:', midi.tracks.length);

midi.tracks.forEach((track, i) => {
  console.log(`Track ${i}: ${track.name} (notes: ${track.notes.length})`);
});
