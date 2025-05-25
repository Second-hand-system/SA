// 導入 React 核心功能，包括 useState 和 useEffect hooks
import React, { useState, useEffect } from 'react';
// 導入 React Router 的導航功能
import { useNavigate } from 'react-router-dom';
// 導入 Firebase Firestore 的集合、添加文檔和服務器時間戳功能
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
// 導入自定義的認證上下文
import { useAuth } from '../../contexts/AuthContext';
// 導入 Firebase 數據庫實例
import { db, storage } from '../../firebase';
// 導入 Firebase Storage 的引用、上傳和下載功能
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// 導入自定義的圖片處理函數
import { compressImage } from '../../utils/imageUtils';
// 導入樣式文件
import './sell.css';

// 定義商品上架頁面組件
function Sell() {
  // 使用 useNavigate hook 獲取導航函數
  const navigate = useNavigate();
  // 從認證上下文獲取當前用戶信息
  const { currentUser } = useAuth();
  // 定義加載狀態，用於控制表單提交時的加載效果
  const [loading, setLoading] = useState(false);
  // 定義錯誤信息狀態，用於顯示錯誤提示
  const [error, setError] = useState('');
  // 定義成功信息狀態，用於顯示成功提示
  const [success, setSuccess] = useState('');
  // 定義圖片文件狀態，存儲上傳的圖片
  const [imageFile, setImageFile] = useState(null);
  // 定義圖片預覽狀態，用於顯示圖片預覽
  const [imagePreview, setImagePreview] = useState('');

  // 定義表單數據狀態，包含所有表單字段
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    description: '',
    condition: '全新',
    category: '',
    location: '',
    tradeMode: '先搶先贏',
    auctionStartTime: '',
    auctionEndTime: ''
  });

  // 使用 useEffect 檢查用戶登入狀態
  useEffect(() => {
    if (!currentUser) {
      setError('請先登入');
    }
  }, [currentUser]);

  // 處理表單輸入變化的函數
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  // 處理圖片上傳和預覽的函數
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 檢查文件大小（限制為 5MB）
      if (file.size > 5 * 1024 * 1024) {
        setError('圖片大小不能超過 5MB');
        return;
      }
      
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        setError('請上傳圖片檔案');
        return;
      }

      try {
        // 壓縮圖片
        const compressedFile = await compressImage(file);
        
        // 創建預覽
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(compressedFile);
        
        // 保存壓縮後的文件
        setImageFile(compressedFile);
        setError('');
      } catch (error) {
        console.error('圖片處理錯誤:', error);
        setError('圖片處理失敗，請重試');
      }
    }
  };

  // 處理表單提交的函數
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 檢查用戶是否已登入
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

    if (!formData.category) {
      setError('請選擇商品分類');
      return;
    }

    if (!formData.location.trim()) {
      setError('請輸入交易地點');
      return;
    }

    // 如果是競標模式，驗證競標時間
    if (formData.tradeMode === '競標模式') {
      if (!formData.auctionStartTime || !formData.auctionEndTime) {
        setError('請設定競標開始和結束時間');
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

    // 設置加載狀態
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('開始上傳商品...');

      // 上傳圖片到 Storage
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const extension = imageFile.name.split('.').pop();
      const fileName = `products/temp_${timestamp}_${randomString}.${extension}`;
      
      // 創建存儲引用
      const storageRef = ref(storage, fileName);

      // 設置元數據
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedBy: currentUser.uid,
          originalName: imageFile.name
        }
      };

      // 上傳壓縮後的文件
      const snapshot = await uploadBytes(storageRef, imageFile, metadata);
      console.log('圖片上傳成功:', snapshot.ref.fullPath);

      // 獲取下載URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('圖片下載URL:', downloadURL);

      // 準備要上傳的商品數據
      const productData = {
        title: formData.title.trim(),
        price: Number(formData.price),
        description: formData.description.trim(),
        category: formData.category,
        condition: formData.condition,
        location: formData.location.trim(),
        images: [downloadURL],
        sellerName: currentUser.displayName || '未知賣家',
        sellerEmail: currentUser.email,
        sellerId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'available',
        tradeMode: formData.tradeMode,
        auctionStartTime: formData.tradeMode === '競標模式' ? formData.auctionStartTime : null,
        auctionEndTime: formData.tradeMode === '競標模式' ? formData.auctionEndTime : null
      };

      // 將商品數據添加到 Firestore
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, productData);
      console.log('商品上傳成功，ID:', docRef.id);
      
      setSuccess('商品上架成功！');
      
      // 延遲 1.5 秒後跳轉到首頁
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

  // 渲染組件
  return (
    <div className="sell-container">
      <h1>上架商品</h1>

      {/* 顯示錯誤信息 */}
      {error && <div className="error-message">{error}</div>}
      {/* 顯示成功信息 */}
      {success && <div className="success-message">{success}</div>}

      {/* 商品上架表單 */}
      <form onSubmit={handleSubmit} className="sell-form">
        {/* 商品名稱輸入框 */}
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

        {/* 價格輸入框 */}
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

        {/* 商品分類選擇框 */}
        <div className="form-group">
          <label htmlFor="category">商品分類</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
          >
            <option value="">請選擇分類</option>
            <option value="books">書籍教材</option>
            <option value="electronics">電子產品</option>
            <option value="furniture">家具寢具</option>
            <option value="clothes">衣物服飾</option>
            <option value="others">其他</option>
          </select>
        </div>

        {/* 商品狀態選擇框 */}
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

        {/* 面交地點輸入框 */}
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

        {/* 交易模式選擇框 */}
        <div className="form-group">
          <label htmlFor="tradeMode">交易模式</label>
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

        {/* 商品描述輸入框 */}
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

        {/* 商品圖片上傳 */}
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
          {/* 圖片預覽區域 */}
          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="商品預覽" />
            </div>
          )}
        </div>

        {/* 提交按鈕 */}
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

// 導出 Sell 組件
export default Sell;