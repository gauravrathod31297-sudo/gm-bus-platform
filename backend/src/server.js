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
const authOtpRoutes = require('./routes/authOtp');
const passwordResetRoutes = require('./routes/passwordReset');
const usersRoutes = require('./routes/users');
const profileRoutes = require('./routes/profile');
const announcementsRoutes = require('./routes/announcements');
const ttsRoutes = require('./routes/tts');
const smtpRoutes = require('./routes/smtp');
const { initSocket } = require('./services/socketService');

const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }
});

app.use(cors({
  origin: [
    'http://localhost:5173', 'http://localhost:3000',
    'http://localhost:8081', 'http://localhost:8091',
    'http://localhost:5174',
    'http://bustracker.gauravmedia.in', 'https://bustracker.gauravmedia.in',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests',
  skip: (req) => req.method === 'OPTIONS'
});
app.use('/api/', limiter);

app.use('/api/auth-otp', authOtpRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/signup', signupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bus', busRoutes);
const driverRoutes = require('./routes/driver');
app.use('/api/drivers', driverRoutes);
app.use('/api/route', routeRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/smtp', smtpRoutes);
app.use('/api/settings', require('./routes/settings'));
app.use('/api/geocode', require('./routes/geocode'));

app.use('/audio', express.static('public/audio'));
app.use('/apk', express.static('public/apk'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'GM Bus Tracking Backend', domain: process.env.DOMAIN, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => res.json({ name: 'GM Bus Tracking API', version: '1.0.0' }));

initSocket(io);

app.use((req, res) => res.status(404).json({ error: 'Route not found' }));
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
  console.log(`🔓 CORS:    localhost:5173, localhost:3000`);
  console.log('═══════════════════════════════════════════');
});
