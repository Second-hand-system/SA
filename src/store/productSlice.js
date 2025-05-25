import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  loading: false,
  error: null
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    updateProduct: (state, action) => {
      const { id, ...updatedData } = action.payload;
      const index = state.products.findIndex(p => p.id === id);
      if (index !== -1) {
        state.products[index] = { ...state.products[index], ...updatedData };
      }
    }
  }
});

export const { setProducts, setLoading, setError, updateProduct } = productSlice.actions;
export default productSlice.reducer; 