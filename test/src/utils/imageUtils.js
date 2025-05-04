/**
 * 將文件轉換為 base64 字符串
 * @param {File} file - 要轉換的文件
 * @returns {Promise<string>} base64 字符串
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
 * 壓縮圖片
 * @param {File} file - 要壓縮的圖片文件
 * @returns {Promise<File>} 壓縮後的圖片 File
 */
const compressImage = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // 如果圖片太大，進行縮放
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';  // 設置白色背景
          ctx.fillRect(0, 0, width, height);  // 填充白色背景
          ctx.drawImage(img, 0, 0, width, height);
          
          // 轉換為 Blob
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7); // 使用 JPEG 格式，70% 質量
        };
        img.onerror = (error) => {
          console.error('Error loading image:', error);
          reject(new Error('圖片載入失敗'));
        };
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error('讀取文件失敗'));
      };
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('圖片壓縮失敗');
  }
};

export { compressImage, fileToBase64 }; 