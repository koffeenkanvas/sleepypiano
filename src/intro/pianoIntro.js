import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

gsap.registerPlugin(ScrollTrigger);

export class PianoIntro {
  constructor() {
    this.container = document.getElementById('intro-container');
    this.canvas = document.getElementById('intro-canvas');
    if (!this.container || !this.canvas) return;

    // Step 1: Intro State
    this.isIntroPlaying = true;
    this.introProgress = 0;

    // Step 2: Cinematic Intro Camera Path (Reveal from Left-Back)
    // End position is precisely calculated to match scroll start (theta: 1.15, radius: 5.5, height: 2.0)
    this.introCamera = {
      start: new THREE.Vector3(-6, 3.2, 5.5),
      end: new THREE.Vector3(2.24, 2.0, 5.02),
      lookStart: new THREE.Vector3(0, 0, 0),
      lookEnd: new THREE.Vector3(0.4, -0.2, 0)
    };

    // Fade in from black
    this.canvas.style.opacity = '0';
    gsap.to(this.canvas, {
      opacity: 1,
      duration: 1.8,
      ease: "power2.out"
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x02030a);
    this.scene.fog = new THREE.FogExp2(0x02030a, 0.035); // 🎯 Step 3: Cinematic haze density

    new EXRLoader().load('/monochrome_studio_02_1k.exr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;

      this.scene.environment = texture;
      this.scene.environmentIntensity = 0.22;
    });

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(2.4, 1.9, 4.8);
    this.camera.lookAt(0, -0.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
      powerPreference: "high-performance" // 🎯 Step 6: GPU priority
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    const isMobile = window.innerWidth < 768;
    this.renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5));
    this.renderer.setClearColor(0x02030a); // 🎯 Step 1: Deep blue-black clear color
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.72;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.useLegacyLights = false;

    // Performance: DRACO Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);

