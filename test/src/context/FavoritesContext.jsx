import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe = () => {};

    const loadFavorites = async () => {
      if (!auth.currentUser) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      try {
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('userId', '==', auth.currentUser.uid));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const favoritesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFavorites(favoritesData);
          setLoading(false);
        }, (error) => {
          console.error('Error loading favorites:', error);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up favorites listener:', error);
        setLoading(false);
      }
    };

    loadFavorites();
    return () => unsubscribe();
  }, []);

  const addFavorite = (favorite) => {
    setFavorites(prev => [...prev, favorite]);
  };

  const removeFavorite = (productId) => {
    setFavorites(prev => prev.filter(fav => fav.productId !== productId));
  };

  const value = {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    totalFavorites: favorites.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}; 