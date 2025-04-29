import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  favorites: [],
};

const favoriteSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    addFavorite: (state, action) => {
      if (!state.favorites.some(fav => fav.id === action.payload.id)) {
        state.favorites.push(action.payload);
      }
    },
    removeFavorite: (state, action) => {
      state.favorites = state.favorites.filter(fav => fav.id !== action.payload);
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
  },
});

export const { addFavorite, removeFavorite, setFavorites } = favoriteSlice.actions;
export default favoriteSlice.reducer; 