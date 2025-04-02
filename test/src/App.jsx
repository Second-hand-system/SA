import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Header from './component/Header'
import Login from './pages/login'
import Register from './pages/register'
import AuthProvider from './context/AuthContext'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <main className="content">
              {/* Main content goes here */}
              <h1>Welcome to My App</h1>
            </main>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
