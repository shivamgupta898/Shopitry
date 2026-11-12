const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4002;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const carts = new Map();

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'cart-service', status: 'up', uptime: process.uptime() });
});

app.get('/:userId', (req, res) => {
  res.json({ userId: req.params.userId, items: carts.get(req.params.userId) || [] });
});

app.post('/:userId/items', (req, res) => {
  const { productId, name, price, quantity = 1 } = req.body;
  if (!productId || !price) {
    return res.status(400).json({ error: 'productId and price are required' });
  }

  const existing = carts.get(req.params.userId) || [];
  const itemIndex = existing.findIndex((i) => i.productId === productId);

  if (itemIndex > -1) {
    existing[itemIndex].quantity += quantity;
  } else {
    existing.push({ productId, name, price, quantity });
  }

  carts.set(req.params.userId, existing);
  res.status(201).json({ userId: req.params.userId, items: existing });
});

app.delete('/:userId', (req, res) => {
  carts.delete(req.params.userId);
  res.status(204).send();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`cart-service listening on port ${PORT}`);
});