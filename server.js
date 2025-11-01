require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Op } = require('sequelize');
const routesV1 = require('./src/utils/routes_v1.utils');
const UserSessions = require('./src/modules/user_sessions/user_sessions.mdl');
const { broadcastSessionUpdate } = require('./src/utils/realtime.utils');

const app = express();
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');
app.use('/api/v1/data', routesV1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

const PORT = process.env.PORT || 8080;
let dbSessionCount = 0;

// Base sync once on startup
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

// Middleware for attaching io to requests (used by API handlers)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Root route renders live dashboard
app.get('/', (req, res) => {
  res.render('dashboard', {
    project_name: 'Barangay Santa Monica Services with WebSockets',
    message: 'Socket.IO server is running and ready for connections.',
    version: '1.0.0',
    available_routes: ['/api/v1/data/...'],
  });
});

app.set('io', io);

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

// Event hooks for user_sessions table (realtime updates)
UserSessions.addHook('afterCreate', async () => {
  const count = await UserSessions.count({
    where: { logout_date: null, logout_info: null },
  });
  dbSessionCount = count;
  broadcastSessionUpdate(io, dbSessionCount);
});

UserSessions.addHook('afterUpdate', async () => {
  const count = await UserSessions.count({
    where: { logout_date: null, logout_info: null },
  });
  dbSessionCount = count;
  broadcastSessionUpdate(io, dbSessionCount);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.RAILWAY_ENVIRONMENT_NAME) {
    console.log('Starting internal Socket.IO client for live monitoring...');
    try {
      require('./socket_client');
    } catch (err) {
      console.error('Failed to start internal client:', err.message);
    }
  }
});