    // FIX 6: MAGIC BLOOM (Post-processing)
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      0.65, // 🎯 Step 3: Intense film glow boost
      0.8,  // Higher radius for bleed
      0.7   // Threshold to only glow highlights
    );
    this.composer.addPass(bloomPass);

    this.piano = null;
    this.water = null;
    this.waterNormalMap = null;
    this.isRendering = true;

    // Performance: Render-on-demand 
    this.setupObserver();
    
    this.init();
  }

  setupObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        this.isRendering = entry.isIntersecting;
      });
    }, { threshold: 0.1 });
    this.observer.observe(this.container);
  }

  async init() {
    this.addLights();
    this.addWater();
    this.addParticles();
    await this.loadPiano();

    // 🎯 Step 3: EARLY SCROLL PREP
    this.setupScrollAnimations();
    ScrollTrigger.getAll().forEach(st => st.disable());

    // 🎯 Step 4: FIRST TEXT APPEARS FIRST (Immediate reveal)
    gsap.fromTo(
      '#intro-sec-1 .intro-text',
      { opacity: 0, y: 30, scale: 0.92 }, // 🎯 Step 4: Scale start
      {
        opacity: 1,
        y: 0,
        scale: 1, // 🎯 Step 4: Film title reveal
        duration: 1.2,
        delay: 0.1,    
        ease: "power3.out"
      }
    );

    // Step 5: Master Intro Animation
    gsap.to(this, {
      introProgress: 1,
      duration: 2.8,
      ease: "power2.out",
      onUpdate: () => {
        const t = this.introProgress;

        // 🎯 Step 1: True Cinematic Orbit (Wrap-around motion)
        const radius = 6.8 - t * 2.3; // Zoom in
        const angle = -Math.PI * 0.6 + t * Math.PI * 1.55; // Wrap path

        this.camera.position.x = Math.cos(angle) * radius;
        this.camera.position.z = Math.sin(angle) * radius;
        this.camera.position.y = 2.8 - t * 0.8;

        this.camera.lookAt(0.3, -0.2, 0); 
      },
      onComplete: () => {
        // 🎯 Step 3: HARD HANDOFF (Stop intro path from fighting scroll)
        gsap.killTweensOf(this.camera.position);

        // Step 6: Smooth Handoff Buffer
        gsap.to({}, {
          duration: 0.1,
          onComplete: () => {
            this.isIntroPlaying = false;
            ScrollTrigger.getAll().forEach(st => st.enable());
          }
        });
      }
    });

    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  addWater() {
    const geometry = new THREE.PlaneGeometry(200, 200, 128, 128);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#8080ff';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 140; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = 8 + Math.random() * 18;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(180, 190, 255, 0.10)');
        grad.addColorStop(1, 'rgba(128, 128, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const normalMap = new THREE.CanvasTexture(canvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(7, 7);
    this.waterNormalMap = normalMap;

    const material = new THREE.MeshStandardMaterial({
      color: 0x0a1020,     // 🎯 Step 2: Separate from void
      metalness: 0.22,
      roughness: 0.32,     // 🎯 Step 2: Shinier
      envMapIntensity: 0.35, // 🎯 Step 2: Mirror-like
      normalMap: this.waterNormalMap,
      normalScale: new THREE.Vector2(0.08, 0.08),
      transparent: true,
      opacity: 0.96
    });

    // 🎯 Step 2: GROUND GLOW (Stage illusion)
    const groundGlow = new THREE.Mesh(
      new THREE.CircleGeometry(6, 64),
      new THREE.MeshBasicMaterial({
        color: 0x1a2a5a,
        transparent: true,
        opacity: 0.12,
        depthWrite: false
      })
    );
    groundGlow.rotation.x = -Math.PI / 2;
    groundGlow.position.y = -1.06;
    this.scene.add(groundGlow);

    material.onBeforeCompile = (shader) => {
      shader.uniforms.time = { value: 0 };

      // Vertex Logic: Layered ripples + passing UV
      shader.vertexShader = `uniform float time;\nvarying vec2 vUv;\n` + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vUv = uv;
        vec3 transformed = vec3(position);
        transformed.z += sin(position.x * 0.7 + time * 0.8) * 0.02;
        transformed.z += cos(position.y * 0.6 + time * 0.7) * 0.02;
        transformed.z += sin((position.x + position.y) * 1.2 + time * 1.3) * 0.008; // Layer 2
        `
      );

      // Fragment Logic: Fresnel + Horizon Gradient
      shader.fragmentShader = `varying vec2 vUv;\nfloat fresnel;\n` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `#include <common>
         varying vec3 vWorldPosition;
         varying vec3 vNormal;`
      ).replace(
        '#include <output_fragment>',
        `
        float fresnel = pow(1.0 - dot(normalize(vNormal), vec3(0.0,1.0,0.0)), 2.0);
        gl_FragColor.rgb += fresnel * 0.15;
        // 🎯 Step 1: Specific horizon glow shift
        gl_FragColor.rgb += vec3(0.03, 0.06, 0.12) * (1.0 - vUv.y);
        #include <output_fragment>
        `
      );

      this.waterShader = shader;
    };

    this.water = new THREE.Mesh(geometry, material);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -1.08;
    this.scene.add(this.water);
  }

  addLights() {
    const ambient = new THREE.AmbientLight(0x0b1020, 0.18);
    this.scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffffff, 0.42);
    key.position.set(-2.5, 3.2, 2.8);
    this.scene.add(key);

    const rim = new THREE.DirectionalLight(0x8ea6ff, 0.32);
    rim.position.set(2.8, 1.8, -3.5);
    this.scene.add(rim);

    const warmAccent = new THREE.DirectionalLight(0xffd6a0, 0.10);
    warmAccent.position.set(-1.5, 1.2, 1.5);
    this.scene.add(warmAccent);

    // Step 1: TARGETED FOCUS LIGHT (Spotlight)
    const focusLight = new THREE.SpotLight(0xffffff, 0.6, 10, Math.PI / 6, 0.5, 1);
    focusLight.position.set(0, 3.5, 2.5);
    focusLight.target.position.set(0, -1, 0);
    this.scene.add(focusLight);
    this.scene.add(focusLight.target);

    // 🎯 Step 4: DEPTH LAYERING (Ambient Haze)
    this.haze = new THREE.PointLight(0x3a5bff, 0.25, 15);
    this.haze.position.set(2, 3, -4);
    this.scene.add(this.haze);

    this.warm = new THREE.PointLight(0xffaa88, 0.15, 10);
    this.warm.position.set(-2, 2, 2);
    this.scene.add(this.warm);

    // 🎯 Step 1: HORIZON GLOW (Depth layered)
    const horizon = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 20),
      new THREE.MeshBasicMaterial({
        color: 0x1a2a5a,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide
      })
    );
    horizon.position.set(0, 5, -12);
    this.scene.add(horizon);

    // 🎯 Step 1: MIDGROUND LAYER (Volumetric Fog)
    const fogGeo = new THREE.PlaneGeometry(30, 30);
    const fogMat = new THREE.MeshBasicMaterial({
      color: 0x1a2a5a,
      transparent: true,
      opacity: 0.06,
      depthWrite: false
    });
    const fog = new THREE.Mesh(fogGeo, fogMat);
    fog.position.set(0, 2, -5); 
    this.scene.add(fog);
  }

  addParticles() {
    const count = 120; // 🎯 Step 3: Immersive density (tripled)
    const positions = [];
    const colors = [];
    const scales = [];

    const spriteCanvas = document.createElement('canvas');
    spriteCanvas.width = 64;
    spriteCanvas.height = 64;
    const sctx = spriteCanvas.getContext('2d');
    const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.25, 'rgba(255,245,220,0.9)');
    g.addColorStop(0.55, 'rgba(255,220,160,0.35)');
    g.addColorStop(1, 'rgba(255,200,120,0)');
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);
    const sprite = new THREE.CanvasTexture(spriteCanvas);

    const radius = 10;
    for (let i = 0; i < count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);
        const r = radius * (0.4 + Math.random() * 0.6);

        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = Math.random() * 4 + 0.2;
        const z = r * Math.sin(phi) * Math.sin(theta);

        // 🎯 Step 1: Avoid piano collision (keep center clear)
        if (Math.abs(x) < 2.5 && Math.abs(z) < 2.5) continue;

        positions.push(x, y, z);

        // 🎯 Step 2: Depth-aware scale/opacity (Illusion of space)
        const depthFactor = (z + 10) / 10; // 0 (far) to 1 (near)
        
        let r_p, g_p, b_p;
        if (Math.random() > 0.68) {
          r_p = 1.8 * (0.4 + depthFactor * 0.6);
          g_p = 1.35 * (0.4 + depthFactor * 0.6);
          b_p = 0.85 * (0.4 + depthFactor * 0.6);
        } else {
          r_p = 0.70 * (0.4 + depthFactor * 0.6);
          g_p = 0.90 * (0.4 + depthFactor * 0.6);
          b_p = 1.45 * (0.4 + depthFactor * 0.6);
        }
        colors.push(r_p, g_p, b_p);

        // Near particles = larger
        scales.push(0.5 + (1.0 - (z/-10)) * 2.2); 
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aScale', new THREE.Float32BufferAttribute(scales, 1));

    this.fireflyBaseColors = new Float32Array(colors);

    const material = new THREE.PointsMaterial({
      size: 0.14, // 🎯 Step 3: Cinematic scale (orb effect)
      map: sprite,
      transparent: true,
      opacity: 0.98,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  loadPiano() {
    return new Promise((resolve) => {
        // Using the new local model provided by the user
        const pianoUrl = '/grand_piano2.glb';
      
        this.loader.load(pianoUrl, (gltf) => {
          this.piano = gltf.scene;

          // 🥇 Gently enhance the new piano material without destroying its native colors
          this.piano.traverse((child) => {
            if (child.isMesh && child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              
              materials.forEach(mat => {
                const matName = mat.name ? mat.name.toLowerCase() : '';
                
                 // Add nice gloss, but avoid turning soft materials metallic
                 if (!matName.includes('felt') && !matName.includes('cloth') && !matName.includes('fabric')) {
                    mat.roughness = Math.min(mat.roughness || 0.5, 0.34); 
                    mat.metalness = Math.max(mat.metalness || 0, 0.18);   
 
                    // Step 1: Subtle color lift
                    if (mat.color) {
                       mat.color.multiplyScalar(1.25);
                       // Force lift pure black bases 
                       if (mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
                          mat.color.setRGB(0.10, 0.10, 0.11); 
                       }
                    }
                 }
   
                 // Step 1: Boost reflection ONLY on piano
                 mat.envMapIntensity = 0.45;
               });
             }
           });
 
           this.piano.scale.set(0.85, 0.85, 0.85); 
           this.piano.position.y = -1;
           this.scene.add(this.piano);
 
           // FIX 3: FAKE WATER REFLECTION (cheap + premium illusion)
           this.reflectionPiano = this.piano.clone();
           this.reflectionPiano.scale.y *= -1;
           this.reflectionPiano.position.y = -1.05;
           this.reflectionPiano.traverse((child) => {
             if (child.isMesh && child.material) {
               if (Array.isArray(child.material)) {
                 child.material = child.material.map(m => m.clone());
                 child.material.forEach(m => { m.opacity = 0.08; m.transparent = true; });
               } else {
                 child.material = child.material.clone();
                 child.material.opacity = 0.08;
                 child.material.transparent = true;
               }
             }
           });
          this.scene.add(this.reflectionPiano);
        
        resolve();
      }, undefined, (err) => {
        console.error('Error loading piano:', err);
        resolve(); // Continue even if piano fails
      });
    });
  }

  setupScrollAnimations() {
    // 🎯 Step 3: Text sections (Exclude #intro-sec-1 as it is handled manually)
    const ids = ['#intro-sec-2', '#intro-sec-3', '#intro-sec-5'];
    
    ids.forEach((id) => {
      const el = document.querySelector(`${id} .intro-text`);
      if (!el) return;

      ScrollTrigger.create({
        trigger: id,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
          if (!this.isIntroPlaying) el.classList.add('active');
        },
        onLeave: () => el.classList.remove('active'),
        onEnterBack: () => {
          if (!this.isIntroPlaying) el.classList.add('active');
        },
        onLeaveBack: () => el.classList.remove('active'),
      });
    });

    // Camera orbit object (Closer, Higher start)
    // 🎯 SEAMLESS HANDOVER: Exact Golden Coordinates (No drift)
    const orbitSettings = { 
      theta: 1.15, 
      radius: 5.5, 
      height: 2.0
    };

    gsap.to(orbitSettings, {
      theta: Math.PI * 2.2, // 🎯 Step 2: Full 360+ orbital sweep 
      radius: 15,          // 🎯 Step 2: Cinematic zoom-out
      height: 8.5,         // 🎯 Step 2: High-crane rise
      ease: "none", 
      overwrite: "auto", 
      scrollTrigger: {
        trigger: "#intro-container",
        start: "top top",
        end: "bottom top+=9000", // 🎯 Step 4: Massive exploratory journey
        scrub: 35 
      },
      onUpdate: () => {
        // 🎯 Step 2: DIRECT ORBIT CONTROL (No lag)
        const t = orbitSettings.theta;
        const radius = orbitSettings.radius;
        const height = orbitSettings.height;

        this.camera.position.x = Math.cos(t) * radius;
        this.camera.position.z = Math.sin(t) * radius;
        this.camera.position.y = height;

        this.camera.lookAt(0.3, -0.2, 0); 

        if (this.piano) {
           this.piano.rotation.y = t * 0.5; // Sync rotation directly
        }
      }
    });

    // 🎬 Step 5: CROSSFADE TRANSITION (No jank)
    gsap.set("#app-wrapper", { opacity: 0 }); // Initial state
    
    gsap.to("#app-wrapper", {
      opacity: 1,
      duration: 2,
      ease: "power2.out",
      scrollTrigger: {
        trigger: "#app-wrapper",
        start: "top 85%",
        end: "top 50%",
        scrub: true
      }
    });

    gsap.to("#intro-canvas", {
      opacity: 0,
      scrollTrigger: {
        trigger: "#app-wrapper", 
        start: "top 80%",
        end: "top 40%",
        scrub: true
      }
    });

    // Subtle piano rotation
    if (this.piano) {
      gsap.to(this.piano.rotation, {
        y: Math.PI * 0.2, // Slight extra turn
        scrollTrigger: {
          trigger: "#intro-container",
          start: "top top",
          end: "bottom top",
          scrub: 6 // Slower, heavier rotation
        }
      });
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    if (!this.isRendering) return;

    const time = performance.now() * 0.001;

    // 🎯 Step 4: MICRO-MOTION BREATHING (Scene feeling alive)
    if (this.piano) {
      this.piano.position.y = -1 + Math.sin(time * 0.6) * 0.035;
      this.piano.rotation.y += 0.0002; // slow idle spin
    }
    
    // Subtle camera breathe
    this.camera.position.y += Math.sin(time * 0.35) * 0.008;

    if (this.waterNormalMap) {
      this.waterNormalMap.offset.x += 0.00012;
      this.waterNormalMap.offset.y += 0.00008;
    }

    if (this.waterShader) {
      this.waterShader.uniforms.time.value = time;
    }

    // 🎯 Step 5: DYNAMIC ENVIRONMENT LIFE (Light breathing)
    this.scene.children.forEach(obj => {
      if (obj.isPointLight) {
        // Subtle flicker/pulse
        const base = obj === this.haze ? 0.25 : 0.15;
        obj.intensity = base + Math.sin(time * 2.2) * 0.04;
      }
    });

    // 🎯 Step 3: CAMERA-SYNCED TEXT INTERACTION
    const activeText = document.querySelector('.intro-text.active h2');
    if (activeText) {
      const z = this.camera.position.z;
      // Formula: text reacts to proximity/light of piano
      const opacityProg = Math.min(1, Math.max(0.6, z / 5.5));
      activeText.style.opacity = opacityProg;
    }

    if (this.reflectionPiano) {
      this.reflectionPiano.position.y = -1.05 + Math.sin(time * 0.6) * 0.025;
      this.reflectionPiano.rotation.y = this.piano ? this.piano.rotation.y : 0;
    }

    if (this.particles) {
      // 🎯 Step 4: FLOATING AIR ILLUSION (Parallax)
      this.particles.position.copy(this.camera.position).multiplyScalar(0.1);
      
      this.particles.rotation.y += 0.00018;

      const pos = this.particles.geometry.attributes.position;
      const col = this.particles.geometry.attributes.color;

      for (let i = 0; i < pos.count; i++) {
        const ix = i * 3;

        pos.array[ix + 1] += Math.sin(time * 0.7 + i * 1.37) * 0.00045;
        pos.array[ix] += Math.cos(time * 0.35 + i * 0.91) * 0.00018;
        pos.array[ix + 2] += Math.sin(time * 0.28 + i * 0.73) * 0.00015;

        // 🎯 Step 3: Stronger shimmer/flicker (Vibrant life)
        const flicker = 0.6 + 0.8 * Math.sin(time * (2.2 + (i % 5) * 0.2) + i * 2.2);

        col.array[ix] = this.fireflyBaseColors[ix] * flicker;
        col.array[ix + 1] = this.fireflyBaseColors[ix + 1] * flicker;
        col.array[ix + 2] = this.fireflyBaseColors[ix + 2] * flicker;
      }

      pos.needsUpdate = true;
      col.needsUpdate = true;
    }

    if (this.aurora) {
      this.aurora.rotation.y += 0.0002;
    }

    this.composer.render();
  }
}
