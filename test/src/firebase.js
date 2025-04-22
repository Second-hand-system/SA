// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  setDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnRJrHqH5FcWcP9FS0ZqhTxLdWKjAxbtU",
  authDomain: "sa-second-hand-system.firebaseapp.com",
  projectId: "sa-second-hand-system",
  storageBucket: "sa-second-hand-system.appspot.com",
  messagingSenderId: "476098508687",
  appId: "1:476098508687:web:b96e14ac565f9eb3b2fdfa",
  measurementId: "G-7Q5SH5YBPP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 檢查 Firestore 連接
export const checkFirestoreConnection = async () => {
  try {
    const testDoc = await getDoc(doc(db, 'test', 'test'));
    console.log('Firestore connection test:', testDoc ? 'success' : 'failed');
    return true;
  } catch (error) {
    console.error('Firestore connection error:', error);
    return false;
  }
};

// 確保用戶已登入
const ensureAuth = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        console.log('User is authenticated:', user.uid);
        resolve(user);
      } else {
        console.log('No user authenticated');
        reject(new Error('請先登入'));
      }
    });
  });
};

// 收藏相關函數
export const getFavoritesCollection = () => {
  return collection(db, 'favorites');
};

export const getFavoriteRef = (userId, productId) => {
  return doc(db, 'favorites', `${userId}_${productId}`);
};

export const addToFavorites = async (userId, productId, productData) => {
  try {
    const favoriteRef = getFavoriteRef(userId, productId);
    await setDoc(favoriteRef, {
      userId,
      productId,
      productData,
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId, productId) => {
  try {
    const favoriteRef = getFavoriteRef(userId, productId);
    await deleteDoc(favoriteRef);
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

export const checkIsFavorite = async (userId, productId) => {
  try {
    const favoriteRef = getFavoriteRef(userId, productId);
    const docSnap = await getDoc(favoriteRef);
    return docSnap.exists();
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

// 獲取用戶的所有收藏
export const getUserFavorites = async (userId) => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return [];
  }
};

export { 
  app,
  db, 
  auth, 
  storage, 
  ensureAuth, 
  checkFirestoreConnection,
  setDoc,
  deleteDoc
};

export default app;