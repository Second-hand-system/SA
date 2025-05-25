import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Transactions.css';
import { createNotification } from '../../utils/notificationUtils';
import { notificationTypes } from '../../utils/notificationUtils';

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
    console.log('Selecting option:', { date, time, location });
    setSelectedOption({
      date: date,
      time: time,
      location: location
    });
  };

  const handleScheduleConfirm = async () => {
    if (isSeller) {
      // 賣家提交選項
      if (selectedDates.length === 0 || meetingLocations.length === 0) {
        alert('請選擇至少一個日期和至少一個面交地點');
        return;
      }

      console.log('Current selected dates:', selectedDates);
      console.log('Current dateTimeSlots:', dateTimeSlots);

      // 處理所有選擇的日期和時間
      const scheduleOptions = Object.entries(dateTimeSlots).map(([dateStr, timeSlots]) => {
        console.log(`Processing date ${dateStr} with time slots:`, timeSlots);
        
        if (timeSlots.length === 0) {
          console.warn(`日期 ${dateStr} 沒有選擇時間段`);
          return null;
        }

        return {
          date: dateStr,
          timeSlots: timeSlots
        };
      }).filter(option => option !== null);

      console.log('Final schedule options to submit:', scheduleOptions);

      if (scheduleOptions.length === 0) {
        alert('請至少選擇一個有效的日期和時間段');
        return;
      }

      try {
        const transactionRef = doc(db, 'transactions', transactionId);
        
        // 提交前再次確認數據
        console.log('Submitting schedule options:', {
          status: 'waiting_for_buyer',
          scheduleOptions: scheduleOptions,
          meetingLocations: meetingLocations
        });

        await updateDoc(transactionRef, {
          status: 'waiting_for_buyer',
          scheduleOptions: scheduleOptions,
          meetingLocations: meetingLocations,
          scheduledAt: serverTimestamp()
        });

        // 創建通知給買家
        await createNotification({
          userId: transaction.buyerId,
          type: notificationTypes.SCHEDULE_CHANGED,
          itemName: transaction.productTitle,
          itemId: transaction.productId,
          message: `賣家已設定面交時間地點：${transaction.productTitle}，請前往交易管理區選擇`
        });

        // 提交成功後顯示詳細信息
        const successMessage = `成功提交 ${scheduleOptions.length} 個日期的面交選項：\n` +
          scheduleOptions.map(option => 
            `${option.date}: ${option.timeSlots.join(', ')}`
          ).join('\n');
        
        alert(successMessage);
        navigate('/transactions');
      } catch (error) {
        console.error('Error submitting schedule options:', error);
        alert('提交面交選項失敗，請稍後再試');
      }
    } else {
      // 買家確認選擇
      if (!selectedOption) {
        alert('請選擇一個面交時間和地點');
        return;
      }

      try {
        const transactionRef = doc(db, 'transactions', transactionId);
        
        await updateDoc(transactionRef, {
          status: 'confirmed',
          selectedSchedule: selectedOption,
          confirmedAt: serverTimestamp()
        });

        alert('面交時間和地點已確認！');
        navigate('/transactions');
      } catch (error) {
        console.error('Error confirming schedule:', error);
        alert('確認面交時間失敗，請稍後再試');
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
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate('/transactions')}>返回交易列表</button>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>{isSeller ? '提供面交選項' : '選擇面交時間'}</h1>
        <h2>{transaction?.productTitle}</h2>
      </div>

      <div className="schedule-content">
        {isSeller ? (
          // 賣家視角：提供選項
          <>
            <div className="calendar-section">
              <h3>選擇日期（可多選）</h3>
              <Calendar
                onChange={handleDateChange}
                value={selectedDates}
                minDate={new Date()}
                className="meeting-calendar"
                selectRange={false}
                multiple={true}
                tileClassName={({ date }) => {
                  const dateStr = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-');
                  return selectedDates.some(d => 
                    d.toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    }).replace(/\//g, '-') === dateStr
                  ) ? 'selected-date' : null;
                }}
              />
            </div>

            {/* 顯示已選擇的日期和時間摘要 */}
            <div className="selected-summary">
              <h3>已選擇的面交時間</h3>
              {Object.entries(dateTimeSlots).length > 0 ? (
                Object.entries(dateTimeSlots).map(([dateStr, times]) => {
                  if (times.length === 0) return null;
                  
                  const date = new Date(dateStr);
                  const formattedDate = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  
                  return (
                    <div key={dateStr} className="summary-item">
                      <h4>{formattedDate}</h4>
                      <div className="selected-times">
                        {times.map(time => (
                          <span key={time} className="selected-time">{time}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-times">尚未選擇任何時間</p>
              )}
            </div>

            {selectedDates.length > 0 && (
              <div className="time-slots-section">
                <h3>選擇時段（可多選）</h3>
                {selectedDates.map(date => {
                  // 格式化日期字符串
                  const dateStr = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                  }).replace(/\//g, '-');

                  // 格式化顯示日期
                  const displayDate = date.toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });

                  return (
                    <div key={dateStr} className="date-time-group">
                      <h4>{displayDate}</h4>
                      <div className="time-slots">
                        {timeSlots.map(timeSlot => {
                          const isAvailable = isTimeSlotAvailable(date, timeSlot);
                          const isSelected = (dateTimeSlots[dateStr] || []).includes(timeSlot);

                          return (
                            <button
                              key={`${dateStr}-${timeSlot}`}
                              className={`time-slot ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                              onClick={() => handleTimeSlotClick(date, timeSlot)}
                              disabled={!isAvailable}
                              style={{
                                backgroundColor: isSelected ? '#FFD700' : 'white',
                                color: isSelected ? '#000' : '#333',
                                border: isSelected ? '2px solid #FFD700' : '1px solid #ccc',
                                cursor: isAvailable ? 'pointer' : 'not-allowed',
                                opacity: isAvailable ? 1 : 0.5,
                                transition: 'all 0.3s ease'
                              }}
                            >
                              {timeSlot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="locations-section">
              <h3>面交地點（最多3個）</h3>
              <div className="location-input">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="輸入面交地點"
                  disabled={meetingLocations.length >= 3}
                />
                <button
                  onClick={handleAddLocation}
                  disabled={meetingLocations.length >= 3}
                >
                  添加
                </button>
              </div>
              <div className="locations-list">
                {meetingLocations.map((location, index) => (
                  <div key={index} className="location-item">
                    <span>{location}</span>
                    <button onClick={() => handleRemoveLocation(index)}>
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          // 買家視角：選擇選項
          <div className="schedule-options">
            <h3>可用的面交選項</h3>
            {transaction?.scheduleOptions && transaction.scheduleOptions.length > 0 ? (
              <>
                <div className="selected-summary">
                  <h3>賣家提供的面交時間</h3>
                  {transaction.scheduleOptions.map((option, index) => {
                    const formattedDate = new Date(option.date).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    
                    return (
                      <div key={index} className="summary-item">
                        <h4>{formattedDate}</h4>
                        <div className="selected-times">
                          {option.timeSlots.map(time => (
                            <span key={time} className="selected-time">{time}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="selection-area">
                  <h3>請選擇面交時間</h3>
                  {transaction.scheduleOptions.map((option, index) => {
                    const formattedDate = new Date(option.date).toLocaleDateString('zh-TW', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                    
                    return (
                      <div key={index} className="schedule-option">
                        <h4>{formattedDate}</h4>
                        <div className="time-slots">
                          {option.timeSlots.map(time => (
                            <button
                              key={time}
                              className={`time-slot ${
                                selectedOption?.time === time && 
                                selectedOption?.date === option.date ? 'selected' : ''
                              }`}
                              onClick={() => {
                                console.log('Time slot clicked:', { date: option.date, time });
                                handleOptionSelect(option.date, time, selectedOption?.location || transaction.meetingLocations[0]);
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                        <div className="location-options">
                          {transaction.meetingLocations.map((location, locIndex) => (
                            <button
                              key={locIndex}
                              className={`location-option ${
                                selectedOption?.location === location && 
                                selectedOption?.date === option.date ? 'selected' : ''
                              }`}
                              onClick={() => {
                                console.log('Location clicked:', { date: option.date, location });
                                handleOptionSelect(
                                  option.date,
                                  selectedOption?.time || option.timeSlots[0],
                                  location
                                );
                              }}
                            >
                              {location}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedOption && (
                  <div className="selected-option-summary">
                    <h3>您選擇的面交時間</h3>
                    <div className="summary-item">
                      <h4>{new Date(selectedOption.date).toLocaleDateString('zh-TW', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</h4>
                      <div className="selected-times">
                        <span className="selected-time">{selectedOption.time}</span>
                      </div>
                      <div className="selected-location">
                        <span className="location-tag">地點：{selectedOption.location}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="no-options">賣家尚未提供面交選項</p>
            )}
          </div>
        )}

        <div className="schedule-actions">
          <button
            className="confirm-btn"
            onClick={handleScheduleConfirm}
          >
            {isSeller ? '提交選項' : '確認選擇'}
          </button>
          <button
            className="cancel-btn"
            onClick={() => navigate('/transactions')}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionSchedule; 