import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getFirestore, doc, getDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, collection, query, orderBy, limit, getDocs, addDoc, runTransaction, onSnapshot, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useFavorites } from '../../contexts/FavoritesContext';
import { 
  app,
  getFavoriteRef, 
  checkIsFavorite, 
  removeFromFavorites, 
  addToFavorites,
  getFavoriteCount,
  updateFavoriteCount 
} from '../../firebase';
import { createNotification, notificationTypes } from '../../utils/notificationUtils';
import './ProductDetail.css';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { NOTIFICATION_TYPES } from '../../constants/notifications';
import { formatCurrency } from '../../utils/format';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProductDetail = () => {
  const { productId } = useParams();
  const [searchParams] = useSearchParams();
  const returnPage = searchParams.get('returnPage') || '1';
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
  const [negotiationHistory, setNegotiationHistory] = useState([]);
  const [error, setError] = useState(null);
  const { addFavorite, removeFavorite, favoriteCount } = useFavorites();
  const { currentUser } = useAuth();
  const { addNotification } = useNotification();
  const [showBidModal, setShowBidModal] = useState(false);
  const bidInputRef = useRef(null);

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
          console.log('交易模式:', data.tradeMode);
          
          // 處理時間戳
          let processedData = {
            ...data,
            id: docSnap.id,
            status: data.status || '販售中',
            tradeMode: data.tradeMode || '先搶先贏'
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
              processedData.status = '已結標';
            }
          }

          setProduct(processedData);
          setSaleType(data.tradeMode || '先搶先贏');

          // 檢查收藏狀態
          if (auth.currentUser) {
            try {
              const isFav = await checkIsFavorite(auth.currentUser.uid, productId);
              setIsFavorite(isFav);
            } catch (error) {
              console.error('檢查收藏狀態時發生錯誤:', error);
              // 不中斷整個流程，只是收藏狀態可能不準確
            }
          }
          
          // 獲取收藏數
          try {
            const favCount = await getFavoriteCount(productId);
            console.log('收藏數:', favCount);
          } catch (error) {
            console.error('獲取收藏數時發生錯誤:', error);
            // 不中斷整個流程，只是收藏數可能不準確
          }
          
          setLoading(false);
        } else {
          console.log('找不到商品');
          setError('找不到商品');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('載入商品時發生錯誤');
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, db, auth.currentUser]);

  useEffect(() => {
    if (product?.auctionEndTime) {
      const timer = setInterval(async () => {
        const now = new Date();
        const endTime = new Date(product.auctionEndTime);
        const difference = endTime - now;

        if (difference <= 0) {
          setTimeLeft('已結束');
          setAuctionStatus('已結束');
          clearInterval(timer);

          try {
            // 獲取最高出價
            const bidsRef = collection(db, 'products', productId, 'bids');
            const bidsQuery = query(bidsRef, orderBy('amount', 'desc'), limit(1));
            const bidsSnapshot = await getDocs(bidsQuery);
            
            if (!bidsSnapshot.empty) {
              const highestBid = bidsSnapshot.docs[0].data();
              const highestBidId = bidsSnapshot.docs[0].id;
              
              // 檢查是否已經有交易記錄
              const transactionsRef = collection(db, 'transactions');
              const transactionQuery = query(
                transactionsRef,
                where('productId', '==', productId),
                where('type', '==', 'auction')
              );
              const transactionSnapshot = await getDocs(transactionQuery);

              if (transactionSnapshot.empty) {
                // 創建交易記錄
                const transactionRef = doc(collection(db, 'transactions'));
                await setDoc(transactionRef, {
                  productId: productId,
                  productTitle: product.title,
                  amount: highestBid.amount,
                  buyerId: highestBid.userId,
                  buyerName: highestBid.userName,
                  buyerEmail: highestBid.userEmail,
                  sellerId: product.sellerId,
                  sellerName: product.sellerName || '匿名用戶',
                  status: 'pending',
                  createdAt: serverTimestamp(),
                  type: 'auction',
                  bidId: highestBidId,
                  meetingLocations: product.meetingLocations || [],
                  productImage: product.images?.[0] || product.image || '/placeholder.jpg'
                });

                // 更新商品狀態
                const productRef = doc(db, 'products', productId);
                await updateDoc(productRef, {
                  status: '已結標',
                  soldTo: highestBid.userId,
                  soldAt: serverTimestamp()
                });

                // 1. 通知賣家競標已結束
                await createNotification({
                  userId: product.sellerId,
                  type: notificationTypes.BID_PLACED,
                  itemName: product.title,
                  itemId: productId,
                  message: `您的商品 ${product.title} 競標已結束`
                });

                // 2. 通知賣家前往設定面交資訊
                await createNotification({
                  userId: product.sellerId,
                  type: notificationTypes.SCHEDULE_CHANGED,
                  itemName: product.title,
                  itemId: productId,
                  message: `請前往交易管理區設定 ${product.title} 的面交時間地點`,
                  link: `/transaction/${transactionRef.id}`
                });

                // 3. 通知得標者
                await createNotification({
                  userId: highestBid.userId,
                  type: notificationTypes.BID_PLACED,
                  itemName: product.title,
                  itemId: productId,
                  message: `恭喜您得標商品 ${product.title}`
                });
              }
            } else {
              // 如果無人出價，設置為未售出
              const productRef = doc(db, 'products', productId);
              await updateDoc(productRef, {
                status: '未售出'
              });
              setProduct(prev => ({ ...prev, status: '未售出' }));
            }
          } catch (error) {
            console.error('處理競標結束時發生錯誤:', error);
          }
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [product?.auctionEndTime, currentBid, productId, db]);

  // 獲取當前最高出價
  useEffect(() => {
    const fetchCurrentBid = async () => {
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
              // 檢查是否已經有交易記錄
              const transactionsRef = collection(db, 'transactions');
              const transactionQuery = query(
                transactionsRef,
                where('productId', '==', productId),
                where('type', '==', 'auction')
              );
              const transactionSnapshot = await getDocs(transactionQuery);

              if (transactionSnapshot.empty) {
                // 如果沒有交易記錄，創建一個
                const transactionRef = doc(collection(db, 'transactions'));
                await setDoc(transactionRef, {
                  productId: productId,
                  productTitle: product.title,
                  amount: highestBid.amount,
                  buyerId: highestBid.userId,
                  buyerName: highestBid.userName,
                  buyerEmail: highestBid.userEmail,
                  sellerId: product.sellerId,
                  sellerName: product.sellerName || '匿名用戶',
                  status: 'pending',
                  createdAt: serverTimestamp(),
                  type: 'auction',
                  bidId: highestBid.id
                });
              }

              // 更新商品狀態
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
          
          // 設置實時監聽
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            setBidHistory(history);
            
            // 更新當前最高出價
            if (history.length > 0) {
              setCurrentBid(history[0]);
            }
          });
          
          // 清理函數
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching bid history:', error);
        }
      }
    };

    fetchBidHistory();
  }, [productId, product?.tradeMode]);

  // 獲取議價歷史
  useEffect(() => {
    const fetchNegotiationHistory = async () => {
      if (product?.tradeMode === '先搶先贏') {
        try {
          const negotiationsRef = collection(db, 'negotiations');
          const q = query(
            negotiationsRef,
            where('productId', '==', productId)
          );
          
          // 設置實時監聽
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const history = querySnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })).sort((a, b) => {
              // 在客戶端進行排序
              const timeA = a.createdAt?.toDate?.() || new Date(0);
              const timeB = b.createdAt?.toDate?.() || new Date(0);
              return timeB - timeA;
            });
            setNegotiationHistory(history);
          });
          
          // 清理函數
          return () => unsubscribe();
        } catch (error) {
          console.error('Error fetching negotiation history:', error);
        }
      }
    };

    fetchNegotiationHistory();
  }, [productId, product?.tradeMode, db]);

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
    if (!auth.currentUser) {
      alert('請先登入');
      return;
    }

    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      const userId = auth.currentUser.uid;
      
      if (isFavorite) {
        await removeFromFavorites(userId, productId);
        removeFavorite(productId);
        setIsFavorite(false);
        
        // 更新收藏數
        try {
          await updateFavoriteCount(productId, false);
        } catch (error) {
          console.error('更新收藏數時發生錯誤:', error);
        }
      } else {
        const productData = {
          title: product.title,
          image: product.image,
          price: product.price,
          productId: productId,
          createdAt: serverTimestamp()
        };
        
        await addToFavorites(userId, productId, productData);
        addFavorite({
          id: `${userId}_${productId}`,
          userId,
          productId,
          productData
        });
        setIsFavorite(true);
        
        // 更新收藏數
        try {
          await updateFavoriteCount(productId, true);
        } catch (error) {
          console.error('更新收藏數時發生錯誤:', error);
        }
      }
    } catch (error) {
      console.error('收藏操作失敗:', error);
      alert('操作失敗，請稍後再試');
    } finally {
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

  // 處理直接購買
  const handleDirectPurchase = async () => {
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

    setIsProcessing(true);

    try {
      // 先执行事务
      await runTransaction(db, async (transaction) => {
        const productRef = doc(db, 'products', productId);
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('商品不存在');
        }
        
        const productData = productDoc.data();
        
        if (productData.status === '已售出') {
          throw new Error('商品已售出');
        }

        // 更新商品狀態
        transaction.update(productRef, {
          status: '已售出',
          soldTo: auth.currentUser.uid,
          soldAt: serverTimestamp(),
          buyerName: auth.currentUser.displayName || '匿名用戶',
          buyerEmail: auth.currentUser.email || '未提供'
        });

        // 創建交易記錄
        const transactionRef = doc(collection(db, 'transactions'));
        const transactionData = {
          productId: productId,
          productTitle: productData.title,
          amount: productData.price,
          buyerId: auth.currentUser.uid,
          buyerName: auth.currentUser.displayName || '匿名用戶',
          buyerEmail: auth.currentUser.email || '未提供',
          sellerId: productData.sellerId,
          sellerName: productData.sellerName || '匿名用戶',
          status: 'pending',
          createdAt: serverTimestamp(),
          type: 'direct_purchase',
          meetingLocations: productData.meetingLocations || [],
          productImage: productData.images?.[0] || productData.image || '/placeholder.jpg'
        };

        transaction.set(transactionRef, transactionData);
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

    if (product.status === '已售出' || product.status === '已結標' || 
        (product.auctionEndTime && new Date() > new Date(product.auctionEndTime))) {
      alert('商品已售出或已結標');
      return;
    }

    try {
      setIsProcessing(true);
      const productRef = doc(db, 'products', productId);
      
      await runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(productRef);
        
        if (!productDoc.exists()) {
          throw new Error('商品不存在');
        }
        
        const productData = productDoc.data();
        
        if (productData.status === '已售出' || productData.status === '已結標' || 
            (productData.auctionEndTime && new Date() > new Date(productData.auctionEndTime))) {
          throw new Error('商品已售出或已結標');
        }

        // 更新商品狀態
        transaction.update(productRef, {
          status: '已售出',
          soldTo: auth.currentUser.uid,
          soldAt: serverTimestamp(),
          buyerName: auth.currentUser.displayName || '匿名用戶',
          buyerEmail: auth.currentUser.email || '未提供'
        });

        // 創建交易記錄
        const transactionRef = doc(collection(db, 'transactions'));
        const transactionData = {
          productId: productId,
          productTitle: productData.title,
          amount: productData.price,
          buyerId: auth.currentUser.uid,
          buyerName: auth.currentUser.displayName || '匿名用戶',
          buyerEmail: auth.currentUser.email || '未提供',
          sellerId: productData.sellerId,
          sellerName: productData.sellerName || '匿名用戶',
          status: 'pending',
          createdAt: serverTimestamp(),
          type: 'direct_purchase',
          meetingLocations: productData.meetingLocations || [],
          productImage: productData.images?.[0] || productData.image || '/placeholder.jpg'
        };

        transaction.set(transactionRef, transactionData);

        // 創建購買通知給賣家
        await createNotification({
          userId: productData.sellerId,
          type: notificationTypes.ITEM_SOLD,
          itemName: productData.title,
          itemId: productId,
          message: `您的商品 ${productData.title} 已被購買`
        });

        // 創建通知給買家
        await createNotification({
          userId: auth.currentUser.uid,
          type: notificationTypes.PURCHASE_SUCCESS,
          itemName: productData.title,
          itemId: productId,
          message: `您已成功購買 ${productData.title}`
        });

        // 創建提醒選擇面交時間地點的通知給賣家
      await createNotification({
          userId: productData.sellerId,
          type: notificationTypes.SCHEDULE_CHANGED,
          itemName: productData.title,
          itemId: productId,
          message: `請前往交易管理區選擇面交時間地點：${productData.title}`,
          link: `/transaction/${transactionRef.id}`
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

  // 處理競價提交
  const handleBidSubmit = async (e) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert('請先登入');
      return;
    }

    if (product.sellerId === auth.currentUser.uid) {
      alert('賣家不能提出議價');
      return;
    }

    if (product.status === '已售出') {
      alert('商品已售出');
      return;
    }

    const bidAmountNum = parseFloat(bidAmount);
    
    // 驗證競價金額
    if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      setBidError('請輸入有效的競價價格');
      return;
    }

    // 檢查是否高於上一個競價
    if (currentBid && bidAmountNum <= currentBid.amount) {
      setBidError(`競價價格必須高於上一個競價價格 (NT$ ${currentBid.amount})`);
      return;
    }

    try {
      const timestamp = serverTimestamp();
      const newBid = {
        amount: bidAmountNum,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || '匿名用戶',
        userEmail: auth.currentUser.email || '未提供',
        timestamp: timestamp,
        productId: productId,
        status: 'pending'
      };

      // 添加競價記錄
      const bidsRef = collection(db, 'products', productId, 'bids');
      await addDoc(bidsRef, newBid);

      // 創建通知給賣家
      await createNotification({
        userId: product.sellerId,
        type: notificationTypes.BID_PLACED,
        itemName: product.title,
        itemId: productId,
        message: `商品 ${product.title} 收到新的競標：NT$ ${bidAmountNum}`
      });

      // 創建競標通知給買家
      await createNotification({
        userId: auth.currentUser.uid,
        type: notificationTypes.BID_PLACED,
        itemName: product.title,
        itemId: productId,
        message: `您已成功對商品 ${product.title} 出價：NT$ ${bidAmountNum}`
      });

      // 如果有前一個最高出價者，通知他們被超越
      if (currentBid && currentBid.userId !== auth.currentUser.uid) {
        await createNotification({
          userId: currentBid.userId,
          type: notificationTypes.BID_OVERTAKEN,
          itemName: product.title,
          itemId: productId,
          message: `您對商品 ${product.title} 的出價已被超越`,
          link: `/transaction/${transactionRef.id}`
        });
      }

      // 如果拍賣結束，創建相應通知
      if (isAuctionEnded()) {
        // 通知最高出價者
        await createNotification({
          userId: auth.currentUser.uid,
          type: notificationTypes.BID_WON,
          itemName: product.title,
          itemId: productId,
          message: `恭喜您贏得商品 ${product.title} 的拍賣`
        });

        // 通知賣家
        await createNotification({
          userId: product.sellerId,
          type: notificationTypes.AUCTION_ENDED,
          itemName: product.title,
          itemId: productId,
          message: `您的商品 ${product.title} 拍賣已結束`
        });
      }

      setBidAmount('');
      setBidError('');
      setShowSuccessMessage(true);
      
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      
    } catch (error) {
      console.error('競標失敗:', error);
      setBidError(error.message || '競標失敗，請稍後再試');
    }
  };

  const handleContactSeller = async () => {
    console.log('Starting handleContactSeller...');
    console.log('Current user:', auth.currentUser);
    console.log('Product:', product);

    if (!auth.currentUser) {
      console.log('No authenticated user found');
      alert('請先登入');
      navigate('/login');
      return;
    }

    if (auth.currentUser.uid === product.sellerId) {
      console.log('User is trying to chat with themselves');
      alert('不能與自己聊天');
      return;
    }

    try {
      console.log('Checking for existing chat room...');
      // 修改查詢方式
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('productId', '==', productId)
      );
      
      const querySnapshot = await getDocs(q);
      // 在記憶體中過濾參與者
      const existingChat = querySnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(auth.currentUser.uid);
      });
      
      console.log('Existing chats found:', !!existingChat);
      let chatId;

      if (!existingChat) {
        console.log('Creating new chat room...');
        // 創建新的聊天室
        const chatData = {
          productId: productId,
          productName: product.title,
          productImage: product.images?.[0] || product.image || '/placeholder.jpg',
          participants: [product.sellerId, auth.currentUser.uid],
          createdAt: serverTimestamp(),
          lastMessageTime: serverTimestamp(),
          lastMessage: '開始聊天',
          sellerId: product.sellerId,
          buyerId: auth.currentUser.uid,
          status: 'active',
          sellerName: product.sellerName || '匿名用戶',
          buyerName: auth.currentUser.displayName || '匿名用戶'
        };

        console.log('Chat data to be created:', chatData);
        const chatRef = await addDoc(chatsRef, chatData);
        chatId = chatRef.id;
        console.log('New chat room created with ID:', chatId);

        console.log('Creating first message...');
        // 創建第一條消息
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const firstMessage = {
          text: '開始聊天',
          senderId: auth.currentUser.uid,
          senderName: auth.currentUser.displayName || '匿名用戶',
          timestamp: serverTimestamp()
        };
        console.log('First message data:', firstMessage);
        await addDoc(messagesRef, firstMessage);
        console.log('First message created successfully');
      } else {
        console.log('Using existing chat room...');
        chatId = existingChat.id;
        console.log('Existing chat room ID:', chatId);
      }

      console.log('Navigating to chat room...');
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error('Detailed error in handleContactSeller:', {
        error: error,
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      alert('創建聊天室失敗，請稍後再試');
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('請先登入');
      navigate('/login');
      return;
    }

    if (!bidAmount || isNaN(bidAmount) || parseFloat(bidAmount) <= 0) {
      toast.error('請輸入有效的議價金額');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (amount >= product.price) {
      toast.error('議價金額必須低於商品價格');
      return;
    }

    try {
      const negotiationsRef = collection(db, 'negotiations');
      const newBid = {
        productId: productId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || '買家',
        userEmail: currentUser.email,
        amount: amount,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const newBidRef = await addDoc(negotiationsRef, newBid);
      
      // 更新商品當前價格
      await updateDoc(doc(db, 'products', productId), {
        currentPrice: amount,
        lastNegotiatorId: currentUser.uid,
        lastNegotiationTime: serverTimestamp()
      });

      // 1. 通知賣家
      await createNotification({    
        userId: product.sellerId,
        type: notificationTypes.NEGOTIATION_REQUEST,
        itemName: product.title,
        itemId: productId,
        message: `您的商品 ${product.title} 收到新的議價請求`
      })
      // 2. 通知買家自己
      await createNotification({
        userId: auth.currentUser.uid,
        type: notificationTypes.NEGOTIATION_REQUEST,
        itemName: product.title,
        itemId: productId,
        message: `您已對商品 ${product.title} 發送議價請求`,
        message: `您已對商品 ${product.title} 發送議價請求`
      })
      setBidAmount('');
      toast.success('議價成功！');
      
      // 更新議價歷史 - 使用簡單查詢
      const negotiationsQuery = query(
        collection(db, 'negotiations'),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(negotiationsQuery);
      const updatedBids = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          // 在客戶端進行排序
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB - timeA;
        });
      setNegotiationHistory(updatedBids);
    } catch (err) {
      console.error('Error placing negotiation:', err);
      toast.error('議價失敗，請稍後再試');
    }
  };

  // 修改議價回應處理函數
  const handleNegotiationResponse = async (negotiationId, response) => {
    try {
      const negotiationRef = doc(db, 'negotiations', negotiationId);
      const negotiationDoc = await getDoc(negotiationRef);
      const negotiationData = negotiationDoc.data();

      // 如果接受議價，立即更新前端狀態
      if (response === 'accepted') {
        // 立即更新商品狀態顯示
        setProduct(prev => ({
          ...prev,
          status: '已售出',
          price: negotiationData.amount,
          soldTo: negotiationData.userId,
          soldAt: serverTimestamp(),
          buyerName: negotiationData.userName || '匿名用戶',
          buyerEmail: negotiationData.userEmail || '未提供'
        }));

        // 更新議價歷史的狀態
        setNegotiationHistory(prev => 
          prev.map(neg => 
            neg.id === negotiationId 
              ? { ...neg, status: 'accepted' }
              : neg
          )
        );
      }

      // 更新議價狀態
      await updateDoc(negotiationRef, {
        status: response,
        respondedAt: serverTimestamp()
      });

      // 如果接受議價，更新商品價格和狀態
      if (response === 'accepted') {
        // 獲取買家資訊
        const buyerRef = doc(db, 'users', negotiationData.userId);
        const buyerDoc = await getDoc(buyerRef);
        const buyerData = buyerDoc.data();

        await updateDoc(doc(db, 'products', productId), {
          price: negotiationData.amount,
          status: '已售出',
          soldTo: negotiationData.userId,
          soldAt: serverTimestamp(),
          buyerName: negotiationData.userName || '匿名用戶',
          buyerEmail: buyerData?.email || '未提供'
        });

        // 創建交易記錄
        const transactionRef = doc(collection(db, 'transactions'));
        await setDoc(transactionRef, {
          productId: productId,
          productTitle: product.title,
          amount: negotiationData.amount,
          buyerId: negotiationData.userId,
          buyerName: negotiationData.userName || '匿名用戶',
          buyerEmail: buyerData?.email || '未提供',
          sellerId: product.sellerId,
          sellerName: product.sellerName || '匿名用戶',
          status: 'pending',
          createdAt: serverTimestamp(),
          type: 'negotiation',
          meetingLocations: product.meetingLocations || [],
          productImage: product.images?.[0] || product.image || '/placeholder.jpg'
        });
      }

      // 更新議價歷史
      const negotiationsQuery = query(
        collection(db, 'negotiations'),
        where('productId', '==', productId)
      );
      const querySnapshot = await getDocs(negotiationsQuery);
      const updatedBids = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || new Date(0);
          const timeB = b.createdAt?.toDate?.() || new Date(0);
          return timeB - timeA;
        });
      setNegotiationHistory(updatedBids);

      toast.success(response === 'accepted' ? '已接受議價' : '已拒絕議價');
    } catch (error) {
      console.error('Error responding to negotiation:', error);
      toast.error('操作失敗，請稍後再試');
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
          {/* 如果有多張圖片，顯示縮略圖 */}
          {product.images && product.images.length > 1 && (
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <img 
                  key={index}
                  src={image}
                  alt={`${product.title} - 圖片 ${index + 1}`}
                  className="thumbnail"
                  onClick={() => {
                    const newProduct = { ...product };
                    const temp = newProduct.images[0];
                    newProduct.images[0] = newProduct.images[index];
                    newProduct.images[index] = temp;
                    setProduct(newProduct);
                  }}
                />
              ))}
            </div>
          )}
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
            <button className="contact-seller-btn" onClick={handleContactSeller}>
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
                {product.soldAt && (
                  <p>
                    <strong>售出時間：</strong>
                    {product.soldAt.toDate ? product.soldAt.toDate().toLocaleString('zh-TW') : '未知時間'}
                  </p>
                )}
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

          {/* 商品狀態更新區域 - 移除手動更新按鈕 */}
          <div className="status-controls">
            <h3>商品狀態</h3>
            <div className="status-display">
              <span className={`status-tag ${product.status === '已售出' ? 'sold' : 
                               product.status === '未售出' ? 'unsold' : 'active'}`}>
                {product.status || '進行中'}
              </span>
            </div>
          </div>

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
                  placeholder={currentBid ? `請輸入高於 NT$ ${currentBid.amount} 的競價價格` : "請輸入競價價格"}
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
                if (bid.timestamp) {
                  if (bid.timestamp instanceof Date) {
                    formattedTime = bid.timestamp.toLocaleString('zh-TW');
                  } else if (typeof bid.timestamp.toDate === 'function') {
                    formattedTime = bid.timestamp.toDate().toLocaleString('zh-TW');
                  } else if (bid.timestamp.seconds) {
                    formattedTime = new Date(bid.timestamp.seconds * 1000).toLocaleString('zh-TW');
                  }
                }
                
                const isWinner = isAuctionEnded() && idx === 0;
                
                return (
                  <li key={bid.id || idx} className={isWinner ? 'winning-bid' : ''} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div className="bid-info" style={{ flex: 1, textAlign: 'center' }}>
                      <span className="bid-user" style={{ display: 'block', marginBottom: '4px' }}>{bid.userName}</span>
                      <span className="bid-time" style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>{formattedTime}</span>
                    </div>
                    <span className="bid-amount" style={{ marginLeft: '16px' }}>NT$ {bid.amount}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* 議價歷史顯示 - 統一為條列式 */}
      {product && product.tradeMode === '先搶先贏' && (
        <div className="bid-section">
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>議價歷史</h3>
          <div className="bid-history">
            <ul>
              {negotiationHistory.length === 0 && (
                <li className="no-pending-negotiations" style={{ textAlign: 'center', padding: '20px 0' }}>目前沒有議價紀錄</li>
              )}
              {negotiationHistory.map((negotiation, idx) => {
                let formattedTime = '未知時間';
                if (negotiation.createdAt) {
                  if (negotiation.createdAt instanceof Date) {
                    formattedTime = negotiation.createdAt.toLocaleString('zh-TW');
                  } else if (typeof negotiation.createdAt.toDate === 'function') {
                    formattedTime = negotiation.createdAt.toDate().toLocaleString('zh-TW');
                  } else if (negotiation.createdAt.seconds) {
                    formattedTime = new Date(negotiation.createdAt.seconds * 1000).toLocaleString('zh-TW');
                  }
                }
                return (
                  <li key={negotiation.id || idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div className="bid-info" style={{ flex: 1, textAlign: 'center' }}>
                      <span className="bid-user" style={{ display: 'block', marginBottom: '4px' }}>買家：{negotiation.userName}</span>
                      <span className="bid-time" style={{ display: 'block', fontSize: '0.9em', color: '#666' }}>時間：{formattedTime}</span>
                    </div>
                    <span className="bid-amount" style={{ marginLeft: '16px' }}>NT$ {negotiation.amount}</span>
                    {negotiation.status === 'pending' && auth.currentUser && product.sellerId === auth.currentUser.uid && product.status !== '已售出' ? (
                      <button
                        onClick={() => handleNegotiationResponse(negotiation.id, 'accepted')}
                        className="confirm-btn"
                        style={{ marginLeft: 16 }}
                      >
                        確認議價
                      </button>
                    ) : (
                      <span className={`negotiation-status ${negotiation.status}`} style={{ marginLeft: 16 }}>
                        {negotiation.status === 'accepted' ? '已售出' : '待確認'}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {/* 買家視角：顯示議價輸入表單 */}
          {auth.currentUser && product.sellerId !== auth.currentUser.uid && product.status !== '已售出' && (
            <form onSubmit={handleBid} className="bid-form">
              <div className="bid-input-group">
                <input
                  type="number"
                  ref={bidInputRef}
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="請輸入議價金額"
                  min={0}
                  max={product.price - 1}
                  step="0.01"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                >
                  提出議價
                </button>
              </div>
              {bidError && <p className="bid-error">{bidError}</p>}
            </form>
          )}
        </div>
      )}

      {/* 修改底部按鈕區域 */}
      <div className="bottom-links">
        <Link to={`/?page=${returnPage}`} className="back-home-link">
          返回首頁
        </Link>
        {auth.currentUser && product.sellerId === auth.currentUser.uid && (
          <Link to="/profile" className="back-home-link">
            個人資料
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductDetail; 