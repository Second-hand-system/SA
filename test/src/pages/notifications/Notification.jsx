import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const Notification = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    let unsubscribe = null;

    const setupNotifications = async () => {
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setNotifications(notifications);
            setLoading(false);
          },
          (error) => {
            console.error('Error in notification listener:', error);
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Error setting up notifications:', error);
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
  }, [currentUser, db]);

  return (
    <div>
      {/* Render your notifications here */}
    </div>
  );
};

export default Notification; 