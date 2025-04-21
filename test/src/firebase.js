// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, collection, connectFirestoreEmulator } from "firebase/firestore";
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
  
  // 如果需要使用Firebase本地模拟器（如果运行在开发环境中）
  if (window.location.hostname === "localhost") {
    try {
      // 仅在开发环境中使用模拟器
      // connectFirestoreEmulator(db, "localhost", 8080);
      // connectAuthEmulator(auth, "http://localhost:9099");
      console.log("Firebase emulators are available for use if needed");
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

export { db, auth, ensureAuth, checkFirestoreConnection };
export default app;