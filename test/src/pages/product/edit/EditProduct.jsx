import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../../firebase';
import './EditProduct.css';

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: '其他',
    meetupLocation: '輔大校園'
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!auth.currentUser) {
          setError('請先登入');
          return;
        }

        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('找不到商品');
          return;
        }

        const productData = docSnap.data();
        
        // 確認是否為商品擁有者
        if (productData.sellerId !== auth.currentUser.uid) {
          setError('您沒有權限編輯此商品');
          return;
        }

        setFormData({
          title: productData.title || '',
          price: productData.price || '',
          description: productData.description || '',
          condition: productData.condition || '全新',
          category: productData.category || '其他',
          meetupLocation: productData.meetupLocation || '輔大校園'
        });
        setImagePreview(productData.image);

      } catch (err) {
        console.error('Error fetching product:', err);
        setError('載入商品資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, auth.currentUser, db]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('圖片大小不能超過 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('請先登入');
      return;
    }

    if (!formData.title || !formData.price || !formData.description) {
      setError('請填寫所有必填欄位');
      return;
    }

    try {
      setIsSubmitting(true);
      const docRef = doc(db, 'products', productId);
      
      await updateDoc(docRef, {
        ...formData,
        image: imagePreview,
        updatedAt: new Date(),
      });

      alert('商品更新成功！');
      navigate(`/product/${productId}`);
    } catch (err) {
      console.error('Error updating product:', err);
      setError('更新商品時發生錯誤');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="edit-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(-1)} className="back-button">
          返回上一頁
        </button>
      </div>
    );
  }

  return (
    <div className="edit-container">
      <h1>編輯商品</h1>
      <form className="edit-form" onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="title">商品名稱 *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">價格 *</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">商品描述 *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="condition">商品狀態</label>
          <select
            id="condition"
            name="condition"
            value={formData.condition}
            onChange={handleInputChange}
          >
            <option value="全新">全新</option>
            <option value="二手">二手</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="category">商品類別</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="教科書">教科書</option>
            <option value="3C產品">3C產品</option>
            <option value="傢俱寢具">傢俱寢具</option>
            <option value="衣物">衣物</option>
            <option value="食品">食品</option>
            <option value="其他">其他</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="image">商品圖片</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="商品預覽" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="meetupLocation">面交地點</label>
          <input
            type="text"
            id="meetupLocation"
            name="meetupLocation"
            value={formData.meetupLocation}
            onChange={handleInputChange}
            placeholder="請填寫面交地點"
          />
        </div>

        <button 
          type="submit" 
          className="submit-button" 
          disabled={isSubmitting}
        >
          {isSubmitting ? '更新中...' : '更新商品'}
        </button>
      </form>
    </div>
  );
};

export default EditProduct; 