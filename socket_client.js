const { io } = require('socket.io-client');
const port = process.env.PORT || 8080;
const host = `http://localhost:${port}`;

console.log(`🔗 Connecting internal client to: ${host}`);

const socket = io(host, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`✅ Connected to Socket.IO server as client ID: ${socket.id}`);
});

socket.on('server:session_count', (data) => {
  console.log(`👥 Active sessions now: ${data.activeSession}`);
});

socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected from server (${reason})`);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection error:', err.message);
});
