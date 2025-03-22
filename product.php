<?php
class Product {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function create($data) {
        $sql = "INSERT INTO products (seller_id, title, description, category, 
                condition_status, starting_price, auction_end_time) 
                VALUES (?, ?, ?, ?, ?, ?, ?)";
        
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['seller_id'],
            $data['title'],
            $data['description'],
            $data['category'],
            $data['condition_status'],
            $data['starting_price'],
            $data['auction_end_time']
        ]);
    }
    
    public function update($id, $data) {
        $sql = "UPDATE products SET 
                title = ?, 
                description = ?, 
                category = ?,
                condition_status = ?,
                current_price = ?,
                status = ?
                WHERE id = ? AND seller_id = ?";
                
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            $data['title'],
            $data['description'],
            $data['category'],
            $data['condition_status'],
            $data['current_price'],
            $data['status'],
            $id,
            $data['seller_id']
        ]);
    }
}
?> 