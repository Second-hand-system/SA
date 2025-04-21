// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, collection, setDoc } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCnRJrHqH5FcWcP9FS0ZqhTxLdWKjAxbtU",
  authDomain: "sa-second-hand-system.firebaseapp.com",
  projectId: "sa-second-hand-system",
  storageBucket: "sa-second-hand-system.firebasestorage.app",
  messagingSenderId: "476098508687",
  appId: "1:476098508687:web:b96e14ac565f9eb3b2fdfa",
  measurementId: "G-7Q5SH5YBPP"
};

// Initialize Firebase
let app;
let db;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // 監聽身份驗證狀態變化
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.uid);
      // 確保用戶文檔存在
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        email: user.email,
        lastLogin: new Date().toISOString()
      }, { merge: true }).catch(error => {
        console.error('Error updating user document:', error);
      });
    } else {
      console.log('User is signed out');
    }
  });
  
  // 如果需要使用Firebase本地模拟器（如果运行在开发环境中）
  if (window.location.hostname === "localhost") {
    try {
      // 仅在开发环境中使用模拟器
      // connectFirestoreEmulator(db, "localhost", 8080);
      // connectAuthEmulator(auth, "http://localhost:9099");
      console.log("Firebase emulators are available but not connected");
    } catch (error) {
      console.warn("Firebase emulators setup error:", error);
    }
  }
  
  // 啟用離線持久化
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code == 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
}

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

// 獲取用戶的收藏參考
const getUserFavoritesRef = (userId) => {
  return collection(db, 'users', userId, 'favorites');
};

// 獲取特定收藏商品的參考
const getFavoriteRef = (userId, productId) => {
  return doc(db, 'users', userId, 'favorites', productId);
};

// 檢查商品是否被收藏
const checkIsFavorite = async (userId, productId) => {
  if (!userId || !productId) return false;
  try {
    const favoriteDoc = await getDoc(getFavoriteRef(userId, productId));
    return favoriteDoc.exists();
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// 初始化 Storage 的 CORS 設置
const initializeStorage = async () => {
  try {
    // 在這裡可以添加其他 Storage 相關的初始化設置
    console.log('Storage initialized successfully');
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};

// 執行初始化
initializeStorage();

// 檢查 Firestore 連接
const checkFirestoreConnection = async () => {
  try {
    // Using v9 modular syntax instead of v8 syntax
    const testDocRef = doc(db, '_test_', '_test_');
    const testDocSnap = await getDoc(testDocRef);
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
  ensureAuth, 
  checkFirestoreConnection,
  getUserFavoritesRef,
  getFavoriteRef,
  checkIsFavorite 
};
export default app;