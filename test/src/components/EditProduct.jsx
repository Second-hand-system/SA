import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImage } from '../utils/imageUtils';
import { useState } from 'react';

const [formData, setFormData] = useState({
  title: '',
  price: '',
  description: '',
  condition: '全新',
  category: 'books',
  location: '',
  tradeMode: '先搶先贏',
  auctionStartTime: '',
  auctionEndTime: ''
});

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

return (
  <div className="edit-container">
    <h1>編輯商品</h1>
    <form onSubmit={handleSubmit} className="edit-form">
      {/* ... existing form fields ... */}

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

      {/* ... rest of the form ... */}
    </form>
  </div>
); 