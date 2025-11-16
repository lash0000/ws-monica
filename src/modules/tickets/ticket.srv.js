const FileUploadServiceFactory = require("../files/files.srv");
const mdl_Tickets = require("./ticket.mdl");
const mdl_Files = require("../files/files.mdl");
const UserCredentials = require("../user_creds/user_creds.mdl");
const { v4: uuidv4 } = require("uuid");
const Busboy = require("busboy");
const mime = require("mime-types");

module.exports = (io) => {
  const FileUploadService = FileUploadServiceFactory(io);

  class TicketService {
    async createTicket(req) {
      return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });

        const fields = {};
        const uploadedFileIds = [];
        const ticket_id = uuidv4();
        fields.id = ticket_id;

        // Collect all ticket fields from multipart
        busboy.on("field", (key, value) => {
          fields[key] = value;
        });

        // Handle file uploads
        busboy.on("file", async (fieldname, file, filename, encoding, mimetype) => {
          if (!filename) return;

          const original = typeof filename === "string" ? filename : filename?.filename;
          const blobName = `${Date.now()}-${original}`;
          const chunks = [];

          file.on("data", (chunk) => chunks.push(chunk));

          file.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const ext = blobName.split(".").pop().toLowerCase();
            const safeMime = mime.lookup(ext) || mimetype || "application/octet-stream";

            // Upload to Azure Blob
            const uploaded = await FileUploadService.uploadBuffer(blobName, safeMime, buffer);

            // Insert file row with ticket_id ALREADY known
            const saved = await mdl_Files.create({
              filename: blobName,
              file_type: ext,
              mime_type: safeMime,
              file_url: uploaded.url,
              size: buffer.length,
              uploaded_by: fields.user_id,
              ticket_id: ticket_id
            });

            uploadedFileIds.push(saved.id);
          });
        });

        // When all fields/files have been processed
        busboy.on("finish", async () => {
          try {
            // Create ticket WITH the pre-generated ID
            const ticket = await mdl_Tickets.create(fields);

            io.emit("tickets:new", ticket);

            resolve({
              ticket,
              attachments: uploadedFileIds
            });
          } catch (err) {
            reject(err);
          }
        });

        req.pipe(busboy);
      });
    }

    async getAllTickets() {
      return mdl_Tickets.findAll({
        order: [["createdAt", "DESC"]],
        include: [
          { model: mdl_Files },
          { model: UserCredentials }
        ]
      });
    }

    async getTicketById(id) {
      return mdl_Tickets.findByPk(id, {
        include: [
          { model: mdl_Files },
          { model: UserCredentials }
        ]
      });
    }

    async updateTicket(req) {
      return new Promise((resolve, reject) => {
        const ticketId = req.params.id;
        const busboy = Busboy({ headers: req.headers });

        const fields = {};
        const newFileIds = [];

        // Collect field updates
        busboy.on("field", (key, value) => {
          fields[key] = value;
        });

        // Handle optional new file uploads
        busboy.on("file", async (fieldname, file, filename, encoding, mimetype) => {
          if (!filename) return;

          const original = typeof filename === "string" ? filename : filename?.filename;
          const blobName = `${Date.now()}-${original}`;
          const chunks = [];

          file.on("data", (chunk) => chunks.push(chunk));

          file.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const ext = blobName.split(".").pop().toLowerCase();
            const safeMime = mime.lookup(ext) || mimetype || "application/octet-stream";

            // Upload blob
            const uploaded = await FileUploadService.uploadBuffer(blobName, safeMime, buffer);

            // Save as NEW attachment
            const savedFile = await mdl_Files.create({
              filename: blobName,
              file_type: ext,
              mime_type: safeMime,
              file_url: uploaded.url,
              size: buffer.length,
              ticket_id: ticketId,
              uploaded_by: fields.user_id
            });

            newFileIds.push(savedFile.id);
          });
        });

        busboy.on("finish", async () => {
          try {
            // Look up ticket
            const ticket = await mdl_Tickets.findByPk(ticketId);
            if (!ticket) throw new Error("Ticket not found");

            // Update fields (only provided keys)
            await ticket.update(fields);

            // Emit event for UI updating
            io.emit("tickets:update", {
              ticket_id: ticketId,
              updates: fields,
              new_attachments: newFileIds
            });

            resolve({
              ticket,
              new_attachments: newFileIds
            });
          } catch (err) {
            reject(err);
          }
        });

        req.pipe(busboy);
      });
    }

  }

  return new TicketService();
};
