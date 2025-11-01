const { io } = require('socket.io-client');
const cron = require('node-cron');

const port = process.env.PORT || 8080;
const host = `http://localhost:${port}`;
console.log(`Connecting internal client to: ${host}`);

const socket = io(host, {
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 3000,
});

let lastHeartbeat = Date.now();

// Connected
socket.on('connect', () => {
  console.log(`Connected to Socket.IO server as client ID: ${socket.id}`);
});

socket.on('server:heartbeat', (data) => {
  console.log('Socket.io heartbeat from server:', data);
  lastHeartbeat = Date.now();
});

socket.on('server:session_count', (data) => {
  console.log('Active sessions now:', data.activeDBSessions);
});

cron.schedule('*/5 * * * *', () => {
  if (socket.connected) {
    console.log('Running scheduled client ping...');
    socket.emit('client:ping', { message: 'Ping from internal client (cron)' }, (response) => {
      console.log('Server response:', response);
    });
  } else {
    console.warn('Skipping ping: socket not connected');
  }
});

cron.schedule('*/5 * * * *', () => {
  const secondsSinceLast = Math.floor((Date.now() - lastHeartbeat) / 1000);
  if (secondsSinceLast > 180) {
    console.warn('No heartbeat received for over 3 minutes — possible connection issue.');
  }
});
socket.on('disconnect', (reason) => {
  console.log(`Disconnected from server (${reason})`);
});
socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});
