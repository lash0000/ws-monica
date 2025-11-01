const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`Connected to Socket.IO server as client ID: ${socket.id}`);
});

socket.on('server:heartbeat', (data) => {
  console.log(`💓 Heartbeat from server:`, data);
});
socket.on('server:session_count', (data) => {
  console.log(`👥 Active sessions now: ${data.activeSession}`);
});
setInterval(() => {
  socket.emit('client:ping', { message: 'Ping from test client' }, (response) => {
    console.log('↩️ Pong response:', response);
  });
}, 5000);
socket.on('disconnect', (reason) => {
  console.log(`❌ Disconnected from server (${reason})`);
});
