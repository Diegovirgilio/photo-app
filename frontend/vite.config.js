import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * FUNDAMENTO: Vite Build Tool
 * 
 * MOTIVO:
 * - Muito mais rápido que Create React App (CRA)
 * - Hot Module Replacement (HMR) instantâneo
 * - Build otimizado para produção
 * - Suporta React Native Web no futuro (se quiser)
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true, // Abre browser automaticamente
    proxy: {
      // Proxy para backend (evita problemas de CORS em dev)
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
})
