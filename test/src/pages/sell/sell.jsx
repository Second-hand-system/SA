import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import './sell.css';

function Sell() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // 商品表單資料
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: '書籍教材',
    location: '',
  });

  // 檢查用戶登入狀態
  useEffect(() => {
    if (!currentUser) {
      setError('請先登入');
    }
  }, [currentUser]);

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // 將圖片轉換為 base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // 處理圖片上傳預覽
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 限制 2MB
        setError('圖片大小不能超過 2MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('請上傳圖片檔案');
        return;
      }

      try {
        const base64 = await convertToBase64(file);
        setImageFile(base64);
        setImagePreview(base64);
        setError('');
      } catch (error) {
        console.error('圖片轉換錯誤:', error);
        setError('圖片處理失敗，請重試');
      }
    }
  };

  // 上傳商品到 Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('請先登入後再上架商品');
      return;
    }

    // 驗證表單數據
    if (!formData.title.trim()) {
      setError('請輸入商品名稱');
      return;
    }

    if (!formData.price || formData.price <= 0) {
      setError('請輸入有效的價格');
      return;
    }

    if (!formData.description.trim()) {
      setError('請輸入商品描述');
      return;
    }

    if (!imageFile) {
      setError('請上傳商品圖片');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 準備商品資料
      const productData = {
        title: formData.title,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        location: formData.location,
        image: imageFile,
        sellerName: currentUser.displayName || '未知賣家',
        sellerEmail: currentUser.email,
        sellerId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'available'
      };

      console.log('準備上傳商品資料:', productData);

      // 新增商品到 Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('商品上傳成功，ID:', docRef.id);
      
      setSuccess('商品上架成功！');
      
      // 延遲一下再跳轉
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (err) {
      console.error('上架商品錯誤:', err);
      setError(err.message || '上架商品時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-container">
      <h1>上架商品</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit} className="sell-form">
        <div className="form-group">
          <label htmlFor="title">商品名稱</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            placeholder="請輸入商品名稱"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">價格</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            placeholder="請輸入價格"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">商品分類</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="書籍教材">書籍教材</option>
            <option value="電子產品">電子產品</option>
            <option value="家具寢具">家具寢具</option>
            <option value="交通工具">交通工具</option>
            <option value="服裝衣物">服裝衣物</option>
            <option value="運動用品">運動用品</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="condition">商品狀態</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
            required
            disabled={loading}
          >
            <option value="全新">全新</option>
            <option value="二手-近全新">二手-近全新</option>
            <option value="二手-良好">二手-良好</option>
            <option value="二手-普通">二手-普通</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="location">面交地點</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            required
            placeholder="請輸入希望的交易地點"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">商品描述</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            placeholder="請詳細描述商品狀況、規格等資訊"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="image">商品圖片</label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            required
            disabled={loading}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="商品預覽" />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading}
        >
          {loading ? '上傳中...' : '上架商品'}
        </button>
      </form>
    </div>
  );
}

export default Sell;