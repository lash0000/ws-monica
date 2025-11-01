require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const routesV1 = require('./src/utils/routes_v1.utils');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/v1/data', routesV1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

const PORT = process.env.PORT || 3000;
let activeSession = 0;

const broadcastSessionCount = () => io.emit('server:session_count', { activeSession });
app.get('/', (req, res) => {
  res.status(200).json({
    project_name: 'Barangay Santa Monica Services with WebSockets',
    message: 'Socket.IO server is running and ready for connections.',
    version: '1.0.0',
    available_routes: ['/api/v1/data/...'],
    user_sessions_length: activeSession,
  });
});

app.set('io', io);

io.on('connection', (socket) => {
  activeSession++;
  console.log(`✅ Socket connected: ${socket.id} | Active: ${activeSession}`);
  broadcastSessionCount();

  try {
    require('./src/modules/user_creds/user_creds.handler')(io, socket);
  } catch (err) {
    console.error('Error loading user_creds.handler:', err.message);
  }

  socket.on('disconnect', (reason) => {
    activeSession = Math.max(0, activeSession - 1);
    console.log(`❌ Socket disconnected: ${socket.id} (${reason}) | Active: ${activeSession}`);
    broadcastSessionCount();
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
