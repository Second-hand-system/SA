import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSelector } from 'react-redux';
import Notification from '../components/Notification';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const favorites = useSelector(state => state.favorites.favorites);
  const totalFavorites = favorites ? favorites.length : 0;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1>輔大二手交易平台</h1>
        </Link>
      </div>
      <nav className="nav">
        <div className="auth-buttons">
          {currentUser ? (
            <>
              <Link to="/favorites" className="favorites-link">
                <div className="heart-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {totalFavorites > 0 && (
                    <span className="favorites-count">{totalFavorites}</span>
                  )}
                </div>
                <span>收藏</span>
              </Link>
              <Link to="/chats" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div className="chat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M21 6.5a2.5 2.5 0 0 0-2.5-2.5h-13A2.5 2.5 0 0 0 3 6.5v7A2.5 2.5 0 0 0 5.5 16H6v3l4.5-3h8A2.5 2.5 0 0 0 21 13.5v-7z"/>
                  </svg>
                </div>
                <span>聊天</span>
              </Link>
              <Link to="/transactions" className="transactions-link">
                <div className="transaction-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                  </svg>
                </div>
                <span>交易紀錄</span>
              </Link>
              <Link to="#" className="notification-wrapper" onClick={(e) => e.preventDefault()}>
                <Notification />
                <span>通知</span>
              </Link>
              <Link to="/profile" className="profile-link">
                <div className="profile-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                  </svg>
                </div>
                <span>個人資料</span>
              </Link>
              <button onClick={handleLogout}>登出</button>
            </>
          ) : (
            <>
              <Link to="/login"><button>登入</button></Link>
              <Link to="/register"><button>註冊</button></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
