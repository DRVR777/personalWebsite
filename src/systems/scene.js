import * as THREE from 'three';
import { SETTINGS } from '../config/settings';

export function createScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SETTINGS.scene.backgroundColor);
  scene.fog = new THREE.Fog(
    SETTINGS.scene.fogColor,
    SETTINGS.scene.fogNear,
    SETTINGS.scene.fogFar
  );
  return scene;
}
