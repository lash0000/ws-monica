const express = require('express');

module.exports = (io) => {
  const router = express.Router();
  const FileUploadController = require('./files.ctrl')(io);
  const f_authMiddleware = require('../../middlewares/auth.mw');

  // POST /api/v1/data/files/upload
  router.post('/upload', f_authMiddleware, (req, res) =>
    FileUploadController.upload(req, res)
  );

  // GET /api/v1/data/files
  router.get('/', f_authMiddleware, (req, res) =>
    FileUploadController.list(req, res)
  );

  return router;
};
