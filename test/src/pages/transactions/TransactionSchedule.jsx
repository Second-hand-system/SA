import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Transactions.css';

const TransactionSchedule = () => {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const db = getFirestore();
  
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDates, setSelectedDates] = useState([]);
  const [dateTimeSlots, setDateTimeSlots] = useState({});
  const [meetingLocations, setMeetingLocations] = useState([]);
  const [newLocation, setNewLocation] = useState('');
  const [isSeller, setIsSeller] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);

  // 生成時間段選項（7:00-22:00）
  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = i + 7;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  // 檢查時間段是否可用
  const isTimeSlotAvailable = (date, time) => {
    const now = new Date();
    const selectedDate = new Date(date);
    const [hours] = time.split(':').map(Number);
    
    // 如果是今天，檢查時間是否已過
    if (selectedDate.toDateString() === now.toDateString()) {
      return hours > now.getHours();
    }
    
    return true;
  };

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const transactionRef = doc(db, 'transactions', transactionId);
        const transactionDoc = await getDoc(transactionRef);
        
        if (!transactionDoc.exists()) {
          setError('找不到交易記錄');
          setLoading(false);
          return;
        }

        const transactionData = transactionDoc.data();
        console.log('Transaction data:', transactionData);
        
        // 檢查用戶身份
        const isUserSeller = transactionData.sellerId === currentUser.uid;
        setIsSeller(isUserSeller);
        
        // 如果是買家且已有排程選項，載入選項
        if (!isUserSeller && transactionData.scheduleOptions) {
          console.log('Loading schedule options for buyer:', transactionData.scheduleOptions);
          // 確保 scheduleOptions 是陣列
          const options = Array.isArray(transactionData.scheduleOptions) 
            ? transactionData.scheduleOptions 
            : [transactionData.scheduleOptions];
          
          console.log('Processed options:', options);
          
          // 載入所有日期和時間段
          const dates = options.map(option => new Date(option.date));
          const timeSlots = options.reduce((acc, option) => {
            acc[option.date] = option.timeSlots;
            return acc;
          }, {});
          
          setSelectedDates(dates);
          setDateTimeSlots(timeSlots);
          setMeetingLocations(transactionData.meetingLocations || []);
        }

        setTransaction(transactionData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching transaction:', error);
        setError('載入交易記錄時發生錯誤');
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, currentUser, db]);

  const handleAddLocation = () => {
    if (!newLocation.trim()) return;
    if (meetingLocations.length >= 3) {
      alert('最多只能添加3個面交地點');
      return;
    }
    
    setMeetingLocations(prev => [...prev, newLocation.trim()]);
    setNewLocation('');
  };

  const handleRemoveLocation = (index) => {
    setMeetingLocations(prev => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (dates) => {
    console.log('Raw selected dates:', dates);
    // 確保 dates 是陣列
    const selectedDatesArray = Array.isArray(dates) ? dates : [dates];
    
    // 過濾掉過去的日期並標準化日期格式
    const validDates = selectedDatesArray.filter(date => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }).map(date => {
      // 標準化日期，使用本地時區
      const standardizedDate = new Date(date);
      standardizedDate.setHours(0, 0, 0, 0);
      return standardizedDate;
    });
    
    console.log('Valid dates after standardization:', validDates);
    
    // 保留所有現有的時間段
    const newDateTimeSlots = { ...dateTimeSlots };
    
    // 為新選擇的日期初始化空數組（如果還沒有）
    validDates.forEach(date => {
      // 使用本地時區的日期字符串
      const dateStr = date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '-');
      
      if (!newDateTimeSlots[dateStr]) {
        newDateTimeSlots[dateStr] = [];
      }
    });
    
    // 更新狀態
    setDateTimeSlots(newDateTimeSlots);
    setSelectedDates(validDates);
  };

  const handleTimeSlotClick = (date, time) => {
    if (!isTimeSlotAvailable(date, time)) {
      return;
    }

    // 使用本地時區的日期字符串
    const dateStr = date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '-');
    
    console.log('Clicking time slot for date:', dateStr, 'time:', time);
    console.log('Current selected dates:', selectedDates);
    
    setDateTimeSlots(prev => {
      const currentSlots = prev[dateStr] || [];
      const newSlots = currentSlots.includes(time)
        ? currentSlots.filter(t => t !== time)
        : [...currentSlots, time].sort();
      
      console.log('Updated time slots for date:', dateStr, 'new slots:', newSlots);
      
      return {
        ...prev,
        [dateStr]: newSlots
      };
    });
  };

  const handleOptionSelect = (date, time, location) => {
    setSelectedOption({ date, time, location });
  };

  const handleSubmit = async () => {
    if (isSeller) {
      // 賣家提交可選時間和地點
      if (selectedDates.length === 0 || meetingLocations.length === 0) {
        alert('請至少選擇一個日期和一個面交地點');
        return;
      }

      const scheduleOptions = selectedDates.map(date => {
        const dateStr = date.toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');
        
        return {
          date: dateStr,
          timeSlots: dateTimeSlots[dateStr] || []
        };
      });

      try {
        await updateDoc(doc(db, 'transactions', transactionId), {
          scheduleOptions,
          meetingLocations,
          status: 'waiting_for_buyer',
          updatedAt: serverTimestamp()
        });

        navigate('/transactions');
      } catch (error) {
        console.error('Error updating transaction:', error);
        setError('更新交易記錄時發生錯誤');
      }
    } else {
      // 買家選擇最終時間和地點
      if (!selectedOption) {
        alert('請選擇一個面交時間和地點');
        return;
      }

      try {
        await updateDoc(doc(db, 'transactions', transactionId), {
          selectedSchedule: selectedOption,
          status: 'confirmed',
          updatedAt: serverTimestamp()
        });

        navigate('/transactions');
      } catch (error) {
        console.error('Error updating transaction:', error);
        setError('更新交易記錄時發生錯誤');
      }
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
        <button onClick={() => navigate('/transactions')}>返回交易列表</button>
      </div>
    );
  }

  return (
    <div className="transaction-schedule">
      <h2>{isSeller ? '安排面交時間' : '選擇面交時間'}</h2>
      
      {isSeller ? (
        <>
          <div className="schedule-section">
            <h3>選擇可用的日期和時間</h3>
            <Calendar
              onChange={handleDateChange}
              value={selectedDates}
              selectRange={true}
              minDate={new Date()}
            />
            
            {selectedDates.length > 0 && (
              <div className="time-slots">
                <h4>選擇時間段</h4>
                {selectedDates.map(date => {
                  const dateStr = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-');
                  
                  return (
                    <div key={dateStr} className="date-time-slots">
                      <h5>{dateStr}</h5>
                      <div className="time-slots-grid">
                        {timeSlots.map(time => (
                          <button
                            key={time}
                            className={`time-slot ${
                              dateTimeSlots[dateStr]?.includes(time) ? 'selected' : ''
                            } ${!isTimeSlotAvailable(date, time) ? 'unavailable' : ''}`}
                            onClick={() => handleTimeSlotClick(date, time)}
                            disabled={!isTimeSlotAvailable(date, time)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="location-section">
            <h3>面交地點</h3>
            <div className="location-input">
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="輸入面交地點"
                maxLength={50}
              />
              <button onClick={handleAddLocation}>添加</button>
            </div>
            
            <div className="location-list">
              {meetingLocations.map((location, index) => (
                <div key={index} className="location-item">
                  <span>{location}</span>
                  <button onClick={() => handleRemoveLocation(index)}>刪除</button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="buyer-schedule">
          {transaction.scheduleOptions && (
            <>
              <h3>可選的面交時間</h3>
              {transaction.scheduleOptions.map((option, index) => (
                <div key={index} className="schedule-option">
                  <h4>{option.date}</h4>
                  <div className="time-slots-grid">
                    {option.timeSlots.map(time => (
                      <button
                        key={time}
                        className={`time-slot ${
                          selectedOption?.date === option.date && 
                          selectedOption?.time === time ? 'selected' : ''
                        }`}
                        onClick={() => handleOptionSelect(option.date, time)}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="location-selection">
                <h3>選擇面交地點</h3>
                <div className="location-list">
                  {transaction.meetingLocations.map((location, index) => (
                    <button
                      key={index}
                      className={`location-option ${
                        selectedOption?.location === location ? 'selected' : ''
                      }`}
                      onClick={() => {
                        if (selectedOption) {
                          handleOptionSelect(selectedOption.date, selectedOption.time, location);
                        }
                      }}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="schedule-actions">
        <button onClick={() => navigate('/transactions')}>取消</button>
        <button 
          onClick={handleSubmit}
          disabled={
            isSeller 
              ? (selectedDates.length === 0 || meetingLocations.length === 0)
              : !selectedOption
          }
        >
          確認
        </button>
      </div>
    </div>
  );
};

export default TransactionSchedule; 