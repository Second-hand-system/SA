import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import app from '../../firebase';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const db = getFirestore(app);
  const auth = getAuth(app);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!auth.currentUser) return;

      try {
        setLoading(true);
        const favoritesRef = collection(db, 'users', auth.currentUser.uid, 'favorites');
        const favoritesSnapshot = await getDocs(favoritesRef);
        
        const favoritesData = favoritesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 按添加時間排序
        favoritesData.sort((a, b) => b.addedAt?.toDate() - a.addedAt?.toDate());
        
        setFavorites(favoritesData);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('載入收藏商品時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [auth.currentUser, db]);

  if (loading) {
    return <div className="favorites-container">載入中...</div>;
  }

  if (error) {
    return <div className="favorites-container">
      <div className="error-message">{error}</div>
    </div>;
  }

  return (
    <div className="favorites-container">
      <h1>我的收藏</h1>
      {favorites.length === 0 ? (
        <div className="no-favorites">
          <p>目前沒有收藏的商品</p>
          <Link to="/" className="browse-link">瀏覽商品</Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map(product => (
            <Link to={`/product/${product.id}`} key={product.id} className="favorite-card">
              <div className="favorite-image">
                <img src={product.image || 'https://via.placeholder.com/300x200?text=無圖片'} alt={product.title} />
              </div>
              <div className="favorite-details">
                <h3>{product.title}</h3>
                <p className="favorite-price">NT$ {product.price}</p>
                <div className="favorite-meta">
                  <span className="favorite-condition">{product.condition}</span>
                  <span>賣家：{product.sellerName}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites; 