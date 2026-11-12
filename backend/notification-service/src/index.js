const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 4005;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const dispatchLog = [];

app.get('/health', (req, res) => {
  res.status(200).json({ service: 'notification-service', status: 'up', uptime: process.uptime() });
});

app.post('/send', (req, res) => {
  const { userId, orderId, channel = 'EMAIL', message } = req.body;
  if (!userId || !message) {
    return res.status(400).json({ error: 'userId and message are required' });
  }

  const record = {
    notificationId: `NTF-${Date.now()}`,
    userId,
    orderId: orderId || null,
    channel,
    message,
    sentAt: new Date().toISOString(),
  };

  dispatchLog.push(record);
  console.log(`[Notification Dispatched] ${channel} -> ${userId}: ${message}`);
  res.status(202).json(record);
});

app.get('/logs', (req, res) => {
  res.json(dispatchLog);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`notification-service listening on port ${PORT}`);
});