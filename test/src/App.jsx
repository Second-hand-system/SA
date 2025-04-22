import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Header from './component/Header'
import Login from './pages/login'
import Register from './pages/register'
import Home from './pages/home/home'
import Sell from './pages/sell/sell'
import Profile from './pages/profile/Profile'
import ProductDetail from './pages/product/ProductDetail'
import EditProduct from './pages/product/edit/EditProduct'
import Favorites from './pages/favorites/Favorites'
import AuthProvider from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { checkFirestoreConnection, auth } from './firebase'

// 保護需要登入的路由
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      <Header />
      {children}
    </>
  );
};

function App() {
  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await checkFirestoreConnection();
        console.log('Firebase connection test:', isConnected ? 'successful' : 'failed');
        
        // 檢查認證狀態
        const unsubscribe = auth.onAuthStateChanged((user) => {
          console.log('Auth state changed:', user ? 'logged in' : 'logged out');
          if (user) {
            console.log('User ID:', user.uid);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Connection test error:', error);
      }
    };

    testConnection();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/sell" element={
            <ProtectedRoute>
              <Sell />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/favorites" element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          } />
          <Route path="/product/:productId" element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          } />
          <Route path="/product/edit/:productId" element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
