import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const auth = getAuth();

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
    // 清除錯誤訊息
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 信箱格式驗證
    if (!validateEmail(formData.email)) {
      setError('信箱格式錯誤');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // 嘗試登入
      await login(formData.email, formData.password);
      // 登入成功後導向首頁
      navigate('/');
    } catch (error) {
      console.log('Firebase error:', error.code, error.message);
      
      // 統一顯示錯誤訊息
      setError('帳號/密碼錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="platform-title">
        <h1>輔大二手交易平台</h1>
        <p>買賣交流・資源共享</p>
      </div>
      <div className="login-card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
              {error.includes('尚未註冊') && (
                <Link to="/register" className="register-button">
                  前往註冊
                </Link>
              )}
            </div>
          )}
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
              placeholder="請輸入您的密碼"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button 
            type="submit" 
            className="submit-btn" 
            disabled={loading}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>
        <p className="register-link">
          尚未有帳號？<Link to="/register">註冊</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
