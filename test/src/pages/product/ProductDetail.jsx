import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import app from '../../firebase';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const db = getFirestore(app);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // 先從 mockItems 中尋找產品
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
          },
        ];

        const mockProduct = mockItems.find(item => item.id === productId);
        if (mockProduct) {
          setProduct(mockProduct);
          setLoading(false);
          return;
        }

        // 如果在 mockItems 中找不到，則從 Firestore 中尋找
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return <div className="product-detail-container">載入中...</div>;
  }

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="not-found">
          <h2>找不到產品</h2>
          <p>您所尋找的產品不存在或已被移除。</p>
          <Link to="/" className="back-home-btn">返回首頁</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-container">
      <div className="product-detail-content">
        <div className="product-image">
          <img src={product.image} alt={product.title} />
        </div>
        <div className="product-info">
          <h1>{product.title}</h1>
          <div className="product-price">NT$ {product.price}</div>
          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description}</p>
          </div>
          <div className="product-details">
            <h3>商品詳情</h3>
            <ul>
              <li><strong>商品狀態：</strong> {product.condition}</li>
              <li><strong>賣家：</strong> {product.sellerName}</li>
              <li><strong>聯絡方式：</strong> {product.contact}</li>
              <li><strong>上架時間：</strong> {product.createdAt}</li>
              <li><strong>商品編號：</strong> {product.id}</li>
              <li><strong>商品類別：</strong> {product.category || '未分類'}</li>
              <li><strong>交易方式：</strong> {product.paymentMethod || '面交'}</li>
              <li><strong>面交地點：</strong> {product.meetupLocation || '輔大校園'}</li>
              <li><strong>商品評價：</strong> {product.rating ? `${product.rating} 星` : '尚未有評價'}</li>
              <li><strong>瀏覽次數：</strong> {product.views || 0}</li>
            </ul>
          </div>
          <div className="product-actions">
            <button className="contact-seller-btn">聯絡賣家</button>
            <button className="save-product-btn">收藏商品</button>
            <button className="share-product-btn">分享商品</button>
          </div>
          <Link to="/" className="back-home-link">返回首頁</Link>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail; 