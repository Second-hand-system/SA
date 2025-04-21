// 導入 React 核心功能，包括 useState 和 useEffect hooks
import React, { useState, useEffect } from 'react';
// 導入自定義的認證上下文
import { useAuth } from '../../context/AuthContext';
// 導入 Firebase Firestore 的查詢和過濾功能
import { getFirestore, collection, getDocs, query, orderBy, limit, where, startAfter, doc, getDoc } from 'firebase/firestore';
// 導入 React Router 的鏈接組件
import { Link } from 'react-router-dom';
// 導入 Firebase 應用實例
import app from '../../firebase';
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
  
  // Initialize Firestore
  const db = getFirestore(app);
  
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
      setError(null);  // 清除之前的錯誤
      
      console.log('開始獲取商品...');
      console.log('當前頁碼:', page);
      console.log('當前類別:', category);
      
      let productsRef = collection(db, 'products');
      let productsQuery;
      
      // 根據類別篩選商品
      if (category !== 'all') {
        console.log('應用類別過濾:', category);
        productsQuery = query(
          productsRef,
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      } else {
        productsQuery = query(
          productsRef,
          orderBy('createdAt', 'desc')
        );
      }

      // 獲取所有商品以計算總頁數
      console.log('正在獲取總商品數...');
      const allProductsSnapshot = await getDocs(productsQuery);
      const totalProducts = allProductsSnapshot.docs.length;
      console.log('總商品數:', totalProducts);
      setTotalPages(Math.ceil(totalProducts / productsPerPage));

      // 計算分頁的起始位置
      const startIndex = (page - 1) * productsPerPage;
      
      // 獲取當前頁的商品
      const paginatedQuery = query(
        productsQuery,
        limit(productsPerPage)
      );
      
      if (startIndex > 0) {
        // 獲取前一頁的最後一個文檔
        const previousPageQuery = query(
          productsQuery,
          limit(startIndex)
        );
        const previousPageSnapshot = await getDocs(previousPageQuery);
        const lastVisible = previousPageSnapshot.docs[previousPageSnapshot.docs.length - 1];
        
        // 使用 startAfter 來獲取下一頁
        paginatedQuery = query(
          productsQuery,
          startAfter(lastVisible),
          limit(productsPerPage)
        );
      }
      
      console.log('正在獲取當前頁商品...');
      const querySnapshot = await getDocs(paginatedQuery);
      const fetchedProducts = [];
      
      // 處理獲取到的商品數據
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('商品數據:', { id: doc.id, ...data });
        fetchedProducts.push({
          id: doc.id,
          ...data
        });
      });

      setProducts(fetchedProducts);
      setError(null);
    } catch (err) {
      console.error('獲取商品時發生錯誤:', err);
      setError(`載入商品時發生錯誤: ${err.message}`);
      setProducts([]); // 清空商品列表
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
            <Link to={`/product/${product.id}`} key={product.id} className="item-card">
                  <div className="item-image">
                <img src={product.image} alt={product.title} />
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