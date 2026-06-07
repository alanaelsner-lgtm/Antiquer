require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');
const { setupWebSocket } = require('./websocket');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');

const app = express();
app.use(express.json());

// Allow requests from any origin (React, Lovable, etc.)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/rooms', roomRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('Antiquer server is running!');
});

// Create HTTP server and attach WebSocket
const server = createServer(app);
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Antiquer server running on port ${PORT}`);
});
