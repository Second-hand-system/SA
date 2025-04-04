import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    grade: '',
    email: currentUser?.email || '',
    dormitory: ''
  });

  const dormitories = [
    '宜真宜善學苑',
    '宜美學苑',
    '宜聖學苑',
    '格物學苑',
    '立言學苑',
    '信義和平學苑'
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      if (currentUser) {
        const db = getFirestore();
        const docRef = doc(db, 'profiles', currentUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data());
          setFormData(docSnap.data());
        }
      }
    };
    fetchProfile();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const db = getFirestore();
    await setDoc(doc(db, 'profiles', currentUser.uid), formData);
    setProfile(formData);
    setIsEditing(false);
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
      {!profile && !isEditing ? (
        <div className="profile-empty">
          <p>您尚未填寫個人資料</p>
          <button onClick={() => setIsEditing(true)}>填寫資料</button>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>姓名：</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>學號：</label>
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>年級：</label>
            <input
              type="text"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>電子郵件：</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
            />
          </div>
          <div className="form-group">
            <label>宿舍：</label>
            <select
              name="dormitory"
              value={formData.dormitory}
              onChange={handleChange}
              required
            >
              <option value="">請選擇宿舍</option>
              {dormitories.map(dorm => (
                <option key={dorm} value={dorm}>{dorm}</option>
              ))}
            </select>
          </div>
          <div className="form-buttons">
            <button type="submit">儲存</button>
            <button type="button" onClick={() => setIsEditing(false)}>取消</button>
          </div>
        </form>
      ) : (
        <div className="profile-info">
          <div className="info-group">
            <label>姓名：</label>
            <span>{profile.name}</span>
          </div>
          <div className="info-group">
            <label>學號：</label>
            <span>{profile.studentId}</span>
          </div>
          <div className="info-group">
            <label>年級：</label>
            <span>{profile.grade}</span>
          </div>
          <div className="info-group">
            <label>電子郵件：</label>
            <span>{profile.email}</span>
          </div>
          <div className="info-group">
            <label>宿舍：</label>
            <span>{profile.dormitory}</span>
          </div>
          <button onClick={() => setIsEditing(true)}>編輯資料</button>
        </div>
      )}
    </div>
  );
};

export default Profile; 