const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Update to clean filenames for Vercel
js = js.replace(/\/Hey-Jude-1\.mid/g, '/hey-jude.mid');
js = js.replace(/\/Billie Eilish - Lovely\.mid/g, '/lovely-full.mid');

fs.writeFileSync('main.js', js);
console.log('main.js MIDI paths updated.');
