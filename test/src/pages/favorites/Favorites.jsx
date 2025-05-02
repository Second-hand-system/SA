import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getUserFavorites, removeFromFavorites } from '../../firebase';
import { useDispatch, useSelector } from 'react-redux';
import { removeFavorite, setFavorites } from '../../store/slices/favoriteSlice';
import { FaHeart } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import './Favorites.css';

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
        console.log('Fetched favorites:', favoritesData);
        dispatch(setFavorites(favoritesData));
      } catch (error) {
        console.error('Error fetching favorites:', error);
        setError('載入收藏商品時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUser, dispatch, navigate]);

  const handleUnfavorite = async (id) => {
    try {
      await removeFromFavorites(currentUser.uid, id);
      dispatch(removeFavorite(id));
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
            {getCurrentPageItems().map((item) => (
              <div key={item.id} className="product-card">
                <button
                  className="favorite-button active"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnfavorite(item.id);
                  }}
                >
                  <FaHeart />
                </button>
                <div
                  className="card-content"
                  onClick={() => handleCardClick(item.id)}
                >
                  <div className="item-image">
                  <img src={item.productData?.image} alt={item.productData?.name} />
                    {(item.productData?.status === '已結標' || 
                      (item.productData?.auctionEndTime && new Date() > new Date(item.productData?.auctionEndTime))) && (
                      <div className="sold-badge">已結標</div>
                    )}
                  </div>
                  <div className="info">
                    <h3>{item.productData?.name}</h3>
                    <p>{item.productData?.category}</p>
                    <p className="price">NT$ {item.productData?.price}</p>
                  </div>
                </div>
              </div>
            ))}
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