export const SETTINGS = {
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    startPosition: { x: 0, y: 1.6, z: 5 }
  },

  movement: {
    // Speed in meters per second (approx)
    // Previously was 5.0 * 120 = 600 units/frame effectively? No, it was crazy.
    // Let's set a reasonable walking speed.
    speed: 8.0,
    sprintMultiplier: 2.0,
    mouseSensitivity: 0.002
  },

  rendering: {
    shadowMapSize: 1024,
    maxPixelRatio: 1.5,
    toneMapping: 'ACESFilmic',
    toneMappingExposure: 1.0
  },

  scene: {
    backgroundColor: 0x1a1a2e,
    fogColor: 0x1a1a2e,
    fogNear: 10,
    fogFar: 100
  },

  debug: false
};
