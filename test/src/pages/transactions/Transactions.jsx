import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, getDocs, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './Transactions.css';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) return;

      try {
        const transactionsRef = collection(db, 'transactions');
        const buyerQuery = query(
          transactionsRef,
          where('buyerId', '==', currentUser.uid)
        );
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

  const filteredTransactions = transactions.filter(transaction => {
    switch (activeTab) {
      case 'waitingForSchedule':
        return transaction.status === 'pending';
      case 'confirmed':
        return transaction.status === 'confirmed';
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
                  {transaction.status === 'confirmed' ? '已確認' :
                   transaction.status === 'pending' ? '待排程' :
                   transaction.status === 'waiting_for_buyer' ? '等待買家選擇' :
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

              {/* 賣家視角：待排程的交易顯示排程按鈕 */}
              {transaction.status === 'pending' && 
               currentUser.uid === transaction.sellerId && (
                <div className="schedule-section">
                  <button 
                    className="schedule-btn"
                    onClick={() => navigate(`/transactions/schedule/${transaction.id}`)}
                  >
                    安排面交時間
                  </button>
                </div>
              )}

              {/* 買家視角：等待選擇的交易顯示排程按鈕 */}
              {transaction.status === 'waiting_for_buyer' && 
               currentUser.uid === transaction.buyerId && (
                <div className="schedule-section">
                  <button 
                    className="schedule-btn"
                    onClick={() => navigate(`/transactions/schedule/${transaction.id}`)}
                  >
                    選擇面交時間
                  </button>
                </div>
              )}

              {/* 顯示已確認的面交資訊 */}
              {transaction.status === 'confirmed' && (
                <div className="confirmed-meeting-info">
                  <h4>已確認的面交資訊</h4>
                  <p><strong>日期：</strong>
                    {transaction.selectedSchedule?.date ? 
                      new Date(transaction.selectedSchedule.date).toLocaleDateString('zh-TW') : 
                      '未設定'}
                  </p>
                  <p><strong>時間：</strong>{transaction.selectedSchedule?.time || '未設定'}</p>
                  <p><strong>地點：</strong>{transaction.selectedSchedule?.location || '未設定'}</p>
                </div>
              )}

              <div className="transaction-actions">
                <Link to={`/product/${transaction.productId}`} className="view-details-btn">
                  查看商品詳情
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