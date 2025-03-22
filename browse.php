<?php
require_once 'config/database.php';
require_once 'products/Search.php';

class Search {
    private $db;
    
    public function __construct($connection) {
        $this->db = $connection;
    }
    
    public function searchProducts($params) {
        // 實現代碼
    }
}
// 初始化搜尋功能
$search = new Search($db);

// 獲取搜尋參數
$keyword = $_GET['keyword'] ?? '';
$category = $_GET['category'] ?? '';

// 獲取商品列表
try {
    $products = $search->searchProducts([
        'keyword' => $keyword,
        'category' => $category,
        'limit' => 20
    ]);
} catch (Exception $e) {
    error_log("搜尋商品時發生錯誤: " . $e->getMessage());
    $products = [];
}

// 獲取商品分類
$categories = [
    '書籍教材',
    '生活用品',
    '電子產品',
    '傢俱寢具',
    '衣物配件',
    '其他'
];

$pageTitle = "瀏覽商品 - 輔大二手交易平台";
require_once 'header.php';
?>

<div class="container mt-4">
    <!-- 分類篩選 -->
    <div class="row mb-4">
        <div class="col-12">
            <h2>商品分類</h2>
            <div class="d-flex flex-wrap gap-2">
                <a href="browse.php" class="btn <?= empty($category) ? 'btn-primary' : 'btn-outline-secondary' ?>">
                    全部
                </a>
                <?php foreach ($categories as $cat): ?>
                    <a href="browse.php?category=<?= urlencode($cat) ?>" 
                       class="btn <?= $category === $cat ? 'btn-primary' : 'btn-outline-secondary' ?>">
                        <?= htmlspecialchars($cat) ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- 搜尋結果 -->
    <div class="row">
        <?php if (!empty($keyword) || !empty($category)): ?>
            <div class="col-12 mb-4">
                <h3>搜尋結果</h3>
                <?php if (!empty($keyword)): ?>
                    <p>關鍵字：<?= htmlspecialchars($keyword) ?></p>
                <?php endif; ?>
                <?php if (!empty($category)): ?>
                    <p>分類：<?= htmlspecialchars($category) ?></p>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <?php if (is_array($products) && !empty($products)): ?>
    <?php foreach ($products as $product): ?>
        <div class="col-md-3 mb-4">
            <div class="card h-100">
                <img src="<?= htmlspecialchars($product['image_url'] ?? 'assets/images/no-image.jpg') ?>" 
                     class="card-img-top" alt="商品圖片">
                <div class="card-body">
                    <h5 class="card-title"><?= htmlspecialchars($product['title']) ?></h5>
                    <p class="card-text">
                        價格: NT$ <?= number_format($product['current_price'], 0) ?>
                    </p>
                    <p class="card-text">
                        <small class="text-muted">
                            狀況: <?= htmlspecialchars($product['condition_status']) ?>
                        </small>
                    </p>
                    <a href="products/detail.php?id=<?= $product['id'] ?>" 
                       class="btn btn-primary">查看詳情</a>
                </div>
            </div>
        </div>
    <?php endforeach; ?>
<?php else: ?>
    <div class="col-12">
        <div class="alert alert-info">
            沒有找到符合條件的商品
        </div>
    </div>
<?php endif; ?>
    </div>
</div>

<?php require_once 'footer.php'; ?>