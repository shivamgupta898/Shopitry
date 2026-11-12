const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

const services = {
  catalog: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4001',
  cart: process.env.CART_SERVICE_URL || 'http://cart-service:4002',
  orders: process.env.ORDER_SERVICE_URL || 'http://order-service:4003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4004',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005',
};

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'up',
    uptime: process.uptime(),
  });
});

Object.entries(services).forEach(([route, target]) => {
  app.use(
    `/api/${route}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^/api/${route}`]: '' },
      onError: (err, req, res) => {
        console.error(`[Proxy Error] ${route}:`, err.message);
        if (!res.headersSent) {
          res.status(502).json({ error: `${route} service unavailable` });
        }
      },
    })
  );
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`api-gateway listening on port ${PORT}`);
});