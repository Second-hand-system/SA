<?php
// 資料庫連接設定
$db_host = 'localhost';
$db_name = 'SA';
$db_user = 'root';  // XAMPP 預設用戶名
$db_pass = '';      // XAMPP 預設密碼為空

try {
    // 建立 PDO 連接
    $db = new PDO(
        "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4",
        $db_user,
        $db_pass,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );
} catch (PDOException $e) {
    // 如果連接失敗，顯示錯誤信息
    die("資料庫連接失敗: " . $e->getMessage());
} 