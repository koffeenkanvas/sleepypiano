const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Isolate the iPad-specific diagnostics so they don't appear on PC
const oldDiag = /const osc = new Tone\.Oscillator\(\)\.toDestination\(\);[\s\S]+?alert\("Audio Context: " \+ Tone\.context\.state \+ " \(Build v2\.2\)"\);/;
const newDiag = `if (isMobile) {
       const osc = new Tone.Oscillator().toDestination();
       osc.start().stop("+0.1"); // Explicit hardware "nudge" for iPad/iPhone
       alert("Audio Context: " + Tone.context.state + " (Build v2.3 Diagnostics)");
    }`;

if (js.match(oldDiag)) {
  js = js.replace(oldDiag, newDiag);
}

// Update version to v2.3
js = js.replace(/Build: v2\.2/g, 'Build: v2.3');

fs.writeFileSync('main.js', js);
console.log('main.js isolated mobile diagnostics. PC warning removed.');
