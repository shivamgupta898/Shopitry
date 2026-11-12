const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4004;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'payment-service', status: 'up', uptime: process.uptime() });
});

app.post('/charge', (req, res) => {
  const { orderId, amount, method = 'UPI' } = req.body;
  if (!orderId || !amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid orderId and positive amount required' });
  }

  res.status(200).json({
    transactionId: `TXN-${Date.now()}`,
    orderId,
    amount,
    currency: 'INR',
    method,
    status: 'CAPTURED',
    processedAt: new Date().toISOString(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`payment-service listening on port ${PORT}`);
});