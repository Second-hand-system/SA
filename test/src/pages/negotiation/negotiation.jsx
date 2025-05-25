import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { createNotification, notificationTypes } from '../../utils/notificationUtils';

// 在handleNegotiationRequest函数中添加通知
const handleNegotiationRequest = async (productId, productTitle) => {
  try {
    const negotiationRef = await addDoc(collection(db, 'negotiations'), {
      productId,
      productTitle,
      buyerId: auth.currentUser.uid,
      sellerId: product.sellerId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // 发送议价请求通知给卖家
    await createNotification({
      userId: product.sellerId,
      type: notificationTypes.NEGOTIATION_REQUEST,
      itemName: productTitle,
      itemId: productId,
      message: '收到新的議價請求'
    });

    // 更新本地状态
    setNegotiations(prev => [...prev, {
      id: negotiationRef.id,
      productId,
      productTitle,
      status: 'pending',
      createdAt: new Date()
    }]);
  } catch (error) {
    console.error('Error creating negotiation request:', error);
  }
};

// 在handleMessageSend函数中添加通知
const handleMessageSend = async (negotiationId, message) => {
  try {
    const negotiationRef = doc(db, 'negotiations', negotiationId);
    const negotiationDoc = await getDoc(negotiationRef);
    const negotiationData = negotiationDoc.data();

    await addDoc(collection(db, 'negotiation_messages'), {
      negotiationId,
      senderId: auth.currentUser.uid,
      message,
      createdAt: serverTimestamp()
    });

    // 发送消息通知给对方
    const notifyUserId = auth.currentUser.uid === negotiationData.buyerId 
      ? negotiationData.sellerId 
      : negotiationData.buyerId;

    await createNotification({
      userId: notifyUserId,
      type: notificationTypes.NEGOTIATION_MESSAGE,
      itemName: negotiationData.productTitle,
      itemId: negotiationData.productId,
      message: '收到新的議價訊息'
    });

    // 更新本地状态
    setMessages(prev => [...prev, {
      senderId: auth.currentUser.uid,
      message,
      createdAt: new Date()
    }]);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// 在handleNegotiationComplete函数中添加通知
const handleNegotiationComplete = async (negotiationId, isAccepted) => {
  try {
    const negotiationRef = doc(db, 'negotiations', negotiationId);
    const negotiationDoc = await getDoc(negotiationRef);
    const negotiationData = negotiationDoc.data();

    await updateDoc(negotiationRef, {
      status: isAccepted ? 'accepted' : 'rejected',
      updatedAt: serverTimestamp()
    });

    // 发送议价结果通知
    const notifyUserId = auth.currentUser.uid === negotiationData.buyerId 
      ? negotiationData.sellerId 
      : negotiationData.buyerId;

    await createNotification({
      userId: notifyUserId,
      type: isAccepted ? notificationTypes.NEGOTIATION_SUCCESS : notificationTypes.NEGOTIATION_FAILED,
      itemName: negotiationData.productTitle,
      itemId: negotiationData.productId,
      message: isAccepted ? '議價成功' : '議價失敗'
    });

    // 更新本地状态
    setNegotiations(prev => 
      prev.map(n => n.id === negotiationId 
        ? { ...n, status: isAccepted ? 'accepted' : 'rejected' } 
        : n
      )
    );
  } catch (error) {
    console.error('Error completing negotiation:', error);
  }
}; 