import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../../context/AuthContext';
import { storage, db, ensureAuth } from '../../firebase';
import './sell.css';

function Sell() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // 商品表單資料
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: '電子產品',
  });

  // 檢查用戶登入狀態
  useEffect(() => {
    ensureAuth()
      .then(() => setError(''))
      .catch(err => setError(err.message));
  }, []);

  // 處理表單輸入變化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // 處理圖片上傳預覽
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }
      
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
      setError('');
    }
  };

  // 上傳圖片到 Storage
  const uploadImage = async (file) => {
    const fileExtension = file.name.split('.').pop();
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const storageRef = ref(storage, `products/${safeFileName}`);
    
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedBy: currentUser.email,
        originalName: file.name
      }
    };

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(Math.round(progress));
        },
        (error) => {
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch (error) {
            console.error('Get URL error:', error);
            reject(error);
          }
        }
      );
    });
  };

  // 上傳商品到 Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await ensureAuth();
    } catch (err) {
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

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);

      // 上傳圖片
      const imageUrl = await uploadImage(imageFile);
      
      // 準備商品資料
      const productData = {
        ...formData,
        price: Number(formData.price),
        image: imageUrl,
        sellerName: currentUser.displayName || '未知賣家',
        sellerEmail: currentUser.email,
        sellerId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'available'
      };

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
      setUploadProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-container">
      <h1>上架商品</h1>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {uploadProgress > 0 && (
        <div className="upload-progress">
          <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
            {uploadProgress}%
          </div>
        </div>
      )}
      
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
            <option value="電子產品">電子產品</option>
            <option value="書籍教材">書籍教材</option>
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
            disabled={loading}
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
          className="submit-button" 
          disabled={loading || !currentUser}
        >
          {loading ? `上架中 ${uploadProgress}%` : '確認上架'}
        </button>
      </form>
    </div>
  );
}

export default Sell;