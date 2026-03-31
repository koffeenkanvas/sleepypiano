const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Convert absolute paths back to relative for local/prod compatibility
// (Vite serves the public folder at root, but 'filename.mid' is more universal than '/filename.mid' for dev servers)
js = js.replace(/url = '\/hey-jude.mid/g, "url = 'hey-jude.mid");
js = js.replace(/url = '\/lovely-full.mid/g, "url = 'lovely-full.mid");

// Update cache-buster and build message
js = js.replace(/v=1.6/g, 'v=1.7');
js = js.replace(/Build: v1.6/g, 'Build: v1.7');

fs.writeFileSync('main.js', js);
console.log('main.js MIDI paths restored to relative.');
