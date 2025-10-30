const { io } = require('socket.io-client');

const socket = io('http://localhost:3000', {
  transports: ['websocket']
});

socket.on('connect', () => {
  console.log('✅  Connected to Socket.IO server with id:', socket.id);
});

// Listen for new login sessions detected by backend poller
socket.on('session:new', (data) => {
  console.log('🆕  New session detected:', data.sessionId);

  // Auto-verify this session immediately
  socket.emit('user_creds:verify', { sessionId: data.sessionId }, (response) => {
    console.log('Response from server:', response);
  });
});

socket.on('disconnect', () => console.log('👋  Disconnected from server'));
