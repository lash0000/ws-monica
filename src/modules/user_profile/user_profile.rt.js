const express = require("express");
const UserProfileController = require("./user_profile.ctrl");

module.exports = (io) => {
  const router = express.Router();
  const controller = new UserProfileController(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  router.post("/", f_authMiddleware, (req, res) =>
    controller.addProfile(req, res)
  );
  router.get("/", f_authMiddleware, (req, res) =>
    controller.getProfile(req, res)
  );
  router.get("/:id", f_authMiddleware, (req, res) =>
    controller.getProfileByID(req, res)
  );
  router.get('/user/:id', f_authMiddleware, (req, res) =>
    controller.myProfile(req, res)
  );
  router.patch("/me", f_authMiddleware, (req, res) =>
    controller.myUpdateProfile(req, res)
  );
  router.patch("/:id", f_authMiddleware, (req, res) =>
    controller.updateProfile(req, res)
  );

  return router;
};
