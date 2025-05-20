import { createSlice } from '@reduxjs/toolkit';

// 將 Firestore Timestamp 轉換為可序列化的格式
const convertTimestamp = (data) => {
  if (!data) return data;
  
  // 如果是物件，遞迴處理每個屬性
  if (typeof data === 'object') {
    if (data.seconds !== undefined && data.nanoseconds !== undefined) {
      // 這是 Firestore Timestamp
      return {
        _seconds: data.seconds,
        _nanoseconds: data.nanoseconds,
        toDate: () => new Date(data.seconds * 1000)
      };
    }
    
    // 處理陣列
    if (Array.isArray(data)) {
      return data.map(item => convertTimestamp(item));
    }
    
    // 處理一般物件
    const result = {};
    for (const key in data) {
      result[key] = convertTimestamp(data[key]);
    }
    return result;
  }
  
  return data;
};

const initialState = {
  favorites: [],
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      if (!state.favorites.some(fav => fav.id === action.payload.id)) {
        state.favorites.push(convertTimestamp(action.payload));
      }
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(fav => fav.id !== action.payload);
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload.map(favorite => convertTimestamp(favorite));
    },
  },
});

export const { addFavorite, removeFavorite, setFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer; 