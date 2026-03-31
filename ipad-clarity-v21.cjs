const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// 1. Boost filter frequency for iPad/Mobile (Laptop stays at 700Hz)
js = js.replace(/isMobile \? 900 : 700/, `isMobile ? 1500 : 700`);

// 2. Boost backing volume for iPad/Mobile (Laptop stays at -14.5)
js = js.replace(/isMobile \? -9 : -14\.5/, `isMobile ? -6 : -14.5`);

// 3. Add Loading Diagnostic to start button
const diagnosticCode = `
    console.log("Audio Diagnostic: Synth Loaded =", synth.loaded);
    if (!synth.loaded) {
       alert("Wait! The piano sounds are still downloading... Please try again in 5 seconds.");
       return;
    }
`;
if (!js.includes('synth.loaded')) {
  js = js.replace(/await Tone\.context\.resume\(\);/, `await Tone.context.resume();\n${diagnosticCode}`);
}

// 4. Update diagnostic build messages
js = js.replace(/v=2\.0/g, 'v=2.1');
js = js.replace(/Build: v2\.0/g, 'Build: v2.1');

fs.writeFileSync('main.js', js);
console.log('main.js iPad presence boost complete. Laptop settings preserved.');
