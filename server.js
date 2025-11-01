require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const cron = require('node-cron');
const { Op } = require('sequelize');
const routesV1 = require('./src/utils/routes_v1.utils');
const UserSessions = require('./src/modules/user_sessions/user_sessions.mdl');

const app = express();
app.use(cors());
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views'); // use ./views folder
app.use('/api/v1/data', routesV1);

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] },
});

const PORT = process.env.PORT || 8080;

let dbSessionCount = 0;

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
  } catch (err) {
    console.error('Failed to query user_sessions table:', err.message);
  }
}

updateDBSessionCount();

// Run scheduled refresh every 3 minutes
cron.schedule('*/3 * * * *', async () => {
  console.log('Running scheduled task: refresh user_sessions count');
  await updateDBSessionCount();
  io.emit('server:heartbeat', {
    timestamp: new Date().toISOString(),
    activeDBSessions: dbSessionCount,
  });
});

// Root route — render EJS template
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
