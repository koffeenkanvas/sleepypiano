const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Fix 1: Sync property name from 'time' to 'beat' in loadBackingTrack
js = js.replace(/time: shiftedBeat,/g, 'beat: shiftedBeat,'); // Fix naming mismatch

// Fix 2: Volume boost for backing synth
js = js.replace(/backingSynth.volume.value = -15;/g, 'backingSynth.volume.value = -12;');

// Fix 3: Update diagnostic build message
js = js.replace(/Build: v1.7/g, 'Build: v1.8');

fs.writeFileSync('main.js', js);
console.log('main.js audio timing synced and volume boosted.');
