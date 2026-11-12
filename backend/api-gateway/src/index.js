const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const crypto = require('crypto');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

const users = [
  { id: 'usr-admin', name: 'Platform Admin', phone: '+919876543210', email: 'admin@shopitry.com', password: 'adminpassword123', role: 'admin' },
  { id: 'usr-elena', name: 'Elena Rostova', phone: '+919823012345', email: 'elena@example.com', password: 'customerpassword123', role: 'customer' }
];
const sessions = new Map();

app.get('/health', (req, res) => {
  res.status(200).json({
    service: 'api-gateway',
    status: 'up',
    uptime: process.uptime(),
  });
});

app.post('/api/auth/register', express.json(), (req, res) => {
  const { name, phone, email, password } = req.body || {};
  if (!name || !phone || !email || !password) {
    return res.status(400).json({ error: 'Name, +91 contact number, email, and password are required.' });
  }
  const cleanDigits = String(phone).replace(/\D/g, '').slice(-10);
  if (cleanDigits.length !== 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }
  const formattedPhone = `+91${cleanDigits}`;
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some(u => u.email === normalizedEmail)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const newUser = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    phone: formattedPhone,
    email: normalizedEmail,
    password,
    role: 'customer'
  };
  users.push(newUser);
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, newUser.id);

  res.status(201).json({
    token,
    user: { id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email, role: newUser.role }
  });
});

app.post('/api/auth/login', express.json(), (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const found = users.find(u => u.email === normalizedEmail && u.password === password);
  if (!found) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, found.id);

  res.status(200).json({
    token,
    user: { id: found.id, name: found.name, phone: found.phone, email: found.email, role: found.role }
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const userId = sessions.get(token);
  const found = users.find(u => u.id === userId);
  if (!found) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
  res.status(200).json({
    user: { id: found.id, name: found.name, phone: found.phone, email: found.email, role: found.role }
  });
});

const services = {
  catalog: process.env.CATALOG_SERVICE_URL || 'http://catalog-service:4001',
  cart: process.env.CART_SERVICE_URL || 'http://cart-service:4002',
  orders: process.env.ORDER_SERVICE_URL || 'http://order-service:4003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:4004',
  notifications: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:4005',
};

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