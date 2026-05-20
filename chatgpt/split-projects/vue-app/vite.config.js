import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') }
  },
  base: '/coach-app/',
  server: {
    host: '0.0.0.0',
    port: 8765,
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
