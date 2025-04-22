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

// 確保用戶已登入
const ensureAuth = () => {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
    } else {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        if (user) {
          resolve(user);
        } else {
          reject(new Error('請先登入'));
        }
      });
    }
  });
};

// 獲取收藏文檔參考
const getFavoriteRef = (userId, productId) => {
  return doc(db, 'favorites', `${userId}_${productId}`);
};

// 檢查商品是否被收藏
const checkIsFavorite = async (userId, productId) => {
  if (!userId || !productId) return false;
  try {
    const favoriteRef = getFavoriteRef(userId, productId);
    const favoriteDoc = await getDoc(favoriteRef);
    return favoriteDoc.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// 檢查 Firestore 連接
const checkFirestoreConnection = async () => {
  try {
    const testDocRef = doc(db, '_test_', '_test_');
    await getDoc(testDocRef);
    console.log('Firestore connection test successful');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
};

export { 
  db, 
  auth, 
  storage, 
  ensureAuth, 
  checkFirestoreConnection,
  getFavoriteRef,
  checkIsFavorite 
};
export default app;