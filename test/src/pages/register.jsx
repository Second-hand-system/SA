import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import './register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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

    // 清除錯誤和成功信息
    if (error) setError('');
    if (success) setSuccess('');
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
      setError('請使用輔大信箱 (學號@m365.fju.edu.tw)');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      console.log('Attempting to register with:', { name: formData.name, email: formData.email });

      // 直接嘗試註冊
      await register(formData.name, formData.email, formData.password);
      console.log('Registration successful');
      
      // 顯示成功信息
      setSuccess('註冊成功！請重新登入以開始使用...');
      
      // 延遲 2 秒後導向登入頁面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Registration error:', error.code, error.message);
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('此信箱已被註冊');
          break;
        case 'auth/invalid-email':
          setError('信箱格式錯誤');
          break;
        case 'auth/operation-not-allowed':
          setError('註冊功能暫時無法使用');
          break;
        case 'auth/weak-password':
          setError('密碼強度不足');
          break;
        default:
          setError('註冊失敗，請稍後再試');
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
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-group">
            <label htmlFor="name">姓名</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="請輸入姓名"
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
              placeholder="請設定密碼 (至少6個字元)"
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
        <p className="register-link">
          已有帳號？ <Link to="/login">登入</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
