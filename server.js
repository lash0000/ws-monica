require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { Op } = require('sequelize');
const UserSessions = require('./src/modules/user_sessions/user_sessions.mdl');
const mdl_Files = require('./src/modules/files/files.mdl');
const { broadcastSessionUpdate } = require('./src/utils/realtime.utils');
const { BlobServiceClient } = require('@azure/storage-blob');
const { loadSocketModules } = require('./src/utils/realtime.utils');

const app = express();
const unifiedCors = {
  origin: [
    "https://barangay-santa-monica.vercel.app",
    "https://www.santa-monica.space",
    "https://santa-monica.space",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
};

app.use(cors(unifiedCors));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', './views');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://barangay-santa-monica.vercel.app",
      "https://www.santa-monica.space",
      "https://santa-monica.space",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    credentials: true
  },
  transports: ["polling", "websocket"],
  allowEIO3: true
});
loadSocketModules(io);

const PORT = process.env.PORT || 8080;
let dbSessionCount = 0;

const routesV1 = require('./src/utils/routes_v1.utils')(io);
app.use('/api/v1/data', routesV1);

async function updateDBSessionCount() {
  try {
    const rows = await UserSessions.findAll({
      where: {
        logout_date: { [Op.is]: null },
        logout_info: { [Op.is]: null }
      }
    });
    dbSessionCount = Array.isArray(rows) ? rows.length : 0;

    const fileCount = await mdl_Files.count();
    console.log(`Synced user_session count: ${dbSessionCount}, file count: ${fileCount}`);

    io.emit('server:heartbeat', {
      timestamp: new Date().toISOString(),
      activeDBSessions: dbSessionCount,
      totalFiles: fileCount
    });

    broadcastSessionUpdate(io, dbSessionCount);
  } catch (err) {
    console.error('Failed to query tables:', err.message);
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
    version: '1.0.0'
  });
});

io.on('connection', async (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  try {
    const activeSessions = await UserSessions.count({
      where: { logout_date: null, logout_info: null }
    });

    const fileCount = await mdl_Files.count();

    socket.emit('server:heartbeat', {
      timestamp: new Date().toISOString(),
      activeDBSessions: activeSessions,
      totalFiles: fileCount
    });
  } catch (err) {
    console.error('Error sending initial heartbeat:', err.message);
  }

  socket.on('client:ping', (data, callback) => {
    callback({ pong: true });
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

async function verifyAzureBlobConnection() {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );

    const containerName = process.env.AZURE_BLOB_CONTAINER || 'uploads';
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const exists = await containerClient.exists();

    if (exists) {
      console.log(`Azure Blob Storage connected (container: ${containerName})`);
    } else {
      console.warn(`Container "${containerName}" does not exist — attempting to create...`);
      await containerClient.create();
      console.log(`Azure Blob Storage container "${containerName}" created successfully.`);
    }
  } catch (err) {
    console.error('Azure Blob Storage connection failed:', err.message);
  }
}
verifyAzureBlobConnection();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
