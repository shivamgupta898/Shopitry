const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4001;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const products = [
  { id: 'prod-101', name: 'Mechanical Keyboard', category: 'Electronics', price: 4499, stock: 24 },
  { id: 'prod-102', name: 'Ergonomic Desk Chair', category: 'Furniture', price: 12999, stock: 10 },
  { id: 'prod-103', name: 'USB-C Docking Station', category: 'Accessories', price: 3299, stock: 35 },
  { id: 'prod-104', name: '27-inch 4K Monitor', category: 'Electronics', price: 24500, stock: 8 },
];

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'catalog-service', status: 'up', uptime: process.uptime() });
});

app.get('/products', (req, res) => {
  const { category } = req.query;
  if (category) {
    return res.json(products.filter((p) => p.category.toLowerCase() === category.toLowerCase()));
  }
  res.json(products);
});

app.get('/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`catalog-service listening on port ${PORT}`);
});