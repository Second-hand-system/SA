import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import app from '../../firebase';
import './ChatList.css';

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const userId = auth.currentUser.uid;
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = await Promise.all(
        snapshot.docs.map(async (chatDoc) => {
          const chatData = chatDoc.data();
          const otherUserId = chatData.participants.find(id => id !== userId);

          // 獲取其他用戶的資料
          let otherUserName = '未知用戶';
          try {
            const userDoc = await getDoc(doc(db, 'users', otherUserId));
            if (userDoc.exists()) {
              otherUserName = userDoc.data().displayName || '匿名用戶';
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }

          return {
            id: chatDoc.id,
            ...chatData,
            otherUserName
          };
        })
      );
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, navigate, db]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  return (
    <div className="chat-list-container">
      <h1>我的聊天室</h1>
      {chats.length === 0 ? (
        <div className="no-chats">
          <p>還沒有任何聊天記錄</p>
        </div>
      ) : (
        <div className="chat-list">
          {chats.map(chat => (
            <div
              key={chat.id}
              className="chat-item"
              onClick={() => navigate(`/chat/${chat.id}`)}
            >
              <div className="chat-item-image">
                <img
                  src={chat.productImage || '/placeholder.jpg'}
                  alt={chat.productName}
                />
              </div>
              <div className="chat-item-content">
                <div className="chat-item-header">
                  <h3>{chat.productName}</h3>
                  <span className="chat-time">
                    {chat.lastMessageTime?.toDate().toLocaleString('zh-TW')}
                  </span>
                </div>
                <div className="chat-item-preview">
                  <p>{chat.lastMessage}</p>
                </div>
                <div className="chat-item-participants">
                  <span>與 {chat.otherUserName} 的對話</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
