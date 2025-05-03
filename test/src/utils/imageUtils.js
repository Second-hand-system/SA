/**
 * 將 File 對象轉換為 base64 字符串
 */
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * 將 base64 字符串轉換為 Blob 對象
 */
const base64ToBlob = async (base64) => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return blob;
};

/**
 * 壓縮圖片
 * @param {File} file - 要壓縮的圖片文件
 * @returns {Promise<File>} 壓縮後的圖片 File
 */
const compressImage = async (file) => {
  try {
    // 轉換為 Base64
    const base64 = await fileToBase64(file);
    
    // 創建圖片對象
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = base64;
    });

    // 計算新的尺寸
    let width = img.width;
    let height = img.height;
    const maxSize = 1024;

    if (width > height && width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    } else if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }

    // 創建 canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // 轉換為 Blob
    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
    const compressedBlob = await base64ToBlob(compressedBase64);
    
    // 創建新的 File 對象
    return new File([compressedBlob], file.name, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('圖片壓縮失敗:', error);
    throw error;
  }
};

export { compressImage, fileToBase64, base64ToBlob }; 