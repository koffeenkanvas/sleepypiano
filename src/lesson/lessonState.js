export const state = {
  activeHoldNote: null,
  lessonLines: [],
  currentLineIndex: -1,
  currentNoteInLine: 0,
  isLessonActive: false,
  isAutoplayActive: false,
  currentMode: "step",
  currentSongId: 'hey_jude',
  
  // Repeat After Me
  repeatLineIndex: 0,
  repeatExpectedNotes: [],
  repeatNoteIndex: 0,
  repeatListening: false,
  
  // Free Play
  isFreePlaying: false,
  fpNoteHistory: [],

  // Track data
  backingChordsData: []
};

export const pressedKeys = new Set();
export const keyElementsMap = new Map();
