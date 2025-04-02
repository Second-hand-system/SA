import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { currentUser, logout } = useAuth();

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
          <h1>My App</h1>
        </Link>
      </div>
      <nav className="nav">
        <div className="auth-buttons">
          {currentUser ? (
            <>
              <span className="welcome-text">
                Hi, {currentUser.displayName || currentUser.email}
              </span>
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login"><button>Login</button></Link>
              <Link to="/register"><button>Register</button></Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
