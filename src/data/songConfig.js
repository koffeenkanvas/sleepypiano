export const SONG_CONFIG = {
  hey_jude:          { midi: 'hey-jude.mid?v=2.2',    track: 4, offset: 3, bpm: 90  },
  lovely:            { midi: 'lovely-full.mid?v=2.2', track: 0, offset: 0, bpm: 150, melodyTrack: 1 },
  bohemian_rhapsody: { bpm: 120 }
};

export function getSongBpm(songId) {
  return (SONG_CONFIG[songId] && SONG_CONFIG[songId].bpm) || 90;
}

export const PIANO_KEYS = [
  { note: 'C3',  type: 'white', key: '1' },
  { note: 'C#3', type: 'black', key: '2' },
  { note: 'D3',  type: 'white', key: '3' },
  { note: 'D#3', type: 'black', key: '4' },
  { note: 'E3',  type: 'white', key: 'z' },
  { note: 'F3',  type: 'white', key: 'x' },
  { note: 'F#3', type: 'black', key: 'c' },
  { note: 'G3',  type: 'white', key: 'v' },
  { note: 'G#3', type: 'black', key: 'b' },
  { note: 'A3',  type: 'white', key: 'n' },
  { note: 'A#3', type: 'black', key: ',' },
  { note: 'B3',  type: 'white', key: 'm' },
  { note: 'C4',  type: 'white', key: 'a' },
  { note: 'C#4', type: 'black', key: 'w' },
  { note: 'D4',  type: 'white', key: 's' },
  { note: 'D#4', type: 'black', key: 'e' },
  { note: 'E4',  type: 'white', key: 'd' },
  { note: 'F4',  type: 'white', key: 'f' },
  { note: 'F#4', type: 'black', key: 't' },
  { note: 'G4',  type: 'white', key: 'g' },
  { note: 'G#4', type: 'black', key: 'y' },
  { note: 'A4',  type: 'white', key: 'h' },
  { note: 'A#4', type: 'black', key: 'u' },
  { note: 'B4',  type: 'white', key: 'j' },
  { note: 'C5',  type: 'white', key: 'k' },
  { note: 'C#5', type: 'black', key: 'i' },
  { note: 'D5',  type: 'white', key: 'l' },
  { note: 'D#5', type: 'black', key: 'o' },
  { note: 'E5',  type: 'white', key: ';' },
  { note: 'F5',  type: 'white', key: "'", display: "'" },
  { note: 'F#5', type: 'black', key: '[' },
  { note: 'G5',  type: 'white', key: 'enter', display: 'ENT' },
  { note: 'G#5', type: 'black', key: ']' },
  { note: 'A5',  type: 'white', key: '\\' },
  { note: 'A#5', type: 'black', key: '7' },
  { note: 'B5',  type: 'white', key: '8' }
];

export const NOTE_NAMES = {
  'C': 'C', 'C#': 'C♯ / D♭', 'D': 'D', 'D#': 'D♯ / E♭',
  'E': 'E', 'F': 'F', 'F#': 'F♯ / G♭', 'G': 'G',
  'G#': 'G♯ / A♭', 'A': 'A', 'A#': 'A♯ / B♭', 'B': 'B'
};

export const MODE_DESC = {
  step: "Press each note at your own pace. The song waits for you.",
  follow: "Play along with the backing track. The song keeps moving.",
  autoplay: "Sit back and watch the song play itself.",
  repeat: "Listen to a phrase, then try to play it back from memory."
};
