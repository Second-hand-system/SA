import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import app from './firebase'
import App from './App.jsx'

// 確保 Firebase 已初始化
console.log('Firebase initialization status:', app ? 'success' : 'failed');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
