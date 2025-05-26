import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { app } from '../firebase';

export const notificationTypes = {
  // 購買相關
  PURCHASE_SUCCESS: 'purchase_success',     // 購買成功
  ITEM_SOLD: 'ITEM_SOLD',                  // 商品售出
  SCHEDULE_CHANGED: 'schedule_changed',     // 時間地點需調整
  // 競標
  BID_PLACED: 'BID_PLACED',                // 競標出價
  BID_OVERTAKEN: 'bid_overtaken',          // 競標被超越
  BID_WON: 'bid_won',                      // 競標得標
  AUCTION_ENDED: 'auction_ended',          // 競標時間結束
  // 議價
  NEGOTIATION_REQUEST: 'NEGOTIATION_REQUEST',    // 議價請求
  NEGOTIATION_ACCEPTED: 'NEGOTIATION_ACCEPTED',  // 議價成功
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