/** @type {import('tailwindcss').Config} */

/**
 * FUNDAMENTO: Utility-First CSS
 * 
 * MOTIVO:
 * - Desenvolvimento rápido (classes prontas)
 * - Design consistente (sistema de cores/espaçamento)
 * - Bundle pequeno (remove CSS não usado)
 * - Responsivo fácil (sm:, md:, lg:)
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [],
}
