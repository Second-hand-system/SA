import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage } from '../store/messageSlice';

const MessageForm = ({ productId, sellerId }) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      dispatch(sendMessage({
        productId,
        sellerId,
        content: message,
        timestamp: new Date().toISOString()
      }));
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="mb-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="輸入您的訊息..."
          className="w-full p-2 border rounded"
          rows="3"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
      >
        發送訊息
      </button>
    </form>
  );
};

export default MessageForm; 