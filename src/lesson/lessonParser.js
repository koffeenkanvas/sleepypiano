// ─── NOTE PARSER ──────────────────────────────────────────────────────────────
export function getNoteBase(note) {
  if (!note) return "";
  // Strip octaves (E3 -> E), prefixes (.G -> G), and carets (^F -> F)
  const match = note.replace(/[\.\^0-9]/g, '').match(/^[A-G]#?/);
  return match ? match[0] : note;
}

export function parseNoteString(noteStr) {
  const rawNotes = noteStr.split(/[\s-]+/).filter(n => n.trim() !== '');
  return rawNotes.map(n => {
    let name = n;
    let b = null;
    let d = null;

    if (name.includes('@')) {
      const parts = name.split('@');
      name = parts[0];
      const timingParts = parts[1].split(',');
      b = parseFloat(timingParts[0]);
      d = parseFloat(timingParts[1]);
    }

    let octave = 4;
    if (name.startsWith('^'))      { octave = 5; name = name.substring(1); }
    else if (name.startsWith('.')) { octave = 3; name = name.substring(1); }

    // Handle explicit octave suffix like "E3", "G3", "F#4", "B3"
    const lastChar = name[name.length - 1];
    if (!isNaN(parseInt(lastChar, 10))) {
      octave = parseInt(lastChar, 10);
      name = name.slice(0, -1);
    }

    if (name === 'Bb') name = 'A#';
    return { note: `${name}${octave}`, beat: b, duration: d };
  });
}
