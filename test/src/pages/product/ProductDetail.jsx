import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../firebase';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('進行中');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [auctionStartTime, setAuctionStartTime] = useState('');
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [saleType, setSaleType] = useState('先搶先贏');

  // 商品類別
  const categories = [
    { id: 'all', name: '全部商品', icon: '🛍️' },
    { id: 'books', name: '書籍教材', icon: '📚' },
    { id: 'electronics', name: '電子產品', icon: '📱' },
    { id: 'furniture', name: '家具寢具', icon: '🛋️' },
    { id: 'clothes', name: '衣物服飾', icon: '👕' },
    { id: 'others', name: '其他', icon: '📦' }
  ];

  // 將類別ID轉換為中文名稱的函數
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '其他';
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            data.createdAt = data.createdAt.toDate().toLocaleString('zh-TW');
          }
          setProduct({ id: docSnap.id, ...data });
          setSaleType(data.saleType || '先搶先贏');
          
          if (data.auctionEndTime) {
            const endTime = new Date(data.auctionEndTime);
            const now = new Date();
            if (now > endTime) {
              setAuctionStatus(data.status || '已結束');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, db]);

  useEffect(() => {
    if (product?.auctionEndTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(product.auctionEndTime);
        const difference = endTime - now;

        if (difference <= 0) {
          setTimeLeft('已結束');
          setAuctionStatus(product.status || '已結束');
          clearInterval(timer);
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft(`${days}天 ${hours}時 ${minutes}分 ${seconds}秒`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [product]);

  // 檢查商品是否已收藏
  useEffect(() => {
    const checkIfFavorite = async () => {
      if (!auth.currentUser || !productId) {
        setIsFavorite(false);
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        const favoriteId = `${userId}_${productId}`;
        const favoriteRef = doc(db, 'favorites', favoriteId);
        const favoriteDoc = await getDoc(favoriteRef);
        setIsFavorite(favoriteDoc.exists());
      } catch (error) {
        console.error('Error checking favorite status:', error);
        setIsFavorite(false);
      }
    };

    checkIfFavorite();
  }, [auth.currentUser, productId, db]);

  const handleUpdateStatus = async (newStatus) => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以更新商品狀態');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        status: newStatus
      });
      setProduct(prev => ({ ...prev, status: newStatus }));
      setAuctionStatus(newStatus);
      alert('商品狀態已更新');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新狀態時發生錯誤');
    }
  };

  const handleSetAuctionTime = async () => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以設定競標時間');
      return;
    }

    if (!auctionStartTime || !auctionEndTime) {
      alert('請設定開始和結束時間');
      return;
    }

    const start = new Date(auctionStartTime);
    const end = new Date(auctionEndTime);
    const now = new Date();

    if (start < now) {
      alert('開始時間不能早於現在');
      return;
    }

    if (end <= start) {
      alert('結束時間必須晚於開始時間');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        auctionStartTime: start.toISOString(),
        auctionEndTime: end.toISOString(),
        status: '未開始',
        saleType: '競標'
      });
      setProduct(prev => ({ 
        ...prev, 
        auctionStartTime: start.toISOString(),
        auctionEndTime: end.toISOString(),
        status: '未開始',
        saleType: '競標'
      }));
      setSaleType('競標');
      setShowTimePicker(false);
      alert('競標時間已設定');
    } catch (error) {
      console.error('Error setting auction time:', error);
      alert('設定競標時間時發生錯誤');
    }
  };

  const handleFavoriteClick = async () => {
    if (!auth.currentUser) {
      alert('請先登入');
      return;
    }

    try {
      const userId = auth.currentUser.uid;
      const favoriteId = `${userId}_${productId}`;
      const favoriteRef = doc(db, 'favorites', favoriteId);

      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setIsFavorite(false);
      } else {
        const favoriteData = {
          userId: userId,
          productId: productId,
          title: product.title,
          price: product.price,
          image: product.image,
          condition: product.condition,
          sellerName: product.sellerName,
          addedAt: serverTimestamp()
        };
        await setDoc(favoriteRef, favoriteData);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('收藏操作失敗，請稍後再試');
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以刪除商品');
      return;
    }

    if (!window.confirm('確定要刪除此商品嗎？此操作無法復原。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      navigate('/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('刪除商品時發生錯誤');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found">
        <h2>找不到商品</h2>
        <p>該商品可能已被刪除或不存在</p>
        <Link to="/" className="back-home-btn">返回首頁</Link>
      </div>
    );
  }

  const isOwner = auth.currentUser && product.sellerId === auth.currentUser.uid;

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        <div className="product-image-section">
          <div className="product-image">
            <img src={product.image} alt={product.title} />
          </div>
          <div className="product-actions">
            <button className="contact-seller-btn">
              聯絡賣家
            </button>
            {auth.currentUser && product.sellerId === auth.currentUser.uid ? (
              <>
                <Link to={`/product/edit/${productId}`} className="edit-product-btn">
                  編輯
                </Link>
                <button 
                  className="delete-product-btn"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '刪除中...' : '刪除'}
                </button>
                <button 
                  className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                  onClick={handleFavoriteClick}
                >
                  <span className="heart-icon"></span>
                </button>
              </>
            ) : (
              <button 
                className={`favorite-btn ${isFavorite ? 'active' : ''}`}
                onClick={handleFavoriteClick}
              >
                <span className="heart-icon"></span>
              </button>
            )}
          </div>
        </div>
        <div className="product-info">
          <h1>{product.title}</h1>
          <div className="product-price">NT$ {product.price}</div>
          
          <div className="sale-type-selector">
            <h3>銷售方式</h3>
            <div className="sale-type-buttons">
              <button 
                className={`sale-type-btn ${saleType === '先搶先贏' ? 'active' : ''}`}
                onClick={() => setSaleType('先搶先贏')}
                disabled={product.sellerId !== auth.currentUser?.uid}
              >
                先搶先贏
              </button>
              <button 
                className={`sale-type-btn ${saleType === '競標' ? 'active' : ''}`}
                onClick={() => {
                  setSaleType('競標');
                  setShowTimePicker(true);
                }}
                disabled={product.sellerId !== auth.currentUser?.uid}
              >
                競標
              </button>
            </div>
          </div>

          {saleType === '競標' && (
            <div className="auction-info">
              <div className="auction-timer">
                <h3>競標時間</h3>
                <div className="time-left">{timeLeft || '未設定'}</div>
              </div>
              <div className="status-controls">
                <h3>競標狀態: {auctionStatus}</h3>
                {product.sellerId === auth.currentUser?.uid && (
                  <div className="status-buttons">
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('進行中')}
                      disabled={auctionStatus === '進行中'}
                    >
                      開始競標
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('已結束')}
                      disabled={auctionStatus === '已結束'}
                    >
                      結束競標
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {showTimePicker && (
            <div className="time-picker">
              <h3>設定競標時間</h3>
              <div className="time-inputs">
                <div className="time-input">
                  <label>開始時間:</label>
                  <input
                    type="datetime-local"
                    value={auctionStartTime}
                    onChange={(e) => setAuctionStartTime(e.target.value)}
                  />
                </div>
                <div className="time-input">
                  <label>結束時間:</label>
                  <input
                    type="datetime-local"
                    value={auctionEndTime}
                    onChange={(e) => setAuctionEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="time-picker-buttons">
                <button className="confirm-btn" onClick={handleSetAuctionTime}>
                  確認
                </button>
                <button className="cancel-btn" onClick={() => setShowTimePicker(false)}>
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description}</p>
          </div>
          
          <div className="product-details">
            <h3>商品資訊</h3>
            <ul>
              <li><strong>類別:</strong> {getCategoryName(product.category)}</li>
              <li><strong>狀態:</strong> {product.condition}</li>
              <li><strong>上架時間:</strong> {product.createdAt}</li>
              <li><strong>賣家:</strong> {product.sellerName}</li>
            </ul>
          </div>
        </div>
      </div>
      <Link to="/" className="back-home-link">
        返回首頁
      </Link>
    </div>
  );
};

export default ProductDetail; 