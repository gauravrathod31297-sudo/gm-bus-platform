require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const signupRoutes = require('./routes/signup');
const adminRoutes = require('./routes/admin');
const busRoutes = require('./routes/bus');
const routeRoutes = require('./routes/route');
const trackingRoutes = require('./routes/tracking');
const { initSocket } = require('./services/socketService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests'
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bus', busRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/tracking', trackingRoutes);

app.use('/audio', express.static('public/audio'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GM Bus Tracking Backend',
    domain: process.env.DOMAIN,
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'GM Bus Tracking API',
    version: '1.0.0'
  });
});

initSocket(io);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🚀 GM Bus Tracking Backend Started');
  console.log('═══════════════════════════════════════════');
  console.log(`📡 Port:    ${PORT}`);
  console.log(`🌐 Domain:  ${process.env.DOMAIN}`);
  console.log(`🌍 Mode:    ${process.env.NODE_ENV}`);
  console.log('═══════════════════════════════════════════');
});
