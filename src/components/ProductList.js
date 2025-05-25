import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const ProductList = () => {
  const { products, loading, error } = useSelector((state) => state.product);
  const navigate = useNavigate();

  if (loading) {
    return <div>載入中...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!products || products.length === 0) {
    return <div>沒有找到商品</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map((product) => (
        <div
          key={product.id}
          className="border rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <p className="text-gray-600 mt-2">{product.description}</p>
          <p className="text-lg font-bold mt-2">NT$ {product.price}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductList; 