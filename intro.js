import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class PianoIntro {
  constructor() {
    this.container = document.getElementById('intro-container');
    this.canvas = document.getElementById('intro-canvas');
    if (!this.container || !this.canvas) return;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0914, 0.015);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // ⚡ SYNC POV: Match the orbitSettings start exactly (radius 4.5, height 4.5, theta PI*0.1)
    const initialTheta = Math.PI * 0.1;
    this.camera.position.set(
      4.5 * Math.cos(initialTheta), 
      4.5, 
      4.5 * Math.sin(initialTheta)
    );
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.5; // Lowered for better dynamic range

    // Performance: DRACO Loader
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(dracoLoader);

    this.piano = null;
    this.water = null;
    this.isRendering = true;

    // Performance: Render-on-demand (Intersection Observer)
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
    await this.loadPiano();
    this.setupScrollAnimations();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }
  addLights() {
    // ⚡ 1, 2, 3, 4: WIDEN, POSITION & REDUCE BLAST
    this.frontLight = new THREE.SpotLight(0xffffff, 4, 150, Math.PI / 2);
    this.frontLight.position.set(0, 18, 5); // Much higher to diffuse floor blast
    this.frontLight.penumbra = 1; // Maximum softness
    this.frontLight.decay = 1;
    this.scene.add(this.frontLight);
    this.scene.add(this.frontLight.target); // MUST add target to scene

    // ⚡ 5: SOFT FILL LIGHT
    const fillLight = new THREE.DirectionalLight(0x88aaff, 1.8);
    fillLight.position.set(-6, 8, -6);
    this.scene.add(fillLight);

    // ⚡ 7: RIM LIGHT
    const rimLight = new THREE.DirectionalLight(0x66ccff, 3);
    rimLight.position.set(2, 6, -10);
    this.scene.add(rimLight);

    // ⚡ Lift the blacks (Visibility fix)
    const ambient = new THREE.AmbientLight(0xffffff, 0.8); // Requested boost
    this.scene.add(ambient);

    // ⚡ Final 'Studio' Front-Side Fill (Pop whole piano)
    const filler = new THREE.PointLight(0xffaa00, 10, 25); // Boosted to 10
    filler.position.set(4, 3, 5); // Moved closer for pop
    this.scene.add(filler);
    
    // Lower fog density
    this.scene.fog = new THREE.FogExp2(0x0a0914, 0.012);
  }

  addWater() {
    const geometry = new THREE.PlaneGeometry(200, 200);
    
    // Create a procedural ripple/noise texture for the water's normal map
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#8080ff'; // Default normal map color
    ctx.fillRect(0, 0, 512, 512);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 100;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(1, 'rgba(128, 128, 255, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    
    const normalMap = new THREE.CanvasTexture(canvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(10, 10);
    this.waterNormalMap = normalMap;

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x111111,
      metalness: 1,
      roughness: 0.05,
      reflectivity: 1,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      normalMap: normalMap,
      normalScale: new THREE.Vector2(0.2, 0.2), // Increased ripple visibility
      transparent: true,
      opacity: 0.94
    });

    this.water = new THREE.Mesh(geometry, material);
    this.water.rotation.x = -Math.PI / 2;
    this.water.position.y = -1;
    this.scene.add(this.water);
  }

  
  loadPiano() {
    return new Promise((resolve) => {
        // Using the local model provided by the user
        const pianoUrl = '/grand_piano.glb';
      
        this.loader.load(pianoUrl, (gltf) => {
          this.piano = gltf.scene;

          // 🥇 FORCE MATERIAL (Step 1)
          this.piano.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({
                color: 0x333333, // Brightened from 0x111111 for visibility
                metalness: 0.8,
                roughness: 0.1,
              });
            }
          });

          this.piano.scale.set(1, 1, 1); 
          this.piano.position.y = -1;
          this.scene.add(this.piano);

          // ⚡ Fix light target (Point it directly at piano)
          if (this.frontLight) {
            this.frontLight.target.position.set(0, -1, 0); 
            this.frontLight.target.updateMatrixWorld();
          }
        
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
      theta: Math.PI * 0.1, 
      radius: 4.5, 
      height: 4.5  
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
        scrub: 5 // Heavier, more deliberate feel
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
          scrub: 2
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

    // Subtle breathing animation for piano/lights
    const time = Date.now() * 0.001;
    if (this.piano) {
       this.piano.position.y = -1 + Math.sin(time) * 0.05;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}
