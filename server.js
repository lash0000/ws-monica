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

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Socket.IO Server is running and ready!',
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

const PORT = process.env.PORT || 3000;

app.set('io', io);
io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);
  require('./src/modules/user_creds/user_creds.handler')(io, socket);

  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
