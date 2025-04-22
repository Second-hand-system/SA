import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, query, getDocs, where } from 'firebase/firestore';
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
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', auth.currentUser.uid));
        const favoritesSnapshot = await getDocs(q);
        
        const favoritesData = favoritesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 按添加時間排序
        favoritesData.sort((a, b) => b.createdAt?.toDate() - a.createdAt?.toDate());
        
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
          {favorites.map(favorite => (
            <Link to={`/product/${favorite.productId}`} key={favorite.id} className="favorite-card">
              <div className="favorite-image">
                <img src={favorite.productData.image || 'https://via.placeholder.com/300x200?text=無圖片'} alt={favorite.productData.title} />
              </div>
              <div className="favorite-details">
                <h3>{favorite.productData.title}</h3>
                <p className="favorite-price">NT$ {favorite.productData.price}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites; 