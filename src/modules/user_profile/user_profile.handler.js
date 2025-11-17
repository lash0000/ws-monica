const UserProfileService = require('./user_profile.srv');

module.exports = (io) => {
  io.on("connection", (socket) => {
    // Fetch all user profiles
    socket.on("profile:fetch_all", async () => {
      try {
        const profiles = await UserProfileService.getProfile();
        socket.emit("profile:list", {
          success: true,
          message: "Profiles retrieved successfully",
          data: profiles
        });
      } catch (err) {
        socket.emit("profile:error", {
          success: false,
          message: err.message
        });
      }
    });
    // Fetch a single profile by ID
    socket.on("profile:fetch_one", async (id) => {
      try {
        const profile = await UserProfileService.getProfileByID(id);
        socket.emit("profile:one", {
          success: true,
          message: "Profile retrieved successfully",
          data: profile
        });
      } catch (err) {
        socket.emit("profile:error", {
          success: false,
          message: err.message
        });
      }
    });
  });
};
