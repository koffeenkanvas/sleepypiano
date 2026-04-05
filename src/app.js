import { initKeyboard, setupKeyboardListeners } from './ui/keyboardView.js';
import { prepLesson } from './lesson/lessonModes.js';
import { initTeacher } from './ui/teacherBoardView.js';
import { PianoIntro } from './intro/pianoIntro.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', () => {
  initKeyboard();
  setupKeyboardListeners();
  prepLesson('hey_jude');
  initTeacher();

  // ─── 3D INTRO BOOT (Lazy Load) ─────────────────────────────────────────────
  setTimeout(() => {
    new PianoIntro();
  }, 500);

  // Smoothly fade in the app when scrolling past the intro
  const appWrapper = document.getElementById('app-wrapper');
  if (appWrapper) {
    ScrollTrigger.create({
      trigger: appWrapper,
      start: "top 85%",
      onEnter: () => appWrapper.classList.add('visible'),
      onLeaveBack: () => appWrapper.classList.remove('visible')
    });
  }
});
