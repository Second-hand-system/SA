import React, { createContext, useContext, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  const addNotification = async (notification) => {
    try {
      const notificationsRef = collection(db, 'notifications');
      await addDoc(notificationsRef, {
        ...notification,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  const value = {
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
} 