import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { SONG_CONFIG } from '../data/songConfig.js';
import { state } from '../lesson/lessonState.js';
import { reverb } from './pianoEngine.js';

export const backingSynth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: 'sine' },
  envelope: { attack: 0.5, decay: 0.5, sustain: 0.8, release: 0.8 }
}).connect(reverb).toDestination();
backingSynth.volume.value = -12;

export async function loadBackingTrack(songId) {
  state.backingChordsData = [];
  const cfg = SONG_CONFIG[songId];
  if (!cfg || !cfg.midi) return;

  try {
    const resp = await fetch(cfg.midi);
    if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
    const ab = await resp.arrayBuffer();
    const midi = new Midi(ab);
    const track = midi.tracks[cfg.track || 0];
    if (track) {
      track.notes.forEach(n => {
        const rawBeat = n.ticks / midi.header.ppq;
        const shiftedBeat = rawBeat - (cfg.offset || 0);
        if (shiftedBeat >= 0) {
          state.backingChordsData.push({
            note: n.name,
            beat: shiftedBeat,
            duration: n.durationTicks / midi.header.ppq
          });
        }
      });
    }
  } catch (err) {
    console.error("Backing track error:", err);
    const hintEl = document.getElementById('song-hint');
    if (hintEl) hintEl.textContent = '⚠ backing track unavailable';
  }
}
