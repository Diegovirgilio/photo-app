import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

/**
 * FUNDAMENTO: React 18 Root API
 * 
 * MOTIVO:
 * - createRoot é o novo método do React 18
 * - Habilita Concurrent Features (Suspense, etc)
 * - StrictMode detecta problemas no código
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
