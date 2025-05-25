import React, { createContext, useContext, useState } from 'react';

const FavoritesContext = createContext();

export function useFavorites() {
  return useContext(FavoritesContext);
}

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);

  const addFavorite = (favorite) => {
    setFavorites((prev) => [...prev, favorite]);
  };

  const removeFavorite = (favoriteId) => {
    setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
  };

  const value = {
    favorites,
    addFavorite,
    removeFavorite,
    setFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
} 