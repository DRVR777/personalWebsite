import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

class AssetManager {
  constructor() {
    this.loadingManager = new THREE.LoadingManager();
    this.assets = new Map();
    this.setupLoaders();
    this.setupCallbacks();
  }
  
  setupLoaders() {
    this.textureLoader = new THREE.TextureLoader(this.loadingManager);
    
    this.gltfLoader = new GLTFLoader(this.loadingManager);
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(dracoLoader);
    
    this.rgbeLoader = new RGBELoader(this.loadingManager);
  }
  
  setupCallbacks() {
    this.loadingManager.onStart = (url, loaded, total) => {
      console.log(`Started loading: ${url}`);
    };
    
    this.loadingManager.onProgress = (url, loaded, total) => {
      const progress = (loaded / total) * 100;
      this.onProgress?.(progress, loaded, total);
    };
    
    this.loadingManager.onLoad = () => {
      console.log('✅ All assets loaded successfully');
      this.onComplete?.();
    };
    
    this.loadingManager.onError = (url) => {
      console.error(`❌ Error loading: ${url}`);
    };
  }
  
  async loadModel(path, options = {}) {
    if (this.assets.has(path)) {
      return this.assets.get(path).clone();
    }
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf) => {
          const model = gltf.scene;
          
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = options.castShadow !== false;
              child.receiveShadow = options.receiveShadow !== false;
            }
          });
          
          this.assets.set(path, model);
          resolve(model.clone());
        },
        undefined,
        (error) => {
          console.error(`Failed to load model: ${path}`, error);
          reject(error);
        }
      );
    });
  }
  
  async loadTexture(path, options = {}) {
    if (this.assets.has(path)) {
      return this.assets.get(path);
    }
    
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        path,
        (texture) => {
          if (options.repeat) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(options.repeat.x || 1, options.repeat.y || 1);
          }
          
          if (options.encoding) {
            texture.colorSpace = options.encoding;
          }
          
          this.assets.set(path, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture: ${path}`, error);
          reject(error);
        }
      );
    });
  }
  
  async loadHDRI(path) {
    if (this.assets.has(path)) {
      return this.assets.get(path);
    }
    
    return new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          this.assets.set(path, texture);
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load HDRI: ${path}`, error);
          reject(error);
        }
      );
    });
  }
  
  async loadBatch(assetList) {
    const promises = assetList.map(({ type, path, options }) => {
      switch(type) {
        case 'model':
          return this.loadModel(path, options);
        case 'texture':
          return this.loadTexture(path, options);
        case 'hdri':
          return this.loadHDRI(path);
        default:
          console.warn(`Unknown asset type: ${type}`);
          return Promise.resolve(null);
      }
    });
    
    return Promise.all(promises);
  }
  
  get(path) {
    return this.assets.get(path);
  }
  
  clear() {
    this.assets.forEach((asset) => {
      if (asset.dispose) asset.dispose();
    });
    this.assets.clear();
  }
}

export default new AssetManager();
