// src/systems/controls.js
import * as THREE from 'three';
import { SETTINGS } from '../config/settings.js';

export class FirstPersonControls {
  constructor(camera, domElement = document.body) {
    this.camera = camera;
    this.domElement = domElement;

    // config (safe fallbacks)
    this.moveSpeed = (SETTINGS?.movement?.speed) ?? 0.15;
    this.sprintMultiplier = (SETTINGS?.movement?.sprintMultiplier) ?? 2.0;
    this.mouseSensitivity = (SETTINGS?.movement?.mouseSensitivity) ?? 0.0025;
    this.eyeHeight = (SETTINGS?.camera?.eyeHeight) ?? 1.6;
    this.rotationSmoothing = 12.0; // higher = snappier, lower = smoother
    this.maxMouseDelta = 100; // per-event clamp to avoid spikes

    // state
    this.keys = { w: false, a: false, s: false, d: false, space: false, shift: false };
    this.isLocked = false;
    this.clock = new THREE.Clock();

    // orientation (rad)
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;

    // initialize orientation from camera so first lock won't jump
    this._initOrientationFromCamera();

    // bind handlers
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onPointerLockChange = this._onPointerLockChange.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onClick = this._onClick.bind(this);

    // listeners
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    document.addEventListener('mousemove', this._onMouseMove);
    this.domElement.addEventListener('click', this._onClick);

    // ensure camera y
    if (typeof this.camera.position.y === 'number') {
      this.camera.position.y = this.eyeHeight;
    }
  }

  _initOrientationFromCamera() {
    const e = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    this.yaw = this.targetYaw = e.y;
    this.pitch = this.targetPitch = e.x;
    const limit = Math.PI / 2 - 0.0001;
    this.targetPitch = Math.max(-limit, Math.min(limit, this.targetPitch));
    this.pitch = Math.max(-limit, Math.min(limit, this.pitch));
  }

  _onClick() {
    if (!this.isLocked) {
      try { this.domElement.requestPointerLock(); } catch (err) { /* ignore */ }
    }
  }

  _onPointerLockChange() {
    const now = performance.now();
    this.isLocked = document.pointerLockElement === this.domElement;
    if (this.isLocked) {
      // sync targets immediately and ignore very first noisy events
      this._initOrientationFromCamera();
      this._ignoreMouseUntil = now + 60; // ignore first ~60ms mouse events after lock
    } else {
      this._ignoreMouseUntil = 0;
    }

    // UI toggles if present
    const startPrompt = document.getElementById('start-prompt');
    const uiOverlay = document.getElementById('ui-overlay');
    if (this.isLocked) {
      if (startPrompt) startPrompt.classList.add('hidden');
      if (uiOverlay) uiOverlay.classList.remove('hidden');
    } else {
      if (startPrompt) startPrompt.classList.remove('hidden');
      if (uiOverlay) uiOverlay.classList.add('hidden');
    }
  }

  _onMouseMove(e) {
    if (!this.isLocked) return;
    if (performance.now() < (this._ignoreMouseUntil || 0)) return;

    let dx = Number(e.movementX) || 0;
    let dy = Number(e.movementY) || 0;

    // clamp extreme spikes
    if (dx > this.maxMouseDelta) dx = this.maxMouseDelta;
    if (dx < -this.maxMouseDelta) dx = -this.maxMouseDelta;
    if (dy > this.maxMouseDelta) dy = this.maxMouseDelta;
    if (dy < -this.maxMouseDelta) dy = -this.maxMouseDelta;

    // update target yaw/pitch (mouse accumulates into target)
    this.targetYaw -= dx * this.mouseSensitivity;
    this.targetPitch -= dy * this.mouseSensitivity;

    // clamp pitch
    const P_LIMIT = Math.PI / 2 - 0.0001;
    this.targetPitch = Math.max(-P_LIMIT, Math.min(P_LIMIT, this.targetPitch));
  }

  _onKeyDown(e) {
    const k = e.key.toLowerCase();
    if (k in this.keys) this.keys[k] = true;
    if (k === ' ') this.keys.space = true;
    if (k === 'shift') this.keys.shift = true;
  }

  _onKeyUp(e) {
    const k = e.key.toLowerCase();
    if (k in this.keys) this.keys[k] = false;
    if (k === ' ') this.keys.space = false;
    if (k === 'shift') this.keys.shift = false;
  }

  /**
   * Call once per frame. Keeps rotation smooth via exponential interpolation,
   * and fixes forward/backwards direction using camera.getWorldDirection after rotation write.
   */
  update(deltaTime = this.clock.getDelta()) {
    // guard large deltaTime
    deltaTime = Math.min(deltaTime, 0.05);

    // smooth yaw/pitch toward target (exponential smoothing)
    const t = 1 - Math.exp(-this.rotationSmoothing * deltaTime); // smoothing factor
    this.yaw += (this.targetYaw - this.yaw) * t;
    this.pitch += (this.targetPitch - this.pitch) * t;

    // authoritative write once per frame
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

    // compute movement
    const speed = this.keys.shift ? this.moveSpeed * this.sprintMultiplier : this.moveSpeed;
    const move = new THREE.Vector3();

    // Map keys to logical movement: W = forward, S = backward
    if (this.keys.w) move.z += 1;
    if (this.keys.s) move.z -= 1;
    if (this.keys.a) move.x -= 1;
    if (this.keys.d) move.x += 1;

    // vertical
    if (this.keys.space) move.y += 1;
    if (this.keys.shift) move.y -= 1;

    if (move.lengthSq() === 0) return;

    move.normalize();

    // determine forward using camera world direction AFTER we've set the quaternion
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // If for any reason forward is near-zero (edge case), fall back to yaw-derived
    if (forward.lengthSq() < 1e-6) {
      forward.set(0, 0, -1).applyEuler(new THREE.Euler(0, this.yaw, 0, 'YXZ')).normalize();
    }

    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const worldMove = new THREE.Vector3();
    worldMove.addScaledVector(forward, move.z); // forward positive when W pressed
    worldMove.addScaledVector(right, move.x);
    worldMove.y += move.y;

    // safety cap per-frame distance
    const maxFrameDist = 10;
    const frameDist = Math.min(speed * deltaTime, maxFrameDist);

    this.camera.position.addScaledVector(worldMove, frameDist);

    // keep camera on eyeHeight if desired (uncomment):
    // this.camera.position.y = this.eyeHeight;
  }

  getPosition() {
    return this.camera.position.clone();
  }

  dispose() {
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('keyup', this._onKeyUp);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('mousemove', this._onMouseMove);
    this.domElement.removeEventListener('click', this._onClick);
  }
}
