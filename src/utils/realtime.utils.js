const path = require("path");
const fs = require("fs");

module.exports = {
  broadcastSessionUpdate: (io, count) => {
    io.emit("server:heartbeat", {
      timestamp: new Date().toISOString(),
      activeDBSessions: count,
    });
  },

  loadSocketModules: (io) => {
    const rootDir = path.join(__dirname, "../modules");

    function scan(dir) {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) scan(fullPath);

        // Load all *.socket.js files automatically
        else if (item.endsWith(".socket.js")) {
          const socketModule = require(fullPath);
          if (typeof socketModule === "function") {
            console.log(`[SOCKET] Loaded: ${item}`);
            socketModule(io);
          }
        }
      }
    }

    scan(rootDir);
  }
};
