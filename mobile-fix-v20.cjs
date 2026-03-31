const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// 1. Add Mobile Detection at the top
const mobileDetectCode = `
// Smart Device Detection (Mobile/Tablet vs Laptop)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
`;
if (!js.includes('isMobile')) {
  js = js.replace(/import { Midi } from '@tonejs\/midi';/, `import { Midi } from '@tonejs/midi';\n${mobileDetectCode}`);
}

// 2. Conditional Filter and Volume settings
js = js.replace(/const feltFilter = new Tone.Filter\(700, "lowpass"\)/, `const feltFilter = new Tone.Filter(isMobile ? 900 : 700, "lowpass")`);
js = js.replace(/backingSynth\.volume\.value = -14\.5;/, `backingSynth.volume.value = isMobile ? -9 : -14.5;`);

// 3. Audio Unlock in mainBtn click handler
const unlockCode = `
    if (Tone.context.state !== 'running') await Tone.start();
    await Tone.context.resume(); // Explicit unlock for iPad/Mobile
`;
js = js.replace(/if \(Tone\.context\.state !== 'running'\) await Tone\.start\(\);/, unlockCode);

// 4. Update diagnostic build messages
js = js.replace(/v=1.7/g, 'v=2.0');
js = js.replace(/Build: v1.8/g, 'Build: v2.0');

fs.writeFileSync('main.js', js);
console.log('main.js mobile detection and audio unlocking complete.');
