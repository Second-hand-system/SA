import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import messageReducer from '../../store/messageSlice';
import MessageForm from '../MessageForm';

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      message: messageReducer
    },
    preloadedState: {
      message: {
        messages: [],
        loading: false,
        error: null,
        ...initialState
      }
    }
  });
};

describe('MessageForm', () => {
  it('renders message form', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <MessageForm productId="1" sellerId="2" />
      </Provider>
    );

    expect(screen.getByPlaceholderText(/輸入訊息/i)).toBeInTheDocument();
    expect(screen.getByText(/發送/i)).toBeInTheDocument();
  });

  it('sends message when form is submitted', async () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <MessageForm productId="1" sellerId="2" />
      </Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/輸入訊息/i), {
      target: { value: 'Test message' }
    });

    fireEvent.click(screen.getByText(/發送/i));

    await waitFor(() => {
      const state = store.getState();
      expect(state.message.messages[0].content).toBe('Test message');
      expect(state.message.messages[0].productId).toBe('1');
      expect(state.message.messages[0].sellerId).toBe('2');
    });
  });

  it('does not send empty message', () => {
    const store = createMockStore();
    render(
      <Provider store={store}>
        <MessageForm productId="1" sellerId="2" />
      </Provider>
    );

    fireEvent.click(screen.getByText(/發送/i));

    const state = store.getState();
    expect(state.message.messages).toHaveLength(0);
  });
}); 