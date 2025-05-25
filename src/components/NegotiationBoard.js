import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateProduct } from '../store/productSlice';
import { Button, TextField, Box, Typography, Paper } from '@mui/material';

const NegotiationBoard = ({ product, currentUser }) => {
  const [negotiationPrice, setNegotiationPrice] = useState('');
  const dispatch = useDispatch();

  const handleNegotiationSubmit = async () => {
    if (!negotiationPrice || isNaN(negotiationPrice)) {
      alert('請輸入有效的價格');
      return;
    }

    const updatedProduct = {
      ...product,
      negotiationPrice: parseFloat(negotiationPrice),
      negotiationStatus: 'pending',
      negotiationBy: currentUser.uid
    };

    try {
      await dispatch(updateProduct(updatedProduct)).unwrap();
      setNegotiationPrice('');
    } catch (error) {
      console.error('議價失敗:', error);
      alert('議價失敗，請稍後再試');
    }
  };

  const handleConfirmNegotiation = async () => {
    if (!product.negotiationPrice) return;

    const updatedProduct = {
      ...product,
      status: 'sold',
      soldPrice: product.negotiationPrice,
      soldTo: product.negotiationBy
    };

    try {
      await dispatch(updateProduct(updatedProduct)).unwrap();
    } catch (error) {
      console.error('確認議價失敗:', error);
      alert('確認議價失敗，請稍後再試');
    }
  };

  const isSeller = currentUser && product.sellerId === currentUser.uid;
  const isNegotiating = product.negotiationStatus === 'pending';

  return (
    <Paper elevation={3} sx={{ p: 2, mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        議價板
      </Typography>
      
      {isNegotiating ? (
        <Box>
          <Typography variant="body1" gutterBottom>
            當前議價金額: ${product.negotiationPrice}
          </Typography>
          {isSeller && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirmNegotiation}
              sx={{ mt: 1 }}
            >
              確認議價
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <TextField
            label="議價金額"
            type="number"
            value={negotiationPrice}
            onChange={(e) => setNegotiationPrice(e.target.value)}
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleNegotiationSubmit}
            disabled={!negotiationPrice}
          >
            提交議價
          </Button>
        </Box>
      )}
    </Paper>
  );
};

export default NegotiationBoard; 