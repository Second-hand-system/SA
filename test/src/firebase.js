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
  serverTimestamp,
  connectFirestoreEmulator
} from "firebase/firestore";
import { getAuth, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

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

let app;
let auth;
let db;
let storage;

try {
  console.log('Initializing Firebase with config:', { ...firebaseConfig, apiKey: '***' });
  
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  console.log('Firebase app initialized successfully');

  // Initialize Auth
  auth = getAuth(app);
  console.log('Firebase Auth initialized successfully');

  // Initialize Firestore
  db = getFirestore(app);
  console.log('Firestore initialized successfully');

  // Initialize Storage
  storage = getStorage(app);
  console.log('Firebase Storage initialized successfully');

  // Add auth state change listener
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User is signed in:', user.uid);
    } else {
      console.log('No user is signed in');
    }
  });

} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// 檢查 Firestore 連接
export const checkFirestoreConnection = async () => {
  try {
    console.log('Testing Firestore connection...');
    
    // 等待用戶認證
    if (!auth.currentUser) {
      console.log('Waiting for authentication...');
      return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
          unsubscribe();
          if (user) {
            console.log('User authenticated:', user.uid);
            resolve(true);
          } else {
            console.log('No user authenticated');
            resolve(false);
          }
        });
      });
    }

    // 嘗試讀取或創建測試文檔
    const testCollectionRef = collection(db, 'test_collection');
    const testDocRef = doc(testCollectionRef, 'test_document');
    
    await setDoc(testDocRef, {
      timestamp: serverTimestamp(),
      userId: auth.currentUser.uid
    });

    console.log('Test document created successfully');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    return false;
  }
};

// 確保用戶已登入
export const ensureAuth = () => {
  return new Promise((resolve, reject) => {
    if (auth.currentUser) {
      console.log('User already authenticated:', auth.currentUser.uid);
      resolve(auth.currentUser);
      return;
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        console.log('User authenticated:', user.uid);
        resolve(user);
      } else {
        console.log('Authentication failed: No user found');
        reject(new Error('請先登入'));
      }
    });
  });
};

// 收藏相關函數
export const getFavoritesCollection = (userId) => {
  return collection(db, 'users', userId, 'favorites');
};

export const getFavoriteRef = (userId, productId) => {
  if (!userId || !productId) {
    console.error('Invalid parameters for getFavoriteRef:', { userId, productId });
    throw new Error('userId and productId are required');
  }
  return doc(db, 'users', userId, 'favorites', productId);
};

// 新增：獲取商品的收藏計數器引用
export const getFavoriteCountRef = (productId) => {
  return doc(db, 'products', productId, 'metadata', 'favorites');
};

// 新增：更新商品的收藏數
export const updateFavoriteCount = async (productId, increment = true) => {
  try {
    const countRef = getFavoriteCountRef(productId);
    const countDoc = await getDoc(countRef);
    
    if (!countDoc.exists()) {
      // 如果文檔不存在，創建它
      await setDoc(countRef, { count: increment ? 1 : 0 });
      return increment ? 1 : 0;
    } else {
      // 如果文檔存在，更新計數
      const currentCount = countDoc.data().count || 0;
      const newCount = increment ? currentCount + 1 : currentCount - 1;
      await setDoc(countRef, { count: Math.max(0, newCount) });
      return Math.max(0, newCount);
    }
  } catch (error) {
    console.error('Error updating favorite count:', error);
    throw error;
  }
};

// 新增：獲取商品的收藏數
export const getFavoriteCount = async (productId) => {
  try {
    const countRef = getFavoriteCountRef(productId);
    const countDoc = await getDoc(countRef);
    return countDoc.exists() ? (countDoc.data().count || 0) : 0;
  } catch (error) {
    console.error('Error getting favorite count:', error);
    return 0;
  }
};

export const addToFavorites = async (userId, productId, productData) => {
  try {
    console.log('Adding to favorites:', { userId, productId, productData });
    const favoriteRef = getFavoriteRef(userId, productId);
    const favoriteData = {
      productId,
      productData,
      createdAt: serverTimestamp()
    };
    console.log('Favorite data to be saved:', favoriteData);
    await setDoc(favoriteRef, favoriteData);
    console.log('Successfully added to favorites');
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
};

export const removeFromFavorites = async (userId, productId) => {
  try {
    console.log('Removing from favorites:', { userId, productId });
    const favoriteRef = getFavoriteRef(userId, productId);
    await deleteDoc(favoriteRef);
    console.log('Successfully removed from favorites');
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw error;
  }
};

export const checkIsFavorite = async (userId, productId) => {
  try {
    console.log('Checking favorite status:', { userId, productId });
    const favoriteRef = getFavoriteRef(userId, productId);
    const docSnap = await getDoc(favoriteRef);
    const exists = docSnap.exists();
    console.log('Favorite status:', exists);
    return exists;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

export const getUserFavorites = async (userId) => {
  try {
    console.log('Getting user favorites for:', userId);
    const favoritesRef = getFavoritesCollection(userId);
    const querySnapshot = await getDocs(favoritesRef);
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

export { app, auth, db, storage };
export default app;