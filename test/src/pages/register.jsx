import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^\d{9}@m365\.fju\.edu\.tw$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear error when user starts typing again
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 基本驗證
    if (formData.password !== formData.confirmPassword) {
      setError('密碼不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密碼長度必須至少為6個字元');
      return;
    }

    // 信箱格式驗證
    if (!validateEmail(formData.email)) {
      setError('信箱格式錯誤');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      await register(formData.name, formData.email, formData.password);
      // 註冊成功後導向首頁
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setError('此信箱已被註冊');
      } else {
        setError('註冊失敗：' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>註冊帳號</h1>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="請輸入您的姓名"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">信箱</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="請輸入您的信箱"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="請設定密碼"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">確認密碼</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="請再次輸入密碼"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? '註冊中...' : '註冊'}
          </button>
        </form>
        <p className="login-link">
          已有帳號？ <a href="/login">登入</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
