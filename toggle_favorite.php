<?php
session_start();
require_once 'database.php';
require_once 'classes/Favorite.php';

// 檢查用戶是否登入
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => '請先登入']);
    exit;
}

// 檢查必要參數
if (!isset($_POST['product_id']) || !isset($_POST['action'])) {
    echo json_encode(['success' => false, 'message' => '參數錯誤']);
    exit;
}

$favorite = new $favorites($db, $_SESSION['user_id']);
$action = $_POST['action'];
$product_id = $_POST['product_id'];

// 執行收藏操作
$result = ($action === 'add') ? 
    $favorite->add($product_id) : 
    $favorite->remove($product_id);

echo json_encode($result); 