require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Op } = require('sequelize');
const UserSessions = require('./src/modules/user_sessions/user_sessions.mdl');
const { broadcastSessionUpdate } = require('./src/utils/realtime.utils');

const app = express();
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

const PORT = process.env.PORT || 8080;
let dbSessionCount = 0;

const routesV1 = require('./src/utils/routes_v1.utils')(io);
app.use('/api/v1/data', routesV1);

async function updateDBSessionCount() {
  try {
    const rows = await UserSessions.findAll({
      where: {
        logout_date: { [Op.is]: null },
        logout_info: { [Op.is]: null },
      },
    });
    dbSessionCount = Array.isArray(rows) ? rows.length : 0;
    console.log('Synced user_session count (active only):', dbSessionCount);
    broadcastSessionUpdate(io, dbSessionCount);
  } catch (err) {
    console.error('Failed to query user_sessions table:', err.message);
  }
}
updateDBSessionCount();

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.get('/', (req, res) => {
  res.render('dashboard', {
    project_name: 'Barangay Santa Monica Services with WebSockets',
    message: 'Socket.IO server is running and ready for connections.',
    version: '1.0.0',
  });
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.emit('server:session_count', { activeDBSessions: dbSessionCount });

  socket.on('client:ping', (data, callback) => {
    callback({ pong: true, activeDBSessions: dbSessionCount });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
