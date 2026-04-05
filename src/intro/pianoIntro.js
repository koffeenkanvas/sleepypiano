import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class PianoIntro {
  constructor() {
    this.container = document.getElementById('intro-container');
    this.canvas = document.getElementById('intro-canvas');
    if (!this.container || !this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x02030a, 0.05); // Deeper dark

    new EXRLoader().load('/monochrome_studio_02_1k.exr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;
      this.scene.environmentIntensity = 1.5; // Dialed up for strong reflections
      this.scene.environmentRotation = new THREE.Euler(0, Math.PI / 2, 0);

      // Deep dark background
      this.scene.background = new THREE.Color(0x02030a);
    });

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(2.2, 2.5, 3);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5;

    // Performance: DRACO Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);

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
    await this.loadAccents();
    this.setupScrollAnimations();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  addWater() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    
    // Create a procedural ripple/noise texture for the water's normal map
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8080ff'; 
    ctx.fillRect(0, 0, 512, 512);
    
    // Create a much smoother, ambient noise map to prevent sharp specular rings
    for (let i = 0; i < 200; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const r = Math.random() * 20;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, 'rgba(200, 200, 255, 0.15)');
        grad.addColorStop(1, 'rgba(128, 128, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    
    const normalMap = new THREE.CanvasTexture(canvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(10, 10);
    this.waterNormalMap = normalMap;

    const material = new THREE.MeshStandardMaterial({
      color: 0x0a1a3a,  // strong blue to actually reflect light
      metalness: 0.95,   
      roughness: 0.08,  // water reacts to light beautifully
      envMapIntensity: 2.0, // increased reflection per request
      normalMap: this.waterNormalMap,
      normalScale: new THREE.Vector2(0.3, 0.3), // distortions to feel alive
      transparent: true,
      opacity: 0.85     // REQUIRED so you can actually see the fake piano reflection underneath!
    });

    this.water = new THREE.Mesh(geometry, material);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -1;
    this.scene.add(this.water);
  }

  addLights() {
    // Base ambient light to prevent total disappearance
    const baseLight = new THREE.AmbientLight(0x404060, 0.4);
    this.scene.add(baseLight);

    // FIX 2: BIG AMBIENT FILL ("air light")
    this.fillLight = new THREE.HemisphereLight(0x6a5cff, 0x0a0f1f, 0.6);
    this.scene.add(this.fillLight);

    // FIX 1: TOP SOFT LIGHT (invisible but powerful)
    this.topLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.topLight.position.set(0, 6, 0); 
    this.topLight.target.position.set(0, 0, 0);
    this.scene.add(this.topLight);
    this.scene.add(this.topLight.target);

    // Front Angled Light 
    const frontLight = new THREE.DirectionalLight(0xffffff, 2.5);
    frontLight.position.set(3, 5, 4); 
    this.scene.add(frontLight);

    // Rim light 
    const rimLight = new THREE.DirectionalLight(0x4a6cff, 1.5);
    rimLight.position.set(-4, 3, -5);
    this.scene.add(rimLight);

    // Strong fixed reflection source for piano and water
    const highlightLight = new THREE.PointLight(0xffffff, 2, 15);
    highlightLight.position.set(0, 3, 2);
    this.scene.add(highlightLight);

    // Soft gradient light (replaces ugly blob)
    const ambientGlow = new THREE.PointLight(0x4a6cff, 1.2, 20);
    ambientGlow.position.set(-4, 2, -2);
    this.scene.add(ambientGlow);

    // Aurora light
    this.auroraLight = new THREE.PointLight(0x6a5cff, 1, 30);
    this.scene.add(this.auroraLight);

    // Properly light the piano (Spotlight tracks camera)
    this.keyLight = new THREE.SpotLight(0xffffff, 2.5, 50, Math.PI / 6);
    this.keyLight.position.set(2, 4, 3);
    this.scene.add(this.keyLight);
    this.scene.add(this.keyLight.target);

    // Underlight for water/piano separation
    const underGlow = new THREE.PointLight(0x4a6cff, 0.8, 8);
    underGlow.position.set(0, -1.2, 0);
    this.scene.add(underGlow);

    // Dedicated light hitting water directly
    const waterLight = new THREE.PointLight(0x4a6cff, 1, 10);
    waterLight.position.set(0, 1, 3);
    this.scene.add(waterLight);
  }

  addParticles() {
    // Highly optimized mixed particle field
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 250; 
    
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);
    
    // Core color palette
    const colorBlue = new THREE.Color(0x88aaff); // Cool mist
    const colorWarm = new THREE.Color(0xffb055); // Magical ember
    
    for(let i = 0; i < particleCount; i++) {
       // Widen the spread again so it fills the screen rather than tightly hugging the piano
       posArray[i*3]     = (Math.random() - 0.5) * 20;  // X: wide spread (-10 to 10)
       posArray[i*3 + 1] = -1.0 + Math.random() * 8;    // Y: from water floor up to ceiling (-1 to 7)
       posArray[i*3 + 2] = (Math.random() - 0.5) * 16;  // Z: deep scene spread (-8 to 8)

       // 25% chance of being a warm ember
       const isWarm = Math.random() > 0.75;
       const c = isWarm ? colorWarm : colorBlue;
       
       colorArray[i*3]     = c.r;
       colorArray[i*3 + 1] = c.g;
       colorArray[i*3 + 2] = c.b;
    }
    
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    this.particles = new THREE.Points(
      particleGeo,
      new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true, // Use the custom color array!
        transparent: true,
        opacity: 0.9
      })
    );
    this.scene.add(this.particles);

    // Subtle glow light for atmosphere
    const particleLight = new THREE.PointLight(0x6a5cff, 0.8, 10); 
    particleLight.position.set(0, 2, 0);
    this.scene.add(particleLight);
  }

  loadAccents() {
    return new Promise((resolve) => {
      this.accents = [];
      this.loader.load('/candles.glb', (gltf) => {
        const candleParent = gltf.scene;
        const scale = 0.08; 
        
        // Emissive material override
        candleParent.traverse((child) => {
          if(child.isMesh && child.material) {
             child.material.emissive = new THREE.Color(0xffa95c);
             child.material.emissiveIntensity = 2;
          }
        });

        const positions = [
          { x: -1.2, y: -0.9, z: 1.5 },
          { x: 1.5, y: -0.9, z: 1.8 }
        ];

        positions.forEach((pos) => {
          const clone = candleParent.clone();
          clone.scale.set(scale, scale, scale);
          clone.position.set(pos.x, pos.y, pos.z);
          
          // Glow effect 
          const glow = new THREE.PointLight(0xffa95c, 1.2, 6);
          glow.position.set(0, 2, 0); 
          clone.add(glow);

          this.scene.add(clone);
          this.accents.push({ mesh: clone, baseY: pos.y, offset: Math.random()*10, rotSpeed: 0.001 });
        });
        resolve();
      }, undefined, () => resolve());
    });
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
                   mat.roughness = Math.min(mat.roughness || 0.5, 0.25); 
                   mat.metalness = Math.max(mat.metalness || 0, 0.4);   

                   // Force lift pure black bases so lights actually bounce
                   if (mat.color && mat.color.r < 0.05 && mat.color.g < 0.05 && mat.color.b < 0.05) {
                      mat.color.setHex(0x2a2a2a); 
                   }
                }
  
                // Fake reflection boost so the material heavily captures the environment
                mat.envMapIntensity = 3.0;
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
                child.material.forEach(m => { m.opacity = 0.2; m.transparent = true; });
              } else {
                child.material = child.material.clone();
                child.material.opacity = 0.2;
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
    // Text sections
    const ids = ['#intro-sec-1', '#intro-sec-2', '#intro-sec-3', '#intro-sec-4', '#intro-sec-5'];
    
    ids.forEach((id) => {
      const el = document.querySelector(`${id} .intro-text`);
      if (!el) return;

      ScrollTrigger.create({
        trigger: id,
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => el.classList.add('active'),
        onLeave: () => el.classList.remove('active'),
        onEnterBack: () => el.classList.add('active'),
        onLeaveBack: () => el.classList.remove('active'),
      });
    });

    // Camera orbit object (Closer, Higher start)
    const orbitSettings = { 
      theta: Math.atan2(3, 2.2), 
      radius: Math.sqrt(2.2*2.2 + 3*3), 
      height: 2.5
    };

    gsap.to(orbitSettings, {
      theta: Math.PI * 0.8, // Revealed cinematic angle
      radius: 10,          // Balanced pan-out
      height: 6,          // Balanced final height
      ease: "power2.out", // Smooth cinematic motion
      scrollTrigger: {
        trigger: "#intro-container",
        start: "top top",
        end: "bottom top",
        scrub: 18 // Massively heavier, deliberate feel. Forces the user to wait out the cinematic pan.
      },
      onUpdate: () => {
        this.camera.position.x = orbitSettings.radius * Math.cos(orbitSettings.theta);
        this.camera.position.z = orbitSettings.radius * Math.sin(orbitSettings.theta);
        this.camera.position.y = orbitSettings.height;
        this.camera.lookAt(0, 0, 0);
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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Performance: Only render if container is in view
    if (!this.isRendering) return;

    if (this.waterNormalMap) {
      this.waterNormalMap.offset.x += 0.0005;
      this.waterNormalMap.offset.y += 0.0003;
    }

    // Subtle breathing animation for piano/lights
    const time = Date.now() * 0.001;
    if (this.piano) {
       this.piano.position.y = -1 + Math.sin(time) * 0.05;
    }

    // Dynamic Spotlight: Follows camera offset, scales by distance
    if (this.keyLight && this.camera) {
      this.keyLight.position.copy(this.camera.position);
      this.keyLight.position.x += 2;
      this.keyLight.position.y += 2;

      const dist = this.camera.position.length();
      this.keyLight.intensity = Math.min(3.0, dist * 0.3); // Farther = brighter silhouette
      
      // Dynamic exposure scaling
      this.renderer.toneMappingExposure = THREE.MathUtils.clamp(dist * 0.4, 2.0, 4.0); // Boosted deeply so the lights penetrate the shadows
    }

    // Step 2: Aurora Light animation
    if(this.auroraLight) {
      this.auroraLight.position.x = Math.sin(time * 0.5) * 5;
      this.auroraLight.position.z = Math.cos(time * 0.5) * 5;
    }

    // Mixed particle subtle animation
    if(this.particles) {
       this.particles.rotation.y = time * 0.03; 
       this.particles.position.y = Math.sin(time * 0.3) * 0.2; 
    }

    // Accents floating
    if (this.accents && this.accents.length > 0) {
       this.accents.forEach(acc => {
         acc.mesh.position.y = acc.baseY + Math.sin(time * 2 + acc.offset) * 0.03;
         acc.mesh.rotation.y += acc.rotSpeed;
       });
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}
