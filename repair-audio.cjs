const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Fix 1: Change 'beat' back to 'time' in backing track data
js = js.replace(/beat: shiftedBeat,/g, 'time: shiftedBeat,'); // Fix key naming mismatch

// Fix 2: Use relative paths for local and Vercel compatibility
js = js.replace(/url = 'hey-jude.mid'/g, "url = './hey-jude.mid'");
js = js.replace(/url = 'lovely-full.mid'/g, "url = './lovely-full.mid'");

// Fix 3: Add diagnostic alerts to help find the 404 cause
const oldFetch = 'const resp = await fetch(url);';
const newFetch = `
     try {
       const resp = await fetch(url + "?v=1.4");      
       if(!resp.ok) {
          throw new Error("MIDI Load Error: " + resp.status + " " + resp.statusText);
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
               time: shiftedBeat,
               duration: n.durationTicks / midi.header.ppq
             });
           }
         });
       }
     } catch (err) {
        alert("Audio failed: " + url + "\\n" + err.message);
     }
`;

// Only apply if not already updated
if (!js.includes('alert("Audio failed:')) {
  js = js.replace(/try {\s+const resp = await fetch\(url\);.*?if\(track\)\s+{.*?}\s+}\s+}/s, newFetch);
}

fs.writeFileSync('main.js', js);
console.log('main.js audio engine repaired.');
