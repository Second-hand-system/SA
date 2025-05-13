import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './TransactionSchedule.css';

const TransactionSchedule = () => {
  const { transactionId } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState({});
  const [locations, setLocations] = useState(['']);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const db = getFirestore();

  // 時段選項
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ];

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!currentUser) {
        navigate('/login');
        return;
      }

      try {
        const transactionRef = doc(db, 'transactions', transactionId);
        const transactionDoc = await getDoc(transactionRef);

        if (!transactionDoc.exists()) {
          setError('找不到交易記錄');
          setLoading(false);
          return;
        }

        const data = transactionDoc.data();
        
        // 檢查權限
        if (currentUser.uid !== data.sellerId) {
          setError('您沒有權限安排此交易');
          setLoading(false);
          return;
        }

        setTransaction({
          id: transactionDoc.id,
          ...data
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setError('載入交易記錄時發生錯誤');
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, currentUser, db, navigate]);

  const handleDateChange = (date) => {
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0];
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  const handleTimeSlotChange = (date, timeSlot) => {
    setSelectedTimeSlots(prev => {
      const newSlots = { ...prev };
      if (!newSlots[date]) {
        newSlots[date] = [];
      }
      
      if (newSlots[date].includes(timeSlot)) {
        newSlots[date] = newSlots[date].filter(t => t !== timeSlot);
      } else {
        newSlots[date] = [...newSlots[date], timeSlot];
      }
      
      return newSlots;
    });
  };

  const handleLocationChange = (index, value) => {
    setLocations(prev => {
      const newLocations = [...prev];
      newLocations[index] = value;
      return newLocations;
    });
  };

  const addLocation = () => {
    if (locations.length < 3) {
      setLocations(prev => [...prev, '']);
    }
  };

  const removeLocation = (index) => {
    setLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (selectedDates.length === 0) {
      alert('請選擇至少一個日期');
      return;
    }

    if (locations.filter(loc => loc.trim()).length === 0) {
      alert('請至少輸入一個交易地點');
      return;
    }

    try {
      const transactionRef = doc(db, 'transactions', transactionId);
      await updateDoc(transactionRef, {
        status: 'waitingForSchedule',
        schedule: {
          dates: selectedDates,
          timeSlots: selectedTimeSlots,
          locations: locations.filter(loc => loc.trim()),
          updatedAt: serverTimestamp()
        }
      });

      alert('交易時間已安排');
      navigate('/transactions');
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('安排交易時間時發生錯誤');
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

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="schedule-container">
      <h1>安排交易時間</h1>
      
      <div className="schedule-content">
        <div className="calendar-section">
          <h2>選擇日期</h2>
          <Calendar
            onChange={handleDateChange}
            value={selectedDates.map(date => new Date(date))}
            selectRange={false}
            multiple={true}
            minDate={new Date()}
          />
        </div>

        <div className="time-slots-section">
          <h2>選擇時段</h2>
          {selectedDates.map(date => (
            <div key={date} className="date-time-slots">
              <h3>{new Date(date).toLocaleDateString('zh-TW')}</h3>
              <div className="time-slots-grid">
                {timeSlots.map(timeSlot => (
                  <label key={timeSlot} className="time-slot">
                    <input
                      type="checkbox"
                      checked={selectedTimeSlots[date]?.includes(timeSlot) || false}
                      onChange={() => handleTimeSlotChange(date, timeSlot)}
                    />
                    {timeSlot}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="locations-section">
          <h2>交易地點</h2>
          {locations.map((location, index) => (
            <div key={index} className="location-input">
              <input
                type="text"
                value={location}
                onChange={(e) => handleLocationChange(index, e.target.value)}
                placeholder={`交易地點 ${index + 1}`}
              />
              {index > 0 && (
                <button
                  className="remove-location-btn"
                  onClick={() => removeLocation(index)}
                >
                  移除
                </button>
              )}
            </div>
          ))}
          {locations.length < 3 && (
            <button className="add-location-btn" onClick={addLocation}>
              新增地點
            </button>
          )}
        </div>

        <div className="schedule-actions">
          <button className="submit-btn" onClick={handleSubmit}>
            確認安排
          </button>
          <button className="cancel-btn" onClick={() => navigate('/transactions')}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSchedule; 