// 導入 React 核心功能，包括 useState 和 useEffect hooks
import React, { useState, useEffect } from 'react';
// 導入自定義的認證上下文
import { useAuth } from '../../context/AuthContext';
// 導入 Firebase Firestore 的查詢和過濾功能
import { getFirestore, collection, getDocs, query, orderBy, limit, where, startAfter, doc, getDoc } from 'firebase/firestore';
// 導入 React Router 的鏈接組件
import { Link } from 'react-router-dom';
// 導入 Firebase 應用實例
import app, { checkIsFavorite, addToFavorites, removeFromFavorites } from '../../firebase';
// 導入收藏上下文
import { useFavorites } from '../../context/FavoritesContext';
// 導入樣式文件
import './home.css';

function Home() {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 6;
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize Firestore
  const db = getFirestore(app);
  const { addFavorite, removeFavorite } = useFavorites();
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // 獲取商品列表的函數
  const fetchProducts = async (page = 1, category = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('開始獲取商品...');
      console.log('當前頁碼:', page);
      console.log('當前類別:', category);
      
      let productsRef = collection(db, 'products');
      let baseQuery;
      
      if (category !== 'all') {
        console.log('應用類別過濾:', category);
        baseQuery = query(
          productsRef,
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      } else {
        baseQuery = query(
          productsRef,
          orderBy('createdAt', 'desc')
        );
      }

      const allProductsSnapshot = await getDocs(baseQuery);
      const totalProducts = allProductsSnapshot.docs.length;
      console.log('總商品數:', totalProducts);
      setTotalPages(Math.ceil(totalProducts / productsPerPage));

      let fetchedProducts = [];
      
      if (page === 1) {
        const firstPageQuery = query(baseQuery, limit(productsPerPage));
        const querySnapshot = await getDocs(firstPageQuery);
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          const isFavorite = currentUser ? await checkIsFavorite(currentUser.uid, doc.id) : false;
          fetchedProducts.push({
            id: doc.id,
            ...data,
            isFavorite
          });
        }
      } else {
        const previousPageQuery = query(
          baseQuery,
          limit((page - 1) * productsPerPage)
        );
        const previousPageSnapshot = await getDocs(previousPageQuery);
        const lastVisible = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];
        
        if (lastVisible) {
          const nextPageQuery = query(
            baseQuery,
            startAfter(lastVisible),
            limit(productsPerPage)
          );
          
          const querySnapshot = await getDocs(nextPageQuery);
          
          for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const isFavorite = currentUser ? await checkIsFavorite(currentUser.uid, doc.id) : false;
            fetchedProducts.push({
              id: doc.id,
              ...data,
              isFavorite
            });
          }
        } else {
          setError('無法載入更多商品');
        }
      }
      
      setProducts(fetchedProducts);
      setError(null);
    } catch (err) {
      console.error('獲取商品時發生錯誤:', err);
      setError(`載入商品時發生錯誤: ${err.message}`);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 當類別改變時重置頁碼並重新獲取商品
  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1, selectedCategory);
  }, [selectedCategory]);

  // 當頁碼改變時獲取商品
  useEffect(() => {
    fetchProducts(currentPage, selectedCategory);
  }, [currentPage]);

  // 處理搜索的函數
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const productsRef = collection(db, 'products');
      const searchQuery = query(
        productsRef,
        orderBy('title'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(searchQuery);
      const results = [];
      
      // 過濾搜索結果
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        if (product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
          id: doc.id,
            ...product
          });
        }
      });
      
      setSearchResults(results);
    } catch (err) {
      console.error('搜尋錯誤:', err);
      setError('搜尋時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 清除搜尋
  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
  };

  // 處理頁面變更的函數
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // 處理類別變更的函數
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setSearchResults([]);
  };

  // 決定要顯示的商品列表
  const displayProducts = searchTerm ? searchResults : products;

  // 處理收藏的函數
  const handleFavoriteClick = async (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentUser) {
      alert('請先登入');
      return;
    }

    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      const userId = currentUser.uid;
      console.log('Current user ID:', userId);
      console.log('Product:', product);

      const isFavorite = await checkIsFavorite(userId, product.id);
      console.log('Is favorite:', isFavorite);

      if (isFavorite) {
        console.log('Removing from favorites...');
        await removeFromFavorites(userId, product.id);
        removeFavorite(product.id);
        alert('已取消收藏');
      } else {
        console.log('Adding to favorites...');
        const productData = {
          title: product.title,
          image: product.image,
          price: product.price,
          productId: product.id
        };
        await addToFavorites(userId, product.id, productData);
        addFavorite({
          id: `${userId}_${product.id}`,
          userId,
          productId: product.id,
          productData
        });
        alert('已加入收藏');
      }

      // 更新商品列表中的收藏狀態
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? { ...p, isFavorite: !isFavorite } : p
        )
      );
    } catch (error) {
      console.error('收藏操作失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
  };

  // 渲染組件
  return (
    <div className="home-container">
      {/* 用戶歡迎區域 */}
      {currentUser && (
        <div className="user-welcome">
          歡迎回來，{currentUser.email}！
          <Link to="/sell" className="sell-button">
            我要刊登商品
          </Link>
        </div>
      )}

      {/* 英雄區域 */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>輔大二手交易平台</h1>
          <p>買賣交流・資源共享</p>
        </div>
        
          <form onSubmit={handleSearch} className="search-bar">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜尋商品..."
            />
          <button type="submit">搜尋</button>
            {searchTerm && (
            <button type="button" onClick={handleClearSearch} className="clear-search">
              清除
              </button>
            )}
          </form>
      </div>

      {/* 商品類別區域 */}
      <div className="section">
        <h2>商品類別</h2>
        <div className="categories-container">
          {categories.map(category => (
            <div
              key={category.id}
              className={`category-card ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategoryChange(category.id)}
            >
              <div className="category-icon">{category.icon}</div>
              <p>{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 錯誤信息顯示 */}
      {error && <div className="error-message">{error}</div>}

      {/* 商品列表區域 */}
      <div className="section">
        <h2>{categories.find(c => c.id === selectedCategory)?.name || '全部商品'}</h2>
          <div className="items-container">
          {displayProducts.map((product) => (
            <div key={product.id} className="item-card">
              <button
                className={`favorite-button ${product.isFavorite ? 'active' : ''}`}
                onClick={(e) => handleFavoriteClick(e, product)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </button>
              <Link to={`/product/${product.id}`} className="item-link">
                  <div className="item-image">
                    <img src={product.image} alt={product.title} />
                    {(product.status === '已結標' || (product.auctionEndTime && new Date() > new Date(product.auctionEndTime))) && (
                      <div className="sold-badge">已結標</div>
                    )}
                  </div>
                  <div className="item-details">
                  <h3>{product.title}</h3>
                  <p className="item-price">NT$ {product.price}</p>
                    <div className="item-meta">
                    <span className="item-condition">{product.condition}</span>
                    <span className="item-category">{getCategoryName(product.category)}</span>
                    <span>賣家：{product.sellerName}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* 分頁控制 */}
        {!searchTerm && totalPages > 1 && (
          <div className="pagination">
            <button 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="page-button"
            >
              上一頁
            </button>
            <span className="page-info">
              第 {currentPage} 頁，共 {totalPages} 頁
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="page-button"
            >
              下一頁
            </button>
              </div>
        )}

        {/* 無商品時的提示 */}
        {!loading && displayProducts.length === 0 && (
          <div className="no-products">
            <p>目前沒有商品</p>
            {currentUser && (
              <Link to="/sell" className="sell-link">
                立即上架商品
              </Link>
            )}
          </div>
        )}
      </div>

      {/* 頁腳 */}
      <footer className="home-footer">
        <p>&copy; 2025 輔大二手交易平台</p>
        <p>
          關於我們 | 使用條款 | 隱私政策
        </p>
      </footer>
    </div>
  );
}

export default Home; 