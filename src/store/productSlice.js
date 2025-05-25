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
        state.products[index] = { 
          ...state.products[index], 
          ...updatedData,
          ...(updatedData.status === 'sold' && {
            negotiationPrice: null,
            negotiationStatus: null,
            negotiationBy: null
          })
        };
      }
    },
    submitNegotiation: (state, action) => {
      const { productId, price, userId } = action.payload;
      const index = state.products.findIndex(p => p.id === productId);
      if (index !== -1) {
        state.products[index] = {
          ...state.products[index],
          negotiationPrice: price,
          negotiationStatus: 'pending',
          negotiationBy: userId
        };
      }
    },
    confirmNegotiation: (state, action) => {
      const { productId } = action.payload;
      const index = state.products.findIndex(p => p.id === productId);
      if (index !== -1) {
        const product = state.products[index];
        state.products[index] = {
          ...product,
          status: 'sold',
          soldPrice: product.negotiationPrice,
          soldTo: product.negotiationBy,
          negotiationPrice: null,
          negotiationStatus: null,
          negotiationBy: null
        };
      }
    }
  }
});

export const { 
  setProducts, 
  setLoading, 
  setError, 
  updateProduct,
  submitNegotiation,
  confirmNegotiation
} = productSlice.actions;

export default productSlice.reducer; 