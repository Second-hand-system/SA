import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  getDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import app from '../../firebase';
import './ChatList.css';

// 加入 Font Awesome CDN
const fontAwesomeLink = document.createElement('link');
fontAwesomeLink.rel = 'stylesheet';
fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
document.head.appendChild(fontAwesomeLink);

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
          // 直接用 chatData.sellerName
          const sellerName = chatData.sellerName || '賣家';
          return {
            id: chatDoc.id,
            ...chatData,
            sellerName
          };
        })
      );
      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser, navigate, db]);

  const deleteChat = async (chatId) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
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
                  <span>與 {chat.sellerName} 的對話</span>
                </div>
              </div>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatList;
