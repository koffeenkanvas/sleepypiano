const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Convert relative paths to root paths for the public folder
js = js.replace(/url = '\.\/hey-jude.mid'/g, "url = '/hey-jude.mid?v=1.5'");
js = js.replace(/url = '\.\/lovely-full.mid'/g, "url = '/lovely-full.mid?v=1.5'");

fs.writeFileSync('main.js', js);
console.log('main.js MIDI paths converted to absolute /public root.');
