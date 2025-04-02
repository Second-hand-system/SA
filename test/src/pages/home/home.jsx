import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './home.css';

function Home() {
  const { currentUser } = useAuth();
  const [featuredItems, setFeaturedItems] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // Mock data for featured items
  useEffect(() => {
    setFeaturedItems([
      { id: 1, title: '全新 MacBook Pro', price: 45000, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300', seller: 'Emma', condition: '全新' },
      { id: 2, title: '經濟學原理課本', price: 350, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300', seller: 'Jason', condition: '良好' },
      { id: 3, title: '腳踏車', price: 2500, image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=300', seller: 'Mark', condition: '二手' },
      { id: 4, title: '輔大限量T恤', price: 450, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300', seller: 'Linda', condition: '全新' },
      { id: 5, title: 'JBL 藍牙音響', price: 1200, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=300', seller: 'David', condition: '二手' },
      { id: 6, title: '桌遊組合', price: 800, image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=300', seller: 'Sophia', condition: '良好' },
    ]);
    
    setCategories([
      { id: 1, name: '書籍教材', icon: '📚' },
      { id: 2, name: '電子產品', icon: '📱' },
      { id: 3, name: '家具寢具', icon: '🛏️' },
      { id: 4, name: '交通工具', icon: '🚲' },
      { id: 5, name: '服裝衣物', icon: '👕' },
      { id: 6, name: '運動用品', icon: '⚽' },
    ]);
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>輔大二手交易平台</h1>
          <p>買賣交流、資源共享、永續校園</p>
          <div className="search-bar">
            <input type="text" placeholder="搜尋商品..." />
            <button>搜尋</button>
          </div>
        </div>
      </div>

      {/* User Welcome */}
      {currentUser && (
        <div className="user-welcome">
          <p>嗨，{currentUser.displayName || currentUser.email}！歡迎回來</p>
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
        <div className="items-container">
          {featuredItems.map(item => (
            <div className="item-card" key={item.id}>
              <div className="item-image">
                <img src={item.image} alt={item.title} />
              </div>
              <div className="item-details">
                <h3>{item.title}</h3>
                <p className="item-price">NT$ {item.price}</p>
                <div className="item-meta">
                  <span className="item-condition">{item.condition}</span>
                  <span className="item-seller">賣家: {item.seller}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <h2>有物品想要出售嗎？</h2>
        <p>快速刊登，輕鬆賺取額外收入</p>
        <button className="cta-button">立即刊登</button>
      </div>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2023 輔仁大學二手交易平台 | <a href="#">使用條款</a> | <a href="#">隱私權政策</a></p>
        <p>有任何問題？ <a href="mailto:support@fjumarket.com">聯絡我們</a></p>
      </footer>
    </div>
  );
}

export default Home; 