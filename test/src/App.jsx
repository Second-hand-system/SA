import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from './store/index'
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
import Transactions from './pages/transactions/Transactions'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { FavoritesProvider } from './contexts/FavoritesContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { checkFirestoreConnection, auth } from './firebase'
import TransactionSchedule from './pages/transactions/TransactionSchedule'
import ChatList from './pages/chat/ChatList'
import ChatRoom from './pages/chat/ChatRoom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// 配置 React Router 的未來標誌
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

// 保護需要登入的路由
const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await checkFirestoreConnection();
        setIsChecking(false);
      } catch (error) {
        console.error('Connection check failed:', error);
        setIsChecking(false);
      }
    };

    checkAuth();
  }, []);

  if (loading || isChecking) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

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
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        const isConnected = await checkFirestoreConnection();
        setIsConnected(isConnected);
        console.log('Firebase connection test:', isConnected ? 'successful' : 'failed');
        
        const unsubscribe = auth.onAuthStateChanged((user) => {
          console.log('Auth state changed:', user ? 'logged in' : 'logged out');
          if (user) {
            console.log('User ID:', user.uid);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Connection test error:', error);
        setIsConnected(false);
      }
    };

    testConnection();
  }, []);

  if (!isConnected) {
    return (
      <div className="error-container">
        <h1>連接錯誤</h1>
        <p>無法連接到伺服器，請檢查網路連接後重試。</p>
        <button onClick={() => window.location.reload()}>重新整理</button>
      </div>
    );
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <NotificationProvider>
          <FavoritesProvider>
            <Router future={router.future}>
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
              />
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
                <Route path="/transactions" element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                } />
                <Route path="/transactions/schedule/:transactionId" element={
                  <ProtectedRoute>
                    <TransactionSchedule />
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
                <Route path="/chats" element={
                  <ProtectedRoute>
                    <ChatList />
                  </ProtectedRoute>
                } />
                <Route path="/chat/:chatId" element={
                  <ProtectedRoute>
                    <ChatRoom />
                  </ProtectedRoute>
                } />
                <Route path="/order/:orderId" element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                } />
                <Route path="/negotiation/:negotiationId" element={
                  <ProtectedRoute>
                    <ProductDetail />
                  </ProtectedRoute>
                } />
              </Routes>
            </Router>
          </FavoritesProvider>
        </NotificationProvider>
      </AuthProvider>
    </Provider>
  )
}

export default App
