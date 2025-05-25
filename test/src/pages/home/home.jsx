// 導入 React 核心功能，包括 useState 和 useEffect hooks
import React, { useState, useEffect } from 'react';
// 導入自定義的認證上下文
import { useAuth } from '../../context/AuthContext';
// 導入 Firebase Firestore 的查詢和過濾功能
import { getFirestore, collection, getDocs, query, orderBy, limit, where, startAfter, doc, getDoc } from 'firebase/firestore';
// 導入 React Router 的鏈接組件
<<<<<<< HEAD
import { Link } from 'react-router-dom';
=======
import { Link, useSearchParams } from 'react-router-dom';
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
// 導入 Firebase 應用實例
import app, { checkIsFavorite, addToFavorites, removeFromFavorites } from '../../firebase';
// 導入 Redux hooks 和 actions
import { useDispatch, useSelector } from 'react-redux';
import { addFavorite, removeFavorite } from '../../store/slices/favoriteSlice';
// 導入樣式文件
import './home.css';

function Home() {
<<<<<<< HEAD
=======
  const [searchParams, setSearchParams] = useSearchParams();
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
<<<<<<< HEAD
  const [currentPage, setCurrentPage] = useState(1);
=======
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
  const [totalPages, setTotalPages] = useState(1);
  const productsPerPage = 6;
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  
  // Initialize Firestore and Redux
  const db = getFirestore(app);
  const dispatch = useDispatch();
  const favorites = useSelector(state => state.favorites.favorites);
  
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
      
<<<<<<< HEAD
      // 修改查詢方式以符合 Firestore 索引要求
      if (category !== 'all') {
        console.log('應用類別過濾:', category);
        baseQuery = query(
          productsRef,
          where('category', '==', category),
          orderBy('status'),
=======
      // 簡化查詢，先獲取所有商品
      if (category !== 'all') {
        baseQuery = query(
          productsRef,
          where('category', '==', category),
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
          orderBy('createdAt', 'desc')
        );
      } else {
        baseQuery = query(
          productsRef,
<<<<<<< HEAD
          orderBy('status'),
=======
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
          orderBy('createdAt', 'desc')
        );
      }

<<<<<<< HEAD
      // 獲取總商品數
      const allProductsSnapshot = await getDocs(baseQuery);
      const totalProducts = allProductsSnapshot.docs
        .filter(doc => {
          const status = doc.data().status;
          return status !== '已售出' && status !== '已結標';
        })
        .length;
      console.log('總商品數:', totalProducts);
      setTotalPages(Math.ceil(totalProducts / productsPerPage));

      // 計算分頁
      const startIndex = (page - 1) * productsPerPage;
      let fetchedProducts = [];

      // 獲取當前頁的商品
      const paginatedQuery = query(
        baseQuery,
        limit(productsPerPage * 2) // 增加限制以補償過濾後的數量
      );

      if (page > 1) {
        const previousPageQuery = query(
          baseQuery,
          limit(startIndex * 2) // 增加限制以補償過濾後的數量
        );
        const previousPageSnapshot = await getDocs(previousPageQuery);
        const filteredDocs = previousPageSnapshot.docs.filter(doc => {
          const status = doc.data().status;
          return status !== '已售出' && status !== '已結標';
        });
        
        if (filteredDocs.length > 0) {
          const lastVisible = filteredDocs[filteredDocs.length - 1];
          const currentPageQuery = query(
            baseQuery,
            startAfter(lastVisible),
            limit(productsPerPage * 2) // 增加限制以補償過濾後的數量
          );
          const querySnapshot = await getDocs(currentPageQuery);
          
          querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status !== '已售出' && data.status !== '已結標') {
              const isFavorite = favorites.some(fav => fav.productId === doc.id);
              fetchedProducts.push({
                id: doc.id,
                ...data,
                isFavorite
              });
            }
          });
        }
      } else {
        const querySnapshot = await getDocs(paginatedQuery);
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.status !== '已售出' && data.status !== '已結標') {
            const isFavorite = favorites.some(fav => fav.productId === doc.id);
            fetchedProducts.push({
              id: doc.id,
              ...data,
              isFavorite
            });
          }
        });
      }
      
      // 只取需要的數量
      fetchedProducts = fetchedProducts.slice(0, productsPerPage);
      
      console.log('獲取到的商品:', fetchedProducts);
