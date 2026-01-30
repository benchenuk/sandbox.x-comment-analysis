import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/manifest.json' with { type: 'json' }

export default defineConfig({
  plugins: [
    vue(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      input: {
        options: 'src/options/index.html',
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  legacy: {
    skipWebSocketTokenCheck: true,
  },
})