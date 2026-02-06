import * as THREE from 'three';
import GUI from 'lil-gui';

import { createScene } from './systems/scene';
import { createCamera } from './systems/camera';
import { createRenderer } from './systems/renderer';
import { createLights } from './systems/lighting';
import { FirstPersonControls } from './systems/controls';

import { Museum } from './world/Museum';
import { Editor } from './systems/Editor';

import AssetManager from './loaders/AssetManager';

import { updateLoadingProgress, hideLoadingScreen } from './utils/helpers';

import { SETTINGS } from './config/settings';

import vertexShader from './shaders/mathShader/vertex.glsl?raw';
import fragmentShader from './shaders/mathShader/fragment.glsl?raw';

class MuseumApp {
  constructor() {
    this.clock = new THREE.Clock();
    this.isReady = false;
    this.accumulator = 0;

    this.init();
  }

  async init() {
    console.log('��� Initializing Museum App...');

    this.setupLoadingCallbacks();

    this.scene = createScene();
    this.camera = createCamera();
    this.renderer = createRenderer();
    this.lights = createLights(this.scene);

    this.controls = new FirstPersonControls(this.camera, this.renderer.domElement);
    // this.scene.add(this.controls.yawObject); // Removed: Controls manipulate camera directly

    this.museum = new Museum(this.scene);
    await this.museum.load();

    // Initialize Editor (Dev Mode)
    this.editor = new Editor(
      this.scene,
      this.camera,
      this.renderer,
      this.controls,
      this.museum
    );

    this.addShaderExhibit();

    if (SETTINGS.debug) {
      this.setupDebugGUI();
    }

    window.addEventListener('resize', () => this.onWindowResize());

    this.isReady = true;
    hideLoadingScreen();

    this.animate();

    console.log('✅ Museum App ready!');
  }

  setupLoadingCallbacks() {
    AssetManager.onProgress = (progress) => {
      updateLoadingProgress(progress, `Loading assets... ${Math.round(progress)}%`);
    };

    AssetManager.onComplete = () => {
      updateLoadingProgress(100, 'Complete!');
    };
  }

  addShaderExhibit() {
    const geometry = new THREE.PlaneGeometry(3, 3);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        color1: { value: new THREE.Color(0x667eea) },
        color2: { value: new THREE.Color(0x764ba2) }
      },
      side: THREE.DoubleSide
    });

    this.shaderPlane = new THREE.Mesh(geometry, material);
    this.shaderPlane.position.set(0, 2, -9.5);
    this.scene.add(this.shaderPlane);
  }

  setupDebugGUI() {
    this.gui = new GUI();

    const cameraFolder = this.gui.addFolder('Camera');
    cameraFolder.add(this.camera.position, 'x', -50, 50).name('Position X');
    cameraFolder.add(this.camera.position, 'y', 0, 10).name('Position Y');
    cameraFolder.add(this.camera.position, 'z', -50, 50).name('Position Z');

    const lightFolder = this.gui.addFolder('Lighting');
    lightFolder.add(this.lights.ambient, 'intensity', 0, 2).name('Ambient');
    lightFolder.add(this.lights.directional, 'intensity', 0, 2).name('Directional');

    const movementFolder = this.gui.addFolder('Movement');
    movementFolder.add(this.controls, 'moveSpeed', 0.01, 1).name('Speed');
    movementFolder.add(this.controls, 'mouseSensitivity', 0.001, 0.01).name('Sensitivity');

    if (this.shaderPlane) {
      const shaderFolder = this.gui.addFolder('Shader');
      shaderFolder.addColor(
        this.shaderPlane.material.uniforms.color1,
        'value'
      ).name('Color 1');
      shaderFolder.addColor(
        this.shaderPlane.material.uniforms.color2,
        'value'
      ).name('Color 2');
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (this.shaderPlane) {
      this.shaderPlane.material.uniforms.resolution.value.set(
        window.innerWidth,
        window.innerHeight
      );
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (!this.isReady) return;

    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta to avoid spiral of death
    this.accumulator += deltaTime;

    const fixedTimeStep = 0.01666; // ~60 physics updates per second

    // FIXED TIME-STEP LOOP
    while (this.accumulator >= fixedTimeStep) {
      this.updatePhysics(fixedTimeStep);
      this.accumulator -= fixedTimeStep;
    }

    // INTERPOLATION (Smoothing out the remainder)
    const alpha = this.accumulator / fixedTimeStep;
    this.render(alpha);
  }

  updatePhysics(step) {
    this.controls.update(step);
    this.editor.update();
    this.museum.update(this.clock.getElapsedTime());

    if (this.shaderPlane) {
      this.shaderPlane.material.uniforms.time.value = this.clock.getElapsedTime();
    }
  }

  render(alpha) {
    // Note: interpolation logic would go here if meshes had previousPosition
    // For now, the fixed time step alone prevents jitter
    this.renderer.render(this.scene, this.camera);
  }
}

new MuseumApp();
