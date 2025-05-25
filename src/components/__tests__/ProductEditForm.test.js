import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import productReducer from '../../store/productSlice';
import ProductEditForm from '../ProductEditForm';

const mockProduct = {
  id: '1',
  name: 'Test Product',
  price: 100,
  description: 'Test Description',
  imageUrl: 'test.jpg'
};

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      product: productReducer
    },
    preloadedState: {
      product: {
        products: [mockProduct],
        loading: false,
        error: null,
        ...initialState
      }
    }
  });
};

describe('ProductEditForm', () => {
  it('renders form with product details', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProductEditForm productId="1" />
      </Provider>
    );

    expect(screen.getByLabelText(/商品名稱/i)).toHaveValue('Test Product');
    expect(screen.getByLabelText(/價格/i)).toHaveValue(100);
    expect(screen.getByLabelText(/描述/i)).toHaveValue('Test Description');
    expect(screen.getByLabelText(/圖片網址/i)).toHaveValue('test.jpg');
  });

  it('updates product when form is submitted', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <ProductEditForm productId="1" />
      </Provider>
    );

    fireEvent.change(screen.getByLabelText(/商品名稱/i), {
      target: { value: 'Updated Product' }
    });

    fireEvent.click(screen.getByText(/更新商品/i));

    await waitFor(() => {
      const state = store.getState();
      expect(state.product.products[0].name).toBe('Updated Product');
    });
  });
}); 