import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

export const notificationTypes = {
  // 订单相关
  ORDER_CREATED: 'order_created',           // 订单成立
  PURCHASE_SUCCESS: 'purchase_success',     // 购买成功
  ORDER_CONFIRMED: 'order_confirmed',       // 订单确认
  ORDER_COMPLETED: 'order_completed',       // 订单完成
  ORDER_CANCELLED: 'order_cancelled',       // 订单取消
  SCHEDULE_CHANGED: 'schedule_changed',     // 时间地点需调整

  // 竞标相关
  BID_PLACED: 'bid_placed',                // 竞标出价
  BID_OVERTAKEN: 'bid_overtaken',          // 竞标被超越
  BID_WON: 'bid_won',                      // 竞标得标
  AUCTION_ENDED: 'auction_ended',          // 竞标时间结束

  // 议价相关
  NEGOTIATION_REQUEST: 'negotiation_request',    // 议价请求
  NEGOTIATION_MESSAGE: 'negotiation_message',    // 议价留言
  NEGOTIATION_ACCEPTED: 'negotiation_accepted',  // 议价成功
  NEGOTIATION_REJECTED: 'negotiation_rejected',  // 议价拒绝

  // 商品相关
  ITEM_SOLD: 'item_sold',                  // 商品售出
  ITEM_FAVORITED: 'item_favorited'         // 商品被收藏
};

export const createNotification = async ({ userId, type, itemName, itemId, message, orderId }) => {
  try {
    const db = getFirestore(app);
    const notificationsRef = collection(db, 'notifications');
    
    const notificationData = {
      userId,
      type,
      itemName,
      itemId,
      message,
      read: false,
      createdAt: serverTimestamp()
    };

    if (orderId) {
      notificationData.orderId = orderId;
    }

    console.log('Creating notification:', notificationData);
    const docRef = await addDoc(notificationsRef, notificationData);
    console.log('Notification created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}; 