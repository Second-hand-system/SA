import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, addDoc, runTransaction } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useFavorites } from '../../context/FavoritesContext';
import app, { 
  getFavoriteRef, 
  checkIsFavorite, 
  removeFromFavorites, 
  addToFavorites,
  getFavoriteCount,
  updateFavoriteCount 
} from '../../firebase';
import './ProductDetail.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaserInfo, setPurchaserInfo] = useState(null);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(null);
  const [auctionStatus, setAuctionStatus] = useState('進行中');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [auctionStartTime, setAuctionStartTime] = useState('');
  const [auctionEndTime, setAuctionEndTime] = useState('');
  const [saleType, setSaleType] = useState('先搶先贏');
  const [currentBid, setCurrentBid] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidHistory, setBidHistory] = useState([]);
  const [error, setError] = useState(null);

  const { addFavorite, removeFavorite, favoriteCount } = useFavorites();

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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, 'products', productId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('商品資料:', data);
          
          // 處理時間戳
          let processedData = {
            ...data,
            id: docSnap.id
          };

          if (data.createdAt) {
            processedData.createdAt = typeof data.createdAt.toDate === 'function' 
              ? data.createdAt.toDate().toLocaleString('zh-TW')
              : new Date(data.createdAt).toLocaleString('zh-TW');
          }

          if (data.auctionEndTime) {
            const endTime = new Date(data.auctionEndTime);
            const now = new Date();
            if (now > endTime) {
              processedData.status = data.status || '已結束';
            }
          }

          // 檢查收藏狀態
          if (auth.currentUser) {
            const isFav = await checkIsFavorite(auth.currentUser.uid, productId);
            setIsFavorite(isFav);
          }

          setProduct(processedData);
          setSaleType(data.tradeMode || '先搶先贏');
          
          // 獲取收藏數
          const favCount = await getFavoriteCount(productId);
          console.log('收藏數:', favCount);
          
        } else {
          console.log('找不到商品');
          setError('找不到商品');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('載入商品資料時發生錯誤');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, db, auth.currentUser]);

  useEffect(() => {
    if (product?.auctionEndTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const endTime = new Date(product.auctionEndTime);
        const difference = endTime - now;

        if (difference <= 0) {
          setTimeLeft('已結束');
          setAuctionStatus(product.status || '已結束');
          clearInterval(timer);
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          
          setTimeLeft(`${days}天 ${hours}時 ${minutes}分 ${seconds}秒`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [product]);

  // 獲取當前最高出價
  useEffect(() => {
    const fetchCurrentBid = async () => {
      console.log('檢查競標模式:', product?.tradeMode);
      if (product?.tradeMode === '競標模式') {
        try {
          const bidsRef = collection(db, 'products', productId, 'bids');
          const q = query(bidsRef, orderBy('amount', 'desc'), limit(1));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const highestBid = querySnapshot.docs[0].data();
            setCurrentBid(highestBid);
            
            // 檢查競標是否已結束且有得標者
            if (product.auctionEndTime && new Date() > new Date(product.auctionEndTime)) {
              const productRef = doc(db, 'products', productId);
              await updateDoc(productRef, {
                status: '已售出',
                soldTo: highestBid.userId,
                soldAt: serverTimestamp()
              });
              setProduct(prev => ({ ...prev, status: '已售出', soldTo: highestBid.userId }));
            }
          }
        } catch (error) {
          console.error('Error fetching current bid:', error);
        }
      }
    };

    fetchCurrentBid();
  }, [productId, product?.tradeMode, product?.auctionEndTime]);

  // 獲取競價歷史
  useEffect(() => {
    const fetchBidHistory = async () => {
      if (product?.tradeMode === '競標模式') {
        try {
          const bidsRef = collection(db, 'products', productId, 'bids');
          const q = query(bidsRef, orderBy('timestamp', 'desc'));
          const querySnapshot = await getDocs(q);
          
          const history = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setBidHistory(history);
        } catch (error) {
          console.error('Error fetching bid history:', error);
        }
      }
    };

    fetchBidHistory();
  }, [productId, product?.tradeMode]);

  // 獲取購買者資訊
  useEffect(() => {
    const fetchPurchaserInfo = async () => {
      console.log('開始獲取購買者資訊');
      console.log('商品狀態:', product?.status);
      console.log('購買者ID:', product?.soldTo);
      console.log('當前用戶ID:', auth.currentUser?.uid);
      console.log('賣家ID:', product?.sellerId);

      if (product?.soldTo) {
        try {
          const userRef = doc(db, 'users', product.soldTo);
          const userDoc = await getDoc(userRef);
          console.log('用戶文檔存在:', userDoc.exists());
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('用戶資料:', userData);
            setPurchaserInfo(userData);
          } else {
            console.log('找不到購買者用戶資料');
          }
        } catch (error) {
          console.error('獲取購買者資訊失敗:', error);
        }
      } else {
        console.log('商品未售出或無購買者資訊');
      }
    };

    if (product) {
      fetchPurchaserInfo();
    }
  }, [product, auth.currentUser, db]);

  const handleUpdateStatus = async (newStatus) => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以更新商品狀態');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        status: newStatus
      });
      setProduct(prev => ({ ...prev, status: newStatus }));
      setAuctionStatus(newStatus);
      alert('商品狀態已更新');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('更新狀態時發生錯誤');
    }
  };

  const handleSetAuctionTime = async () => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以設定競標時間');
      return;
    }

    if (!auctionStartTime || !auctionEndTime) {
      alert('請設定開始和結束時間');
      return;
    }

    const start = new Date(auctionStartTime);
    const end = new Date(auctionEndTime);
    const now = new Date();

    if (start < now) {
      alert('開始時間不能早於現在');
      return;
    }

    if (end <= start) {
      alert('結束時間必須晚於開始時間');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        auctionStartTime: start.toISOString(),
        auctionEndTime: end.toISOString(),
        status: '未開始',
        saleType: '競標'
      });
      setProduct(prev => ({ 
        ...prev, 
        auctionStartTime: start.toISOString(),
        auctionEndTime: end.toISOString(),
        status: '未開始',
        saleType: '競標'
      }));
      setSaleType('競標');
      setShowTimePicker(false);
      alert('競標時間已設定');
    } catch (error) {
      console.error('Error setting auction time:', error);
      alert('設定競標時間時發生錯誤');
    }
  };

  const handleFavoriteClick = async () => {
    console.log('handleFavoriteClick triggered');
    if (!auth.currentUser) {
      console.log('No authenticated user');
      alert('請先登入');
      return;
    }

    if (isProcessing) {
      console.log('Already processing a request');
      return;
    }

    try {
      console.log('Starting favorite operation');
      setIsProcessing(true);
      const userId = auth.currentUser.uid;
      console.log('Current user ID:', userId);
      console.log('Current favorite status:', isFavorite);
      
      if (isFavorite) {
        console.log('Attempting to remove from favorites');
        await removeFromFavorites(userId, productId);
        console.log('Successfully removed from favorites');
        removeFavorite(productId);
        setIsFavorite(false);
      } else {
        console.log('Attempting to add to favorites');
        const productData = {
          title: product.title,
          image: product.image,
          price: product.price,
          productId: productId
        };
        console.log('Product data:', productData);
        await addToFavorites(userId, productId, productData);
        console.log('Successfully added to favorites');
        addFavorite({
          id: `${userId}_${productId}`,
          userId,
          productId,
          productData
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error in handleFavoriteClick:', error);
      alert('操作失敗，請稍後再試');
    } finally {
      console.log('Finishing favorite operation');
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以刪除商品');
      return;
    }

    if (!window.confirm('確定要刪除此商品嗎？此操作無法復原。')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      navigate('/');
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('刪除商品時發生錯誤');
      setIsDeleting(false);
    }
  };

  const handleSetSaleType = async (type) => {
    if (!auth.currentUser || product.sellerId !== auth.currentUser.uid) {
      alert('只有賣家可以設定銷售類型');
      return;
    }

    try {
      const productRef = doc(db, 'products', productId);
      const updates = {
        saleType: type
      };

      // 如果是先搶先贏，清除競標相關的資料
      if (type === '先搶先贏') {
        updates.auctionStartTime = null;
        updates.auctionEndTime = null;
        updates.status = '進行中';
      }

      await updateDoc(productRef, updates);
      setProduct(prev => ({ ...prev, ...updates }));
      setSaleType(type);
      
      // 只有在選擇競標時才顯示時間選擇器
      if (type === '競標') {
        setShowTimePicker(true);
      } else {
        setShowTimePicker(false);
      }
      
      alert('銷售類型已更新');
    } catch (error) {
      console.error('Error updating sale type:', error);
      alert('更新銷售類型時發生錯誤');
    }
  };

  // 檢查競標是否已結束
  const isAuctionEnded = () => {
    if (!product.auctionEndTime) return false;
    const endTime = new Date(product.auctionEndTime);
    const now = new Date();
    return now > endTime;
  };

  // 處理競價提交
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert('請先登入');
      return;
    }

    if (product.sellerId === auth.currentUser.uid) {
      alert('賣家不能參與競價');
      return;
    }

    const bidAmountNum = parseFloat(bidAmount);
    
    // 驗證出價金額
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      setBidError('請輸入有效的金額');
      return;
    }

    if (currentBid && bidAmountNum <= currentBid.amount) {
      setBidError(`出價必須高於當前最高出價 (NT$ ${currentBid.amount})`);
      return;
    }

    if (bidAmountNum <= product.price) {
      setBidError(`出價必須高於底價 (NT$ ${product.price})`);
      return;
    }

    try {
      console.log('開始提交出價...');
      console.log('出價金額:', bidAmountNum);
      console.log('商品ID:', productId);
      console.log('用戶ID:', auth.currentUser.uid);

      // 檢查商品是否存在
      const productRef = doc(db, 'products', productId);
      const productDoc = await getDoc(productRef);
      
      if (!productDoc.exists()) {
        throw new Error('商品不存在');
      }

      // 確保商品是競標模式
      const productData = productDoc.data();
      if (productData.tradeMode !== '競標模式') {
        throw new Error('此商品不是競標模式');
      }

      // 創建或獲取 bids 子集合
      const bidsRef = collection(db, 'products', productId, 'bids');
      
      // 檢查是否已有出價記錄
      const bidsQuery = query(bidsRef, orderBy('amount', 'desc'), limit(1));
      const bidsSnapshot = await getDocs(bidsQuery);
      
      const newBid = {
        amount: bidAmountNum,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || '匿名用戶',
        timestamp: serverTimestamp(),
        productId: productId
      };

      console.log('準備添加的出價資料:', newBid);

      // 添加出價記錄
      const docRef = await addDoc(bidsRef, newBid);
      console.log('出價成功，文檔ID:', docRef.id);

      // 更新當前最高出價
      setCurrentBid(newBid);
      setBidHistory(prev => [newBid, ...prev]);
      setBidAmount('');
      setBidError('');
      
      // 顯示成功提示
      setShowSuccessMessage(true);
      
      // 3秒後自動隱藏成功提示
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
      // 重新獲取最新的出價歷史
      const updatedBidsQuery = query(bidsRef, orderBy('timestamp', 'desc'));
      const updatedBidsSnapshot = await getDocs(updatedBidsQuery);
      const updatedHistory = updatedBidsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBidHistory(updatedHistory);
      
    } catch (error) {
      console.error('出價失敗，詳細錯誤:', error);
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
      
      let errorMessage = '出價失敗，請稍後再試';
      if (error.message.includes('permission-denied')) {
        errorMessage = '出價權限被拒絕，請確認您已登入';
      } else if (error.message.includes('not-found')) {
        errorMessage = '商品不存在或已被刪除';
      } else if (error.message.includes('競標模式')) {
        errorMessage = error.message;
      }
      
      setBidError(errorMessage);
    }
  };

  // 處理購買
  const handlePurchase = async () => {
    if (!auth.currentUser) {
      alert('請先登入');
      return;
    }

    if (product.sellerId === auth.currentUser.uid) {
      alert('不能購買自己的商品');
      return;
    }

    if (product.status === '已售出') {
      alert('商品已售出');
      return;
    }

    try {
      setIsProcessing(true);
      const productRef = doc(db, 'products', productId);
      
      // 使用事务来确保原子性操作
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('商品不存在');
        }
        
        const productData = productDoc.data();
        
        if (productData.status === '已售出') {
          throw new Error('商品已售出');
        }
        
        // 更新商品狀態，同時保存購買者資訊
        transaction.update(productRef, {
          status: '已售出',
          soldTo: auth.currentUser.uid,
          soldAt: serverTimestamp(),
          buyerName: auth.currentUser.displayName || '匿名用戶',
          buyerEmail: auth.currentUser.email || '未提供'
        });
      });

      setPurchaseSuccess(true);
      setProduct(prev => ({ 
        ...prev, 
        status: '已售出',
        soldTo: auth.currentUser.uid,
        buyerName: auth.currentUser.displayName || '匿名用戶',
        buyerEmail: auth.currentUser.email || '未提供'
      }));
      alert('購買成功！');
    } catch (error) {
      console.error('購買失敗:', error);
      alert(error.message || '購買失敗，請稍後再試');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="not-found">
        <h2>找不到商品</h2>
        <p>該商品可能已被刪除或不存在</p>
        <Link to="/" className="back-home-btn">返回首頁</Link>
      </div>
    );
  }

  const isOwner = auth.currentUser && product.sellerId === auth.currentUser.uid;

  return (
    <div className="product-detail-container">
      {/* 添加成功提示 */}
      {showSuccessMessage && (
        <div className="success-message">
          出價成功！
        </div>
      )}
      
      <div className="product-detail-content">
        <div className="product-image-section">
          <div className="product-image">
            <img src={product.image} alt={product.title} />
            {(product.status === '已結標' || (product.auctionEndTime && new Date() > new Date(product.auctionEndTime))) && (
              <div className="sold-badge">已結標</div>
            )}
          </div>
          <div className="product-actions">
            {product.tradeMode === '先搶先贏' && auth.currentUser && product.sellerId !== auth.currentUser.uid && (
              <button 
                className="purchase-btn"
                onClick={handlePurchase}
                disabled={isProcessing || product.status === '已售出'}
              >
                {isProcessing ? '處理中...' : product.status === '已售出' ? '已售出' : '立即購買'}
              </button>
            )}
            <button className="contact-seller-btn">
              聯絡賣家
            </button>
            {auth.currentUser && product.sellerId === auth.currentUser.uid ? (
              <>
                <Link to={`/product/edit/${productId}`} className="edit-product-btn">
                  編輯
                </Link>
                <button 
                  className="delete-product-btn"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? '刪除中...' : '刪除'}
                </button>
              </>
            ) : null}
          </div>
        </div>
        <div className="product-info">
          <div className="product-header">
            <div className="title-section">
              <h1>{product.title}</h1>
            </div>
            <div className="price-section">
              <span className="sale-type">{product.tradeMode || '先搶先贏'}</span>
              <div className="product-price">NT$ {product.price}</div>
            </div>
            <div className="favorite-section">
              <button
                onClick={handleFavoriteClick}
                disabled={isProcessing}
                className={`favorite-button ${isFavorite ? 'favorited' : ''}`}
              >
                {isProcessing ? '處理中...' : (
                  <>
                    <span>{isFavorite ? '❤️' : '🤍'}</span>
                    <span className="favorite-count">{favoriteCount}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* 購買者資訊 - 只有賣家可以看到 */}
          {product.status === '已售出' && auth.currentUser && product.sellerId === auth.currentUser.uid && (
            <div className="purchaser-info">
              <h3>購買者資訊</h3>
              <div className="purchaser-details">
                <p><strong>購買者：</strong>{product.buyerName || '匿名用戶'}</p>
                <p><strong>購買時間：</strong>{product.soldAt ? new Date(product.soldAt.toDate()).toLocaleString('zh-TW') : '未知'}</p>
                <p><strong>聯絡方式：</strong>{product.buyerEmail || '未提供'}</p>
              </div>
            </div>
          )}

          {/* 競標倒數計時 */}
          {product.auctionEndTime && (
            <div className="auction-timer">
              <h3>競標倒數</h3>
              {!isAuctionEnded() ? (
                <div className="time-left">
                  <p>結束時間：{new Date(product.auctionEndTime).toLocaleString('zh-TW')}</p>
                  <p>剩餘時間：{timeLeft}</p>
                </div>
              ) : (
                <div className="auction-ended">
                  <p>競標已結束</p>
                </div>
              )}
            </div>
          )}

          {/* 商品狀態更新區域 - 只有在競標時間結束後才能更新 */}
          {auth.currentUser && product.sellerId === auth.currentUser.uid && product.auctionEndTime && isAuctionEnded() && (
            <div className="status-controls">
              <h3>競標已結束，請更新商品狀態</h3>
              <div className="status-buttons">
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('待售出')}
                  disabled={product.status === '待售出'}
                >
                  待售出
                </button>
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('已售出')}
                  disabled={product.status === '已售出'}
                >
                  已售出
                </button>
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('未售出')}
                  disabled={product.status === '未售出'}
                >
                  未售出
                </button>
              </div>
            </div>
          )}

          {/* 先搶先贏模式的狀態更新 */}
          {auth.currentUser && product.sellerId === auth.currentUser.uid && !product.auctionEndTime && (
            <div className="status-controls">
              <h3>商品狀態</h3>
              <div className="status-buttons">
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('待售出')}
                  disabled={product.status === '待售出'}
                >
                  待售出
                </button>
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('已售出')}
                  disabled={product.status === '已售出'}
                >
                  已售出
                </button>
                <button 
                  className="status-btn"
                  onClick={() => handleUpdateStatus('未售出')}
                  disabled={product.status === '未售出'}
                >
                  未售出
                </button>
              </div>
            </div>
          )}

          {showTimePicker && saleType === '競標' && !product.auctionEndTime && (
            <div className="time-picker">
              <h3>設定競標時間</h3>
              <div className="time-inputs">
                <div className="time-input">
                  <label>開始時間：</label>
                  <input
                    type="datetime-local"
                    value={auctionStartTime}
                    onChange={(e) => setAuctionStartTime(e.target.value)}
                  />
                </div>
                <div className="time-input">
                  <label>結束時間：</label>
                  <input
                    type="datetime-local"
                    value={auctionEndTime}
                    onChange={(e) => setAuctionEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="time-picker-buttons">
                <button 
                  className="confirm-btn"
                  onClick={handleSetAuctionTime}
                >
                  確認
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => setShowTimePicker(false)}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="product-description">
            <h3>商品描述</h3>
            <p>{product.description}</p>
          </div>
          
          <div className="product-details">
            <h3>商品資訊</h3>
            <ul>
              <li><strong>類別:</strong> {getCategoryName(product.category)}</li>
              <li><strong>狀態:</strong> {product.condition}</li>
              <li><strong>上架時間:</strong> {product.createdAt}</li>
              <li><strong>賣家:</strong> {product.sellerName}</li>
              <li><strong>交易地點:</strong> {product.location || '未提供'}</li>
              {product.auctionEndTime && (
                <li><strong>競標結束時間:</strong> {new Date(product.auctionEndTime).toLocaleString('zh-TW')}</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 修改競價區的顯示條件 */}
      {product?.tradeMode === '競標模式' && (
        <div className="bid-section">
          <h3>競價資訊</h3>
          <div className="current-bid">
            <p>
              當前最高出價：{currentBid ? `NT$ ${currentBid.amount}` : '尚無出價'}
              {isAuctionEnded() && currentBid && (
                <span style={{ color: '#e2af4a', fontWeight: 'bold', marginLeft: 12 }}>（得標）</span>
              )}
            </p>
            <p>
              出價者：{currentBid ? currentBid.userName : '-'}
              {isAuctionEnded() && currentBid && (
                <span style={{ color: '#e2af4a', fontWeight: 'bold', marginLeft: 12 }}>（得標者）</span>
              )}
            </p>
          </div>
          
          {auth.currentUser && product.sellerId !== auth.currentUser.uid && !isAuctionEnded() && (
            <form onSubmit={handleBidSubmit} className="bid-form">
              <div className="bid-input-group">
                <input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  placeholder="輸入出價金額"
                  min={currentBid ? currentBid.amount + 1 : product.price + 1}
                  step="1"
                />
                <button 
                  type="submit" 
                  className="bid-submit-btn"
                >
                  出價
                </button>
              </div>
              {bidError && <p className="bid-error">{bidError}</p>}
            </form>
          )}

          <div className="bid-history">
            <h4>競價歷史</h4>
            <ul>
              {bidHistory.map((bid, idx) => {
                let formattedTime = '未知時間';
                try {
                  if (bid.timestamp) {
                    if (typeof bid.timestamp.toDate === 'function') {
                      formattedTime = bid.timestamp.toDate().toLocaleString('zh-TW');
                    } else if (bid.timestamp.seconds) {
                      formattedTime = new Date(bid.timestamp.seconds * 1000).toLocaleString('zh-TW');
                    }
                  }
                } catch (error) {
                  console.error('Error formatting timestamp:', error);
                }
                
                const isWinner = isAuctionEnded() && idx === 0;
                
                return (
                  <li key={bid.id} className={isWinner ? 'winning-bid' : ''}>
                    <div className="bid-info">
                      <span className="bid-user">{bid.userName}</span>
                      <span className="bid-time">{formattedTime}</span>
                    </div>
                    <span className="bid-amount">NT$ {bid.amount}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <Link to="/" className="back-home-link">
        返回首頁
      </Link>
    </div>
  );
};

export default ProductDetail; 