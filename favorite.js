/**
 * 切換收藏狀態
 * @param {HTMLElement} button - 收藏按鈕元素
 * @param {boolean} isListPage - 是否在收藏列表頁面
 */
function toggleFavorite(button, isListPage = false) {
    const productId = button.getAttribute('data-product-id');
    const isFavorited = button.classList.contains('btn-danger');
    
    fetch('toggle_favorite.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `product_id=${productId}&action=${isFavorited ? 'remove' : 'add'}`
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            if (isListPage) {
                // 在收藏列表頁面，移除整個商品卡片
                const card = button.closest('.col-md-4');
                card.style.transition = 'opacity 0.3s ease';
                card.style.opacity = '0';
                setTimeout(() => {
                    card.remove();
                    // 檢查是否還有收藏商品
                    if (document.querySelectorAll('.card').length === 0) {
                        location.reload(); // 重新載入頁面顯示空狀態
                    }
                }, 300);
            } else {
                // 在其他頁面，切換按鈕樣式
                if (isFavorited) {
                    button.classList.replace('btn-danger', 'btn-outline-danger');
                    button.querySelector('i').classList.replace('bi-heart-fill', 'bi-heart');
                } else {
                    button.classList.replace('btn-outline-danger', 'btn-danger');
                    button.querySelector('i').classList.replace('bi-heart', 'bi-heart-fill');
                }
            }
        } else {
            alert(data.message || '操作失敗，請稍後再試');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('操作失敗，請稍後再試');
    });
} 