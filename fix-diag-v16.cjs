const fs = require('fs');
let js = fs.readFileSync('main.js', 'utf8');

// Update the alert to show the absolute URL and version
const oldAlert = 'alert("Backtrack not playing: " + url + "\\nReason: " + err.message + "\\nTry refreshing or checking if the file is in your GitHub repo!");';
const newAlert = 'alert("Backtrack not playing: " + new URL(url, window.location.href).href + "\\nReason: " + err.message + "\\nBuild: v1.6");';

if (js.includes('alert("Backtrack not playing: " + url')) {
  js = js.replace(oldAlert, newAlert);
} else {
  // If the previous replace failed or changed slightly, try a more generic one
  js = js.replace(/alert\("Backtrack not playing: ".+?\);/, newAlert);
}

// Ensure v1.6 in the URLs too
js = js.replace(/v=1.5/g, 'v=1.6');

fs.writeFileSync('main.js', js);
console.log('main.js diagnostic alert updated to Build v1.6.');
