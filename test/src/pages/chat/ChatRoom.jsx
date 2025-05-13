import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import app from '../../firebase';
import './ChatRoom.css';

const ChatRoom = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  useEffect(() => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    const fetchChatInfo = async () => {
      try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));
        if (!chatDoc.exists()) {
          navigate('/chats');
          return;
        }

        const chatData = chatDoc.data();
        if (!chatData.participants.includes(auth.currentUser.uid)) {
          navigate('/chats');
          return;
        }

        setChatInfo(chatData);
      } catch (error) {
        console.error('Error fetching chat info:', error);
        navigate('/chats');
      }
    };

    fetchChatInfo();
  }, [chatId, auth.currentUser, navigate, db]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, db]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || '匿名用戶',
        timestamp: serverTimestamp()
      });

      // 更新聊天室的最後一條消息
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('發送消息失敗，請稍後再試');
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
    <div className="chat-room-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{chatInfo?.productName}</h2>
          <p>與 {chatInfo?.participants.find(id => id !== auth.currentUser.uid) === chatInfo?.participants[0] ? '賣家' : '買家'} 的對話</p>
        </div>
        <button className="back-button" onClick={() => navigate('/chats')}>
          返回列表
        </button>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.senderId === auth.currentUser.uid ? 'sent' : 'received'
            }`}
          >
            <div className="message-content">
              <div className="message-sender">{message.senderName}</div>
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp?.toDate().toLocaleString('zh-TW')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="輸入訊息..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          發送
        </button>
      </form>
    </div>
  );
};

export default ChatRoom; 