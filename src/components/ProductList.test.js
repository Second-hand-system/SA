import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import ProductList from './ProductList';
import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../store/productSlice';

// 創建一個測試用的 store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      product: productReducer
    },
    preloadedState: {
      product: {
        products: [],
        loading: false,
        error: null,
        ...initialState
      }
    }
  });
};

// 創建一個測試用的 wrapper 組件
const renderWithProviders = (ui, { initialState, ...renderOptions } = {}) => {
  const store = createTestStore(initialState);
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  );
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

describe('ProductList Component', () => {
  test('renders loading state', () => {
    renderWithProviders(<ProductList />, {
      initialState: { loading: true }
    });
    expect(screen.getByText(/載入中/)).toBeInTheDocument();
  });

  test('renders error state', () => {
    const errorMessage = '測試錯誤訊息';
    renderWithProviders(<ProductList />, {
      initialState: { error: errorMessage }
    });
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  test('renders empty state', () => {
    renderWithProviders(<ProductList />, {
      initialState: { products: [] }
    });
    expect(screen.getByText(/沒有找到商品/)).toBeInTheDocument();
  });

  test('renders product list', () => {
    const mockProducts = [
      {
        id: '1',
        name: '測試商品1',
        price: 100,
        description: '測試描述1',
        imageUrl: 'test1.jpg'
      },
      {
        id: '2',
        name: '測試商品2',
        price: 200,
        description: '測試描述2',
        imageUrl: 'test2.jpg'
      }
    ];

    renderWithProviders(<ProductList />, {
      initialState: { products: mockProducts }
    });

    expect(screen.getByText('測試商品1')).toBeInTheDocument();
    expect(screen.getByText('測試商品2')).toBeInTheDocument();
    expect(screen.getByText('NT$ 100')).toBeInTheDocument();
    expect(screen.getByText('NT$ 200')).toBeInTheDocument();
  });

  test('handles product click', () => {
    const mockProducts = [{
      id: '1',
      name: '測試商品1',
      price: 100,
      description: '測試描述1',
      imageUrl: 'test1.jpg'
    }];

    renderWithProviders(<ProductList />, {
      initialState: { products: mockProducts }
    });

    const productCard = screen.getByText('測試商品1');
    fireEvent.click(productCard);

    // 這裡可以添加導航相關的斷言
    // 由於我們使用了 BrowserRouter，實際的導航行為會被模擬
  });
}); 