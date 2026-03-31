const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Remove leading slash for relative pathing on Vercel
js = js.replace(/url = '\//g, "url = '");

fs.writeFileSync('main.js', js);
console.log('main.js MIDI paths converted to relative.');
