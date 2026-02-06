import * as THREE from 'three';
import AssetManager from '../loaders/AssetManager';
import { ASSETS } from '../config/assets';
import { DISPLAYS } from '../config/displays';

export class Museum {
  constructor(scene) {
    this.scene = scene;
    this.models = new Map();
    this.displays = new Map(); // Registry for display stands
    this.exhibits = [];
  }

  async load() {
    console.log('���️ Loading museum...');

    await this.createFloor();
    this.createWalls();
    this.createExhibits();
    this.addAmbientElements();
    this.createExhibits();
    this.addAmbientElements();

    // Initialize Displays
    await this.createDisplays();

    console.log('✅ Museum loaded');
  }

  async createFloor() {
    const geometry = new THREE.PlaneGeometry(100, 100);

    let material;
    try {
      const colorMap = await AssetManager.loadTexture(
        ASSETS.textures.floors.concrete.color,
        { repeat: { x: 20, y: 20 } }
      );

      material = new THREE.MeshStandardMaterial({
        map: colorMap,
        roughness: 0.8,
        metalness: 0.1
      });
    } catch (error) {
      material = new THREE.MeshStandardMaterial({
        color: 0x2c3e50,
        roughness: 0.8,
        metalness: 0.1
      });
    }

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(100, 50, 0x667eea, 0x333344);
    grid.position.y = 0.01;
    this.scene.add(grid);
  }

  createWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      roughness: 0.7,
      metalness: 0.1
    });

    const backWall = this.createWall(20, 5, 0.5, wallMaterial);
    backWall.position.set(0, 2.5, -10);

    const leftWall = this.createWall(20, 5, 0.5, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-10, 2.5, 0);

    const rightWall = this.createWall(20, 5, 0.5, wallMaterial);
    rightWall.rotation.y = Math.PI / 2;
    rightWall.position.set(10, 2.5, 0);
  }

  createWall(width, height, depth, material) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const wall = new THREE.Mesh(geometry, material);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    return wall;
  }

  createExhibits() {
    const exhibitMaterial = new THREE.MeshStandardMaterial({
      color: 0x667eea,
      emissive: 0x667eea,
      emissiveIntensity: 0.2,
      roughness: 0.3,
      metalness: 0.7
    });

    const positions = [
      { x: -5, z: -5 },
      { x: 5, z: -5 },
      { x: 0, z: -7 },
      { x: -7, z: 0 },
      { x: 7, z: 0 }
    ];

    positions.forEach(({ x, z }) => {
      const geometry = new THREE.BoxGeometry(1, 1.5, 1);
      const exhibit = new THREE.Mesh(geometry, exhibitMaterial);
      exhibit.position.set(x, 0.75, z);
      exhibit.castShadow = true;
      this.scene.add(exhibit);
      this.exhibits.push(exhibit);
    });
  }

  addAmbientElements() {
    const sphereGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0x764ba2,
      emissive: 0x764ba2,
      emissiveIntensity: 0.5
    });

    for (let i = 0; i < 10; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere.position.set(
        (Math.random() - 0.5) * 30,
        1 + Math.random() * 3,
        (Math.random() - 0.5) * 30
      );
      this.scene.add(sphere);
    }
  }

  async createDisplays() {
    for (const config of DISPLAYS) {
      // 1. Create the stand
      this.createDisplayStand(config.id, config.x, config.z);

      // 2. Assign item if present
      if (config.item) {
        // Map 'tree' -> ASSETS.models.props.tree
        // This simple mapping assumes items are in props or exhibits
        // You might want a more robust lookup helper later
        let assetPath = null;
        if (config.item === 'tree') assetPath = ASSETS.models.props.tree;
        if (config.item === 'cube') assetPath = ASSETS.models.exhibits.cube;

        if (assetPath) {
          await this.assignAssetToDisplay(config.id, assetPath, { scale: config.scale || 1 });
        }
      }
    }
  }

  createDisplayStand(id, x, z) {
    // Base (The Stand)
    const geometry = new THREE.BoxGeometry(2, 1, 2);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.1
    });
    const stand = new THREE.Mesh(geometry, material);
    stand.position.set(x, 0.5, z); // y=0.5 so it sits on floor
    stand.castShadow = true;
    stand.receiveShadow = true;

    this.scene.add(stand);

    // Register
    this.displays.set(id, {
      mesh: stand,
      item: null,
      position: { x, y: 1, z } // Top of the stand
    });

    return stand;
  }

  async assignAssetToDisplay(displayId, assetPath, options = {}) {
    const display = this.displays.get(displayId);
    if (!display) {
      console.error(`Display ${displayId} not found`);
      return;
    }

    // Remove old item if exists
    if (display.item) {
      display.mesh.remove(display.item); // Remove from parent
    }

    try {
      const model = await AssetManager.loadModel(assetPath);

      // Parent to the stand
      display.mesh.add(model);

      // Local position: Top of the box (Box is height 1, center 0, so top is 0.5)
      model.position.set(0, 0.5, 0);

      if (options.scale) {
        model.scale.setScalar(options.scale);
      }

      display.item = model;

      console.log(`Assigned ${assetPath} to ${displayId}`);
    } catch (error) {
      console.error(`Failed to load asset for display ${displayId}:`, error);
    }
  }

  async loadTree() {
    try {
      const tree = await AssetManager.loadModel(ASSETS.models.props.tree);
      tree.position.set(0, 0, 0);
      tree.scale.setScalar(0.5); // 1 = 100% size, 0.5 = 50% size
      this.scene.add(tree);
      console.log('Tree loaded!');
    } catch (error) {
      console.error('Failed to load tree:', error);
      // Fallback: Green Cylinder
      const geo = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
      const mat = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
      const fallback = new THREE.Mesh(geo, mat);
      fallback.position.set(0, 1, 0);
      this.scene.add(fallback);
    }
  }

  async loadCustomModel(path, position, options = {}) {
    try {
      const model = await AssetManager.loadModel(path, options);
      model.position.copy(position);

      if (options.scale) {
        model.scale.setScalar(options.scale);
      }

      this.scene.add(model);
      this.models.set(path, model);

      console.log(`✅ Loaded model: ${path}`);
      return model;
    } catch (error) {
      console.error(`❌ Failed to load model: ${path}`, error);
      return null;
    }
  }

  update(time) {
    this.exhibits.forEach((exhibit, index) => {
      exhibit.rotation.y = time * 0.5 + index;
      exhibit.position.y = 0.75 + Math.sin(time * 2 + index) * 0.1;
    });
  }
}
