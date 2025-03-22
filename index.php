<?php

// 設置頁面標題
$pageTitle = '輔大二手交易平台 - 首頁';

// 引入 header.php
include 'header.php';

// 載入數據庫連接
require_once 'database.php';

// 這裡可以添加首頁特定的代碼，例如獲取推薦商品等
try {
    // 獲取最新商品
    $stmt = $pdo->prepare("SELECT * FROM products WHERE status = 'active' ORDER BY created_at DESC LIMIT 6");
    $stmt->execute();
    $latestProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 獲取熱門商品（根據瀏覽次數）
    $stmt = $pdo->prepare("SELECT * FROM products WHERE status = 'active' ORDER BY views DESC LIMIT 6");
    $stmt->execute();
    $popularProducts = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    // 處理錯誤
    $error = '無法載入商品數據';
}
?>

<!-- 首頁內容 -->
<div class="container my-4">
    <!-- 歡迎信息 -->
    <div class="jumbotron bg-light p-5 mb-4 rounded">
        <h1 class="display-4">歡迎來到輔大二手交易平台</h1>
        <p class="lead">在這裡，你可以買賣二手商品，參與競標，與其他輔大學生交流。</p>
        <hr class="my-4">
        <p>開始瀏覽或刊登你的商品吧！</p>
        <a class="btn btn-primary btn-lg" href="browse.php" role="button">瀏覽商品</a>
        <?php if (isset($_SESSION['user_id'])): ?>
            <a class="btn btn-success btn-lg" href="create.php" role="button">刊登商品</a>
        <?php else: ?>
            <a class="btn btn-outline-primary btn-lg" href="login.php" role="button">登入後刊登</a>
        <?php endif; ?>
    </div>

    
    <!-- 最新商品 -->
    <?php if (!isset($error) && !empty($latestProducts)): ?>
        <h2 class="mb-4">最新上架</h2>
        <div class="row">
            <?php foreach ($latestProducts as $product): ?>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <?php if (!empty($product['image_url'])): ?>
                            <img src="<?= htmlspecialchars($product['image_url']) ?>" class="card-img-top" alt="<?= htmlspecialchars($product['title']) ?>">
                        <?php else: ?>
                            <div class="no-image">無圖片</div>
                        <?php endif; ?>
                        <div class="card-body">
                            <h5 class="card-title"><?= htmlspecialchars($product['title']) ?></h5>
                            <p class="card-text">NT$ <?= htmlspecialchars(number_format($product['price'])) ?></p>
                            <a href="product.php?id=<?= $product['id'] ?>" class="btn btn-primary">查看詳情</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <!-- 熱門商品 -->
    <?php if (!isset($error) && !empty($popularProducts)): ?>
        <h2 class="mb-4 mt-5">熱門商品</h2>
        <div class="row">
            <?php foreach ($popularProducts as $product): ?>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <?php if (!empty($product['image_url'])): ?>
                            <img src="<?= htmlspecialchars($product['image_url']) ?>" class="card-img-top" alt="<?= htmlspecialchars($product['title']) ?>">
                        <?php else: ?>
                            <div class="no-image">無圖片</div>
                        <?php endif; ?>
                        <div class="card-body">
                            <h5 class="card-title"><?= htmlspecialchars($product['title']) ?></h5>
                            <p class="card-text">NT$ <?= htmlspecialchars(number_format($product['price'])) ?></p>
                            <a href="product.php?id=<?= $product['id'] ?>" class="btn btn-primary">查看詳情</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<?php include 'footer.php'; ?>