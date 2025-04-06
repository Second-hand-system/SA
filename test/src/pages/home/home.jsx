import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, collection, getDocs, query, orderBy, limit, startAt, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import app from '../../firebase';
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

  // 獲取商品
  const fetchProducts = async (page = 1, category = 'all') => {
    try {
      setLoading(true);
      let baseQuery = collection(db, 'products');
      
      // 根據類別篩選
      if (category !== 'all') {
        baseQuery = query(baseQuery, where('category', '==', category));
      }

      // 獲取所有商品以計算總頁數
      const allProductsQuery = query(
        baseQuery,
        orderBy('createdAt', 'desc')
      );
      const allProductsSnapshot = await getDocs(allProductsQuery);
      const totalProducts = allProductsSnapshot.docs.length;
      setTotalPages(Math.ceil(totalProducts / productsPerPage));

      // 獲取當前頁的商品
      const startIndex = (page - 1) * productsPerPage;
      const productsQuery = query(
        baseQuery,
        orderBy('createdAt', 'desc'),
        startAt(allProductsSnapshot.docs[startIndex]),
        limit(productsPerPage)
      );
      
      const querySnapshot = await getDocs(productsQuery);
      const fetchedProducts = [];
      
      querySnapshot.forEach((doc) => {
        fetchedProducts.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setProducts(fetchedProducts);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('載入商品時發生錯誤');
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

  // 處理搜尋
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setLoading(true);
      const searchQuery = query(
        collection(db, 'products'),
        orderBy('title'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(searchQuery);
      const results = [];
      
      querySnapshot.forEach((doc) => {
        const product = doc.data();
        if (
          product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
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

  // 處理頁面變更
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  // 處理類別變更
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchTerm('');
    setSearchResults([]);
  };

  // 顯示的商品列表
  const displayProducts = searchTerm ? searchResults : products;

  return (
    <div className="home-container">
      {currentUser && (
        <div className="user-welcome">
          歡迎回來，{currentUser.email}！
          <Link to="/sell" className="sell-button">
            我要刊登商品
          </Link>
        </div>
      )}

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

      {error && <div className="error-message">{error}</div>}

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
                  <span>賣家：{product.sellerName}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

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