import React, { useState } from 'react';
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

  // 商品表單資料
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: '書籍教材',
  });

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 上傳商品到 Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setError('請先登入後再上架商品');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // 檢查必填字段
      if (!formData.title || !formData.price || !formData.description) {
        setError('請填寫所有必填欄位');
        setLoading(false);
        return;
      }

      // 準備商品資料
      const productData = {
        title: formData.title,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category,
        condition: formData.condition,
        sellerName: currentUser.displayName || '未知賣家',
        sellerEmail: currentUser.email,
        createdAt: serverTimestamp(),
        status: 'available'
      };

      console.log('準備上傳商品資料:', productData);

      // 新增商品到 Firestore
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('商品上傳成功，文件ID:', docRef.id);

      // 上架成功，導回首頁
      navigate('/');
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
          >
            <option value="全新">全新</option>
            <option value="二手">二手</option>
            <option value="良好">良好</option>
          </select>
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
            rows="5"
          />
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '上架中...' : '確認上架'}
        </button>
      </form>
    </div>
  );
}

export default Sell;