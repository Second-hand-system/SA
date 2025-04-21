import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../firebase';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('進行中');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [auctionStartTime, setAuctionStartTime] = useState('');
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [saleType, setSaleType] = useState('先搶先贏');

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

  const handleSetSaleType = async (type) => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以設定銷售類型');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      const updates = {
        saleType: type
      };

      if (type === '先搶先贏') {
        updates.auctionStartTime = null;
        updates.auctionEndTime = null;
        updates.status = '進行中';
      }

      await updateDoc(productRef, updates);
      setProduct(prev => ({ ...prev, ...updates }));
      setSaleType(type);
      alert('銷售類型已更新');
    } catch (error) {
      console.error('Error updating sale type:', error);
      alert('更新銷售類型時發生錯誤');
    }
  };

  const handleDeleteProduct = async () => {
    if (!window.confirm('確定要刪除此商品嗎？此操作無法復原。')) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteDoc(doc(db, 'products', productId));
      alert('商品已成功刪除！');
      navigate('/');
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('刪除商品時發生錯誤，請稍後再試。');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <div className="product-detail-container">載入中...</div>;
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="not-found">
          <h2>找不到產品</h2>
          <p>您所尋找的產品不存在或已被移除。</p>
          <Link to="/" className="back-home-btn">返回首頁</Link>
        </div>
      </div>
    );
  }

  const isOwner = auth.currentUser && product.sellerId === auth.currentUser.uid;

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        <div className="product-image">
          <img src={product.image || 'https://via.placeholder.com/300x200?text=無圖片'} alt={product.title} />
        </div>
        <div className="product-info">
          <h1>{product.title}</h1>
          <div className="product-price">NT$ {product.price}</div>
          
          {/* 銷售類型選擇 */}
          {isOwner && (
            <div className="sale-type-selector">
              <h3>銷售類型</h3>
              <div className="sale-type-buttons">
                <button
                  className={`sale-type-btn ${saleType === '先搶先贏' ? 'active' : ''}`}
                  onClick={() => handleSetSaleType('先搶先贏')}
                >
                  先搶先贏
                </button>
                <button
                  className={`sale-type-btn ${saleType === '競標' ? 'active' : ''}`}
                  onClick={() => handleSetSaleType('競標')}
                >
                  競標
                </button>
              </div>
            </div>
          )}
          
          {/* 競標資訊 */}
          {saleType === '競標' && (
            <div className="auction-info">
              <div className="auction-timer">
                <h3>競標狀態</h3>
                <p className="auction-status">{auctionStatus}</p>
                {product.auctionEndTime ? (
                  <p className="time-left">
                    開始時間：{new Date(product.auctionStartTime).toLocaleString('zh-TW')}
                    <br />
                    結束時間：{new Date(product.auctionEndTime).toLocaleString('zh-TW')}
                    <br />
                    剩餘時間：{timeLeft}
                  </p>
                ) : (
                  isOwner && (
                    <button 
                      className="set-time-btn"
                      onClick={() => setShowTimePicker(true)}
                    >
                      設定競標時間
                    </button>
                  )
                )}
              </div>

              {/* 時間選擇器 */}
              {showTimePicker && (
                <div className="time-picker">
                  <h3>設定競標時間</h3>
                  <div className="time-inputs">
                    <div className="time-input">
                      <label>開始時間：</label>
                      <input
                        type="datetime-local"
                        value={auctionStartTime}
                        onChange={(e) => setAuctionStartTime(e.target.value)}
                      />
                    </div>
                    <div className="time-input">
                      <label>結束時間：</label>
                      <input
                        type="datetime-local"
                        value={auctionEndTime}
                        onChange={(e) => setAuctionEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="time-picker-buttons">
                    <button 
                      className="confirm-btn"
                      onClick={handleSetAuctionTime}
                    >
                      確認
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={() => setShowTimePicker(false)}
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
              
              {/* 狀態更新控制 */}
              {isOwner && timeLeft === '已結束' && (
                <div className="status-controls">
                  <h3>更新商品狀態</h3>
                  <div className="status-buttons">
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('待付款')}
                      disabled={auctionStatus === '待付款'}
                    >
                      待付款
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('已售出')}
                      disabled={auctionStatus === '已售出'}
                    >
                      已售出
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('未售出')}
                      disabled={auctionStatus === '未售出'}
                    >
                      未售出
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 先搶先贏狀態顯示 */}
          {saleType === '先搶先贏' && (
            <div className="quick-sale-info">
              <h3>銷售狀態</h3>
              <p className="sale-status">{product.status || '進行中'}</p>
              {isOwner && (
                <div className="status-controls">
                  <h3>更新商品狀態</h3>
                  <div className="status-buttons">
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('待付款')}
                      disabled={product.status === '待付款'}
                    >
                      待付款
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('已售出')}
                      disabled={product.status === '已售出'}
                    >
                      已售出
                    </button>
                    <button 
                      className="status-btn"
                      onClick={() => handleUpdateStatus('未售出')}
                      disabled={product.status === '未售出'}
                    >
                      未售出
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description}</p>
          </div>
          <div className="product-details">
            <h3>商品詳情</h3>
            <ul>
              <li><strong>商品狀態：</strong> {product.condition || '未指定'}</li>
              <li><strong>賣家：</strong> {product.sellerName || '未知'}</li>
              <li><strong>聯絡方式：</strong> {product.sellerEmail || '未提供'}</li>
              <li><strong>上架時間：</strong> {product.createdAt || '未知'}</li>
              <li><strong>商品類別：</strong> {product.category || '未分類'}</li>
              <li><strong>面交地點：</strong> {product.location || '未指定'}</li>
            </ul>
          </div>
          <div className="product-actions">
            {isOwner ? (
              <>
                <button
                  className="delete-product-btn"
                  onClick={handleDeleteProduct}
                  disabled={isDeleting}
                >
                  {isDeleting ? '刪除中...' : '刪除商品'}
                </button>
                <button
                  className="edit-product-btn"
                  onClick={() => navigate(`/product/edit/${productId}`)}
                >
                  編輯商品
                </button>
              </>
            ) : (
              <>
                <button className="contact-seller-btn">聯絡賣家</button>
                <button className="save-product-btn">收藏商品</button>
                <button className="share-product-btn">分享商品</button>
              </>
            )}
          </div>
          <Link to="/" className="back-home-link">返回首頁</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 