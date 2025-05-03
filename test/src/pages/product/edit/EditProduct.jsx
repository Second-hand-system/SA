import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import { compressImage, fileToBase64 } from '../../../utils/imageUtils';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import './EditProduct.css';
import { auth } from '../../../firebase';

// 將 ISO 日期字符串轉換為本地日期時間格式
const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    // 檢查是否為有效日期
    if (isNaN(date.getTime())) return '';
    // 轉換為本地時區的 ISO 字符串並截取前16個字符 (YYYY-MM-DDTHH:mm)
    return date.toISOString().slice(0, 16);
  } catch (error) {
    console.error('日期格式轉換錯誤:', error);
    return '';
  }
};

const EditProduct = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: 'books',
    location: '',
    tradeMode: '先搶先贏',
    auctionStartTime: '',
    auctionEndTime: '',
    images: []
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 獲取商品資料
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const data = productDoc.data();
          setFormData({
            ...data,
            auctionStartTime: formatDateForInput(data.auctionStartTime),
            auctionEndTime: formatDateForInput(data.auctionEndTime),
            images: data.images || []
          });
        } else {
          setError('找不到商品');
        }
      } catch (error) {
        console.error('獲取商品資料失敗:', error);
        setError('獲取商品資料失敗');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setError('最多只能上傳5張圖片');
      return;
    }

    try {
      setLoading(true);
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error('請上傳圖片文件');
        }
        
        if (file.size > 5 * 1024 * 1024) {
          throw new Error('圖片大小不能超過5MB');
        }

        try {
          // 壓縮圖片並轉換為 Base64
          const compressedFile = await compressImage(file);
          const base64Data = await fileToBase64(compressedFile);
          
          // 生成唯一的文件名
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(7);
          const safeFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
          const fileName = `products/${timestamp}_${randomString}_${safeFileName}`;
          
          // 創建存儲引用
          const storageRef = ref(storage, fileName);

          // 使用 Base64 數據上傳
          const snapshot = await uploadString(storageRef, base64Data, 'data_url', {
            contentType: 'image/jpeg',
            customMetadata: {
              uploadedBy: auth.currentUser.uid,
              originalName: file.name
            }
          });

          // 獲取下載 URL
          const downloadURL = await getDownloadURL(snapshot.ref);
          return downloadURL;
        } catch (error) {
          console.error('Error processing file:', error);
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      console.log('Uploaded URLs:', uploadedUrls);

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      setError('');
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error.message || '上傳圖片失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');

      // 驗證必填欄位
      if (!formData.title || !formData.price || !formData.description || !formData.location) {
        setError('請填寫所有必填欄位');
        return;
      }

      // 如果是競標模式，驗證時間
      if (formData.tradeMode === '競標模式') {
        if (!formData.auctionStartTime || !formData.auctionEndTime) {
          setError('請設定競標時間');
          return;
        }
        
        const startTime = new Date(formData.auctionStartTime);
        const endTime = new Date(formData.auctionEndTime);
        const now = new Date();

        if (startTime < now) {
          setError('競標開始時間不能早於現在');
          return;
        }

        if (endTime <= startTime) {
          setError('競標結束時間必須晚於開始時間');
          return;
        }
      }

      // 更新商品資料
      const updateData = {
        ...formData,
        updatedAt: new Date(),
        // 將本地時間轉換為 ISO 字符串
        auctionStartTime: formData.auctionStartTime ? new Date(formData.auctionStartTime).toISOString() : null,
        auctionEndTime: formData.auctionEndTime ? new Date(formData.auctionEndTime).toISOString() : null
      };

      await updateDoc(doc(db, 'products', productId), updateData);

      // 導航回商品詳情頁
      navigate(`/product/${productId}`);
    } catch (error) {
      console.error('更新商品失敗:', error);
      setError('更新商品失敗，請重試');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = (indexToDelete) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToDelete)
    }));
  };

  return (
    <div className="edit-container">
      <h1>編輯商品</h1>
      <form onSubmit={handleSubmit} className="edit-form">
        {/* 圖片上傳區域 */}
        <div className="image-section">
          <div className="form-group file-upload">
            <label htmlFor="images">上傳圖片</label>
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
          </div>
          {/* 圖片預覽區域 */}
          <div className="image-preview">
            {formData.images.map((url, index) => (
              <div key={index} className="image-preview-item">
                <img src={url} alt={`商品圖片 ${index + 1}`} />
                <button
                  type="button"
                  className="delete-image-btn"
                  onClick={() => handleDeleteImage(index)}
                  disabled={loading}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 表單區域 */}
        <div className="form-section">
          <div className="form-group">
            <label htmlFor="title">商品名稱</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
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
              disabled={loading}
              min="0"
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
              disabled={loading}
            />
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
            </select>
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
              <option value="books">書籍</option>
              <option value="electronics">電子產品</option>
              <option value="clothing">衣物</option>
              <option value="others">其他</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="location">交易地點</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          {/* 銷售方式選擇 */}
          <div className="form-group">
            <label htmlFor="tradeMode">銷售方式</label>
            <select
              id="tradeMode"
              name="tradeMode"
              value={formData.tradeMode}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="先搶先贏">先搶先贏</option>
              <option value="競標模式">競標模式</option>
            </select>
          </div>

          {/* 競標時間設定（僅在競標模式下顯示） */}
          {formData.tradeMode === '競標模式' && (
            <>
              <div className="form-group">
                <label htmlFor="auctionStartTime">競標開始時間</label>
                <input
                  type="datetime-local"
                  id="auctionStartTime"
                  name="auctionStartTime"
                  value={formData.auctionStartTime}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="auctionEndTime">競標結束時間</label>
                <input
                  type="datetime-local"
                  id="auctionEndTime"
                  name="auctionEndTime"
                  value={formData.auctionEndTime}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="bottom-buttons">
            <button type="button" className="back-button" onClick={() => navigate(-1)}>
              返回
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? '處理中...' : '儲存'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct; 