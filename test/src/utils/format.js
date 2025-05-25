/**
 * 格式化貨幣金額
 * @param {number} amount - 要格式化的金額
 * @returns {string} 格式化後的金額字串
 */
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return 'NT$ 0';
  
  // 確保輸入是數字
  const numAmount = Number(amount);
  if (isNaN(numAmount)) return 'NT$ 0';
  
  // 使用 Intl.NumberFormat 來格式化金額
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numAmount);
}; 