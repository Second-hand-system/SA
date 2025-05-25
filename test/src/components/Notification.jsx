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
      console.log('开始获取通知，用户ID:', auth.currentUser.uid);

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      // 使用 onSnapshot 实时监听通知变化
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
          console.error('监听通知时发生错误:', error);
          setError(error.message);
          setLoading(false);
          
          // 如果是索引构建错误，且未超过最大重试次数，则延迟重试
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
      console.error('获取通知时发生错误:', error);
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

      // 根据通知类型和目标ID进行跳转
      switch (notification.type) {
        // 商品相关通知
        case notificationTypes.BID_PLACED:
        case notificationTypes.BID_OVERTAKEN:
        case notificationTypes.BID_WON:
        case notificationTypes.AUCTION_ENDED:
        case notificationTypes.ITEM_SOLD:
        case notificationTypes.ITEM_FAVORITED:
          navigate(`/product/${notification.itemId}`);
          break;

        // 订单相关通知
        case notificationTypes.ORDER_CREATED:
        case notificationTypes.PURCHASE_SUCCESS:
        case notificationTypes.ORDER_CONFIRMED:
        case notificationTypes.ORDER_COMPLETED:
        case notificationTypes.ORDER_CANCELLED:
        case notificationTypes.SCHEDULE_CHANGED:
          // 跳转到交易管理页面
          navigate('/transactions');
          break;

        // 议价相关通知
        case notificationTypes.NEGOTIATION_REQUEST:
        case notificationTypes.NEGOTIATION_MESSAGE:
        case notificationTypes.NEGOTIATION_ACCEPTED:
        case notificationTypes.NEGOTIATION_REJECTED:
          navigate(`/product/${notification.itemId}`);
          break;

        default:
          console.log('未知的通知类型:', notification.type);
      }

      // 关闭通知弹窗
      setPopoverVisible(false);
    } catch (error) {
      console.error('处理通知点击时发生错误:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      // 订单相关图标
      case notificationTypes.ORDER_CREATED:
        return '📦';
      case notificationTypes.PURCHASE_SUCCESS:
        return '🛍️';
      case notificationTypes.ORDER_CONFIRMED:
        return '✅';
      case notificationTypes.ORDER_COMPLETED:
        return '🎉';
      case notificationTypes.ORDER_CANCELLED:
        return '❌';
      case notificationTypes.SCHEDULE_CHANGED:
        return '🕒';

      // 竞标相关图标
      case notificationTypes.BID_PLACED:
        return '💰';
      case notificationTypes.BID_OVERTAKEN:
        return '📈';
      case notificationTypes.BID_WON:
        return '🏆';
      case notificationTypes.AUCTION_ENDED:
        return '⏰';

      // 议价相关图标
      case notificationTypes.NEGOTIATION_REQUEST:
        return '💬';
      case notificationTypes.NEGOTIATION_MESSAGE:
        return '📝';
      case notificationTypes.NEGOTIATION_ACCEPTED:
        return '🤝';
      case notificationTypes.NEGOTIATION_REJECTED:
        return '❌';

      // 商品相关图标
      case notificationTypes.ITEM_SOLD:
        return '✅';
      case notificationTypes.ITEM_FAVORITED:
        return '❤️';

      default:
        return '📢';
    }
  };

  const getNotificationText = (notification) => {
    if (notification.message) {
      return notification.message;
    }

    switch (notification.type) {
      case notificationTypes.ORDER_CREATED:
        return '訂單已成立';
      case notificationTypes.PURCHASE_SUCCESS:
        return '購買成功';
      case notificationTypes.ORDER_CONFIRMED:
        return '訂單已確認';
      case notificationTypes.ORDER_COMPLETED:
        return '訂單已完成';
      case notificationTypes.ORDER_CANCELLED:
        return '訂單已取消';
      case notificationTypes.SCHEDULE_CHANGED:
        return '請選擇面交時間地點';
      case notificationTypes.BID_PLACED:
        return '收到新的出價';
      case notificationTypes.BID_OVERTAKEN:
        return '您的出價已被超越';
      case notificationTypes.BID_WON:
        return '恭喜您得標';
      case notificationTypes.AUCTION_ENDED:
        return '競標時間已結束';
      case notificationTypes.NEGOTIATION_REQUEST:
        return '收到新的議價請求';
      case notificationTypes.NEGOTIATION_MESSAGE:
        return '收到新的議價訊息';
      case notificationTypes.NEGOTIATION_ACCEPTED:
        return '議價成功';
      case notificationTypes.NEGOTIATION_REJECTED:
        return '議價被拒絕';
      case notificationTypes.ITEM_SOLD:
        return '商品已售出';
      case notificationTypes.ITEM_FAVORITED:
        return '商品被收藏';
      default:
        return '新通知';
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