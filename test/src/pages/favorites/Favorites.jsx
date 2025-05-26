import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserFavorites, removeFromFavorites } from '../../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { removeFavorite, setFavorites } from '../../store/slices/favoriteSlice';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './Favorites.css';

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

const Favorites = () => {
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const { currentUser } = useAuth();
  const favorites = useSelector(state => state.favorites.favorites);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching favorites for user:', currentUser.uid);
        const favoritesData = await getUserFavorites(currentUser.uid);
        
        // 取得 Firestore 實例
        const db = getFirestore();
        // 檢查每個收藏商品是否還存在
        const validFavoritesPromises = favoritesData.map(async (favorite) => {
          const productRef = doc(db, 'products', favorite.productId);
          const productSnap = await getDoc(productRef);
          
          // 如果商品不存在或已被刪除，自動從收藏中移除
          if (!productSnap.exists()) {
            await removeFromFavorites(currentUser.uid, favorite.productId);
            return null;
          }
          
          const productData = productSnap.data();
          // 如果商品已下架或被刪除，也從收藏中移除
          if (productData.isDeleted || productData.status === 'delisted') {
            await removeFromFavorites(currentUser.uid, favorite.productId);
            return null;
          }
          
          return {
            ...favorite,
            ...productData
          };
        });

        const validFavorites = (await Promise.all(validFavoritesPromises))
          .filter(favorite => favorite !== null);

        console.log('Fetched valid favorites:', validFavorites);
        dispatch(setFavorites(validFavorites));
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('載入收藏商品時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser, dispatch, navigate]);

  const handleUnfavorite = async (productId) => {
    try {
      await removeFromFavorites(currentUser.uid, productId);
      // 找到要刪除的收藏項目的ID
      const favoriteToRemove = favorites.find(fav => fav.productId === productId);
      if (favoriteToRemove) {
        dispatch(removeFavorite(favoriteToRemove.id));
      }
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } catch (error) {
      console.error('Error removing favorite:', error);
      setError('移除收藏時發生錯誤');
    }
  };

  // 計算總頁數
  const totalPages = Math.ceil((favorites?.length || 0) / itemsPerPage);

  // 獲取當前頁面的商品
  const getCurrentPageItems = () => {
    if (!favorites) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return favorites.slice(startIndex, endIndex);
  };

  // 處理頁面變更
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  const handleCardClick = (id) => {
    navigate(`/product/${id}`);
  };

  // 檢查商品狀態的輔助函數
  const getProductStatus = (item) => {
    if (item.status === '已售出') {
      return { text: '已售出', class: 'sold' };
    }
    if (item.status === '已結標' || 
        (item.auctionEndTime && new Date() > new Date(item.auctionEndTime))) {
      return { text: '已結標', class: 'ended' };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="favorites-container">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      {showMessage && (
        <div className="success-message">
          商品已從收藏清單中移除
        </div>
      )}
      <h1>我的收藏</h1>
      {!favorites || favorites.length === 0 ? (
        <div className="no-favorites">
          <p>目前沒有收藏的商品</p>
          <Link to="/" className="browse-link">瀏覽商品</Link>
        </div>
      ) : (
        <>
          <div className="favorites-grid">
            {getCurrentPageItems().map((item) => {
              const status = getProductStatus(item);
              return (
                <div key={item.id} className="product-card">
                  <button
                    className="favorite-button active"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnfavorite(item.productId);
                    }}
                  >
                    <FaHeart />
                  </button>
                  <div
                    className="card-content"
                    onClick={() => handleCardClick(item.productId)}
                  >
                    <div className="item-image">
                      <img 
                        src={
                          item.images && item.images.length > 0
                            ? item.images[0]
                            : item.image || '/placeholder.jpg'
                        } 
                        alt={item.title} 
                      />
                      {status && (
                        <div className={`status-badge ${status.class}`}>
                          {status.text}
                        </div>
                      )}
                    </div>
                    <div className="info">
                      <h3>{item.title}</h3>
                      <p>{getCategoryName(item.category)}</p>
                      <p className="price">NT$ {item.price}</p>
                      <div className="item-meta">
                        <span className="item-condition">{item.condition}</span>
                        <span>賣家：{item.sellerName}</span>
                      </div>
                      {status && (
                        <div className={`status-info ${status.class}`}>
                          {status.text}
                          {item.buyerName && (
                            <span className="buyer-info">
                              {status.text === '已售出' ? '購買者' : '得標者'}：
                              {item.buyerName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一頁
              </button>
              <span className="page-info">
                第 {currentPage} 頁，共 {totalPages} 頁
              </span>
              <button
                className="page-button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites; 
