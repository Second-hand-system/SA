/**
 * 壓縮圖片
 * @param {File} file - 要壓縮的圖片文件
 * @returns {Promise<Blob>} 壓縮後的圖片 Blob
 */
export const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 計算新的尺寸，保持寬高比
        let width = img.width;
        let height = img.height;
        const maxSize = 1200; // 最大尺寸
        
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        
        // 設置 canvas 尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 繪製圖片
        ctx.drawImage(img, 0, 0, width, height);
        
        // 轉換為 blob
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          file.type,
          0.8 // 壓縮質量
        );
      };
      
      img.onerror = (error) => {
        reject(error);
      };
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
  });
}; 