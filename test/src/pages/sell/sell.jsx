import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { storage, db } from '../../firebase';
import './sell.css';

function Sell() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // 商品表單資料
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新', // 預設值
    category: '書籍教材', // 預設值
  });

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 處理圖片上傳預覽
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 驗證檔案大小（最大 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }
      
      // 驗證檔案類型
      if (!file.type.startsWith('image/')) {
        setError('請上傳圖片檔案');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

      let imageUrl = '';
      
      // 如果有上傳圖片，先上傳到 Storage
      if (imageFile) {
        try {
          console.log('開始上傳圖片...');
          
          // 生成安全的檔案名稱
          const fileExtension = imageFile.name.split('.').pop();
          const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
          const storageRef = ref(storage, `products/${safeFileName}`);
          
          console.log('上傳圖片到:', safeFileName);
          
          // 設定中繼資料
          const metadata = {
            contentType: imageFile.type,
            customMetadata: {
              uploadedBy: currentUser.email,
              originalName: imageFile.name
            }
          };

          const uploadResult = await uploadBytes(storageRef, imageFile, metadata);
          console.log('圖片上傳成功:', uploadResult);
          
          imageUrl = await getDownloadURL(uploadResult.ref);
          console.log('取得圖片 URL:', imageUrl);
        } catch (uploadError) {
          console.error('圖片上傳錯誤:', uploadError);
          if (uploadError.code === 'storage/unauthorized') {
            throw new Error('您沒有權限上傳圖片，請確認是否已登入');
          } else if (uploadError.code === 'storage/canceled') {
            throw new Error('圖片上傳被取消');
          } else if (uploadError.code === 'storage/unknown') {
            throw new Error('圖片上傳時發生未知錯誤，請稍後再試');
          } else {
            throw new Error(`圖片上傳失敗: ${uploadError.message}`);
          }
        }
      }

      // 準備商品資料
      const productData = {
        ...formData,
        price: Number(formData.price),
        image: imageUrl,
        sellerName: currentUser.displayName || '未知賣家',
        sellerEmail: currentUser.email,
        createdAt: serverTimestamp(),
      };

      console.log('準備上傳商品資料:', productData);

      try {
        // 新增商品到 Firestore
        const docRef = await addDoc(collection(db, 'products'), productData);
        console.log('商品上傳成功，文件ID:', docRef.id);
        
        // 上架成功，導回首頁
        navigate('/');
      } catch (firestoreError) {
        console.error('Firestore 儲存錯誤:', firestoreError);
        throw new Error(`商品資料儲存失敗: ${firestoreError.message}`);
      }
      
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

        <div className="form-group">
          <label htmlFor="image">商品圖片</label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            required
          />
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="商品預覽" />
            </div>
          )}
        </div>

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? '上架中...' : '確認上架'}
        </button>
      </form>
    </div>
  );
}

export default Sell; 