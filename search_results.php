<?php
// 設置頁面標題
$pageTitle = '搜尋結果';

// 包含頭部
include 'header.php';

// 檢查是否提供了關鍵字
$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
$category = isset($_GET['category']) ? trim($_GET['category']) : '';

// 如果沒有關鍵字且沒有分類，重定向到瀏覽頁面
if (empty($keyword) && empty($category)) {
    header('Location: browse.php');
    exit;
}

// 載入資料庫連接
require_once 'database.php';

try {
    // 準備搜尋查詢
    $query = "SELECT p.*, u.full_name as seller_name 
              FROM products p
              JOIN users u ON p.seller_id = u.id
              WHERE p.status = 'active'";
    
    $params = [];
    
    // 添加關鍵字搜尋條件
    if (!empty($keyword)) {
        $query .= " AND (p.title LIKE :keyword OR p.description LIKE :keyword)";
        $params[':keyword'] = '%' . $keyword . '%';
    }
    
    // 添加分類過濾條件
    if (!empty($category)) {
        $query .= " AND p.category = :category";
        $params[':category'] = $category;
    }
    
    // 添加排序
    $query .= " ORDER BY p.created_at DESC";
    
    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value, PDO::PARAM_STR);
    }
    $stmt->execute();
    
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    error_log($e->getMessage());
    $error = '搜尋時發生錯誤，請稍後再試。';
}

// 獲取商品分類列表（用於側邊欄）
$categories = [
    '書籍教材',
    '生活用品',
    '電子產品',
    '傢俱寢具',
    '衣物配件',
    '其他'
];
?>

<div class="container my-4">
    <div class="row">
        <!-- 側邊欄：分類過濾 -->
        <div class="col-md-3">
            <div class="card mb-4">
                <div class="card-header">
                    <h5 class="card-title mb-0">商品分類</h5>
                </div>
                <div class="card-body">
                    <div class="list-group">
                        <a href="search_results.php<?= !empty($keyword) ? '?keyword=' . urlencode($keyword) : '' ?>" 
                           class="list-group-item list-group-item-action <?= empty($category) ? 'active' : '' ?>">
                            全部商品
                        </a>
                        <?php foreach ($categories as $cat): ?>
                            <a href="search_results.php?<?= !empty($keyword) ? 'keyword=' . urlencode($keyword) . '&' : '' ?>category=<?= urlencode($cat) ?>" 
                               class="list-group-item list-group-item-action <?= $category === $cat ? 'active' : '' ?>">
                                <?= htmlspecialchars($cat) ?>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- 主要內容：搜尋結果 -->
        <div class="col-md-9">
            <h2>
                <?php if (!empty($keyword)): ?>
                    搜尋結果：「<?= htmlspecialchars($keyword) ?>」
                    <?= !empty($category) ? ' 在 ' . htmlspecialchars($category) . ' 分類中' : '' ?>
                <?php else: ?>
                    <?= htmlspecialchars($category) ?> 分類商品
                <?php endif; ?>
            </h2>
            
            <?php if (isset($error)): ?>
                <div class="alert alert-danger"><?= $error ?></div>
            <?php elseif (empty($products)): ?>
                <div class="alert alert-info">
                    <h4>
                        <?php if (!empty($keyword)): ?>
                            沒有找到符合「<?= htmlspecialchars($keyword) ?>」的商品
                            <?= !empty($category) ? '在 ' . htmlspecialchars($category) . ' 分類中' : '' ?>
                        <?php else: ?>
                            <?= htmlspecialchars($category) ?> 分類中目前沒有商品
                        <?php endif; ?>
                    </h4>
                    <p>建議：</p>
                    <ul>
                        <li>檢查關鍵字是否正確</li>
                        <li>嘗試使用其他相關關鍵字</li>
                        <li>使用較短或較常見的關鍵字</li>
                        <li>嘗試移除分類過濾以查看更多結果</li>
                    </ul>
                </div>
            <?php else: ?>
                <p class="mb-4">找到 <?= count($products) ?> 個相關商品</p>
                
                <div class="row">
                    <?php foreach ($products as $product): ?>
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
                                    <a href="product.php?id=<?= $product['id'] ?>" 
                                       class="btn btn-primary">查看詳情</a>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

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