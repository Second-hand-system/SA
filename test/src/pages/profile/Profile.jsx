import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    "姓名：": '',
    "學號：": '',
    "年級：": '',
    "電子郵件：": '',
    "宿舍：": ''
  });
  const [loading, setLoading] = useState(false);

  const dormitories = [
    '宜真宜善學苑',
    '宜美學苑',
    '宜聖學苑',
    '格物學苑',
    '立言學苑',
    '信義和平學苑'
  ];

  const fetchProfile = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', currentUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProfile(data);
        setFormData({
          "姓名：": data["姓名："] || currentUser.displayName || '',
          "學號：": data["學號："] || '',
          "年級：": data["年級："] || '',
          "電子郵件：": currentUser.email || '',
          "宿舍：": data["宿舍："] || ''
        });
      } else {
        // 如果文檔不存在，設置默認值
        setFormData({
          "姓名：": currentUser.displayName || '',
          "學號：": '',
          "年級：": '',
          "電子郵件：": currentUser.email || '',
          "宿舍：": ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      alert('獲取資料時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('請先登入');
      return;
    }

    setLoading(true);
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      
      // 重新獲取資料以更新顯示
      await fetchProfile();
      setIsEditing(false);
      alert('資料已成功更新');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('儲存資料時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (!currentUser) {
    return <div className="profile-container">請先登入</div>;
  }

  return (
    <div className="profile-container">
      <h2>個人資料</h2>
      {loading ? (
        <div className="loading">載入中...</div>
      ) : (
        <div className="profile-form-container">
          <div className="form-group">
            <label>姓名：</label>
            {isEditing ? (
              <input
                type="text"
                name="姓名："
                value={formData["姓名："]}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="info-value">{profile?.["姓名："] || currentUser.displayName || '未填寫'}</div>
            )}
          </div>
          <div className="form-group">
            <label>學號：</label>
            {isEditing ? (
              <input
                type="text"
                name="學號："
                value={formData["學號："]}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="info-value">{profile?.["學號："] || '未填寫'}</div>
            )}
          </div>
          <div className="form-group">
            <label>年級：</label>
            {isEditing ? (
              <input
                type="text"
                name="年級："
                value={formData["年級："]}
                onChange={handleChange}
                required
              />
            ) : (
              <div className="info-value">{profile?.["年級："] || '未填寫'}</div>
            )}
          </div>
          <div className="form-group">
            <label>電子郵件：</label>
            {isEditing ? (
              <input
                type="email"
                name="電子郵件："
                value={formData["電子郵件："]}
                disabled
              />
            ) : (
              <div className="info-value">{profile?.["電子郵件："] || currentUser.email || '未填寫'}</div>
            )}
          </div>
          <div className="form-group">
            <label>宿舍：</label>
            {isEditing ? (
              <select
                name="宿舍："
                value={formData["宿舍："]}
                onChange={handleChange}
                required
              >
                <option value="">請選擇宿舍</option>
                {dormitories.map(dorm => (
                  <option key={dorm} value={dorm}>{dorm}</option>
                ))}
              </select>
            ) : (
              <div className="info-value">{profile?.["宿舍："] || '未填寫'}</div>
            )}
          </div>
          <div className="form-buttons">
            {isEditing ? (
              <>
                <button type="button" onClick={handleSubmit} disabled={loading}>
                  {loading ? '儲存中...' : '儲存'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} disabled={loading}>
                  取消
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setIsEditing(true)}>
                  編輯資料
                </button>
                <button type="button" onClick={() => navigate('/')} className="back-home-btn">
                  返回首頁
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 