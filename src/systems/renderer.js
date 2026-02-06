import * as THREE from 'three';
import { SETTINGS } from '../config/settings';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance'
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, SETTINGS.rendering.maxPixelRatio));
  
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SETTINGS.rendering.toneMappingExposure;
  
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  
  document.body.appendChild(renderer.domElement);
  
  return renderer;
}
