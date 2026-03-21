import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initDB } from '@/services/db'

initDB()
  .then(() => {
    ReactDOM.createRoot(document.getElementById('root')).render(<App />)
  })
  .catch((err) => {
    console.error('[DB] Init failed, rendering anyway:', err)
    ReactDOM.createRoot(document.getElementById('root')).render(<App />)
  })

if (import.meta.env.DEV && import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*')
  })
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*')
  })
}
