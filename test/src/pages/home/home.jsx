import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import app from '../../firebase';
import seedFirestore from '../../utils/seedFirestore';
import './home.css';

// 將 mockItems 移到組件外部
const mockItems = [
  { 
    id: 'macbook-pro',
    title: '全新 MacBook Pro',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300',
    seller: 'Emma',
    condition: '全新',
    description: '2023年款 MacBook Pro，M2 Pro 晶片，16GB 統一記憶體，512GB SSD 儲存空間。原廠保固中，附原廠充電器。',
    sellerName: 'Emma Chen',
    contact: 'emma@example.com',
    createdAt: '2024-03-15',
    category: '電子產品',
    paymentMethod: '面交/轉帳',
    meetupLocation: '輔大校園/捷運輔大站',
    rating: 4.8,
    views: 156
  },
  { 
    id: 'economics-book',
    title: '經濟學原理課本',
    price: 350,
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300',
    seller: 'Jason',
    condition: '良好',
    description: '經濟學原理第八版，內容完整，有筆記標記重點。適合經濟系學生使用，書況良好，無破損。',
    sellerName: 'Jason Wang',
    contact: 'jason@example.com',
    createdAt: '2024-03-14',
    category: '教科書',
    paymentMethod: '面交',
    meetupLocation: '輔大圖書館',
    rating: 4.5,
    views: 89
  },
  { 
    id: 'bicycle',
    title: '腳踏車',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=300',
    seller: 'Mark',
    condition: '二手',
    description: '捷安特城市通勤腳踏車，騎乘約一年，保養良好。附車鎖和車燈，適合校園代步。',
    sellerName: 'Mark Lin',
    contact: 'mark@example.com',
    createdAt: '2024-03-13',
    category: '交通工具',
    paymentMethod: '面交',
    meetupLocation: '輔大校門口',
    rating: 4.2,
    views: 234
  },
  { 
    id: 'fju-tshirt',
    title: '輔大限量T恤',
    price: 450,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300',
    seller: 'Linda',
    condition: '全新',
    description: '2024年輔大校慶限定版T恤，M號，未拆封。限量發行，具有收藏價值。',
    sellerName: 'Linda Chang',
    contact: 'linda@example.com',
    createdAt: '2024-03-12',
    category: '服飾',
    paymentMethod: '面交',
    meetupLocation: '輔大校園',
    rating: 4.9,
    views: 178
  },
  { 
    id: 'jbl-speaker',
    title: 'JBL 藍牙音響',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=300',
    seller: 'David',
    condition: '二手',
    description: 'JBL Flip 5 藍牙音響，使用約半年，音質良好。附原廠充電器，電池續航力佳。',
    sellerName: 'David Wu',
    contact: 'david@example.com',
    createdAt: '2024-03-11',
    category: '電子產品',
    paymentMethod: '面交/轉帳',
    meetupLocation: '輔大校園/捷運輔大站',
    rating: 4.6,
    views: 145
  },
  { 
    id: 'board-games',
    title: '桌遊組合',
    price: 800,
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=300',
    seller: 'Sophia',
    condition: '良好',
    description: '包含大富翁、UNO、撲克牌等經典桌遊，保存完整。適合宿舍或社團活動使用。',
    sellerName: 'Sophia Lee',
    contact: 'sophia@example.com',
    createdAt: '2024-03-10',
    category: '娛樂',
    paymentMethod: '面交',
    meetupLocation: '輔大校園',
    rating: 4.7,
    views: 167
  }
];

