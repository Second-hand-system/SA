// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore,
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  FieldValue,
  limit
} from "firebase/firestore";
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
    // 檢查用戶是否已登入
    const user = auth.currentUser;
    if (!user) {
      console.log('Firestore connection test skipped: user not logged in');
      return true; // 未登入時也返回 true，因為這是預期的行為
    }

    // 如果用戶已登入，則測試連接
    const testRef = collection(db, '_test_');
    const q = query(testRef, limit(1));
    await getDocs(q);
    console.log('Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

// 收藏相關函數
const getFavoritesCollection = (userId) => {
  if (!userId) {
    throw new Error('userId is required');
  }
  return collection(db, 'users', userId, 'favorites');
};

const getFavoriteRef = (userId, productId) => {
  if (!userId || !productId) {
    throw new Error('userId and productId are required');
  }
  return doc(db, 'users', userId, 'favorites', productId);
};

const getFavoriteCountRef = (productId) => {
  if (!productId) {
    throw new Error('productId is required');
  }
  return doc(db, 'products', productId, 'metadata', 'favorites');
};

const updateFavoriteCount = async (productId, increment = true) => {
  try {
    if (!productId) {
      throw new Error('productId is required');
    }

    const countRef = getFavoriteCountRef(productId);
    const countDoc = await getDoc(countRef);
    
    const currentCount = countDoc.exists() ? (countDoc.data().count || 0) : 0;
    const newCount = increment ? currentCount + 1 : Math.max(0, currentCount - 1);
    
    await setDoc(countRef, { 
      count: newCount,
      updatedAt: serverTimestamp()
    });
    
    return newCount;
  } catch (error) {
    console.error('Error updating favorite count:', error);
    throw error;
  }
};

const getFavoriteCount = async (productId) => {
  try {
    if (!productId) {
      throw new Error('productId is required');
    }

    const countRef = getFavoriteCountRef(productId);
    const countDoc = await getDoc(countRef);
    return countDoc.exists() ? (countDoc.data().count || 0) : 0;
  } catch (error) {
    console.error('Error getting favorite count:', error);
    throw error;
  }
};

const addToFavorites = async (userId, productId, productData) => {
  try {
    if (!userId || !productId || !productData) {
      throw new Error('userId, productId, and productData are required');
    }

    const favoriteRef = getFavoriteRef(userId, productId);
    await setDoc(favoriteRef, {
      ...productData,
      userId,
      productId,
      createdAt: serverTimestamp()
    });

    // 更新收藏計數
    await updateFavoriteCount(productId, true);
    
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

const removeFromFavorites = async (userId, productId) => {
  try {
    if (!userId || !productId) {
      throw new Error('userId and productId are required');
    }

    const favoriteRef = getFavoriteRef(userId, productId);
    await deleteDoc(favoriteRef);

    // 更新收藏計數
    await updateFavoriteCount(productId, false);
    
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

const checkIsFavorite = async (userId, productId) => {
  try {
    if (!userId || !productId) {
      throw new Error('userId and productId are required');
    }

    const favoriteRef = getFavoriteRef(userId, productId);
    const docSnap = await getDoc(favoriteRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    throw error;
  }
};

const getUserFavorites = async (userId) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const favoritesRef = getFavoritesCollection(userId);
    const querySnapshot = await getDocs(favoritesRef);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
  }
};

export { db, auth, storage, ensureAuth, checkFirestoreConnection };
export { 
  addToFavorites,
  removeFromFavorites,
  checkIsFavorite,
  getUserFavorites,
  getFavoriteCount,
  updateFavoriteCount,
  getFavoriteRef,
  getFavoritesCollection
};
export default app;