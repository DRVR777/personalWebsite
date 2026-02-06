import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  assetsInclude: ['**/*.glsl', '**/*.glb', '**/*.gltf', '**/*.hdr'],
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three']
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    open: true,
    allowedHosts: ['roancurtis.com', 'www.roancurtis.com', 'localhost']
  },
  preview: {
    port: 3001,
    host: true,
    allowedHosts: ['roancurtis.com', 'www.roancurtis.com', 'localhost']
  }
});
