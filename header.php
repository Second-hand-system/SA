<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= isset($pageTitle) ? $pageTitle : '輔大二手交易平台' ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
 
    
    <!-- 導航欄 -->
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
        <div class="container">
            <a class="navbar-brand" href="index.php">輔大二手交易平台</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="browse.php">瀏覽商品</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="auction.php">競標專區</a>
                    </li>
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <li class="nav-item">
                            <a class="nav-link" href="create.php">刊登商品</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="favorites.php">我的收藏</a>
                        </li>
                    <?php endif; ?>
                </ul>
                <!-- 搜尋列 -->
                <form action="search_results.php" method="GET" class="d-flex me-3">
                    <input type="text" name="keyword" class="form-control me-2" 
                           placeholder="搜尋商品..." 
                           value="<?= isset($_GET['keyword']) ? htmlspecialchars($_GET['keyword']) : '' ?>">
                    <button type="submit" class="btn btn-outline-primary">搜尋</button>
                </form>
                <div class="d-flex">
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <a href="inbox.php" class="btn btn-outline-primary me-2">訊息</a>
                        <a href="profile.php" class="btn btn-outline-success me-2">個人資料</a>
                        <a href="logout.php" class="btn btn-outline-danger">登出</a>
                    <?php else: ?>
                        <a href="login.php" class="btn btn-outline-primary me-2">登入</a>
                        <a href="register.php" class="btn btn-primary">註冊</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>