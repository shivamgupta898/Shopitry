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

const createOrderHandler = (req, res) => {
  const {
    userId,
    customerName,
    customerPhone,
    customerEmail,
    items,
    totalAmount,
    total,
    totals,
    shippingAddress,
    paymentMethod
  } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Valid items array required' });
  }
  if (!customerEmail || customerEmail === 'guest@shopitry.io') {
    return res.status(401).json({ error: 'Authentication required to place an order' });
  }

  const resolvedUserId = userId || customerEmail || customerName || 'guest-user';
  const resolvedTotal = Number(totalAmount ?? total ?? totals?.total ?? 0);
  const generatedId = `ORD-${Date.now()}`;

  const order = {
    id: generatedId,
    orderId: generatedId,
    userId: resolvedUserId,
    customerName: customerName || 'Guest Shopper',
    customerPhone: customerPhone || '+919876543210',
    customerEmail: customerEmail || 'guest@shopitry.io',
    items,
    totalAmount: resolvedTotal,
    total: resolvedTotal,
    totals: totals || { total: resolvedTotal },
    shippingAddress: shippingAddress || {},
    paymentMethod: paymentMethod || 'Credit Card',
    paymentStatus: 'AUTHORIZED',
    orderStatus: 'CONFIRMED',
    status: 'CONFIRMED',
    transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
    createdAt: new Date().toISOString(),
  };

  orders.unshift(order);
  res.status(201).json(order);
};

app.post('/', createOrderHandler);
app.post('/checkout', createOrderHandler);

app.put('/:orderId/status', (req, res) => {
  const { orderId } = req.params;
  const { orderStatus, status } = req.body || {};
  const nextStatus = orderStatus || status;
  const order = orders.find(o => o.id === orderId || o.orderId === orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (nextStatus) {
    order.orderStatus = nextStatus;
    order.status = nextStatus;
  }
  res.status(200).json(order);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`order-service listening on port ${PORT}`);
});