<?php
class Auction {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function getProduct($productId) {
        $stmt = $this->db->prepare("SELECT * FROM products WHERE id = ?");
        $stmt->execute([$productId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);  // 返回商品資料或 null
    }

    public function placeBid($productId, $bidderId, $amount) {
        // 檢查商品是否存在且未結束
        $product = $this->getProduct($productId);
        if (!$product || $product['status'] !== 'active') {
            return ['success' => false, 'message' => '商品已不可競標'];
        }
        
        // 檢查出價是否高於目前價格
        if ($amount <= $product['current_price']) {
            return ['success' => false, 'message' => '出價必須高於目前價格'];
        }

        // 驗證 productId 和 bidderId 是否有效
        if (!is_numeric($productId) || !is_numeric($bidderId)) {
            return ['success' => false, 'message' => '無效的商品或競標者 ID'];
        }

        $this->db->beginTransaction();
        
        try {
            // 記錄競標
            $stmt = $this->db->prepare("INSERT INTO bids (product_id, bidder_id, bid_amount) VALUES (?, ?, ?)");
            $stmt->execute([$productId, $bidderId, $amount]);
            
            // 更新商品當前價格
            $stmt = $this->db->prepare("UPDATE products SET current_price = ? WHERE id = ?");
            $stmt->execute([$amount, $productId]);
            
            $this->db->commit();
            return ['success' => true, 'message' => '競標成功'];
        } catch (Exception $e) {
            $this->db->rollBack();
            return ['success' => false, 'message' => '競標失敗，請稍後再試'];
        }
    }
}
?>
