<?php
session_start();

// 檢查用戶是否登入
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// 設置頁面標題
$pageTitle = '我的收藏';

// 包含頭部
include 'header.php';

// 載入必要的文件
require_once 'database.php';
require_once 'favorites.php';

try {
    // 初始化收藏類
    $favorite = new $favorites($db, $_SESSION['user_id']);
    
    // 獲取用戶的收藏商品
    $favorites = $favorite->getUserFavorites();
    if ($favorites === false) {
        throw new Exception('載入收藏清單時發生錯誤');
    }
} catch (Exception $e) {
    error_log($e->getMessage());
    $error = '載入收藏清單時發生錯誤，請稍後再試。';
}
?>

<div class="container my-4">
    <h2>我的收藏</h2>
    
    <?php if (isset($error)): ?>
        <div class="alert alert-danger"><?= $error ?></div>
    <?php elseif (empty($favorites)): ?>
        <div class="alert alert-info">
            <h4>您還沒有收藏任何商品</h4>
            <p>瀏覽商品並點擊愛心圖示來收藏感興趣的商品。</p>
            <a href="browse.php" class="btn btn-primary mt-3">瀏覽商品</a>
        </div>
    <?php else: ?>
        <div class="row">
            <?php foreach ($favorites as $product): ?>
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <?php if (!empty($product['image_url'])): ?>
                            <img src="<?= htmlspecialchars($product['image_url']) ?>" 
                                 class="card-img-top" alt="<?= htmlspecialchars($product['title']) ?>的圖片">
                        <?php else: ?>
                            <img src="assets/images/no-image.jpg" 
                                 class="card-img-top" alt="無商品圖片">
                        <?php endif; ?>
                        <div class="card-body">
                            <h5 class="card-title"><?= htmlspecialchars($product['title']) ?></h5>
                            <p class="card-text">
                                賣家：<?= htmlspecialchars($product['seller_name']) ?>
                            </p>
                            <p class="card-text">
                                價格：NT$ <?= number_format($product['price'], 0) ?>
                            </p>
                            <p class="card-text">
                                <small class="text-muted">
                                    狀況：<?= htmlspecialchars(getConditionText($product['condition'])) ?>
                                </small>
                            </p>
                            <p class="card-text">
                                <small class="text-muted">
                                    收藏時間：<?= date('Y/m/d H:i', strtotime($product['favorited_at'])) ?>
                                </small>
                            </p>
                            <div class="d-flex justify-content-between align-items-center">
                                <a href="product.php?id=<?= $product['id'] ?>" 
                                   class="btn btn-primary">查看詳情</a>
                                <button type="button" 
                                        class="btn btn-danger favorite-btn"
                                        data-product-id="<?= $product['id'] ?>"
                                        onclick="toggleFavorite(this)">
                                    <i class="bi bi-heart-fill"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<!-- 添加 Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.7.2/font/bootstrap-icons.css">

<!-- 添加收藏功能的 JavaScript -->
<script src="favorite.js"></script>
<script>
// 為所有收藏按鈕添加事件監聽器
document.querySelectorAll('.favorite-btn').forEach(button => {
    button.onclick = function() {
        toggleFavorite(this, true); // true 表示這是收藏列表頁面
    };
});
</script>

<?php
// 輔助函數：將商品狀態轉換為中文
function getConditionText($condition) {
    $conditions = [
        'new' => '全新',
        'like_new' => '近全新',
        'good' => '良好',
        'fair' => '普通'
    ];
    return $conditions[$condition] ?? '未知';
}

include 'footer.php';
?>

