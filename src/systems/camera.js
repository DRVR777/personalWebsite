import * as THREE from 'three';
import { SETTINGS } from '../config/settings';

export function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    SETTINGS.camera.fov,
    window.innerWidth / window.innerHeight,
    SETTINGS.camera.near,
    SETTINGS.camera.far
  );
  
  const { x, y, z } = SETTINGS.camera.startPosition;
  camera.position.set(x, y, z);
  
  return camera;
}
