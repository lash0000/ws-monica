module.exports = (io) => {
  const FileUploadService = require('./files.srv')(io);

  class FileUploadController {
    async upload(req, res) {
      try {
        const result = await FileUploadService.uploadFile(req);
        res.status(200).json({
          message: 'File uploaded successfully',
          file: result
        });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
          message: 'File upload failed',
          error: error.message
        });
      }
    }

    async list(req, res) {
      try {
        const files = await FileUploadService.getAllFiles();
        res.status(200).json(files);
      } catch (error) {
        console.error('Fetch files error:', error);
        res.status(500).json({
          message: 'Failed to retrieve files',
          error: error.message
        });
      }
    }
  }

  return new FileUploadController();
};
