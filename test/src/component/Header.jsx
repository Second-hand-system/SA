import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFavorites } from '../context/FavoritesContext';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();
  const { totalFavorites } = useFavorites();

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
                  {totalFavorites > 0 && (
                    <span className="favorites-count">{totalFavorites}</span>
                  )}
                </div>
              </Link>
              <Link to="/profile" className="profile-link">
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
