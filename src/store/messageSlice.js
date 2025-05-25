import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  messages: [],
  loading: false,
  error: null
};

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
      state.loading = false;
      state.error = null;
    },
    sendMessage: (state, action) => {
      state.messages.push({
        id: Date.now().toString(),
        ...action.payload
      });
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    }
  }
});

export const { setMessages, sendMessage, setLoading, setError } = messageSlice.actions;
export default messageSlice.reducer; 