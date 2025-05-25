import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Box,
  Chip
} from '@mui/material';
import NegotiationBoard from './NegotiationBoard';

const ProductDetail = () => {
  const { id } = useParams();
  const products = useSelector(state => state.product.products);
  const currentUser = useSelector(state => state.auth.user);
  
  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <Container>
        <Typography variant="h5" sx={{ mt: 4 }}>
          商品不存在
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>
              {product.name}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Chip 
                label={product.status === 'sold' ? '已售出' : '在售'} 
                color={product.status === 'sold' ? 'error' : 'success'}
                sx={{ mr: 1 }}
              />
              <Chip 
                label={`$${product.price}`} 
                color="primary"
              />
            </Box>

            <Typography variant="body1" paragraph>
              {product.description}
            </Typography>

            <Typography variant="subtitle1" color="text.secondary">
              賣家: {product.sellerName}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {product.status !== 'sold' && (
            <NegotiationBoard 
              product={product}
              currentUser={currentUser}
            />
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetail; 