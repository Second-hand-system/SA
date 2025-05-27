import React, { useState, useEffect, useCallback } from 'react';
import { List, Badge, Popover, Empty, Spin, Alert } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { getFirestore, collection, query, where, orderBy, limit, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { app } from '../firebase';
import './Notification.css';
import { notificationTypes } from '../utils/notificationUtils';

const MAX_RETRY_COUNT = 5;
const RETRY_DELAY = 5000; // 5秒

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [popoverVisible, setPopoverVisible] = useState(false);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    if (!auth.currentUser || isRetrying) return;

    let unsubscribe = null;

    try {
      setLoading(true);
      setError(null);
      console.log('開始獲取通知，用户ID:', auth.currentUser.uid);
      //建立查詢
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),//按時間倒序
        limit(50)
      );

      // 使用 onSnapshot 
      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          console.log('收到通知快照，数量:', snapshot.size);
          const notificationList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          setNotifications(notificationList);
          setLoading(false);
          setError(null);
          setIsRetrying(false);
        },
        (error) => {
          console.error('監聽通知時發生錯誤:', error);
          setError(error.message);
          setLoading(false);
          
          // 如索引建構錯誤，未超過最大重試次數則延遲重試
          if (error.message.includes('index is currently building') && retryCount < MAX_RETRY_COUNT) {
            setIsRetrying(true);
            setTimeout(() => {
              setRetryCount(prev => prev + 1);
              setIsRetrying(false);
            }, RETRY_DELAY);
          }
        }
      );

      return unsubscribe;
    } catch (error) {
      console.error('獲取通知時發生錯誤:', error);
      setError(error.message);
      setLoading(false);
      setIsRetrying(false);
      return unsubscribe;
    }
  }, [auth.currentUser, db, retryCount, isRetrying]);

  useEffect(() => {
    let unsubscribe = null;

    const setupNotifications = async () => {
      if (auth.currentUser) {
        unsubscribe = await fetchNotifications();
      } else {
        setNotifications([]);
        setLoading(false);
      }
    };

    setupNotifications();

    // 清理函數
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [fetchNotifications, auth.currentUser]);

  const handleRetry = () => {
    if (retryCount < MAX_RETRY_COUNT) {
      setRetryCount(prev => prev + 1);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // 標示通知為已讀
      if (!notification.read) {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, {
          read: true
        });
      }

      // 根據通知類型和目標ID進行跳轉
      switch (notification.type) {
        // 商品相關
        case notificationTypes.BID_PLACED:
        case notificationTypes.BID_OVERTAKEN:
        case notificationTypes.BID_WON:
        case notificationTypes.AUCTION_ENDED:
        case notificationTypes.ITEM_SOLD:
        case notificationTypes.PURCHASE_SUCCESS:
          navigate(`/product/${notification.itemId}`);
          break;

        // 訂單相關通知
        case notificationTypes.SCHEDULE_CHANGED:
          // 跳轉到交易管理頁面
          navigate('/transactions');
          break;

        // 議價相關通知
        case notificationTypes.NEGOTIATION_REQUEST:
        case notificationTypes.NEGOTIATION_ACCEPTED:
          navigate(`/product/${notification.itemId}`);
          break;

        default:
          console.log('未知的通知類型:', notification.type);
      }

      // 關閉通知彈窗
      setPopoverVisible(false);
    } catch (error) {
      console.error('處理通知點擊時發生錯誤:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      // 訂單相關圖標
      case notificationTypes.PURCHASE_SUCCESS:
        return '🛍️';  // 購物袋圖標
      case notificationTypes.SCHEDULE_CHANGED:
        return '🕒';  // 時鐘圖標

      // 競標相關圖標
      case notificationTypes.BID_PLACED:
        return '💰';  // 金錢圖標
      case notificationTypes.BID_OVERTAKEN:
        return '📈';  // 上升圖標
      case notificationTypes.BID_WON:
        return '🏆';  // 獎盃圖標
      case notificationTypes.AUCTION_ENDED:
        return '⏰';  // 鬧鐘圖標

      // 議價相關圖標
      case notificationTypes.NEGOTIATION_REQUEST:
        return '💬';  // 對話框圖標
      case notificationTypes.NEGOTIATION_ACCEPTED:
        return '🤝';  // 握手圖標

      // 商品相關圖標
      case notificationTypes.ITEM_SOLD:
        return '✅';  // 確認圖標

      default:
        return '📢';  // 默認通知圖標
    }
  };

  const getNotificationText = (notification) => {
    if (notification.message) {
      return notification.message;
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const notificationContent = (
    <div className="notification-popover">
      {loading ? (
        <div className="notification-loading">
          <Spin tip="載入中..." />
        </div>
      ) : error ? (
        <div className="notification-error">
          <Alert
            message="載入通知時發生錯誤"
            description={
              error.includes('index is currently building') ? (
                <div>
                  <p>索引正在構建中，請稍後再試。</p>
                  <p>這可能需要幾分鐘時間。</p>
                  <p>已重試 {retryCount}/{MAX_RETRY_COUNT} 次</p>
                  {retryCount < MAX_RETRY_COUNT && (
                    <button 
                      className="retry-button"
                      onClick={handleRetry}
                      disabled={isRetrying}
                    >
                      {isRetrying ? '重試中...' : '重試'}
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p>{error}</p>
                  {retryCount < MAX_RETRY_COUNT && (
                    <button 
                      className="retry-button"
                      onClick={handleRetry}
                      disabled={isRetrying}
                    >
                      {isRetrying ? '重試中...' : '重試'}
                    </button>
                  )}
                </div>
              )
            }
            type="error"
            showIcon
          />
        </div>
      ) : notifications.length === 0 ? (
        <Empty description="暫無通知" />
      ) : (
        <List
          className="notification-list"
          itemLayout="horizontal"
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item 
              className={`notification-item ${!notification.read ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="notification-content">
                <span className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </span>
                <div className="notification-info">
                  <div className="notification-message">
                    {getNotificationText(notification)}
                  </div>
                  <div className="notification-time">
                    {formatDate(notification.createdAt)}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover
      content={notificationContent}
      trigger="click"
      placement="bottomRight"
      overlayClassName="notification-popover-overlay"
      open={popoverVisible}
      onOpenChange={setPopoverVisible}
    >
      <div className="notification-button">
        <Badge count={unreadCount} offset={[-2, 2]}>
          <BellOutlined className="notification-icon" />
        </Badge>
      </div>
    </Popover>
  );
};

export default Notification; 