import { initKeyboard, setupKeyboardListeners } from './ui/keyboardView.js';
import { prepLesson } from './lesson/lessonModes.js';
import { initTeacher } from './ui/teacherBoardView.js';
import { initBgMusic, stopBgMusicPermanently, audio, isUserPlaying, clearFadeInterval } from './audio/bgMusic.js';
import { PianoIntro } from './intro/pianoIntro.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.addEventListener('DOMContentLoaded', () => {
  initKeyboard();
  setupKeyboardListeners();
  prepLesson('hey_jude');
  initTeacher();
  initBgMusic();

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
      onEnter: () => {
        appWrapper.classList.add('visible');
      },
      onLeaveBack: () => {
        appWrapper.classList.remove('visible');
      }
    });

    // 🎬 CUSTOM VOLUME SCRUB (Gradual fade from Ready to Play -> Piano)
    gsap.to(audio, {
      volume: 0,
      ease: "none",
      scrollTrigger: {
        trigger: "#intro-sec-5",
        start: "top center", // Start fading as Ready to Play is centered
        endTrigger: "#app-wrapper",
        end: "top 10%",     // Fully silent by the time piano is focused
        scrub: true,
        onUpdate: (self) => {
          if (isUserPlaying) {
             self.kill();
             audio.volume = 0;
          } else {
             clearFadeInterval();
          }
        }
      }
    });
  }
});
