import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
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

    new RGBELoader().load('/monochrome.hdr', (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = texture;

      // IMPORTANT: keep background dark
      this.scene.background = new THREE.Color(0x0a0914);
    });

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(2.5, 3, 3);
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
    await this.loadPiano();
    this.setupScrollAnimations();
    this.animate();

    window.addEventListener('resize', () => this.onResize());
  }

  addLights() {
    // Key light (main)
    const keyLight = new THREE.DirectionalLight(0xffffff, 2);
    keyLight.position.set(5, 8, 5);
    this.scene.add(keyLight);

    // Rim light (for edges)
    const rimLight = new THREE.DirectionalLight(0x4a6cff, 1.5);
    rimLight.position.set(-5, 5, -5);
    this.scene.add(rimLight);

    // Volumetric glow BEHIND piano
    const glowLight = new THREE.PointLight(0x4a6cff, 2, 10);
    glowLight.position.set(0, 2, -3);
    this.scene.add(glowLight);

    // Ground fade
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      new THREE.MeshStandardMaterial({
        color: 0x0a0914,
        roughness: 1
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.5;
    this.scene.add(floor);
  }

  loadPiano() {
    return new Promise((resolve) => {
        // Using the local model provided by the user
        const pianoUrl = '/grand_piano.glb';
      
        this.loader.load(pianoUrl, (gltf) => {
          this.piano = gltf.scene;

          // 🥇 Fix piano material
          this.piano.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.roughness = 0.2;
              child.material.metalness = 0.7;
            }
          });

          this.piano.scale.set(1, 1, 1); 
          this.piano.position.y = -1;
          this.scene.add(this.piano);
        
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
      theta: Math.atan2(3, 2.5), 
      radius: Math.sqrt(2.5*2.5 + 3*3), 
      height: 3
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
