import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../firebase';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
          setError(null);
        } else {
          setError('找不到商品');
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('載入商品時發生錯誤');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, db]);

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
    return (
      <div className="product-detail-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="not-found">
          <h2>找不到商品</h2>
          <p>{error || '您所尋找的商品不存在或已被移除。'}</p>
          <Link to="/" className="back-home-btn">返回首頁</Link>
        </div>
      </div>
    );
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '未知';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isOwner = auth.currentUser && product.sellerId === auth.currentUser.uid;

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        <div className="product-image">
          <img src={product.image} alt={product.title} />
        </div>
        <div className="product-info">
          <h1>{product.title}</h1>
          <div className="product-price">NT$ {product.price}</div>
          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description}</p>
          </div>
          <div className="product-details">
            <h3>商品詳情</h3>
            <ul>
              <li><strong>商品狀態：</strong> {product.condition}</li>
              <li><strong>賣家：</strong> {product.sellerName}</li>
              <li><strong>聯絡方式：</strong> {product.contact || '請登入後查看'}</li>
              <li><strong>上架時間：</strong> {formatDate(product.createdAt)}</li>
              <li><strong>商品編號：</strong> {product.id}</li>
              <li><strong>商品類別：</strong> {product.category || '未分類'}</li>
              <li><strong>交易方式：</strong> {product.paymentMethod || '面交'}</li>
              <li><strong>面交地點：</strong> {product.meetupLocation || '輔大校園'}</li>
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
                <button className="edit-product-btn">編輯商品</button>
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