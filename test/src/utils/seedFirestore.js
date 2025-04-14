import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import app from '../firebase';

// Initialize Firestore
const db = getFirestore(app);

// Sample product data
const sampleProducts = [
  {
    title: '全新 MacBook Pro',
    price: 45000,
    description: 'M2晶片、16GB RAM、512GB SSD、Space Gray，僅開箱未使用，保固內。',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=300',
    condition: '全新',
    sellerName: 'Emma',
    sellerEmail: 'emma@example.com',
    category: '電子產品',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  },
  {
    title: '經濟學原理課本',
    price: 350,
    description: '經濟系必修課本，曼昆著，只使用一學期，無筆記，九成新。',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=300',
    condition: '良好',
    sellerName: 'Jason',
    sellerEmail: 'jason@example.com',
    category: '書籍教材',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  },
  {
    title: '腳踏車',
    price: 2500,
    description: 'Giant捷安特變速單車，配備齊全，使用約一年，有小刮痕但功能正常。',
    image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=300',
    condition: '二手',
    sellerName: 'Mark',
    sellerEmail: 'mark@example.com',
    category: '交通工具',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  },
  {
    title: '輔大限量T恤',
    price: 450,
    description: '輔大60週年紀念限量T恤，尺寸L，僅穿過一次，全新狀態。',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=300',
    condition: '全新',
    sellerName: 'Linda',
    sellerEmail: 'linda@example.com',
    category: '服裝衣物',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  },
  {
    title: 'JBL 藍牙音響',
    price: 1200,
    description: 'JBL Flip 5藍牙喇叭，電池續航力強，音質優良，使用半年。',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?q=80&w=300',
    condition: '二手',
    sellerName: 'David',
    sellerEmail: 'david@example.com',
    category: '電子產品',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  },
  {
    title: '桌遊組合',
    price: 800,
    description: '桌遊三件組：矮人礦坑、妙語說書人、狼人殺，適合宿舍派對使用。',
    image: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?q=80&w=300',
    condition: '良好',
    sellerName: 'Sophia',
    sellerEmail: 'sophia@example.com',
    category: '運動用品',
    location: '輔大校園',
    createdAt: serverTimestamp(),
  }
];

// Function to populate Firestore
export const seedFirestore = async () => {
  try {
    console.log('開始添加商品到 Firestore...');
    
    // Reference to the products collection
    const productsCollection = collection(db, 'products');
    
    // Add each product to Firestore
    for (const product of sampleProducts) {
      const productData = {
        ...product,
        createdAt: serverTimestamp()  // 確保每個商品都有 createdAt 字段
      };
      await addDoc(productsCollection, productData);
      console.log(`已添加商品: ${product.title}`);
    }
    
    console.log('成功添加所有商品到 Firestore！');
    return true;
  } catch (error) {
    console.error('添加商品到 Firestore 時發生錯誤:', error);
    return false;
  }
};

// Make function available globally for easy access from console
window.seedFirestore = seedFirestore;

export default seedFirestore; 