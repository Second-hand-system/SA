import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuth } from 'firebase/auth';
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
      setError('請使用輔大信箱 (學號@m365.fju.edu.tw)');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('Attempting to login with:', formData.email);
      
      // 直接嘗試登入
      await login(formData.email, formData.password);
      console.log('Login successful');
      // 登入成功後導向首頁
      navigate('/');
    } catch (error) {
      console.error('Login error:', error.code, error.message);
      
      // 根據錯誤代碼顯示適當的錯誤訊息
      switch (error.code) {
        case 'auth/invalid-email':
          setError('信箱格式錯誤');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('帳號/密碼錯誤');
          break;
        case 'auth/too-many-requests':
          setError('登入嘗試次數過多，請稍後再試');
          break;
        default:
          setError('登入失敗，請稍後再試');
      }
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
              {error === '帳號/密碼錯誤' && (
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
              placeholder="請輸入輔大信箱"
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
              placeholder="請輸入密碼"
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
