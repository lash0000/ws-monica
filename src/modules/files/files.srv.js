const { BlobServiceClient } = require('@azure/storage-blob');
const Busboy = require('@fastify/busboy');
const mime = require('mime-types');
const mdl_Files = require('./files.mdl');

module.exports = (io) => {
  const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING);
  const containerName = process.env.AZURE_BLOB_CONTAINER;
  const containerClient = blobServiceClient.getContainerClient(containerName);

  class FileUploadService {
    async uploadFile(req) {
      return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        let uploadInfo = {};
        let userId = null;

        busboy.on('field', (fieldname, value) => {
          if (fieldname === 'user_id') userId = value;
        });

        busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
          try {
            const originalName = typeof filename === 'string' ? filename : filename?.filename || 'unnamed';
            const blobName = `${Date.now()}-${originalName}`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            let uploadedBytes = 0;
            const chunks = [];

            file.on('data', (chunk) => {
              uploadedBytes += chunk.length;
              chunks.push(chunk);
              io.emit('files:upload_progress', { filename: blobName, uploadedBytes });
            });

            file.on('end', async () => {
              const buffer = Buffer.concat(chunks);

              // Determine extension and MIME type
              const extension = blobName.split('.').pop().toLowerCase();

              // Define preview-safe content types
              const previewMimeTypes = {
                png: 'image/png',
                jpg: 'image/jpeg',
                jpeg: 'image/jpeg',
                gif: 'image/gif',
                mp3: 'audio/mpeg',
                mp4: 'video/mp4',
                mov: 'video/quicktime',
                pdf: 'application/pdf'
              };

              const safeMime =
                previewMimeTypes[extension] ||
                mimetype ||
                mime.lookup(extension) ||
                'application/octet-stream';

              await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: safeMime }
              });

              const blobURL = blockBlobClient.url;

              // Create DB record
              const record = await mdl_Files.create({
                filename: blobName,
                file_type: extension,
                mime_type: safeMime,
                file_url: blobURL,
                size: buffer.length,
                uploaded_by: userId
              });

              uploadInfo = record.toJSON();

              io.emit('files:upload_complete', {
                filename: blobName,
                blobURL,
                uploaded_by: userId
              });
            });
          } catch (err) {
            reject(err);
          }
        });

        busboy.on('finish', () => resolve(uploadInfo));
        req.pipe(busboy);
      });
    }

    async getAllFiles() {
      return await mdl_Files.findAll({ order: [['createdAt', 'DESC']] });
    }


    async uploadBuffer(blobName, mimeType, buffer) {
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      await blockBlobClient.uploadData(buffer, {
        blobHTTPHeaders: { blobContentType: mimeType }
      });

      return { url: blockBlobClient.url };
    }

    async deleteFile(filename) {
      try {
        const blockBlobClient = containerClient.getBlockBlobClient(filename);
        await blockBlobClient.deleteIfExists();
        console.log("Azure Blob deleted:", filename);
      } catch (err) {
        console.error("Azure Blob deletion failed:", err);
      }
    }

  }

  return new FileUploadService();
};
