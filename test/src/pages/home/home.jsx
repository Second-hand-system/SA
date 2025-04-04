import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import app from '../../firebase';
import './home.css';

function Home() {
  const { currentUser } = useAuth();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize Firestore
  const db = getFirestore(app);
  
  // 獲取商品
  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(6)
      );
      
      const querySnapshot = await getDocs(itemsQuery);
      const items = [];
      
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setFeaturedItems(items);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('無法載入商品，請稍後再試');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchItems();
  }, [db]);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>輔大二手交易平台</h1>
          <p>買賣交流、資源共享、永續校園</p>
          <form className="search-bar">
            <input type="text" placeholder="搜尋商品..." />
            <button type="submit">搜尋</button>
          </form>
        </div>
      </div>

      {/* User Welcome */}
      {currentUser && (
        <div className="user-welcome">
          <p>您好，{currentUser.displayName || currentUser.email}！歡迎回來</p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Featured Items */}
      <div className="section">
        <h2>熱門商品</h2>
        {loading ? (
          <div className="loading-spinner">載入中...</div>
        ) : (
          <div className="items-container">
            {featuredItems.length > 0 ? (
              featuredItems.map(item => (
                <div className="item-card" key={item.id}>
                  <div className="item-image">
                    <img src={item.image || 'https://via.placeholder.com/300x200?text=無圖片'} alt={item.title} />
                  </div>
                  <div className="item-details">
                    <h3>{item.title}</h3>
                    <p className="item-price">NT$ {item.price}</p>
                    <div className="item-meta">
                      <span className="item-condition">{item.condition}</span>
                      <span className="item-seller">賣家: {item.sellerName || '未知'}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-items-message">
                <p>沒有商品可顯示</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h2>有物品想要出售嗎？</h2>
        <p>快速刊登，輕鬆賺取額外收入</p>
        <Link to="/sell">
          <button className="cta-button">立即刊登</button>
        </Link>
      </div>
    </div>
  );
}

export default Home;