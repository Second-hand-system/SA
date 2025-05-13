import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'waitingForSchedule', 'confirmed'
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) return;

      try {
        const transactionsRef = collection(db, 'transactions');
        
        // 獲取買家交易
        const buyerQuery = query(
          transactionsRef,
          where('buyerId', '==', currentUser.uid)
        );
        
        // 獲取賣家交易
        const sellerQuery = query(
          transactionsRef,
          where('sellerId', '==', currentUser.uid)
        );

        const [buyerSnapshot, sellerSnapshot] = await Promise.all([
          getDocs(buyerQuery),
          getDocs(sellerQuery)
        ]);

        const buyerTransactions = buyerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        const sellerTransactions = sellerSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 合併並排序所有交易
        const allTransactions = [...buyerTransactions, ...sellerTransactions]
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
          });

        setTransactions(allTransactions);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setError('載入交易記錄時發生錯誤');
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser, db]);

  const handleCancelTransaction = async (transactionId) => {
    if (!window.confirm('確定要取消此交易嗎？')) {
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });

      // 更新本地狀態
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === transactionId 
            ? { ...transaction, status: 'cancelled', cancelledAt: new Date() }
            : transaction
        )
      );
    } catch (error) {
      console.error('Error cancelling transaction:', error);
      alert('取消交易失敗，請稍後再試');
    }
  };

  const handleScheduleTransaction = async (transactionId) => {
    navigate(`/transactions/schedule/${transactionId}`);
  };

  const handleConfirmSchedule = async (transactionId) => {
    navigate(`/transactions/confirm/${transactionId}`);
  };

  const filteredTransactions = transactions.filter(transaction => {
    switch (activeTab) {
      case 'waitingForSchedule':
        return transaction.status === 'pending' || transaction.status === 'waitingForSchedule';
      case 'confirmed':
        return transaction.status === 'confirmed' || transaction.status === 'completed';
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>載入中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="transactions-container">
      <h1>交易管理</h1>
      
      <div className="transaction-tabs">
        <button 
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部交易
        </button>
        <button 
          className={`tab ${activeTab === 'waitingForSchedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('waitingForSchedule')}
        >
          待排程
        </button>
        <button 
          className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          已確認
        </button>
      </div>

      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <p className="no-transactions">尚無交易記錄</p>
        ) : (
          filteredTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-card">
              <div className="transaction-header">
                <h3>{transaction.productTitle}</h3>
                <span className={`status ${transaction.status}`}>
                  {transaction.status === 'completed' ? '已完成' :
                   transaction.status === 'confirmed' ? '已確認' :
                   transaction.status === 'waitingForSchedule' ? '待排程' :
                   transaction.status === 'pending' ? '待排程' :
                   transaction.status === 'cancelled' ? '已取消' : '未知狀態'}
                </span>
              </div>
              <div className="transaction-details">
                <p><strong>交易金額：</strong>NT$ {transaction.amount}</p>
                <p><strong>交易時間：</strong>
                  {transaction.createdAt?.toDate?.().toLocaleString('zh-TW') || '未知時間'}
                </p>
                <p><strong>交易對象：</strong>
                  {currentUser.uid === transaction.buyerId ? '賣家' : '買家'}
                </p>
                <p><strong>交易類型：</strong>
                  {transaction.type === 'direct_purchase' ? '直接購買' : '競標'}
                </p>
              </div>
              <div className="transaction-actions">
                {(transaction.status === 'pending' || transaction.status === 'waitingForSchedule') && 
                 currentUser.uid === transaction.sellerId && (
                  <button 
                    className="schedule-btn"
                    onClick={() => handleScheduleTransaction(transaction.id)}
                  >
                    安排交易
                  </button>
                )}
                {(transaction.status === 'pending' || transaction.status === 'waitingForSchedule') && 
                 currentUser.uid === transaction.buyerId && (
                  <button 
                    className="confirm-btn"
                    onClick={() => handleConfirmSchedule(transaction.id)}
                  >
                    確認時間
                  </button>
                )}
                {transaction.status === 'pending' && (
                  <button 
                    className="cancel-btn"
                    onClick={() => handleCancelTransaction(transaction.id)}
                  >
                    取消交易
                  </button>
                )}
                <Link to={`/transaction/${transaction.id}`} className="view-details-btn">
                  查看詳情
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Transactions; 