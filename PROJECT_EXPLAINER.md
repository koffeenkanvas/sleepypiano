# 🎹 SleepyKeys: The Master Technical Guide (Beginner Edition)

Since you are coming from an **AI/ML background**, you likely understand data and logic well. However, web-native systems like 3D graphics and audio processing have their own "magic." This guide is designed to explain **each and everything** about how your vision was turned into this website.

---

## 🏗️ 1. The "Foundation" (How it fits together)

This website uses a **Tech Stack** (a set of tools) that handles different parts of the reality you see on the screen:

*   **Vite:** This is our "Engine." It takes all our separate files and bundles them together so the browser can read them efficiently.
*   **Three.js:** Our "3D World Builder." It handles the piano, the lights, and the water.
*   **Tone.js:** Our "Musician." It handles the actual piano notes you play.
*   **GSAP (GreenSock):** Our "Director." It manages all the movement, from the camera spinning to the music fading.

---

## 🌫️ 2. The Visual Layers (HTML & CSS)

Think of your website as a stack of **transparent glass sheets** (Layers):

1.  **Layer 1 (The Entry Screen):** The "Tap to enter" screen. It has a high `z-index`, meaning it's on top of everything else. When you click it, we set its `opacity` to 0, letting you see the layers beneath.
2.  **Layer 2 (The 3D Canvas):** This is where the 3D intro lives. It is `position: fixed`, so it stays perfectly still as you scroll, while we move the 3D camera inside it.
3.  **Layer 3 (The App UI):** These are the buttons, song selectors, and the piano keyboard. They are hidden (`opacity: 0`) initially and only fade in when you scroll down.
4.  **Layer 4 (The Footer):** The credits at the very bottom.

> [!TIP]
> **Glassmorphism:** You’ll see the word `backdrop-filter: blur(15px)` in the CSS. This is what makes the UI panels look like frosted glass—they blur whatever 3D particles are floating behind them.

---

## 🌌 3. The 3D World (Three.js)

Everything in `src/intro/pianoIntro.js` is about math and light.

### **The Camera Orbit**
To make the camera spin, we use **Circular Trigonometry** (Sine and Cosine). 
```javascript
this.camera.position.x = Math.cos(angle) * radius;
this.camera.position.z = Math.sin(angle) * radius;
```
If you change the `angle` over time, the camera moves in a perfect circle around the piano (the center point).

### **The Water Floor**
The water isn't a video. It's a "Plane" made of thousands of tiny points (vertices). We use a **Vertex Shader** to tell each point to move up and down based on its position and time. This creates a "Sine Wave" ripple effect.

### **Bloom & Post-Processing**
We don't just render the scene and stop. we use an `EffectComposer`. Think of this as a **Live Filter** (like an Instagram filter) that looks for bright spots on the piano and fireflies and adds a "Glow" (the `UnrealBloomPass`) to make it look cinematic.

---

## 🎵 4. The Audio Engines (Tone.js & MP3)

There are two *totally different* ways audio is happening here:

### **A. Background Music (The MP3 Player)**
The `canonindAJ.mp3` is like a YouTube video. It’s a pre-recorded file.
*   **The Problem:** Browsers block audio until you click something.
*   **The Fix:** That's why we have the "Tap to enter" screen. It "unlocks" the audio so we can play the MP3.
*   **Volume Scrubbing:** We use **GSAP ScrollTrigger** to connect your scrollbar to the `audio.volume` property. As you scroll closer to the piano, the code says: *"The more pixels the user has scrolled, the lower the volume should be."*

### **B. The Piano Synth (The Instrument)**
The piano notes you play are **not** an MP3. They are generated in real-time.
*   **Sampler:** We have a list of real piano recordings (A0, C1, etc.). When you strike a key, Tone.js "pitches" those samples to the correct note and plays them.
*   **Polyphony:** This means you can play 10 notes at once, and Tone.js will mix them together perfectly without lagging.

---

## 🧠 5. The Teaching Logic (MIDI to Visual)

This is the most "Data Science" part of the project.

1.  **The "Raw" Data:** We start with a string in `songs.js` like `E4@1.5,0.5`.
2.  **The Parser:** `lessonParser.js` splits this string. It sees `E4` (the note), `1.5` (when to play it), and `0.5` (how long to hold it).
3.  **The Timeline:** 
    *   In **Step Mode**, the app waits for an input. It checks: *"Did the user press the key associated with E4?"*
    *   If yes, it moves the "Pointer" to the next note in the array.
4.  **Backing Track Filter:** To make you feel like the star, I wrote a filter in `lessonModes.js`. It checks the backing track chords. If a chord has an "E4" note at the same time you are supposed to play "E4," **it Mutes the computer's note** so you are the only one playing that specific melody note.

---

## 🎬 6. The "Glue" (GSAP & ScrollTrigger)

Finally, how does the Intro "know" when it's done?

In `app.js`, we use **GSAP**. Think of it as a Timeline with markers:
*   **Marker 1:** When the page loads, play the Intro Animation.
*   **Marker 2:** When the user scrolls past the first section, start moving the 3D camera.
*   **Marker 3:** When the `#app-wrapper` reaches `top 85%`, fade in the piano controls.

We used a **Handoff Logic**:
When the 3D Intro completes its first automatic spin, we "Kill" the automatic movement and "Hand the Keys" to the user's scrollbar. This is why it feels like a seamless transition from a movie to a website.

---

## 🚀 Key Takeaways for an AI/ML Dev:
*   **State Management:** The `lessonState.js` is essentially your "Global Model." It tracks which mode we are in, which song is playing, and what note comes next.
*   **Procedural Generation:** The water and firefly motions are examples of "Procedural Content"—everything is calculated on the fly, not pre-baked.
*   **Optimization:** 3D worlds are heavy. We use things like `powerPreference: "high-performance"` and `DPR` (Pixel Ratio) management to make sure it doesn't crash a user's computer.

**You have built a sophisticated digital world. You provided the vision; I provided the math and engineering. Together, we made SleepyKeys.** 🎹 🖤 ✨
