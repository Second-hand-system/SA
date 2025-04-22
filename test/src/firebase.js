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
  getDocs
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
const checkFirestoreConnection = async () => {
  try {
    const testDocRef = doc(db, '_test_', '_test_');
    await getDoc(testDocRef);
    console.log('Firestore connection successful');
    return true;
  } catch (error) {
    console.error('Firestore connection failed:', error);
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

// 獲取收藏集合
export const getFavoritesCollection = () => {
  return collection(db, 'favorites');
};

// 獲取特定用戶的收藏參考
export const getFavoriteRef = (userId, productId) => {
  if (!userId || !productId) {
    throw new Error('userId and productId are required');
  }
  return doc(db, 'favorites', `${userId}_${productId}`);
};

// 檢查商品是否已被收藏
export const checkIsFavorite = async (userId, productId) => {
  if (!userId || !productId) {
    console.log('Missing userId or productId');
    return false;
  }
  
  try {
    const favoriteRef = getFavoriteRef(userId, productId);
    const favoriteDoc = await getDoc(favoriteRef);
    const exists = favoriteDoc.exists();
    console.log(`Favorite status for product ${productId}:`, exists);
    return exists;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

// 獲取用戶的所有收藏
export const getUserFavorites = async (userId) => {
  if (!userId) {
    throw new Error('userId is required');
  }

  try {
    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(favoritesQuery);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting user favorites:', error);
    throw error;
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