function Home() {
  const { currentUser } = useAuth();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seedSuccess, setSeedSuccess] = useState(false);
  
  // Initialize Firestore
  const db = getFirestore(app);
  
  // Search functionality
  const [searchTerm, setSearchTerm] = useState('');

  // 處理填充資料
  const handleSeedData = async () => {
    if (window.confirm('確定要新增測試資料到 Firestore 嗎？')) {
      try {
        setSeedSuccess(false);
        const result = await seedFirestore();
        if (result) {
          setSeedSuccess(true);
          // 重新載入商品
          fetchItems();
          setTimeout(() => setSeedSuccess(false), 3000);
        }
      } catch (err) {
        console.error('添加資料錯誤:', err);
        setError('添加資料時發生錯誤');
      }
    }
  };

  // 獲取商品
  const fetchItems = async () => {
    try {
      setLoading(true);
      const itemsQuery = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(itemsQuery);
      const items = [];
      
      querySnapshot.forEach((doc) => {
        items.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 如果資料庫中沒有商品，使用 mock data
      if (items.length === 0) {
        setFeaturedItems(mockItems);
      } else {
        setFeaturedItems(items);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError('載入商品時發生錯誤');
      // 如果發生錯誤，使用 mock data
      setFeaturedItems(mockItems);
    } finally {
      setLoading(false);
    }
  };

  // 清除搜尋
  const handleClearSearch = () => {
    setSearchTerm('');
    setFeaturedItems(mockItems); // 直接設置為 mockItems
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setFeaturedItems(mockItems);
      return;
    }
    
    try {
      setLoading(true);
      const searchResults = [];
      
      // 搜尋資料庫中的商品
      const searchQuery = query(
        collection(db, 'products'),
        where('title', '>=', searchTerm),
        where('title', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      
      const querySnapshot = await getDocs(searchQuery);
      querySnapshot.forEach((doc) => {
        searchResults.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      // 如果資料庫中沒有找到結果，搜尋 mock data
      if (searchResults.length === 0) {
        const mockResults = mockItems.filter(item => 
          item.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
        searchResults.push(...mockResults);
      }
      
      setFeaturedItems(searchResults);
      setError(null);
    } catch (err) {
      console.error('Search error:', err);
      setError('搜尋時發生錯誤，請稍後再試');
      // 如果發生錯誤，搜尋 mock data
      const mockResults = mockItems.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFeaturedItems(mockResults);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fixed categories
    setCategories([
      { id: 1, name: '書籍教材', icon: '📚' },
      { id: 2, name: '電子產品', icon: '📱' },
      { id: 3, name: '家具寢具', icon: '🛏️' },
      { id: 4, name: '交通工具', icon: '🚲' },
      { id: 5, name: '服裝衣物', icon: '👕' },
      { id: 6, name: '運動用品', icon: '⚽' },
    ]);
    
    // 初始化 featuredItems 為 mockItems
    setFeaturedItems(mockItems);
    setLoading(false);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>輔大二手交易平台</h1>
          <p>買賣交流、資源共享、永續校園</p>
          <form className="search-bar" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="搜尋商品..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">搜尋</button>
            {searchTerm && (
              <button type="button" onClick={handleClearSearch} className="clear-search">
                清除
              </button>
            )}
          </form>
        </div>
      </div>

      {/* User Welcome */}
      {currentUser && (
        <div className="user-welcome">
          <p>您好，{currentUser.displayName || currentUser.email}！歡迎回來</p>
        </div>
      )}

      {/* Admin Section */}
      {currentUser && currentUser.email === 'admin@example.com' && (
        <div className="admin-section">
          <h3>管理員功能</h3>
          <div className="admin-actions">
            <button onClick={handleSeedData} className="admin-seed-button">
              新增測試資料到 Firestore
            </button>
            {seedSuccess && <span className="seed-success">✅ 資料新增成功！</span>}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Categories */}
      <div className="section">
        <h2>商品分類</h2>
        <div className="categories-container">
          {categories.map(category => (
            <div className="category-card" key={category.id}>
              <div className="category-icon">{category.icon}</div>
              <p>{category.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Items */}
      <div className="section">
        <h2>熱門商品</h2>
        {loading ? (
          <div className="loading-spinner">載入中...</div>
        ) : (
          <div className="items-container">
            {featuredItems.length > 0 ? (
              featuredItems.map(item => (
                <Link to={`/product/${item.id}`} key={item.id} className="item-card">
                  <div className="item-image">
                    <img src={item.image || 'https://via.placeholder.com/300x200?text=無圖片'} alt={item.title} />
                  </div>
                  <div className="item-details">
                    <h3>{item.title}</h3>
                    <p className="item-price">NT$ {item.price}</p>
                    <div className="item-meta">
                      <span className="item-condition">{item.condition}</span>
                      <span className="item-seller">賣家: {item.sellerName || item.seller || '未知'}</span>
                    </div>
                  </div>
                </Link>
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
        <button className="cta-button" onClick={() => window.location.href = '/sell'}>立即刊登</button>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2025 輔仁大學二手交易平台 | <a href="#">使用條款</a> | <a href="#">隱私權政策</a></p>
        <p>有任何問題？ <a href="mailto:support@fjumarket.com">聯絡我們</a></p>
      </footer>
    </div>
  );
}

export default Home;