import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { compressImage } from '../utils/imageUtils';

const handleImageChange = async (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length > 5) {
    setError('最多只能上傳5張圖片');
    return;
  }

  try {
    setLoading(true);
    const imageUrls = [];
    
    for (const file of files) {
      // 驗證文件類型
      if (!file.type.startsWith('image/')) {
        setError('請上傳圖片文件');
        continue;
      }
      
      // 驗證文件大小 (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('圖片大小不能超過2MB');
        continue;
      }

      // 壓縮圖片
      const compressedFile = await compressImage(file);
      
      // 上傳到 Firebase Storage
      const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, compressedFile);
      
      // 獲取下載URL
      const downloadURL = await getDownloadURL(storageRef);
      imageUrls.push(downloadURL);
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls]
    }));
  } catch (error) {
    console.error('圖片上傳失敗:', error);
    setError('圖片上傳失敗，請重試');
  } finally {
    setLoading(false);
  }
}; 