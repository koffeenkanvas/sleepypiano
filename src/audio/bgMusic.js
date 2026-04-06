let hasPlayed = false;
export let isUserPlaying = false;
let isLoopFading = false;
export let audio = null;
let fadeInterval = null;

export function clearFadeInterval() {
  if (fadeInterval) {
    clearInterval(fadeInterval);
    fadeInterval = null;
  }
}

export function initBgMusic() {
  const entry = document.getElementById("entry-screen");
  audio = document.getElementById("bg-music");

  if (!entry || !audio) return;

  entry.addEventListener("click", () => {
    startBgMusic();
    
    // Visual fade out
    entry.style.opacity = "0";
    entry.style.filter = "blur(10px)";

    setTimeout(() => {
      entry.style.display = "none";
    }, 1200);
  });

  // Dreamy loop blend: Fade out, jump to 5s, fade back in
  audio.addEventListener("timeupdate", () => {
    if (isUserPlaying || !audio.duration || isLoopFading) return;
    
    // Begin fade out 18 seconds before the end
    if (audio.currentTime >= audio.duration - 18.0) {
      isLoopFading = true;
      let vol = audio.volume;
      
      const fadeOut = setInterval(() => {
        if (vol > 0) {
          vol -= 0.01;
          if (audio) audio.volume = Math.max(vol, 0);
        } else {
          clearInterval(fadeOut);
          
          // Jump back to 2m 09s (129s)
          if (audio) audio.currentTime = 129.0;
          
          // Fade back in
          const fadeIn = setInterval(() => {
            if (vol < 0.3) {
              vol += 0.01;
              if (audio) audio.volume = Math.min(vol, 0.3);
            } else {
              clearInterval(fadeIn);
              isLoopFading = false;
            }
          }, 80);
        }
      }, 40); // Fast but smooth volume decay
    }
  });
}

function startBgMusic() {
  if (hasPlayed || !audio) return;

  audio.currentTime = 129.0; // Start at 2m 09s as requested
  audio.volume = 0;
  audio.play().catch(e => console.log("Audio play blocked by browser:", e));

  let vol = 0;
  fadeInterval = setInterval(() => {
    if (vol < 0.3) {
      vol += 0.01;
      audio.volume = Math.min(vol, 0.3);
    } else {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
  }, 80);

  hasPlayed = true;
}


function fadeTo(targetVol, duration, callback) {
  if (!audio) return;
  clearFadeInterval();
  
  const step = 0.02;
  const intervalTime = (duration * step) / Math.abs(audio.volume - targetVol || 0.01);
  
  fadeInterval = setInterval(() => {
    if (Math.abs(audio.volume - targetVol) < step) {
      audio.volume = targetVol;
      if (targetVol === 0) audio.pause();
      clearInterval(fadeInterval);
      if (callback) callback();
    } else {
      if (audio.volume < targetVol) {
        audio.volume = Math.min(audio.volume + step, targetVol);
      } else {
        audio.volume = Math.max(audio.volume - step, targetVol);
      }
    }
  }, 30);
}

export function fadeOutBgMusic() {
  if (isUserPlaying || !audio || audio.paused) return;
  fadeTo(0, 500);
}

export function fadeInBgMusic() {
  if (isUserPlaying || !audio || !hasPlayed) return;
  if (audio.paused) {
    audio.play().catch(() => {});
  }
  fadeTo(0.3, 500);
}

export function stopBgMusicPermanently() {
  if (isUserPlaying || !audio) return;
  isUserPlaying = true;
  fadeTo(0, 400, () => {
    audio.pause();
  });
}
