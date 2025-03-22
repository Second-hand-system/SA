<?php
session_start();
require_once 'database.php';

class Auth {
    private $db;
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    public function login($email, $password) {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => '請使用有效的學校信箱'];
        }
        
        // 驗證是否為學校域名
        if (!strpos($email, '@mail.fju.edu.tw')) {
            return ['success' => false, 'message' => '請使用輔大校園信箱'];
        }
        
        $stmt = $this->db->prepare("SELECT * FROM users WHERE school_email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['email'] = $user['school_email'];
            return ['success' => true, 'message' => '登入成功'];
        }
        
        return ['success' => false, 'message' => '帳號或密碼錯誤'];
    }
}
?> 