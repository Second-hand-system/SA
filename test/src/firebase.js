// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnRJrHqH5FcWcP9FS0ZqhTxLdWKjAxbtU",
  authDomain: "sa-second-hand-system.firebaseapp.com",
  projectId: "sa-second-hand-system",
  storageBucket: "sa-second-hand-system.firebasestorage.app",
  messagingSenderId: "476098508687",
  appId: "1:476098508687:web:b96e14ac565f9eb3b2fdfa",
  measurementId: "G-7Q5SH5YBPP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// 確保用戶已登入
const ensureAuth = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        reject(new Error('請先登入'));
      }
    });
  });
};

// 檢查 Firestore 連接
const checkFirestoreConnection = async () => {
  try {
    const testDoc = await db.collection('_test_').doc('_test_').get();
    console.log('Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

// 收藏相關函數
const getFavoritesCollection = (userId) => {
  return db.collection('users').doc(userId).collection('favorites');
};

const getFavoriteRef = (userId, productId) => {
  if (!userId || !productId) {
    console.error('Invalid parameters for getFavoriteRef:', { userId, productId });
    throw new Error('userId and productId are required');
  }
  return db.collection('users').doc(userId).collection('favorites').doc(productId);
};

// 新增：獲取商品的收藏計數器引用
const getFavoriteCountRef = (productId) => {
  return db.collection('products').doc(productId).collection('metadata').doc('favorites');
};

// 新增：更新商品的收藏數
const updateFavoriteCount = async (productId, increment = true) => {
  try {
    const countRef = getFavoriteCountRef(productId);
    const countDoc = await countRef.get();
    
    if (!countDoc.exists) {
      // 如果文檔不存在，創建它
      await countRef.set({ count: increment ? 1 : 0 });
      return increment ? 1 : 0;
    } else {
      // 如果文檔存在，更新計數
      const currentCount = countDoc.data().count || 0;
      const newCount = increment ? currentCount + 1 : currentCount - 1;
      await countRef.update({ count: Math.max(0, newCount) });
      return Math.max(0, newCount);
    }
  } catch (error) {
    console.error('Error updating favorite count:', error);
    throw error;
  }
};

// 新增：獲取商品的收藏數
const getFavoriteCount = async (productId) => {
  try {
    const countRef = getFavoriteCountRef(productId);
    const countDoc = await countRef.get();
    return countDoc.exists ? (countDoc.data().count || 0) : 0;
  } catch (error) {
    console.error('Error getting favorite count:', error);
    return 0;
  }
};

const addToFavorites = async (userId, productId, productData) => {
  try {
    console.log('Adding to favorites:', { userId, productId, productData });
    const favoriteRef = getFavoriteRef(userId, productId);
    const favoriteData = {
      productId,
      productData,
      createdAt: db.FieldValue.serverTimestamp()
    };
    console.log('Favorite data to be saved:', favoriteData);
    await favoriteRef.set(favoriteData);
    console.log('Successfully added to favorites');
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

const removeFromFavorites = async (userId, productId) => {
  try {
    console.log('Removing from favorites:', { userId, productId });
    const favoriteRef = getFavoriteRef(userId, productId);
    await favoriteRef.delete();
    console.log('Successfully removed from favorites');
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

const checkIsFavorite = async (userId, productId) => {
  try {
    console.log('Checking favorite status:', { userId, productId });
    const favoriteRef = getFavoriteRef(userId, productId);
    const docSnap = await favoriteRef.get();
    const exists = docSnap.exists();
    console.log('Favorite status:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

const getUserFavorites = async (userId) => {
  try {
    console.log('Getting user favorites for:', userId);
    const favoritesRef = getFavoritesCollection(userId);
    const querySnapshot = await favoritesRef.get();
    const favorites = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    console.log('Retrieved favorites count:', favorites.length);
    return favorites;
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
};

export { db, auth, storage, ensureAuth, checkFirestoreConnection };
export default app;