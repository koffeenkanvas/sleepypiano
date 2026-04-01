const fs = require('fs');
const content = fs.readFileSync('main.js', 'utf8');
const lines = content.split('\n');

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Outside I can fight my fear')) {
    // Found the last lyric line. Line i+1 is the "notes" line.
    targetIdx = i + 1;
    break;
  }
}

if (targetIdx !== -1) {
  // Truncate after the notes line (targetIdx)
  // And append the closing brackets.
  const sliced = lines.slice(0, targetIdx + 1);
  const notesLine = sliced[targetIdx];
  // Remove trailing comma from the last notes line if it exists
  sliced[targetIdx] = notesLine.replace('},', '}');
  
  const tail = lines.slice(targetIdx + 1);
  // Find where getNoteBase starts
  let helperIdx = -1;
  for (let i = 0; i < tail.length; i++) {
    if (tail[i].includes('function getNoteBase')) {
      helperIdx = i;
      break;
    }
  }

  if (helperIdx !== -1) {
     const newLines = [
       ...sliced,
       '    ]',
       '  }',
       '};',
       '',
       ...tail.slice(helperIdx)
     ];
     fs.writeFileSync('main.js', newLines.join('\n'));
     console.log('Successfully truncated main.js');
  } else {
     console.error('Could not find getNoteBase helper');
  }
} else {
  console.error('Could not find target line');
}
