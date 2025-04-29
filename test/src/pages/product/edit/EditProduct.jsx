import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase';
import { compressImage } from '../../../utils/imageUtils';
import { useState } from 'react';

const EditProduct = () => {
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

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 5) {
      setError('最多只能上傳5張圖片');
      return;
    }

    try {
      setLoading(true);
      const imageUrls = [];
      
      for (const file of files) {
        // 驗證文件類型
        if (!file.type.startsWith('image/')) {
          setError('請上傳圖片文件');
          continue;
        }
        
        // 驗證文件大小 (2MB)
        if (file.size > 2 * 1024 * 1024) {
          setError('圖片大小不能超過2MB');
          continue;
        }

        // 壓縮圖片
        const compressedFile = await compressImage(file);
        
        // 上傳到 Firebase Storage
        const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        
        // 獲取下載URL
        const downloadURL = await getDownloadURL(storageRef);
        imageUrls.push(downloadURL);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imageUrls]
      }));
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      setError('圖片上傳失敗，請重試');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    // 處理表單提交邏輯
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
              <img key={index} src={url} alt={`商品圖片 ${index + 1}`} />
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
            <button type="button" className="back-button" onClick={() => window.history.back()}>
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