=======
      // 獲取所有商品並進行調試
      const allProductsSnapshot = await getDocs(baseQuery);
      console.log('獲取到的原始商品數量:', allProductsSnapshot.docs.length);
      
      // 調試每個商品的狀態
      allProductsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('商品ID:', doc.id);
        console.log('商品狀態:', data.status);
        console.log('商品標題:', data.title);
        console.log('交易模式:', data.tradeMode);
        if (data.auctionEndTime) {
          console.log('競標結束時間:', data.auctionEndTime);
        }
      });

      // 過濾商品
      const filteredProducts = allProductsSnapshot.docs.filter(doc => {
        const data = doc.data();
        const now = new Date();
        
        // 調試過濾條件
        console.log('檢查商品:', doc.id);
        console.log('狀態:', data.status);
        console.log('交易模式:', data.tradeMode);
        
        // 如果是競標商品
        if (data.tradeMode === '競標模式') {
          if (data.auctionEndTime) {
            const endTime = new Date(data.auctionEndTime);
            const isActive = endTime > now;
            console.log('競標商品，結束時間:', endTime);
            console.log('是否過期:', !isActive);
            return isActive;
          }
          return true; // 如果沒有設置結束時間，顯示所有競標商品
        }
        
        // 如果是普通商品（先搶先贏模式）
        // 只要不是已售出狀態就顯示
        if (data.status !== '已售出') {
          console.log('商品未被售出，將顯示');
          return true;
        }
        
        console.log('商品不符合顯示條件');
        return false;
      });

      console.log('過濾後的商品數量:', filteredProducts.length);
      const totalProducts = filteredProducts.length;
      setTotalPages(Math.ceil(totalProducts / productsPerPage));

      // 計算當前頁的商品
      const startIndex = (page - 1) * productsPerPage;
      const endIndex = startIndex + productsPerPage;
      const currentPageProducts = filteredProducts.slice(startIndex, endIndex);

      // 轉換為需要的格式
      const fetchedProducts = currentPageProducts.map(doc => {
        const data = doc.data();
        const isFavorite = favorites.some(fav => fav.productId === doc.id);
        return {
          id: doc.id,
          ...data,
          isFavorite
        };
      });

      console.log('當前頁商品數量:', fetchedProducts.length);
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
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
  }, [currentPage, favorites]);

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
        limit(40) // 增加限制以補償過濾後的數量
      );
      
      const querySnapshot = await getDocs(searchQuery);
      const results = [];
      
      // 過濾搜索結果
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        if (product.status !== '已售出' && 
            product.status !== '已結標' && 
            product.title.toLowerCase().includes(searchTerm.toLowerCase())) {
          results.push({
            id: doc.id,
            ...product
          });
        }
      });
      
      // 只取前20個結果
      setSearchResults(results.slice(0, 20));
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
<<<<<<< HEAD
=======
    setSearchParams({ page: newPage.toString() });
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
    window.scrollTo(0, 0);
  };

  // 處理類別變更的函數
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setSearchResults([]);
<<<<<<< HEAD
  };

=======
    setCurrentPage(1);
    setSearchParams({ page: '1' });
  };

  // 當 URL 參數改變時更新頁碼
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    if (page !== currentPage) {
      setCurrentPage(page);
    }
  }, [searchParams]);

>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
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
      const isFavorite = favorites.some(fav => fav.productId === product.id);

      if (isFavorite) {
        await removeFromFavorites(userId, product.id);
        const favoriteToRemove = favorites.find(fav => fav.productId === product.id);
        if (favoriteToRemove) {
          dispatch(removeFavorite(favoriteToRemove.id));
        }
        setMessageText('已取消收藏');
      } else {
        const productData = {
          title: product.title || '',
          ...(product.images && product.images.length > 0 ? { images: product.images } : {}),
          image: (product.images && product.images.length > 0) 
            ? product.images[0] 
            : (product.image || '/placeholder.jpg'),
          price: product.price || 0,
          category: product.category || 'others',
          status: product.status || '販售中',
          auctionEndTime: product.auctionEndTime || null,
          auctionStartTime: product.auctionStartTime || null,
          condition: product.condition || '未指定',
          sellerName: product.sellerName || '未知賣家'
        };
        
        await addToFavorites(userId, product.id, productData);
        const newFavoriteId = `${userId}_${product.id}`;
        dispatch(addFavorite({
          id: newFavoriteId,
          userId,
          productId: product.id,
          ...productData
        }));
        setMessageText('已加入收藏');
      }

      // 顯示提示訊息
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);

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
      {/* 顯示提示訊息 */}
      {showMessage && (
        <div className="success-message">
          {messageText}
        </div>
      )}

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
<<<<<<< HEAD
              <Link to={`/product/${product.id}`} className="item-link">
=======
              <Link 
                to={`/product/${product.id}?returnPage=${currentPage}`} 
                className="item-link"
              >
>>>>>>> a2e378dba7f60873641fabd73efbeb7e7dc0f448
                  <div className="item-image">
                    <img 
                      src={
                        (product.images && product.images.length > 0) 
                          ? product.images[0] 
                          : (product.image || '/placeholder.jpg')
                      } 
                      alt={product.title} 
                    />
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
            <div className="page-numbers">
              {(() => {
                let pages = [];
                const maxVisible = 5;
                let start = 1;
                let end = totalPages;

                if (totalPages > maxVisible) {
                  // 計算起始和結束頁碼
                  if (currentPage <= Math.ceil(maxVisible / 2)) {
                    // 當前頁在前半部分
                    end = maxVisible;
                  } else if (currentPage > totalPages - Math.floor(maxVisible / 2)) {
                    // 當前頁在後半部分
                    start = totalPages - maxVisible + 1;
                    end = totalPages;
                  } else {
                    // 當前頁在中間
                    start = currentPage - Math.floor(maxVisible / 2);
                    end = start + maxVisible - 1;
                  }
                }

                // 生成頁碼按鈕
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`page-number ${currentPage === i ? 'active' : ''}`}
                      disabled={currentPage === i}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}
            </div>
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