const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const orders = [];

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'order-service', status: 'up', uptime: process.uptime() });
});

app.get('/', (req, res) => {
  res.json(orders);
});

app.post('/', (req, res) => {
  const { userId, items, totalAmount } = req.body;
  if (!userId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Valid userId and items array required' });
  }

  const order = {
    orderId: `ORD-${Date.now()}`,
    userId,
    items,
    totalAmount,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
  };

  orders.push(order);
  res.status(201).json(order);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`order-service listening on port ${PORT}`);
});