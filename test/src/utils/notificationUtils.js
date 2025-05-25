import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../firebase';

export const notificationTypes = {
  NEGOTIATION_REQUEST: 'negotiation_request',
  NEGOTIATION_ACCEPTED: 'negotiation_accepted',
  NEGOTIATION_REJECTED: 'negotiation_rejected',
  BID_PLACED: 'bid_placed',
  BID_OVERTAKEN: 'bid_overtaken',
  BID_WON: 'bid_won',
  ITEM_SOLD: 'item_sold',
  PURCHASE_SUCCESS: 'purchase_success',
  ITEM_FAVORITED: 'item_favorited'
};

export const createNotification = async ({ userId, type, itemName, itemId, message }) => {
  try {
    const db = getFirestore(app);
    const notificationsRef = collection(db, 'notifications');
    
    await addDoc(notificationsRef, {
      userId,
      type,
      itemName,
      itemId,
      message,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}; 