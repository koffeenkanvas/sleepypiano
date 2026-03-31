import fs from 'fs';
import { Midi } from '@tonejs/midi';

const midiData = fs.readFileSync('c:/Users/jha85/OneDrive/Desktop/aiml/piano/Billie Eilish - Lovely.mid');
const midi = new Midi(midiData);

console.log('MIDI Name:', midi.name);
console.log('BPM:', midi.header.tempos[0] ? Math.round(midi.header.tempos[0].bpm) : 'Default');
console.log('Tracks:');
midi.tracks.forEach((track, index) => {
  console.log(`Track ${index}: ${track.name || 'Untitled'} (Notes: ${track.notes.length})`);
});
