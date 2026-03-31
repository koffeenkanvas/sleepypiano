const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// 1. Add Hardware Primer to mainBtn click handler
const primerCode = `
    const osc = new Tone.Oscillator().toDestination();
    osc.start().stop("+0.1"); // Explicit hardware "nudge" for iPad/iPhone
    alert("Audio Context: " + Tone.context.state + " (Build v2.2)");
`;
js = js.replace(/await Tone\.context\.resume\(\);/, `await Tone.context.resume();\n${primerCode}`);

// 2. Add onerror to Sampler
const samplerError = `
  onerror: (err) => {
    console.error("Sampler Error:", err);
    alert("Piano sounds failed to load from internet. Check your connection or iPad security settings!");
  },
`;
if (!js.includes('onerror:')) {
  js = js.replace(/baseUrl: "https:\/\/tonejs\.github\.io\/audio\/salamander\/"/, `baseUrl: "https://tonejs.github.io/audio/salamander/",\n${samplerError}`);
}

// 3. Further boost backingSynth for iPad (+2dB more)
js = js.replace(/isMobile \? -6 : -14\.5/, `isMobile ? -4 : -14.5`);

// 4. Update diagnostic build messages
js = js.replace(/v=2\.1/g, 'v=2.2');
js = js.replace(/Build: v2\.1/g, 'Build: v2.2');

fs.writeFileSync('main.js', js);
console.log('main.js iPad hardware primer and v2.2 diagnostics complete.');
