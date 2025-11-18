// TODO: Adddata and updateData with EmailService

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
        const uploadedFiles = [];

        const ticket_id = uuidv4();
        fields.id = ticket_id;

        busboy.on("field", (key, value) => {
          fields[key] = value;
        });

        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
          if (!filename) return;

          const original = typeof filename === "string" ? filename : filename?.filename;
          const blobName = `${Date.now()}-${original}`;
          const chunks = [];

          file.on("data", (chunk) => chunks.push(chunk));

          file.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const ext = blobName.split(".").pop().toLowerCase();
            const safeMime = mime.lookup(ext) || mimetype || "application/octet-stream";

            const uploaded = await FileUploadService.uploadBuffer(blobName, safeMime, buffer);

            uploadedFiles.push({
              filename: blobName,
              file_type: ext,
              mime_type: safeMime,
              file_url: uploaded.url,
              size: buffer.length
            });
          });
        });

        busboy.on("finish", async () => {
          const transaction = await mdl_Tickets.sequelize.transaction();

          try {
            // Insert ticket
            const ticket = await mdl_Tickets.create(fields, { transaction });

            // Insert file rows
            for (const fileItem of uploadedFiles) {
              await mdl_Files.create(
                {
                  ...fileItem,
                  uploaded_by: fields.user_id,
                  ticket_id
                },
                { transaction }
              );
            }

            await transaction.commit();

            io.emit("tickets:new", ticket);

            resolve({
              ticket,
              attachments: uploadedFiles.map((f) => f.filename)
            });

          } catch (err) {
            await transaction.rollback();
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
        const newFiles = [];

        busboy.on("field", (key, value) => {
          fields[key] = value;
        });

        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
          if (!filename) return;

          const original = typeof filename === "string" ? filename : filename?.filename;
          const blobName = `${Date.now()}-${original}`;
          const chunks = [];

          file.on("data", (chunk) => chunks.push(chunk));

          file.on("end", async () => {
            const buffer = Buffer.concat(chunks);
            const ext = blobName.split(".").pop().toLowerCase();
            const safeMime = mime.lookup(ext) || "application/octet-stream";

            const uploaded = await FileUploadService.uploadBuffer(blobName, safeMime, buffer);

            newFiles.push({
              filename: blobName,
              file_type: ext,
              mime_type: safeMime,
              file_url: uploaded.url,
              size: buffer.length
            });
          });
        });

        busboy.on("finish", async () => {
          const t = await mdl_Tickets.sequelize.transaction();

          try {
            const ticket = await mdl_Tickets.findByPk(ticketId, { transaction: t });

            if (!ticket) throw new Error("Ticket not found");

            await ticket.update(fields, { transaction: t });

            for (const fileItem of newFiles) {
              await mdl_Files.create(
                {
                  ...fileItem,
                  uploaded_by: fields.user_id,
                  ticket_id: ticketId
                },
                { transaction: t }
              );
            }

            await t.commit();

            io.emit("tickets:update", {
              ticket_id: ticketId,
              updates: fields,
              new_attachments: newFiles.map((f) => f.filename)
            });

            resolve({
              ticket,
              new_attachments: newFiles
            });

          } catch (err) {
            await t.rollback();
            reject(err);
          }
        });

        req.pipe(busboy);
      });
    }

  }

  return new TicketService();
};
