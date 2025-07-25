import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  build: {
    target: 'esnext', // Enable modern features for Web Audio API
  },
  optimizeDeps: {
    include: ['three', '@react-three/fiber'],
  },
})