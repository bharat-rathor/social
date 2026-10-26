const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to MongoDB Atlas (with initial seed from server-data.json)
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());

// Real-Time Socket Routing Engine (Messaging + Presence + WebRTC Calls)
require('./sockets/socketHandler')(io);

// Auth Routes (Mount both /api/auth/* and direct /api/register, /api/login)
const { router: authRouter, handleRegister, handleLogin } = require('./routes/authRoutes');
app.use('/api/auth', authRouter);
app.post('/api/register', handleRegister);
app.post('/api/login', handleLogin);

// User & Profile Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
app.post('/api/update-profile', (req, res, next) => {
  req.url = '/update-profile';
  userRoutes(req, res, next);
});
app.post('/api/sync-demo', (req, res, next) => {
  req.url = '/sync-demo';
  userRoutes(req, res, next);
});
app.post('/api/clear-demo', (req, res, next) => {
  req.url = '/clear-demo';
  userRoutes(req, res, next);
});

// Message Routes
const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

// Health Check Root Status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Social Connect Production Backend',
    database: 'MongoDB Atlas',
    cache: 'Redis',
    version: '1.0.0'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 [Social Connect] Backend running on port ${PORT}`);
  console.log(`📡 WebSocket & MongoDB Atlas API routes connected.`);
});

module.exports = { app, server, io };
