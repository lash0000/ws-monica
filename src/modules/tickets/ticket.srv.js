const FileUploadServiceFactory = require("../files/files.srv");
const mdl_Tickets = require("./ticket.mdl");
const mdl_Files = require("../files/files.mdl");
const UserCredentials = require("../user_creds/user_creds.mdl");
const { v4: uuidv4 } = require("uuid");
const Busboy = require("@fastify/busboy");
const mime = require("mime-types");
const mdl_UserProfile = require('../user_profile/user_profile.mdl');
const CommentService = require('../comments/comment.srv');
const { Op } = require('sequelize');
const { asyncTaskRunner } = require('../../utils/async_task_runner.utils');
const EmailService = require('../email/email.srv');

module.exports = (io) => {
  const FileUploadService = FileUploadServiceFactory(io);

  class TicketService extends CommentService {
    constructor() {
      super("ticket");
      this.Ticket = mdl_Tickets;
    }

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
            const userProfile = await mdl_UserProfile.findOne({
              where: { user_id: fields.user_id },
              transaction
            });

            if (!userProfile) {
              await transaction.rollback();
              return reject({
                message: "User profile does not exist. Complete profile first."
              });
            }

            const ticket = await mdl_Tickets.create(fields, { transaction });
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

            // Trying to have queue async task runner / background  
            asyncTaskRunner(() =>
              EmailService.sendToUser({
                user_id: fields.user_id,
                template: "tickets",
                subject: "You have a new ticket created.",
                data: {
                  ticket,
                  profile: userProfile
                }
              })
            );

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
          {
            model: UserCredentials,
            include: [
              { model: mdl_UserProfile }
            ]
          },
        ]
      });
    }

    async getTicketById(id) {
      return mdl_Tickets.findByPk(id, {
        include: [
          { model: mdl_Files },
          {
            model: UserCredentials,
            include: [
              { model: mdl_UserProfile }
            ]
          }
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
            const userProfile = await mdl_UserProfile.findOne({
              where: { user_id: fields.user_id },
              t
            });

            if (!userProfile) {
              await t.rollback();
              return reject({
                message: "User profile does not exist. Complete profile first."
              });
            }

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

            // Trying to have queue async task runner / background  
            asyncTaskRunner(() =>
              EmailService.sendToUser({
                user_id: fields.user_id,
                template: "ticket_updates",
                subject: "We have a latest update from your ticket.",
                data: {
                  ticket,
                  profile: userProfile
                }
              })
            );

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

    async MyTickets(user_id) {
      try {
        if (!user_id) {
          throw new Error("Missing user_id");
        }

        const tickets = await mdl_Tickets.findAll({
          where: { user_id },
          order: [["createdAt", "DESC"]],
          include: [
            { model: mdl_Files },
            {
              model: UserCredentials,
              include: [
                { model: mdl_UserProfile }
              ]
            },
          ]
        });

        return tickets;

      } catch (err) {
        throw err;
      }
    }

    async deleteTicket(req) {
      return new Promise(async (resolve, reject) => {
        const ticketId = req.params.id;
        const t = await mdl_Tickets.sequelize.transaction();

        try {
          const ticket = await mdl_Tickets.findByPk(ticketId, {
            include: [{ model: mdl_Files }],
            transaction: t
          });

          if (!ticket) {
            await t.rollback();
            return reject({ message: "Ticket not found" });
          }

          // 2. Delete files from storage (Straight forward coz it has DELETE CASCADE from model)
          for (const file of ticket.Files) {
            try {
              await FileUploadService.deleteFile(file.filename);
            } catch (err) {
              console.error("File deletion error (ignored):", err);
            }
          }

          await mdl_Files.destroy({
            where: { ticket_id: ticketId },
            transaction: t
          });

          await ticket.destroy({ transaction: t });
          await t.commit();

          io.emit("tickets:delete", { ticket_id: ticketId });

          resolve({
            message: "Ticket deleted successfully",
            ticket_id: ticketId
          });

        } catch (err) {
          await t.rollback();
          reject(err);
        }
      });
    }

    async countBlotterTicket(params) {
      try {
        const count = await this.Ticket.count({
          where: {
            category: {
              [Op.or]: ["Complaint", "Incident-Report"]
            }
          }
        });

        return count;
      } catch (error) {
        console.error("Error counting tickets:", error);
        throw error;
      }
    }

    async MyCountBlotter(user_id) {
      try {
        if (!user_id) {
          throw new Error("Missing user_id");
        }

        const count = await this.Ticket.count({
          where: {
            user_id,
            category: {
              [Op.or]: ["Complaint", "Incident-Report"]
            }
          }
        });

        return count;

      } catch (error) {
        console.error("Error counting blotter tickets:", error);
        throw error;
      }
    }

    async MyCountTickets(user_id) {
      try {
        if (!user_id) {
          throw new Error("Missing user_id");
        }

        const [resolved, archived, pending] = await Promise.all([
          this.Ticket.count({ where: { user_id, status: "resolved" } }),
          this.Ticket.count({ where: { user_id, status: "archived" } }),
          this.Ticket.count({ where: { user_id, status: "pending" } })
        ]);

        return {
          resolved,
          archived,
          pending
        };
      } catch (err) {
        throw err;
      }
    }

    async MyCountBlotterByStatus(user_id) {
      try {
        if (!user_id) {
          throw new Error("Missing user_id");
        }

        const whereBase = {
          user_id,
          category: {
            [Op.in]: ["Complaints", "Incident-Report"]
          }
        };

        const [resolved, unresolved, archived, pending] = await Promise.all([
          this.Ticket.count({
            where: {
              ...whereBase,
              status: "resolved"
            }
          }),
          this.Ticket.count({
            where: {
              ...whereBase,
              status: "unresolved"
            }
          }),
          this.Ticket.count({
            where: {
              ...whereBase,
              status: "archived"
            }
          }),
          this.Ticket.count({
            where: {
              ...whereBase,
              status: "pending"
            }
          })
        ]);

        return {
          resolved,
          unresolved,
          archived,
          pending
        };
      } catch (error) {
        console.error("Error counting blotter tickets by status:", error);
        throw error;
      }
    }

    async TicketCategoryCount() {
      try {
        const categories = [
          "Healthcare",
          "Infrastructure",
          "Social-Services",
          "Community",
          "Administrative",
          "Other"
        ];

        const response = {};
        for (const cat of categories) {
          const count = await this.Ticket.count({
            where: { category: cat }
          });
          response[cat] = count;
        }

        return response;

      } catch (error) {
        console.error("Error counting ticket categories:", error);
        throw error;
      }
    }

  }

  return new TicketService();
};
