const fs = require('fs');
const toneMidi = require('@tonejs/midi');

function examineMidi(filePath) {
  try {
    const midiData = fs.readFileSync(filePath);
    const midi = new toneMidi.Midi(midiData);
    console.log(`\n--- Examining: ${filePath.split('/').pop()} ---`);
    console.log('MIDI Name:', midi.name);
    console.log('BPM:', midi.header.tempos[0] ? Math.round(midi.header.tempos[0].bpm) : 'Default');
    console.log('Tracks:');
    midi.tracks.forEach((track, index) => {
      console.log(`Track ${index}: ${track.name || 'Untitled'} (Instrument: ${track.instrument.name || 'Unknown'})`);
      console.log(`  - Notes: ${track.notes.length}`);
      if (track.notes.length > 0) {
        let max = track.notes[0];
        let min = track.notes[0];
        track.notes.forEach(n => {
            if (n.midi > max.midi) max = n;
            if (n.midi < min.midi) min = n;
        });
        console.log(`  - Highest: ${max.name}, Lowest: ${min.name}`);
        console.log(`  - Duration: ${track.duration.toFixed(2)} sec`);
      }
    });
  } catch(e) {
    console.log(`Could not read ${filePath}: ${e}`);
  }
}

examineMidi('c:/Users/jha85/OneDrive/Desktop/aiml/piano/Billie Eilish - Lovely.mid');
examineMidi('c:/Users/jha85/OneDrive/Desktop/aiml/piano/lovely midi 2.mid');
