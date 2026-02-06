import * as THREE from 'three';
import { SETTINGS } from '../config/settings';

export function createLights(scene) {
  const lights = {};
  
  lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(lights.ambient);
  
  lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
  lights.directional.position.set(10, 20, 10);
  lights.directional.castShadow = true;
  
  const shadowSize = SETTINGS.rendering.shadowMapSize;
  lights.directional.shadow.mapSize.width = shadowSize;
  lights.directional.shadow.mapSize.height = shadowSize;
  lights.directional.shadow.camera.left = -50;
  lights.directional.shadow.camera.right = 50;
  lights.directional.shadow.camera.top = 50;
  lights.directional.shadow.camera.bottom = -50;
  lights.directional.shadow.camera.near = 0.1;
  lights.directional.shadow.camera.far = 100;
  
  scene.add(lights.directional);
  
  lights.hemisphere = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
  scene.add(lights.hemisphere);
  
  return lights;
}
