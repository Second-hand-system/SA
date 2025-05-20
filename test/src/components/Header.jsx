import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCartOutlined } from '@ant-design/icons';
import Notification from './Notification';
import './Header.css';

const Header = () => {
  return (
    <div className="header">
      <Link to="/transactions" className="nav-link">
        <div className="nav-icon">
          <ShoppingCartOutlined />
        </div>
        <span>交易</span>
      </Link>
      <div className="nav-link notification-link">
        <Notification />
      </div>
      <Link to="/profile" className="nav-link">
        Profile
      </Link>
    </div>
  );
};

export default Header; 